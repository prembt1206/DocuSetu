import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  FileText,
  Sparkles,
  Layers,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { api } from '../lib/api.js';

interface DocumentUploaderProps {
  shipmentId?: string;
  onUploadSuccess?: (doc: any) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ shipmentId, onUploadSuccess }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const pipelineSteps = [
    { title: 'Ingesting File', desc: 'Secure upload & MIME verification' },
    { title: 'OCR Pre-processing', desc: 'Extracting text layer and page boundaries' },
    { title: 'AI Classification Router', desc: 'Gemini 2.5 Pro document splitting' },
    { title: 'Entity Extraction', desc: 'Incoterms, HS codes, weights parsing' },
    { title: 'Cross-Document Validation', desc: 'Evaluating trade rules & tolerances' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    setErrorMsg(null);
    const validMimes = ['application/pdf', 'application/zip', 'application/x-zip-compressed'];
    const isPdfOrZip = file.name.endsWith('.pdf') || file.name.endsWith('.zip');

    if (!validMimes.includes(file.type) && !isPdfOrZip) {
      setErrorMsg('Invalid file format. Please upload a PDF or ZIP file.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('File size exceeds the 15MB limit.');
      return;
    }

    setSelectedFile(file);
    executeFullPipeline(file);
  };

  const executeFullPipeline = async (file: File) => {
    setIsProcessing(true);
    setCurrentStep(0);

    try {
      // Step 1: Upload
      setCurrentStep(0);
      const uploadRes = await api.uploadFile(file, shipmentId);
      const docId = uploadRes.document.id;
      const targetShipmentId = uploadRes.shipmentId;

      // Step 2: OCR Pre-processing
      setCurrentStep(1);
      await new Promise((r) => setTimeout(r, 600));

      // Step 3 & 4: Classification & Extraction
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 600));
      setCurrentStep(3);

      const processRes = await api.processDocument(docId);

      // Step 5: Cross-Document Validation
      setCurrentStep(4);
      await new Promise((r) => setTimeout(r, 600));

      if (onUploadSuccess) {
        onUploadSuccess(processRes);
      } else {
        // Redirect to shipment detail view to inspect results & warnings
        navigate(`/shipments/${targetShipmentId}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Pipeline failed during processing');
      setIsProcessing(false);
    }
  };

  const handleQuickPreset = async (dossierType: 'weight_mismatch' | 'compliant' | 'missing_hs') => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      setCurrentStep(0);
      await new Promise((r) => setTimeout(r, 300));
      setCurrentStep(2);
      await new Promise((r) => setTimeout(r, 400));
      setCurrentStep(4);

      const res = await api.loadSampleDossier(dossierType);
      navigate(`/shipments/${res.shipmentId}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize sample trade dossier');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`glass-panel-glow rounded-2xl p-10 border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center relative overflow-hidden group ${
          isDragging
            ? 'border-brand-400 bg-brand-950/40 scale-[1.01]'
            : 'border-slate-700/80 hover:border-brand-500/60 hover:bg-slate-900/40'
        } ${isProcessing ? 'pointer-events-none opacity-90' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.zip,application/pdf,application/zip"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600/30 via-indigo-500/20 to-sky-400/20 border border-brand-500/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-glow-primary">
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          ) : (
            <UploadCloud className="w-8 h-8 text-brand-400" />
          )}
        </div>

        <h3 className="text-lg font-bold text-white font-display mb-1">
          {selectedFile ? selectedFile.name : 'Drop Trade Dossier PDF or ZIP Here'}
        </h3>
        <p className="text-xs text-slate-400 max-w-md mb-4">
          Upload Bills of Lading, Commercial Invoices, or merged Multi-Page shipping packets up to 15MB.
        </p>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            PDF
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
            ZIP Archive
          </span>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
            Gemini 2.5 Pro OCR Ready
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Processing Pipeline Animation */}
      {isProcessing && (
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 shadow-glow-primary animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-brand-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white">IDP Processing Pipeline in Progress</h4>
            </div>
            <span className="text-xs font-mono text-brand-300 font-semibold">
              Step {currentStep + 1} of {pipelineSteps.length}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${((currentStep + 1) / pipelineSteps.length) * 100}%` }}
            />
          </div>

          {/* Step Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
            {pipelineSteps.map((step, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border text-left transition-all ${
                  idx === currentStep
                    ? 'bg-brand-500/20 border-brand-500/50 text-brand-200 shadow-sm'
                    : idx < currentStep
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/40 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                      idx < currentStep
                        ? 'bg-emerald-500 text-slate-950'
                        : idx === currentStep
                        ? 'bg-brand-500 text-white animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-xs font-semibold truncate">{step.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset Test Scenarios */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-slate-200">1-Click Test Scenarios & Multi-Page Dossiers</h4>
            <p className="text-xs text-slate-400">
              Instantly simulate real-world logistics consignments without needing physical PDF files on hand.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Interactive Evaluation Suite</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Scenario 1: Weight Discrepancy */}
          <button
            onClick={() => handleQuickPreset('weight_mismatch')}
            disabled={isProcessing}
            className="p-4 rounded-xl bg-slate-900/60 border border-rose-500/30 hover:border-rose-500/60 hover:bg-rose-950/20 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Weight Discrepancy (10%)
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">
              Invoice 5,000kg vs BoL 5,500kg
            </p>
            <p className="text-[11px] text-slate-400">
              Triggers the Rule Engine to automatically flag a Critical Anomaly and display the red Warning Banner.
            </p>
          </button>

          {/* Scenario 2: Fully Compliant */}
          <button
            onClick={() => handleQuickPreset('compliant')}
            disabled={isProcessing}
            className="p-4 rounded-xl bg-slate-900/60 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/20 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Compliant Consignment
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">
              Automotive Parts: Nagoya → LA
            </p>
            <p className="text-[11px] text-slate-400">
              BoL, Invoice, and Packing List synchronized (12,450 kg). Ready for direct Customs XML export.
            </p>
          </button>

          {/* Scenario 3: Missing HS Code */}
          <button
            onClick={() => handleQuickPreset('missing_hs')}
            disabled={isProcessing}
            className="p-4 rounded-xl bg-slate-900/60 border border-amber-500/30 hover:border-amber-500/60 hover:bg-amber-950/20 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Missing Tariff Code
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">
              Pharma Cargo: JNPT → Antwerp
            </p>
            <p className="text-[11px] text-slate-400">
              Flags missing HS classification on line item. Tests strictness threshold setting.
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
