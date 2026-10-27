from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserSchema(BaseModel):
    id: int
    username: str
    name: str
    role: str
    email: str
    active: bool

    class Config:
        from_attributes = True

class ApplicationFieldSchema(BaseModel):
    id: int
    field_key: str
    field_label: str
    field_value: str
    category: str
    source_form_section: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentExtractionSchema(BaseModel):
    id: int
    field_name: str
    extracted_value: str
    source_page: int
    confidence: float
    extraction_method: str
    is_fixture: bool
    bounding_box_json: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentSchema(BaseModel):
    id: str
    application_id: str
    document_name: str
    document_type: str
    checklist_item_id: Optional[str] = None
    file_path: Optional[str] = None
    file_hash: Optional[str] = None
    page_count: int
    extraction_status: str
    signature_status: str
    metadata_indicators_json: Optional[str] = None
    source_mode: str
    created_at: datetime
    extractions: List[DocumentExtractionSchema] = []

    class Config:
        from_attributes = True

class FindingSchema(BaseModel):
    id: str
    run_id: Optional[str] = None
    application_id: str
    rule_id: str
    rule_code: str
    title: str
    category: str
    outcome: str
    verification_status: str
    processing_status: str
    expected_value: Optional[str] = None
    observed_value: Optional[str] = None
    plain_reason: str
    document_id: Optional[str] = None
    source_page: Optional[int] = None
    source_field: Optional[str] = None
    evidence_text: Optional[str] = None
    is_fixture_derived: bool
    review_status: str
    reviewer_name: Optional[str] = None
    reviewer_role: Optional[str] = None
    reviewer_reason: Optional[str] = None
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ApplicationListSchema(BaseModel):
    id: str
    institution_name: str
    academic_year: str
    nature_of_application: str
    category_id: int
    workflow_status: str
    compliance_outcome: str
    verification_status: str
    processing_status: str
    assigned_officer: str
    rule_set: str
    rule_set_version: str
    evaluation_date: str
    source_mode: str
    documents_count: int
    findings_count: int
    updated_at: datetime

    class Config:
        from_attributes = True

class ApplicationDetailSchema(BaseModel):
    id: str
    institution_name: str
    academic_year: str
    nature_of_application: str
    category_id: int
    workflow_status: str
    compliance_outcome: str
    verification_status: str
    processing_status: str
    assigned_officer: str
    rule_set: str
    rule_set_version: str
    evaluation_date: str
    source_mode: str
    disposition: Optional[str] = None
    disposition_comment: Optional[str] = None
    disposition_by: Optional[str] = None
    disposition_at: Optional[datetime] = None
    escalation_reason: Optional[str] = None
    escalated_by: Optional[str] = None
    escalated_at: Optional[datetime] = None
    clarification_notes: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    fields: List[ApplicationFieldSchema] = []
    documents: List[DocumentSchema] = []
    findings: List[FindingSchema] = []

    class Config:
        from_attributes = True

class FindingReviewRequest(BaseModel):
    action: str = Field(..., description="confirm, dismiss, clarification_requested")
    reason: str = Field(..., description="Mandatory reason for review action")

class ClarificationRequest(BaseModel):
    notes: str = Field(..., description="Clarification queries to be communicated to applicant")

class EscalationRequest(BaseModel):
    reason: str = Field(..., description="Reason for escalating case to Senior Reviewer")

class DispositionRequest(BaseModel):
    disposition: str = Field(..., description="Satisfactory, Clarification required, Recommend EVC inspection, Refer for further consideration")
    comment: str = Field(..., description="Senior Reviewer rational and disposition comment")

class AlertSchema(BaseModel):
    id: str
    alert_type: str
    application_id: str
    finding_id: Optional[str] = None
    title: str
    reason: str
    priority: str
    status: str
    assigned_role: str
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

    class Config:
        from_attributes = True

class AuditEventSchema(BaseModel):
    id: int
    application_id: Optional[str] = None
    finding_id: Optional[str] = None
    rule_id: Optional[str] = None
    user_name: str
    user_role: str
    action: str
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    reason_comment: Optional[str] = None
    metadata_json: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Catalogue Schemas
class CatalogueCategorySchema(BaseModel):
    id: int
    cat_id: int
    nature_of_application: str
    self_disclosure: Optional[str] = None
    scrutiny: Optional[str] = None
    evc: Optional[str] = None
    sac_shc: Optional[str] = None
    annexure2_sections: Optional[str] = None
    own_document_items: Optional[int] = None
    note: Optional[str] = None
    source_workbook: str
    sheet_name: str
    source_row: int
    mapping_status: str
    mapping_notes: Optional[str] = None

    class Config:
        from_attributes = True

class CatalogueDocumentSchema(BaseModel):
    id: int
    annexure: str
    section: str
    section_title: Optional[str] = None
    seq: Optional[int] = None
    item_no: Optional[str] = None
    page: Optional[int] = None
    text: str
    kind: str
    document_types: Optional[str] = None
    possible_verifier: Optional[str] = None
    conditional: bool
    refs: Optional[str] = None
    source_workbook: str
    sheet_name: str
    source_row: int

    class Config:
        from_attributes = True

class CatalogueCandidateRuleSchema(BaseModel):
    id: int
    cand_id: str
    page: Optional[int] = None
    clause: Optional[str] = None
    modality: Optional[str] = None
    has_number: bool
    conditional: bool
    points_outside_handbook: bool
    type_guess: Optional[str] = None
    sentence: str
    lifecycle_status: str
    review_notes: Optional[str] = None
    reviewed_by: Optional[str] = None
    source_workbook: str
    sheet_name: str
    source_row: int

    class Config:
        from_attributes = True

class CatalogueExternalRefSchema(BaseModel):
    id: int
    page: Optional[int] = None
    clause: Optional[str] = None
    ref_types: Optional[str] = None
    keywords: Optional[str] = None
    sentence: str
    integration_status: str
    notes: Optional[str] = None
    source_workbook: str
    sheet_name: str
    source_row: int

    class Config:
        from_attributes = True

class RuleSchema(BaseModel):
    id: str
    code: str
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    check_type: str
    source_reference: Optional[str] = None
    source_clause: Optional[str] = None
    handbook_page: Optional[int] = None
    parameters_json: Optional[str] = None
    status: str
    created_by: str
    approved_by: Optional[str] = None
    current_version: str
    effective_date: str
    test_cases_json: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RuleVersionSchema(BaseModel):
    id: int
    rule_id: str
    version: str
    definition_json: str
    changelog: Optional[str] = None
    status: str
    submitted_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RuleDraftRequest(BaseModel):
    code: str
    title: str
    description: Optional[str] = None
    category_id: Optional[int] = 1
    check_type: str = "document_validity"
    source_reference: Optional[str] = None
    source_clause: Optional[str] = None
    handbook_page: Optional[int] = None
    parameters: Optional[Dict[str, Any]] = None
    effective_date: Optional[str] = "2026-07-01"

class RuleApprovalRequest(BaseModel):
    comment: Optional[str] = "Approved after source verification"

class RuleRejectionRequest(BaseModel):
    reason: str = Field(..., description="Mandatory reason for rejecting rule draft")
