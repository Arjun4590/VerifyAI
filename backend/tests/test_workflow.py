import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.seed import seed_demo_data

@pytest.fixture(scope="module")
def client():
    db = SessionLocal()
    seed_demo_data(db)
    db.close()
    return TestClient(app)

def test_applications_queue_search_and_filters(client):
    # Test search by ID
    res = client.get("/api/applications?search=VA-DEMO-2026-014", headers={"X-Demo-Role": "scrutiny_officer"})
    assert res.status_code == 200
    apps = res.json()
    assert len(apps) == 1
    app = apps[0]
    assert app["id"] == "VA-DEMO-2026-014"
    assert app["institution_code"] is not None
    assert app["pending_tasks_count"] >= 3
    assert "pending manual check" in app["next_recommended_action"]

    # Test search by Institution Name
    res2 = client.get("/api/applications?search=Apex", headers={"X-Demo-Role": "scrutiny_officer"})
    assert res2.status_code == 200
    apps2 = res2.json()
    assert len(apps2) == 1
    assert apps2[0]["id"] == "VA-DEMO-2026-015"

def test_manual_verification_workflow_lifecycle(client):
    app_id = "VA-DEMO-2026-014"
    officer_headers = {"X-Demo-Role": "scrutiny_officer", "X-Demo-User": "Officer A"}

    # 1. Fetch manual tasks
    res = client.get(f"/api/applications/{app_id}/tasks", headers=officer_headers)
    assert res.status_code == 200
    tasks = res.json()
    assert len(tasks) == 5

    task1 = next(t for t in tasks if t["id"] == "TASK-014-01")
    assert task1["status"] == "pending"

    # 2. Start verification
    res_start = client.patch(
        f"/api/applications/{app_id}/tasks/TASK-014-01",
        headers=officer_headers,
        json={"action": "start"}
    )
    assert res_start.status_code == 200
    assert res_start.json()["status"] == "in_progress"

    # 3. Save draft progress
    res_draft = client.patch(
        f"/api/applications/{app_id}/tasks/TASK-014-01",
        headers=officer_headers,
        json={"action": "save_progress", "remarks": "Contacted Fire Department division; awaiting official confirmation."}
    )
    assert res_draft.status_code == 200
    assert "Contacted Fire Department" in res_draft.json()["reviewer_remarks"]

    # 4. Record Discrepancy (e.g. fire certificate not valid)
    res_disc = client.patch(
        f"/api/applications/{app_id}/tasks/TASK-014-01",
        headers=officer_headers,
        json={"action": "discrepancy", "remarks": "Renewal receipt submitted was forged; state registry confirms lapse."}
    )
    assert res_disc.status_code == 200
    assert res_disc.json()["status"] == "discrepancy"

    # 5. Reopen task
    res_reopen = client.patch(
        f"/api/applications/{app_id}/tasks/TASK-014-01",
        headers=officer_headers,
        json={"action": "reopen", "remarks": "Applicant submitted genuine renewed NOC issued today."}
    )
    assert res_reopen.status_code == 200
    assert res_reopen.json()["status"] == "in_progress"

    # 6. Mark Verified
    res_verified = client.patch(
        f"/api/applications/{app_id}/tasks/TASK-014-01",
        headers=officer_headers,
        json={"action": "mark_verified", "remarks": "Verified renewed NOC #FS-2026-9011 valid until 2027-03-31."}
    )
    assert res_verified.status_code == 200
    assert res_verified.json()["status"] == "verified"

def test_compliance_checklist_retrieval(client):
    res = client.get("/api/applications/VA-DEMO-2026-014/checklist", headers={"X-Demo-Role": "scrutiny_officer"})
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 10
    # Must contain Annexure 2 §2.1 requirements
    assert any("Fire Safety" in item["requirement_title"] for item in items)
    assert any("Barrier-Free" in item["requirement_title"] for item in items)

def test_application_intake(client):
    officer_headers = {"X-Demo-Role": "scrutiny_officer", "X-Demo-User": "Officer A"}
    payload = {
        "institution_name": "National College of Engineering & Research",
        "academic_year": "2026–27",
        "nature_of_application": "Extension of Approval based on Self-Disclosure",
        "category_id": 1,
        "intake_capacity": 480,
        "land_area_acres": 6.5,
        "built_up_area_sqm": 15000.0,
        "trust_name": "National Education Society"
    }
    res = client.post("/api/applications", headers=officer_headers, json=payload)
    assert res.status_code == 200
    new_app = res.json()
    assert "National College" in new_app["institution_name"]
    assert new_app["workflow_status"] == "Ready for review"
    assert len(new_app["documents"]) >= 1
