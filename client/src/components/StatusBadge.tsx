import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  type?: 'shipment' | 'document' | 'anomaly';
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'shipment', className = '' }) => {
  const norm = status.toLowerCase();

  if (type === 'anomaly') {
    if (norm === 'critical') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          Critical Block
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Warning Discrepancy
      </span>
    );
  }

  if (type === 'document') {
    const docLabels: Record<string, { label: string; color: string }> = {
      commercial_invoice: { label: 'Commercial Invoice', color: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
      bill_of_lading: { label: 'Bill of Lading (BoL)', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
      packing_list: { label: 'Packing List', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
      certificate_of_origin: { label: 'Certificate of Origin', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
      customs_declaration: { label: 'Customs Declaration', color: 'bg-teal-500/15 text-teal-300 border-teal-500/30' },
      unknown: { label: 'Unclassified Trade PDF', color: 'bg-slate-700/50 text-slate-300 border-slate-600' }
    };

    const docConfig = docLabels[norm] || { label: status, color: 'bg-slate-700/50 text-slate-300 border-slate-600' };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${docConfig.color} ${className}`}>
        {docConfig.label}
      </span>
    );
  }

  // Shipment Status
  switch (norm) {
    case 'ready_for_customs':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm ${className}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Ready for Customs
        </span>
      );
    case 'customs_cleared':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/40 shadow-sm ${className}`}>
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-300" />
          Customs Cleared
        </span>
      );
    case 'flagged':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm ${className}`}>
          <AlertCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          Flagged (Discrepancy)
        </span>
      );
    case 'review_required':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Review Required
        </span>
      );
    case 'processing':
    case 'parsing':
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/40 ${className}`}>
          <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
          Processing AI
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 ${className}`}>
          <Clock className="w-3.5 h-3.5" />
          Pending Ingestion
        </span>
      );
  }
};
