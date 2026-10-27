from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, List
from ..database import get_db
from ..auth import get_current_user_and_role, require_role
from ..config import (
    ENVIRONMENT_NAME,
    ENVIRONMENT_BANNER,
    DEMO_EVALUATION_DATE,
    ROLE_SYSTEM_ADMIN,
    SIMULATED_ISSUER_BANNER,
    SIMULATED_CONNECTOR_NAME
)
from ..models import (
    Application,
    Finding,
    Alert,
    AuditEvent,
    CatalogueCategory,
    CatalogueDocument,
    CatalogueCandidateRule,
    CatalogueExternalRef,
    Rule,
    User
)
from ..seed import seed_demo_data
from ..importer import import_handbook_catalogue

router = APIRouter(prefix="/api", tags=["System"])

# In-memory connector state for demo toggle
CONNECTOR_CONFIG = [
    {
        "id": "state_fire_registry",
        "name": "State Directorate of Fire Services Registry",
        "type": "Issuer Registry Check",
        "mode": "SIMULATED",
        "status": "Active (Simulated)",
        "banner": SIMULATED_ISSUER_BANNER,
        "endpoint": "https://fire-services.mock.internal/api/v1/verify",
        "last_ping": "2026-04-15 10:30:00",
        "latency_ms": 124
    },
    {
        "id": "digilocker_document_vault",
        "name": "National Document Repository / DigiLocker Vault",
        "type": "Digital Credential Cross-Check",
        "mode": "SIMULATED",
        "status": "Active (Simulated)",
        "banner": SIMULATED_ISSUER_BANNER,
        "endpoint": "https://vault.mock.internal/api/v2/fetch",
        "last_ping": "2026-04-15 10:28:15",
        "latency_ms": 98
    },
    {
        "id": "aishe_portal_connector",
        "name": "AISHE Higher Education Data Exchange",
        "type": "Institutional Data Match",
        "mode": "SIMULATED",
        "status": "Inactive (Planned)",
        "banner": "PLANNED CONNECTOR — NO LIVE ACCESS",
        "endpoint": "None configured",
        "last_ping": "Never",
        "latency_ms": 0
    }
]

@router.get("/health")
def get_health(db: Session = Depends(get_db)):
    app_count = db.query(Application).count()
    category_count = db.query(CatalogueCategory).count()
    return {
        "status": "healthy",
        "environment": ENVIRONMENT_NAME,
        "disclaimer": ENVIRONMENT_BANNER,
        "evaluation_date": DEMO_EVALUATION_DATE,
        "database": "sqlite_connected",
        "applications_count": app_count,
        "catalogue_categories_count": category_count
    }

@router.get("/dashboard")
def get_dashboard(db: Session = Depends(get_db), user_ctx: dict = Depends(get_current_user_and_role)):
    """
    Returns data-derived metrics dynamically calculated from actual stored records.
    No fabricated or ungrounded statistics.
    """
    total_apps = db.query(Application).count()
    in_review_apps = db.query(Application).filter(Application.workflow_status.in_(["In review", "Ready for review"])).count()
    escalated_apps = db.query(Application).filter(Application.workflow_status == "Escalated").count()
    completed_apps = db.query(Application).filter(Application.workflow_status == "Completed").count()

    # Cases needing attention: has possible deficiency or clarification requested
    needing_attention = db.query(Application).filter(
        Application.compliance_outcome.in_(["Possible deficiency", "Needs clarification"])
    ).count()

    # Pending verification
    pending_verification = db.query(Application).filter(
        Application.verification_status.in_(["Verification pending", "Mismatch detected", "Manual review required"])
    ).count()

    # Workload breakdown by workflow status
    status_counts = {}
    for status in ["New", "Processing", "Ready for review", "In review", "Clarification requested", "Escalated", "Completed"]:
        status_counts[status] = db.query(Application).filter(Application.workflow_status == status).count()

    # Recent active alerts
    alerts = db.query(Alert).filter(Alert.status == "active").order_by(Alert.created_at.desc()).limit(5).all()
    recent_alerts = [
        {
            "id": a.id,
            "title": a.title,
            "application_id": a.application_id,
            "priority": a.priority,
            "reason": a.reason,
            "created_at": a.created_at.isoformat()
        } for a in alerts
    ]

    # Catalogue summary counts
    cat_count = db.query(CatalogueCategory).count()
    doc_cat_count = db.query(CatalogueDocument).count()
    cand_rule_count = db.query(CatalogueCandidateRule).count()
    ext_ref_count = db.query(CatalogueExternalRef).count()
    approved_rules_count = db.query(Rule).filter(Rule.status == "approved").count()
    draft_rules_count = db.query(Rule).filter(Rule.status.in_(["draft", "submitted_for_approval"])).count()

    return {
        "metrics": {
            "total_applications": total_apps,
            "under_review": in_review_apps,
            "needs_attention": needing_attention,
            "pending_verification": pending_verification,
            "escalated_cases": escalated_apps,
            "completed_cases": completed_apps,
        },
        "workload_by_status": status_counts,
        "recent_alerts": recent_alerts,
        "catalogue_coverage": {
            "categories": cat_count,
            "document_requirements": doc_cat_count,
            "candidate_rules": cand_rule_count,
            "external_references": ext_ref_count,
            "approved_executable_rules": approved_rules_count,
            "draft_governance_rules": draft_rules_count
        },
        "environment": {
            "name": ENVIRONMENT_NAME,
            "banner": ENVIRONMENT_BANNER,
            "evaluation_date": DEMO_EVALUATION_DATE
        }
    }

@router.post("/demo/seed")
def post_seed(db: Session = Depends(get_db)):
    """Re-initializes deterministic demo application data, fixtures, and rules."""
    res = seed_demo_data(db)
    return {"message": "Demo data seeded successfully", "details": res}

@router.post("/demo/import")
def post_import(db: Session = Depends(get_db)):
    """Re-runs the workbook importer against handbook_extraction.xlsx."""
    res = import_handbook_catalogue(db)
    return {"message": "Handbook extraction catalogue imported successfully", "details": res}

@router.get("/users")
def get_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [{"id": u.id, "username": u.username, "name": u.name, "role": u.role, "email": u.email} for u in users]

@router.get("/connectors")
def get_connectors():
    return CONNECTOR_CONFIG

@router.post("/connectors/{connector_id}/toggle")
def toggle_connector(
    connector_id: str,
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN]))
):
    for c in CONNECTOR_CONFIG:
        if c["id"] == connector_id:
            if "Active" in c["status"]:
                c["status"] = "Disabled by Administrator"
            else:
                c["status"] = "Active (Simulated)"
            return {"message": f"Connector {connector_id} updated", "connector": c}
    raise HTTPException(status_code=404, detail="Connector not found")
