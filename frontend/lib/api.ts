import {
  User, Investigation, Evidence, EvidenceMetadata, TimelineEvent,
  GraphData, Finding, RiskAssessment, Report, AuditLog, SystemStatus,
  InvestigationStatus, Priority, FindingSeverity, ReviewStatus, EventCategory, EntityType, RelationshipType, ReportFormat
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sentinel_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sentinel_token');
      localStorage.removeItem('sentinel_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    const errData = await response.json().catch(() => ({}));
    const detailMsg = Array.isArray(errData.detail)
      ? errData.detail.map((d: any) => d.msg || JSON.stringify(d)).join('; ')
      : (typeof errData.detail === 'string' ? errData.detail : null);
    throw new Error(detailMsg || errData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentinel_token', data.access_token);
      localStorage.setItem('sentinel_user', JSON.stringify(data.user));
    }
    return data;
  },

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('sentinel_token');
        localStorage.removeItem('sentinel_user');
        window.location.href = '/login';
      }
    }
  },

  async getMe(): Promise<User> {
    return request<User>('/auth/me');
  },

  // Investigations
  async getInvestigations(query?: string, status?: InvestigationStatus, priority?: Priority): Promise<Investigation[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    return request<Investigation[]>(`/investigations?${params.toString()}`);
  },

  async getInvestigation(id: string): Promise<Investigation> {
    return request<Investigation>(`/investigations/${id}`);
  },

  async createInvestigation(data: { title: string; description?: string; priority?: Priority }): Promise<Investigation> {
    return request<Investigation>('/investigations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateInvestigation(id: string, data: Partial<Investigation>): Promise<Investigation> {
    return request<Investigation>(`/investigations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Evidence
  async getEvidence(investigationId: string): Promise<Evidence[]> {
    return request<Evidence[]>(`/investigations/${investigationId}/evidence`);
  },

  async getEvidenceDetail(evidenceId: string): Promise<Evidence> {
    return request<Evidence>(`/evidence/${evidenceId}`);
  },

  async uploadEvidence(investigationId: string, files: File[], title?: string): Promise<Evidence[]> {
    const token = getAuthToken();
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (title) formData.append('title', title);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/investigations/${investigationId}/evidence`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload evidence');
    }

    return res.json();
  },

  async reprocessEvidence(evidenceId: string): Promise<{ status: string; message: string; stage: string }> {
    return request(`/evidence/${evidenceId}/reprocess`, { method: 'POST' });
  },

  getEvidenceFileUrl(evidenceId: string): string {
    const token = getAuthToken();
    return `${API_BASE}/evidence/${evidenceId}/file${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Timeline
  async getTimeline(investigationId: string, category?: EventCategory): Promise<TimelineEvent[]> {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    return request<TimelineEvent[]>(`/investigations/${investigationId}/timeline?${params.toString()}`);
  },

  async createTimelineEvent(investigationId: string, data: {
    timestamp: string;
    title: string;
    description?: string;
    category: EventCategory;
    evidence_id?: string;
  }): Promise<TimelineEvent> {
    return request<TimelineEvent>(`/investigations/${investigationId}/timeline`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Intelligence Graph
  async getGraphData(investigationId: string): Promise<GraphData> {
    return request<GraphData>(`/investigations/${investigationId}/graph`);
  },

  async createEntity(investigationId: string, data: {
    name: string;
    category: EntityType;
    risk_score?: number;
    attributes?: Record<string, any>;
  }): Promise<any> {
    return request(`/investigations/${investigationId}/entities`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async createRelationship(investigationId: string, data: {
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: RelationshipType;
    confidence?: number;
    description?: string;
  }): Promise<any> {
    return request(`/investigations/${investigationId}/relationships`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Findings
  async getFindings(investigationId: string, severity?: FindingSeverity, reviewStatus?: ReviewStatus): Promise<Finding[]> {
    const params = new URLSearchParams();
    if (severity) params.append('severity', severity);
    if (reviewStatus) params.append('review_status', reviewStatus);
    return request<Finding[]>(`/investigations/${investigationId}/findings?${params.toString()}`);
  },

  async reviewFinding(findingId: string, review_status: ReviewStatus, review_notes?: string): Promise<Finding> {
    return request<Finding>(`/findings/${findingId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ review_status, review_notes }),
    });
  },

  // Risk Assessment
  async getRiskAssessment(investigationId: string): Promise<RiskAssessment> {
    return request<RiskAssessment>(`/investigations/${investigationId}/risk`);
  },

  // Reports
  async getReports(investigationId: string): Promise<Report[]> {
    return request<Report[]>(`/investigations/${investigationId}/reports`);
  },

  async generateReport(investigationId: string, format: ReportFormat = 'PDF', title?: string): Promise<Report> {
    return request<Report>(`/investigations/${investigationId}/reports`, {
      method: 'POST',
      body: JSON.stringify({ format, title }),
    });
  },

  getReportDownloadUrl(reportId: string): string {
    const token = getAuthToken();
    return `${API_BASE}/reports/${reportId}/download${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  // Audit
  async getAuditLogs(investigationId?: string, action?: string): Promise<AuditLog[]> {
    const params = new URLSearchParams();
    if (investigationId) params.append('investigation_id', investigationId);
    if (action) params.append('action', action);
    return request<AuditLog[]>(`/audit?${params.toString()}`);
  },

  // System Diagnostics
  async getSystemStatus(): Promise<SystemStatus> {
    return request<SystemStatus>('/system/status');
  },

  // Global Search
  async search(query: string): Promise<{
    investigations: any[];
    evidence: any[];
    entities: any[];
    findings: any[];
  }> {
    return request(`/search?q=${encodeURIComponent(query)}`);
  },
};
