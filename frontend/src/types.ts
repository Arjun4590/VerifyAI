export type DemoRole = 'scrutiny_officer' | 'senior_reviewer' | 'system_admin';

export interface User {
  id: number;
  username: string;
  name: string;
  role: DemoRole;
  email: string;
}

export interface ApplicationField {
  id: number;
  field_key: string;
  field_label: string;
  field_value: string;
  category: string;
  source_form_section?: string;
}

export interface DocumentExtraction {
  id: number;
  field_name: string;
  extracted_value: string;
  source_page: number;
  confidence: number;
  extraction_method: string;
  is_fixture: boolean;
}

export interface DocumentItem {
  id: string;
  application_id: string;
  document_name: string;
  document_type: string;
  checklist_item_id?: string;
  file_path?: string;
  file_hash?: string;
  page_count: number;
  extraction_status: string;
  signature_status: string;
  metadata_indicators_json?: string;
  source_mode: string;
  created_at: string;
  extractions: DocumentExtraction[];
}

export interface Finding {
  id: string;
  run_id?: string;
  application_id: string;
  rule_id: string;
  rule_code: string;
  title: string;
  category: string;
  outcome: 'Met' | 'Possible deficiency' | 'Needs clarification' | 'Not applicable' | 'Not evaluated';
  verification_status: string;
  processing_status: string;
  expected_value?: string;
  observed_value?: string;
  plain_reason: string;
  document_id?: string;
  source_page?: number;
  source_field?: string;
  evidence_text?: string;
  is_fixture_derived: boolean;
  review_status: 'unreviewed' | 'confirmed' | 'dismissed' | 'clarification_requested';
  reviewer_name?: string;
  reviewer_role?: string;
  reviewer_reason?: string;
  reviewed_at?: string;
}

export interface Application {
  id: string;
  institution_name: string;
  academic_year: string;
  nature_of_application: string;
  category_id: number;
  workflow_status: 'New' | 'Processing' | 'Ready for review' | 'In review' | 'Clarification requested' | 'Escalated' | 'Completed';
  compliance_outcome: 'Met' | 'Possible deficiency' | 'Needs clarification' | 'Not applicable' | 'Not evaluated';
  verification_status: 'Verified' | 'Mismatch detected' | 'Verification pending' | 'Source unavailable' | 'Manual review required' | 'Not required';
  processing_status: 'OK' | 'Low confidence' | 'Failed' | 'Pending';
  assigned_officer: string;
  rule_set: string;
  rule_set_version: string;
  evaluation_date: string;
  source_mode: string;
  disposition?: string;
  disposition_comment?: string;
  disposition_by?: string;
  disposition_at?: string;
  escalation_reason?: string;
  escalated_by?: string;
  escalated_at?: string;
  clarification_notes?: string;
  documents_count?: number;
  findings_count?: number;
  updated_at: string;
  fields?: ApplicationField[];
  documents?: DocumentItem[];
  findings?: Finding[];
}

export interface Alert {
  id: string;
  alert_type: string;
  application_id: string;
  finding_id?: string;
  title: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'resolved';
  assigned_role: string;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  application_id?: string;
  finding_id?: string;
  rule_id?: string;
  user_name: string;
  user_role: string;
  action: string;
  previous_status?: string;
  new_status?: string;
  reason_comment?: string;
  created_at: string;
}

export interface CatalogueCategory {
  id: number;
  cat_id: number;
  nature_of_application: string;
  self_disclosure?: string;
  scrutiny?: string;
  evc?: string;
  sac_shc?: string;
  annexure2_sections?: string;
  own_document_items?: number;
  note?: string;
  source_workbook: string;
  sheet_name: string;
  source_row: number;
  mapping_status: string;
  mapping_notes?: string;
}

export interface CatalogueDocument {
  id: number;
  annexure: string;
  section: string;
  section_title?: string;
  seq?: number;
  item_no?: string;
  page?: number;
  text: string;
  kind: string;
  document_types?: string;
  possible_verifier?: string;
  conditional: boolean;
  refs?: string;
  source_workbook: string;
  sheet_name: string;
  source_row: number;
}

export interface CatalogueCandidateRule {
  id: number;
  cand_id: string;
  page?: number;
  clause?: string;
  modality?: string;
  has_number: boolean;
  conditional: boolean;
  points_outside_handbook: boolean;
  type_guess?: string;
  sentence: string;
  lifecycle_status: string;
  review_notes?: string;
  reviewed_by?: string;
  source_workbook: string;
  sheet_name: string;
  source_row: number;
}

export interface CatalogueExternalRef {
  id: number;
  page?: number;
  clause?: string;
  ref_types?: string;
  keywords?: string;
  sentence: string;
  integration_status: string;
  notes?: string;
  source_workbook: string;
  sheet_name: string;
  source_row: number;
}

export interface Rule {
  id: string;
  code: string;
  title: string;
  description?: string;
  category_id?: number;
  check_type: string;
  source_reference?: string;
  source_clause?: string;
  handbook_page?: number;
  parameters_json?: string;
  status: 'candidate' | 'draft' | 'submitted_for_approval' | 'approved' | 'rejected' | 'retired';
  created_by: string;
  approved_by?: string;
  current_version: string;
  effective_date: string;
  test_cases_json?: string;
  created_at: string;
  updated_at: string;
}

export interface RuleVersion {
  id: number;
  rule_id: string;
  version: string;
  definition_json: string;
  changelog?: string;
  status: string;
  submitted_by?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
}

export interface Connector {
  id: string;
  name: string;
  type: string;
  mode: string;
  status: string;
  banner: string;
  endpoint: string;
  last_ping: string;
  latency_ms: number;
}

export interface DashboardData {
  metrics: {
    total_applications: number;
    under_review: number;
    needs_attention: number;
    pending_verification: number;
    escalated_cases: number;
    completed_cases: number;
  };
  workload_by_status: Record<string, number>;
  recent_alerts: Array<{
    id: string;
    title: string;
    application_id: string;
    priority: string;
    reason: string;
    created_at: string;
  }>;
  catalogue_coverage: {
    categories: number;
    document_requirements: number;
    candidate_rules: number;
    external_references: number;
    approved_executable_rules: number;
    draft_governance_rules: number;
  };
  environment: {
    name: string;
    banner: string;
    evaluation_date: string;
  };
}
