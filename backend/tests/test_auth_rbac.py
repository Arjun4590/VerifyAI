import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_admin_forbidden_from_case_review(client):
    res = client.post(
        "/api/findings/FIND-014-001/review",
        headers={"X-Demo-Role": "system_admin"},
        json={"action": "confirm", "reason": "Admin review should be forbidden"}
    )
    assert res.status_code == 403

def test_officer_forbidden_from_case_disposition(client):
    res = client.post(
        "/api/applications/VA-DEMO-2026-014/disposition",
        headers={"X-Demo-Role": "scrutiny_officer"},
        json={"disposition": "Satisfactory", "comment": "Officer cannot decide final disposition"}
    )
    assert res.status_code == 403

def test_senior_reviewer_permitted_disposition(client):
    res = client.post(
        "/api/applications/VA-DEMO-2026-014/disposition",
        headers={"X-Demo-Role": "senior_reviewer", "X-Demo-User": "Senior Reviewer"},
        json={"disposition": "Clarification required", "comment": "Valid senior review disposition"}
    )
    assert res.status_code == 200
    assert res.json()["workflow_status"] == "Completed"
    assert res.json()["disposition"] == "Clarification required"
