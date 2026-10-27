import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..auth import get_current_user_and_role
from ..models import Alert, AuditEvent
from ..schemas import AlertSchema

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertSchema])
def list_alerts(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    application_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Alert)
    if status:
        query = query.filter(Alert.status == status)
    if priority:
        query = query.filter(Alert.priority == priority)
    if application_id:
        query = query.filter(Alert.application_id == application_id)
    return query.order_by(Alert.created_at.desc()).all()

@router.post("/{alert_id}/acknowledge")
def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "acknowledged"
    db.add(AuditEvent(
        application_id=alert.application_id,
        finding_id=alert.finding_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="ALERT_ACKNOWLEDGED",
        previous_status="active",
        new_status="acknowledged",
        reason_comment=f"Alert {alert.id} acknowledged by {user_ctx['username']}"
    ))
    db.commit()
    return {"message": "Alert acknowledged", "id": alert.id, "status": alert.status}

@router.post("/{alert_id}/resolve")
def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(get_current_user_and_role)
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = "resolved"
    alert.resolved_at = datetime.datetime.utcnow()
    alert.resolved_by = user_ctx["username"]
    db.add(AuditEvent(
        application_id=alert.application_id,
        finding_id=alert.finding_id,
        user_name=user_ctx["username"],
        user_role=user_ctx["role"],
        action="ALERT_RESOLVED",
        previous_status="active",
        new_status="resolved",
        reason_comment=f"Alert {alert.id} resolved by {user_ctx['username']}"
    ))
    db.commit()
    return {"message": "Alert resolved", "id": alert.id, "status": alert.status}
