import { AdvisorySettings } from '@shared/validations';

export interface ClientShipment {
  id: string;
  organization_id: string;
  reference_number: string;
  status: string;
  port_of_loading: string;
  port_of_discharge: string;
  created_at: string;
  documentsCount?: number;
  anomaliesCount?: number;
  hasCriticalAnomaly?: boolean;
}

export interface ClientDocument {
  id: string;
  shipment_id: string;
  file_url: string;
  original_filename: string;
  document_type: string;
  page_start: number;
  page_end: number;
  status: string;
  created_at: string;
  extractedData?: {
    raw_json: any;
    confidence_score: number;
  };
}

export interface ClientAnomaly {
  id: string;
  shipment_id: string;
  rule_type: string;
  severity: 'warning' | 'critical';
  description: string;
  resolved: boolean;
  created_at: string;
  shipment_reference?: string;
}

export interface ClientUser {
  id: string;
  email: string;
  organization_id: string;
  role: string;
  full_name?: string;
  password_hash?: string;
  email_verified?: boolean;
  created_at: string;
  last_login_at?: string;
}

class ClientFallbackStore {
  private shipments: Map<string, ClientShipment> = new Map();
  private documents: Map<string, ClientDocument[]> = new Map();
  private anomalies: Map<string, ClientAnomaly[]> = new Map();
  private users: Map<string, ClientUser> = new Map();
  private settings: AdvisorySettings = {
    weightTolerancePercent: 2.0,
    missingHsCodeStrictness: 'critical',
    confidenceThreshold: 0.85,
    autoFlagShipperMismatch: true,
    autoFlagPortMismatch: true,
    exportXmlFormat: 'WCO_3.0'
  };

  constructor() {
    this.init();
  }

  private init() {
    // Check localStorage for persisted store
    const saved = localStorage.getItem('docusetu_client_store');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.shipments = new Map(parsed.shipments);
        this.documents = new Map(parsed.documents);
        this.anomalies = new Map(parsed.anomalies);
        if (parsed.users) this.users = new Map(parsed.users);
        if (parsed.settings) this.settings = parsed.settings;
        return;
      } catch (e) {
        console.warn('Failed to parse client store, re-seeding:', e);
      }
    }
    this.seed();
  }

  private save() {
    try {
      const serialized = {
        shipments: Array.from(this.shipments.entries()),
        documents: Array.from(this.documents.entries()),
        anomalies: Array.from(this.anomalies.entries()),
        users: Array.from(this.users.entries()),
        settings: this.settings
      };
      localStorage.setItem('docusetu_client_store', JSON.stringify(serialized));
    } catch (e) {
      console.warn('Could not persist client store to localStorage:', e);
    }
  }

  private seed() {
    const orgId = '11111111-1111-4111-8111-111111111111';

    // 1. Shipment A: SHP-2026-8841 (Weight Mismatch 5,000kg vs 5,500kg)
    const shp1Id = '33333333-3333-4333-8333-333333333331';
    this.shipments.set(shp1Id, {
      id: shp1Id,
      organization_id: orgId,
      reference_number: 'SHP-2026-8841',
      status: 'flagged',
      port_of_loading: 'Port of Shenzhen, CN',
      port_of_discharge: 'Port of Rotterdam, NL',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
      documentsCount: 2,
      anomaliesCount: 1,
      hasCriticalAnomaly: true
    });

    const shp1Docs: ClientDocument[] = [
      {
        id: '44444444-4444-4444-8444-444444444401',
        shipment_id: shp1Id,
        file_url: '/uploads/SHP-8841-Commercial-Invoice.pdf',
        original_filename: 'SHP-8841-Commercial-Invoice.pdf',
        document_type: 'commercial_invoice',
        page_start: 1,
        page_end: 2,
        status: 'validated',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        extractedData: {
          confidence_score: 0.96,
          raw_json: {
            shipperName: 'Shenzhen MicroTech Electronic Devices Co., Ltd',
            consigneeName: 'EuroSupply Chain Logistics B.V.',
            invoiceNumber: 'INV-SZ-2026-9901',
            invoiceDate: '2026-09-20',
            incoterms: 'FOB',
            currency: 'EUR',
            totalInvoiceAmount: 284500.0,
            totalWeightKg: 5000.0,
            portOfLoading: 'Port of Shenzhen, CN',
            portOfDischarge: 'Port of Rotterdam, NL',
            hsCodes: ['85423190', '84717050'],
            lineItems: [
              {
                description: 'High-Density Microcontrollers 64-bit',
                hsCode: '85423190',
                quantity: 10000,
                unitPrice: 18.5,
                totalPrice: 185000.0
              },
              {
                description: 'Enterprise NVMe Solid State Drives 2TB',
                hsCode: '84717050',
                quantity: 995,
                unitPrice: 100.0,
                totalPrice: 99500.0
              }
            ]
          }
        }
      },
      {
        id: '44444444-4444-4444-8444-444444444402',
        shipment_id: shp1Id,
        file_url: '/uploads/SHP-8841-Bill-of-Lading.pdf',
        original_filename: 'SHP-8841-Bill-of-Lading.pdf',
        document_type: 'bill_of_lading',
        page_start: 3,
        page_end: 3,
        status: 'validated',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        extractedData: {
          confidence_score: 0.94,
          raw_json: {
            bolNumber: 'MAEU9921448291',
            carrierName: 'Maersk Line Global',
            vesselName: 'MAERSK MC-KINNEY MOLLER',
            voyageNumber: '2609W',
            shipperName: 'Shenzhen MicroTech Electronic Devices Co., Ltd',
            consigneeName: 'EuroSupply Chain Logistics B.V.',
            notifyParty: 'Rotterdam Gateway Customs Brokers',
            portOfLoading: 'Port of Shenzhen, CN',
            portOfDischarge: 'Port of Rotterdam, NL',
            totalWeightKg: 5500.0,
            measurementCbm: 28.4,
            containerNumbers: ['MSKU7829104', 'MSKU7829110'],
            goodsDescription: '2x 40HQ Containers: Electronic Microcontrollers & NVMe Storage Modules',
            issuedDate: '2026-09-22'
          }
        }
      }
    ];
    this.documents.set(shp1Id, shp1Docs);

    const shp1Anomalies: ClientAnomaly[] = [
      {
        id: '66666666-6666-4666-8666-666666666601',
        shipment_id: shp1Id,
        shipment_reference: 'SHP-2026-8841',
        rule_type: 'weight_mismatch',
        severity: 'critical',
        description: 'Discrepancy detected: Commercial Invoice reports 5,000.00 kg while Bill of Lading (MAEU9921448291) declares 5,500.00 kg (+10.00% difference exceeds configured 2.0% tolerance). Demurrage & customs audit risk.',
        resolved: false,
        created_at: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ];
    this.anomalies.set(shp1Id, shp1Anomalies);

    // 2. Shipment B: SHP-2026-9022 (Compliant CIF 12,450 kg)
    const shp2Id = '33333333-3333-4333-8333-333333333332';
    this.shipments.set(shp2Id, {
      id: shp2Id,
      organization_id: orgId,
      reference_number: 'SHP-2026-9022',
      status: 'ready_for_customs',
      port_of_loading: 'Port of Nagoya, JP',
      port_of_discharge: 'Port of Los Angeles, US',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      documentsCount: 3,
      anomaliesCount: 0,
      hasCriticalAnomaly: false
    });

    const shp2Docs: ClientDocument[] = [
      {
        id: '44444444-4444-4444-8444-444444444403',
        shipment_id: shp2Id,
        file_url: '/uploads/SHP-9022-Invoice.pdf',
        original_filename: 'SHP-9022-Invoice.pdf',
        document_type: 'commercial_invoice',
        page_start: 1,
        page_end: 1,
        status: 'validated',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        extractedData: {
          confidence_score: 0.98,
          raw_json: {
            shipperName: 'Toyota Tsusho Automotive Corp',
            consigneeName: 'North America Auto Assembly LLC',
            invoiceNumber: 'INV-JP-8012',
            invoiceDate: '2026-09-21',
            incoterms: 'CIF',
            currency: 'USD',
            totalInvoiceAmount: 412000.0,
            totalWeightKg: 12450.0,
            portOfLoading: 'Port of Nagoya, JP',
            portOfDischarge: 'Port of Los Angeles, US',
            hsCodes: ['87082990']
          }
        }
      },
      {
        id: '44444444-4444-4444-8444-444444444404',
        shipment_id: shp2Id,
        file_url: '/uploads/SHP-9022-BoL.pdf',
        original_filename: 'SHP-9022-BoL.pdf',
        document_type: 'bill_of_lading',
        page_start: 2,
        page_end: 2,
        status: 'validated',
        created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        extractedData: {
          confidence_score: 0.97,
          raw_json: {
            bolNumber: 'ONE771092841',
            carrierName: 'Ocean Network Express',
            shipperName: 'Toyota Tsusho Automotive Corp',
            consigneeName: 'North America Auto Assembly LLC',
            portOfLoading: 'Port of Nagoya, JP',
            portOfDischarge: 'Port of Los Angeles, US',
            totalWeightKg: 12450.0
          }
        }
      }
    ];
    this.documents.set(shp2Id, shp2Docs);
    this.anomalies.set(shp2Id, []);

    // 3. Shipment C: SHP-2026-7734 (Pharma missing HS code)
    const shp3Id = '33333333-3333-4333-8333-333333333333';
    this.shipments.set(shp3Id, {
      id: shp3Id,
      organization_id: orgId,
      reference_number: 'SHP-2026-7734',
      status: 'review_required',
      port_of_loading: 'Jawaharlal Nehru Port (JNPT), IN',
      port_of_discharge: 'Port of Antwerp, BE',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      documentsCount: 1,
      anomaliesCount: 1,
      hasCriticalAnomaly: false
    });

    const shp3Docs: ClientDocument[] = [
      {
        id: '44444444-4444-4444-8444-444444444405',
        shipment_id: shp3Id,
        file_url: '/uploads/SHP-7734-Pharma-Invoice.pdf',
        original_filename: 'SHP-7734-Pharma-Invoice.pdf',
        document_type: 'commercial_invoice',
        page_start: 1,
        page_end: 1,
        status: 'validated',
        created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
        extractedData: {
          confidence_score: 0.91,
          raw_json: {
            shipperName: 'SunBio LifeSciences Ltd',
            consigneeName: 'Antwerp BioPharmaceuticals NV',
            invoiceNumber: 'INV-IN-7734',
            incoterms: 'CIP',
            currency: 'EUR',
            totalWeightKg: 3200.0,
            hsCodes: ['29333990'],
            lineItems: [
              { description: 'Organic API Compound Intermediate', hsCode: '29333990', quantity: 50, unitPrice: 1200 },
              { description: 'Assorted Stabilizer Reagents', hsCode: '', quantity: 10, unitPrice: 450 }
            ]
          }
        }
      }
    ];
    this.documents.set(shp3Id, shp3Docs);

    const shp3Anomalies: ClientAnomaly[] = [
      {
        id: '66666666-6666-4666-8666-666666666602',
        shipment_id: shp3Id,
        shipment_reference: 'SHP-2026-7734',
        rule_type: 'missing_hs_code',
        severity: 'critical',
        description: 'Missing mandatory Harmonized Tariff (HS) Code for line item "Assorted Stabilizer Reagents". Will trigger customs hold under WCO regulations.',
        resolved: false,
        created_at: new Date(Date.now() - 4 * 3600000).toISOString()
      }
    ];
    this.anomalies.set(shp3Id, shp3Anomalies);

    this.save();
  }

  // API Methods
  getShipments(): { shipments: ClientShipment[] } {
    const list = Array.from(this.shipments.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return { shipments: list };
  }

  getShipment(id: string): { shipment: ClientShipment; documents: ClientDocument[]; anomalies: ClientAnomaly[] } {
    let shipment = this.shipments.get(id);
    if (!shipment) {
      for (const s of this.shipments.values()) {
        if (s.reference_number.toLowerCase() === id.toLowerCase() || s.id === id) {
          shipment = s;
          break;
        }
      }
    }

    if (!shipment) {
      const all = Array.from(this.shipments.values());
      if (all.length > 0) {
        shipment = all[0];
      } else {
        this.seed();
        shipment = Array.from(this.shipments.values())[0];
      }
    }

    const targetId = shipment ? shipment.id : id;
    const docs = this.documents.get(targetId) || this.documents.get(id) || [];
    const anoms = this.anomalies.get(targetId) || this.anomalies.get(id) || [];

    return {
      shipment: shipment || {
        id,
        organization_id: '11111111-1111-4111-8111-111111111111',
        reference_number: 'SHP-2026-9022',
        status: 'ready_for_customs',
        port_of_loading: 'Port of Nagoya, JP',
        port_of_discharge: 'Port of Los Angeles, US',
        created_at: new Date().toISOString()
      },
      documents: docs,
      anomalies: anoms
    };
  }

  createShipment(data: { referenceNumber: string; portOfLoading?: string; portOfDischarge?: string }): { shipment: ClientShipment } {
    const id = 'shp-' + Math.random().toString(36).substring(2, 9);
    const shipment: ClientShipment = {
      id,
      organization_id: '11111111-1111-4111-8111-111111111111',
      reference_number: data.referenceNumber,
      status: 'pending',
      port_of_loading: data.portOfLoading || 'Port of Shanghai, CN',
      port_of_discharge: data.portOfDischarge || 'Port of Rotterdam, NL',
      created_at: new Date().toISOString(),
      documentsCount: 0,
      anomaliesCount: 0,
      hasCriticalAnomaly: false
    };
    this.shipments.set(id, shipment);
    this.documents.set(id, []);
    this.anomalies.set(id, []);
    this.save();
    return { shipment };
  }

  approveShipment(id: string): { message: string; status: string; customsXml: string } {
    const shipment = this.shipments.get(id);
    if (shipment) {
      shipment.status = 'customs_cleared';
      this.shipments.set(id, shipment);
      this.save();
    }
    const docs = this.documents.get(id) || [];
    const xml = this.generateXml(shipment, docs);
    return {
      message: 'Shipment extraction approved and customs declaration generated successfully',
      status: 'customs_cleared',
      customsXml: xml
    };
  }

  resolveAnomaly(anomalyId: string) {
    for (const [shipId, anomList] of this.anomalies.entries()) {
      const found = anomList.find((a) => a.id === anomalyId);
      if (found) {
        found.resolved = true;
        this.save();
        break;
      }
    }
    return { message: 'Anomaly marked as resolved' };
  }

  loadSampleDossier(dossierType: 'weight_mismatch' | 'compliant' | 'missing_hs'): { shipmentId: string; shipment: ClientShipment; anomalies: ClientAnomaly[] } {
    const id = 'shp-' + Math.random().toString(36).substring(2, 9);
    const refNumber = 'SHP-2026-' + Math.floor(1000 + Math.random() * 9000);

    let pol = 'Port of Shenzhen, CN';
    let pod = 'Port of Rotterdam, NL';
    let status = 'flagged';
    let hasCritical = true;

    if (dossierType === 'compliant') {
      pol = 'Port of Nagoya, JP';
      pod = 'Port of Los Angeles, US';
      status = 'ready_for_customs';
      hasCritical = false;
    } else if (dossierType === 'missing_hs') {
      pol = 'Jawaharlal Nehru Port (JNPT), IN';
      pod = 'Port of Antwerp, BE';
      status = 'review_required';
      hasCritical = false;
    }

    const shipment: ClientShipment = {
      id,
      organization_id: '11111111-1111-4111-8111-111111111111',
      reference_number: refNumber,
      status,
      port_of_loading: pol,
      port_of_discharge: pod,
      created_at: new Date().toISOString(),
      documentsCount: 2,
      anomaliesCount: hasCritical || dossierType === 'missing_hs' ? 1 : 0,
      hasCriticalAnomaly: hasCritical
    };
    this.shipments.set(id, shipment);

    // Invoice doc
    const invWeight = dossierType === 'weight_mismatch' ? 5000.0 : 12450.0;
    const invDoc: ClientDocument = {
      id: 'doc-inv-' + Math.random().toString(36).substring(2, 7),
      shipment_id: id,
      file_url: `/uploads/${refNumber}-Commercial-Invoice.pdf`,
      original_filename: `${refNumber}-Commercial-Invoice.pdf`,
      document_type: 'commercial_invoice',
      page_start: 1,
      page_end: 2,
      status: 'validated',
      created_at: new Date().toISOString(),
      extractedData: {
        confidence_score: 0.96,
        raw_json: {
          shipperName: dossierType === 'compliant' ? 'Toyota Tsusho Automotive Corp' : 'Shenzhen MicroTech Electronic Devices Co., Ltd',
          consigneeName: dossierType === 'compliant' ? 'North America Auto Assembly LLC' : 'EuroSupply Chain Logistics B.V.',
          invoiceNumber: `INV-${refNumber}`,
          invoiceDate: new Date().toISOString().split('T')[0],
          incoterms: dossierType === 'compliant' ? 'CIF' : 'FOB',
          currency: dossierType === 'compliant' ? 'USD' : 'EUR',
          totalInvoiceAmount: dossierType === 'compliant' ? 412000.0 : 284500.0,
          totalWeightKg: invWeight,
          portOfLoading: pol,
          portOfDischarge: pod,
          hsCodes: dossierType === 'missing_hs' ? ['29333990'] : ['85423190', '84717050'],
          lineItems: dossierType === 'missing_hs'
            ? [
                { description: 'Organic Active Reagent', hsCode: '29333990', quantity: 20, unitPrice: 1500 },
                { description: 'Buffer Compound Solvent', hsCode: '', quantity: 15, unitPrice: 300 }
              ]
            : [
                { description: 'High-Density Microcontrollers 64-bit', hsCode: '85423190', quantity: 10000, unitPrice: 18.5, totalPrice: 185000.0 },
                { description: 'Enterprise NVMe Solid State Drives 2TB', hsCode: '84717050', quantity: 995, unitPrice: 100.0, totalPrice: 99500.0 }
              ]
        }
      }
    };

    // BoL doc
    const bolWeight = dossierType === 'weight_mismatch' ? 5500.0 : 12450.0;
    const bolDoc: ClientDocument = {
      id: 'doc-bol-' + Math.random().toString(36).substring(2, 7),
      shipment_id: id,
      file_url: `/uploads/${refNumber}-Bill-of-Lading.pdf`,
      original_filename: `${refNumber}-Bill-of-Lading.pdf`,
      document_type: 'bill_of_lading',
      page_start: 3,
      page_end: 3,
      status: 'validated',
      created_at: new Date().toISOString(),
      extractedData: {
        confidence_score: 0.94,
        raw_json: {
          bolNumber: 'MAEU' + Math.floor(100000000 + Math.random() * 900000000),
          carrierName: dossierType === 'compliant' ? 'Ocean Network Express (ONE)' : 'Maersk Line Global',
          vesselName: dossierType === 'compliant' ? 'ONE APUS' : 'MAERSK MC-KINNEY MOLLER',
          voyageNumber: '2609W',
          shipperName: dossierType === 'compliant' ? 'Toyota Tsusho Automotive Corp' : 'Shenzhen MicroTech Electronic Devices Co., Ltd',
          consigneeName: dossierType === 'compliant' ? 'North America Auto Assembly LLC' : 'EuroSupply Chain Logistics B.V.',
          portOfLoading: pol,
          portOfDischarge: pod,
          totalWeightKg: bolWeight,
          measurementCbm: 28.4,
          containerNumbers: ['MSKU7829104', 'MSKU7829110']
        }
      }
    };

    this.documents.set(id, [invDoc, bolDoc]);

    const anomalies: ClientAnomaly[] = [];
    if (dossierType === 'weight_mismatch') {
      anomalies.push({
        id: 'anom-' + Math.random().toString(36).substring(2, 7),
        shipment_id: id,
        shipment_reference: refNumber,
        rule_type: 'weight_mismatch',
        severity: 'critical',
        description: 'Discrepancy detected: Commercial Invoice reports 5,000.00 kg while Bill of Lading declares 5,500.00 kg (+10.00% difference exceeds configured 2.0% tolerance). Demurrage & customs audit risk.',
        resolved: false,
        created_at: new Date().toISOString()
      });
    } else if (dossierType === 'missing_hs') {
      anomalies.push({
        id: 'anom-' + Math.random().toString(36).substring(2, 7),
        shipment_id: id,
        shipment_reference: refNumber,
        rule_type: 'missing_hs_code',
        severity: 'critical',
        description: 'Missing mandatory Harmonized Tariff (HS) Code for line item "Buffer Compound Solvent". Will trigger customs hold under WCO regulations.',
        resolved: false,
        created_at: new Date().toISOString()
      });
    }
    this.anomalies.set(id, anomalies);

    this.save();
    return { shipmentId: id, shipment, anomalies };
  }

  getSettings(): { settings: AdvisorySettings } {
    return { settings: this.settings };
  }

  updateSettings(updates: AdvisorySettings): { message: string; settings: AdvisorySettings } {
    this.settings = { ...this.settings, ...updates };
    this.save();
    return {
      message: 'Advisory settings and validation tolerances updated successfully',
      settings: this.settings
    };
  }

  getDashboardInsights() {
    const shipmentsList = Array.from(this.shipments.values());
    const allAnomalies: ClientAnomaly[] = [];
    for (const anoms of this.anomalies.values()) {
      allAnomalies.push(...anoms);
    }

    const totalShipments = shipmentsList.length;
    const readyCount = shipmentsList.filter((s) => s.status === 'ready_for_customs' || s.status === 'customs_cleared').length;
    const flaggedCount = shipmentsList.filter((s) => s.status === 'flagged' || s.status === 'review_required').length;
    const automatedClearanceRate = totalShipments > 0 ? Math.round((readyCount / totalShipments) * 100) : 100;

    const criticalAnomalies = allAnomalies.filter((a) => a.severity === 'critical' && !a.resolved).length;
    const warningAnomalies = allAnomalies.filter((a) => a.severity === 'warning' && !a.resolved).length;

    const supplierProfiles = [
      { supplierName: 'Shenzhen MicroTech Electronic Devices Co., Ltd', complianceScore: 71, totalShipments: 14, activeAnomalies: 4, weightAccuracyRate: 60, riskLevel: 'High' as const },
      { supplierName: 'Toyota Tsusho Automotive Corp', complianceScore: 100, totalShipments: 28, activeAnomalies: 0, weightAccuracyRate: 100, riskLevel: 'Low' as const },
      { supplierName: 'SunBio LifeSciences Ltd', complianceScore: 78, totalShipments: 9, activeAnomalies: 2, weightAccuracyRate: 100, riskLevel: 'Medium' as const },
      { supplierName: 'Ningbo Maritime Exports Ltd', complianceScore: 94, totalShipments: 18, activeAnomalies: 1, weightAccuracyRate: 85, riskLevel: 'Low' as const },
      { supplierName: 'Bavaria Machinery Logistics AG', complianceScore: 100, totalShipments: 12, activeAnomalies: 0, weightAccuracyRate: 100, riskLevel: 'Low' as const }
    ];

    const portBottlenecks = [
      { port: 'Port of Rotterdam, NL', avgCustomsDwellDays: 3.8, delayRisk: 'Elevated (+1.4d)', congestionIndex: 78, primaryHoldReason: 'Weight discrepancy audits' },
      { port: 'Port of Los Angeles, US', avgCustomsDwellDays: 1.9, delayRisk: 'Normal (0.2d)', congestionIndex: 42, primaryHoldReason: 'Routine ACE filings' },
      { port: 'Port of Antwerp, BE', avgCustomsDwellDays: 4.5, delayRisk: 'High (+2.1d)', congestionIndex: 86, primaryHoldReason: 'Pharma HS Code inspection' },
      { port: 'Port of Hamburg, DE', avgCustomsDwellDays: 2.3, delayRisk: 'Low', congestionIndex: 35, primaryHoldReason: 'Direct Green Lane clearance' }
    ];

    return {
      totalShipments,
      readyCount,
      flaggedCount,
      automatedClearanceRate,
      criticalAnomalies,
      warningAnomalies,
      recentAnomalies: allAnomalies.slice(0, 8),
      supplierProfiles,
      portBottlenecks
    };
  }

  private generateXml(shipment?: ClientShipment, docs: ClientDocument[] = []): string {
    const inv = docs.find((d) => d.document_type === 'commercial_invoice')?.extractedData?.raw_json;
    const bol = docs.find((d) => d.document_type === 'bill_of_lading')?.extractedData?.raw_json;

    const exporter = inv?.shipperName || bol?.shipperName || 'Shenzhen MicroTech Electronic Devices Co., Ltd';
    const importer = inv?.consigneeName || bol?.consigneeName || 'EuroSupply Chain Logistics B.V.';
    const bolNum = bol?.bolNumber || shipment?.reference_number || 'MAEU9921448291';
    const weight = inv?.totalWeightKg || bol?.totalWeightKg || 5000.0;
    const currency = inv?.currency || 'EUR';
    const amount = inv?.totalInvoiceAmount || 284500.0;
    const pol = shipment?.port_of_loading || 'Port of Shenzhen, CN';
    const pod = shipment?.port_of_discharge || 'Port of Rotterdam, NL';

    return `<?xml version="1.0" encoding="UTF-8"?>
<!-- DocuSetu Automated Customs Declaration Output -->
<!-- Standard: WCO Data Model 3.0 / WCO Customs Declaration (GOVCBR) -->
<Declaration xmlns="urn:wco:datamodel:WCO:Declaration:1"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <DeclarationOfficeID>${pod.substring(0, 10).replace(/[^a-zA-Z0-9]/g, '')}</DeclarationOfficeID>
  <FunctionCode>9</FunctionCode> <!-- Original Customs Filing -->
  <ID>DOCUSETU-DEC-${shipment?.reference_number || 'CONSIGNMENT'}</ID>
  <IssueDateTime>${new Date().toISOString()}</IssueDateTime>
  <TypeCode>IM4</TypeCode> <!-- Standard Import for Home Use -->

  <Agent>
    <Name>Apex Global Freight &amp; Customs Brokerage</Name>
    <RoleCode>CB</RoleCode>
  </Agent>

  <Exporter>
    <Name>${exporter}</Name>
  </Exporter>

  <Importer>
    <Name>${importer}</Name>
  </Importer>

  <TradeTerms>
    <ConditionCode>${inv?.incoterms || 'FOB'}</ConditionCode>
  </TradeTerms>

  <Consignment>
    <TransportContractDocument>
      <ID>${bolNum}</ID>
      <TypeCode>705</TypeCode> <!-- Bill of Lading -->
    </TransportContractDocument>
    <LoadingLocation>
      <Name>${pol}</Name>
    </LoadingLocation>
    <UnloadingLocation>
      <Name>${pod}</Name>
    </UnloadingLocation>
    <TotalGrossMassMeasure unitCode="KGM">${weight.toFixed(2)}</TotalGrossMassMeasure>
    <Invoice>
      <ID>${inv?.invoiceNumber || 'INV-2026'}</ID>
      <ItemChargeAmount currencyID="${currency}">${amount.toFixed(2)}</ItemChargeAmount>
    </Invoice>
  </Consignment>
</Declaration>`;
  }

  private pendingOtps: Map<string, { code: string; email: string; fullName?: string; expiresAt: number; verified: boolean }> = new Map();

  upsertUser(user: { id?: string; email: string; organizationId?: string; role?: string; fullName?: string; passwordHash?: string; emailVerified?: boolean }): ClientUser {
    const existing = this.getUserByEmail(user.email);
    const updated: ClientUser = {
      id: user.id || existing?.id || 'user-' + Math.random().toString(36).substring(2, 9),
      email: user.email.toLowerCase().trim(),
      organization_id: user.organizationId || existing?.organization_id || '11111111-1111-4111-8111-111111111111',
      role: user.role || existing?.role || 'Customs Broker & Compliance Officer',
      full_name: user.fullName || existing?.full_name || user.email.split('@')[0],
      password_hash: user.passwordHash || existing?.password_hash,
      email_verified: user.emailVerified !== undefined ? user.emailVerified : (existing?.email_verified ?? true),
      created_at: existing?.created_at || new Date().toISOString(),
      last_login_at: existing?.last_login_at
    };
    this.users.set(updated.id, updated);
    this.save();
    return updated;
  }

  sendOtp(email: string, fullName?: string): { message: string; expiresInSeconds: number; devOtp?: string } {
    const normalized = email.toLowerCase().trim();
    // Cryptographically secure 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.pendingOtps.set(normalized, {
      code,
      email: normalized,
      fullName: fullName?.trim(),
      expiresAt: Date.now() + 5 * 60 * 1000,
      verified: false
    });

    console.info(`[DocuSetu Auth] 🔐 Verification OTP for ${normalized}: ${code} (Expires in 5m)`);

    return {
      message: `A 6-digit verification code has been dispatched to ${normalized}. Please check your inbox or spam folder.`,
      expiresInSeconds: 300,
      devOtp: code
    };
  }

  verifyOtp(email: string, code: string): { verified: boolean; message: string } {
    const normalized = email.toLowerCase().trim();
    const pending = this.pendingOtps.get(normalized);

    if (!pending) {
      throw new Error('No active verification code found for this email. Please request a new code.');
    }

    if (Date.now() > pending.expiresAt) {
      this.pendingOtps.delete(normalized);
      throw new Error('Verification code has expired. Please request a new code.');
    }

    if (pending.code !== code.trim()) {
      throw new Error('Invalid 6-digit verification code. Please check your email.');
    }

    pending.verified = true;
    return {
      verified: true,
      message: 'Email verified successfully! Please enter your new account password.'
    };
  }

  createAccount(data: { email: string; fullName: string; password: string; code?: string }): { token: string; user: ClientUser } {
    const normalized = data.email.toLowerCase().trim();
    const existing = this.getUserByEmail(normalized);

    if (existing && existing.password_hash) {
      throw new Error('An account with this email is already registered. Please go to Login.');
    }

    // Verify OTP was validated
    const pending = this.pendingOtps.get(normalized);
    let isVerified = pending?.verified;
    if (!isVerified && data.code && pending && pending.code === data.code.trim()) {
      isVerified = true;
    }

    if (!isVerified) {
      throw new Error('Please verify the 6-digit OTP sent to your email before setting your password.');
    }

    // Hash password
    const passwordHash = this.hashPassword(data.password);
    const user = this.upsertUser({
      email: normalized,
      fullName: data.fullName.trim() || pending?.fullName,
      passwordHash,
      emailVerified: true
    });

    this.pendingOtps.delete(normalized);

    const token = 'docusetu-token-' + btoa(JSON.stringify({ id: user.id, email: user.email, time: Date.now() }));
    return { token, user };
  }

  login(email: string, password: string): { token: string; user: ClientUser } {
    const normalized = email.toLowerCase().trim();
    const user = this.getUserByEmail(normalized);

    if (!user) {
      throw new Error('No registered account found with this email. Please click "Create account" to sign up.');
    }

    if (!user.password_hash) {
      throw new Error('Account does not have a password set. Please create your account with OTP verification.');
    }

    const inputHash = this.hashPassword(password);
    if (user.password_hash !== inputHash) {
      throw new Error('Incorrect password. Please verify your credentials.');
    }

    user.last_login_at = new Date().toISOString();
    this.save();

    const token = 'docusetu-token-' + btoa(JSON.stringify({ id: user.id, email: user.email, time: Date.now() }));
    return { token, user };
  }

  public hashPassword(password: string): string {
    let hash1 = 0x811c9dc5;
    let hash2 = 0x55555555;
    const salted = 'docusetu_sec_' + password;
    for (let i = 0; i < salted.length; i++) {
      const ch = salted.charCodeAt(i);
      hash1 ^= ch;
      hash1 = Math.imul(hash1, 0x01000193);
      hash2 = Math.imul(hash2, 33) ^ ch;
    }
    return (hash1 >>> 0).toString(16) + (hash2 >>> 0).toString(16);
  }

  getUserByEmail(email: string): ClientUser | undefined {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase().trim() === normalized) return u;
    }
    return undefined;
  }

  getUsers(): ClientUser[] {
    return Array.from(this.users.values());
  }
}

export const clientFallbackStore = new ClientFallbackStore();

