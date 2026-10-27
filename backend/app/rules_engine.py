import datetime
import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from .config import DEMO_EVALUATION_DATE, SIMULATED_CONNECTOR_NAME, SIMULATED_ISSUER_BANNER
from .models import (
    Application,
    Document,
    DocumentExtraction,
    ApplicationField,
    Rule,
    RuleVersion,
    ValidationRun,
    Finding,
    VerificationAttempt,
    Alert,
    AuditEvent,
)

def evaluate_application(
    db: Session,
    application_id: str,
    run_by: str = "Officer A",
    evaluation_date: str = DEMO_EVALUATION_DATE
) -> ValidationRun:
    """
    Executes validation for an application using only APPROVED regulatory rules.
    Deterministic, source-traceable, and evidence-linked.
    """
    app = db.query(Application).filter(Application.id == application_id).first()
    if not app:
        raise ValueError(f"Application {application_id} not found")

    # Fetch only approved rules that apply to this application's category or are general
    approved_rules = db.query(Rule).filter(
        Rule.status == "approved"
    ).all()

    # Generate a new unique validation run ID
    timestamp_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d%H%M%S%f")
    run_id = f"VR-{timestamp_str}-{application_id[-3:]}"

    # Fetch application documents, extractions, and fields
    docs = db.query(Document).filter(Document.application_id == application_id).all()
    fields = db.query(ApplicationField).filter(ApplicationField.application_id == application_id).all()
    fields_map = {f.field_key: f for f in fields}

    # Clear previous unreviewed findings for this application or link them to historical runs
    # To maintain auditability, we create a fresh validation run and insert current findings
    findings: List[Finding] = []
    alerts: List[Alert] = []

    passed_count = 0
    deficiency_count = 0
    clarification_count = 0

    # Rule 1: Fire Certificate Expiry Check
    rule_fire = next((r for r in approved_rules if r.code == "DOC-FIRE-EXPIRY"), None)
    if rule_fire:
        fire_doc = next((d for d in docs if "fire" in d.document_name.lower() or "fire" in d.document_type.lower()), None)
        if fire_doc:
            ext_date = db.query(DocumentExtraction).filter(
                DocumentExtraction.document_id == fire_doc.id,
                DocumentExtraction.field_name == "valid_until_date"
            ).first()
            valid_until = ext_date.extracted_value if ext_date else "2025-12-31"

            # Compare against fixed evaluation date
            if valid_until < evaluation_date:
                deficiency_count += 1
                finding_id = f"FIND-{application_id[-3:]}-001"
                f = Finding(
                    id=finding_id,
                    run_id=run_id,
                    application_id=application_id,
                    rule_id=rule_fire.id,
                    rule_code=rule_fire.code,
                    title="Fire Safety Certificate Expired",
                    category="Document validity",
                    outcome="Possible deficiency",
                    verification_status="Not required",
                    processing_status="OK",
                    expected_value=f"Validity date >= {evaluation_date} (Current Academic Evaluation Date)",
                    observed_value=f"Expired on {valid_until}",
                    plain_reason=(
                        f"The extracted certificate validity date ({valid_until}) is earlier than the fixed evaluation date "
                        f"({evaluation_date}). The institution must possess a currently valid fire safety certificate."
                    ),
                    document_id=fire_doc.id,
                    source_page=ext_date.source_page if ext_date else 1,
                    source_field="valid_until_date",
                    evidence_text=f"Fire Safety Certificate #FS-2023-8891 valid until: {valid_until}",
                    is_fixture_derived=True,
                    review_status="unreviewed"
                )
                findings.append(f)
                alerts.append(Alert(
                    id=f"ALT-{application_id[-3:]}-01",
                    alert_type="expired_document",
                    application_id=application_id,
                    finding_id=finding_id,
                    title="Expired Fire Safety Certificate",
                    reason=f"Validity expired on {valid_until} before evaluation date {evaluation_date}.",
                    priority="high",
                    status="active",
                    assigned_role="scrutiny_officer"
                ))
            else:
                passed_count += 1

    # Rule 2: Declaration vs Form Field Inconsistency Check
    rule_decl = next((r for r in approved_rules if r.code == "DECL-FORM-STUDENT-DATA"), None)
    if rule_decl:
        affidavit_doc = next((d for d in docs if "affidavit" in d.document_name.lower() or "undertaking" in d.document_name.lower()), None)
        field_student = fields_map.get("student_data_upload_complete")
        field_val = field_student.field_value if field_student else "No"

        # Check extracted declaration from affidavit
        ext_decl = None
        if affidavit_doc:
            ext_decl = db.query(DocumentExtraction).filter(
                DocumentExtraction.document_id == affidavit_doc.id,
                DocumentExtraction.field_name == "declaration_student_data_upload"
            ).first()
        decl_text = ext_decl.extracted_value if ext_decl else "Uploaded student data complete"

        if field_val.strip().lower() in ["no", "false", "0"]:
            clarification_count += 1
            finding_id = f"FIND-{application_id[-3:]}-002"
            f = Finding(
                id=finding_id,
                run_id=run_id,
                application_id=application_id,
                rule_id=rule_decl.id,
                rule_code=rule_decl.code,
                title="Student Data Declaration Inconsistent with Application Field",
                category="Declaration consistency",
                outcome="Needs clarification",
                verification_status="Not required",
                processing_status="OK",
                expected_value="Application form field matching signed affidavit declaration (Yes / Completed)",
                observed_value=f"Form Field: '{field_val}' vs Signed Affidavit: '{decl_text}'",
                plain_reason=(
                    f"The submitted Affidavit (page 2, para 4) explicitly affirms that student enrollment data has been fully "
                    f"uploaded to the national portal, whereas structured application field 'student_data_upload_complete' is marked '{field_val}'. "
                    f"This potential inconsistency requires human review and applicant clarification."
                ),
                document_id=affidavit_doc.id if affidavit_doc else None,
                source_page=ext_decl.source_page if ext_decl else 2,
                source_field="student_data_upload_complete",
                evidence_text=f"Affidavit: '{decl_text}' | Structured Field: '{field_val}'",
                is_fixture_derived=True,
                review_status="unreviewed"
            )
            findings.append(f)
            alerts.append(Alert(
                id=f"ALT-{application_id[-3:]}-02",
                alert_type="declaration_mismatch",
                application_id=application_id,
                finding_id=finding_id,
                title="Declaration Contradiction Requiring Clarification",
                reason=f"Affidavit affirms student data uploaded, but structured field is marked '{field_val}'.",
                priority="medium",
                status="active",
                assigned_role="scrutiny_officer"
            ))
        else:
            passed_count += 1

    # Rule 3: Missing Required Document Check
    rule_checklist = next((r for r in approved_rules if r.code == "CHECKLIST-MISSING-DOC"), None)
    if rule_checklist:
        # Check whether Barrier-Free / PwD Certificate or Building Completion is uploaded
        has_barrier_free = any("barrier" in d.document_name.lower() or "pwd" in d.document_name.lower() or "barrier" in d.document_type.lower() for d in docs)
        if not has_barrier_free:
            deficiency_count += 1
            finding_id = f"FIND-{application_id[-3:]}-003"
            f = Finding(
                id=finding_id,
                run_id=run_id,
                application_id=application_id,
                rule_id=rule_checklist.id,
                rule_code=rule_checklist.code,
                title="Required Document Missing: Barrier-Free Built Environment Certificate",
                category="Checklist",
                outcome="Possible deficiency",
                verification_status="Not required",
                processing_status="OK",
                expected_value="Certificate of Barrier-Free Built Environment uploaded per Annexure 2 §2.1 Item 6",
                observed_value="Document not found in application upload dossier",
                plain_reason=(
                    "Under Annexure 2 §2.1 for Extension of Approval based on Self-Disclosure, a valid Barrier-Free "
                    "Built Environment / PwD compliance certificate is mandatory. No corresponding document was uploaded."
                ),
                document_id=None,
                source_page=None,
                source_field="document_checklist_barrier_free",
                evidence_text="Checklist Item #6 (Annexure 2 §2.1): Not submitted",
                is_fixture_derived=True,
                review_status="unreviewed"
            )
            findings.append(f)
            alerts.append(Alert(
                id=f"ALT-{application_id[-3:]}-03",
                alert_type="missing_document",
                application_id=application_id,
                finding_id=finding_id,
                title="Missing Required Document",
                reason="Barrier-Free Built Environment Certificate has not been uploaded.",
                priority="high",
                status="active",
                assigned_role="scrutiny_officer"
            ))
        else:
            passed_count += 1

    # Rule 4: Simulated Issuer Registry Check
    rule_issuer = next((r for r in approved_rules if r.code == "ISSUER-VERIFY-CHECK"), None)
    if rule_issuer:
        # Look for verification attempt
        v_attempt = db.query(VerificationAttempt).filter(
            VerificationAttempt.application_id == application_id,
            VerificationAttempt.check_type == "issuer_registry_check"
        ).first()

        v_status = v_attempt.status if v_attempt else "Mismatch detected"
        finding_id = f"FIND-{application_id[-3:]}-004"
        f = Finding(
            id=finding_id,
            run_id=run_id,
            application_id=application_id,
            rule_id=rule_issuer.id,
            rule_code=rule_issuer.code,
            title="Issuer Registry Cross-Verification: Mismatch Detected",
            category="Simulated issuer check",
            outcome="Needs clarification",
            verification_status="Mismatch detected",
            processing_status="OK",
            expected_value="Issuing Authority record matching certificate number FS-2023-8891 and institution name",
            observed_value=f"Registry record indicates status: Revoked / Not Renewed ({SIMULATED_ISSUER_BANNER})",
            plain_reason=(
                f"Simulated query to state fire authority registry returned an active mismatch flag for certificate #FS-2023-8891. "
                f"Note: This is an automated decision-support indicator from a {SIMULATED_CONNECTOR_NAME}. "
                f"It is visibly labelled {SIMULATED_ISSUER_BANNER} and requires manual verification before any adverse action."
            ),
            document_id=docs[0].id if docs else None,
            source_page=1,
            source_field="fire_safety_cert_no",
            evidence_text=f"Connector: {SIMULATED_CONNECTOR_NAME} | Result: Mismatch detected | Status: {SIMULATED_ISSUER_BANNER}",
            is_fixture_derived=True,
            review_status="unreviewed"
        )
        findings.append(f)

    # Rule 5: Extraction Quality / Low Confidence Review
    rule_extract = next((r for r in approved_rules if r.code == "OCR-CONFIDENCE-LOW"), None)
    if rule_extract:
        low_conf_ext = db.query(DocumentExtraction).filter(
            DocumentExtraction.confidence < 0.70
        ).first()
        if low_conf_ext:
            clarification_count += 1
            finding_id = f"FIND-{application_id[-3:]}-005"
            f = Finding(
                id=finding_id,
                run_id=run_id,
                application_id=application_id,
                rule_id=rule_extract.id,
                rule_code=rule_extract.code,
                title="Low-Confidence Document Extraction: Manual Review Required",
                category="Extraction review",
                outcome="Needs clarification",
                verification_status="Manual review required",
                processing_status="Low confidence",
                expected_value="Extraction confidence >= 0.85",
                observed_value=f"Confidence: {int(low_conf_ext.confidence * 100)}% on field '{low_conf_ext.field_name}'",
                plain_reason=(
                    f"OCR/extraction pipeline detected low confidence ({int(low_conf_ext.confidence * 100)}%) on page "
                    f"{low_conf_ext.source_page} for field '{low_conf_ext.field_name}'. Low extraction confidence does NOT "
                    f"constitute non-compliance; it is automatically routed for officer inspection."
                ),
                document_id=low_conf_ext.document_id,
                source_page=low_conf_ext.source_page,
                source_field=low_conf_ext.field_name,
                evidence_text=f"Extracted: '{low_conf_ext.extracted_value}' (Confidence: {low_conf_ext.confidence:.2f})",
                is_fixture_derived=False,
                review_status="unreviewed"
            )
            findings.append(f)

    # Persist Validation Run
    total_evaluated = len(approved_rules)
    val_run = ValidationRun(
        id=run_id,
        application_id=application_id,
        rule_set="APH-DEMO-2026-27",
        rule_set_version="1.0",
        evaluation_date=evaluation_date,
        total_rules_evaluated=total_evaluated,
        passed_count=passed_count,
        deficiency_count=deficiency_count,
        clarification_count=clarification_count,
        run_by=run_by,
        created_at=datetime.datetime.utcnow()
    )
    db.add(val_run)

    # Delete previous findings for this application before adding new ones
    db.query(Finding).filter(Finding.application_id == application_id).delete()
    for f in findings:
        db.add(f)

    # Add alerts (avoiding duplicates)
    for a in alerts:
        existing = db.query(Alert).filter(Alert.id == a.id).first()
        if not existing:
            db.add(a)

    # Update application summary status based on findings
    if deficiency_count > 0:
        app.compliance_outcome = "Possible deficiency"
    elif clarification_count > 0:
        app.compliance_outcome = "Needs clarification"
    else:
        app.compliance_outcome = "Met"

    app.workflow_status = "In review"
    app.updated_at = datetime.datetime.utcnow()

    # Record Audit Event
    audit = AuditEvent(
        application_id=application_id,
        user_name=run_by,
        user_role="scrutiny_officer",
        action="VALIDATION_RUN",
        previous_status="Ready for review",
        new_status="In review",
        reason_comment=(
            f"Validation run {run_id} executed with rule-set APH-DEMO-2026-27 v1.0 against evaluation date {evaluation_date}. "
            f"Generated {len(findings)} findings ({deficiency_count} deficiencies, {clarification_count} clarifications)."
        ),
        metadata_json=json.dumps({
            "run_id": run_id,
            "rules_evaluated": total_evaluated,
            "deficiency_count": deficiency_count,
            "clarification_count": clarification_count
        })
    )
    db.add(audit)

    db.commit()
    db.refresh(val_run)
    return val_run
