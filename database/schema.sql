-- =========================================================
-- DocuSetu - Intelligent Document Processing Platform Schema
-- PostgreSQL with Row Level Security (RLS) & Multi-Tenancy
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Tenants)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Users (Supports both Supabase Auth and Direct Database Users with Hashed Passwords)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    password_hash TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'Customs Broker & Compliance Officer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Organization Advisory Settings
CREATE TABLE IF NOT EXISTS organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    weight_tolerance_percent DECIMAL(5,2) DEFAULT 2.00,
    missing_hs_code_strictness VARCHAR(50) DEFAULT 'critical',
    confidence_threshold DECIMAL(3,2) DEFAULT 0.85,
    auto_flag_shipper_mismatch BOOLEAN DEFAULT TRUE,
    auto_flag_port_mismatch BOOLEAN DEFAULT TRUE,
    export_xml_format VARCHAR(50) DEFAULT 'WCO_3.0',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shipments
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    reference_number VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, review_required, ready_for_customs, customs_cleared, flagged
    port_of_loading VARCHAR(100),
    port_of_discharge VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Documents
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    original_filename VARCHAR(255),
    document_type VARCHAR(100), -- bill_of_lading, commercial_invoice, packing_list, certificate_of_origin, customs_declaration, unknown
    page_start INT,
    page_end INT,
    status VARCHAR(50) DEFAULT 'uploaded', -- uploaded, parsing, extracted, validated, error
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Extracted Data (JSONB for flexibility, validated by Zod in App layer)
CREATE TABLE IF NOT EXISTS extracted_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    raw_json JSONB NOT NULL,
    confidence_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Validation Anomalies
CREATE TABLE IF NOT EXISTS anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    rule_type VARCHAR(100) NOT NULL, -- 'weight_mismatch', 'missing_hs_code', 'shipper_mismatch', etc.
    severity VARCHAR(50) NOT NULL, -- 'warning', 'critical'
    description TEXT NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Storage bucket for trade documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('trade-documents', 'trade-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =========================================================
-- Row Level Security (RLS) / Data Isolation Policies
-- =========================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomalies ENABLE ROW LEVEL SECURITY;

-- Helper function to fetch current authenticated user's organization
CREATE OR REPLACE FUNCTION get_current_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations Policies
CREATE POLICY "Users can view their own organization"
ON organizations FOR SELECT
USING (id = get_current_user_org_id());

-- Users Policies
CREATE POLICY "Users can view users within same organization"
ON users FOR SELECT
USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can insert their own user record"
ON users FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update their own user record"
ON users FOR UPDATE
USING (id = auth.uid());

-- Organization Settings Policies
CREATE POLICY "Users can view their organization settings"
ON organization_settings FOR SELECT
USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can update their organization settings"
ON organization_settings FOR UPDATE
USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can insert their organization settings"
ON organization_settings FOR INSERT
WITH CHECK (organization_id = get_current_user_org_id());

-- Shipments Policies
CREATE POLICY "Users can view their organization's shipments"
ON shipments FOR SELECT
USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can insert their organization's shipments"
ON shipments FOR INSERT
WITH CHECK (organization_id = get_current_user_org_id());

CREATE POLICY "Users can update their organization's shipments"
ON shipments FOR UPDATE
USING (organization_id = get_current_user_org_id());

CREATE POLICY "Users can delete their organization's shipments"
ON shipments FOR DELETE
USING (organization_id = get_current_user_org_id());

-- Documents Policies (Secured via shipment's organization)
CREATE POLICY "Users can view their organization's documents"
ON documents FOR SELECT
USING (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can insert documents for their organization"
ON documents FOR INSERT
WITH CHECK (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can update documents for their organization"
ON documents FOR UPDATE
USING (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can delete documents for their organization"
ON documents FOR DELETE
USING (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

-- Extracted Data Policies (Secured via document -> shipment -> organization)
CREATE POLICY "Users can view their organization's extracted data"
ON extracted_data FOR SELECT
USING (
    document_id IN (
        SELECT d.id FROM documents d
        JOIN shipments s ON d.shipment_id = s.id
        WHERE s.organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can insert extracted data for their organization"
ON extracted_data FOR INSERT
WITH CHECK (
    document_id IN (
        SELECT d.id FROM documents d
        JOIN shipments s ON d.shipment_id = s.id
        WHERE s.organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can update extracted data for their organization"
ON extracted_data FOR UPDATE
USING (
    document_id IN (
        SELECT d.id FROM documents d
        JOIN shipments s ON d.shipment_id = s.id
        WHERE s.organization_id = get_current_user_org_id()
    )
);

-- Anomalies Policies (Secured via shipment -> organization)
CREATE POLICY "Users can view their organization's anomalies"
ON anomalies FOR SELECT
USING (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can insert anomalies for their organization"
ON anomalies FOR INSERT
WITH CHECK (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);

CREATE POLICY "Users can update anomalies for their organization"
ON anomalies FOR UPDATE
USING (
    shipment_id IN (
        SELECT id FROM shipments WHERE organization_id = get_current_user_org_id()
    )
);
