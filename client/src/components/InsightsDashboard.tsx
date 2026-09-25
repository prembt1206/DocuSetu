import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  TrendingUp,
  Anchor,
  Building2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  ExternalLink
} from 'lucide-react';

interface SupplierProfile {
  supplierName: string;
  complianceScore: number;
  totalShipments: number;
  activeAnomalies: number;
  weightAccuracyRate: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

interface PortBottleneck {
  port: string;
  avgCustomsDwellDays: number;
  delayRisk: string;
  congestionIndex: number;
  primaryHoldReason: string;
}

interface InsightsDashboardProps {
  insights: {
    totalShipments: number;
    readyCount: number;
    flaggedCount: number;
    automatedClearanceRate: number;
    criticalAnomalies: number;
    warningAnomalies: number;
    supplierProfiles: SupplierProfile[];
    portBottlenecks: PortBottleneck[];
  };
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({ insights }) => {
  return (
    <div className="space-y-8">
      {/* Top Level Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Automated Customs Clearance Rate */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Automated Clearance Readiness</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold font-mono text-white">
              {insights.automatedClearanceRate}%
            </p>
            <span className="text-xs text-emerald-400 font-medium">Ready for Green Lane</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${insights.automatedClearanceRate}%` }}
            />
          </div>
        </div>

        {/* Active Critical Anomalies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Blockers (Demurrage Risk)</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold font-mono text-rose-300">
              {insights.criticalAnomalies}
            </p>
            <span className="text-xs text-rose-400 font-medium">Immediate Action Required</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Includes weight discrepancies exceeding ±2.0% tolerance
          </p>
        </div>

        {/* Warning Discrepancies */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Advisory Warnings</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold font-mono text-amber-300">
              {insights.warningAnomalies}
            </p>
            <span className="text-xs text-amber-400 font-medium">Under Review</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Incoterms & minor carrier typographical flags
          </p>
        </div>

        {/* Total Tracked Consignments */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Consignments</span>
            <TrendingUp className="w-4 h-4 text-brand-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-extrabold font-mono text-white">
              {insights.totalShipments}
            </p>
            <span className="text-xs text-slate-400 font-medium">Under Monitoring</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            {insights.readyCount} Cleared • {insights.flaggedCount} Auditing
          </p>
        </div>
      </div>

      {/* Supplier Compliance Risk Profiles */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-navy-900/60">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Building2 className="w-4 h-4 text-brand-400" />
              Supplier Compliance Profiles & Quality Scores
            </h3>
            <p className="text-xs text-slate-400">
              Evaluates vendor document reliability, HS code accuracy, and historical weight reconciliation.
            </p>
          </div>
          <span className="text-xs text-brand-400 font-mono">Real-time Risk Matrix</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/50 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-6">Supplier Entity</th>
                <th className="py-3 px-6 text-center">Quality Score</th>
                <th className="py-3 px-6 text-center">Historical Consignments</th>
                <th className="py-3 px-6 text-center">Weight Accuracy</th>
                <th className="py-3 px-6 text-center">Active Anomalies</th>
                <th className="py-3 px-6 text-right">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {insights.supplierProfiles.map((sup, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-400" />
                    {sup.supplierName}
                  </td>
                  <td className="py-3.5 px-6 text-center">
                    <span
                      className={`inline-block font-mono font-bold px-2 py-0.5 rounded text-xs ${
                        sup.complianceScore >= 85
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : sup.complianceScore >= 65
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {sup.complianceScore}%
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono text-slate-300">
                    {sup.totalShipments}
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono text-slate-300">
                    {sup.weightAccuracyRate}%
                  </td>
                  <td className="py-3.5 px-6 text-center font-mono">
                    {sup.activeAnomalies > 0 ? (
                      <span className="text-rose-400 font-bold">{sup.activeAnomalies}</span>
                    ) : (
                      <span className="text-emerald-400">0</span>
                    )}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase ${
                        sup.riskLevel === 'Low'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                          : sup.riskLevel === 'Medium'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse'
                      }`}
                    >
                      {sup.riskLevel} Risk
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Predictive Supply Chain Bottlenecks */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              <Anchor className="w-4 h-4 text-sky-400" />
              Predictive Supply Chain Bottlenecks & Customs Dwell Risk
            </h3>
            <p className="text-xs text-slate-400">
              Anticipates customs delays based on document accuracy trends and regional port inspection backlogs.
            </p>
          </div>
          <span className="text-xs font-mono text-sky-400">Predictive Model v2.5</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.portBottlenecks.map((port, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-200 truncate">{port.port}</span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      port.delayRisk.includes('High') || port.delayRisk.includes('Elevated')
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {port.delayRisk}
                  </span>
                </div>
                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Avg Customs Dwell:</span>
                    <span className="font-mono font-bold text-white">{port.avgCustomsDwellDays} Days</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Congestion Index:</span>
                    <span className="font-mono text-slate-300">{port.congestionIndex} / 100</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                <span className="text-slate-500">Primary Hold Cause:</span> {port.primaryHoldReason}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
