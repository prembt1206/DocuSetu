import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Ship,
  FileText,
  ShieldCheck,
  RotateCw,
  FileCode,
  ArrowLeft,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Building,
  Clock,
  Sparkles,
  Download
} from 'lucide-react';
import { api } from '../lib/api.js';
import { StatusBadge } from '../components/StatusBadge.js';
import { ValidationWarningBanner } from '../components/ValidationWarningBanner.js';
import { ExtractionResultsTable } from '../components/ExtractionResultsTable.js';
import { CustomsXMLExportModal } from '../components/CustomsXMLExportModal.js';
import { DocumentUploader } from '../components/DocumentUploader.js';

export const ShipmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [shipment, setShipment] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // XML Modal State
  const [isXmlModalOpen, setIsXmlModalOpen] = useState<boolean>(false);
  const [customsXmlContent, setCustomsXmlContent] = useState<string>('');
  const [approving, setApproving] = useState<boolean>(false);

  // Add Document Accordion State
  const [showUploader, setShowUploader] = useState<boolean>(false);

  const fetchShipmentDetail = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await api.getShipment(id);
      setShipment(data.shipment);
      setDocuments(data.documents || []);
      setAnomalies(data.anomalies || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipment details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentDetail();
  }, [id]);

  const handleApprove = async () => {
    if (!id) return;
    try {
      setApproving(true);
      const res = await api.approveShipment(id);
      setCustomsXmlContent(res.customsXml);
      setIsXmlModalOpen(true);
      fetchShipmentDetail();
    } catch (err: any) {
      alert(`Approval failed: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  const handleOpenXmlDirectly = async () => {
    if (!id) return;
    try {
      const res = await api.approveShipment(id);
      setCustomsXmlContent(res.customsXml);
      setIsXmlModalOpen(true);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-slate-400">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Reconciling Consignment Intelligence...</p>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Consignment Not Found</h3>
        <p className="text-xs text-slate-400">{error || 'Unable to locate shipment in tenant registry.'}</p>
        <button
          onClick={() => navigate('/shipments')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
        >
          Return to Master List
        </button>
      </div>
    );
  }

  const hasCritical = anomalies.some((a) => a.severity === 'critical' && !a.resolved);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Navigation Breadcrumb & Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/shipments')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Consignments Master List</span>
        </button>

        <button
          onClick={fetchShipmentDetail}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 border border-slate-700"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Re-Sync</span>
        </button>
      </div>

      {/* Main Shipment Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-700 flex items-center justify-center shadow-glow-primary shrink-0">
            <Ship className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold font-mono text-white tracking-tight">
                {shipment.reference_number}
              </h2>
              <StatusBadge status={shipment.status} type="shipment" />
            </div>
            <p className="text-xs text-slate-400">
              Corridor: <span className="text-slate-200 font-medium">{shipment.port_of_loading || 'Origin'}</span>
              {' → '}
              <span className="text-slate-200 font-medium">{shipment.port_of_discharge || 'Destination'}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUploader(!showUploader)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{showUploader ? 'Hide Uploader' : 'Add Document'}</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={approving}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 ${
              hasCritical
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-glow-emerald'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>
              {approving
                ? 'Exporting WCO XML...'
                : shipment.status === 'customs_cleared'
                ? 'View Exported Customs XML'
                : 'Approve & Export Customs XML'}
            </span>
          </button>
        </div>
      </div>

      {/* Cross-Document Validation Warning Banner */}
      <ValidationWarningBanner
        anomalies={anomalies}
        shipmentId={shipment.id}
        onRefresh={fetchShipmentDetail}
      />

      {/* Accordion Document Uploader */}
      {showUploader && (
        <div className="glass-panel p-6 rounded-2xl border border-brand-500/30 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Attach Shipping Document to {shipment.reference_number}</h3>
            <span className="text-xs text-slate-400">Automatic Cross-Document Re-validation</span>
          </div>
          <DocumentUploader
            shipmentId={shipment.id}
            onUploadSuccess={() => {
              setShowUploader(false);
              fetchShipmentDetail();
            }}
          />
        </div>
      )}

      {/* Extracted Entities & Clean JSONB Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-400" />
              Ingested Documents &amp; Extracted Entities
            </h3>
            <p className="text-xs text-slate-400">
              Normalized key-value pairs parsed by Gemini 2.5 Pro and validated against strict trade Zod schemas.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {documents.length} Document(s) Ingested
          </span>
        </div>

        <ExtractionResultsTable documents={documents} />
      </div>

      {/* Customs Declaration Export Modal */}
      <CustomsXMLExportModal
        isOpen={isXmlModalOpen}
        onClose={() => setIsXmlModalOpen(false)}
        xmlContent={customsXmlContent}
        referenceNumber={shipment.reference_number}
      />
    </div>
  );
};
