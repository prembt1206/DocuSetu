import React, { useEffect, useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Shield,
  FileCode,
  Building
} from 'lucide-react';
import { api } from '../lib/api.js';
import { AdvisorySettings } from '@shared/validations';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AdvisorySettings>({
    weightTolerancePercent: 2.0,
    missingHsCodeStrictness: 'critical',
    confidenceThreshold: 0.85,
    autoFlagShipperMismatch: true,
    autoFlagPortMismatch: true,
    exportXmlFormat: 'WCO_3.0'
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.settings) {
        setSettings({
          weightTolerancePercent: Number(res.settings.weightTolerancePercent ?? 2.0),
          missingHsCodeStrictness: res.settings.missingHsCodeStrictness || 'critical',
          confidenceThreshold: Number(res.settings.confidenceThreshold ?? 0.85),
          autoFlagShipperMismatch: Boolean(res.settings.autoFlagShipperMismatch ?? true),
          autoFlagPortMismatch: Boolean(res.settings.autoFlagPortMismatch ?? true),
          exportXmlFormat: res.settings.exportXmlFormat || 'WCO_3.0'
        });
      }
    } catch (err: any) {
      console.error('fetchSettings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);
    try {
      await api.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update advisory settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400">
        <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-medium">Loading organization advisory settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white font-display tracking-tight flex items-center gap-2.5">
          <Sliders className="w-6 h-6 text-brand-400" />
          Advisory Rules &amp; Cross-Document Tolerances
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure rule engine sensitivity, discrepancy tolerances, and AI confidence thresholds for automated customs validation.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs shadow-glow-emerald">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>Advisory configuration and validation tolerances saved successfully!</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Card 1: Weight Tolerance Discrepancy */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                Weight Tolerance Mismatch Limit
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Maximum allowable percentage discrepancy between Commercial Invoice, Packing List, and Ocean Bill of Lading.
              </p>
            </div>
            <span className="text-base font-bold font-mono text-brand-300 bg-brand-500/10 px-3 py-1 rounded-lg border border-brand-500/30">
              ±{settings.weightTolerancePercent.toFixed(1)}%
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0.0"
              max="15.0"
              step="0.5"
              value={settings.weightTolerancePercent}
              onChange={(e) =>
                setSettings({ ...settings, weightTolerancePercent: parseFloat(e.target.value) })
              }
              className="w-full accent-brand-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>0% (Zero Discrepancy)</span>
              <span>2.0% (WCO Standard)</span>
              <span>5.0% (Permissive)</span>
              <span>15.0% (Max)</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            Example: A 5,000 kg Invoice compared to a 5,500 kg BoL represents a +10.0% discrepancy. With a 2.0% tolerance, this triggers a Critical Block anomaly.
          </p>
        </div>

        {/* Card 2: Missing HS Code Strictness */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Missing Tariff Code (HS Code) Strictness Level
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Governs whether items lacking 6-10 digit Harmonized Tariff codes generate a blocking Critical error or an Advisory warning.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                settings.missingHsCodeStrictness === 'critical'
                  ? 'bg-rose-950/20 border-rose-500/40 text-rose-200 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <input
                type="radio"
                name="missingHsCodeStrictness"
                value="critical"
                checked={settings.missingHsCodeStrictness === 'critical'}
                onChange={() => setSettings({ ...settings, missingHsCodeStrictness: 'critical' })}
                className="mt-1 accent-rose-500"
              />
              <div>
                <span className="text-xs font-bold block text-rose-300">Critical Block (Recommended)</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Prevents automated XML customs filing if any line item lacks a verified HS code. Prevents fines.
                </span>
              </div>
            </label>

            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                settings.missingHsCodeStrictness === 'warning'
                  ? 'bg-amber-950/20 border-amber-500/40 text-amber-200 shadow-sm'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <input
                type="radio"
                name="missingHsCodeStrictness"
                value="warning"
                checked={settings.missingHsCodeStrictness === 'warning'}
                onChange={() => setSettings({ ...settings, missingHsCodeStrictness: 'warning' })}
                className="mt-1 accent-amber-500"
              />
              <div>
                <span className="text-xs font-bold block text-amber-300">Warning Advisory Only</span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Permits export with missing codes while displaying an advisory badge for manual entry.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 3: AI Extraction Confidence Threshold */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-400" />
                Minimum AI Extraction Confidence Threshold
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Minimum Gemini 2.5 Pro extraction confidence required before flagging a document for manual human broker review.
              </p>
            </div>
            <span className="text-base font-bold font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/30">
              {(settings.confidenceThreshold * 100).toFixed(0)}%
            </span>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="0.50"
              max="0.99"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) =>
                setSettings({ ...settings, confidenceThreshold: parseFloat(e.target.value) })
              }
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>50% (Permissive)</span>
              <span>85% (Recommended)</span>
              <span>95% (High Assurance)</span>
            </div>
          </div>
        </div>

        {/* Card 4: Automated Cross-Check Toggles */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Building className="w-4 h-4 text-indigo-400" />
            Automated Party &amp; Corridor Cross-Checks
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Cross-check Shipper &amp; Consignee Names
                </span>
                <span className="text-[11px] text-slate-400">
                  Flags mismatch between Commercial Invoice vendor and Bill of Lading consignor.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFlagShipperMismatch}
                onChange={(e) =>
                  setSettings({ ...settings, autoFlagShipperMismatch: e.target.checked })
                }
                className="w-4 h-4 rounded accent-brand-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Verify Maritime Route Ports (POL / POD)
                </span>
                <span className="text-[11px] text-slate-400">
                  Verifies that Port of Loading and Discharge align across ocean contracts and invoices.
                </span>
              </div>
              <input
                type="checkbox"
                checked={settings.autoFlagPortMismatch}
                onChange={(e) =>
                  setSettings({ ...settings, autoFlagPortMismatch: e.target.checked })
                }
                className="w-4 h-4 rounded accent-brand-500"
              />
            </label>
          </div>
        </div>

        {/* Card 5: Customs Declaration Format */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode className="w-4 h-4 text-teal-400" />
            Government Customs Declaration Schema
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { id: 'WCO_3.0', label: 'WCO Data Model 3.0', desc: 'World Customs Organization Global Standard' },
              { id: 'US_CBP_ACE', label: 'US CBP ACE Filing', desc: 'Automated Commercial Environment (CBP)' },
              { id: 'EU_SINGLE_WINDOW', label: 'EU Single Window / ICS2', desc: 'European Union Import Control System 2' }
            ].map((fmt) => (
              <label
                key={fmt.id}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  settings.exportXmlFormat === fmt.id
                    ? 'bg-brand-600/20 border-brand-500 text-white shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                }`}
              >
                <input
                  type="radio"
                  name="exportXmlFormat"
                  value={fmt.id}
                  checked={settings.exportXmlFormat === fmt.id}
                  onChange={() => setSettings({ ...settings, exportXmlFormat: fmt.id as any })}
                  className="hidden"
                />
                <span className="text-xs font-bold block">{fmt.label}</span>
                <span className="text-[10px] text-slate-400 mt-1 block leading-tight">{fmt.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={fetchSettings}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            Reset to Saved
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-primary transition-all active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting Settings...' : 'Save Advisory Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
