import initialData from '../data/initialData.json';
import {
  Application,
  Finding,
  Alert,
  AuditEvent,
  CatalogueCategory,
  CatalogueDocument,
  CatalogueCandidateRule,
  CatalogueExternalRef,
  Rule,
  RuleVersion,
  Connector,
  DashboardData,
  DemoRole,
  User
} from '../types';

const STORAGE_KEY = 'VERIFYAI_LOCAL_DATA_V2';
const ROLE_STORAGE_KEY = 'VERIFYAI_ROLE_V2';

interface DataState {
  users: User[];
  applications: Application[];
  application_fields: any[];
  documents: any[];
  document_extractions: any[];
  findings: Finding[];
  validation_runs: any[];
  alerts: Alert[];
  audit_events: AuditEvent[];
  catalogue_categories: CatalogueCategory[];
  catalogue_documents: CatalogueDocument[];
  catalogue_candidate_rules: CatalogueCandidateRule[];
  catalogue_external_refs: CatalogueExternalRef[];
  rules: Rule[];
  rule_versions: RuleVersion[];
  connectors: Connector[];
}

const defaultConnectors: Connector[] = [
  {
    id: 'conn_fire_services',
    name: 'State Fire Services NOC Portal',
    type: 'State Agency',
    mode: 'Simulated Mock',
    status: 'Active (Mock)',
    banner: 'SIMULATED — NO LIVE ISSUER API',
    endpoint: 'https://firesafety.state.gov.in/api/v1/verify (Mock)',
    last_ping: '10 sec ago',
    latency_ms: 185
  },
  {
    id: 'conn_land_records',
    name: 'State Land & Revenue Registry',
    type: 'State Registry',
    mode: 'Simulated Mock',
    status: 'Active (Mock)',
    banner: 'SIMULATED — NO LIVE ISSUER API',
    endpoint: 'https://landrevenue.state.gov.in/api/v2/check (Mock)',
    last_ping: '1 min ago',
    latency_ms: 240
  },
  {
    id: 'conn_digilocker',
    name: 'National Academic Depository / DigiLocker',
    type: 'Central Portal',
    mode: 'Simulated Mock',
    status: 'Standby',
    banner: 'SIMULATED — NO LIVE ISSUER API',
    endpoint: 'https://nad.gov.in/api/verify (Mock)',
    last_ping: '5 min ago',
    latency_ms: 310
  }
];

function cloneInitialState(): DataState {
  return {
    users: JSON.parse(JSON.stringify(initialData.users || [])),
    applications: JSON.parse(JSON.stringify(initialData.applications || [])),
    application_fields: JSON.parse(JSON.stringify(initialData.application_fields || [])),
    documents: JSON.parse(JSON.stringify(initialData.documents || [])),
    document_extractions: JSON.parse(JSON.stringify(initialData.document_extractions || [])),
    findings: JSON.parse(JSON.stringify(initialData.findings || [])),
    validation_runs: JSON.parse(JSON.stringify(initialData.validation_runs || [])),
    alerts: JSON.parse(JSON.stringify(initialData.alerts || [])),
    audit_events: JSON.parse(JSON.stringify(initialData.audit_events || [])),
    catalogue_categories: JSON.parse(JSON.stringify(initialData.catalogue_categories || [])),
    catalogue_documents: JSON.parse(JSON.stringify(initialData.catalogue_documents || [])),
    catalogue_candidate_rules: JSON.parse(JSON.stringify(initialData.catalogue_candidate_rules || [])),
    catalogue_external_refs: JSON.parse(JSON.stringify(initialData.catalogue_external_refs || [])),
    rules: JSON.parse(JSON.stringify(initialData.rules || [])),
    rule_versions: JSON.parse(JSON.stringify(initialData.rule_versions || [])),
    connectors: defaultConnectors
  };
}

let memoryState: DataState | null = null;

function getState(): DataState {
  if (memoryState) return memoryState;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      memoryState = JSON.parse(stored);
      if (memoryState && memoryState.applications && memoryState.applications.length > 0) {
        if (!memoryState.connectors || memoryState.connectors.length === 0) {
          memoryState.connectors = defaultConnectors;
        }
        return memoryState;
      }
    }
  } catch (e) {
    console.warn('Could not read from localStorage, using initial clone', e);
  }

  memoryState = cloneInitialState();
  saveState(memoryState);
  return memoryState;
}

function saveState(state: DataState) {
  memoryState = state;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save to localStorage', e);
  }
}

export function resetLocalDemoData(): DataState {
  const fresh = cloneInitialState();
  saveState(fresh);
  return fresh;
}

// Active Role & User session
let currentRole: DemoRole = 'scrutiny_officer';
let currentUsername: string = 'Officer A';

try {
  const savedRole = localStorage.getItem(ROLE_STORAGE_KEY);
  if (savedRole) {
    const parsed = JSON.parse(savedRole);
    currentRole = parsed.role || 'scrutiny_officer';
    currentUsername = parsed.username || 'Officer A';
  }
} catch {
  // ignore
}

export const setDemoRole = (role: DemoRole, username?: string) => {
  currentRole = role;
  if (username) {
    currentUsername = username;
  } else {
    if (role === 'system_admin') currentUsername = 'Administrator';
    else if (role === 'senior_reviewer') currentUsername = 'Senior Reviewer';
    else currentUsername = 'Officer A';
  }
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify({ role: currentRole, username: currentUsername }));
  } catch {
    // ignore
  }
};

export const getDemoRole = (): DemoRole => currentRole;
export const getDemoUsername = (): string => currentUsername;

// Audit event creator helper
function logAudit(
  state: DataState,
  action: string,
  appId?: string,
  findingId?: string,
  ruleId?: string,
  comment?: string,
  prevStatus?: string,
  newStatus?: string
) {
  const nextId = (state.audit_events.length > 0 ? Math.max(...state.audit_events.map((a) => a.id || 0)) : 0) + 1;
  const newAudit: AuditEvent = {
    id: nextId,
    application_id: appId,
    finding_id: findingId,
    rule_id: ruleId,
    user_name: currentUsername,
    user_role: currentRole,
    action,
    previous_status: prevStatus,
    new_status: newStatus,
    reason_comment: comment,
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
  };
  state.audit_events.unshift(newAudit);
}

// ----------------- API Methods Implementation -----------------

export const localApi = {
  getHealth: async () => ({
    status: 'healthy',
    mode: 'frontend_static',
    environment: 'DEMO ENVIRONMENT',
    evaluation_date: '2026-04-15',
    storage: 'browser_local_storage'
  }),

  getUsers: async (): Promise<User[]> => {
    const s = getState();
    return s.users;
  },

  getDashboard: async (): Promise<DashboardData> => {
    const s = getState();
    const total = s.applications.length;
    const underReview = s.applications.filter((a) => ['Processing', 'In review', 'Ready for review'].includes(a.workflow_status)).length;
    const needsAttention = s.applications.filter((a) => ['Possible deficiency', 'Needs clarification'].includes(a.compliance_outcome)).length;
    const pendingVerification = s.applications.filter((a) => ['Verification pending', 'Manual review required'].includes(a.verification_status)).length;
    const escalated = s.applications.filter((a) => a.workflow_status === 'Escalated').length;
    const completed = s.applications.filter((a) => a.workflow_status === 'Completed').length;

    const workload: Record<string, number> = {
      'New': 0,
      'Ready for review': 0,
      'In review': 0,
      'Clarification requested': 0,
      'Escalated': 0,
      'Completed': 0
    };
    s.applications.forEach((a) => {
      if (workload[a.workflow_status] !== undefined) {
        workload[a.workflow_status]++;
      }
    });

    const recentAlerts = s.alerts
      .filter((a) => a.status === 'active')
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        title: a.title,
        application_id: a.application_id,
        priority: a.priority,
        reason: a.reason,
        created_at: a.created_at
      }));

    return {
      metrics: {
        total_applications: total,
        under_review: underReview,
        needs_attention: needsAttention,
        pending_verification: pendingVerification,
        escalated_cases: escalated,
        completed_cases: completed
      },
      workload_by_status: workload,
      recent_alerts: recentAlerts,
      catalogue_coverage: {
        categories: s.catalogue_categories.length,
        document_requirements: s.catalogue_documents.length,
        candidate_rules: s.catalogue_candidate_rules.length,
        external_references: s.catalogue_external_refs.length,
        approved_executable_rules: s.rules.filter((r) => r.status === 'approved').length,
        draft_governance_rules: s.rules.filter((r) => r.status !== 'approved').length
      },
      environment: {
        name: 'DEMO ENVIRONMENT',
        banner: 'DEMO ENVIRONMENT — SYNTHETIC DATA — NOT CONNECTED TO AICTE',
        evaluation_date: '2026-04-15'
      }
    };
  },

  seedDemo: async () => {
    resetLocalDemoData();
    return { status: 'success', message: 'Demo data successfully reset to initial deterministic state.' };
  },

  importWorkbook: async () => {
    const s = getState();
    return {
      status: 'success',
      total_imported: 2042,
      categories: s.catalogue_categories.length,
      documents: s.catalogue_documents.length,
      candidate_rules: s.catalogue_candidate_rules.length,
      external_references: s.catalogue_external_refs.length
    };
  },

  getConnectors: async () => {
    const s = getState();
    return s.connectors;
  },

  toggleConnector: async (id: string) => {
    const s = getState();
    const conn = s.connectors.find((c) => c.id === id);
    if (conn) {
      conn.status = conn.status.includes('Active') ? 'Disabled' : 'Active (Mock)';
      saveState(s);
    }
    return conn;
  },

  getApplications: async (params?: Record<string, string>): Promise<Application[]> => {
    const s = getState();
    let apps = s.applications.map((app) => {
      const docCount = s.documents.filter((d) => d.application_id === app.id).length;
      const findCount = s.findings.filter((f) => f.application_id === app.id).length;
      return {
        ...app,
        documents_count: docCount,
        findings_count: findCount
      };
    });

    if (params) {
      if (params.search) {
        const q = params.search.toLowerCase();
        apps = apps.filter((a) => a.id.toLowerCase().includes(q) || a.institution_name.toLowerCase().includes(q));
      }
      if (params.status && params.status !== 'all') {
        apps = apps.filter((a) => a.workflow_status === params.status);
      }
      if (params.outcome && params.outcome !== 'all') {
        apps = apps.filter((a) => a.compliance_outcome === params.outcome);
      }
    }

    return apps;
  },

  getApplicationDetail: async (id: string): Promise<Application> => {
    const s = getState();
    const app = s.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application ${id} not found`);

    const fields = s.application_fields.filter((f) => f.application_id === id);
    const docs = s.documents
      .filter((d) => d.application_id === id)
      .map((d) => {
        const extractions = s.document_extractions.filter((e) => e.document_id === d.id);
        return {
          ...d,
          extractions
        };
      });
    const findings = s.findings.filter((f) => f.application_id === id);

    return {
      ...app,
      fields,
      documents: docs,
      findings
    };
  },

  runValidation: async (id: string) => {
    const s = getState();
    const app = s.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application ${id} not found`);

    const runId = `VR-${new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14)}`;
    const prevStatus = app.workflow_status;
    app.workflow_status = 'In review';
    app.updated_at = new Date().toISOString();

    logAudit(
      s,
      'VALIDATION_EXECUTED',
      id,
      undefined,
      undefined,
      `Executed validation run ${runId} against rule-set ${app.rule_set} v${app.rule_set_version} (Fixed date: 2026-04-15)`,
      prevStatus,
      'In review'
    );

    saveState(s);

    return {
      validation_run_id: runId,
      rules_evaluated: 5,
      deficiency_count: 2,
      clarification_count: 2,
      passed_count: 1
    };
  },

  reviewFinding: async (findingId: string, action: string, reason: string) => {
    const s = getState();
    const finding = s.findings.find((f) => f.id === findingId);
    if (!finding) throw new Error(`Finding ${findingId} not found`);

    const prevReview = finding.review_status;
    finding.review_status = action === 'dismiss' ? 'dismissed' : 'confirmed';
    finding.reviewer_name = currentUsername;
    finding.reviewer_role = currentRole;
    finding.reviewer_reason = reason;
    finding.reviewed_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    logAudit(
      s,
      'FINDING_REVIEWED',
      finding.application_id,
      findingId,
      finding.rule_id,
      `Review recorded: ${action.toUpperCase()} — "${reason}"`,
      prevReview,
      finding.review_status
    );

    saveState(s);
    return finding;
  },

  requestClarification: async (id: string, notes: string) => {
    const s = getState();
    const app = s.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application ${id} not found`);

    const prev = app.workflow_status;
    app.workflow_status = 'Clarification requested';
    app.clarification_notes = notes;
    app.updated_at = new Date().toISOString();

    logAudit(s, 'CLARIFICATION_REQUESTED', id, undefined, undefined, `Clarification request issued: ${notes}`, prev, app.workflow_status);

    saveState(s);
    return app;
  },

  escalateApplication: async (id: string, reason: string) => {
    const s = getState();
    const app = s.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application ${id} not found`);

    const prev = app.workflow_status;
    app.workflow_status = 'Escalated';
    app.escalation_reason = reason;
    app.escalated_by = currentUsername;
    app.escalated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    app.updated_at = new Date().toISOString();

    // Add alert
    const newAlert: Alert = {
      id: `ALT-ESC-${Date.now().toString().slice(-4)}`,
      alert_type: 'escalation_pending',
      application_id: id,
      title: `Escalated Review: ${app.institution_name}`,
      reason: `Case escalated by ${currentUsername}: ${reason}`,
      priority: 'high',
      status: 'active',
      assigned_role: 'senior_reviewer',
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    s.alerts.unshift(newAlert);

    logAudit(s, 'CASE_ESCALATED', id, undefined, undefined, `Case escalated to Senior Reviewer: ${reason}`, prev, app.workflow_status);

    saveState(s);
    return app;
  },

  recordDisposition: async (id: string, disposition: string, comment: string) => {
    const s = getState();
    const app = s.applications.find((a) => a.id === id);
    if (!app) throw new Error(`Application ${id} not found`);

    const prev = app.workflow_status;
    app.workflow_status = 'Completed';
    app.disposition = disposition;
    app.disposition_comment = comment;
    app.disposition_by = currentUsername;
    app.disposition_at = new Date().toISOString().replace('T', ' ').substring(0, 19);
    app.updated_at = new Date().toISOString();

    // Resolve any alerts for this app
    s.alerts.forEach((a) => {
      if (a.application_id === id && a.status === 'active') {
        a.status = 'resolved';
      }
    });

    logAudit(
      s,
      'DISPOSITION_RECORDED',
      id,
      undefined,
      undefined,
      `Senior Reviewer Disposition: ${disposition} — "${comment}"`,
      prev,
      'Completed'
    );

    saveState(s);
    return app;
  },

  getApplicationAudit: async (id: string): Promise<AuditEvent[]> => {
    const s = getState();
    return s.audit_events.filter((a) => a.application_id === id);
  },

  getApplicationReportData: async (id: string) => {
    const s = getState();
    const app = await localApi.getApplicationDetail(id);
    const audits = await localApi.getApplicationAudit(id);
    return {
      application: app,
      documents: app.documents || [],
      findings: app.findings || [],
      audit_trail: audits
    };
  },

  // Alerts
  getAlerts: async (params?: Record<string, string>): Promise<Alert[]> => {
    const s = getState();
    let res = [...s.alerts];
    if (params?.status && params.status !== 'all') {
      res = res.filter((a) => a.status === params.status);
    }
    return res;
  },

  acknowledgeAlert: async (alertId: string) => {
    const s = getState();
    const alert = s.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
      saveState(s);
    }
    return alert;
  },

  resolveAlert: async (alertId: string) => {
    const s = getState();
    const alert = s.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
      saveState(s);
    }
    return alert;
  },

  // Catalogue
  getCategories: async (params?: Record<string, string>): Promise<CatalogueCategory[]> => {
    const s = getState();
    let cats = [...s.catalogue_categories];
    if (params?.search) {
      const q = params.search.toLowerCase();
      cats = cats.filter((c) => c.nature_of_application.toLowerCase().includes(q) || String(c.cat_id).includes(q));
    }
    return cats;
  },

  updateCategoryMapping: async (catId: number, mappingStatus: string, mappingNotes?: string) => {
    const s = getState();
    const cat = s.catalogue_categories.find((c) => c.cat_id === catId || c.id === catId);
    if (cat) {
      cat.mapping_status = mappingStatus;
      if (mappingNotes) cat.mapping_notes = mappingNotes;
      saveState(s);
    }
    return cat;
  },

  getCatalogueDocuments: async (params?: Record<string, string>) => {
    const s = getState();
    let items = [...s.catalogue_documents];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((d) => d.text.toLowerCase().includes(q) || (d.section && d.section.toLowerCase().includes(q)));
    }
    if (params?.annexure && params.annexure !== 'all') {
      items = items.filter((d) => d.annexure === params.annexure);
    }
    if (params?.kind && params.kind !== 'all') {
      items = items.filter((d) => d.kind === params.kind);
    }

    const total = items.length;
    const skip = params?.skip ? parseInt(params.skip) : 0;
    const limit = params?.limit ? parseInt(params.limit) : 25;
    const paged = items.slice(skip, skip + limit);

    return { total, skip, limit, items: paged };
  },

  getCandidateRules: async (params?: Record<string, string>) => {
    const s = getState();
    let items = [...s.catalogue_candidate_rules];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((c) => c.sentence.toLowerCase().includes(q) || c.cand_id.toLowerCase().includes(q));
    }
    if (params?.lifecycle_status && params.lifecycle_status !== 'all') {
      items = items.filter((c) => c.lifecycle_status === params.lifecycle_status);
    }
    if (params?.modality && params.modality !== 'all') {
      items = items.filter((c) => c.modality === params.modality);
    }

    const total = items.length;
    const skip = params?.skip ? parseInt(params.skip) : 0;
    const limit = params?.limit ? parseInt(params.limit) : 25;
    const paged = items.slice(skip, skip + limit);

    return { total, skip, limit, items: paged };
  },

  updateCandidateLifecycle: async (candId: string, lifecycleStatus: string, reviewNotes?: string) => {
    const s = getState();
    const cand = s.catalogue_candidate_rules.find((c) => c.cand_id === candId);
    if (cand) {
      cand.lifecycle_status = lifecycleStatus;
      if (reviewNotes) cand.review_notes = reviewNotes;
      cand.reviewed_by = currentUsername;
      saveState(s);
    }
    return cand;
  },

  getExternalRefs: async (params?: Record<string, string>) => {
    const s = getState();
    let items = [...s.catalogue_external_refs];
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter((r) => r.sentence.toLowerCase().includes(q) || (r.keywords && r.keywords.toLowerCase().includes(q)));
    }
    if (params?.integration_status && params.integration_status !== 'all') {
      items = items.filter((r) => r.integration_status === params.integration_status);
    }

    const total = items.length;
    const skip = params?.skip ? parseInt(params.skip) : 0;
    const limit = params?.limit ? parseInt(params.limit) : 25;
    const paged = items.slice(skip, skip + limit);

    return { total, skip, limit, items: paged };
  },

  getCatalogueCoverage: async () => {
    const s = getState();
    const docsByKind: Record<string, number> = {};
    const docsByAnnexure: Record<string, number> = {};
    s.catalogue_documents.forEach((d) => {
      docsByKind[d.kind] = (docsByKind[d.kind] || 0) + 1;
      docsByAnnexure[d.annexure] = (docsByAnnexure[d.annexure] || 0) + 1;
    });

    const candByType: Record<string, number> = {};
    const candByLifecycle: Record<string, number> = {};
    s.catalogue_candidate_rules.forEach((c) => {
      const tg = c.type_guess || 'general';
      candByType[tg] = (candByType[tg] || 0) + 1;
      candByLifecycle[c.lifecycle_status] = (candByLifecycle[c.lifecycle_status] || 0) + 1;
    });

    const extByStatus: Record<string, number> = {};
    s.catalogue_external_refs.forEach((r) => {
      extByStatus[r.integration_status] = (extByStatus[r.integration_status] || 0) + 1;
    });

    return {
      categories: {
        total: s.catalogue_categories.length,
        unresolved_mappings: s.catalogue_categories.filter((c) => c.mapping_status === 'unresolved_needs_review').length,
      },
      documents: {
        total: s.catalogue_documents.length,
        by_annexure: docsByAnnexure,
        by_kind: docsByKind,
        conditional_items: s.catalogue_documents.filter((d) => d.conditional).length
      },
      candidate_rules: {
        total: s.catalogue_candidate_rules.length,
        by_type_guess: candByType,
        by_lifecycle: candByLifecycle,
        with_numbers: s.catalogue_candidate_rules.filter((c) => c.has_number).length,
        conditional: s.catalogue_candidate_rules.filter((c) => c.conditional).length
      },
      external_references: {
        total: s.catalogue_external_refs.length,
        by_integration_status: extByStatus
      },
      rules_governance_coverage: {
        approved_executable_rules: s.rules.filter((r) => r.status === 'approved').length,
        draft_governance_rules: s.rules.filter((r) => r.status !== 'approved').length
      }
    };
  },

  // Governance Rules
  getRules: async (params?: Record<string, string>): Promise<Rule[]> => {
    const s = getState();
    let list = [...s.rules];
    if (params?.status && params.status !== 'all') {
      list = list.filter((r) => r.status === params.status);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter((r) => r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
    }
    return list;
  },

  getRuleDetail: async (id: string): Promise<Rule> => {
    const s = getState();
    const r = s.rules.find((item) => item.id === id || item.code === id);
    if (!r) throw new Error(`Rule ${id} not found`);
    return r;
  },

  createRuleDraft: async (payload: any): Promise<Rule> => {
    const s = getState();
    const newRule: Rule = {
      id: `RULE-DRAFT-${Date.now().toString().slice(-4)}`,
      code: payload.code || `DRAFT-${Date.now().toString().slice(-4)}`,
      title: payload.title || 'Untitled Draft Rule',
      description: payload.description || '',
      category_id: payload.category_id || 1,
      check_type: payload.check_type || 'document_validity',
      source_reference: payload.source_reference || 'AICTE APH 2024-27',
      source_clause: payload.source_clause || 'Clause 2.1',
      handbook_page: payload.handbook_page || 15,
      parameters_json: JSON.stringify(payload.parameters || {}),
      status: 'draft',
      created_by: currentUsername,
      current_version: '0.1-draft',
      effective_date: '2026-04-15',
      test_cases_json: '[]',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    s.rules.push(newRule);
    saveState(s);
    return newRule;
  },

  submitRuleForReview: async (id: string): Promise<Rule> => {
    const s = getState();
    const r = s.rules.find((item) => item.id === id || item.code === id);
    if (!r) throw new Error(`Rule ${id} not found`);
    r.status = 'submitted_for_approval';
    r.updated_at = new Date().toISOString();
    saveState(s);
    return r;
  },

  approveRule: async (id: string, comment: string): Promise<Rule> => {
    const s = getState();
    const r = s.rules.find((item) => item.id === id || item.code === id);
    if (!r) throw new Error(`Rule ${id} not found`);
    r.status = 'approved';
    r.approved_by = currentUsername;
    r.current_version = '1.0';
    r.updated_at = new Date().toISOString();

    const newVersion: RuleVersion = {
      id: s.rule_versions.length + 1,
      rule_id: r.id,
      version: '1.0',
      definition_json: r.parameters_json || '{}',
      changelog: comment || 'Approved for automated compliance evaluation',
      status: 'published',
      submitted_by: r.created_by,
      approved_by: currentUsername,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    s.rule_versions.push(newVersion);

    saveState(s);
    return r;
  },

  rejectRule: async (id: string, reason: string): Promise<Rule> => {
    const s = getState();
    const r = s.rules.find((item) => item.id === id || item.code === id);
    if (!r) throw new Error(`Rule ${id} not found`);
    r.status = 'rejected';
    r.updated_at = new Date().toISOString();
    saveState(s);
    return r;
  },

  getRuleVersions: async (id: string): Promise<RuleVersion[]> => {
    const s = getState();
    return s.rule_versions.filter((v) => v.rule_id === id);
  },

  testRule: async (_id: string, _payload: any) => {
    return {
      passed: true,
      message: 'Rule syntax and mock validation test passed successfully against demo parameters.'
    };
  }
};
