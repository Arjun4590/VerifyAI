import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..auth import get_current_user_and_role, require_role
from ..config import ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER
from ..models import Finding, Alert, AuditEvent
from ..schemas import FindingSchema, FindingReviewRequest

router = APIRouter(prefix="/api/findings", tags=["Findings"])

@router.get("/application/{app_id}", response_model=List[FindingSchema])
def get_findings_for_application(app_id: str, db: Session = Depends(get_db)):
    findings = db.query(Finding).filter(Finding.application_id == app_id).all()
    return findings

@router.post("/{finding_id}/review")
def review_finding(
    finding_id: str,
    req: FindingReviewRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SCRUTINY_OFFICER, ROLE_SENIOR_REVIEWER]))
):
    """
    Records an authorized human review action (confirm, dismiss, clarification_requested)
    with a mandatory written reason. System Admin is strictly prevented from reviewing findings.
    """
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")

    action_lower = req.action.strip().lower()
    if action_lower not in ["confirm", "dismiss", "clarification_requested"]:
        raise HTTPException(status_code=400, detail="Action must be 'confirm', 'dismiss', or 'clarification_requested'")

    status_map = {
        "confirm": "confirmed",
        "dismiss": "dismissed",
        "clarification_requested": "clarification_requested"
    }
    new_status = status_map[action_lower]
    old_status = finding.review_status

    finding.review_status = new_status
    finding.reviewer_name = user_ctx["username"]
    finding.reviewer_role = user_ctx["role"]
    finding.reviewer_reason = req.reason
    finding.reviewed_at = datetime.datetime.utcnow()

    # Update any corresponding alert
    alert = db.query(Alert).filter(Alert.finding_id == finding_id).first()
    if alert:
        if new_status in ["confirmed", "dismissed"]:
            alert.status = "resolved"
            alert.resolved_at = datetime.datetime.utcnow()
            alert.resolved_by = user_ctx["username"]

    # Audit event
    audit_action = f"FINDING_{new_status.upper()}"
    audit = AuditEvent(
        application_id=finding.application_id,
        finding_id=finding.id,
        rule_id=finding.rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action=audit_action,
        previous_status=old_status,
        new_status=new_status,
        reason_comment=req.reason
    )
    db.add(audit)
    db.commit()

    return {
        "message": f"Finding {finding_id} {new_status} successfully",
        "finding_id": finding.id,
        "review_status": finding.review_status,
        "reviewer_reason": finding.reviewer_reason,
        "reviewed_at": finding.reviewed_at.isoformat()
    }
