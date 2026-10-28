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
  User,
  ManualVerificationTask,
  ComplianceChecklistItem
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
  manual_verification_tasks: ManualVerificationTask[];
  compliance_checklist_items: ComplianceChecklistItem[];
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

const defaultManualTasks: ManualVerificationTask[] = [
  {
    id: "TASK-014-01",
    application_id: "VA-DEMO-2026-014",
    finding_id: "FIND-014-001",
    rule_code: "DOC-FIRE-EXPIRY",
    rule_id: "RULE-APH-001",
    title: "Fire Safety Certificate Expiry Verification",
    trigger_reason: "The extracted certificate validity date (2025-12-31) is earlier than the evaluation date (2026-04-15). Officer must verify whether renewal receipt or renewed NOC has been produced.",
    linked_document_id: "DOC-014-01",
    linked_document_name: "Fire_Safety_Certificate.pdf",
    relevant_rule_clause: "APH 2026–27 Ch. II §2.1.3 & Annexure 2 §2.1 Item 2",
    previous_automated_result: "Possible deficiency (Validity expired 2025-12-31)",
    assigned_reviewer: "Officer A",
    status: "pending",
    evidence_excerpt: "Fire Safety Certificate #FS-2023-8891 valid until: 2025-12-31",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 09:30:00"
  },
  {
    id: "TASK-014-02",
    application_id: "VA-DEMO-2026-014",
    finding_id: "FIND-014-002",
    rule_code: "DECL-FORM-STUDENT-DATA",
    rule_id: "RULE-APH-002",
    title: "Student Enrollment Affidavit vs Form Reconciliation",
    trigger_reason: "Form field marked 'No' for student data upload completion while submitted Affidavit Para 4 explicitly affirms full compliance. Reconciliation required.",
    linked_document_id: "DOC-014-02",
    linked_document_name: "Affidavit_Self_Disclosure.pdf",
    relevant_rule_clause: "APH 2026–27 Table 4.2 Para 4",
    previous_automated_result: "Needs clarification (Field 'No' vs Affidavit affirmation)",
    assigned_reviewer: "Officer A",
    status: "in_progress",
    reviewer_remarks: "Reviewed affidavit page 2, signed by Trust President. Form field entry appears to be a clerical typo during online submission.",
    evidence_excerpt: "Affidavit: 'Uploaded student data complete' | Structured Field: 'No'",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 10:15:00"
  },
  {
    id: "TASK-014-03",
    application_id: "VA-DEMO-2026-014",
    finding_id: "FIND-014-003",
    rule_code: "CHECKLIST-MISSING-DOC",
    rule_id: "RULE-APH-003",
    title: "Barrier-Free Built Environment & PwD Norms Inspection",
    trigger_reason: "Mandatory certificate of Barrier-Free Built Environment is missing from application dossier under Annexure 2 §2.1 Item 6.",
    linked_document_id: undefined,
    linked_document_name: "Dossier Checklist",
    relevant_rule_clause: "Annexure 2 §2.1 Item 6 (Barrier-Free Architecture)",
    previous_automated_result: "Possible deficiency (Document missing from dossier)",
    assigned_reviewer: "Officer A",
    status: "pending",
    evidence_excerpt: "Checklist Item #6 (Annexure 2 §2.1): Not submitted",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 09:30:00"
  },
  {
    id: "TASK-014-04",
    application_id: "VA-DEMO-2026-014",
    finding_id: "FIND-014-004",
    rule_code: "ISSUER-VERIFY-CHECK",
    rule_id: "RULE-APH-004",
    title: "State Fire Services Issuer Registry Mismatch Follow-up",
    trigger_reason: "Simulated external state fire authority connector returned mismatch status 'Revoked / Not Renewed'. Requires officer verification with issuing division.",
    linked_document_id: "DOC-014-01",
    linked_document_name: "Fire_Safety_Certificate.pdf",
    relevant_rule_clause: "APH Ch. II Clause 4.1 External Verification Norms",
    previous_automated_result: "Needs clarification (Issuer registry mismatch simulated)",
    assigned_reviewer: "Officer A",
    status: "pending",
    evidence_excerpt: "Connector: Demo Issuer Connector (SIMULATED) | Result: Mismatch detected",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 09:30:00"
  },
  {
    id: "TASK-014-05",
    application_id: "VA-DEMO-2026-014",
    finding_id: "FIND-014-005",
    rule_code: "OCR-CONFIDENCE-LOW",
    rule_id: "RULE-APH-005",
    title: "Audited Accounts Operating Reserve Extraction Verification",
    trigger_reason: "OCR extraction pipeline flagged low confidence (62%) on operating reserve amount field from Balance Sheet.",
    linked_document_id: "DOC-014-04",
    linked_document_name: "Audited_Accounts_FY2024-25.pdf",
    relevant_rule_clause: "APH Table 5.1 Financial Operating Reserves",
    previous_automated_result: "Needs clarification (OCR confidence 62%)",
    assigned_reviewer: "Officer A",
    status: "verified",
    reviewer_remarks: "Manually inspected original PDF page 1. Figure is clearly legible as 'Rs. 45,00,000'. Matches audited balance sheet schedule III.",
    justification_note: "Visual inspection confirms amount meets AICTE operating reserve threshold.",
    evidence_excerpt: "Extracted: 'Rs. 45,00,000' (Confidence: 0.62) -> Verified visually",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 11:00:00",
    completed_at: "2026-04-15 11:00:00",
    completed_by: "Officer A"
  },
  {
    id: "TASK-015-01",
    application_id: "VA-DEMO-2026-015",
    rule_code: "LAND-TITLE-REGISTRY",
    rule_id: "RULE-APH-006",
    title: "Land Ownership Sale Deed & Sub-Registrar Clearance",
    trigger_reason: "New technical institution application requires manual cross-check of 7.50 acres registered ownership deed.",
    linked_document_id: "DOC-015-01",
    linked_document_name: "Land_Title_Deed_Registered.pdf",
    relevant_rule_clause: "APH 2026–27 Ch. I §1.4 Land Norms",
    previous_automated_result: "Met (Self-reported 7.50 Acres >= 5.0 Acres required)",
    assigned_reviewer: "Officer B",
    status: "verified",
    reviewer_remarks: "Registered deed verified. Khasra / Survey Nos 102, 103, 104 in name of Trust registered for 99-year perpetual lease.",
    justification_note: "Clear title certificate issued by Government Pleader attached.",
    evidence_excerpt: "Registered Lease Deed Volume 442, Page 11-28, Sub-Registrar Office",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 11:30:00",
    completed_at: "2026-04-15 11:30:00",
    completed_by: "Officer B"
  },
  {
    id: "TASK-015-02",
    application_id: "VA-DEMO-2026-015",
    rule_code: "BUILDING-COMPLETION-SANCTION",
    rule_id: "RULE-APH-007",
    title: "Approved Master Building Plan & Fire Staircase Layout",
    trigger_reason: "Physical verification of instructional area (9,500 sq.m) against municipal approved plan.",
    linked_document_id: "DOC-015-02",
    linked_document_name: "Municipal_Building_Plan_Approval.pdf",
    relevant_rule_clause: "APH 2026–27 Ch. I §1.6 Built-Up Area Norms",
    previous_automated_result: "Met (12,450 sq.m built-up exceeds required 8,000 sq.m)",
    assigned_reviewer: "Officer B",
    status: "pending",
    evidence_excerpt: "Municipal Sanction Order #MUN-B-2025-449",
    created_at: "2026-04-15 09:30:00",
    updated_at: "2026-04-15 09:30:00"
  }
];

const defaultChecklistItems: ComplianceChecklistItem[] = [
  { id: "CHK-014-01", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.1", annexure: "Annexure 2", section: "§2.1", item_no: "1", requirement_title: "Signed Self-Disclosure Affidavit", requirement_description: "Self-disclosure in the prescribed format on non-judicial stamp paper affirmed by Chairman/Secretary.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", linked_document_id: "DOC-014-02", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-02", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.2", annexure: "Annexure 2", section: "§2.1", item_no: "2", requirement_title: "Valid Fire Safety Certificate / NOC", requirement_description: "Fire safety certificate issued by the competent Fire Service Authority of the concerned State/UT.", is_mandatory: true, automated_status: "deficiency", manual_status: "discrepancy", overall_status: "non_compliant", linked_document_id: "DOC-014-01", notes: "Certificate validity lapsed 2025-12-31; renewed clearance mandatory.", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-03", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.3", annexure: "Annexure 2", section: "§2.1", item_no: "3", requirement_title: "Structural Stability Certificate", requirement_description: "Structural stability certificate issued by registered Structural Engineer confirming safety standards.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", linked_document_id: "DOC-014-03", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-04", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.4", annexure: "Annexure 2", section: "§2.1", item_no: "4", requirement_title: "Building Occupancy Certificate", requirement_description: "Occupancy Certificate / Completion Certificate issued by competent municipal authority.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", linked_document_id: "DOC-014-03", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-05", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.5", annexure: "Annexure 2", section: "§2.1", item_no: "5", requirement_title: "Audited Balance Sheet & Financial Statements", requirement_description: "Audited financial statement of preceding financial year showing operational viability and reserve.", is_mandatory: true, automated_status: "needs_clarification", manual_status: "in_progress", overall_status: "under_review", linked_document_id: "DOC-014-04", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-06", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.6", annexure: "Annexure 2", section: "§2.1", item_no: "6", requirement_title: "Barrier-Free Built Environment for PwD", requirement_description: "Certificate of barrier-free environment, ramps, lifts, and disabled-friendly toilets per PwD Act.", is_mandatory: true, automated_status: "missing", manual_status: "pending", overall_status: "non_compliant", notes: "Certificate missing from submitted dossier.", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-07", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.7", annexure: "Annexure 2", section: "§2.1", item_no: "7", requirement_title: "Internal Complaints Committee (ICC)", requirement_description: "Constitution of ICC per Gender Sensitization and Prevention of Sexual Harassment regulations.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-08", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.8", annexure: "Annexure 2", section: "§2.1", item_no: "8", requirement_title: "Anti-Ragging Committee & Squad", requirement_description: "Establishment of Anti-Ragging Committee and Squad as per AICTE Anti-Ragging Regulations.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-09", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.9", annexure: "Annexure 2", section: "§2.1", item_no: "9", requirement_title: "Student Enrollment & Faculty Portal Upload", requirement_description: "Uploading of student enrollment and complete faculty cadre data on national AICTE portal.", is_mandatory: true, automated_status: "needs_clarification", manual_status: "pending", overall_status: "under_review", notes: "Reconciliation in progress.", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-014-10", application_id: "VA-DEMO-2026-014", clause_ref: "§2.1.10", annexure: "Annexure 2", section: "§2.1", item_no: "10", requirement_title: "Processing Fee Payment Realization", requirement_description: "Payment of regulatory processing fee and realization in AICTE accounts.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", linked_document_id: "DOC-014-06", updated_at: "2026-04-15 09:30:00" },

  // For VA-DEMO-2026-015
  { id: "CHK-015-01", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.1", annexure: "Annexure 1", section: "§1.1", item_no: "1", requirement_title: "Registered Land Sale / Lease Deed (>30 yrs)", requirement_description: "Registered land documents in the name of the Applicant Society/Trust for minimum 30 years.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", linked_document_id: "DOC-015-01", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-02", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.2", annexure: "Annexure 1", section: "§1.1", item_no: "2", requirement_title: "Land Use / Conversion Certificate", requirement_description: "Land Use Certificate from Competent Revenue Authority designating institutional educational use.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-03", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.3", annexure: "Annexure 1", section: "§1.1", item_no: "3", requirement_title: "Approved Master Building Plan", requirement_description: "Approved Building Plan from Town Planning Authority showing instructional area.", is_mandatory: true, automated_status: "met", manual_status: "in_progress", overall_status: "under_review", linked_document_id: "DOC-015-02", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-04", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.4", annexure: "Annexure 1", section: "§1.1", item_no: "4", requirement_title: "AICTE Joint Fixed Deposit Receipt (FDR)", requirement_description: "Endowment fund creation in joint name of AICTE and applicant society/trust.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-05", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.5", annexure: "Annexure 1", section: "§1.1", item_no: "5", requirement_title: "Barrier-Free Built Environment & Lift", requirement_description: "Barrier-free environment certificate and accessibility compliance.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-06", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.6", annexure: "Annexure 1", section: "§1.1", item_no: "6", requirement_title: "Fire & Life Safety Clearance", requirement_description: "Valid fire certificate issued by competent State Fire Authority.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-07", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.7", annexure: "Annexure 1", section: "§1.1", item_no: "7", requirement_title: "Potable Water and Sanitary Clearance", requirement_description: "Water and sanitary certificate from competent public health division.", is_mandatory: true, automated_status: "met", manual_status: "verified", overall_status: "compliant", updated_at: "2026-04-15 09:30:00" },
  { id: "CHK-015-08", application_id: "VA-DEMO-2026-015", clause_ref: "§1.1.8", annexure: "Annexure 1", section: "§1.1", item_no: "8", requirement_title: "Faculty Cadre Recruitment Plan (1:2:6)", requirement_description: "Affidavit and roster plan for faculty recruitment maintaining Cadre Ratio 1:2:6.", is_mandatory: true, automated_status: "met", manual_status: "in_progress", overall_status: "under_review", updated_at: "2026-04-15 09:30:00" }
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
    connectors: defaultConnectors,
    manual_verification_tasks: JSON.parse(JSON.stringify(defaultManualTasks)),
    compliance_checklist_items: JSON.parse(JSON.stringify(defaultChecklistItems))
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
        if (!memoryState.manual_verification_tasks || memoryState.manual_verification_tasks.length === 0) {
          memoryState.manual_verification_tasks = JSON.parse(JSON.stringify(defaultManualTasks));
        }
        if (!memoryState.compliance_checklist_items || memoryState.compliance_checklist_items.length === 0) {
          memoryState.compliance_checklist_items = JSON.parse(JSON.stringify(defaultChecklistItems));
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
        name: 'VerifyAI Operations Console',
        banner: '',
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
      const pendingTasks = (s.manual_verification_tasks || []).filter(
        (t) => t.application_id === app.id && ['pending', 'in_progress'].includes(t.status)
      ).length;

      let nextAction = 'Inspect application workspace';
      if (pendingTasks > 0) {
        nextAction = `Complete ${pendingTasks} pending manual check${pendingTasks > 1 ? 's' : ''}`;
      } else if (app.workflow_status === 'Ready for review') {
        nextAction = 'Run automated rule validation';
      } else if (app.workflow_status === 'Clarification requested') {
        nextAction = 'Awaiting applicant response';
      } else if (app.workflow_status === 'Escalated') {
        nextAction = 'Senior Reviewer disposition pending';
      } else if (app.workflow_status === 'Completed') {
        nextAction = 'Scrutiny completed';
      } else {
        nextAction = 'Ready for Senior Reviewer sign-off';
      }

      return {
        ...app,
        institution_code: app.institution_code || (app.id === 'VA-DEMO-2026-014' ? 'AICTE-1-10928374' : 'AICTE-1-45892341'),
        documents_count: docCount,
        findings_count: findCount,
        pending_tasks_count: pendingTasks,
        next_recommended_action: nextAction
      };
    });

    if (params) {
      if (params.search) {
        const q = params.search.toLowerCase().trim();
        apps = apps.filter(
          (a) =>
            a.id.toLowerCase().includes(q) ||
            a.institution_name.toLowerCase().includes(q) ||
            (a.institution_code && a.institution_code.toLowerCase().includes(q))
        );
      }
      if (params.academic_year && params.academic_year !== 'all') {
        apps = apps.filter((a) => a.academic_year === params.academic_year);
      }
      if (params.nature && params.nature !== 'all') {
        apps = apps.filter((a) => a.nature_of_application === params.nature);
      }
      const st = params.status || params.workflow_status;
      if (st && st !== 'all') {
        apps = apps.filter((a) => a.workflow_status === st);
      }
      const out = params.outcome || params.compliance_outcome;
      if (out && out !== 'all') {
        apps = apps.filter((a) => a.compliance_outcome === out);
      }
      if (params.verification_status && params.verification_status !== 'all') {
        apps = apps.filter((a) => a.verification_status === params.verification_status);
      }
      if (params.assigned_officer && params.assigned_officer !== 'all') {
        apps = apps.filter((a) => a.assigned_officer === params.assigned_officer);
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
    const tasks = (s.manual_verification_tasks || []).filter((t) => t.application_id === id);
    const checklist = (s.compliance_checklist_items || []).filter((c) => c.application_id === id);

    const pendingCount = tasks.filter((t) => ['pending', 'in_progress'].includes(t.status)).length;
    let nextAction = 'Inspect application workspace';
    if (pendingCount > 0) {
      nextAction = `Complete ${pendingCount} pending manual check${pendingCount > 1 ? 's' : ''}`;
    } else if (app.workflow_status === 'Ready for review') {
      nextAction = 'Run automated rule validation';
    } else if (app.workflow_status === 'Clarification requested') {
      nextAction = 'Awaiting applicant response';
    } else if (app.workflow_status === 'Escalated') {
      nextAction = 'Senior Reviewer disposition pending';
    } else if (app.workflow_status === 'Completed') {
      nextAction = 'Scrutiny completed';
    } else {
      nextAction = 'Ready for Senior Reviewer sign-off';
    }

    return {
      ...app,
      institution_code: app.institution_code || (app.id === 'VA-DEMO-2026-014' ? 'AICTE-1-10928374' : 'AICTE-1-45892341'),
      intake_capacity: app.intake_capacity || (app.id === 'VA-DEMO-2026-014' ? 420 : 360),
      total_faculty: app.total_faculty || (app.id === 'VA-DEMO-2026-014' ? 28 : 24),
      land_area_acres: app.land_area_acres || (app.id === 'VA-DEMO-2026-014' ? 5.25 : 7.50),
      built_up_area_sqm: app.built_up_area_sqm || (app.id === 'VA-DEMO-2026-014' ? 12450.0 : 18500.0),
      trust_name: app.trust_name || (app.id === 'VA-DEMO-2026-014' ? 'Demo Educational Trust' : 'Apex Foundation for Higher Education'),
      fields,
      documents: docs,
      findings,
      manual_tasks: tasks,
      compliance_checklist: checklist,
      pending_tasks_count: pendingCount,
      next_recommended_action: nextAction
    };
  },

  getManualTasks: async (applicationId: string): Promise<ManualVerificationTask[]> => {
    const s = getState();
    return (s.manual_verification_tasks || []).filter((t) => t.application_id === applicationId);
  },

  updateManualTask: async (
    applicationId: string,
    taskId: string,
    action: string,
    remarks?: string,
    justification?: string
  ): Promise<ManualVerificationTask> => {
    const s = getState();
    if (!s.manual_verification_tasks) s.manual_verification_tasks = defaultManualTasks;
    const task = s.manual_verification_tasks.find((t) => t.id === taskId && t.application_id === applicationId);
    if (!task) throw new Error(`Manual verification task ${taskId} not found`);

    const prevStatus = task.status;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    let auditAction = 'TASK_UPDATED';
    let comment = remarks || justification || `Task status updated to ${action}`;

    if (action === 'start') {
      task.status = 'in_progress';
      auditAction = 'TASK_STARTED';
      comment = 'Officer started manual verification on task.';
    } else if (action === 'save_progress') {
      if (remarks) task.reviewer_remarks = remarks;
      auditAction = 'TASK_PROGRESS_SAVED';
      comment = `Reviewer notes saved: ${remarks || 'Draft updated'}`;
    } else if (action === 'mark_verified') {
      if (!remarks && !justification) throw new Error('Verification notes are required to mark verified');
      task.status = 'verified';
      task.reviewer_remarks = remarks || task.reviewer_remarks;
      task.justification_note = justification || task.justification_note;
      task.completed_at = now;
      task.completed_by = currentUsername;
      auditAction = 'TASK_VERIFIED';
      comment = `Task marked Verified: ${remarks || justification}`;
    } else if (action === 'discrepancy') {
      if (!remarks && !justification) throw new Error('Discrepancy justification note is mandatory');
      task.status = 'discrepancy';
      task.reviewer_remarks = remarks || task.reviewer_remarks;
      task.justification_note = justification || task.justification_note;
      task.completed_at = now;
      task.completed_by = currentUsername;
      auditAction = 'TASK_DISCREPANCY_RECORDED';
      comment = `Discrepancy recorded: ${remarks || justification}`;
    } else if (action === 'unable_to_verify') {
      if (!remarks && !justification) throw new Error('Justification explaining why verification is impossible is required');
      task.status = 'unable_to_verify';
      task.reviewer_remarks = remarks || task.reviewer_remarks;
      task.justification_note = justification || task.justification_note;
      task.completed_at = now;
      task.completed_by = currentUsername;
      auditAction = 'TASK_UNABLE_TO_VERIFY';
      comment = `Marked Unable to Verify: ${remarks || justification}`;
    } else if (action === 'clarification_requested') {
      if (!remarks) throw new Error('Clarification requirements must be specified');
      task.status = 'clarification_requested';
      task.reviewer_remarks = remarks;
      auditAction = 'TASK_EVIDENCE_REQUESTED';
      comment = `Further evidence requested from applicant: ${remarks}`;
    } else if (action === 'not_applicable') {
      if (!justification) throw new Error('Regulatory exemption justification is mandatory for Not Applicable');
      task.status = 'not_applicable';
      task.justification_note = justification;
      task.reviewer_remarks = remarks || task.reviewer_remarks;
      task.completed_at = now;
      task.completed_by = currentUsername;
      auditAction = 'TASK_MARKED_NOT_APPLICABLE';
      comment = `Marked Not Applicable per exemption: ${justification}`;
    } else if (action === 'reopen') {
      task.status = 'in_progress';
      task.completed_at = undefined;
      task.completed_by = undefined;
      auditAction = 'TASK_REOPENED';
      comment = `Completed task reopened for re-inspection: ${remarks || 'Re-evaluation authorized'}`;
    } else {
      throw new Error(`Unsupported task action: ${action}`);
    }

    task.updated_at = now;

    // Update corresponding finding review status or compliance checklist if linked
    if (task.finding_id) {
      const finding = s.findings.find((f) => f.id === task.finding_id);
      if (finding) {
        if (task.status === 'verified') {
          finding.review_status = 'confirmed';
          finding.reviewer_name = currentUsername;
          finding.reviewer_role = currentRole;
          finding.reviewer_reason = `Verified via manual check ${task.id}`;
          finding.reviewed_at = now;
        } else if (task.status === 'discrepancy') {
          finding.review_status = 'confirmed';
          finding.reviewer_name = currentUsername;
          finding.reviewer_role = currentRole;
          finding.reviewer_reason = `Discrepancy confirmed via manual check: ${remarks || justification}`;
          finding.reviewed_at = now;
        }
      }
    }

    logAudit(
      s,
      auditAction,
      applicationId,
      task.finding_id,
      task.rule_id,
      comment,
      prevStatus,
      task.status
    );

    saveState(s);
    return task;
  },

  getComplianceChecklist: async (applicationId: string): Promise<ComplianceChecklistItem[]> => {
    const s = getState();
    return (s.compliance_checklist_items || []).filter((c) => c.application_id === applicationId);
  },

  updateChecklistItem: async (
    applicationId: string,
    itemId: string,
    manualStatus: string,
    notes?: string
  ): Promise<ComplianceChecklistItem> => {
    const s = getState();
    const item = s.compliance_checklist_items.find((c) => c.id === itemId && c.application_id === applicationId);
    if (!item) throw new Error(`Checklist item ${itemId} not found`);

    item.manual_status = manualStatus as any;
    if (notes) item.notes = notes;
    item.updated_at = new Date().toISOString().replace('T', ' ').substring(0, 19);

    if (manualStatus === 'verified' && (item.automated_status === 'met' || item.automated_status === 'not_evaluated')) {
      item.overall_status = 'compliant';
    } else if (manualStatus === 'discrepancy' || item.automated_status === 'deficiency' || item.automated_status === 'missing') {
      item.overall_status = 'non_compliant';
    } else {
      item.overall_status = 'under_review';
    }

    logAudit(
      s,
      'CHECKLIST_ITEM_REVIEWED',
      applicationId,
      undefined,
      undefined,
      `Checklist requirement ${item.clause_ref} (${item.requirement_title}) updated to ${manualStatus}. ${notes || ''}`
    );

    saveState(s);
    return item;
  },

  intakeApplication: async (payload: {
    institution_name: string;
    institution_code?: string;
    academic_year?: string;
    nature_of_application: string;
    category_id?: number;
    trust_name?: string;
    intake_capacity?: number;
    land_area_acres?: number;
    built_up_area_sqm?: number;
    assigned_officer?: string;
    notes?: string;
  }): Promise<Application> => {
    const s = getState();
    const count = s.applications.length + 1;
    const appId = `VA-APP-2026-${String(count).padStart(3, '0')}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newApp: Application = {
      id: appId,
      institution_name: payload.institution_name,
      institution_code: payload.institution_code || `AICTE-1-${Math.floor(10000000 + Math.random() * 90000000)}`,
      academic_year: payload.academic_year || '2026–27',
      nature_of_application: payload.nature_of_application,
      category_id: payload.category_id || 1,
      workflow_status: 'Ready for review',
      compliance_outcome: 'Not evaluated',
      verification_status: 'Verification pending',
      processing_status: 'OK',
      assigned_officer: payload.assigned_officer || 'Officer A',
      rule_set: 'APH-DEMO-2026-27',
      rule_set_version: '1.0',
      evaluation_date: '2026-04-15',
      source_mode: 'NEW APPLICATION INTAKE — SUBMITTED TO VERIFYAI',
      intake_capacity: payload.intake_capacity || 300,
      total_faculty: Math.max(Math.floor((payload.intake_capacity || 300) / 15), 10),
      land_area_acres: payload.land_area_acres || 5.0,
      built_up_area_sqm: payload.built_up_area_sqm || 10000.0,
      trust_name: payload.trust_name || `${payload.institution_name} Society`,
      notes: payload.notes || 'Registered through Application Intake module.',
      updated_at: now
    };

    s.applications.unshift(newApp);

    // Add fields
    const initialFields = [
      { id: s.application_fields.length + 1, application_id: appId, field_key: 'institution_name', field_label: 'Institution Full Name', field_value: payload.institution_name, category: 'general', source_form_section: 'Part 1 Institutional Identity' },
      { id: s.application_fields.length + 2, application_id: appId, field_key: 'academic_year', field_label: 'Academic Year Applied', field_value: payload.academic_year || '2026–27', category: 'general', source_form_section: 'Part 1 Application Details' },
      { id: s.application_fields.length + 3, application_id: appId, field_key: 'application_category', field_label: 'Nature of Application', field_value: payload.nature_of_application, category: 'general', source_form_section: 'Part 1 Category' },
      { id: s.application_fields.length + 4, application_id: appId, field_key: 'land_area_acres', field_label: 'Total Land Area in Acres', field_value: String(payload.land_area_acres || 5.0), category: 'infrastructure', source_form_section: 'Part 2 Land & Building' },
      { id: s.application_fields.length + 5, application_id: appId, field_key: 'built_up_area_sqm', field_label: 'Total Built-Up Area (sq.m)', field_value: String(payload.built_up_area_sqm || 10000.0), category: 'infrastructure', source_form_section: 'Part 2 Land & Building' },
      { id: s.application_fields.length + 6, application_id: appId, field_key: 'approved_intake_total', field_label: 'Sanctioned Annual Student Intake', field_value: String(payload.intake_capacity || 300), category: 'academic', source_form_section: 'Part 4 Programs & Courses' }
    ];
    s.application_fields.push(...initialFields);

    // Add initial document
    const docId = `DOC-${appId.slice(-3)}-01`;
    const doc = {
      id: docId,
      application_id: appId,
      document_name: `${appId}_Self_Disclosure_Affidavit.pdf`,
      document_type: 'Affidavit and Self-Disclosure',
      checklist_item_id: 'ITEM-A2-AFFIDAVIT',
      page_count: 2,
      extraction_status: 'OK',
      signature_status: 'Digitally Signed',
      source_mode: 'SUBMITTED INSTITUTIONAL DOSSIER',
      created_at: now,
      extractions: []
    };
    s.documents.push(doc);

    // Add initial manual task
    const initTask: ManualVerificationTask = {
      id: `TASK-${appId.slice(-3)}-01`,
      application_id: appId,
      rule_code: 'INTAKE-INITIAL-INSPECTION',
      title: 'Initial Document Completeness & Affidavit Review',
      trigger_reason: 'New application registered; initial scrutiny of self-disclosure dossier required.',
      linked_document_id: docId,
      linked_document_name: `${appId}_Self_Disclosure_Affidavit.pdf`,
      relevant_rule_clause: 'APH 2026–27 Ch. II §2.1 Initial Scrutiny',
      previous_automated_result: 'Pending automated rule evaluation',
      assigned_reviewer: newApp.assigned_officer,
      status: 'pending',
      evidence_excerpt: 'Submitted initial institutional dossier',
      created_at: now,
      updated_at: now
    };
    s.manual_verification_tasks.push(initTask);

    // Initial Checklist items (cloned for this app)
    const initChecklist: ComplianceChecklistItem[] = [
      { id: `CHK-${appId.slice(-3)}-01`, application_id: appId, clause_ref: '§2.1.1', annexure: 'Annexure 2', section: '§2.1', item_no: '1', requirement_title: 'Signed Self-Disclosure Affidavit', requirement_description: 'Self-disclosure in the prescribed format on non-judicial stamp paper affirmed by Chairman/Secretary.', is_mandatory: true, automated_status: 'met', manual_status: 'pending', overall_status: 'under_review', linked_document_id: docId, updated_at: now },
      { id: `CHK-${appId.slice(-3)}-02`, application_id: appId, clause_ref: '§2.1.2', annexure: 'Annexure 2', section: '§2.1', item_no: '2', requirement_title: 'Valid Fire Safety Certificate / NOC', requirement_description: 'Fire safety certificate issued by the competent Fire Service Authority.', is_mandatory: true, automated_status: 'not_evaluated', manual_status: 'pending', overall_status: 'pending', updated_at: now },
      { id: `CHK-${appId.slice(-3)}-03`, application_id: appId, clause_ref: '§2.1.3', annexure: 'Annexure 2', section: '§2.1', item_no: '3', requirement_title: 'Structural Stability Certificate', requirement_description: 'Structural stability certificate issued by registered Structural Engineer.', is_mandatory: true, automated_status: 'not_evaluated', manual_status: 'pending', overall_status: 'pending', updated_at: now },
      { id: `CHK-${appId.slice(-3)}-04`, application_id: appId, clause_ref: '§2.1.4', annexure: 'Annexure 2', section: '§2.1', item_no: '4', requirement_title: 'Building Occupancy Certificate', requirement_description: 'Occupancy Certificate / Completion Certificate issued by competent municipal authority.', is_mandatory: true, automated_status: 'not_evaluated', manual_status: 'pending', overall_status: 'pending', updated_at: now },
      { id: `CHK-${appId.slice(-3)}-05`, application_id: appId, clause_ref: '§2.1.5', annexure: 'Annexure 2', section: '§2.1', item_no: '5', requirement_title: 'Barrier-Free Built Environment for PwD', requirement_description: 'Certificate of barrier-free environment, ramps, lifts, and disabled-friendly toilets.', is_mandatory: true, automated_status: 'not_evaluated', manual_status: 'pending', overall_status: 'pending', updated_at: now }
    ];
    s.compliance_checklist_items.push(...initChecklist);

    logAudit(
      s,
      'APPLICATION_INTAKE_CREATED',
      appId,
      undefined,
      undefined,
      `New institutional application intake registered: ${payload.institution_name} (${appId})`,
      undefined,
      'Ready for review'
    );

    saveState(s);
    return localApi.getApplicationDetail(appId);
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
