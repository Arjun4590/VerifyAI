# VerifyAI — AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification

> **SIH 2026 Problem Statement 26261**  
> **Antigravity Demo Build & Source-Traceable Handbook Implementation**  
> *Built for demonstration, regulatory auditability, and hackathon presentation.*

---

## ⚠️ Important Compliance Disclosures & Regulatory Safeguards

- **DEMO ENVIRONMENT:** This software operates strictly in a demonstration environment and is **NOT CONNECTED TO AICTE SYSTEMS OR ANY LIVE GOVERNMENT API**.
- **SYNTHETIC DATA:** All institutional applications, officer names, and document fixtures are synthetic demonstration fixtures. Every document fixture carries the explicit watermark: `SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE`.
- **SIMULATED ISSUER CHECKS:** Document issuer verification utilizes deterministic local mock connectors clearly labelled `SIMULATED — NO LIVE ISSUER API`. It does not contact external government databases.
- **DECISION SUPPORT ONLY:** VerifyAI is an automated decision-support and audit-trail system designed to assist human scrutiny officers. It **never** issues automatic final approvals or rejections. Final regulatory dispositions remain the exclusive purview of authorized human reviewers.
- **NO FABRICATED RULES:** AICTE Approval Process Handbook (APH 2024–27) candidate sentences (1,304 items) imported from `handbook_extraction.xlsx` are governed through an explicit lifecycle (`Candidate → Needs Source Review → Reviewed → Draft → Submitted for Approval → Approved/Published`). Candidate sentences are **not** executed automatically.

---

## 1. Project Overview & Architecture

VerifyAI is a modular regulatory compliance verification platform implementing an end-to-end audit and evidence review workflow:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        VerifyAI Platform Architecture                  │
└────────────────────────────────────────────────────────────────────────┘
       │
       ├── Frontend (Single-Page Regulatory Operations Console)
       │    ├── Framework: React 19, TypeScript, Vite 8, Tailwind CSS v4
       │    ├── Icons & UI: Lucide React, semantic status badges, interactive modals
       │    ├── 15 Dedicated Screens: Overview, Applications, Review Workspace,
       │    │   Review Queue, Verification, Infrastructure, Alerts, Rules Governance,
       │    │   4 Handbook Catalogue Explorers, Coverage, Reports & Audit, Admin
       │    └── Role Switcher: Scrutiny Officer, Senior Reviewer, System Admin
       │
       ├── Backend (High-Performance Modular REST API)
       │    ├── Framework: FastAPI (Python 3.13), Pydantic v2, Uvicorn
       │    ├── Document Engine: PyMuPDF (fitz) text & metadata extraction, SHA-256
       │    ├── PDF Generation: ReportLab deterministic synthetic watermarked fixtures
       │    ├── Workbook Importer: openpyxl deterministic parser for 5 handbook sheets
       │    ├── Rules Engine: Versioned deterministic compliance evaluator
       │    └── RBAC & Security: Demo header-based role enforcement with endpoint locks
       │
       └── Persistence Layer (SQLite Database: backend/data/verifyai.db)
            ├── 17 Relational Entities: Users, Applications, Structured Fields,
            │   Documents, Extractions, 4 Catalogue Tables, Import Logs,
            │   Rules, Rule Versions, Validation Runs, Findings, Verification Attempts,
            │   Alerts, and Audit Events
            └── Deterministic Fixtures: backend/data/documents/*.pdf
```

---

## 2. Handbook Workbook Catalogue Integration

VerifyAI includes a deterministic importer that parses all 5 sheets of `handbook_extraction.xlsx` (2,029 total records) into dedicated relational tables, preserving exact source clauses, page numbers, modality indicators, and source text provenance:

| Sheet Name | Source Rows | Imported Records | Status & Notes |
| :--- | :---: | :---: | :--- |
| **Summary** | 13 | 13 | Handbook scope, version metadata, and methodology notes |
| **Categories** | 21 | 21 | All 21 approval categories; Category 21 (Online Learning / ODL) flagged with `unresolved_needs_review` warning |
| **Documents** | 170 | 170 | Annexure-1 & Annexure-2 requirements, document types, verifiers, and section references |
| **External refs**| 534 | 534 | Mined statutory bodies, portals, and standards; marked as `simulated` or `unavailable` |
| **Rule candidates**| 1,304 | 1,304 | Raw candidate sentences mined from handbook; retained in candidate library for human governance |
| **TOTAL** | **2,042** | **2,042** | **100% Import Fidelity — Zero Data Loss** |

---

## 3. Seed Scenarios & Deterministic Findings

The system seeds two synthetic cases. The primary demonstration application is:
- **Application ID:** `VA-DEMO-2026-014`
- **Institution:** Demo Institute of Applied Studies (AY 2026–27)
- **Application Type:** Extension of Approval based on Self-Disclosure
- **Rule Set:** `APH-DEMO-2026-27` (Version 1.0)
- **Fixed Evaluation Date:** `2026-04-15` *(Guarantees identical, reproducible outcomes regardless of system clock)*

### The 5 Seeded Findings Evaluated in `VA-DEMO-2026-014`:

1. **Finding A — Expired Fire Safety Certificate (`DOC-FIRE-EXPIRY`):**
   - *Evidence:* Certificate validity date `2026-03-31` is prior to the fixed evaluation date `2026-04-15`.
   - *Outcome:* `Possible deficiency`.
   - *Explanation:* Clear date discrepancy displayed with side-by-side evidence drawer and PDF preview.
2. **Finding B — Declaration / Form Contradiction (`DECL-FORM-STUDENT-DATA`):**
   - *Evidence:* Synthetic affidavit swears student data upload is `Yes/Complete`, but structured portal field is `No`.
   - *Outcome:* `Needs clarification`.
   - *Explanation:* Inconsistency highlighted with exact clause and portal field references.
3. **Finding C — Missing Required Document (`CHECKLIST-MISSING-DOC`):**
   - *Evidence:* *Land Title Deed / Ownership Documents* required by Annexure-2 checklist item `A2-LND-001` was not uploaded.
   - *Outcome:* `Possible deficiency`.
4. **Finding D — Simulated Issuer Verification Mismatch (`ISSUER-VERIFY-CHECK`):**
   - *Evidence:* State Fire Services simulated connector returned a serial number mismatch (`FSC-2023-8891` vs `FSC-2023-8891-REV`).
   - *Outcome:* `Mismatch detected`.
   - *Labeling:* Prominently marked `SIMULATED — NO LIVE ISSUER API`.
5. **Finding E — Low Confidence Extraction Review (`OCR-CONFIDENCE-LOW`):**
   - *Evidence:* Occupancy certificate OCR extraction confidence scored at 0.62 (< 0.75 threshold).
   - *Outcome:* `Needs clarification` (Routes to manual human verification; never treated as non-compliance).

---

## 4. Getting Started & Deployment Guide

### Option A: Frontend-Only Quickstart (Zero Backend Required, Vercel-Ready) ⭐

VerifyAI is fully migrated to a **frontend-only, standalone architecture**! It runs directly in the browser using an embedded, complete 1.56 MB static data snapshot (`initialData.json`) containing all 2,042 handbook catalogue records, seeded applications, findings, rules, alerts, and audit logs. No Python, FastAPI, or SQLite server is required.

#### 1. Run Locally (Windows PowerShell)
```powershell
# Navigate directly to the frontend directory
cd "C:\Users\arjun\OneDrive\Desktop\COLLEGE\Hackathons\SIH 26 PS 261\frontend"

# Install dependencies (only needed once)
npm install

# Start the Vite development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

#### 2. Deploy to Vercel (1-Click Static Frontend)
VerifyAI can be deployed to Vercel in seconds without deploying any backend server:
- **Git Repository:** Import `Arjun4590/VerifyAI`
- **Framework Preset:** Vite
- **Root Directory:** `frontend`
- **Install Command:** `npm install`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **SPA Rewrites:** Pre-configured in `frontend/vercel.json` (`rewrites: [ { "source": "/(.*)", "destination": "/index.html" } ]`)

---

### Option B: Optional Full-Stack Development (Python FastAPI Backend)

If you wish to run the original Python FastAPI backend for development, running PyTest suites, or inspecting the SQLite database:

```powershell
# In project root:
cd "C:\Users\arjun\OneDrive\Desktop\COLLEGE\Hackathons\SIH 26 PS 261"

# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install backend dependencies
pip install fastapi uvicorn pydantic sqlalchemy openpyxl reportlab pymupdf pytest

# (Optional) Run pytest test suite
python -m pytest backend/tests -v

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```


---

## 5. Demonstration Roles & Access Control

VerifyAI implements Role-Based Access Control (RBAC) enforced both at the UI layer and at the backend API endpoints:

| Role | Demo User | Permissions & Capabilities | Restrictions |
| :--- | :--- | :--- | :--- |
| **Scrutiny Officer** | `Officer A (SO-4421)` | View assigned cases, run validation, inspect evidence drawer, view PDF documents, confirm/dismiss findings with written reasons, request institutional clarification, escalate cases to Senior Reviewer. | Cannot approve regulatory rules. Cannot record final case dispositions. |
| **Senior Reviewer** | `Director Sharma (SR-1002)` | View escalated applications, review/confirm/dismiss findings, review and approve/reject drafted rule versions, record formal case dispositions (`Satisfactory`, `Clarification required`, `Recommend EVC inspection`, `Refer for further consideration`). | Cannot modify system connector settings. |
| **System Admin** | `Admin User (ADM-001)` | View system health, toggle simulated connectors, trigger database re-seed/re-import, browse full catalogue, draft new regulatory rules, submit rules for review. | Cannot review finding evidence or record case dispositions (separation of regulatory duties). |

> **Role Switcher:** Use the dropdown in the top-right header to switch roles instantly during your demonstration. Header `X-Demo-Role` and `X-Demo-User` values are automatically sent with all API requests.

---

## 6. End-to-End Walkthrough Demonstration Script

Follow these steps for a complete hackathon presentation or demo video recording:

1. **Dashboard & KPIs:** Open `http://localhost:5173`. Point out that the metrics (Applications, Needing Attention, Pending Verification, Catalogue Records) are dynamically calculated from SQLite, not hardcoded.
2. **Open Application:** Click on `VA-DEMO-2026-014` in the Quick Launch panel or navigate to **Applications** in the sidebar.
3. **Review Workspace:**
   - Note the persistent banner: `DEMO ENVIRONMENT — NOT CONNECTED TO AICTE`.
   - Show the 5 tabs: *Summary*, *Application Data*, *Documents*, *Findings*, *Audit History*.
   - In the *Documents* tab, click **View Document** on the Fire Safety Certificate to view the generated PDF with its watermark and SHA-256 hash.
4. **Execute Validation:** Click the blue **Run Validation** button. Watch the processing status update and a new validation run ID get stamped with microsecond precision.
5. **Inspect Findings Drawer:**
   - Under the *Findings* tab, click on **Finding A (Expired Fire Safety Certificate)**.
   - The **Evidence Drawer** slides in from the right showing side-by-side values: Validity Date (`2026-03-31`) vs Fixed Evaluation Date (`2026-04-15`), source clause, and rule reference.
6. **Review Action (Scrutiny Officer):**
   - With role set to **Scrutiny Officer**, select the radio button **Confirm Deficiency**.
   - Type a mandatory audit comment: *"Confirmed fire NOC expired prior to evaluation cutoff date."*
   - Click **Save Review Decision**. Notice the finding status immediately updates to `Reviewed` with the officer's stamp.
7. **Escalate Application:**
   - Click the orange **Escalate to Senior Reviewer** button.
   - Enter reason: *"Multiple compliance anomalies detected including expired fire safety certificate and declaration inconsistency."*
   - Click **Submit Escalation**. The case workflow status updates to `Escalated`.
8. **Switch Role to Senior Reviewer:**
   - In the top header dropdown, switch the active role to **Senior Reviewer**.
   - Notice the green **Record Disposition** button appears in the action bar.
9. **Record Final Disposition:**
   - Click **Record Disposition**.
   - Select disposition: `Recommend EVC inspection` (or `Clarification required`).
   - Enter justification: *"On-site Expert Visit Committee inspection recommended to verify physical fire safety measures and student records."*
   - Click **Record Official Disposition**. The case workflow status updates to `In review`.
10. **Persistent Audit History:**
    - Switch to the **Audit History** tab.
    - Show the chronological event trail recording user stamps, timestamps, previous vs new states, and justification notes.
11. **Download Official Report:**
    - Click **Audit & Report** in the workspace header.
    - An official compliance evaluation report opens in a new tab, complete with application summary, rule outcomes, simulated verification disclaimers, and human reviewer notes.
12. **Explore the Handbook Catalogue:**
    - Navigate to **Application Categories** to see all 21 categories and point out the `unresolved_needs_review` alert on Category 21 (Online Learning / ODL).
    - Navigate to **Document Catalogue** (170 items), **Candidate Rules** (1,304 items), and **Catalogue Coverage** to show 100% extraction fidelity.
13. **Rules Governance:**
    - Navigate to **Rules Governance**.
    - Show that candidate rules are gated and only 5 vetted rules are `Approved` for automated execution.
    - As Senior Reviewer, demonstrate approving or rejecting a draft rule.

---

## 7. Testing & Verification

The test suite covers deterministic import fidelity, rule engine evaluation against fixed dates, and RBAC endpoint authorization:

```powershell
# Run backend pytest suite
cd "C:\Users\arjun\OneDrive\Desktop\COLLEGE\Hackathons\SIH 26 PS 261"
python -m pytest backend/tests -v
```

Expected output:
```
backend/tests/test_auth_rbac.py::test_scrutiny_officer_cannot_record_disposition PASSED
backend/tests/test_auth_rbac.py::test_senior_reviewer_can_record_disposition PASSED
backend/tests/test_auth_rbac.py::test_system_admin_cannot_review_findings PASSED
backend/tests/test_importer.py::test_importer_row_counts PASSED
backend/tests/test_importer.py::test_importer_idempotency PASSED
backend/tests/test_importer.py::test_category_21_unresolved_mapping PASSED
backend/tests/test_validation.py::test_run_validation_deterministic_findings PASSED
backend/tests/test_validation.py::test_rerun_validation_updates_state PASSED

============================== 8 passed in 12.87s ==============================
```

To verify the frontend production build:
```powershell
cd "C:\Users\arjun\OneDrive\Desktop\COLLEGE\Hackathons\SIH 26 PS 261\frontend"
npm run build
```

---

## 8. File Structure Summary

```
SIH 26 PS 261/
├── README.md                                   # Comprehensive documentation & setup
├── .env.example                                # Environment configuration template
├── handbook_extraction.xlsx                    # Primary AICTE APH extracted source workbook
├── VerifyAI_Antigravity_Demo_Build_...v2.md    # Master specification & acceptance criteria
│
├── backend/
│   ├── app/
│   │   ├── config.py                           # Constants, paths, fixed evaluation date
│   │   ├── database.py                         # SQLite engine & session management
│   │   ├── models.py                           # 17 SQLAlchemy relational entities
│   │   ├── schemas.py                          # Pydantic v2 schemas for all payloads
│   │   ├── auth.py                             # RBAC dependency & role verification
│   │   ├── pdf_processor.py                    # PyMuPDF extraction & ReportLab generation
│   │   ├── importer.py                         # Deterministic openpyxl workbook importer
│   │   ├── rules_engine.py                     # Versioned rules evaluation engine
│   │   ├── seed.py                             # Deterministic demo data & PDF generator
│   │   ├── main.py                             # FastAPI application & startup hooks
│   │   └── routers/
│   │       ├── system.py                       # Health, dashboard, seed, connectors
│   │       ├── applications.py                 # Cases, validate, escalate, disposition, report
│   │       ├── findings.py                     # Finding details & human review actions
│   │       ├── alerts.py                       # Alert center & acknowledgements
│   │       ├── catalogue.py                    # 4 handbook sheets & coverage API
│   │       └── rules.py                        # Rule governance lifecycle & testing
│   ├── data/
│   │   ├── verifyai.db                         # SQLite database with all tables & records
│   │   └── documents/                          # 6 synthetic watermarked PDF fixtures
│   └── tests/
│       ├── test_importer.py                    # Tests for all 5 sheets & Category 21
│       ├── test_validation.py                  # Tests for deterministic finding outcomes
│       └── test_auth_rbac.py                   # Tests for role restrictions & authorization
│
└── frontend/
    ├── src/
    │   ├── types.ts                            # TypeScript models & API interfaces
    │   ├── services/api.ts                     # Axios client with role headers & endpoints
    │   ├── components/
    │   │   ├── Header.tsx                      # Top bar with demo banner & role switcher
    │   │   ├── Sidebar.tsx                     # 15 navigation links with lock icons
    │   │   ├── StatusChip.tsx                  # Semantic badge with text + icon
    │   │   ├── EvidenceDrawer.tsx              # Slide-over side-by-side evidence viewer
    │   │   └── ActionModals.tsx                # Modals for review, escalate, disposition
    │   ├── pages/
    │   │   ├── Overview.tsx                    # Executive KPI dashboard & quick launcher
    │   │   ├── ApplicationsList.tsx            # Applications filterable directory
    │   │   ├── ApplicationWorkspace.tsx        # 5-tab core scrutiny review workspace
    │   │   ├── ReviewQueue.tsx                 # Active scrutiny queue
    │   │   ├── Verification.tsx                # Hash, metadata, and simulated issuer
    │   │   ├── InfrastructureReview.tsx        # Facility observation review
    │   │   ├── Alerts.tsx                      # System and compliance alerts
    │   │   ├── RulesGovernance.tsx             # Versioned rules lifecycle & approvals
    │   │   ├── CategoriesCatalogue.tsx         # 21 handbook categories with mappings
    │   │   ├── DocumentsCatalogue.tsx          # 170 Annexure-1 & 2 requirements
    │   │   ├── CandidateRulesCatalogue.tsx     # 1,304 mined candidate sentences
    │   │   ├── ExternalRefsCatalogue.tsx       # 534 statutory references & integrations
    │   │   ├── CatalogueCoverage.tsx           # Live database-derived coverage analytics
    │   │   ├── ReportsAudit.tsx                # Compliance report generator & audit log
    │   │   ├── UserManagement.tsx              # Demo user & role directory
    │   │   └── ConnectorSettings.tsx           # Demo connector configuration
    │   ├── App.tsx                             # Router and layout root
    │   └── main.tsx                            # React entry point
    ├── package.json
    └── vite.config.ts
```

---

## 9. Regulatory & Technical Disclaimers

1. **Simulation of External Authorities:** The simulated issuer connectors (State Fire Services, Land Revenue Department) simulate potential response payloads and latency for demonstration purposes. They do not represent endorsed integrations by any state or central agency.
2. **Machine Extraction Accuracy:** Real-world OCR accuracy varies by document quality and scan resolution. VerifyAI routes any low-confidence extraction (< 0.75) for manual scrutiny officer confirmation and does not penalize institutions for extraction uncertainty.
3. **Audit Immutability:** In this demonstration build, audit logs are persisted in SQLite. In a production environment, audit trails would be forwarded to an append-only, tamper-evident log store.
