from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from ..database import get_db
from ..auth import get_current_user_and_role, require_role
from ..config import ROLE_SYSTEM_ADMIN, ROLE_SENIOR_REVIEWER
from ..models import (
    CatalogueCategory,
    CatalogueDocument,
    CatalogueCandidateRule,
    CatalogueExternalRef,
    CatalogueImportLog,
    Rule
)
from ..schemas import (
    CatalogueCategorySchema,
    CatalogueDocumentSchema,
    CatalogueCandidateRuleSchema,
    CatalogueExternalRefSchema
)

router = APIRouter(prefix="/api/catalogue", tags=["Catalogue"])

class MappingUpdateRequest(BaseModel):
    mapping_status: str
    mapping_notes: Optional[str] = None

class CandidateLifecycleRequest(BaseModel):
    lifecycle_status: str
    review_notes: Optional[str] = None

@router.get("/categories", response_model=List[CatalogueCategorySchema])
def list_categories(
    search: Optional[str] = Query(None),
    mapping_status: Optional[str] = Query(None),
    scrutiny: Optional[str] = Query(None),
    evc: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CatalogueCategory)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (CatalogueCategory.nature_of_application.ilike(s)) |
            (CatalogueCategory.annexure2_sections.ilike(s)) |
            (CatalogueCategory.note.ilike(s))
        )
    if mapping_status:
        query = query.filter(CatalogueCategory.mapping_status == mapping_status)
    if scrutiny:
        query = query.filter(CatalogueCategory.scrutiny == scrutiny)
    if evc:
        query = query.filter(CatalogueCategory.evc == evc)

    return query.order_by(CatalogueCategory.cat_id.asc()).all()

@router.post("/categories/{cat_id}/mapping")
def update_category_mapping(
    cat_id: int,
    req: MappingUpdateRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN, ROLE_SENIOR_REVIEWER]))
):
    cat = db.query(CatalogueCategory).filter(CatalogueCategory.cat_id == cat_id).first()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")

    cat.mapping_status = req.mapping_status
    cat.mapping_notes = req.mapping_notes
    db.commit()
    return {"message": "Mapping updated", "cat_id": cat_id, "mapping_status": cat.mapping_status}

@router.get("/documents")
def list_documents(
    search: Optional[str] = Query(None),
    annexure: Optional[str] = Query(None),
    kind: Optional[str] = Query(None),
    conditional: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(CatalogueDocument)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (CatalogueDocument.text.ilike(s)) |
            (CatalogueDocument.section_title.ilike(s)) |
            (CatalogueDocument.section.ilike(s))
        )
    if annexure:
        query = query.filter(CatalogueDocument.annexure == annexure)
    if kind:
        query = query.filter(CatalogueDocument.kind == kind)
    if conditional is not None:
        query = query.filter(CatalogueDocument.conditional == conditional)

    total = query.count()
    items = query.order_by(CatalogueDocument.id.asc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [CatalogueDocumentSchema.model_validate(it) for it in items]
    }

@router.get("/candidate-rules")
def list_candidate_rules(
    search: Optional[str] = Query(None),
    modality: Optional[str] = Query(None),
    has_number: Optional[bool] = Query(None),
    conditional: Optional[bool] = Query(None),
    type_guess: Optional[str] = Query(None),
    lifecycle_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(CatalogueCandidateRule)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (CatalogueCandidateRule.cand_id.ilike(s)) |
            (CatalogueCandidateRule.sentence.ilike(s)) |
            (CatalogueCandidateRule.clause.ilike(s))
        )
    if modality:
        query = query.filter(CatalogueCandidateRule.modality == modality)
    if has_number is not None:
        query = query.filter(CatalogueCandidateRule.has_number == has_number)
    if conditional is not None:
        query = query.filter(CatalogueCandidateRule.conditional == conditional)
    if type_guess:
        query = query.filter(CatalogueCandidateRule.type_guess == type_guess)
    if lifecycle_status:
        query = query.filter(CatalogueCandidateRule.lifecycle_status == lifecycle_status)

    total = query.count()
    items = query.order_by(CatalogueCandidateRule.id.asc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [CatalogueCandidateRuleSchema.model_validate(it) for it in items]
    }

@router.post("/candidate-rules/{cand_id}/lifecycle")
def update_candidate_lifecycle(
    cand_id: str,
    req: CandidateLifecycleRequest,
    db: Session = Depends(get_db),
    user_ctx: dict = Depends(require_role([ROLE_SYSTEM_ADMIN, ROLE_SENIOR_REVIEWER]))
):
    rule = db.query(CatalogueCandidateRule).filter(CatalogueCandidateRule.cand_id == cand_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Candidate rule not found")

    rule.lifecycle_status = req.lifecycle_status
    rule.review_notes = req.review_notes
    rule.reviewed_by = user_ctx["username"]
    db.commit()
    return {"message": "Candidate status updated", "cand_id": cand_id, "lifecycle_status": rule.lifecycle_status}

@router.get("/external-refs")
def list_external_refs(
    search: Optional[str] = Query(None),
    ref_type: Optional[str] = Query(None),
    integration_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    query = db.query(CatalogueExternalRef)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (CatalogueExternalRef.sentence.ilike(s)) |
            (CatalogueExternalRef.keywords.ilike(s))
        )
    if ref_type:
        query = query.filter(CatalogueExternalRef.ref_types.ilike(f"%{ref_type}%"))
    if integration_status:
        query = query.filter(CatalogueExternalRef.integration_status == integration_status)

    total = query.count()
    items = query.order_by(CatalogueExternalRef.id.asc()).offset(skip).limit(limit).all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [CatalogueExternalRefSchema.model_validate(it) for it in items]
    }

@router.get("/coverage")
def get_catalogue_coverage(db: Session = Depends(get_db)):
    """
    Computes precise catalogue coverage derived from imported workbook records.
    """
    total_categories = db.query(CatalogueCategory).count()
    unresolved_categories = db.query(CatalogueCategory).filter(
        CatalogueCategory.mapping_status == "unresolved_needs_review"
    ).count()

    total_docs = db.query(CatalogueDocument).count()
    docs_by_annexure = dict(
        db.query(CatalogueDocument.annexure, func.count(CatalogueDocument.id)).group_by(CatalogueDocument.annexure).all()
    )
    docs_by_kind = dict(
        db.query(CatalogueDocument.kind, func.count(CatalogueDocument.id)).group_by(CatalogueDocument.kind).all()
    )
    conditional_docs_count = db.query(CatalogueDocument).filter(CatalogueDocument.conditional == True).count()

    total_candidates = db.query(CatalogueCandidateRule).count()
    candidates_by_type = dict(
        db.query(CatalogueCandidateRule.type_guess, func.count(CatalogueCandidateRule.id)).group_by(CatalogueCandidateRule.type_guess).all()
    )
    candidates_by_lifecycle = dict(
        db.query(CatalogueCandidateRule.lifecycle_status, func.count(CatalogueCandidateRule.id)).group_by(CatalogueCandidateRule.lifecycle_status).all()
    )
    candidates_with_numbers = db.query(CatalogueCandidateRule).filter(CatalogueCandidateRule.has_number == True).count()
    candidates_conditional = db.query(CatalogueCandidateRule).filter(CatalogueCandidateRule.conditional == True).count()

    total_ext_refs = db.query(CatalogueExternalRef).count()
    ext_refs_by_status = dict(
        db.query(CatalogueExternalRef.integration_status, func.count(CatalogueExternalRef.id)).group_by(CatalogueExternalRef.integration_status).all()
    )

    approved_rules_count = db.query(Rule).filter(Rule.status == "approved").count()
    draft_rules_count = db.query(Rule).filter(Rule.status.in_(["draft", "submitted_for_approval"])).count()

    import_logs = db.query(CatalogueImportLog).order_by(CatalogueImportLog.imported_at.desc()).limit(5).all()

    return {
        "categories": {
            "total": total_categories,
            "unresolved_mappings": unresolved_categories,
            "unresolved_category_note": "Online Learning / ODL courses (Cat 21) has no direct Annexure-2 mapping in handbook; requires review."
        },
        "documents": {
            "total": total_docs,
            "by_annexure": docs_by_annexure,
            "by_kind": docs_by_kind,
            "conditional_items": conditional_docs_count
        },
        "candidate_rules": {
            "total": total_candidates,
            "by_type_guess": candidates_by_type,
            "by_lifecycle": candidates_by_lifecycle,
            "with_numbers": candidates_with_numbers,
            "conditional": candidates_conditional
        },
        "external_references": {
            "total": total_ext_refs,
            "by_integration_status": ext_refs_by_status
        },
        "rules_governance_coverage": {
            "approved_executable_rules": approved_rules_count,
            "draft_submitted_rules": draft_rules_count,
            "lifecycle_rule_is_candidate": True,
            "approval_gate_enforced": True
        },
        "recent_imports": [
            {
                "sheet": log.sheet_name,
                "total": log.total_rows,
                "imported": log.imported_rows,
                "skipped": log.skipped_rows,
                "timestamp": log.imported_at.isoformat()
            } for log in import_logs
        ]
    }
