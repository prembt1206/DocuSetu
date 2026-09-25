import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, RotateCw, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../lib/api.js';

export interface AnomalyItem {
  id: string;
  rule_type: string;
  severity: 'warning' | 'critical';
  description: string;
  resolved: boolean;
  created_at: string;
}

interface ValidationWarningBannerProps {
  anomalies: AnomalyItem[];
  shipmentId: string;
  onRefresh?: () => void;
}

export const ValidationWarningBanner: React.FC<ValidationWarningBannerProps> = ({
  anomalies,
  shipmentId,
  onRefresh
}) => {
  const unresolved = anomalies.filter((a) => !a.resolved);
  const critical = unresolved.filter((a) => a.severity === 'critical');
  const warnings = unresolved.filter((a) => a.severity === 'warning');

  const handleResolve = async (anomalyId: string) => {
    try {
      await api.resolveAnomaly(anomalyId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to resolve anomaly: ${err.message}`);
    }
  };

  const handleRevalidate = async () => {
    try {
      await api.validateShipment(shipmentId);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Validation error: ${err.message}`);
    }
  };

  if (unresolved.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between shadow-glow-emerald">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-emerald-300">
              Cross-Document Validation Passed (100% Compliant)
            </h4>
            <p className="text-xs text-slate-300">
              Commercial Invoice, Bill of Lading, and Packing List are synchronized within tolerance thresholds. Ready for Customs XML Generation.
            </p>
          </div>
        </div>
        <button
          onClick={handleRevalidate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5 text-slate-400" />
          Re-Check Rules
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {critical.length > 0 && (
        <div className="p-5 rounded-xl bg-rose-950/40 border border-rose-500/40 shadow-glow-rose">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-rose-200 uppercase tracking-wide">
                    Critical Trade Discrepancy Detected ({critical.length})
                  </h4>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    Customs Hold Risk
                  </span>
                </div>
                <p className="text-xs text-rose-300/90 mt-1">
                  Cross-document comparison identified high-risk discrepancies that violate configured tolerance rules. Immediate manual reconciliation or customs clearance will be blocked.
                </p>

                {/* List of Critical Anomalies */}
                <div className="mt-3.5 space-y-2">
                  {critical.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-navy-950/70 border border-rose-500/30 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-slate-200">{item.description}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Rule: {item.rule_type} • Flagged on {new Date(item.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="px-3 py-1 rounded-md text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 transition-colors shrink-0"
                      >
                        Override / Resolve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleRevalidate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-xs font-medium text-rose-300 border border-rose-500/40 transition-colors shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5 text-rose-400" />
              Re-Verify
            </button>
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/35">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-amber-200">
                  Compliance Warning Advisory ({warnings.length})
                </h4>
                <div className="mt-2 space-y-2">
                  {warnings.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-lg bg-navy-950/60 border border-amber-500/25 flex items-center justify-between gap-3 text-xs"
                    >
                      <p className="text-slate-300">{item.description}</p>
                      <button
                        onClick={() => handleResolve(item.id)}
                        className="px-2.5 py-1 rounded text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors shrink-0"
                      >
                        Acknowledge
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
