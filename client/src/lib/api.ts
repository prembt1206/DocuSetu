import { AdvisorySettings } from '@shared/validations';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('docusetu_auth_token') || 'mock-token';
  return {
    Authorization: `Bearer ${token}`
  };
};

export const api = {
  // Shipments
  async getShipments() {
    const res = await fetch(`${API_BASE}/shipments`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to fetch shipments: ${res.statusText}`);
    return res.json();
  },

  async getShipment(id: string) {
    const res = await fetch(`${API_BASE}/shipments/${id}`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to fetch shipment ${id}: ${res.statusText}`);
    return res.json();
  },

  async createShipment(data: { referenceNumber: string; portOfLoading?: string; portOfDischarge?: string }) {
    const res = await fetch(`${API_BASE}/shipments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Failed to create shipment: ${res.statusText}`);
    return res.json();
  },

  async approveShipment(id: string) {
    const res = await fetch(`${API_BASE}/shipments/${id}/approve`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to approve shipment: ${res.statusText}`);
    return res.json();
  },

  async getShipmentInsights(id: string) {
    const res = await fetch(`${API_BASE}/shipments/${id}/insights`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to fetch shipment insights: ${res.statusText}`);
    return res.json();
  },

  getExportXmlUrl(id: string) {
    return `${API_BASE}/shipments/${id}/export-xml`;
  },

  // Document Ingestion & AI Pipeline
  async uploadFile(file: File, shipmentId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (shipmentId) {
      formData.append('shipmentId', shipmentId);
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body: formData
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Upload failed: ${res.statusText}`);
    }
    return res.json();
  },

  async processDocument(documentId: string) {
    const res = await fetch(`${API_BASE}/process/${documentId}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `AI processing failed: ${res.statusText}`);
    }
    return res.json();
  },

  async loadSampleDossier(dossierType: 'weight_mismatch' | 'compliant' | 'missing_hs' = 'weight_mismatch') {
    const res = await fetch(`${API_BASE}/documents/sample`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ dossierType })
    });
    if (!res.ok) throw new Error(`Failed to load sample dossier: ${res.statusText}`);
    return res.json();
  },

  // Validation
  async validateShipment(shipmentId: string) {
    const res = await fetch(`${API_BASE}/validate/${shipmentId}`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Validation failed: ${res.statusText}`);
    return res.json();
  },

  async resolveAnomaly(anomalyId: string) {
    const res = await fetch(`${API_BASE}/anomalies/${anomalyId}/resolve`, {
      method: 'POST',
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to resolve anomaly: ${res.statusText}`);
    return res.json();
  },

  // Settings
  async getSettings(): Promise<{ settings: AdvisorySettings }> {
    const res = await fetch(`${API_BASE}/settings`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
    return res.json();
  },

  async updateSettings(settings: AdvisorySettings) {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error(`Failed to update settings: ${res.statusText}`);
    return res.json();
  },

  // Dashboard Insights
  async getDashboardInsights() {
    const res = await fetch(`${API_BASE}/insights`, {
      headers: { ...getAuthHeaders() }
    });
    if (!res.ok) throw new Error(`Failed to fetch dashboard insights: ${res.statusText}`);
    return res.json();
  }
};
