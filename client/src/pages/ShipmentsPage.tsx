import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ship,
  Search,
  Plus,
  ArrowRight,
  RotateCw,
  FileText,
  AlertTriangle,
  Building2,
  X
} from 'lucide-react';
import { api } from '../lib/api.js';
import { StatusBadge } from '../components/StatusBadge.js';

export const ShipmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // New Shipment form state
  const [newRef, setNewRef] = useState<string>('');
  const [newPol, setNewPol] = useState<string>('Port of Shanghai, CN');
  const [newPod, setNewPod] = useState<string>('Port of Rotterdam, NL');
  const [creating, setCreating] = useState<boolean>(false);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const res = await api.getShipments();
      setShipments(res.shipments || []);
    } catch (err: any) {
      console.error('fetchShipments error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRef.trim()) return;
    try {
      setCreating(true);
      const res = await api.createShipment({
        referenceNumber: newRef.trim(),
        portOfLoading: newPol,
        portOfDischarge: newPod
      });
      setIsModalOpen(false);
      setNewRef('');
      navigate(`/shipments/${res.shipment.id}`);
    } catch (err: any) {
      alert(`Failed to create shipment: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  const filtered = shipments.filter((shp) => {
    const matchesSearch =
      shp.reference_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shp.port_of_loading || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shp.port_of_discharge || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (selectedStatus === 'all') return matchesSearch;
    return matchesSearch && shp.status === selectedStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white font-display tracking-tight flex items-center gap-2.5">
            <Ship className="w-6 h-6 text-brand-400" />
            Consignments &amp; Customs Shipments
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Master registry of international trade consignments, cross-checked documents, and clearance readiness.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchShipments}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh Consignments"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setNewRef('SHP-2026-' + Math.floor(1000 + Math.random() * 9000));
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-primary transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Shipment Track</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference number (e.g. SHP-2026) or port..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Shipments' },
            { id: 'flagged', label: 'Flagged (Discrepancies)' },
            { id: 'ready_for_customs', label: 'Ready for Customs' },
            { id: 'customs_cleared', label: 'Cleared' },
            { id: 'review_required', label: 'Review Required' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-brand-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shipments List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs font-medium">Loading consignments registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 text-slate-400 space-y-3">
          <Ship className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">No consignments match this filter</h3>
          <p className="text-xs max-w-sm mx-auto">
            Try adjusting your search criteria, or ingest a new trade document packet to generate a shipment record.
          </p>
          <button
            onClick={() => navigate('/documents')}
            className="px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold shadow-glow-primary inline-flex items-center gap-2 mt-2"
          >
            <span>Upload Document Packet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((shp) => (
            <div
              key={shp.id}
              onClick={() => navigate(`/shipments/${shp.id}`)}
              className="glass-card p-5 rounded-2xl border border-slate-800/80 cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 group-hover:border-brand-500/40 group-hover:bg-brand-950/20 transition-all">
                  <Ship className="w-6 h-6 text-brand-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold font-mono text-white group-hover:text-brand-300 transition-colors">
                      {shp.reference_number}
                    </h3>
                    <StatusBadge status={shp.status} type="shipment" />
                    {shp.hasCriticalAnomaly && (
                      <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                        Critical Mismatch
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{shp.port_of_loading || 'Origin Port'}</span>
                    <span>→</span>
                    <span className="text-slate-300 font-medium">
                      {shp.port_of_discharge || 'Destination Port'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {shp.documentsCount || 0} Documents Ingested
                    </span>
                    <span>•</span>
                    <span>Created: {new Date(shp.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 group-hover:bg-brand-600 text-slate-200 group-hover:text-white text-xs font-semibold transition-all shadow-sm">
                  <span>Inspect Extraction</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Shipment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-navy-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Create Consignment Record</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Shipment Reference / Consignment ID
                </label>
                <input
                  type="text"
                  required
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="e.g. SHP-2026-9912"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Port of Loading (POL)
                </label>
                <input
                  type="text"
                  value={newPol}
                  onChange={(e) => setNewPol(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Port of Discharge (POD)
                </label>
                <input
                  type="text"
                  value={newPod}
                  onChange={(e) => setNewPod(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow-primary"
                >
                  {creating ? 'Creating...' : 'Initialize & Proceed'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
