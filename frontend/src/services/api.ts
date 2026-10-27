import { DemoRole } from '../types';

let currentRole: DemoRole = 'scrutiny_officer';
let currentUsername: string = 'Officer A';

export const setDemoRole = (role: DemoRole, username?: string) => {
  currentRole = role;
  if (username) {
    currentUsername = username;
  } else {
    if (role === 'system_admin') currentUsername = 'Administrator';
    else if (role === 'senior_reviewer') currentUsername = 'Senior Reviewer';
    else currentUsername = 'Officer A';
  }
};

export const getDemoRole = (): DemoRole => currentRole;
export const getDemoUsername = (): string => currentUsername;

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('X-Demo-Role', currentRole);
  headers.set('X-Demo-User', currentUsername);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // System & Dashboard
  getHealth: () => request<any>('/api/health'),
  getDashboard: () => request<any>('/api/dashboard'),
  seedDemo: () => request<any>('/api/demo/seed', { method: 'POST' }),
  importWorkbook: () => request<any>('/api/demo/import', { method: 'POST' }),
  getConnectors: () => request<any[]>('/api/connectors'),
  toggleConnector: (id: string) => request<any>(`/api/connectors/${id}/toggle`, { method: 'POST' }),

  // Applications
  getApplications: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/applications${qs}`);
  },
  getApplicationDetail: (id: string) => request<any>(`/api/applications/${id}`),
  runValidation: (id: string) => request<any>(`/api/applications/${id}/validate`, { method: 'POST' }),
  requestClarification: (id: string, notes: string) =>
    request<any>(`/api/applications/${id}/clarification-request`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }),
  escalateApplication: (id: string, reason: string) =>
    request<any>(`/api/applications/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  recordDisposition: (id: string, disposition: string, comment: string) =>
    request<any>(`/api/applications/${id}/disposition`, {
      method: 'POST',
      body: JSON.stringify({ disposition, comment }),
    }),
  getApplicationAudit: (id: string) => request<any[]>(`/api/applications/${id}/audit`),
  getApplicationReportData: (id: string) => request<any>(`/api/applications/${id}/report?format=json`),

  // Findings
  reviewFinding: (findingId: string, action: string, reason: string) =>
    request<any>(`/api/findings/${findingId}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),

  // Alerts
  getAlerts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/alerts${qs}`);
  },
  acknowledgeAlert: (alertId: string) => request<any>(`/api/alerts/${alertId}/acknowledge`, { method: 'POST' }),
  resolveAlert: (alertId: string) => request<any>(`/api/alerts/${alertId}/resolve`, { method: 'POST' }),

  // Catalogue
  getCategories: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/catalogue/categories${qs}`);
  },
  updateCategoryMapping: (catId: number, mappingStatus: string, mappingNotes?: string) =>
    request<any>(`/api/catalogue/categories/${catId}/mapping`, {
      method: 'POST',
      body: JSON.stringify({ mapping_status: mappingStatus, mapping_notes: mappingNotes }),
    }),
  getCatalogueDocuments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ total: number; skip: number; limit: number; items: any[] }>(`/api/catalogue/documents${qs}`);
  },
  getCandidateRules: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ total: number; skip: number; limit: number; items: any[] }>(`/api/catalogue/candidate-rules${qs}`);
  },
  updateCandidateLifecycle: (candId: string, lifecycleStatus: string, reviewNotes?: string) =>
    request<any>(`/api/catalogue/candidate-rules/${candId}/lifecycle`, {
      method: 'POST',
      body: JSON.stringify({ lifecycle_status: lifecycleStatus, review_notes: reviewNotes }),
    }),
  getExternalRefs: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ total: number; skip: number; limit: number; items: any[] }>(`/api/catalogue/external-refs${qs}`);
  },
  getCatalogueCoverage: () => request<any>('/api/catalogue/coverage'),

  // Governance Rules
  getRules: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/api/rules${qs}`);
  },
  getRuleDetail: (id: string) => request<any>(`/api/rules/${id}`),
  createRuleDraft: (payload: any) => request<any>('/api/rules/drafts', { method: 'POST', body: JSON.stringify(payload) }),
  submitRuleForReview: (id: string) => request<any>(`/api/rules/${id}/submit-review`, { method: 'POST' }),
  approveRule: (id: string, comment: string) =>
    request<any>(`/api/rules/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    }),
  rejectRule: (id: string, reason: string) =>
    request<any>(`/api/rules/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  getRuleVersions: (id: string) => request<any[]>(`/api/rules/${id}/versions`),
  testRule: (id: string, payload: any) =>
    request<any>(`/api/rules/${id}/test`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
