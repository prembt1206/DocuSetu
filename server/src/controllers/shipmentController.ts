import { Request, Response, NextFunction } from 'express';
import { dbService } from '../services/dbService.js';
import { XmlExportService } from '../services/xmlExportService.js';
import { CreateShipmentSchema } from '../../../shared/validations.js';
import { logger } from '../utils/logger.js';

export const handleGetShipments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    const shipments = await dbService.getShipments(orgId);

    // Attach summary stats (doc counts, active anomalies)
    const enhanced = await Promise.all(
      shipments.map(async (shp) => {
        const docs = await dbService.getDocumentsByShipment(shp.id);
        const anomalies = await dbService.getAnomaliesByShipment(shp.id);
        const hasCritical = anomalies.some((a) => a.severity === 'critical' && !a.resolved);
        return {
          ...shp,
          documentsCount: docs.length,
          anomaliesCount: anomalies.length,
          hasCriticalAnomaly: hasCritical
        };
      })
    );

    res.status(200).json({ shipments: enhanced });
  } catch (err: any) {
    logger.error('handleGetShipments error:', err);
    next(err);
  }
};

export const handleGetShipmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';

    const shipment = await dbService.getShipmentById(id, orgId);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const docDataList = await dbService.getExtractedDataByShipment(id);
    const anomalies = await dbService.getAnomaliesByShipment(id);

    res.status(200).json({
      shipment,
      documents: docDataList.map((item) => ({
        ...item.document,
        extractedData: item.data
      })),
      anomalies
    });
  } catch (err: any) {
    logger.error('handleGetShipmentById error:', err);
    next(err);
  }
};

export const handleCreateShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';
    const parsed = CreateShipmentSchema.parse(req.body);

    const shipment = await dbService.createShipment({
      organization_id: orgId,
      reference_number: parsed.referenceNumber,
      port_of_loading: parsed.portOfLoading,
      port_of_discharge: parsed.portOfDischarge
    });

    res.status(201).json({ shipment });
  } catch (err: any) {
    logger.error('handleCreateShipment error:', err);
    next(err);
  }
};

export const handleApproveShipment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';

    const shipment = await dbService.getShipmentById(id, orgId);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    // Update status to customs_cleared
    await dbService.updateShipmentStatus(id, 'customs_cleared');

    // Generate XML export
    const docDataList = await dbService.getExtractedDataByShipment(id);
    const customsXml = XmlExportService.generateCustomsXml(shipment, docDataList);

    res.status(200).json({
      message: 'Shipment extraction approved and customs declaration generated successfully',
      status: 'customs_cleared',
      customsXml
    });
  } catch (err: any) {
    logger.error('handleApproveShipment error:', err);
    next(err);
  }
};

export const handleExportCustomsXml = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';

    const shipment = await dbService.getShipmentById(id, orgId);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const docDataList = await dbService.getExtractedDataByShipment(id);
    const xmlContent = XmlExportService.generateCustomsXml(shipment, docDataList);

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="CustomsDeclaration_${shipment.reference_number}.xml"`);
    res.status(200).send(xmlContent);
  } catch (err: any) {
    logger.error('handleExportCustomsXml error:', err);
    next(err);
  }
};

export const handleGetShipmentInsights = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const orgId = req.user?.organizationId || '11111111-1111-4111-8111-111111111111';

    const shipment = await dbService.getShipmentById(id, orgId);
    if (!shipment) {
      res.status(404).json({ error: 'Shipment not found' });
      return;
    }

    const docDataList = await dbService.getExtractedDataByShipment(id);
    const anomalies = await dbService.getAnomaliesByShipment(id);

    const criticalCount = anomalies.filter((a) => a.severity === 'critical' && !a.resolved).length;
    const warningCount = anomalies.filter((a) => a.severity === 'warning' && !a.resolved).length;

    const readinessScore = Math.max(0, 100 - criticalCount * 40 - warningCount * 15);

    res.status(200).json({
      shipmentId: id,
      referenceNumber: shipment.reference_number,
      readinessScore,
      status: shipment.status,
      criticalAnomalies: criticalCount,
      warningAnomalies: warningCount,
      totalDocuments: docDataList.length,
      estimatedClearanceDwellTimeHours: criticalCount > 0 ? 72 : warningCount > 0 ? 24 : 4
    });
  } catch (err: any) {
    logger.error('handleGetShipmentInsights error:', err);
    next(err);
  }
};
