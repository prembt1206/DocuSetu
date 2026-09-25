# DocuSetu 🚢
### Intelligent Document Processing (IDP) Platform for Global Supply Chain & Customs

DocuSetu is a production-ready Intelligent Document Processing (IDP) platform specifically engineered to eliminate the **"Global Trade Paper Choke."** Freight forwarders and customs brokers traditionally manually review highly variable PDFs (Bills of Lading, Commercial Invoices, Packing Lists), leading to demurrage costs, compliance fines, and data blind spots. DocuSetu shifts this to a contextual AI-driven pipeline that automates customs clearance data entry, mitigates supplier risk, and maps predictive supply chain bottlenecks.

---

## 🌟 Key Architecture & Capabilities

1. **Omnichannel Ingestion & Pre-processing (`/documents`)**
   - Secure drag-and-drop ingestion for PDF and ZIP documents up to 15MB.
   - Background OCR & text extraction pre-processing for scanned or rotated documents.
   - 1-Click Interactive Evaluation Suite (Load Weight Discrepancy Consignments, Compliant Ocean Cargo, and Pharma Tariff Warning presets).

2. **AI-Powered Multi-Page Classification Router**
   - Uses `@google/genai` (Gemini 2.5 Pro) to analyze multi-page merged trade packets and determine document boundaries and types (`bill_of_lading`, `commercial_invoice`, `packing_list`, `certificate_of_origin`, `customs_declaration`).

3. **Contextual LLM Entity Extraction**
   - Extracts structured key-value entities: Shipper, Consignee, HS Codes, Total Gross Weight (KG), Incoterms (FOB, CIF, etc.), Currency, Port of Loading, Port of Discharge.
   - Immune to vendor layout and formatting shifts.
   - Enforced by strict shared **Zod schemas** (`/shared/validations.ts`).

4. **Cross-Document Validation Rule Engine**
   - Cross-references extracted entities across all documents within a shipment.
   - **Weight Discrepancy Detection**: Compares Commercial Invoice weight vs Bill of Lading weight vs Packing List weight. If discrepancy exceeds the configured tolerance (e.g. ±2.0%), automatically flags a **Critical Block** anomaly and displays a prominent **Red Warning Banner**.
   - **Tariff Strictness Checks**: Verifies 6-10 digit Harmonized Tariff (HS) codes.
   - **Party Entity & Route Verification**: Verifies consignor, consignee, and maritime port consistency.

5. **Government Customs XML Export**
   - User approves the verified extraction, triggering automated generation of standard **World Customs Organization (WCO Data Model 3.0 / GOVCBR)** or **US CBP ACE** compliant XML.
   - Live formatted XML code inspection, one-click clipboard copy, and `.xml` file download.

6. **Knowledge Discovery Dashboard (`/dashboard`)**
   - Automated Customs Clearance Readiness rate (% green lane clearance).
   - Supplier Compliance Risk Profiles (vendor quality scores, historical consignments, active anomalies).
   - Predictive Supply Chain Bottlenecks (dwell time risk for Port of Rotterdam, Port of Los Angeles, Port of Antwerp, and Port of Hamburg).

7. **Multi-Tenant Row-Level Security (RLS)**
   - Strict tenant isolation enforced in PostgreSQL / Supabase schema for `organizations`, `users`, `shipments`, `documents`, `extracted_data`, and `anomalies`.

---

## 🛠 Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, React Router 7.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **AI Engine**: Google GenAI official SDK (`@google/genai`), Gemini 2.5 Pro (`gemini-2.5-pro`) with Structured JSON Outputs.
- **Database & Auth**: Supabase (PostgreSQL with RLS), Supabase Auth.
- **Validation**: Zod (shared schemas for client & server).
- **File Parsing**: Multer (15MB limit, PDF/ZIP filters), `pdf-parse`.

---

## 📁 Repository Structure

```
/DocuSetu
  ├── /client                 # React Vite frontend
  │   ├── /src
  │   │   ├── /components     # AppLayout, DocumentUploader, ExtractionResultsTable,
  │   │   │                   # ValidationWarningBanner, InsightsDashboard, StatusBadge, etc.
  │   │   ├── /pages          # LoginPage, DashboardPage, ShipmentsPage, ShipmentDetailPage,
  │   │   │                   # DocumentsPage, SettingsPage
  │   │   ├── /hooks          # useAuth (Supabase Auth & Demo Session)
  │   │   └── /lib            # API client and Supabase client
  │   └── tailwind.config.js
  ├── /server                 # Express.js TypeScript Backend
  │   ├── /src
  │   │   ├── /controllers    # upload, process, validation, shipment, settings, insights
  │   │   ├── /middlewares    # authMiddleware, uploadMiddleware (15MB Multer), errorHandler
  │   │   ├── /routes         # API v1 Router
  │   │   ├── /services       # geminiService, ruleEngineService, dbService,
  │   │   │                   # xmlExportService, pdfService
  │   │   └── index.ts        # Server entry point (Port 5000)
  ├── /shared                 # Shared Zod validation schemas & TypeScript types
  │   └── validations.ts
  ├── /supabase               # PostgreSQL migration & seed scripts
  │   ├── /migrations
  │   │   └── 01_initial_schema.sql  # Complete schema & RLS policies
  │   └── seed.sql            # Realistic consignments, documents, anomalies
  ├── /sample_docs            # Sample PDFs for testing
  └── package.json            # Monorepo orchestration scripts
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js v18+ (tested on Node v24)
- npm

### 2. Environment Setup
The repository comes configured with working development defaults. If you wish to use your own Supabase or Gemini API key, copy `.env.example` to `.env`:
```env
# Frontend (Vite)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_BASE_URL=http://localhost:5000/api/v1

# Backend (Node)
PORT=5000
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_google_gemini_api_key
```

### 3. Run the Monorepo
From the root directory:
```bash
# Start both Server and Client concurrently:
npm.cmd run dev

# Or run separately:
npm.cmd run dev:server    # Runs on http://localhost:5000
npm.cmd run dev:client    # Runs on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Testing the Acceptance Criteria

### Testing the Critical Weight Mismatch (5,000kg vs 5,500kg)
1. Log in (Click **"Instant One-Click Demo Access"** on the login page).
2. Click **"Omnichannel Ingestion"** or **"Ingest Trade PDF"**.
3. Under **1-Click Test Scenarios**, click:
   👉 **"Weight Discrepancy (10%): Invoice 5,000kg vs BoL 5,500kg"**
   *(Or drag & drop `sample_docs/Commercial_Invoice_5000kg.pdf` and `sample_docs/Bill_Of_Lading_5500kg.pdf`).*
4. The system will automatically:
   - Run OCR and Gemini 2.5 Pro classification & extraction.
   - Run the **Cross-Document Rule Engine**.
   - Detect that Commercial Invoice has 5,000.00 kg and Bill of Lading has 5,500.00 kg (+10.00% difference, exceeding the configured 2.0% tolerance).
   - Redirect to `/shipments/:id` and prominently display the **Red Critical Warning Banner**:
     > *"Critical Trade Discrepancy Detected: Commercial Invoice declares 5,000.00 kg while Bill of Lading declares 5,500.00 kg (10.00% difference exceeds allowable ±2.0% tolerance). High risk of demurrage fines and customs hold."*

### Testing Compliant Consignment & WCO Customs XML Export
1. On `/documents`, click **"Compliant Consignment: Automotive Parts (Nagoya → LA)"**.
2. Both documents declare matching 12,450.00 kg.
3. The validation banner shows green **"Cross-Document Validation Passed (100% Compliant)"**.
4. Click **"Approve & Export Customs XML"**.
5. The WCO 3.0 Customs Declaration XML modal will open with formatted XML, Copy, and Download actions!

### Testing Configurable Advisory Settings
1. Navigate to `/settings`.
2. Adjust the **Weight Tolerance Mismatch Limit** slider (e.g. adjust to 12.0%).
3. Click **"Save Advisory Configuration"**.
4. Return to the shipment and click **"Re-Verify"** — the anomaly will dynamically adapt based on your updated tolerance threshold!

---

## 🔒 Security & Row Level Security (RLS)
Every table (`organizations`, `users`, `shipments`, `documents`, `extracted_data`, `anomalies`, `organization_settings`) implements strict PostgreSQL Row Level Security:
```sql
CREATE POLICY "Users can view their organization's shipments" 
ON shipments FOR SELECT 
USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));
```
Multer strictly restricts uploads to `application/pdf` and `application/zip` up to 15MB. All Gemini API keys remain strictly secure on the Node.js backend.
