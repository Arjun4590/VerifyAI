import pytest
from backend.app.database import SessionLocal, Base, engine
from backend.app.seed import seed_demo_data
from backend.app.rules_engine import evaluate_application
from backend.app.models import Application, Finding, Alert, ValidationRun

@pytest.fixture(scope="module")
def seeded_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_demo_data(db)
    yield db
    db.close()

def test_deterministic_seed_findings(seeded_db):
    app = seeded_db.query(Application).filter(Application.id == "VA-DEMO-2026-014").first()
    assert app is not None
    assert app.institution_name == "Demo Institute of Applied Studies"
    assert app.rule_set == "APH-DEMO-2026-27"
    assert app.evaluation_date == "2026-04-15"

    findings = seeded_db.query(Finding).filter(Finding.application_id == "VA-DEMO-2026-014").all()
    assert len(findings) >= 4

    # Finding 1: Fire Certificate Expiry
    fire_f = next((f for f in findings if f.rule_code == "DOC-FIRE-EXPIRY"), None)
    assert fire_f is not None
    assert fire_f.outcome == "Possible deficiency"
    assert "2025-12-31" in fire_f.observed_value
    assert "2026-04-15" in fire_f.expected_value
    assert fire_f.source_page == 1

    # Finding 2: Student Data Declaration Contradiction
    decl_f = next((f for f in findings if f.rule_code == "DECL-FORM-STUDENT-DATA"), None)
    assert decl_f is not None
    assert decl_f.outcome == "Needs clarification"
    assert "Uploaded student data complete" in decl_f.observed_value
    assert "No" in decl_f.observed_value

    # Finding 3: Missing Required Document
    miss_f = next((f for f in findings if f.rule_code == "CHECKLIST-MISSING-DOC"), None)
    assert miss_f is not None
    assert miss_f.outcome == "Possible deficiency"

    # Finding 4: Simulated Issuer Connector
    iss_f = next((f for f in findings if f.rule_code == "ISSUER-VERIFY-CHECK"), None)
    assert iss_f is not None
    assert iss_f.verification_status == "Mismatch detected"
    assert "SIMULATED" in iss_f.plain_reason

def test_rerun_validation_updates_state(seeded_db):
    val_run = evaluate_application(seeded_db, "VA-DEMO-2026-014", run_by="Officer A")
    assert val_run.id.startswith("VR-")
    assert val_run.application_id == "VA-DEMO-2026-014"
    assert val_run.evaluation_date == "2026-04-15"

    # Ensure dashboard / application outcome reflects deficiencies
    app = seeded_db.query(Application).filter(Application.id == "VA-DEMO-2026-014").first()
    assert app.compliance_outcome == "Possible deficiency"
