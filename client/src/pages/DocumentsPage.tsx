import React from 'react';
import {
  FileUp,
  FileCheck2,
  Cpu,
  Layers,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { DocumentUploader } from '../components/DocumentUploader.js';

export const DocumentsPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white font-display tracking-tight flex items-center gap-2.5">
          <FileUp className="w-6 h-6 text-brand-400" />
          Omnichannel Document Ingestion &amp; OCR Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Ingest unstructured global trade documents, split multi-page dossiers with Gemini 2.5 Pro, and trigger automated entity extraction.
        </p>
      </div>

      {/* Main Uploader Component */}
      <DocumentUploader />

      {/* Domain Knowledge & Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Capability 1 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center">
            <Layers className="w-5 h-5 text-brand-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Multi-Page PDF Router</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Takes merged shipping dossiers and automatically splits them into distinct trade documents: Commercial Invoices, Bills of Lading, Packing Lists, and Certificates of Origin.
          </p>
        </div>

        {/* Capability 2 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-sky-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Contextual LLM Extraction</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gemini 2.5 Pro extracts key-value entities (Shipper, Consignee, HS Codes, Total Weight, Currency, Incoterms) completely immune to vendor layout changes.
          </p>
        </div>

        {/* Capability 3 */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-sm font-bold text-white">Cross-Document Rule Engine</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Cross-references weights, HS codes, and party entities across documents within the same shipment to preempt demurrage fines and customs holds.
          </p>
        </div>
      </div>
    </div>
  );
};
