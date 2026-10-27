import datetime
import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any

from ..database import get_db
from ..auth import get_current_user_and_role, require_role
from ..config import ROLE_SYSTEM_ADMIN, ROLE_SENIOR_REVIEWER
from ..models import Rule, RuleVersion, AuditEvent
from ..schemas import (
    RuleSchema,
    RuleVersionSchema,
    RuleDraftRequest,
    RuleApprovalRequest,
    RuleRejectionRequest
)

router = APIRouter(prefix="/api/rules", tags=["Rules Governance"])

@router.get("", response_model=List[RuleSchema])
def list_rules(
    status: Optional[str] = Query(None),
    check_type: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Rule)
    if status:
        query = query.filter(Rule.status == status)
    if check_type:
        query = query.filter(Rule.check_type == check_type)
    if category_id:
        query = query.filter(Rule.category_id == category_id)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter((Rule.code.ilike(s)) | (Rule.title.ilike(s)) | (Rule.description.ilike(s)))
    return query.order_by(Rule.id.asc()).all()

@router.get("/{rule_id}", response_model=RuleSchema)
def get_rule_detail(rule_id: str, db: Session = Depends(get_db)):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.post("/drafts", response_model=RuleSchema)
def create_rule_draft(
    req: RuleDraftRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN]))
):
    """System Admin creates a new draft regulatory rule."""
    existing = db.query(Rule).filter(Rule.code == req.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Rule with code '{req.code}' already exists")

    rule_id = f"RULE-GOV-{datetime.datetime.utcnow().strftime('%m%d%H%M')}"
    new_rule = Rule(
        id=rule_id,
        code=req.code,
        title=req.title,
        description=req.description,
        category_id=req.category_id,
        check_type=req.check_type,
        source_reference=req.source_reference,
        source_clause=req.source_clause,
        handbook_page=req.handbook_page,
        parameters_json=json.dumps(req.parameters or {}),
        status="draft",
        created_by=user_ctx["username"],
        current_version="0.1",
        effective_date=req.effective_date or "2026-07-01"
    )
    db.add(new_rule)

    version_entry = RuleVersion(
        rule_id=rule_id,
        version="0.1",
        definition_json=json.dumps({
            "code": req.code,
            "title": req.title,
            "check_type": req.check_type,
            "source_reference": req.source_reference,
            "parameters": req.parameters
        }),
        changelog="Initial draft created by System Admin",
        status="draft",
        submitted_by=user_ctx["username"]
    )
    db.add(version_entry)

    db.add(AuditEvent(
        rule_id=rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="RULE_DRAFT_CREATED",
        new_status="draft",
        reason_comment=f"Created rule draft '{req.title}' ({req.code})"
    ))

    db.commit()
    db.refresh(new_rule)
    return new_rule

@router.put("/{rule_id}/drafts", response_model=RuleSchema)
def update_rule_draft(
    rule_id: str,
    req: RuleDraftRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN]))
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400, detail="Only rules in 'draft' or 'rejected' status can be edited")

    rule.title = req.title
    rule.description = req.description
    rule.category_id = req.category_id
    rule.check_type = req.check_type
    rule.source_reference = req.source_reference
    rule.source_clause = req.source_clause
    rule.handbook_page = req.handbook_page
    rule.parameters_json = json.dumps(req.parameters or {})
    rule.effective_date = req.effective_date or rule.effective_date

    db.add(AuditEvent(
        rule_id=rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="RULE_DRAFT_UPDATED",
        new_status=rule.status,
        reason_comment=f"Updated parameters for draft {rule_id}"
    ))

    db.commit()
    db.refresh(rule)
    return rule

@router.post("/{rule_id}/submit-review")
def submit_rule_for_review(
    rule_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN]))
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.status != "draft":
        raise HTTPException(status_code=400, detail="Only 'draft' rules can be submitted for review")

    rule.status = "submitted_for_approval"

    db.add(AuditEvent(
        rule_id=rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="RULE_SUBMITTED_FOR_APPROVAL",
        previous_status="draft",
        new_status="submitted_for_approval",
        reason_comment=f"Submitted rule {rule.code} to Senior Reviewer for formal review"
    ))

    db.commit()
    return {"message": "Rule submitted for approval", "rule_id": rule_id, "status": rule.status}

@router.post("/{rule_id}/approve")
def approve_rule(
    rule_id: str,
    req: RuleApprovalRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SENIOR_REVIEWER]))
):
    """Senior Reviewer approves and publishes rule version."""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    if rule.status not in ["submitted_for_approval", "draft"]:
        raise HTTPException(status_code=400, detail="Only draft or submitted rules can be approved")

    old_status = rule.status
    rule.status = "approved"
    rule.approved_by = user_ctx["username"]

    # Increment version to 1.0 or next major/minor
    if rule.current_version.startswith("0."):
        new_version = "1.0"
    else:
        parts = rule.current_version.split(".")
        new_version = f"{int(parts[0]) + 1}.0"
    rule.current_version = new_version

    version_entry = RuleVersion(
        rule_id=rule_id,
        version=new_version,
        definition_json=json.dumps({
            "code": rule.code,
            "title": rule.title,
            "check_type": rule.check_type,
            "source_reference": rule.source_reference,
            "parameters": rule.parameters_json
        }),
        changelog=f"Approved and published by {user_ctx['username']}: {req.comment}",
        status="approved",
        submitted_by=rule.created_by,
        approved_by=user_ctx["username"],
        approved_at=datetime.datetime.utcnow()
    )
    db.add(version_entry)

    db.add(AuditEvent(
        rule_id=rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="RULE_APPROVED_PUBLISHED",
        previous_status=old_status,
        new_status="approved",
        reason_comment=f"Approved version {new_version}. Comment: {req.comment}"
    ))

    db.commit()
    return {
        "message": f"Rule {rule.code} approved and published as version {new_version}",
        "rule_id": rule_id,
        "version": new_version,
        "status": "approved"
    }

@router.post("/{rule_id}/reject")
def reject_rule(
    rule_id: str,
    req: RuleRejectionRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SENIOR_REVIEWER]))
):
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    old_status = rule.status
    rule.status = "rejected"

    db.add(AuditEvent(
        rule_id=rule_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="RULE_REJECTED",
        previous_status=old_status,
        new_status="rejected",
        reason_comment=f"Rejection Reason: {req.reason}"
    ))

    db.commit()
    return {"message": f"Rule {rule.code} rejected", "rule_id": rule_id, "status": "rejected"}

@router.get("/{rule_id}/versions", response_model=List[RuleVersionSchema])
def get_rule_versions(rule_id: str, db: Session = Depends(get_db)):
    versions = db.query(RuleVersion).filter(RuleVersion.rule_id == rule_id).order_by(RuleVersion.created_at.desc()).all()
    return versions

@router.post("/{rule_id}/test")
def test_rule_execution(rule_id: str, payload: Dict[str, Any], db: Session = Depends(get_db)):
    """Simulates testing a rule against a test fixture."""
    rule = db.query(Rule).filter(Rule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    # Deterministic simulation of test case evaluation
    test_result = {
        "rule_id": rule.id,
        "code": rule.code,
        "status": rule.status,
        "test_input": payload,
        "outcome": "Passed" if payload.get("valid", True) else "Deficiency Triggered",
        "simulated_finding": {
            "title": f"Test Execution for {rule.title}",
            "evaluated_against": rule.source_reference,
            "status": "Simulated Test OK"
        }
    }
    return test_result
