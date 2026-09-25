import { dbService, DbAnomaly } from './dbService.js';
import { logger } from '../utils/logger.js';
import { AdvisorySettings } from '../../../shared/validations.js';

export class RuleEngineService {
  /**
   * Run cross-document validation for all documents associated with a shipment.
   */
  static async validateShipment(shipmentId: string, orgId: string): Promise<DbAnomaly[]> {
    logger.info(`Running Cross-Document Validation Engine for shipment: ${shipmentId}`);

    // Fetch organization advisory settings
    const settings: AdvisorySettings = await dbService.getSettings(orgId);

    // Clear prior anomalies for this shipment to re-evaluate cleanly
    await dbService.clearAnomaliesForShipment(shipmentId);

    // Fetch documents and extracted data
    const docDataList = await dbService.getExtractedDataByShipment(shipmentId);
    const newAnomalies: DbAnomaly[] = [];

    if (docDataList.length === 0) {
      logger.info('No documents found for shipment, skipping validation.');
      return [];
    }

    // Separate by document type
    let invoiceData: any = null;
    let bolData: any = null;
    let packingListData: any = null;
    const allData: { docType: string; data: any; confidence: number }[] = [];

    for (const item of docDataList) {
      if (!item.data || !item.data.raw_json) continue;
      const type = item.document.document_type;
      const payload = item.data.raw_json;
      const conf = item.data.confidence_score;

      allData.push({ docType: type, data: payload, confidence: conf });

      if (type === 'commercial_invoice') invoiceData = payload;
      if (type === 'bill_of_lading') bolData = payload;
      if (type === 'packing_list') packingListData = payload;

      // Rule: Low Extraction Confidence
      if (conf < settings.confidenceThreshold) {
        const anomaly = await dbService.createAnomaly({
          shipment_id: shipmentId,
          rule_type: 'low_confidence_extraction',
          severity: 'warning',
          description: `Document (${item.document.original_filename || type}) extracted with confidence ${(conf * 100).toFixed(1)}%, which is below the required threshold of ${(settings.confidenceThreshold * 100).toFixed(1)}%. Manual human verification recommended.`
        });
        newAnomalies.push(anomaly);
      }
    }

    // ========================================================
    // Rule 1: Weight Tolerance Mismatch (Invoice vs BoL vs PL)
    // ========================================================
    const weights: { source: string; weight: number }[] = [];

    if (invoiceData && typeof invoiceData.totalWeightKg === 'number' && invoiceData.totalWeightKg > 0) {
      weights.push({ source: 'Commercial Invoice', weight: invoiceData.totalWeightKg });
    }
    if (bolData && typeof bolData.totalWeightKg === 'number' && bolData.totalWeightKg > 0) {
      weights.push({ source: 'Bill of Lading', weight: bolData.totalWeightKg });
    }
    if (packingListData && typeof packingListData.totalGrossWeightKg === 'number' && packingListData.totalGrossWeightKg > 0) {
      weights.push({ source: 'Packing List', weight: packingListData.totalGrossWeightKg });
    }

    for (let i = 0; i < weights.length; i++) {
      for (let j = i + 1; j < weights.length; j++) {
        const w1 = weights[i];
        const w2 = weights[j];
        const maxW = Math.max(w1.weight, w2.weight);
        const minW = Math.min(w1.weight, w2.weight);
        const diffPercent = ((maxW - minW) / minW) * 100;

        if (diffPercent > settings.weightTolerancePercent) {
          // If discrepancy > 5%, severity is critical; otherwise warning
          const severity: 'warning' | 'critical' = diffPercent > 5.0 ? 'critical' : 'warning';
          const anomaly = await dbService.createAnomaly({
            shipment_id: shipmentId,
            rule_type: 'weight_mismatch',
            severity,
            description: `Weight discrepancy detected: ${w1.source} declares ${w1.weight.toLocaleString('en-US', { minimumFractionDigits: 2 })} kg while ${w2.source} declares ${w2.weight.toLocaleString('en-US', { minimumFractionDigits: 2 })} kg (${diffPercent.toFixed(2)}% difference exceeds allowable ±${settings.weightTolerancePercent.toFixed(1)}% tolerance). High risk of demurrage fines and customs hold.`
          });
          newAnomalies.push(anomaly);
        }
      }
    }

    // ========================================================
    // Rule 2: Missing HS Codes
    // ========================================================
    if (invoiceData) {
      const hsCodes = invoiceData.hsCodes || [];
      const lineItems = invoiceData.lineItems || [];

      let hasMissingHsCode = false;
      let missingDetails = '';

      if (!Array.isArray(hsCodes) || hsCodes.length === 0) {
        hasMissingHsCode = true;
        missingDetails = 'No Harmonized Tariff (HS) codes detected in Commercial Invoice.';
      } else {
        // Check line items if present
        for (const item of lineItems) {
          if (!item.hsCode || item.hsCode.trim().length < 6) {
            hasMissingHsCode = true;
            missingDetails = `Line item "${item.description || 'Unnamed item'}" is missing a valid 6-10 digit HS code.`;
            break;
          }
        }
      }

      if (hasMissingHsCode) {
        const anomaly = await dbService.createAnomaly({
          shipment_id: shipmentId,
          rule_type: 'missing_hs_code',
          severity: settings.missingHsCodeStrictness,
          description: `${missingDetails} Required for automated customs clearance and duty calculation.`
        });
        newAnomalies.push(anomaly);
      }
    }

    // ========================================================
    // Rule 3: Shipper / Consignee Entity Cross-Check
    // ========================================================
    if (settings.autoFlagShipperMismatch && invoiceData && bolData) {
      const invShipper = (invoiceData.shipperName || '').trim().toLowerCase();
      const bolShipper = (bolData.shipperName || '').trim().toLowerCase();

      if (invShipper && bolShipper && !RuleEngineService.fuzzyMatch(invShipper, bolShipper)) {
        const anomaly = await dbService.createAnomaly({
          shipment_id: shipmentId,
          rule_type: 'shipper_mismatch',
          severity: 'warning',
          description: `Shipper name mismatch: Commercial Invoice lists "${invoiceData.shipperName}" whereas Bill of Lading lists "${bolData.shipperName}". Please ensure consignor identity is unified.`
        });
        newAnomalies.push(anomaly);
      }

      const invConsignee = (invoiceData.consigneeName || '').trim().toLowerCase();
      const bolConsignee = (bolData.consigneeName || '').trim().toLowerCase();

      if (invConsignee && bolConsignee && !RuleEngineService.fuzzyMatch(invConsignee, bolConsignee)) {
        const anomaly = await dbService.createAnomaly({
          shipment_id: shipmentId,
          rule_type: 'consignee_mismatch',
          severity: 'warning',
          description: `Consignee name mismatch: Commercial Invoice lists "${invoiceData.consigneeName}" whereas Bill of Lading lists "${bolData.consigneeName}".`
        });
        newAnomalies.push(anomaly);
      }
    }

    // ========================================================
    // Rule 4: Port of Loading / Discharge Consistency
    // ========================================================
    if (settings.autoFlagPortMismatch && invoiceData && bolData) {
      const invPol = (invoiceData.portOfLoading || '').trim().toLowerCase();
      const bolPol = (bolData.portOfLoading || '').trim().toLowerCase();

      if (invPol && bolPol && !RuleEngineService.fuzzyMatch(invPol, bolPol)) {
        const anomaly = await dbService.createAnomaly({
          shipment_id: shipmentId,
          rule_type: 'port_mismatch',
          severity: 'warning',
          description: `Port of Loading conflict: Invoice specifies "${invoiceData.portOfLoading}" while BoL specifies "${bolData.portOfLoading}".`
        });
        newAnomalies.push(anomaly);
      }
    }

    // Update shipment status based on validation outcome
    const hasCritical = newAnomalies.some((a) => a.severity === 'critical');
    const hasWarning = newAnomalies.some((a) => a.severity === 'warning');

    if (hasCritical) {
      await dbService.updateShipmentStatus(shipmentId, 'flagged');
    } else if (hasWarning) {
      await dbService.updateShipmentStatus(shipmentId, 'review_required');
    } else {
      await dbService.updateShipmentStatus(shipmentId, 'ready_for_customs');
    }

    logger.info(`Validation finished for shipment ${shipmentId}. Generated ${newAnomalies.length} anomaly/anomalies.`);
    return newAnomalies;
  }

  private static fuzzyMatch(s1: string, s2: string): boolean {
    const clean1 = s1.replace(/[^a-z0-9]/g, '');
    const clean2 = s2.replace(/[^a-z0-9]/g, '');
    if (clean1 === clean2) return true;
    if (clean1.includes(clean2) || clean2.includes(clean1)) return true;
    return false;
  }
}
