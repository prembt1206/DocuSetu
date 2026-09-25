import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode, ShieldCheck } from 'lucide-react';

interface CustomsXMLExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  xmlContent: string;
  referenceNumber: string;
}

export const CustomsXMLExportModal: React.FC<CustomsXMLExportModalProps> = ({
  isOpen,
  onClose,
  xmlContent,
  referenceNumber
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CustomsDeclaration_${referenceNumber}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <FileCode className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Government Customs Declaration XML (WCO 3.0)
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ready for Filing
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Validated Consignment: <span className="font-mono text-slate-200">{referenceNumber}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Copied!' : 'Copy XML'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-glow-emerald transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Informative Alert */}
        <div className="px-6 py-2.5 bg-emerald-950/20 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            Schema strictly compliant with World Customs Organization GOVCBR standards. Includes Exporter, Importer of Record, Port Codes, and HS Classifications.
          </span>
        </div>

        {/* XML Code Viewer */}
        <div className="p-6 overflow-y-auto flex-1 bg-navy-950 text-xs font-mono text-slate-300 leading-relaxed">
          <pre className="whitespace-pre-wrap selection:bg-brand-500 selection:text-white">{xmlContent}</pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Target Single Window: US CBP ACE / EU ICS2 / Singapore TradeNet</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
