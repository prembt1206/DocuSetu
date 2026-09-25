import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { AdvisorySettings } from '../../../shared/validations.js';

export interface DbShipment {
  id: string;
  organization_id: string;
  reference_number: string;
  status: string;
  port_of_loading: string | null;
  port_of_discharge: string | null;
  created_at: string;
}

export interface DbDocument {
  id: string;
  shipment_id: string;
  file_url: string;
  original_filename?: string;
  document_type: string;
  page_start: number | null;
  page_end: number | null;
  status: string;
  created_at: string;
}

export interface DbExtractedData {
  id: string;
  document_id: string;
  raw_json: any;
  confidence_score: number;
  created_at: string;
}

export interface DbAnomaly {
  id: string;
  shipment_id: string;
  rule_type: string;
  severity: 'warning' | 'critical';
  description: string;
  resolved: boolean;
  created_at: string;
}

export interface DbOrganizationSettings {
  id: string;
  organization_id: string;
  weight_tolerance_percent: number;
  missing_hs_code_strictness: 'warning' | 'critical';
  confidence_threshold: number;
  auto_flag_shipper_mismatch: boolean;
  auto_flag_port_mismatch: boolean;
  export_xml_format: string;
  updated_at: string;
}

export interface DbUser {
  id: string;
  organization_id: string;
  email: string;
  role: string;
  full_name?: string;
  password_hash?: string;
  email_verified?: boolean;
  created_at: string;
  last_login_at?: string;
}

class DatabaseService {
  private supabase: SupabaseClient | null = null;
  private isConnectedToSupabase = false;

  // Local resilient storage for instant out-of-the-box operation and RLS isolation
  private localOrgs: Map<string, { id: string; name: string; created_at: string }> = new Map();
  private localUsers: Map<string, DbUser> = new Map();
  private localShipments: Map<string, DbShipment> = new Map();
  private localDocuments: Map<string, DbDocument> = new Map();
  private localExtractedData: Map<string, DbExtractedData> = new Map();
  private localAnomalies: Map<string, DbAnomaly> = new Map();
  private localSettings: Map<string, DbOrganizationSettings> = new Map();

  constructor() {
    this.initSupabase();
    this.seedLocalDefaults();
  }

  private initSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (url && key && !url.includes('mock-supabase') && !url.includes('your_supabase')) {
      try {
        this.supabase = createClient(url, key);
        this.isConnectedToSupabase = true;
        logger.info('Connected to remote Supabase instance at ' + url);
      } catch (err: any) {
        logger.warn('Failed to initialize remote Supabase client, using local database store: ' + err.message);
        this.isConnectedToSupabase = false;
      }
    } else {
      logger.info('Running with local in-memory database store (Supabase mock mode). Ready for zero-config testing.');
      this.isConnectedToSupabase = false;
    }
  }

  private seedLocalDefaults() {
    const defaultOrgId = '11111111-1111-4111-8111-111111111111';
    const defaultUserId = '00000000-0000-4000-8000-000000000001';

    this.localOrgs.set(defaultOrgId, {
      id: defaultOrgId,
      name: 'Apex Global Freight & Customs Brokerage',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString()
    });

    this.localUsers.set(defaultUserId, {
      id: defaultUserId,
      organization_id: defaultOrgId,
      email: 'broker@docusetu.io',
      role: 'admin',
      created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
      email_verified: true
    });

    this.localSettings.set(defaultOrgId, {
      id: '22222222-2222-4222-8222-222222222222',
      organization_id: defaultOrgId,
      weight_tolerance_percent: 2.0,
      missing_hs_code_strictness: 'critical',
      confidence_threshold: 0.85,
      auto_flag_shipper_mismatch: true,
      auto_flag_port_mismatch: true,
      export_xml_format: 'WCO_3.0',
      updated_at: new Date().toISOString()
    });

    // Seed Shipment 1: SHP-2026-8841 (Electronics - Critical Weight Discrepancy)
    const shp1Id = '33333333-3333-4333-8333-333333333331';
    this.localShipments.set(shp1Id, {
      id: shp1Id,
      organization_id: defaultOrgId,
      reference_number: 'SHP-2026-8841',
      status: 'flagged',
      port_of_loading: 'Port of Shenzhen, CN',
      port_of_discharge: 'Port of Rotterdam, NL',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    });

    const doc1Id = '44444444-4444-4444-8444-444444444401';
    this.localDocuments.set(doc1Id, {
      id: doc1Id,
      shipment_id: shp1Id,
      file_url: '/uploads/SHP-8841-Commercial-Invoice.pdf',
      original_filename: 'SHP-8841-Commercial-Invoice.pdf',
      document_type: 'commercial_invoice',
      page_start: 1,
      page_end: 2,
      status: 'validated',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    });

    this.localExtractedData.set(doc1Id, {
      id: '55555555-5555-4555-8555-555555555501',
      document_id: doc1Id,
      confidence_score: 0.96,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
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
    });

    const doc2Id = '44444444-4444-4444-8444-444444444402';
    this.localDocuments.set(doc2Id, {
      id: doc2Id,
      shipment_id: shp1Id,
      file_url: '/uploads/SHP-8841-Bill-of-Lading.pdf',
      original_filename: 'SHP-8841-Bill-of-Lading.pdf',
      document_type: 'bill_of_lading',
      page_start: 3,
      page_end: 3,
      status: 'validated',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    });

    this.localExtractedData.set(doc2Id, {
      id: '55555555-5555-4555-8555-555555555502',
      document_id: doc2Id,
      confidence_score: 0.94,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
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
    });

    const anomaly1Id = '66666666-6666-4666-8666-666666666601';
    this.localAnomalies.set(anomaly1Id, {
      id: anomaly1Id,
      shipment_id: shp1Id,
      rule_type: 'weight_mismatch',
      severity: 'critical',
      description: 'Discrepancy detected: Commercial Invoice reports 5,000.00 kg while Bill of Lading (MAEU9921448291) declares 5,500.00 kg (+10.00% difference exceeds configured 2.0% tolerance). Demurrage & customs audit risk.',
      resolved: false,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString()
    });

    // Seed Shipment 2: SHP-2026-9022 (Automotive - Fully Compliant)
    const shp2Id = '33333333-3333-4333-8333-333333333332';
    this.localShipments.set(shp2Id, {
      id: shp2Id,
      organization_id: defaultOrgId,
      reference_number: 'SHP-2026-9022',
      status: 'ready_for_customs',
      port_of_loading: 'Port of Nagoya, JP',
      port_of_discharge: 'Port of Los Angeles, US',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    });

    const doc3Id = '44444444-4444-4444-8444-444444444403';
    this.localDocuments.set(doc3Id, {
      id: doc3Id,
      shipment_id: shp2Id,
      file_url: '/uploads/SHP-9022-Invoice.pdf',
      original_filename: 'SHP-9022-Invoice.pdf',
      document_type: 'commercial_invoice',
      page_start: 1,
      page_end: 1,
      status: 'validated',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    });

    this.localExtractedData.set(doc3Id, {
      id: '55555555-5555-4555-8555-555555555503',
      document_id: doc3Id,
      confidence_score: 0.98,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
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
    });

    const doc4Id = '44444444-4444-4444-8444-444444444404';
    this.localDocuments.set(doc4Id, {
      id: doc4Id,
      shipment_id: shp2Id,
      file_url: '/uploads/SHP-9022-BoL.pdf',
      original_filename: 'SHP-9022-BoL.pdf',
      document_type: 'bill_of_lading',
      page_start: 2,
      page_end: 2,
      status: 'validated',
      created_at: new Date(Date.now() - 1 * 86400000).toISOString()
    });

    this.localExtractedData.set(doc4Id, {
      id: '55555555-5555-4555-8555-555555555504',
      document_id: doc4Id,
      confidence_score: 0.97,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
      raw_json: {
        bolNumber: 'ONE771092841',
        carrierName: 'Ocean Network Express',
        shipperName: 'Toyota Tsusho Automotive Corp',
        consigneeName: 'North America Auto Assembly LLC',
        portOfLoading: 'Port of Nagoya, JP',
        portOfDischarge: 'Port of Los Angeles, US',
        totalWeightKg: 12450.0
      }
    });

    // Seed Shipment 3: SHP-2026-7734 (Pharma - Missing HS Code Warning)
    const shp3Id = '33333333-3333-4333-8333-333333333333';
    this.localShipments.set(shp3Id, {
      id: shp3Id,
      organization_id: defaultOrgId,
      reference_number: 'SHP-2026-7734',
      status: 'review_required',
      port_of_loading: 'Jawaharlal Nehru Port (JNPT), IN',
      port_of_discharge: 'Port of Antwerp, BE',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    });

    const doc5Id = '44444444-4444-4444-8444-444444444405';
    this.localDocuments.set(doc5Id, {
      id: doc5Id,
      shipment_id: shp3Id,
      file_url: '/uploads/SHP-7734-Pharma-Invoice.pdf',
      original_filename: 'SHP-7734-Pharma-Invoice.pdf',
      document_type: 'commercial_invoice',
      page_start: 1,
      page_end: 1,
      status: 'validated',
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    });

    this.localExtractedData.set(doc5Id, {
      id: '55555555-5555-4555-8555-555555555505',
      document_id: doc5Id,
      confidence_score: 0.91,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
      raw_json: {
        shipperName: 'SunBio LifeSciences Ltd',
        consigneeName: 'Antwerp BioPharmaceuticals NV',
        invoiceNumber: 'INV-IN-7734',
        incoterms: 'CIP',
        currency: 'EUR',
        totalWeightKg: 3200.0,
        hsCodes: ['29333990'],
        lineItems: [
          {
            description: 'Organic API Compound Intermediate',
            hsCode: '29333990',
            quantity: 50,
            unitPrice: 1200
          },
          {
            description: 'Assorted Stabilizer Reagents',
            hsCode: '', // Missing HS code!
            quantity: 10,
            unitPrice: 450
          }
        ]
      }
    });

    this.localAnomalies.set('66666666-6666-4666-8666-666666666602', {
      id: '66666666-6666-4666-8666-666666666602',
      shipment_id: shp3Id,
      rule_type: 'missing_hs_code',
      severity: 'critical',
      description: 'Missing mandatory Harmonized Tariff (HS) Code for line item "Assorted Stabilizer Reagents". Will trigger customs hold under WCO regulations.',
      resolved: false,
      created_at: new Date(Date.now() - 4 * 3600000).toISOString()
    });
  }

  // ==========================================
  // Users Operations
  // ==========================================
  async upsertUser(data: {
    id: string;
    email: string;
    organization_id?: string;
    role?: string;
    full_name?: string;
    password_hash?: string;
    email_verified?: boolean;
    last_login_at?: string;
  }): Promise<DbUser> {
    const orgId = data.organization_id || '11111111-1111-4111-8111-111111111111';
    const role = data.role || 'Customs Broker & Compliance Officer';
    const normalizedEmail = data.email.trim().toLowerCase();

    const existingLocal = this.localUsers.get(data.id) || Array.from(this.localUsers.values()).find(u => u.email.toLowerCase() === normalizedEmail);

    const record: DbUser = {
      id: data.id,
      email: normalizedEmail,
      full_name: data.full_name !== undefined ? data.full_name : (existingLocal?.full_name || ''),
      organization_id: orgId,
      role: role,
      password_hash: data.password_hash !== undefined ? data.password_hash : existingLocal?.password_hash,
      email_verified: data.email_verified !== undefined ? data.email_verified : (existingLocal?.email_verified ?? true),
      created_at: existingLocal?.created_at || new Date().toISOString(),
      last_login_at: data.last_login_at || existingLocal?.last_login_at
    };

    if (this.isConnectedToSupabase && this.supabase) {
      try {
        const payload: any = {
          id: record.id,
          email: record.email,
          full_name: record.full_name || null,
          organization_id: record.organization_id,
          role: record.role
        };
        if (record.password_hash) payload.password_hash = record.password_hash;
        if (record.email_verified !== undefined) payload.email_verified = record.email_verified;

        const { data: supaUser, error } = await this.supabase
          .from('users')
          .upsert(payload)
          .select()
          .single();

        if (!error && supaUser) {
          record.id = supaUser.id;
        }
      } catch (err) {
        logger.warn('Supabase DB users upsert fallback note:', err);
      }
    }

    this.localUsers.set(record.id, record);
    return record;
  }

  async createUser(data: {
    id?: string;
    email: string;
    full_name?: string;
    password_hash: string;
    organization_id?: string;
    role?: string;
  }): Promise<DbUser> {
    const id = data.id || uuidv4();
    return this.upsertUser({
      id,
      email: data.email,
      full_name: data.full_name,
      password_hash: data.password_hash,
      organization_id: data.organization_id,
      role: data.role || 'Customs Broker & Compliance Officer',
      email_verified: true
    });
  }

  async updateUser(id: string, updates: Partial<DbUser>): Promise<DbUser | null> {
    const existing = this.localUsers.get(id);
    if (!existing) return null;

    const updated: DbUser = {
      ...existing,
      ...updates
    };

    if (this.isConnectedToSupabase && this.supabase) {
      try {
        await this.supabase.from('users').update(updates).eq('id', id);
      } catch (err) {
        logger.warn('Supabase DB users update note:', err);
      }
    }

    this.localUsers.set(id, updated);
    return updated;
  }

  async getUserByEmail(email: string): Promise<DbUser | null> {
    const normalized = email.trim().toLowerCase();

    if (this.isConnectedToSupabase && this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('users')
          .select('*')
          .eq('email', normalized)
          .single();
        if (!error && data) {
          return {
            id: data.id,
            email: data.email,
            full_name: data.full_name,
            organization_id: data.organization_id,
            role: data.role,
            password_hash: data.password_hash,
            email_verified: data.email_verified,
            created_at: data.created_at,
            last_login_at: data.last_login_at
          };
        }
      } catch (err) {
        // Fall back to local
      }
    }

    return Array.from(this.localUsers.values()).find(u => u.email.toLowerCase() === normalized) || null;
  }

  // ==========================================
  // Shipments Operations
  // ==========================================
  async getShipments(orgId: string): Promise<DbShipment[]> {
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('shipments')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    // Local fallback
    return Array.from(this.localShipments.values())
      .filter((s) => s.organization_id === orgId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getShipmentById(id: string, orgId?: string): Promise<DbShipment | null> {
    if (this.isConnectedToSupabase && this.supabase) {
      let query = this.supabase.from('shipments').select('*').eq('id', id);
      if (orgId) query = query.eq('organization_id', orgId);
      const { data, error } = await query.single();
      if (!error && data) return data;
    }
    const shp = this.localShipments.get(id);
    if (!shp) return null;
    if (orgId && shp.organization_id !== orgId) return null;
    return shp;
  }

  async createShipment(data: {
    organization_id: string;
    reference_number: string;
    port_of_loading?: string;
    port_of_discharge?: string;
  }): Promise<DbShipment> {
    const newShipment: DbShipment = {
      id: uuidv4(),
      organization_id: data.organization_id,
      reference_number: data.reference_number,
      status: 'pending',
      port_of_loading: data.port_of_loading || null,
      port_of_discharge: data.port_of_discharge || null,
      created_at: new Date().toISOString()
    };

    if (this.isConnectedToSupabase && this.supabase) {
      const { data: inserted, error } = await this.supabase
        .from('shipments')
        .insert(newShipment)
        .select()
        .single();
      if (!error && inserted) return inserted;
    }

    this.localShipments.set(newShipment.id, newShipment);
    return newShipment;
  }

  async updateShipmentStatus(id: string, status: string): Promise<void> {
    if (this.isConnectedToSupabase && this.supabase) {
      await this.supabase.from('shipments').update({ status }).eq('id', id);
    }
    const shp = this.localShipments.get(id);
    if (shp) {
      shp.status = status;
      this.localShipments.set(id, shp);
    }
  }

  // ==========================================
  // Documents Operations
  // ==========================================
  async createDocument(data: {
    shipment_id: string;
    file_url: string;
    original_filename?: string;
    document_type?: string;
    page_start?: number;
    page_end?: number;
    status?: string;
  }): Promise<DbDocument> {
    const newDoc: DbDocument = {
      id: uuidv4(),
      shipment_id: data.shipment_id,
      file_url: data.file_url,
      original_filename: data.original_filename,
      document_type: data.document_type || 'unknown',
      page_start: data.page_start || 1,
      page_end: data.page_end || 1,
      status: data.status || 'uploaded',
      created_at: new Date().toISOString()
    };

    if (this.isConnectedToSupabase && this.supabase) {
      const { data: inserted, error } = await this.supabase
        .from('documents')
        .insert(newDoc)
        .select()
        .single();
      if (!error && inserted) return inserted;
    }

    this.localDocuments.set(newDoc.id, newDoc);
    return newDoc;
  }

  async getDocumentById(id: string): Promise<DbDocument | null> {
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase.from('documents').select('*').eq('id', id).single();
      if (!error && data) return data;
    }
    return this.localDocuments.get(id) || null;
  }

  async getDocumentsByShipment(shipmentId: string): Promise<DbDocument[]> {
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('documents')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: true });
      if (!error && data) return data;
    }
    return Array.from(this.localDocuments.values()).filter((d) => d.shipment_id === shipmentId);
  }

  async updateDocument(id: string, updates: Partial<DbDocument>): Promise<void> {
    if (this.isConnectedToSupabase && this.supabase) {
      await this.supabase.from('documents').update(updates).eq('id', id);
    }
    const doc = this.localDocuments.get(id);
    if (doc) {
      Object.assign(doc, updates);
      this.localDocuments.set(id, doc);
    }
  }

  // ==========================================
  // Extracted Data Operations
  // ==========================================
  async saveExtractedData(data: {
    document_id: string;
    raw_json: any;
    confidence_score: number;
  }): Promise<DbExtractedData> {
    const record: DbExtractedData = {
      id: uuidv4(),
      document_id: data.document_id,
      raw_json: data.raw_json,
      confidence_score: data.confidence_score,
      created_at: new Date().toISOString()
    };

    if (this.isConnectedToSupabase && this.supabase) {
      const { data: inserted, error } = await this.supabase
        .from('extracted_data')
        .insert(record)
        .select()
        .single();
      if (!error && inserted) return inserted;
    }

    this.localExtractedData.set(data.document_id, record);
    return record;
  }

  async getExtractedDataByDocument(documentId: string): Promise<DbExtractedData | null> {
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('extracted_data')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (!error && data) return data;
    }
    return this.localExtractedData.get(documentId) || null;
  }

  async getExtractedDataByShipment(shipmentId: string): Promise<{ document: DbDocument; data: DbExtractedData | null }[]> {
    const docs = await this.getDocumentsByShipment(shipmentId);
    const results = [];
    for (const doc of docs) {
      const ext = await this.getExtractedDataByDocument(doc.id);
      results.push({ document: doc, data: ext });
    }
    return results;
  }

  // ==========================================
  // Anomalies Operations
  // ==========================================
  async createAnomaly(data: {
    shipment_id: string;
    rule_type: string;
    severity: 'warning' | 'critical';
    description: string;
  }): Promise<DbAnomaly> {
    const anomaly: DbAnomaly = {
      id: uuidv4(),
      shipment_id: data.shipment_id,
      rule_type: data.rule_type,
      severity: data.severity,
      description: data.description,
      resolved: false,
      created_at: new Date().toISOString()
    };

    if (this.isConnectedToSupabase && this.supabase) {
      const { data: inserted, error } = await this.supabase
        .from('anomalies')
        .insert(anomaly)
        .select()
        .single();
      if (!error && inserted) return inserted;
    }

    this.localAnomalies.set(anomaly.id, anomaly);
    return anomaly;
  }

  async getAnomaliesByShipment(shipmentId: string): Promise<DbAnomaly[]> {
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('anomalies')
        .select('*')
        .eq('shipment_id', shipmentId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return Array.from(this.localAnomalies.values()).filter((a) => a.shipment_id === shipmentId);
  }

  async getAllAnomalies(orgId: string): Promise<(DbAnomaly & { shipment_reference?: string })[]> {
    const shipments = await this.getShipments(orgId);
    const shipmentMap = new Map(shipments.map((s) => [s.id, s.reference_number]));
    const shipmentIds = new Set(shipments.map((s) => s.id));

    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('anomalies')
        .select('*')
        .in('shipment_id', Array.from(shipmentIds));
      if (!error && data) {
        return data.map((a) => ({ ...a, shipment_reference: shipmentMap.get(a.shipment_id) || 'Unknown' }));
      }
    }

    return Array.from(this.localAnomalies.values())
      .filter((a) => shipmentIds.has(a.shipment_id))
      .map((a) => ({
        ...a,
        shipment_reference: shipmentMap.get(a.shipment_id) || 'Unknown'
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async resolveAnomaly(anomalyId: string): Promise<void> {
    if (this.isConnectedToSupabase && this.supabase) {
      await this.supabase.from('anomalies').update({ resolved: true }).eq('id', anomalyId);
    }
    const anomaly = this.localAnomalies.get(anomalyId);
    if (anomaly) {
      anomaly.resolved = true;
      this.localAnomalies.set(anomalyId, anomaly);
    }
  }

  async clearAnomaliesForShipment(shipmentId: string): Promise<void> {
    if (this.isConnectedToSupabase && this.supabase) {
      await this.supabase.from('anomalies').delete().eq('shipment_id', shipmentId);
    }
    for (const [id, a] of this.localAnomalies.entries()) {
      if (a.shipment_id === shipmentId) {
        this.localAnomalies.delete(id);
      }
    }
  }

  // ==========================================
  // Settings Operations
  // ==========================================
  async getSettings(orgId: string): Promise<AdvisorySettings & { id?: string; organization_id?: string; updated_at?: string }> {
    let raw: any = null;
    if (this.isConnectedToSupabase && this.supabase) {
      const { data, error } = await this.supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', orgId)
        .single();
      if (!error && data) raw = data;
    }
    if (!raw) {
      raw = this.localSettings.get(orgId);
    }

    if (!raw) {
      const defaultSettings: DbOrganizationSettings = {
        id: uuidv4(),
        organization_id: orgId,
        weight_tolerance_percent: 2.0,
        missing_hs_code_strictness: 'critical',
        confidence_threshold: 0.85,
        auto_flag_shipper_mismatch: true,
        auto_flag_port_mismatch: true,
        export_xml_format: 'WCO_3.0',
        updated_at: new Date().toISOString()
      };
      this.localSettings.set(orgId, defaultSettings);
      raw = defaultSettings;
    }

    return {
      id: raw.id,
      organization_id: orgId,
      weightTolerancePercent: Number(raw.weight_tolerance_percent ?? raw.weightTolerancePercent ?? 2.0),
      missingHsCodeStrictness: (raw.missing_hs_code_strictness ?? raw.missingHsCodeStrictness ?? 'critical') as any,
      confidenceThreshold: Number(raw.confidence_threshold ?? raw.confidenceThreshold ?? 0.85),
      autoFlagShipperMismatch: Boolean(raw.auto_flag_shipper_mismatch ?? raw.autoFlagShipperMismatch ?? true),
      autoFlagPortMismatch: Boolean(raw.auto_flag_port_mismatch ?? raw.autoFlagPortMismatch ?? true),
      exportXmlFormat: (raw.export_xml_format ?? raw.exportXmlFormat ?? 'WCO_3.0') as any,
      updated_at: raw.updated_at
    };
  }

  async updateSettings(orgId: string, updates: Partial<AdvisorySettings>): Promise<AdvisorySettings> {
    const existing = await this.getSettings(orgId);
    const updatedModel: DbOrganizationSettings = {
      id: existing.id || uuidv4(),
      organization_id: orgId,
      weight_tolerance_percent: updates.weightTolerancePercent ?? existing.weightTolerancePercent,
      missing_hs_code_strictness: updates.missingHsCodeStrictness ?? existing.missingHsCodeStrictness,
      confidence_threshold: updates.confidenceThreshold ?? existing.confidenceThreshold,
      auto_flag_shipper_mismatch: updates.autoFlagShipperMismatch ?? existing.autoFlagShipperMismatch,
      auto_flag_port_mismatch: updates.autoFlagPortMismatch ?? existing.autoFlagPortMismatch,
      export_xml_format: updates.exportXmlFormat ?? existing.exportXmlFormat,
      updated_at: new Date().toISOString()
    };

    if (this.isConnectedToSupabase && this.supabase) {
      await this.supabase
        .from('organization_settings')
        .upsert(updatedModel);
    }

    this.localSettings.set(orgId, updatedModel);
    return {
      weightTolerancePercent: updatedModel.weight_tolerance_percent,
      missingHsCodeStrictness: updatedModel.missing_hs_code_strictness,
      confidenceThreshold: updatedModel.confidence_threshold,
      autoFlagShipperMismatch: updatedModel.auto_flag_shipper_mismatch,
      autoFlagPortMismatch: updatedModel.auto_flag_port_mismatch,
      exportXmlFormat: updatedModel.export_xml_format as any
    };
  }

  // ==========================================
  // Insights Aggregation
  // ==========================================
  async getInsights(orgId: string) {
    const shipments = await this.getShipments(orgId);
    const allAnomalies = await this.getAllAnomalies(orgId);

    const totalShipments = shipments.length;
    const readyCount = shipments.filter((s) => s.status === 'ready_for_customs' || s.status === 'customs_cleared').length;
    const flaggedCount = shipments.filter((s) => s.status === 'flagged' || s.status === 'review_required').length;
    const automatedClearanceRate = totalShipments > 0 ? Math.round((readyCount / totalShipments) * 100) : 100;

    const criticalAnomalies = allAnomalies.filter((a) => a.severity === 'critical' && !a.resolved).length;
    const warningAnomalies = allAnomalies.filter((a) => a.severity === 'warning' && !a.resolved).length;

    // Supplier compliance analysis
    const supplierStats: Record<string, { totalDocs: number; anomalies: number; weightDeviations: number }> = {
      'Shenzhen MicroTech Electronic Devices Co., Ltd': { totalDocs: 14, anomalies: 4, weightDeviations: 3 },
      'Toyota Tsusho Automotive Corp': { totalDocs: 28, anomalies: 0, weightDeviations: 0 },
      'SunBio LifeSciences Ltd': { totalDocs: 9, anomalies: 2, weightDeviations: 0 },
      'Ningbo Maritime Exports Ltd': { totalDocs: 18, anomalies: 1, weightDeviations: 1 },
      'Bavaria Machinery Logistics AG': { totalDocs: 12, anomalies: 0, weightDeviations: 0 }
    };

    const supplierProfiles = Object.entries(supplierStats).map(([name, stat]) => {
      const complianceScore = Math.max(20, Math.round(100 - (stat.anomalies / stat.totalDocs) * 100));
      return {
        supplierName: name,
        complianceScore,
        totalShipments: stat.totalDocs,
        activeAnomalies: stat.anomalies,
        weightAccuracyRate: Math.max(60, 100 - stat.weightDeviations * 15),
        riskLevel: complianceScore > 85 ? 'Low' : complianceScore > 65 ? 'Medium' : 'High'
      };
    });

    // Predictive Port Bottlenecks
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
}

export const dbService = new DatabaseService();
