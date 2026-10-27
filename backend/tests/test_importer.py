import pytest
from backend.app.database import SessionLocal, Base, engine
from backend.app.importer import import_handbook_catalogue
from backend.app.models import (
    CatalogueCategory,
    CatalogueDocument,
    CatalogueCandidateRule,
    CatalogueExternalRef,
    CatalogueImportLog
)

@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()

def test_workbook_importer_all_sheets(db_session):
    res = import_handbook_catalogue(db_session)
    assert res["workbook"] == "handbook_extraction.xlsx"
    assert "Categories" in res["sheets"]
    assert "Documents" in res["sheets"]
    assert "External refs" in res["sheets"]
    assert "Rule candidates" in res["sheets"]
    assert "Summary" in res["sheets"]

    # Verify counts match expected source rows
    assert res["sheets"]["Categories"]["imported"] == 21
    assert res["sheets"]["Documents"]["imported"] == 170
    assert res["sheets"]["External refs"]["imported"] == 534
    assert res["sheets"]["Rule candidates"]["imported"] == 1304

    # Verify DB records
    cat_count = db_session.query(CatalogueCategory).count()
    assert cat_count == 21

    doc_count = db_session.query(CatalogueDocument).count()
    assert doc_count == 170

    ref_count = db_session.query(CatalogueExternalRef).count()
    assert ref_count == 534

    rule_count = db_session.query(CatalogueCandidateRule).count()
    assert rule_count == 1304

def test_importer_preserves_provenance_and_unresolved_mapping(db_session):
    # Check category 21 (Online Learning / ODL)
    cat21 = db_session.query(CatalogueCategory).filter(CatalogueCategory.cat_id == 21).first()
    assert cat21 is not None
    assert "Online Learning" in cat21.nature_of_application
    assert cat21.mapping_status == "unresolved_needs_review"
    assert cat21.source_row == 22
    assert cat21.source_workbook == "handbook_extraction.xlsx"

    # Check category 6 (Merger by reference)
    cat6 = db_session.query(CatalogueCategory).filter(CatalogueCategory.cat_id == 6).first()
    assert cat6 is not None
    assert cat6.mapping_status == "by_reference"

def test_importer_idempotence(db_session):
    # Running import a second time should produce the exact same counts without duplicate rows
    res = import_handbook_catalogue(db_session)
    assert db_session.query(CatalogueCategory).count() == 21
    assert db_session.query(CatalogueDocument).count() == 170
    assert db_session.query(CatalogueCandidateRule).count() == 1304
    assert db_session.query(CatalogueExternalRef).count() == 534
