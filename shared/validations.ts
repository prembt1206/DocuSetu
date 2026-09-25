import { z } from 'zod';

// ==========================================
// Document Classification Schemas
// ==========================================
export const DocumentTypeEnum = z.enum([
  'bill_of_lading',
  'commercial_invoice',
  'packing_list',
  'certificate_of_origin',
  'customs_declaration',
  'unknown'
]);
export type DocumentType = z.infer<typeof DocumentTypeEnum>;

export const DocumentClassificationSchema = z.object({
  documentType: DocumentTypeEnum,
  confidence: z.number().min(0).max(1),
  splitPages: z.array(
    z.object({
      documentType: DocumentTypeEnum,
      pageStart: z.number().int().positive(),
      pageEnd: z.number().int().positive(),
      confidence: z.number().min(0).max(1),
      summary: z.string().optional()
    })
  ).optional()
});
export type DocumentClassification = z.infer<typeof DocumentClassificationSchema>;

// ==========================================
// Extracted Document Entities Schemas
// ==========================================
export const IncotermsEnum = z.enum([
  'EXW', 'FCA', 'CPT', 'CIP', 'DAP', 'DPU', 'DDP', 'FAS', 'FOB', 'CFR', 'CIF'
]);
export type Incoterm = z.infer<typeof IncotermsEnum>;

export const ExtractedInvoiceSchema = z.object({
  shipperName: z.string().min(1),
  consigneeName: z.string().min(1),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
  incoterms: IncotermsEnum.optional(),
  currency: z.string().length(3),
  totalInvoiceAmount: z.number().positive().optional(),
  totalWeightKg: z.number().positive(),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  hsCodes: z.array(z.string().regex(/^\d{6,10}$/)).min(1),
  lineItems: z.array(
    z.object({
      description: z.string(),
      hsCode: z.string().optional(),
      quantity: z.number().optional(),
      unitPrice: z.number().optional(),
      totalPrice: z.number().optional()
    })
  ).optional()
});
export type ExtractedInvoice = z.infer<typeof ExtractedInvoiceSchema>;

export const ExtractedBoLSchema = z.object({
  bolNumber: z.string().min(1),
  carrierName: z.string().optional(),
  vesselName: z.string().optional(),
  voyageNumber: z.string().optional(),
  shipperName: z.string().min(1),
  consigneeName: z.string().min(1),
  notifyParty: z.string().optional(),
  portOfLoading: z.string().min(1),
  portOfDischarge: z.string().min(1),
  totalWeightKg: z.number().positive(),
  measurementCbm: z.number().positive().optional(),
  containerNumbers: z.array(z.string()).optional(),
  goodsDescription: z.string().optional(),
  issuedDate: z.string().optional()
});
export type ExtractedBoL = z.infer<typeof ExtractedBoLSchema>;

export const ExtractedPackingListSchema = z.object({
  packingListNumber: z.string().optional(),
  shipperName: z.string().min(1),
  consigneeName: z.string().min(1),
  totalPackages: z.number().int().positive().optional(),
  totalNetWeightKg: z.number().positive().optional(),
  totalGrossWeightKg: z.number().positive(),
  totalVolumeCbm: z.number().positive().optional(),
  containerNumbers: z.array(z.string()).optional()
});
export type ExtractedPackingList = z.infer<typeof ExtractedPackingListSchema>;

export const ExtractedCertificateOfOriginSchema = z.object({
  certificateNumber: z.string().min(1),
  issuingAuthority: z.string().min(1),
  exporterName: z.string().min(1),
  producerName: z.string().optional(),
  importerName: z.string().min(1),
  countryOfOrigin: z.string().min(2),
  countryOfDestination: z.string().min(2),
  hsCodes: z.array(z.string()).min(1),
  transportDetails: z.string().optional(),
  issueDate: z.string().optional()
});
export type ExtractedCertificateOfOrigin = z.infer<typeof ExtractedCertificateOfOriginSchema>;

export const ExtractedCustomsDeclarationSchema = z.object({
  declarationNumber: z.string().min(1),
  declarantName: z.string().min(1),
  exporterName: z.string().optional(),
  importerName: z.string().optional(),
  customsOffice: z.string().optional(),
  declarationType: z.string().optional(),
  totalDeclaredValue: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  totalGrossWeightKg: z.number().positive().optional(),
  hsCodes: z.array(z.string()).min(1)
});
export type ExtractedCustomsDeclaration = z.infer<typeof ExtractedCustomsDeclarationSchema>;

// Generic Extracted Data Schema
export const ExtractedDataPayloadSchema = z.union([
  ExtractedInvoiceSchema,
  ExtractedBoLSchema,
  ExtractedPackingListSchema,
  ExtractedCertificateOfOriginSchema,
  ExtractedCustomsDeclarationSchema,
  z.record(z.string(), z.any())
]);
export type ExtractedDataPayload = z.infer<typeof ExtractedDataPayloadSchema>;

// ==========================================
// Advisory & Settings Configuration Schema
// ==========================================
export const AdvisorySettingsSchema = z.object({
  weightTolerancePercent: z.number().min(0).max(50).default(2.0),
  missingHsCodeStrictness: z.enum(['warning', 'critical']).default('critical'),
  confidenceThreshold: z.number().min(0.1).max(1.0).default(0.85),
  autoFlagShipperMismatch: z.boolean().default(true),
  autoFlagPortMismatch: z.boolean().default(true),
  exportXmlFormat: z.enum(['WCO_3.0', 'US_CBP_ACE', 'EU_SINGLE_WINDOW']).default('WCO_3.0')
});
export type AdvisorySettings = z.infer<typeof AdvisorySettingsSchema>;

// ==========================================
// Anomalies & Rules Schemas
// ==========================================
export const AnomalySeverityEnum = z.enum(['warning', 'critical']);
export type AnomalySeverity = z.infer<typeof AnomalySeverityEnum>;

export const AnomalyRuleTypeEnum = z.enum([
  'weight_mismatch',
  'missing_hs_code',
  'shipper_mismatch',
  'consignee_mismatch',
  'port_mismatch',
  'low_confidence_extraction',
  'incoterm_inconsistency',
  'expired_certificate'
]);
export type AnomalyRuleType = z.infer<typeof AnomalyRuleTypeEnum>;

export const AnomalyRecordSchema = z.object({
  id: z.string().uuid().optional(),
  shipmentId: z.string().uuid(),
  ruleType: AnomalyRuleTypeEnum,
  severity: AnomalySeverityEnum,
  description: z.string().min(1),
  sourceDocuments: z.array(z.string()).optional(),
  resolved: z.boolean().default(false),
  resolvedAt: z.string().optional(),
  createdAt: z.string().optional()
});
export type AnomalyRecord = z.infer<typeof AnomalyRecordSchema>;

// ==========================================
// Shipment & Document Records
// ==========================================
export const ShipmentStatusEnum = z.enum([
  'pending',
  'processing',
  'review_required',
  'ready_for_customs',
  'customs_cleared',
  'flagged'
]);
export type ShipmentStatus = z.infer<typeof ShipmentStatusEnum>;

export const CreateShipmentSchema = z.object({
  referenceNumber: z.string().min(1),
  portOfLoading: z.string().optional(),
  portOfDischarge: z.string().optional(),
  organizationId: z.string().uuid().optional()
});
export type CreateShipmentInput = z.infer<typeof CreateShipmentSchema>;

// ==========================================
// Gmail Validation & Auth Schemas
// ==========================================
export interface GmailValidationResult {
  isValid: boolean;
  error?: string;
  normalizedEmail?: string;
}

/**
 * Strict Gmail validation:
 * Validates email format, verifies domain is exactly gmail.com,
 * and checks username constraints (length, allowed characters, dot rules).
 */
export function validateGmail(email: string): GmailValidationResult {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email address cannot be empty.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic structure check
  if (!trimmed.includes('@')) {
    return { isValid: false, error: 'Email must contain an @ symbol.' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'Email format is invalid (multiple @ symbols).' };
  }

  const [username, domain] = parts;

  // Domain verification: must be gmail.com or googlemail.com
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') {
    return {
      isValid: false,
      error: `Invalid domain "@${domain}". Only valid @gmail.com accounts are permitted.`
    };
  }

  if (!username || username.length === 0) {
    return { isValid: false, error: 'Username before @ cannot be empty.' };
  }

  if (username.length < 6) {
    return { isValid: false, error: 'Gmail username must be at least 6 characters long (e.g., officer.smith@gmail.com).' };
  }

  if (username.length > 30) {
    return { isValid: false, error: 'Gmail username cannot exceed 30 characters.' };
  }

  if (username.startsWith('.') || username.endsWith('.')) {
    return { isValid: false, error: 'Gmail username cannot start or end with a period.' };
  }

  if (username.includes('..')) {
    return { isValid: false, error: 'Gmail username cannot contain consecutive periods (..).' };
  }

  // Allowed characters in genuine Gmail username: letters, digits, and dots
  const validCharsRegex = /^[a-z0-9.]+$/;
  if (!validCharsRegex.test(username)) {
    return { isValid: false, error: 'Gmail usernames may only contain letters (a-z), numbers (0-9), and periods (.).' };
  }

  return {
    isValid: true,
    normalizedEmail: `${username}@${domain}`
  };
}

