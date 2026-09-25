import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  FileUp,
  AlertTriangle,
  ShieldCheck,
  RotateCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../lib/api.js';
import { InsightsDashboard } from '../components/InsightsDashboard.js';
import { StatusBadge } from '../components/StatusBadge.js';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getDashboardInsights();
      setInsights(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveAnomaly = async (id: string) => {
    try {
      await api.resolveAnomaly(id);
      fetchDashboardData();
    } catch (err: any) {
      alert(`Failed to resolve anomaly: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Aggregating Cross-Document Customs Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-tight flex items-center gap-2.5">
            Knowledge Discovery &amp; Customs Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-document classification, entity reconciliation, and supplier compliance telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => navigate('/documents')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-primary transition-all active:scale-95"
          >
            <FileUp className="w-4 h-4" />
            <span>Ingest Document Packet</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {insights && (
        <>
          {/* Main Analytics Component */}
          <InsightsDashboard insights={insights} />

          {/* Recent Exceptions & Anomaly Watchlist */}
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-navy-900/60">
              <div>
                <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Active Cross-Document Exceptions &amp; Demurrage Warnings
                </h3>
                <p className="text-xs text-slate-400">
                  Anomalies flagged by the Rule Engine that require immediate reconciliation or human authorization.
                </p>
              </div>
              <button
                onClick={() => navigate('/shipments')}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-semibold"
              >
                <span>View All Consignments</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-800/80">
              {insights.recentAnomalies && insights.recentAnomalies.length > 0 ? (
                insights.recentAnomalies.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="mt-1">
                        <StatusBadge status={item.severity} type="anomaly" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => navigate(`/shipments/${item.shipment_id}`)}
                            className="text-xs font-mono font-bold text-brand-300 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            {item.shipment_reference || 'Consignment'}
                            <ArrowUpRight className="w-3 h-3" />
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Rule: {item.rule_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 max-w-3xl leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => navigate(`/shipments/${item.shipment_id}`)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                      >
                        Inspect Shipment
                      </button>
                      {!item.resolved && (
                        <button
                          onClick={() => handleResolveAnomaly(item.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                  All active shipments are currently 100% compliant with no open anomalies.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
