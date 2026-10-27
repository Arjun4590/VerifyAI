import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey
)
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(String(50), nullable=False)  # system_admin, scrutiny_officer, senior_reviewer
    email = Column(String(100), nullable=False)
    active = Column(Boolean, default=True)

class CatalogueCategory(Base):
    __tablename__ = "catalogue_categories"

    id = Column(Integer, primary_key=True, index=True)
    cat_id = Column(Integer, index=True, nullable=False)
    nature_of_application = Column(Text, nullable=False)
    self_disclosure = Column(String(20), nullable=True)
    scrutiny = Column(String(50), nullable=True)
    evc = Column(String(50), nullable=True)
    sac_shc = Column(String(50), nullable=True)
    annexure2_sections = Column(String(100), nullable=True)
    own_document_items = Column(Integer, nullable=True)
    note = Column(Text, nullable=True)

    # Provenance and mapping metadata
    source_workbook = Column(String(100), default="handbook_extraction.xlsx")
    sheet_name = Column(String(50), default="Categories")
    source_row = Column(Integer, nullable=False)
    mapping_status = Column(String(50), default="extracted")  # extracted, verified, unresolved_needs_review
    mapping_notes = Column(Text, nullable=True)

class CatalogueDocument(Base):
    __tablename__ = "catalogue_documents"

    id = Column(Integer, primary_key=True, index=True)
    annexure = Column(String(50), index=True, nullable=False)
    section = Column(String(50), index=True, nullable=False)
    section_title = Column(Text, nullable=True)
    seq = Column(Integer, nullable=True)
    item_no = Column(String(50), nullable=True)
    page = Column(Integer, nullable=True)
    text = Column(Text, nullable=False)
    kind = Column(String(50), index=True, nullable=False)  # 'intro/condition', 'document/requirement', 'note'
    document_types = Column(Text, nullable=True)
    possible_verifier = Column(String(100), nullable=True)
    conditional = Column(Boolean, default=False)
    refs = Column(Text, nullable=True)

    # Provenance
    source_workbook = Column(String(100), default="handbook_extraction.xlsx")
    sheet_name = Column(String(50), default="Documents")
    source_row = Column(Integer, nullable=False)

class CatalogueCandidateRule(Base):
    __tablename__ = "catalogue_candidate_rules"

    id = Column(Integer, primary_key=True, index=True)
    cand_id = Column(String(20), unique=True, index=True, nullable=False)
    page = Column(Integer, nullable=True)
    clause = Column(String(50), nullable=True)
    modality = Column(String(50), nullable=True)
    has_number = Column(Boolean, default=False)
    conditional = Column(Boolean, default=False)
    points_outside_handbook = Column(Boolean, default=False)
    type_guess = Column(String(50), index=True, nullable=True)
    sentence = Column(Text, nullable=False)

    # Governance lifecycle
    lifecycle_status = Column(String(50), default="candidate", index=True)
    # candidate, needs_source_review, reviewed, draft, submitted_for_approval, approved, rejected, retired
    review_notes = Column(Text, nullable=True)
    reviewed_by = Column(String(100), nullable=True)

    # Provenance
    source_workbook = Column(String(100), default="handbook_extraction.xlsx")
    sheet_name = Column(String(50), default="Rule candidates")
    source_row = Column(Integer, nullable=False)

class CatalogueExternalRef(Base):
    __tablename__ = "catalogue_external_refs"

    id = Column(Integer, primary_key=True, index=True)
    page = Column(Integer, nullable=True)
    clause = Column(String(50), nullable=True)
    ref_types = Column(Text, nullable=True)
    keywords = Column(Text, nullable=True)
    sentence = Column(Text, nullable=False)

    # Integration tracking
    integration_status = Column(String(50), default="unavailable", index=True)  # unavailable, planned, simulated, configured
    notes = Column(Text, nullable=True)

    # Provenance
    source_workbook = Column(String(100), default="handbook_extraction.xlsx")
    sheet_name = Column(String(50), default="External refs")
    source_row = Column(Integer, nullable=False)

class CatalogueImportLog(Base):
    __tablename__ = "catalogue_import_logs"

    id = Column(Integer, primary_key=True, index=True)
    workbook_filename = Column(String(100), nullable=False)
    sheet_name = Column(String(50), nullable=False)
    total_rows = Column(Integer, default=0)
    imported_rows = Column(Integer, default=0)
    skipped_rows = Column(Integer, default=0)
    error_log_json = Column(Text, nullable=True)
    imported_at = Column(DateTime, default=datetime.datetime.utcnow)

class Rule(Base):
    __tablename__ = "rules"

    id = Column(String(50), primary_key=True)  # e.g. RULE-DEMO-001
    code = Column(String(50), unique=True, index=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category_id = Column(Integer, nullable=True)
    check_type = Column(String(50), nullable=False)  # document_validity, declaration_consistency, checklist, simulated_issuer, extraction_review
    source_reference = Column(String(200), nullable=True)
    source_clause = Column(String(100), nullable=True)
    handbook_page = Column(Integer, nullable=True)
    parameters_json = Column(Text, nullable=True)
    status = Column(String(50), default="candidate")  # candidate, draft, submitted_for_approval, approved, rejected, retired
    created_by = Column(String(100), default="System")
    approved_by = Column(String(100), nullable=True)
    current_version = Column(String(20), default="1.0")
    effective_date = Column(String(20), default="2026-04-15")
    test_cases_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class RuleVersion(Base):
    __tablename__ = "rule_versions"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(String(50), ForeignKey("rules.id"), nullable=False)
    version = Column(String(20), nullable=False)
    definition_json = Column(Text, nullable=False)
    changelog = Column(Text, nullable=True)
    status = Column(String(50), default="draft")  # draft, submitted, approved, rejected, retired
    submitted_by = Column(String(100), nullable=True)
    approved_by = Column(String(100), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Application(Base):
    __tablename__ = "applications"

    id = Column(String(50), primary_key=True)  # VA-DEMO-2026-014
    institution_name = Column(String(200), nullable=False)
    academic_year = Column(String(50), nullable=False)
    nature_of_application = Column(String(200), nullable=False)
    category_id = Column(Integer, nullable=False)
    workflow_status = Column(String(50), default="Ready for review")
    # 'New', 'Processing', 'Ready for review', 'In review', 'Clarification requested', 'Escalated', 'Completed'
    compliance_outcome = Column(String(50), default="Possible deficiency")
    # 'Met', 'Possible deficiency', 'Needs clarification', 'Not applicable', 'Not evaluated'
    verification_status = Column(String(50), default="Mismatch detected")
    # 'Verified', 'Mismatch detected', 'Verification pending', 'Source unavailable', 'Manual review required', 'Not required'
    processing_status = Column(String(50), default="OK")
    # 'OK', 'Low confidence', 'Failed', 'Pending'
    assigned_officer = Column(String(100), default="Officer A")
    rule_set = Column(String(50), default="APH-DEMO-2026-27")
    rule_set_version = Column(String(20), default="1.0")
    evaluation_date = Column(String(20), default="2026-04-15")
    source_mode = Column(String(100), default="DEMO DATA — NOT CONNECTED TO AICTE")

    # Workflow Actions & History
    disposition = Column(String(100), nullable=True)
    disposition_comment = Column(Text, nullable=True)
    disposition_by = Column(String(100), nullable=True)
    disposition_at = Column(DateTime, nullable=True)

    escalation_reason = Column(Text, nullable=True)
    escalated_by = Column(String(100), nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    clarification_notes = Column(Text, nullable=True)
    clarification_requested_by = Column(String(100), nullable=True)
    clarification_requested_at = Column(DateTime, nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    fields = relationship("ApplicationField", back_populates="application", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="application", cascade="all, delete-orphan")
    findings = relationship("Finding", back_populates="application", cascade="all, delete-orphan")

class ApplicationField(Base):
    __tablename__ = "application_fields"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    field_key = Column(String(100), index=True, nullable=False)
    field_label = Column(String(200), nullable=False)
    field_value = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    source_form_section = Column(String(200), nullable=True)

    application = relationship("Application", back_populates="fields")

class Document(Base):
    __tablename__ = "documents"

    id = Column(String(50), primary_key=True)  # DOC-001
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    document_name = Column(String(200), nullable=False)
    document_type = Column(String(100), nullable=False)
    checklist_item_id = Column(String(50), nullable=True)
    file_path = Column(String(300), nullable=True)
    file_hash = Column(String(64), nullable=True)  # SHA-256
    page_count = Column(Integer, default=1)
    extraction_status = Column(String(50), default="OK")
    signature_status = Column(String(50), default="Not checked")
    metadata_indicators_json = Column(Text, nullable=True)
    source_mode = Column(String(100), default="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    application = relationship("Application", back_populates="documents")
    extractions = relationship("DocumentExtraction", back_populates="document", cascade="all, delete-orphan")

class DocumentExtraction(Base):
    __tablename__ = "document_extractions"

    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(String(50), ForeignKey("documents.id"), nullable=False)
    field_name = Column(String(100), nullable=False)
    extracted_value = Column(Text, nullable=False)
    source_page = Column(Integer, default=1)
    confidence = Column(Float, default=1.0)
    extraction_method = Column(String(50), default="fixture_derived")  # 'pymupdf_extracted', 'fixture_derived'
    is_fixture = Column(Boolean, default=True)
    bounding_box_json = Column(Text, nullable=True)

    document = relationship("Document", back_populates="extractions")

class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(String(50), primary_key=True)  # VR-20260415-001
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    rule_set = Column(String(50), default="APH-DEMO-2026-27")
    rule_set_version = Column(String(20), default="1.0")
    evaluation_date = Column(String(20), default="2026-04-15")
    total_rules_evaluated = Column(Integer, default=0)
    passed_count = Column(Integer, default=0)
    deficiency_count = Column(Integer, default=0)
    clarification_count = Column(Integer, default=0)
    run_by = Column(String(100), default="Officer A")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(50), primary_key=True)  # FINDING-001
    run_id = Column(String(50), ForeignKey("validation_runs.id"), nullable=True)
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    rule_id = Column(String(50), nullable=False)
    rule_code = Column(String(50), nullable=False)
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    outcome = Column(String(50), nullable=False)  # 'Met', 'Possible deficiency', 'Needs clarification', 'Not applicable', 'Not evaluated'
    verification_status = Column(String(50), default="Not required")
    processing_status = Column(String(50), default="OK")
    expected_value = Column(Text, nullable=True)
    observed_value = Column(Text, nullable=True)
    plain_reason = Column(Text, nullable=False)
    document_id = Column(String(50), nullable=True)
    source_page = Column(Integer, nullable=True)
    source_field = Column(String(100), nullable=True)
    evidence_text = Column(Text, nullable=True)
    is_fixture_derived = Column(Boolean, default=True)

    # Human review
    review_status = Column(String(50), default="unreviewed")  # unreviewed, confirmed, dismissed, clarification_requested
    reviewer_name = Column(String(100), nullable=True)
    reviewer_role = Column(String(50), nullable=True)
    reviewer_reason = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    application = relationship("Application", back_populates="findings")

class VerificationAttempt(Base):
    __tablename__ = "verification_attempts"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    document_id = Column(String(50), nullable=True)
    check_type = Column(String(50), nullable=False)  # issuer_registry_check, hash_duplicate_check, signature_check
    source_system = Column(String(100), default="Demo Issuer Connector (SIMULATED)")
    mode = Column(String(100), default="SIMULATED — NO LIVE ISSUER API")
    status = Column(String(50), nullable=False)  # 'Verified', 'Mismatch detected', 'Verification pending', etc.
    matched_fields_json = Column(Text, nullable=True)
    raw_response_json = Column(Text, nullable=True)
    verified_at = Column(DateTime, default=datetime.datetime.utcnow)

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True)  # ALT-001
    alert_type = Column(String(50), nullable=False)
    application_id = Column(String(50), ForeignKey("applications.id"), nullable=False)
    finding_id = Column(String(50), nullable=True)
    title = Column(String(200), nullable=False)
    reason = Column(Text, nullable=False)
    priority = Column(String(20), default="medium")  # high, medium, low
    status = Column(String(50), default="active")  # active, acknowledged, resolved
    assigned_role = Column(String(50), default="scrutiny_officer")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolved_by = Column(String(100), nullable=True)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(String(50), nullable=True)
    finding_id = Column(String(50), nullable=True)
    rule_id = Column(String(50), nullable=True)
    user_name = Column(String(100), nullable=False)
    user_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=True)
    reason_comment = Column(Text, nullable=True)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
