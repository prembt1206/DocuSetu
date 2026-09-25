-- =========================================================
-- DocuSetu Seed Data
-- Realistic Global Supply Chain & Customs Shipments
-- =========================================================

-- 1. Create Demo Organization
INSERT INTO organizations (id, name, created_at)
VALUES 
    ('11111111-1111-4111-8111-111111111111', 'Apex Global Freight & Customs Brokerage', NOW() - INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 2. Organization Advisory Settings
INSERT INTO organization_settings (
    id,
    organization_id,
    weight_tolerance_percent,
    missing_hs_code_strictness,
    confidence_threshold,
    auto_flag_shipper_mismatch,
    auto_flag_port_mismatch,
    export_xml_format
) VALUES (
    '22222222-2222-4222-8222-222222222222',
    '11111111-1111-4111-8111-111111111111',
    2.00,
    'critical',
    0.85,
    TRUE,
    TRUE,
    'WCO_3.0'
) ON CONFLICT (organization_id) DO UPDATE SET
    weight_tolerance_percent = EXCLUDED.weight_tolerance_percent;

-- 3. Shipments
-- Shipment A: Discrepancy (Invoice 5000kg vs BoL 5500kg)
INSERT INTO shipments (
    id,
    organization_id,
    reference_number,
    status,
    port_of_loading,
    port_of_discharge,
    created_at
) VALUES (
    '33333333-3333-4333-8333-333333333331',
    '11111111-1111-4111-8111-111111111111',
    'SHP-2026-8841',
    'flagged',
    'Port of Shenzhen, CN',
    'Port of Rotterdam, NL',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Shipment B: Compliant Ready for Customs
INSERT INTO shipments (
    id,
    organization_id,
    reference_number,
    status,
    port_of_loading,
    port_of_discharge,
    created_at
) VALUES (
    '33333333-3333-4333-8333-333333333332',
    '11111111-1111-4111-8111-111111111111',
    'SHP-2026-9022',
    'ready_for_customs',
    'Port of Nagoya, JP',
    'Port of Los Angeles, US',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Shipment C: Missing HS Code anomaly
INSERT INTO shipments (
    id,
    organization_id,
    reference_number,
    status,
    port_of_loading,
    port_of_discharge,
    created_at
) VALUES (
    '33333333-3333-4333-8333-333333333333',
    '11111111-1111-4111-8111-111111111111',
    'SHP-2026-7734',
    'review_required',
    'Jawaharlal Nehru Port (JNPT), IN',
    'Port of Antwerp, BE',
    NOW() - INTERVAL '4 hours'
) ON CONFLICT (id) DO NOTHING;

-- 4. Documents for Shipment A (SHP-2026-8841)
-- Document A1: Commercial Invoice (5,000 kg)
INSERT INTO documents (
    id,
    shipment_id,
    file_url,
    original_filename,
    document_type,
    page_start,
    page_end,
    status,
    created_at
) VALUES (
    '44444444-4444-4444-8444-444444444401',
    '33333333-3333-4333-8333-333333333331',
    '/uploads/SHP-8841-Commercial-Invoice.pdf',
    'SHP-8841-Commercial-Invoice.pdf',
    'commercial_invoice',
    1,
    2,
    'validated',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Document A2: Bill of Lading (5,500 kg - Mismatch!)
INSERT INTO documents (
    id,
    shipment_id,
    file_url,
    original_filename,
    document_type,
    page_start,
    page_end,
    status,
    created_at
) VALUES (
    '44444444-4444-4444-8444-444444444402',
    '33333333-3333-4333-8333-333333333331',
    '/uploads/SHP-8841-Bill-of-Lading.pdf',
    'SHP-8841-Bill-of-Lading.pdf',
    'bill_of_lading',
    3,
    3,
    'validated',
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- 5. Extracted Data for Shipment A
INSERT INTO extracted_data (
    id,
    document_id,
    raw_json,
    confidence_score,
    created_at
) VALUES (
    '55555555-5555-4555-8555-555555555501',
    '44444444-4444-4444-8444-444444444401',
    '{
        "shipperName": "Shenzhen MicroTech Electronic Devices Co., Ltd",
        "consigneeName": "EuroSupply Chain Logistics B.V.",
        "invoiceNumber": "INV-SZ-2026-9901",
        "invoiceDate": "2026-09-20",
        "incoterms": "FOB",
        "currency": "EUR",
        "totalInvoiceAmount": 284500.00,
        "totalWeightKg": 5000.00,
        "portOfLoading": "Port of Shenzhen, CN",
        "portOfDischarge": "Port of Rotterdam, NL",
        "hsCodes": ["85423190", "84717050"],
        "lineItems": [
            {
                "description": "High-Density Microcontrollers 64-bit",
                "hsCode": "85423190",
                "quantity": 10000,
                "unitPrice": 18.50,
                "totalPrice": 185000.00
            },
            {
                "description": "Enterprise NVMe Solid State Drives 2TB",
                "hsCode": "84717050",
                "quantity": 995,
                "unitPrice": 100.00,
                "totalPrice": 99500.00
            }
        ]
    }',
    0.96,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO extracted_data (
    id,
    document_id,
    raw_json,
    confidence_score,
    created_at
) VALUES (
    '55555555-5555-4555-8555-555555555502',
    '44444444-4444-4444-8444-444444444402',
    '{
        "bolNumber": "MAEU9921448291",
        "carrierName": "Maersk Line Global",
        "vesselName": "MAERSK MC-KINNEY MOLLER",
        "voyageNumber": "2609W",
        "shipperName": "Shenzhen MicroTech Electronic Devices Co., Ltd",
        "consigneeName": "EuroSupply Chain Logistics B.V.",
        "notifyParty": "Rotterdam Gateway Customs Brokers",
        "portOfLoading": "Port of Shenzhen, CN",
        "portOfDischarge": "Port of Rotterdam, NL",
        "totalWeightKg": 5500.00,
        "measurementCbm": 28.40,
        "containerNumbers": ["MSKU7829104", "MSKU7829110"],
        "goodsDescription": "2x 40HQ Containers: Electronic Microcontrollers & NVMe Storage Modules",
        "issuedDate": "2026-09-22"
    }',
    0.94,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- 6. Anomalies for Shipment A (Weight Mismatch 5000kg vs 5500kg = 10% discrepancy)
INSERT INTO anomalies (
    id,
    shipment_id,
    rule_type,
    severity,
    description,
    resolved,
    created_at
) VALUES (
    '66666666-6666-4666-8666-666666666601',
    '33333333-3333-4333-8333-333333333331',
    'weight_mismatch',
    'critical',
    'Discrepancy detected: Commercial Invoice reports 5,000.00 kg while Bill of Lading (MAEU9921448291) declares 5,500.00 kg (+10.00% difference exceeds configured 2.0% tolerance). Demurrage & customs audit risk.',
    FALSE,
    NOW() - INTERVAL '2 days'
) ON CONFLICT (id) DO NOTHING;

-- 7. Documents and Data for Shipment B (SHP-2026-9022 - Compliant)
INSERT INTO documents (
    id,
    shipment_id,
    file_url,
    original_filename,
    document_type,
    page_start,
    page_end,
    status,
    created_at
) VALUES 
    ('44444444-4444-4444-8444-444444444403', '33333333-3333-4333-8333-333333333332', '/uploads/SHP-9022-Invoice.pdf', 'SHP-9022-Invoice.pdf', 'commercial_invoice', 1, 1, 'validated', NOW() - INTERVAL '1 day'),
    ('44444444-4444-4444-8444-444444444404', '33333333-3333-4333-8333-333333333332', '/uploads/SHP-9022-BoL.pdf', 'SHP-9022-BoL.pdf', 'bill_of_lading', 2, 2, 'validated', NOW() - INTERVAL '1 day'),
    ('44444444-4444-4444-8444-444444444405', '33333333-3333-4333-8333-333333333332', '/uploads/SHP-9022-PackingList.pdf', 'SHP-9022-PackingList.pdf', 'packing_list', 3, 3, 'validated', NOW() - INTERVAL '1 day');

INSERT INTO extracted_data (id, document_id, raw_json, confidence_score, created_at)
VALUES 
(
    '55555555-5555-4555-8555-555555555503',
    '44444444-4444-4444-8444-444444444403',
    '{"shipperName": "Toyota Tsusho Automotive Corp", "consigneeName": "North America Auto Assembly LLC", "incoterms": "CIF", "currency": "USD", "totalInvoiceAmount": 412000.00, "totalWeightKg": 12450.00, "hsCodes": ["87082990"]}',
    0.98,
    NOW() - INTERVAL '1 day'
),
(
    '55555555-5555-4555-8555-555555555504',
    '44444444-4444-4444-8444-444444444404',
    '{"bolNumber": "ONE771092841", "carrierName": "Ocean Network Express", "shipperName": "Toyota Tsusho Automotive Corp", "consigneeName": "North America Auto Assembly LLC", "portOfLoading": "Port of Nagoya, JP", "portOfDischarge": "Port of Los Angeles, US", "totalWeightKg": 12450.00}',
    0.97,
    NOW() - INTERVAL '1 day'
),
(
    '55555555-5555-4555-8555-555555555505',
    '44444444-4444-4444-8444-444444444405',
    '{"packingListNumber": "PL-TY-9022", "shipperName": "Toyota Tsusho Automotive Corp", "consigneeName": "North America Auto Assembly LLC", "totalGrossWeightKg": 12450.00, "totalPackages": 480}',
    0.99,
    NOW() - INTERVAL '1 day'
);
