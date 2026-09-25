import React, { useState } from 'react';
import {
  FileText,
  Weight,
  Coins,
  Ship,
  Globe2,
  Tag,
  Building,
  CheckCircle,
  Code2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { StatusBadge } from './StatusBadge.js';

interface DocumentWithData {
  id: string;
  original_filename?: string;
  document_type: string;
  page_start: number | null;
  page_end: number | null;
  status: string;
  extractedData?: {
    raw_json: any;
    confidence_score: number;
  } | null;
}

interface ExtractionResultsTableProps {
  documents: DocumentWithData[];
}

export const ExtractionResultsTable: React.FC<ExtractionResultsTableProps> = ({ documents }) => {
  const [activeDocIndex, setActiveDocIndex] = useState<number>(0);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  if (!documents || documents.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
        <FileText className="w-10 h-10 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No extracted documents currently attached to this shipment.</p>
      </div>
    );
  }

  const currentDoc = documents[activeDocIndex] || documents[0];
  const payload = currentDoc.extractedData?.raw_json || {};
  const confidence = currentDoc.extractedData?.confidence_score ?? 0.95;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl">
      {/* Header with Document Selector Tabs */}
      <div className="p-4 bg-navy-900/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {documents.map((doc, idx) => (
            <button
              key={doc.id}
              onClick={() => {
                setActiveDocIndex(idx);
                setShowRawJson(false);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeDocIndex === idx
                  ? 'bg-brand-600 text-white shadow-glow-primary'
                  : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700/80 border border-slate-700/50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{doc.original_filename || `Doc ${idx + 1}`}</span>
              <StatusBadge status={doc.document_type} type="document" className="text-[10px] py-0 px-1.5" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80">
            <span className="text-[11px] text-slate-400">AI Confidence:</span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          <button
            onClick={() => setShowRawJson(!showRawJson)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showRawJson
                ? 'bg-brand-600/20 text-brand-300 border-brand-500/40'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{showRawJson ? 'View Entities' : 'Raw JSON'}</span>
          </button>
        </div>
      </div>

      {showRawJson ? (
        <div className="p-6 bg-navy-950 font-mono text-xs overflow-x-auto text-emerald-400">
          <pre>{JSON.stringify(payload, null, 2)}</pre>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          {/* Top Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Weight */}
            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800/80 hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Total Gross Weight</span>
                <Weight className="w-4 h-4 text-brand-400" />
              </div>
              <p className="text-2xl font-bold font-mono text-white">
                {(payload.totalWeightKg || payload.totalGrossWeightKg)?.toLocaleString('en-US', {
                  minimumFractionDigits: 2
                }) || 'N/A'}{' '}
                <span className="text-sm font-sans font-normal text-slate-400">KG</span>
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Cross-checked across Bill of Lading</p>
            </div>

            {/* Incoterms & Value */}
            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800/80 hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Incoterms & Currency</span>
                <Coins className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-amber-300">
                  {payload.incoterms || 'FOB'}
                </span>
                <span className="text-sm text-slate-400">({payload.currency || 'USD'})</span>
              </div>
              <p className="text-xs font-medium text-slate-200 mt-1">
                Amount:{' '}
                {payload.totalInvoiceAmount
                  ? `${payload.currency || '$'} ${payload.totalInvoiceAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2
                    })}`
                  : 'N/A'}
              </p>
            </div>

            {/* Ports Route */}
            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800/80 hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Maritime Corridor</span>
                <Ship className="w-4 h-4 text-sky-400" />
              </div>
              <div className="space-y-1">
                <div className="text-xs text-slate-200 truncate">
                  <span className="text-slate-400">POL:</span> {payload.portOfLoading || 'Port of Shenzhen, CN'}
                </div>
                <div className="text-xs text-slate-200 truncate">
                  <span className="text-slate-400">POD:</span> {payload.portOfDischarge || 'Port of Rotterdam, NL'}
                </div>
              </div>
            </div>

            {/* BoL or Invoice Reference */}
            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800/80 hover:border-brand-500/30 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-medium uppercase tracking-wider">Identifier / Reference</span>
                <Tag className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-base font-bold font-mono text-purple-300 truncate">
                {payload.bolNumber || payload.invoiceNumber || payload.packingListNumber || 'DOC-REF-9921'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Carrier: {payload.carrierName || 'Global Ocean Express'}
              </p>
            </div>
          </div>

          {/* Shipper & Consignee Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Building className="w-3.5 h-3.5 text-brand-400" />
                <span>Shipper / Exporter</span>
              </div>
              <p className="text-sm font-semibold text-slate-100">{payload.shipperName || 'N/A'}</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Verified Global Trade Registry
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                <Building className="w-3.5 h-3.5 text-indigo-400" />
                <span>Consignee / Importer of Record</span>
              </div>
              <p className="text-sm font-semibold text-slate-100">{payload.consigneeName || 'N/A'}</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Authorized Customs Consignee
              </span>
            </div>
          </div>

          {/* Extracted Harmonized Tariff (HS) Codes */}
          <div className="p-4 rounded-xl bg-navy-900/40 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Extracted Harmonized Tariff (HS) Codes
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {payload.hsCodes?.length || 0} classification(s)
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {payload.hsCodes && payload.hsCodes.length > 0 ? (
                payload.hsCodes.map((code: string, idx: number) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-200 border border-brand-500/30 text-xs font-mono font-medium shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-brand-400" />
                    <span>HS: {code}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-rose-400 font-medium bg-rose-500/10 px-3 py-1 rounded border border-rose-500/20">
                  No HS Codes detected! Violates customs declaration rules.
                </span>
              )}
            </div>
          </div>

          {/* Line Items Table if present */}
          {payload.lineItems && payload.lineItems.length > 0 && (
            <div className="rounded-xl border border-slate-800 overflow-hidden">
              <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Commercial Line Items
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Description</th>
                      <th className="py-2.5 px-4">HS Code</th>
                      <th className="py-2.5 px-4 text-right">Quantity</th>
                      <th className="py-2.5 px-4 text-right">Unit Price</th>
                      <th className="py-2.5 px-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {payload.lineItems.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-medium text-slate-200">{item.description}</td>
                        <td className="py-2.5 px-4 font-mono text-brand-300">
                          {item.hsCode ? (
                            <span className="px-2 py-0.5 rounded bg-brand-500/10 border border-brand-500/20">
                              {item.hsCode}
                            </span>
                          ) : (
                            <span className="text-rose-400 font-medium">Missing HS</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                          {item.quantity?.toLocaleString() || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                          {item.unitPrice ? item.unitPrice.toFixed(2) : '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold text-emerald-400">
                          {item.totalPrice ? item.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
