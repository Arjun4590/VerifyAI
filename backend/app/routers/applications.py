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
    Rule
)
from ..schemas import (
    ApplicationListSchema,
    ApplicationDetailSchema,
    ClarificationRequest,
    EscalationRequest,
    DispositionRequest,
    AuditEventSchema
)
from ..rules_engine import evaluate_application

router = APIRouter(prefix="/api/applications", tags=["Applications"])

@router.get("", response_model=List[ApplicationListSchema])
def list_applications(
    search: Optional[str] = Query(None),
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
        query = query.filter((Application.id.ilike(s)) | (Application.institution_name.ilike(s)))
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
        result.append(ApplicationListSchema(
            id=a.id,
            institution_name=a.institution_name,
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
