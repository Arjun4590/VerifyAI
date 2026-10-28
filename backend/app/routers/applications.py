import datetime
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse, HTMLResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..auth import get_current_user_and_role, require_role
from ..config import (
    ROLE_SYSTEM_ADMIN,
    ROLE_SCRUTINY_OFFICER,
    ROLE_SENIOR_REVIEWER,
    ENVIRONMENT_BANNER,
    SYNTHETIC_DOC_BANNER,
    SIMULATED_ISSUER_BANNER,
    DEMO_EVALUATION_DATE,
    DOCUMENTS_DIR
)
from ..models import (
    Application,
    ApplicationField,
    Document,
    Finding,
    Alert,
    AuditEvent,
    ValidationRun,
    Rule,
    ManualVerificationTask,
    ComplianceChecklistItem
)
from ..schemas import (
    ApplicationListSchema,
    ApplicationDetailSchema,
    ClarificationRequest,
    EscalationRequest,
    DispositionRequest,
    AuditEventSchema,
    ManualVerificationTaskSchema,
    ManualTaskActionRequest,
    ComplianceChecklistItemSchema,
    ApplicationCreateRequest
)
from ..rules_engine import evaluate_application

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationListSchema])
def list_applications(
    search: Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    workflow_status: Optional[str] = Query(None),
    compliance_outcome: Optional[str] = Query(None),
    verification_status: Optional[str] = Query(None),
    assigned_officer: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    query = db.query(Application)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Application.id.ilike(s)) |
            (Application.institution_name.ilike(s)) |
            (Application.institution_code.ilike(s))
        )
    if academic_year:
        query = query.filter(Application.academic_year == academic_year)
    if category_id:
        query = query.filter(Application.category_id == category_id)
    if workflow_status:
        query = query.filter(Application.workflow_status == workflow_status)
    if compliance_outcome:
        query = query.filter(Application.compliance_outcome == compliance_outcome)
    if verification_status:
        query = query.filter(Application.verification_status == verification_status)
    if assigned_officer:
        query = query.filter(Application.assigned_officer == assigned_officer)

    apps = query.order_by(Application.id.asc()).all()

    result = []
    for a in apps:
        doc_count = db.query(Document).filter(Document.application_id == a.id).count()
        findings_count = db.query(Finding).filter(Finding.application_id == a.id).count()
        pending_count = db.query(ManualVerificationTask).filter(
            ManualVerificationTask.application_id == a.id,
            ManualVerificationTask.status.in_(["pending", "in_progress"])
        ).count()

        if pending_count > 0:
            next_action = f"Complete {pending_count} pending manual check{'s' if pending_count > 1 else ''}"
        elif a.workflow_status == "Ready for review":
            next_action = "Run automated rule validation"
        elif a.workflow_status == "Clarification requested":
            next_action = "Awaiting institutional response"
        elif a.workflow_status == "Escalated":
            next_action = "Senior Reviewer disposition pending"
        elif a.workflow_status == "Completed":
            next_action = "Scrutiny completed"
        else:
            next_action = "Ready for Senior Reviewer sign-off"

        result.append(ApplicationListSchema(
            id=a.id,
            institution_name=a.institution_name,
            institution_code=a.institution_code or "AICTE-1-10928374",
            academic_year=a.academic_year,
            nature_of_application=a.nature_of_application,
            category_id=a.category_id,
            workflow_status=a.workflow_status,
            compliance_outcome=a.compliance_outcome,
            verification_status=a.verification_status,
            processing_status=a.processing_status,
            assigned_officer=a.assigned_officer,
            rule_set=a.rule_set,
            rule_set_version=a.rule_set_version,
            evaluation_date=a.evaluation_date,
            source_mode=a.source_mode,
            documents_count=doc_count,
            findings_count=findings_count,
            pending_tasks_count=pending_count,
            next_recommended_action=next_action,
            updated_at=a.updated_at
        ))
    return result

@router.get("/{app_id}", response_model=ApplicationDetailSchema)
def get_application_detail(
    app_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    # System Admin cannot view application document contents by default per specification section 3.1
    # but can view general metadata
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    return app

@router.post("/{app_id}/validate")
def run_validation(
    app_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER]))
):
    """
    Executes validation for an application using only approved regulatory rules.
    Updates findings and creates an audit event.
    """
    try:
        val_run = evaluate_application(
            db,
            application_id=app_id,
            run_by=user_ctx["username"],
            evaluation_date=DEMO_EVALUATION_DATE
        )
        findings = db.query(Finding).filter(Finding.application_id == app_id).all()
        return {
            "message": "Validation run completed successfully",
            "validation_run_id": val_run.id,
            "rule_set": val_run.rule_set,
            "rule_set_version": val_run.rule_set_version,
            "evaluation_date": val_run.evaluation_date,
            "rules_evaluated": val_run.total_rules_evaluated,
            "deficiency_count": val_run.deficiency_count,
            "clarification_count": val_run.clarification_count,
            "findings_count": len(findings)
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/{app_id}/clarification-request")
def request_clarification(
    app_id: str,
    req: ClarificationRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER]))
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.workflow_status
    app.workflow_status = "Clarification requested"
    app.clarification_notes = req.notes
    app.clarification_requested_by = user_ctx["username"]
    app.clarification_requested_at = datetime.datetime.utcnow()
    app.updated_at = datetime.datetime.utcnow()

    # Create audit event
    audit = AuditEvent(
        application_id=app_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="CLARIFICATION_REQUESTED",
        previous_status=old_status,
        new_status="Clarification requested",
        reason_comment=req.notes
    )
    db.add(audit)
    db.commit()

    return {"message": "Clarification request recorded and dispatched", "application_id": app_id, "status": "Clarification requested"}

@router.post("/{app_id}/escalate")
def escalate_application(
    app_id: str,
    req: EscalationRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER]))
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.workflow_status
    app.workflow_status = "Escalated"
    app.escalation_reason = req.reason
    app.escalated_by = user_ctx["username"]
    app.escalated_at = datetime.datetime.utcnow()
    app.updated_at = datetime.datetime.utcnow()

    # Create alert for Senior Reviewer
    alert = Alert(
        id=f"ALT-ESC-{app_id[-3:]}-{datetime.datetime.utcnow().strftime('%M%S')}",
        alert_type="escalation_pending",
        application_id=app_id,
        title=f"Case Escalated for Senior Review: {app_id}",
        reason=req.reason,
        priority="high",
        status="active",
        assigned_role="senior_reviewer"
    )
    db.add(alert)

    # Audit event
    audit = AuditEvent(
        application_id=app_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="CASE_ESCALATED",
        previous_status=old_status,
        new_status="Escalated",
        reason_comment=req.reason
    )
    db.add(audit)
    db.commit()

    return {"message": "Case escalated to Senior Reviewer", "application_id": app_id, "status": "Escalated"}

@router.post("/{app_id}/disposition")
def record_disposition(
    app_id: str,
    req: DispositionRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SENIOR_REVIEWER]))
):
    """
    Records senior reviewer workflow disposition.
    Allowed internal workflow labels:
      - Satisfactory
      - Clarification required
      - Recommend EVC inspection
      - Refer for further consideration
    """
    allowed_dispositions = [
        "Satisfactory",
        "Clarification required",
        "Recommend EVC inspection",
        "Refer for further consideration"
    ]
    if req.disposition not in allowed_dispositions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid disposition. Must be one of: {', '.join(allowed_dispositions)}"
        )

    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    old_status = app.workflow_status
    app.workflow_status = "Completed"
    app.disposition = req.disposition
    app.disposition_comment = req.comment
    app.disposition_by = user_ctx["username"]
    app.disposition_at = datetime.datetime.utcnow()
    app.updated_at = datetime.datetime.utcnow()

    # Resolve any pending escalation alert for this application
    alerts = db.query(Alert).filter(Alert.application_id == app_id, Alert.alert_type == "escalation_pending").all()
    for a in alerts:
        a.status = "resolved"
        a.resolved_at = datetime.datetime.utcnow()
        a.resolved_by = user_ctx["username"]

    # Audit event
    audit = AuditEvent(
        application_id=app_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="DISPOSITION_RECORDED",
        previous_status=old_status,
        new_status="Completed",
        reason_comment=f"Disposition: '{req.disposition}'. Comments: {req.comment}"
    )
    db.add(audit)
    db.commit()

    return {
        "message": "Senior Reviewer disposition successfully recorded",
        "application_id": app_id,
        "disposition": req.disposition,
        "workflow_status": "Completed"
    }

@router.get("/{app_id}/tasks", response_model=List[ManualVerificationTaskSchema])
def get_manual_tasks(
    app_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    tasks = db.query(ManualVerificationTask).filter(
        ManualVerificationTask.application_id == app_id
    ).order_by(ManualVerificationTask.id.asc()).all()
    return tasks

@router.patch("/{app_id}/tasks/{task_id}", response_model=ManualVerificationTaskSchema)
def update_manual_task(
    app_id: str,
    task_id: str,
    req: ManualTaskActionRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER]))
):
    task = db.query(ManualVerificationTask).filter(
        ManualVerificationTask.id == task_id,
        ManualVerificationTask.application_id == app_id
    ).first()
    if not task:
        raise HTTPException(status_code=404, detail="Manual verification task not found")

    old_status = task.status
    now = datetime.datetime.utcnow()

    if req.action == "start":
        task.status = "in_progress"
        audit_action = "TASK_STARTED"
        comment = "Officer started manual verification on task."
    elif req.action == "save_progress":
        if req.remarks:
            task.reviewer_remarks = req.remarks
        audit_action = "TASK_PROGRESS_SAVED"
        comment = f"Reviewer notes updated: {req.remarks or 'Draft saved'}"
    elif req.action == "mark_verified":
        if not req.remarks and not req.justification:
            raise HTTPException(status_code=400, detail="Verification notes are required to mark verified")
        task.status = "verified"
        task.reviewer_remarks = req.remarks or task.reviewer_remarks
        task.justification_note = req.justification or task.justification_note
        task.completed_at = now
        task.completed_by = user_ctx["username"]
        audit_action = "TASK_VERIFIED"
        comment = f"Task marked Verified. Notes: {req.remarks or req.justification}"
    elif req.action == "discrepancy":
        if not req.remarks and not req.justification:
            raise HTTPException(status_code=400, detail="Discrepancy justification note is mandatory")
        task.status = "discrepancy"
        task.reviewer_remarks = req.remarks or task.reviewer_remarks
        task.justification_note = req.justification or task.justification_note
        task.completed_at = now
        task.completed_by = user_ctx["username"]
        audit_action = "TASK_DISCREPANCY_RECORDED"
        comment = f"Discrepancy recorded: {req.remarks or req.justification}"
    elif req.action == "unable_to_verify":
        if not req.remarks and not req.justification:
            raise HTTPException(status_code=400, detail="Justification explaining why verification is impossible is required")
        task.status = "unable_to_verify"
        task.reviewer_remarks = req.remarks or task.reviewer_remarks
        task.justification_note = req.justification or task.justification_note
        task.completed_at = now
        task.completed_by = user_ctx["username"]
        audit_action = "TASK_UNABLE_TO_VERIFY"
        comment = f"Marked Unable to Verify: {req.remarks or req.justification}"
    elif req.action == "clarification_requested":
        if not req.remarks:
            raise HTTPException(status_code=400, detail="Clarification evidence requirements must be specified")
        task.status = "clarification_requested"
        task.reviewer_remarks = req.remarks
        audit_action = "TASK_EVIDENCE_REQUESTED"
        comment = f"Further evidence requested from applicant: {req.remarks}"
    elif req.action == "not_applicable":
        if not req.justification:
            raise HTTPException(status_code=400, detail="Regulatory exemption justification is mandatory for Not Applicable")
        task.status = "not_applicable"
        task.justification_note = req.justification
        task.reviewer_remarks = req.remarks or task.reviewer_remarks
        task.completed_at = now
        task.completed_by = user_ctx["username"]
        audit_action = "TASK_MARKED_NOT_APPLICABLE"
        comment = f"Marked Not Applicable per exemption: {req.justification}"
    elif req.action == "reopen":
        task.status = "in_progress"
        task.completed_at = None
        task.completed_by = None
        audit_action = "TASK_REOPENED"
        comment = f"Completed task reopened for re-inspection. Reason: {req.remarks or 'Re-evaluation authorized'}"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported task action: {req.action}")

    task.updated_at = now

    audit = AuditEvent(
        application_id=app_id,
        finding_id=task.finding_id,
        rule_id=task.rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action=audit_action,
        previous_status=old_status,
        new_status=task.status,
        reason_comment=comment
    )
    db.add(audit)
    db.commit()
    db.refresh(task)
    return task

@router.get("/{app_id}/checklist", response_model=List[ComplianceChecklistItemSchema])
def get_compliance_checklist(
    app_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    items = db.query(ComplianceChecklistItem).filter(
        ComplianceChecklistItem.application_id == app_id
    ).order_by(ComplianceChecklistItem.clause_ref.asc()).all()
    return items

@router.post("", response_model=ApplicationDetailSchema)
def intake_application(
    req: ApplicationCreateRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER, ROLE_SYSTEM_ADMIN]))
):
    app_id = req.id or f"VA-APP-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    existing = db.query(Application).filter(Application.id == app_id).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Application {app_id} already exists")

    new_app = Application(
        id=app_id,
        institution_name=req.institution_name,
        institution_code=req.institution_code or f"AICTE-1-{abs(hash(req.institution_name)) % 100000000:08d}",
        academic_year=req.academic_year,
        nature_of_application=req.nature_of_application,
        category_id=req.category_id,
        workflow_status="Ready for review",
        compliance_outcome="Not evaluated",
        verification_status="Verification pending",
        processing_status="OK",
        assigned_officer=req.assigned_officer or user_ctx["username"],
        rule_set="APH-DEMO-2026-27",
        rule_set_version="1.0",
        evaluation_date=DEMO_EVALUATION_DATE,
        source_mode="NEW APPLICATION INTAKE — PENDING VALIDATION",
        intake_capacity=req.intake_capacity or 300,
        total_faculty=max(int((req.intake_capacity or 300) / 15), 10),
        land_area_acres=req.land_area_acres or 5.0,
        built_up_area_sqm=req.built_up_area_sqm or 10000.0,
        trust_name=req.trust_name or f"{req.institution_name} Society",
        notes=req.notes or "Registered via Application Intake module."
    )
    db.add(new_app)

    # Add initial mandatory application fields
    initial_fields = [
        ApplicationField(application_id=app_id, field_key="institution_name", field_label="Institution Full Name", field_value=req.institution_name, category="general", source_form_section="Part 1 Institutional Identity"),
        ApplicationField(application_id=app_id, field_key="academic_year", field_label="Academic Year Applied", field_value=req.academic_year, category="general", source_form_section="Part 1 Application Details"),
        ApplicationField(application_id=app_id, field_key="application_category", field_label="Nature of Application", field_value=req.nature_of_application, category="general", source_form_section="Part 1 Category"),
        ApplicationField(application_id=app_id, field_key="land_area_acres", field_label="Total Land Area in Acres", field_value=str(req.land_area_acres or 5.0), category="infrastructure", source_form_section="Part 2 Land & Building"),
        ApplicationField(application_id=app_id, field_key="built_up_area_sqm", field_label="Total Built-Up Area (sq.m)", field_value=str(req.built_up_area_sqm or 10000.0), category="infrastructure", source_form_section="Part 2 Land & Building"),
        ApplicationField(application_id=app_id, field_key="approved_intake_total", field_label="Sanctioned Annual Student Intake", field_value=str(req.intake_capacity or 300), category="academic", source_form_section="Part 4 Programs & Courses")
    ]
    for f in initial_fields:
        db.add(f)

    # Add sample initial document
    doc_id = f"DOC-{app_id[-3:]}-01"
    initial_doc = Document(
        id=doc_id,
        application_id=app_id,
        document_name=f"{app_id}_Self_Disclosure_Affidavit.pdf",
        document_type="Affidavit and Self-Disclosure",
        checklist_item_id="ITEM-A2-AFFIDAVIT",
        page_count=2,
        extraction_status="OK",
        signature_status="Digitally Signed",
        source_mode="NEW APPLICATION INTAKE — SUBMITTED EVIDENCE"
    )
    db.add(initial_doc)

    # Initial Manual Task
    init_task = ManualVerificationTask(
        id=f"TASK-{app_id[-3:]}-01",
        application_id=app_id,
        rule_code="INTAKE-INITIAL-INSPECTION",
        title="Initial Document Completeness & Affidavit Review",
        trigger_reason="New application registered; initial scrutiny of self-disclosure dossier required.",
        linked_document_id=doc_id,
        linked_document_name=f"{app_id}_Self_Disclosure_Affidavit.pdf",
        relevant_rule_clause="APH 2026–27 Ch. II §2.1 Initial Scrutiny",
        previous_automated_result="Pending rule validation",
        assigned_reviewer=new_app.assigned_officer,
        status="pending"
    )
    db.add(init_task)

    # Initial Audit
    audit = AuditEvent(
        application_id=app_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="APPLICATION_INTAKE_CREATED",
        new_status="Ready for review",
        reason_comment=f"New institutional application registered: {req.institution_name} ({app_id})"
    )
    db.add(audit)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("/{app_id}/audit", response_model=List[AuditEventSchema])
def get_application_audit(
    app_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    events = db.query(AuditEvent).filter(AuditEvent.application_id == app_id).order_by(AuditEvent.created_at.desc()).all()
    return events

@router.get("/{app_id}/report")
def generate_application_report(
    app_id: str,
    format: str = Query("html", description="html or json"),
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    """
    Generates a formal VerifyAI Decision-Support Regulatory Review Report.
    """
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    docs = db.query(Document).filter(Document.application_id == app_id).all()
    findings = db.query(Finding).filter(Finding.application_id == app_id).all()
    audits = db.query(AuditEvent).filter(AuditEvent.application_id == app_id).order_by(AuditEvent.created_at.asc()).all()

    report_data = {
        "report_id": f"REP-{app.id}-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}",
        "generated_at": datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "generated_by": user_ctx["username"],
        "disclaimer_banner": ENVIRONMENT_BANNER,
        "application": {
            "id": app.id,
            "institution_name": app.institution_name,
            "academic_year": app.academic_year,
            "nature_of_application": app.nature_of_application,
            "rule_set": app.rule_set,
            "rule_set_version": app.rule_set_version,
            "evaluation_date": app.evaluation_date,
            "source_mode": app.source_mode,
            "workflow_status": app.workflow_status,
            "compliance_outcome": app.compliance_outcome,
            "disposition": app.disposition,
            "disposition_comment": app.disposition_comment,
            "disposition_by": app.disposition_by,
            "disposition_at": app.disposition_at.isoformat() if app.disposition_at else None,
        },
        "documents": [
            {
                "id": d.id,
                "name": d.document_name,
                "type": d.document_type,
                "hash_sha256": d.file_hash,
                "pages": d.page_count,
                "source_mode": d.source_mode
            } for d in docs
        ],
        "findings": [
            {
                "id": f.id,
                "rule_code": f.rule_code,
                "title": f.title,
                "category": f.category,
                "outcome": f.outcome,
                "verification_status": f.verification_status,
                "expected": f.expected_value,
                "observed": f.observed_value,
                "reason": f.plain_reason,
                "evidence": f.evidence_text,
                "review_status": f.review_status,
                "reviewer_reason": f.reviewer_reason
            } for f in findings
        ],
        "audit_trail": [
            {
                "action": a.action,
                "user": f"{a.user_name} ({a.user_role})",
                "time": a.created_at.strftime("%Y-%m-%d %H:%M:%S"),
                "details": a.reason_comment
            } for a in audits
        ]
    }

    if format.lower() == "json":
        return report_data

    # Generate styled HTML report
    findings_rows = ""
    for f in findings:
        badge_color = "#ef4444" if f.outcome == "Possible deficiency" else "#f59e0b" if f.outcome == "Needs clarification" else "#10b981"
        findings_rows += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-weight: 600; font-family: monospace;">{f.id}</td>
          <td style="padding: 10px;"><strong>{f.title}</strong><br><small style="color: #64748b;">{f.category} | Rule: {f.rule_code}</small></td>
          <td style="padding: 10px;"><span style="background: {badge_color}1a; color: {badge_color}; border: 1px solid {badge_color}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">{f.outcome}</span></td>
          <td style="padding: 10px; font-size: 12px;">{f.plain_reason}</td>
          <td style="padding: 10px; font-size: 11px; font-family: monospace; background: #f8fafc;">{f.evidence_text or '-'}</td>
          <td style="padding: 10px; font-size: 12px;"><strong>{f.review_status.upper()}</strong><br><small>{f.reviewer_reason or 'No reviewer notes'}</small></td>
        </tr>
        """

    audit_rows = ""
    for a in audits:
        audit_rows += f"""
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; font-size: 12px; font-family: monospace;">{a.created_at.strftime('%Y-%m-%d %H:%M')}</td>
          <td style="padding: 8px; font-size: 12px; font-weight: 600;">{a.action}</td>
          <td style="padding: 8px; font-size: 12px;">{a.user_name} ({a.user_role})</td>
          <td style="padding: 8px; font-size: 12px;">{a.reason_comment or '-'}</td>
        </tr>
        """

    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>VerifyAI Official Case Report - {app.id}</title>
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; color: #0f172a; line-height: 1.5; }}
        .header {{ border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 24px; }}
        .banner {{ background: #fef2f2; border: 1px solid #f87171; color: #991b1b; padding: 10px; border-radius: 6px; font-weight: bold; text-align: center; font-size: 13px; margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
        th {{ background: #f1f5f9; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; color: #475569; }}
        .section-title {{ font-size: 16px; font-weight: 700; color: #1e3a8a; margin-top: 28px; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }}
        .grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }}
        .card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; }}
        .disclaimer-footer {{ margin-top: 40px; padding-top: 16px; border-top: 1px solid #cbd5e1; font-size: 11px; color: #64748b; text-align: justify; }}
      </style>
    </head>
    <body>
      <div class="banner">
        ⚠️ {ENVIRONMENT_BANNER} | {SYNTHETIC_DOC_BANNER}
      </div>

      <div class="header">
        <div style="float: right; text-align: right; font-size: 12px; color: #64748b;">
          Report ID: {report_data['report_id']}<br>
          Generated: {report_data['generated_at']}<br>
          Generated By: {report_data['generated_by']}
        </div>
        <h1 style="margin: 0; font-size: 24px; color: #0f172a;">VerifyAI Regulatory Scrutiny Report</h1>
        <p style="margin: 4px 0 0; color: #475569; font-size: 14px;">Automated Decision Support Dossier & Audit Record</p>
      </div>

      <div class="section-title">Application Metadata & Profile</div>
      <div class="grid">
        <div class="card">
          <p><strong>Application ID:</strong> {app.id}</p>
          <p><strong>Institution:</strong> {app.institution_name}</p>
          <p><strong>Academic Year:</strong> {app.academic_year}</p>
          <p><strong>Category:</strong> {app.nature_of_application}</p>
        </div>
        <div class="card">
          <p><strong>Rule Set Evaluated:</strong> {app.rule_set} (v{app.rule_set_version})</p>
          <p><strong>Fixed Evaluation Date:</strong> {app.evaluation_date}</p>
          <p><strong>Current Workflow Status:</strong> <span style="font-weight: bold; color: #2563eb;">{app.workflow_status}</span></p>
          <p><strong>Senior Reviewer Disposition:</strong> <span style="font-weight: bold; color: #15803d;">{app.disposition or 'Pending Disposition'}</span></p>
        </div>
      </div>

      <div class="section-title">Validation Findings & Evidence Linkage</div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Rule & Title</th>
            <th>Outcome</th>
            <th>Reason & Analysis</th>
            <th>Evidence Citation</th>
            <th>Human Review</th>
          </tr>
        </thead>
        <tbody>
          {findings_rows}
        </tbody>
      </table>

      <div class="section-title">Senior Reviewer Action & Formal Disposition</div>
      <div class="card" style="background: #f0fdf4; border-color: #86efac;">
        <p><strong>Recorded Disposition:</strong> {app.disposition or 'No disposition recorded yet'}</p>
        <p><strong>Reviewer Comments:</strong> {app.disposition_comment or 'Awaiting Senior Reviewer review.'}</p>
        <p><strong>Recorded By:</strong> {app.disposition_by or 'N/A'} {f'at {app.disposition_at.strftime("%Y-%m-%d %H:%M:%S UTC")}' if app.disposition_at else ''}</p>
      </div>

      <div class="section-title">Complete Persistent Audit Trail</div>
      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Action</th>
            <th>User & Role</th>
            <th>Reason / Comments</th>
          </tr>
        </thead>
        <tbody>
          {audit_rows}
        </tbody>
      </table>

      <div class="disclaimer-footer">
        <strong>REGULATORY DECISION SUPPORT DISCLAIMER:</strong> This report is generated by VerifyAI for internal regulatory
        decision support. VerifyAI assists authorized scrutiny officers by cross-checking declarations against reviewed rules
        and supporting documents. It does not automatically grant or reject approval, declare fraud, or replace statutory scrutiny
        or inspections. All findings are subject to verification and final disposition by authorized regulatory officials.
      </div>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/documents/{doc_id}/file")
def get_document_file(doc_id: str, db: Session = Depends(get_db)):
    """Safely serves the synthetic demonstration PDF."""
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc or not doc.file_path:
        raise HTTPException(status_code=404, detail="Document not found")

    file_path = Path(doc.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Physical document file missing on disk")

    return FileResponse(
        str(file_path),
        media_type="application/pdf",
        filename=doc.document_name
    )
