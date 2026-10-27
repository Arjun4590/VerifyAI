# VerifyAI --- Complete Demo Build Specification

## SIH Problem Statement 26261: AI-Powered Application Validation, Document Authentication and Regulatory Compliance Verification

**Purpose:** This document is the single source of truth for an
Antigravity IDE coding agent to build a convincing, runnable VerifyAI
demonstration for a presentation and recorded demo video.

**Project status:** Proposed SIH prototype. This is not an official
AICTE system specification and must not imply live AICTE access.

------------------------------------------------------------------------

# 1. Product Summary

VerifyAI is an internal decision-support platform for authorized
regulatory scrutiny officers. It receives structured
institution-application data and supporting documents, checks them
against a small, reviewed set of regulatory rules, compares declarations
with documents, identifies possible discrepancies, and presents
evidence-linked findings for human review.

**Core product idea:** Verify declarations against rules, against other
declarations, and against supporting evidence --- then explain every
finding so an authorized official can review it.

VerifyAI does not replace the existing AICTE submission portal. It does
not automatically grant or reject approval, declare fraud, or replace
statutory scrutiny or inspections.

## Prototype integration boundary

-   Use realistic synthetic demo data and synthetic documents.
-   Provide a working import mechanism for the demo dataset.
-   Any external issuer response must be visibly labelled `SIMULATED`.
-   Do not connect to private AICTE systems or issuer APIs without
    explicit authorization.
-   Do not display fictional data as real AICTE statistics.
-   Do not include real institutional personal data in public demo
    assets.

# 2. What the Demo Must Prove

The recorded demo should show one coherent end-to-end story:

1.  A sample application is received into VerifyAI.
2.  The dashboard and application queue reflect the imported data.
3.  The officer opens an application and runs validation.
4.  VerifyAI evaluates a small category-specific checklist.
5.  It identifies a missing/expired document and a declaration-to-form
    inconsistency.
6.  It shows the exact source field or document/page supporting each
    finding.
7.  It displays a source verification result marked `SIMULATED`.
8.  A Scrutiny Officer reviews a finding, records a reason, and requests
    clarification or escalates the case.
9.  A Senior Reviewer sees the escalated case and records a workflow
    disposition.
10. The application report and audit history reflect the actions.

The most important screen is the **Application Review Workspace**. It
must be genuinely usable, not a static picture.

# 3. Users and Role-Based Access

Build one application with a shared shell and three role-based views. Do
not build three separate websites.

## 3.1 System Admin

Purpose: platform operations and rule governance, not routine
application scrutiny.

Can: - View system overview and processing/connector health. - Manage
users and assign roles. - Configure demo connector settings. -
Draft/edit regulatory rules. - Submit a rule for Senior Reviewer
approval.

By default cannot: - View application document contents. -
Confirm/dismiss application findings. - Record a case disposition.

## 3.2 Scrutiny Officer

Purpose: first-level application review.

Can: - View assigned demo cases. - View application data and
documents. - Run/re-run validation. - Inspect evidence-linked
findings. - Confirm or dismiss findings with a reason where material. -
Record manual verification. - Request clarification. - Resolve assigned
alerts. - Escalate cases to the Senior Reviewer.

## 3.3 Senior Reviewer

Purpose: handle escalations and rule governance.

Can: - View authorized cases and review history. - Review, confirm, or
dismiss findings. - Approve/reject drafted rule versions with
comments. - Record case disposition within the prototype workflow. -
Review audit history.

Possible internal workflow dispositions: - `Satisfactory` -
`Clarification required` - `Recommend EVC inspection` -
`Refer for further consideration`

These are demo workflow labels, not claims that these are official AICTE
status names. VerifyAI records a disposition; it does not issue an
official approval/rejection.

## 3.4 Enforce permissions

Enforce permissions in backend/API logic as well as in the UI. Hiding a
button is not sufficient. Demo login may use seeded role accounts, but
the role selector must be clearly labelled as a demo mechanism if there
is no real authentication. Never claim production-grade authentication
if only a demo role switcher exists.

# 4. Demo Scenario and Seed Data

Create a fully synthetic application with stable IDs so the video can
follow the same case every time.

## Main demo case

-   Application ID: `VA-DEMO-2026-014`
-   Institution: `Demo Institute of Applied Studies`
-   Academic year: `2026–27`
-   Application type: `Extension of Approval based on Self-Disclosure`
-   Case status initially: `Ready for review`
-   Assigned officer: `Officer A`
-   Rule set: `APH-DEMO-2026-27`, version `1.0`
-   Source mode: `DEMO DATA — NOT CONNECTED TO AICTE`

Create a second synthetic case so the list and dashboard do not look
empty, but focus the entire video on the main case.

## Main case documents

Create realistic-looking synthetic sample documents with clear
`DEMO DOCUMENT` markings: 1. Affidavit/undertaking sample. 2. Fire
Safety Certificate sample with a clearly expired validity date relative
to the fixed demo evaluation date. 3. Building occupancy/completion
certificate sample. 4. Payment receipt sample (where applicable). 5.
Location/map declaration sample. 6. Previous-year audited accounts
sample. 7. A document intentionally marked missing in the checklist.

These are demonstration fixtures, not legally usable documents. Add a
visible footer/watermark
`SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE`.

Use a fixed evaluation date in the seeded demo data so the expiry result
is deterministic. Display the evaluation date in the finding details. Do
not use the machine's current date to decide the seeded case outcome.

## Findings to demonstrate

Seed expected findings that the app can reproducibly generate:

### Finding A --- Expired fire certificate

-   Category: Document validity
-   Outcome: `Possible deficiency`
-   Processing: `OK`
-   Evidence: synthetic Fire Safety Certificate, page 1
-   Explanation: extracted validity date is earlier than the fixed demo
    evaluation date.
-   Action: `View evidence`, `Confirm`, `Dismiss`,
    `Request clarification`
-   Important: this does not by itself prove fraud.

### Finding B --- Declaration/form inconsistency

-   Category: Declaration consistency
-   Outcome: `Needs clarification`
-   Evidence: a synthetic affidavit/undertaking paragraph says a
    relevant student-data upload declaration is complete, while the
    corresponding structured demo field is `No`.
-   Show both exact values and their sources.
-   Explain that this is a potential contradiction requiring human
    review, not a misconduct verdict.

### Finding C --- Missing required document

-   Category: Checklist
-   Outcome: `Possible deficiency`
-   Evidence: applicable demo checklist + no corresponding document
    uploaded.
-   Do not claim every institution always requires every listed item;
    use the selected demo category and the demo rules' conditional
    applicability.

### Finding D --- Simulated issuer check

-   Verification status: `Mismatch detected` or `Verified` as selected
    by the deterministic fixture.
-   A highly visible `SIMULATED` label must appear beside the result.
-   Source: `Demo Issuer Connector (SIMULATED)`
-   Never imply a live government or issuer API was called.

### Finding E --- Low-confidence extraction (optional)

-   Processing status: `Low confidence`
-   Next action: manual review.
-   Do not convert low OCR confidence into a compliance failure.

## Dashboard numbers

Derive dashboard cards from the seeded records. If fixed numbers are
used in seed data, they must match the displayed list and findings. Do
not show unsupported performance claims such as "99% accuracy" or "70%
faster." If a metric is illustrative, label it as demo data and explain
how it was computed.

# 5. Status Model

Keep four dimensions distinct.

## Case workflow status

-   `New`
-   `Processing`
-   `Ready for review`
-   `In review`
-   `Clarification requested`
-   `Escalated`
-   `Completed`

## Compliance outcome

-   `Met`
-   `Possible deficiency`
-   `Needs clarification`
-   `Not applicable`
-   `Not evaluated`

## Verification status

-   `Verified`
-   `Mismatch detected`
-   `Expired` only as a displayable document finding if desired;
    internally expiry is preferably a compliance finding
-   `Verification pending`
-   `Source unavailable`
-   `Manual review required`
-   `Not required`
-   `SIMULATED` is a source/mode label, not a replacement for the
    verification result

## Processing status

-   `OK`
-   `Low confidence`
-   `Failed`
-   `Pending`

Rules: - Source unavailable is not a mismatch. - OCR failure is not
non-compliance. - Hash match means identical file content, not authentic
content. - A valid digital signature does not prove every statement in a
document is true. - Metadata anomalies are indicators, not proof of
forgery. - Do not show a single simplistic `Authentic: Yes/No` verdict.

# 6. Functional Screens

Implement the following pages with a consistent, professional UI. The
primary demo path is Overview → Applications → Application Review
Workspace → Review action → Escalation/Review → Report/Audit.

## 6.1 Shared application shell

-   Left sidebar, persistent.
-   Top bar with VerifyAI wordmark, environment label
    `DEMO ENVIRONMENT`, search, alerts indicator, current user, current
    role.
-   Page title, breadcrumb, concise supporting text.
-   Responsive enough to work at 1366×768 and 1920×1080.
-   Accessible contrast, keyboard focus states, readable type.
-   Status chips must include text, not color alone.
-   Provide useful empty/error/loading states.

Navigation: - Overview - Applications - Review Queue - Verification -
Infrastructure Review - Alerts - Rules Governance - Reports & Audit -
User Management (System Admin only) - Connector Settings (System Admin
only)

Hide or disable features that are not implemented, rather than
presenting dead links.

## 6.2 Overview Dashboard

Show: - Applications under review - Needs attention - Verification
pending - Escalated - Workload by case status - Recent alerts - My
assigned applications

All values must be derived from seed data/state. Avoid invented
real-world statistics.

## 6.3 Applications List

Search/filter by: - Application ID or institution - Academic year -
Category - Workflow status - Compliance outcome - Verification status -
Assigned officer

Columns: - Application ID - Institution - Academic year -
Request/category - Documents processed - Findings needing review -
Verification status - Assigned officer - Last updated - Open action

Row click opens the main review workspace.

## 6.4 Application Review Workspace --- critical screen

Header: - `VA-DEMO-2026-014` - `Demo Institute of Applied Studies` -
`2026–27` - `DEMO DATA — NOT CONNECTED TO AICTE` - `Run validation`
button - `Escalate` button (authorized roles only)

Summary strip: - Case workflow status - Compliance outcome summary -
Verification status summary - Processing status - Rule set/version -
Evaluation date

Tabs: 1. Summary 2. Application Data 3. Documents 4. Findings 5. Audit
History

Summary panel: - Institution profile and application metadata. - Request
line/category. - Checklist progress. - Document count. - Findings
needing review. - Last validation run.

Findings list: - Finding ID and title. - Severity/priority only if
defined by demo rules. - Outcome and processing status. - Plain-language
reason. - Expected versus observed values. - Exact source
field/document/page. - `View evidence` action. - `Confirm`, `Dismiss`,
`Request clarification`, or `Escalate` actions according to role and
finding state.

Evidence drawer/panel: - Synthetic document preview or clear document
text excerpt. - Page number. - Extracted value and confidence if
actually produced by the pipeline. - Corresponding structured
application field. - Rule ID/version and source clause label. - Expected
vs observed values. - Why the finding was raised. - Reviewer note
field. - Previous review actions.

Do not fabricate page citations to actual AICTE rules. For prototype
rules, cite the demo rule ID and a reviewed source reference if the team
has verified one; otherwise label it
`Demo rule — source mapping pending`.

## 6.5 Documents

List uploaded demo documents with: - Name/type - Upload/source - Page
count - Extraction status - Hash/duplicate status - Signature status
(`Not checked` unless actually checked) - Associated checklist item -
Open preview

Implement basic PDF text extraction if feasible. For deterministic demo
results, seed extracted field values and their source page references
explicitly; label them as fixture-derived where the pipeline is not
actually performing OCR. Do not pretend a hardcoded extraction was
performed by OCR. If OCR is implemented, show its actual
output/confidence and allow manual correction.

## 6.6 Verification & Integrity

Show separate panels for: - File hash / exact duplicate status - Digital
signature status (only if real signature validation is implemented) -
PDF metadata indicators - External issuer check result - Source, attempt
time, matched fields - Manual review status

The demo issuer response must have a visible `SIMULATED` label in the
table, detail view, report, and any video shot where it appears.

## 6.7 Alerts and Review Queue

Alert types: - Missing required information/document - Expired
document - Pending verification - Low-confidence extraction - Unresolved
discrepancy - Escalation awaiting Senior Reviewer

Each alert shows: - Alert ID/type - Application ID - Reason - Priority -
Created time (use seeded/demo timestamps) - Assigned role/owner -
Status - Link to the finding/evidence

Actions should update state and be visible elsewhere.

## 6.8 Rules Governance

System Admin: - Browse rules. - Create/edit a draft. - Set category,
conditions, check type, source reference, parameters, effective dates. -
Test draft against demo fixtures. - Submit for review.

Senior Reviewer: - View draft versus published version. - Approve or
reject with a comment. - Publish approved version. - Show immutable
version history.

For the MVP, a small set of 4--8 clearly marked demo rules is enough.
Never activate unreviewed rules automatically.

## 6.9 Reports & Audit

Generate a downloadable report (HTML or PDF if feasible) containing: -
Application metadata - `DEMO DATA — NOT CONNECTED TO AICTE` - Validation
run ID and date - Rule set/version - Rule outcomes - Evidence
references - Verification status and source/mode - Reviewer actions and
comments - Outstanding actions - Decision-support disclaimer

Audit history records: - User/role - Timestamp -
Application/finding/rule - Action - Previous and new status -
Reason/comment - Validation run/rule version - Access-denied events if
implemented

Persist review actions and audit events in the demo backend/database,
not only transient UI state.

## 6.10 Infrastructure Review

Build only a lightweight evidence-review page if time permits: -
Facility type - Uploaded evidence preview - Declared value - Relevant
demo rule - Reviewer notes - Outcome: `Observation — needs review`

Do not build or claim a trained vision model unless one exists and is
evaluated. The prototype may show a seeded illustrative observation,
clearly labelled as demo/illustrative.

# 7. Regulatory Rule Scope

Do not implement every handbook clause in the first demo. Start with one
carefully scoped existing-institution category, such as Extension of
Approval based on Self-Disclosure, after verifying terminology and
applicability against the relevant handbook version.

The handbook extraction spreadsheet is only a candidate extraction, not
an approved machine-readable rulebook. Every rule included in the demo
should be reviewed against the actual source before being described as a
regulatory requirement.

Possible demo rule types: - Required document presence under the
selected category. - Certificate validity/expiry with a fixed evaluation
date. - Institution name/identifier consistency. - Declaration-to-form
consistency. - Conditional requirement based on a declared condition. -
Processing confidence/manual review. - Simulated issuer comparison.

For any uncertain requirement, use `Demo rule — source mapping pending`
and do not present it as official.

# 8. Recommended Technology

Use the simplest maintainable implementation already compatible with the
existing workspace. If starting from scratch:

## Frontend

-   React + TypeScript
-   Vite
-   Tailwind CSS
-   shadcn/ui or a consistent equivalent component library
-   Lucide icons
-   Recharts only for a small useful chart

## Backend

-   Python + FastAPI
-   Pydantic validation
-   SQLAlchemy/SQLModel or a straightforward persistence layer
-   SQLite for local demo if it speeds up development; PostgreSQL is
    appropriate if already configured
-   PyMuPDF for PDF text extraction
-   Tesseract/PaddleOCR only if installed and tested
-   SHA-256 for file hashes

## Persistence and files

-   Persist applications, rules, findings, validation runs, review
    actions, alerts, and audit events.
-   Store uploaded files in a local protected demo directory or suitable
    object storage.
-   Do not expose arbitrary filesystem paths or uploaded files via
    public URLs.
-   Validate file type and size. Do not trust the filename extension
    alone.

## Engineering preferences

-   Modular monolith, not microservices.
-   No vector database, agent framework, or custom forgery model
    required.
-   Do not add dependencies without a clear need.
-   Keep frontend/backend types and API responses consistent.
-   Include `.env.example`; never commit secrets.
-   Include a README with setup, run, demo accounts, seed-data
    instructions, and limitations.

# 9. Suggested Data Model

Minimum entities/tables: - `users` - `roles` or role field with
controlled values - `applications` - `request_lines` -
`application_fields` - `documents` - `document_extractions` - `rules` -
`rule_versions` - `validation_runs` - `findings` -
`verification_attempts` - `alerts` - `review_actions` - `audit_events`

Each finding should store: - ID, application ID, request-line ID - Rule
ID/version - Compliance outcome - Verification status where relevant -
Processing status - Expected and observed values - Explanation -
Evidence reference (field/document/page) - Confidence only where
actually measured - Review status - Reviewer/comments - Created/updated
timestamps

# 10. API Outline

Illustrative demo routes; these are not existing AICTE endpoints.

-   `GET /api/health`
-   `GET /api/dashboard`
-   `GET /api/applications`
-   `GET /api/applications/{id}`
-   `POST /api/demo/seed` or `POST /api/demo/import`
-   `GET /api/applications/{id}/documents`
-   `POST /api/applications/{id}/validate`
-   `GET /api/applications/{id}/findings`
-   `POST /api/findings/{id}/review`
-   `POST /api/applications/{id}/clarification-request`
-   `POST /api/applications/{id}/escalate`
-   `POST /api/applications/{id}/disposition`
-   `GET /api/alerts`
-   `POST /api/alerts/{id}/acknowledge`
-   `GET /api/rules`
-   `POST /api/rules/drafts`
-   `POST /api/rules/{id}/submit-review`
-   `POST /api/rules/{id}/approve`
-   `GET /api/applications/{id}/report`
-   `GET /api/applications/{id}/audit`

Keep API errors clear and structured. Enforce role and record-level
permissions in the backend.

# 11. Visual Design Direction

Design a professional internal government/regulatory operations
dashboard, not a consumer AI landing page.

-   Light neutral background and white surfaces.
-   Deep navy/slate text and restrained blue primary accent.
-   Amber for attention; red for potential issues; green for positive
    outcomes.
-   Text labels and icons accompany all status colours.
-   Subtle borders, moderate 8--12 px corner radius, consistent spacing.
-   Compact readable tables and clear evidence panels.
-   Minimal animation, no gratuitous gradients, no giant decorative
    cards.
-   Use realistic synthetic data, not placeholder lorem ipsum.
-   Keep the demo environment banner visible throughout the app.
-   Design for a desktop recording at 16:9; avoid content clipped at
    1366×768.
-   Do not show fake AI accuracy, savings, or throughput metrics.

# 12. Video Demonstration Script (Target: 3--4 Minutes)

The app should support this exact deterministic walkthrough.

## Shot 1 --- Problem and platform (0:00--0:20)

Show the VerifyAI overview and `DEMO ENVIRONMENT` label. Narration:
VerifyAI assists authorized officials by checking structured
declarations, supporting documents, and reviewed rules. It complements
the existing portal.

## Shot 2 --- Work queue (0:20--0:40)

Open Applications. Search/select `VA-DEMO-2026-014`. Show category,
academic year, document count, and status.

## Shot 3 --- Run validation (0:40--1:10)

Open the review workspace and click `Run validation`. Show the run
ID/time, rule set/version, and findings count changing from the previous
state. The operation must actually update application state; no fake
loading animation without real work.

## Shot 4 --- Expired certificate (1:10--1:40)

Open Finding A. Show the synthetic Fire Safety Certificate preview, page
1, extracted validity date, fixed evaluation date, expected/observed
values, and `Possible deficiency`. Explain this is a flag for review,
not a fraud verdict.

## Shot 5 --- Declaration inconsistency (1:40--2:10)

Open Finding B. Show the affidavit excerpt and structured form field
side by side. Show both source references and `Needs clarification`.

## Shot 6 --- Verification (2:10--2:30)

Open Verification. Show the connector result and a prominent
`SIMULATED — NO LIVE ISSUER API` label.

## Shot 7 --- Human review (2:30--2:55)

Log in/switch to the demo Scrutiny Officer role if applicable. Confirm
or dismiss one finding with a written reason, or request clarification.
Show the finding and audit timeline updating.

## Shot 8 --- Escalation and governance (2:55--3:20)

Escalate the case and switch to Senior Reviewer. Open the escalated
case, inspect evidence, record a disposition with a comment. If time is
limited, show the rule governance approval as a separate brief shot.

## Shot 9 --- Report and audit (3:20--3:50)

Generate/open the report and audit history. Show the validation version,
evidence references, review action, and disclaimer. End on the
principle: AI prepares evidence-linked findings; authorized officials
remain responsible for decisions.

Keep the narration factual. Do not claim live integration, production
security certification, regulatory approval, or measured accuracy unless
those have actually been demonstrated.

# 13. Acceptance Criteria

The agent's work is not complete until the following are verified:

## Functionality

-   App starts using documented commands.
-   Seed data loads deterministically.
-   Dashboard numbers match the seeded records.
-   Application list filters/search work.
-   Main case opens reliably.
-   Run validation creates or updates findings based on the demo rules.
-   Evidence links open the relevant page/excerpt.
-   Review action persists and changes the finding state.
-   Clarification/escalation/disposition workflows update the case.
-   Alerts link to the correct finding.
-   Audit history records actions.
-   Report can be opened/downloaded.
-   Demo role views are coherent; backend authorization is implemented
    or clearly labelled as demo-only if not secure.

## Truthfulness

-   All demo data is synthetic and visibly labelled.
-   Every mock source result is labelled `SIMULATED`.
-   No hardcoded OCR result is falsely presented as live OCR output.
-   No unverified AICTE rule is represented as an authoritative
    regulation.
-   No fake accuracy/performance claims.
-   No final automatic approval/rejection.
-   No fake "authenticity score" unless a real, defined, evaluated
    method exists.

## Usability

-   No dead navigation links.
-   No uncaught runtime errors.
-   No empty buttons or nonfunctional controls on the demo path.
-   Responsive desktop layout at 1366×768 and 1920×1080.
-   Clear loading, error, and empty states.
-   No document or table content clipped in the planned recording.
-   README has exact install/run steps and demo credentials/role-switch
    instructions.

# 14. Mandatory Handbook Workbook Integration

This section overrides any earlier wording that could be read as permitting a demo with only a few hardcoded catalogue entries. The full extracted catalogue must be represented in the product; only execution of checks may be limited.

## Import behavior and source integrity

- Locate `handbook_extraction.xlsx` in the current workspace. If it is not there, report that clearly and request it or implement a workbook upload/import path.
- Build a deterministic importer for all five sheets: `Summary`, `Categories`, `Documents`, `External refs`, and `Rule candidates`.
- Preserve original column values and raw source text. Add normalized fields only alongside the original values; never overwrite the extracted source.
- Record source workbook filename, sheet name, source row number, source IDs, handbook page, and clause/section wherever supplied.
- Report import totals and any skipped/invalid rows. Never silently skip malformed rows.
- Keep workbook-derived records separate from hand-authored demo fixtures and from rules approved for execution.

## Required product screens

Add these catalogue/governance screens to the navigation and make them functional:

1. **Application Categories** — all 21 source categories, exact labels and routing indicators, search/filter, relevant Annexure-2 sections, notes and unresolved mapping flags.
2. **Document & Requirement Catalogue** — all Annexure-1/Annexure-2 extracted rows, section/page, kind, condition, document type, possible verifier and references. Separate requirement rows from intro/condition and note rows.
3. **Candidate Rules Library** — all 1,304 candidates, searchable by ID, text, page, modality, conditional flag and type guess. Display lifecycle state and source provenance.
4. **External Reference Register** — all 535 extracted reference rows, searchable by keyword/type/page. Show integration status independently from the fact that a reference appears in the handbook.
5. **Rule Review & Version History** — candidate → source review → draft → Senior Reviewer approval → published version. Only approved/published rules can run.
6. **Catalogue Coverage** — counts by category, annexure, row kind, candidate rule state, and unresolved source mapping, calculated from imported data.

## Category routing and conditional applicability

- Use `Categories.annexure2_sections` to create initial links from category to Annexure-2 sections, preserving multiple sections and annotations such as “by reference”.
- Treat those links as extracted candidates requiring validation against the handbook. Do not infer that every row in a section is always mandatory for every case.
- Keep conditions from the `Documents.conditional` field and source text. Where a condition cannot be machine-evaluated, show `Manual applicability review required`.
- Support categories with zero/uncertain section mapping without inventing a checklist. Display a warning and allow authorized source mapping.
- Preserve `scrutiny`, `evc`, and `sac_shc` indicators as extracted values. Do not reinterpret abbreviations or routing values without source verification.

## Rules engine gate

A workbook row is not executable just because it contains words such as “shall”, “must”, “required”, or a numeric value. Before execution, an authorized reviewer must confirm:
- exact source text and page/clause;
- category and conditions;
- required input fields/documents;
- deterministic check logic and expected behavior;
- test cases, including unknown/missing input;
- effective date/version and approving reviewer.

The UI should make a visible distinction between `Candidate`, `Needs source review`, `Reviewed`, `Draft`, `Approved/Published`, `Rejected/Not applicable`, and `Retired`. A validation run must record the approved rule version used. If there are no approved rules for a category, show that clearly rather than generating a false “compliant” result.

## Updated definition of done for workbook integration

- All 21 category rows are present and searchable.
- All workbook `Documents` rows are preserved and browseable, including intro/condition and note rows.
- All 1,304 candidate rule records are preserved and searchable.
- All 535 external-reference records are preserved and searchable.
- The importer reports row totals and any errors; automated tests verify no silent row loss.
- The app differentiates extracted candidate content from verified rules.
- The main demo still runs end-to-end on a deterministic synthetic application and a small approved demo rule subset.
- A reviewer can trace a displayed checklist/rule back to its workbook row and handbook page/section where supplied.

---

# 15. Instructions to the Antigravity IDE Agent

You are the lead engineer implementing this demo in the currently open workspace.

1. Inspect the existing repository before making changes. Identify the current framework, entry points, dependencies, existing components, run commands, and whether `handbook_extraction.xlsx` is available.
2. Read and import the workbook before designing the final data model. Preserve all five sheets and all rows. If the workbook is absent, stop short of inventing a replacement catalogue; explain the missing input and support a workbook import path.
3. Build the full source catalogue first: 21 categories, all Annexure-1/Annexure-2 extracted rows, 1,304 candidate rule sentences, and 535 external reference rows. Treat these as extracted candidates, not automatically approved rules.
4. Implement catalogue search, filters, source provenance, review states, category-to-section mapping, and coverage counts. Keep raw extracted text and row IDs.
5. Implement the main demo vertical slice incrementally: seed synthetic application → category checklist → run approved demo rules → evidence-linked findings → officer review → escalation → Senior Reviewer disposition → report/audit.
6. Keep catalogue scope broad and executable-rule scope narrow. Only rules reviewed against the actual handbook may be activated. Never silently convert all candidate sentences to executable code.
7. Reuse existing working code and conventions where reasonable. Do not replace the project wholesale without first understanding it.
8. Create realistic synthetic fixtures with stable IDs and deterministic outcomes.
9. Build functional screens, not static mockups. Every visible primary action must work or be clearly disabled with a reason.
10. If actual OCR is not available, use explicitly labelled fixture-derived extraction. Never claim OCR was run when it was not.
11. Implement demo issuer responses locally and label every occurrence `SIMULATED`.
12. Implement backend role/record permissions. If using a demo role switcher, label it as a demonstration mechanism.
13. Include `.env.example`, seed/import instructions, and a concise README.
14. Do not install heavy or unnecessary libraries without a clear reason. Do not add custom ML forgery detection.
15. Do not fabricate performance metrics, live integrations, real institutions, or official AICTE outcomes.
16. At completion, report:
    - Workbook sheets imported, row totals, and skipped/invalid rows.
    - Catalogue screens and filters implemented.
    - Number of rules approved for execution and how they were source-checked.
    - What was implemented.
    - Files changed/created.
    - Commands to run.
    - Demo account/role instructions.
    - Test/build results.
    - Known limitations and unimplemented controls.

**Priority order:** workbook fidelity and traceability → functional end-to-end workflow → evidence-linked review/audit → role views → visual polish → optional features.

---

# 16. Master Prompt to Paste into Antigravity

Read this specification completely and use it as the primary implementation brief. First inspect the existing repository and locate `handbook_extraction.xlsx`. Do not start by hardcoding a handful of categories or rules.

**Workbook fidelity is mandatory.** Import all five sheets in `handbook_extraction.xlsx`: `Summary`, `Categories`, `Documents`, `External refs`, and `Rule candidates`. Preserve the 21 category rows, all extracted document/requirement rows, all 1,304 candidate rule sentences, and all 535 external-reference rows. Preserve the original IDs, raw text, page/section metadata, conditional flags, document types, possible verifiers, references, and source row provenance. Report import totals and any errors. If the workbook is missing from the workspace, tell me and implement a workbook upload/import path rather than inventing replacement data.

Build working catalogue screens for:
- All 21 application categories, with exact source labels and scrutiny/EVC/SAC-SHC indicators.
- Annexure-1/Annexure-2 document and requirement rows, clearly distinguishing actual document/requirement rows from intro/condition and note rows.
- All candidate rule sentences, searchable and filterable by ID, text, page, modality, numeric/conditional flags, and type guess.
- External references, searchable by keyword/type/page with integration availability tracked separately.
- Rule governance with candidate/review/draft/approval/published states, reviewer comments, source traceability, and version history.
- Catalogue coverage counts and unresolved mapping warnings.

Do not execute all extracted candidate sentences as rules. Candidate language is not proof that a row is an executable compliance rule. Only a small set of rules that have been checked against the actual handbook may be approved and run in the demo. Keep broad catalogue coverage separate from narrow automated-check coverage. Use category-to-Annexure-2 mappings from the workbook as initial extracted links, but preserve “by reference” relationships and mark uncertain mappings for human review. Do not assume all Annexure-1 items apply to every category. Preserve the workbook's note that the Online Learning / ODL category has no Annexure-2 section found and needs review; do not invent a mapping.

Then build VerifyAI as a complete, runnable, professional SIH demo. The main journey must work end to end: open dashboard, select the seeded synthetic application, see the category-specific checklist, run the approved demo rules, inspect an expired-certificate finding, inspect a declaration/form contradiction, see a visibly simulated issuer response, take a Scrutiny Officer action, escalate to Senior Reviewer, record a disposition, and open the final report/audit history.

Use React + TypeScript + Tailwind and FastAPI/Python if the repository is empty or compatible; otherwise adapt to the existing stack. Use local persistence suitable for the existing environment. Build functional pages and stateful interactions, not a static mockup. Make dashboard numbers data-derived. Use deterministic fixtures and a fixed evaluation date for the expiry example.

Keep three roles: System Admin, Scrutiny Officer, Senior Reviewer. Enforce role permissions in backend endpoints, and label any demo-only role switcher honestly. Include versioned validation runs, evidence-linked findings, in-app alerts, review actions with reasons, escalation/disposition, audit history, and a downloadable/openable report. Add PDF text extraction if feasible; if OCR is not implemented, explicitly identify fixture-derived extraction and do not misrepresent it.

The UI must be a restrained, polished regulatory operations dashboard with navy/slate typography, light neutral surfaces, clear status text, evidence panels, readable tables, responsive desktop layout, and a persistent `DEMO ENVIRONMENT — NOT CONNECTED TO AICTE` banner. All issuer mock responses must say `SIMULATED — NO LIVE ISSUER API`. Use synthetic names and documents marked `SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE`.

Do not build a replacement AICTE applicant portal. Do not claim live AICTE/issuer integration, official rule coverage, production-grade authentication, fraud detection, or performance gains unless genuinely implemented and verified. Do not add a custom forgery model, vector database, agent framework, or microservices. Any uncertain rule must remain non-executable and be labelled `Demo rule — source mapping pending`.

After each major step, run the app/tests and fix errors. Ensure seed data is repeatable, no key screen is empty, no important button is dead, and the documented run instructions work. Finish with exact run commands, test/build results, workbook import totals, implemented feature summary, executable-rule count, and limitations. The first goal is a faithful, source-traceable catalogue plus one working, truthful end-to-end demo—not a large collection of disconnected screens.
