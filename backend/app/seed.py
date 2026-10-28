import datetime
import json
from pathlib import Path
from sqlalchemy.orm import Session
from .config import DOCUMENTS_DIR, DEMO_EVALUATION_DATE, SIMULATED_CONNECTOR_NAME, SIMULATED_ISSUER_BANNER
from .models import (
    User,
    Application,
    ApplicationField,
    Document,
    DocumentExtraction,
    Rule,
    RuleVersion,
    VerificationAttempt,
    Alert,
    AuditEvent,
    ManualVerificationTask,
    ComplianceChecklistItem
)
from .pdf_processor import generate_watermarked_pdf, extract_pdf_info
from .rules_engine import evaluate_application

def seed_demo_data(db: Session) -> dict:
    """
    Seeds deterministic synthetic applications, documents, users, and reviewed rules.
    Safe to re-run (idempotent).
    """
    DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Seed Users
    db.query(User).delete()
    users = [
        User(id=1, username="admin", name="Administrator", role="system_admin", email="admin@verifyai.demo", active=True),
        User(id=2, username="officer_a", name="Officer A", role="scrutiny_officer", email="officer.a@verifyai.demo", active=True),
        User(id=3, username="reviewer_sr", name="Senior Reviewer", role="senior_reviewer", email="senior.reviewer@verifyai.demo", active=True),
    ]
    for u in users:
        db.add(u)

    # 2. Seed Regulatory Rules (Approved Demo Rules + Drafts)
    db.query(RuleVersion).delete()
    db.query(Rule).delete()

    rules = [
        Rule(
            id="RULE-APH-001",
            code="DOC-FIRE-EXPIRY",
            title="Fire Safety Certificate Expiry Verification",
            description="Evaluates whether the institution possesses a valid Fire Safety Certificate whose validity date extends beyond the evaluation date.",
            category_id=1,
            check_type="document_validity",
            source_reference="APH 2026-27 Annexure 2 §2.1 Item 4",
            source_clause="Clause 2.4.1 / Annexure 2 §2.1",
            handbook_page=96,
            parameters_json=json.dumps({"document_type": "Fire Safety Certificate", "field": "valid_until_date"}),
            status="approved",
            created_by="System Admin",
            approved_by="Senior Reviewer",
            current_version="1.0",
            effective_date="2026-04-15",
            test_cases_json=json.dumps([{"input": "2025-12-31", "expected": "Possible deficiency"}])
        ),
        Rule(
            id="RULE-APH-002",
            code="DECL-FORM-STUDENT-DATA",
            title="Student Data Portal Upload Declaration Consistency",
            description="Compares sworn affidavit declaration regarding student data upload against structured application field 'student_data_upload_complete'.",
            category_id=1,
            check_type="declaration_consistency",
            source_reference="APH 2026-27 Annexure 2 §2.1 Item 1 (Affidavit)",
            source_clause="Table 4.2 Declarations / Annexure 2 §2.1",
            handbook_page=96,
            parameters_json=json.dumps({"form_field": "student_data_upload_complete", "affidavit_para": "Para 4"}),
            status="approved",
            created_by="System Admin",
            approved_by="Senior Reviewer",
            current_version="1.0",
            effective_date="2026-04-15",
            test_cases_json=json.dumps([{"form": "No", "affidavit": "Uploaded complete", "expected": "Needs clarification"}])
        ),
        Rule(
            id="RULE-APH-003",
            code="CHECKLIST-MISSING-DOC",
            title="Mandatory Category Checklist Verification",
            description="Verifies presence of all mandatory documents required under Annexure 2 §2.1 for Extension of Approval based on Self-Disclosure.",
            category_id=1,
            check_type="checklist",
            source_reference="APH 2026-27 Table 2.3 Row 1 & Annexure 2 §2.1",
            source_clause="Table 2.3 & §2.1 Items 1-7",
            handbook_page=96,
            parameters_json=json.dumps({"required_docs": ["Affidavit", "Fire Safety Certificate", "Building Occupancy Certificate", "Audited Accounts", "Barrier-Free Built Environment Certificate"]}),
            status="approved",
            created_by="System Admin",
            approved_by="Senior Reviewer",
            current_version="1.0",
            effective_date="2026-04-15",
            test_cases_json=json.dumps([{"missing": "Barrier-Free Certificate", "expected": "Possible deficiency"}])
        ),
        Rule(
            id="RULE-APH-004",
            code="ISSUER-VERIFY-CHECK",
            title="Cross-Verification with Issuing Authority Registry (Simulated)",
            description="Simulates automated verification against State Fire Services registry for certificate status.",
            category_id=1,
            check_type="simulated_issuer",
            source_reference="Decision Support Service Connector §4",
            source_clause="Simulated Connector Specification v1",
            handbook_page=96,
            parameters_json=json.dumps({"connector": "State Fire Services Registry", "mode": "SIMULATED"}),
            status="approved",
            created_by="System Admin",
            approved_by="Senior Reviewer",
            current_version="1.0",
            effective_date="2026-04-15",
            test_cases_json=json.dumps([{"registry_status": "Revoked", "expected": "Needs clarification"}])
        ),
        Rule(
            id="RULE-APH-005",
            code="OCR-CONFIDENCE-LOW",
            title="Document Extraction Confidence & Quality Gate",
            description="Screens extracted values for low OCR confidence (<0.70). Routes low confidence extractions for manual officer inspection without rejecting application.",
            category_id=1,
            check_type="extraction_review",
            source_reference="VerifyAI AI Quality Assurance Standard",
            source_clause="Pipeline QA Gate §3.2",
            handbook_page=93,
            parameters_json=json.dumps({"confidence_threshold": 0.70}),
            status="approved",
            created_by="System Admin",
            approved_by="Senior Reviewer",
            current_version="1.0",
            effective_date="2026-04-15",
            test_cases_json=json.dumps([{"confidence": 0.65, "expected": "Needs clarification"}])
        ),
        # Draft rules for Governance testing
        Rule(
            id="RULE-APH-006",
            code="INFRA-CLASSROOM-AREA",
            title="Minimum Classroom Area Carpet Check (Draft)",
            description="Verifies that declared instructional area meets 66 sqm per classroom per APH norms.",
            category_id=1,
            check_type="infrastructure_observation",
            source_reference="APH 2026-27 Norms for Land and Built-Up Area §4",
            source_clause="Section 4.1.2",
            handbook_page=110,
            parameters_json=json.dumps({"min_sqm_per_class": 66}),
            status="draft",
            created_by="System Admin",
            approved_by=None,
            current_version="0.1",
            effective_date="2026-07-01",
            test_cases_json=None
        ),
        Rule(
            id="RULE-APH-007",
            code="FACULTY-CADRE-RATIO",
            title="Faculty Cadre Ratio Verification (Submitted for Approval)",
            description="Verifies Professor to Associate Professor to Assistant Professor ratio (1:2:6).",
            category_id=1,
            check_type="declaration_consistency",
            source_reference="APH 2026-27 Faculty Cadre Norms §7",
            source_clause="Section 7.3",
            handbook_page=124,
            parameters_json=json.dumps({"ratio": "1:2:6"}),
            status="submitted_for_approval",
            created_by="System Admin",
            approved_by=None,
            current_version="0.9",
            effective_date="2026-07-01",
            test_cases_json=None
        )
    ]
    for r in rules:
        db.add(r)
        db.add(RuleVersion(
            rule_id=r.id,
            version=r.current_version,
            definition_json=json.dumps({
                "code": r.code,
                "title": r.title,
                "check_type": r.check_type,
                "source_reference": r.source_reference,
                "parameters": r.parameters_json
            }),
            changelog="Initial demo rule baseline",
            status=r.status,
            submitted_by=r.created_by,
            approved_by=r.approved_by,
            approved_at=datetime.datetime.utcnow() if r.status == "approved" else None
        ))

    # 3. Clean and Seed Applications
    db.query(Alert).delete()
    db.query(AuditEvent).delete()
    db.query(VerificationAttempt).delete()
    db.query(DocumentExtraction).delete()
    db.query(Document).delete()
    db.query(ApplicationField).delete()
    db.query(Application).delete()

    # Application 1: Main Demo Case
    app1 = Application(
        id="VA-DEMO-2026-014",
        institution_name="Demo Institute of Applied Studies",
        academic_year="2026–27",
        nature_of_application="Extension of Approval based on Self-Disclosure",
        category_id=1,
        workflow_status="Ready for review",
        compliance_outcome="Possible deficiency",
        verification_status="Mismatch detected",
        processing_status="OK",
        assigned_officer="Officer A",
        rule_set="APH-DEMO-2026-27",
        rule_set_version="1.0",
        evaluation_date=DEMO_EVALUATION_DATE,
        source_mode="DEMO DATA — NOT CONNECTED TO AICTE",
        notes="Synthetic institution demonstration profile configured for SIH 2026 presentation."
    )
    db.add(app1)

    # Application 2: Secondary Queue Case
    app2 = Application(
        id="VA-DEMO-2026-015",
        institution_name="Apex Technical Campus",
        academic_year="2026–27",
        nature_of_application="New Technical Institution",
        category_id=4,
        workflow_status="In review",
        compliance_outcome="Met",
        verification_status="Verified",
        processing_status="OK",
        assigned_officer="Officer B",
        rule_set="APH-DEMO-2026-27",
        rule_set_version="1.0",
        evaluation_date=DEMO_EVALUATION_DATE,
        source_mode="DEMO DATA — NOT CONNECTED TO AICTE",
        notes="Secondary seeded case to populate queue."
    )
    db.add(app2)

    # 4. Seed Structured Form Fields for VA-DEMO-2026-014
    fields_app1 = [
        ("institution_name", "Institution Full Name", "Demo Institute of Applied Studies", "general", "Part 1 Institutional Identity"),
        ("academic_year", "Academic Year Applied", "2026–27", "general", "Part 1 Application Details"),
        ("application_category", "Nature of Application", "Extension of Approval based on Self-Disclosure", "general", "Part 1 Category"),
        ("student_data_upload_complete", "Student Data Upload Completed to National Portal", "No", "declarations", "Table 4.2 Self-Disclosure Declarations"),
        ("fire_safety_cert_no", "Fire Safety Certificate Number", "FS-2023-8891", "infrastructure", "Part 3 Safety Compliance"),
        ("land_area_acres", "Total Land Area in Acres", "5.25", "infrastructure", "Part 2 Land & Building"),
        ("built_up_area_sqm", "Total Built-Up Area (sq.m)", "12450.00", "infrastructure", "Part 2 Land & Building"),
        ("approved_intake_total", "Sanctioned Annual Student Intake", "420", "academic", "Part 4 Programs & Courses"),
        ("anti_ragging_committee", "Anti-Ragging Committee Constituted", "Yes", "governance", "Part 5 Mandatory Committees"),
        ("internal_complaint_committee", "Internal Complaint Committee (ICC) Active", "Yes", "governance", "Part 5 Mandatory Committees")
    ]
    for key, label, val, cat, sec in fields_app1:
        db.add(ApplicationField(
            application_id="VA-DEMO-2026-014",
            field_key=key,
            field_label=label,
            field_value=val,
            category=cat,
            source_form_section=sec
        ))

    # Also seed fields for app2
    fields_app2 = [
        ("institution_name", "Institution Full Name", "Apex Technical Campus", "general", "Part 1 Institutional Identity"),
        ("student_data_upload_complete", "Student Data Upload Completed", "Yes", "declarations", "Table 4.2 Declarations"),
        ("land_area_acres", "Total Land Area in Acres", "7.50", "infrastructure", "Part 2 Land & Building")
    ]
    for key, label, val, cat, sec in fields_app2:
        db.add(ApplicationField(
            application_id="VA-DEMO-2026-015",
            field_key=key,
            field_label=label,
            field_value=val,
            category=cat,
            source_form_section=sec
        ))

    # 5. Generate Real Synthetic PDFs with Watermarks & Compute SHA-256 Hashes
    # Document 1: Fire Safety Certificate (Expired: 2025-12-31 vs 2026-04-15)
    fire_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Fire_Safety_Certificate.pdf"
    fire_hash = generate_watermarked_pdf(
        file_path=fire_pdf_path,
        title="Fire Safety & Clearance Certificate",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "CERTIFICATE OF INSPECTION AND COMPLIANCE",
            "State Directorate of Fire & Rescue Services",
            "",
            "**Certificate Number:** FS-2023-8891",
            "**Date of Issue:** 01-Jan-2023",
            "**Valid Until:** 2025-12-31",
            "",
            "This is to certify that the institutional campus of Demo Institute of Applied Studies",
            "situated at Survey No. 42/1, Sector 9, Knowledge City, has been inspected by the",
            "authorized Fire Inspection Team on 28-Dec-2022.",
            "",
            "## FINDINGS & VERIFICATION",
            "- Fire hydrants and hose reels are installed per NBC 2016 Part IV norms.",
            "- Fire alarms and emergency exit illuminated signage are functional.",
            "- Adequate water storage tanks (50,000 litres capacity) are available.",
            "",
            "**NOTICE OF EXPIRY CONDITION:**",
            "This certificate is valid strictly for 36 calendar months up to 31st December 2025.",
            "Subsequent renewal and re-inspection is mandatory prior to the 2026 academic calendar.",
            "",
            "Certified By: Divisional Fire Officer, Regional Headquarters."
        ],
        doc_id_label="FS-2023-8891",
        pages=1
    )
    pages, text, meta = extract_pdf_info(fire_pdf_path)

    doc_fire = Document(
        id="DOC-014-01",
        application_id="VA-DEMO-2026-014",
        document_name="Fire_Safety_Certificate_FS-2023-8891.pdf",
        document_type="Fire Safety Certificate",
        checklist_item_id="ITEM-A2-FIRE",
        file_path=str(fire_pdf_path),
        file_hash=fire_hash,
        page_count=pages,
        extraction_status="OK",
        signature_status="Valid digital stamp (Demo)",
        metadata_indicators_json=json.dumps(meta),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_fire)

    # Document 2: Affidavit / Undertaking (Contains contradiction)
    affidavit_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Affidavit_Self_Disclosure.pdf"
    affidavit_hash = generate_watermarked_pdf(
        file_path=affidavit_pdf_path,
        title="Sworn Affidavit & Regulatory Undertaking",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "BEFORE THE REGULATORY SCRUTINY AUTHORITY",
            "Affidavit of Compliance for Extension of Approval (2026–27)",
            "",
            "I, Authorized Signatory, Trustee of Applied Studies Educational Society, solemnly affirm:",
            "",
            "1. That Demo Institute of Applied Studies is an existing approved technical institution.",
            "2. That all land, infrastructure, and faculty norms are maintained strictly as prescribed.",
            "3. That no capitation fee has been charged directly or indirectly.",
            "",
            "## PARAGRAPH 4 — MANDATORY DISCLOSURE UPLOAD",
            "I hereby solemnly declare and affirm that the complete student enrollment data for all",
            "approved courses has been fully and successfully uploaded to the national portal without omission.",
            "",
            "5. That the information supplied in the Self-Disclosure portal application is true and correct.",
            "Deponent: Chairman / President of the Society.",
            "Verified on 10th February 2026 before Notary Public."
        ],
        doc_id_label="AFF-2026-014",
        pages=2
    )
    pages_aff, text_aff, meta_aff = extract_pdf_info(affidavit_pdf_path)

    doc_affidavit = Document(
        id="DOC-014-02",
        application_id="VA-DEMO-2026-014",
        document_name="Affidavit_Self_Disclosure_2026-27.pdf",
        document_type="Affidavit / Undertaking",
        checklist_item_id="ITEM-A2-AFFIDAVIT",
        file_path=str(affidavit_pdf_path),
        file_hash=affidavit_hash,
        page_count=pages_aff,
        extraction_status="OK",
        signature_status="Not checked",
        metadata_indicators_json=json.dumps(meta_aff),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_affidavit)

    # Document 3: Building Occupancy Certificate
    occupancy_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Occupancy_Certificate.pdf"
    occupancy_hash = generate_watermarked_pdf(
        file_path=occupancy_pdf_path,
        title="Building Occupancy & Completion Certificate",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "MUNICIPAL TOWN PLANNING DEPARTMENT",
            "Certificate of Building Occupancy / Completion",
            "",
            "**Reference File:** BOC-MUN-2021-9920",
            "**Total Approved Built-Up Area:** 12,450.00 sq.m",
            "",
            "This certifies that the educational buildings comprising Academic Block A (G+3) and",
            "Administrative Wing (G+2) have been constructed in accordance with the sanctioned master plan.",
            "The premises are deemed structurally safe and fit for educational occupancy."
        ],
        doc_id_label="BOC-2021-9920",
        pages=1
    )
    pages_occ, text_occ, meta_occ = extract_pdf_info(occupancy_pdf_path)

    doc_occupancy = Document(
        id="DOC-014-03",
        application_id="VA-DEMO-2026-014",
        document_name="Building_Occupancy_Certificate.pdf",
        document_type="Building Occupancy Certificate",
        checklist_item_id="ITEM-A2-OCCUPANCY",
        file_path=str(occupancy_pdf_path),
        file_hash=occupancy_hash,
        page_count=pages_occ,
        extraction_status="OK",
        signature_status="Not checked",
        metadata_indicators_json=json.dumps(meta_occ),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_occupancy)

    # Document 4: Audited Balance Sheet Sample
    audit_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Audited_Accounts_FY24-25.pdf"
    audit_hash = generate_watermarked_pdf(
        file_path=audit_pdf_path,
        title="Audited Balance Sheet & Financial Statements",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "STATUTORY AUDITOR'S REPORT — FINANCIAL YEAR 2024–25",
            "Firm Reg. No. 109283W / Chartered Accountants",
            "",
            "We have audited the Balance Sheet of Demo Institute of Applied Studies as of 31-March-2025.",
            "- Corpus Fund: Rs. 14,25,00,000",
            "- Instructional & Lab Assets: Rs. 8,90,00,000",
            "- Operating Reserve: Compliant with regulatory norms.",
            "Opinion: True and fair view of accounts maintained."
        ],
        doc_id_label="AUDIT-2024-25",
        pages=1
    )
    pages_aud, text_aud, meta_aud = extract_pdf_info(audit_pdf_path)

    doc_audit = Document(
        id="DOC-014-04",
        application_id="VA-DEMO-2026-014",
        document_name="Audited_Accounts_FY2024-25.pdf",
        document_type="Audited Balance Sheet",
        checklist_item_id="ITEM-A2-ACCOUNTS",
        file_path=str(audit_pdf_path),
        file_hash=audit_hash,
        page_count=pages_aud,
        extraction_status="OK",
        signature_status="Not checked",
        metadata_indicators_json=json.dumps(meta_aud),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_audit)

    # Document 5: Land Location Declaration
    land_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Land_Declaration.pdf"
    land_hash = generate_watermarked_pdf(
        file_path=land_pdf_path,
        title="Land Title & Location Certificate",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "DISTRICT REVENUE OFFICER & SUB-REGISTRAR OFFICE",
            "Certificate of Land Ownership & Title Clearance",
            "",
            "**Total Contiguous Land:** 5.25 Acres",
            "**Survey Number:** 42/1, 42/2",
            "**Zoning:** Institutional / Higher Education Use",
            "Land is free from litigation, mortgage, or unauthorized encumbrances."
        ],
        doc_id_label="LAND-TIT-525",
        pages=1
    )
    pages_lnd, text_lnd, meta_lnd = extract_pdf_info(land_pdf_path)

    doc_land = Document(
        id="DOC-014-05",
        application_id="VA-DEMO-2026-014",
        document_name="Land_Title_and_Location_Declaration.pdf",
        document_type="Land Documents",
        checklist_item_id="ITEM-A2-LAND",
        file_path=str(land_pdf_path),
        file_hash=land_hash,
        page_count=pages_lnd,
        extraction_status="OK",
        signature_status="Not checked",
        metadata_indicators_json=json.dumps(meta_lnd),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_land)

    # Document 6: Payment Challan Receipt
    pay_pdf_path = DOCUMENTS_DIR / "VA-DEMO-014_Payment_Challan.pdf"
    pay_hash = generate_watermarked_pdf(
        file_path=pay_pdf_path,
        title="Processing Fee Payment Challan",
        institution_name="Demo Institute of Applied Studies",
        body_lines=[
            "NATIONAL BANK REGULATORY FEE PAYMENT RECEIPT",
            "",
            "**Transaction ID:** TXN-202602-998812",
            "**Amount Paid:** Rs. 2,00,000/- (Two Lakhs Only)",
            "**Purpose:** Extension of Approval Processing Fee (2026–27)",
            "Status: Realized & Credited."
        ],
        doc_id_label="PAY-TXN-998812",
        pages=1
    )
    pages_pay, text_pay, meta_pay = extract_pdf_info(pay_pdf_path)

    doc_payment = Document(
        id="DOC-014-06",
        application_id="VA-DEMO-2026-014",
        document_name="Application_Fee_Payment_Receipt.pdf",
        document_type="Payment Receipt",
        checklist_item_id="ITEM-A2-PAYMENT",
        file_path=str(pay_pdf_path),
        file_hash=pay_hash,
        page_count=pages_pay,
        extraction_status="OK",
        signature_status="Not checked",
        metadata_indicators_json=json.dumps(meta_pay),
        source_mode="SYNTHETIC DEMO DOCUMENT — NOT VALID FOR OFFICIAL USE"
    )
    db.add(doc_payment)

    # 6. Seed Extracted Fields
    extractions = [
        DocumentExtraction(
            document_id="DOC-014-01",
            field_name="valid_until_date",
            extracted_value="2025-12-31",
            source_page=1,
            confidence=0.98,
            extraction_method="fixture_derived",
            is_fixture=True
        ),
        DocumentExtraction(
            document_id="DOC-014-01",
            field_name="certificate_number",
            extracted_value="FS-2023-8891",
            source_page=1,
            confidence=0.95,
            extraction_method="fixture_derived",
            is_fixture=True
        ),
        DocumentExtraction(
            document_id="DOC-014-02",
            field_name="declaration_student_data_upload",
            extracted_value="Uploaded student data complete",
            source_page=2,
            confidence=0.96,
            extraction_method="fixture_derived",
            is_fixture=True
        ),
        DocumentExtraction(
            document_id="DOC-014-03",
            field_name="built_up_area_sqm",
            extracted_value="12450.00",
            source_page=1,
            confidence=0.92,
            extraction_method="fixture_derived",
            is_fixture=True
        ),
        # Low confidence extraction for QA routing demonstration
        DocumentExtraction(
            document_id="DOC-014-04",
            field_name="operating_reserve_amount",
            extracted_value="Rs. 45,00,000",
            source_page=1,
            confidence=0.62,
            extraction_method="pymupdf_extracted",
            is_fixture=False
        )
    ]
    for ext in extractions:
        db.add(ext)

    # 7. Seed Simulated Verification Attempt
    v_attempt = VerificationAttempt(
        application_id="VA-DEMO-2026-014",
        document_id="DOC-014-01",
        check_type="issuer_registry_check",
        source_system=SIMULATED_CONNECTOR_NAME,
        mode=SIMULATED_ISSUER_BANNER,
        status="Mismatch detected",
        matched_fields_json=json.dumps({
            "certificate_number": "FS-2023-8891",
            "registry_holder": "Demo Institute of Applied Studies",
            "registry_status": "EXPIRED / RENEWAL_PENDING",
            "registry_expiry_date": "2025-12-31"
        }),
        raw_response_json=json.dumps({
            "connector_id": "STATE_FIRE_SERVICES_MOCK",
            "query_time": "2026-04-15T10:30:00Z",
            "simulated": True,
            "disclaimer": "SIMULATED — NO LIVE ISSUER API"
        }),
        verified_at=datetime.datetime.utcnow()
    )
    db.add(v_attempt)

    # 8. Seed Manual Verification Tasks
    db.query(ManualVerificationTask).delete()
    tasks = [
        ManualVerificationTask(
            id="TASK-014-01",
            application_id="VA-DEMO-2026-014",
            finding_id="FIND-014-001",
            rule_code="DOC-FIRE-EXPIRY",
            rule_id="RULE-APH-001",
            title="Fire Safety Certificate Expiry Verification",
            trigger_reason="The extracted certificate validity date (2025-12-31) is earlier than the evaluation date (2026-04-15). Officer must verify whether renewal receipt or renewed NOC has been produced.",
            linked_document_id="DOC-014-01",
            linked_document_name="Fire_Safety_Certificate.pdf",
            relevant_rule_clause="APH 2026–27 Ch. II §2.1.3 & Annexure 2 §2.1 Item 2",
            previous_automated_result="Possible deficiency (Validity expired 2025-12-31)",
            assigned_reviewer="Officer A",
            status="pending",
            reviewer_remarks=None,
            evidence_excerpt="Fire Safety Certificate #FS-2023-8891 valid until: 2025-12-31"
        ),
        ManualVerificationTask(
            id="TASK-014-02",
            application_id="VA-DEMO-2026-014",
            finding_id="FIND-014-002",
            rule_code="DECL-FORM-STUDENT-DATA",
            rule_id="RULE-APH-002",
            title="Student Enrollment Affidavit vs Form Reconciliation",
            trigger_reason="Form field marked 'No' for student data upload completion while submitted Affidavit Para 4 explicitly affirms full compliance. Reconciliation required.",
            linked_document_id="DOC-014-02",
            linked_document_name="Affidavit_Self_Disclosure.pdf",
            relevant_rule_clause="APH 2026–27 Table 4.2 Para 4",
            previous_automated_result="Needs clarification (Field 'No' vs Affidavit affirmation)",
            assigned_reviewer="Officer A",
            status="in_progress",
            reviewer_remarks="Reviewed affidavit page 2, signed by Trust President. Form field entry appears to be a clerical typo during online submission.",
            evidence_excerpt="Affidavit: 'Uploaded student data complete' | Structured Field: 'No'"
        ),
        ManualVerificationTask(
            id="TASK-014-03",
            application_id="VA-DEMO-2026-014",
            finding_id="FIND-014-003",
            rule_code="CHECKLIST-MISSING-DOC",
            rule_id="RULE-APH-003",
            title="Barrier-Free Built Environment & PwD Norms Inspection",
            trigger_reason="Mandatory certificate of Barrier-Free Built Environment is missing from application dossier under Annexure 2 §2.1 Item 6.",
            linked_document_id=None,
            linked_document_name="Dossier Checklist",
            relevant_rule_clause="Annexure 2 §2.1 Item 6 (Barrier-Free Architecture)",
            previous_automated_result="Possible deficiency (Document missing from dossier)",
            assigned_reviewer="Officer A",
            status="pending",
            reviewer_remarks=None,
            evidence_excerpt="Checklist Item #6 (Annexure 2 §2.1): Not submitted"
        ),
        ManualVerificationTask(
            id="TASK-014-04",
            application_id="VA-DEMO-2026-014",
            finding_id="FIND-014-004",
            rule_code="ISSUER-VERIFY-CHECK",
            rule_id="RULE-APH-004",
            title="State Fire Services Issuer Registry Mismatch Follow-up",
            trigger_reason="Simulated external state fire authority connector returned mismatch status 'Revoked / Not Renewed'. Requires officer verification with issuing division.",
            linked_document_id="DOC-014-01",
            linked_document_name="Fire_Safety_Certificate.pdf",
            relevant_rule_clause="APH Ch. II Clause 4.1 External Verification Norms",
            previous_automated_result="Needs clarification (Issuer registry mismatch simulated)",
            assigned_reviewer="Officer A",
            status="pending",
            reviewer_remarks=None,
            evidence_excerpt="Connector: Demo Issuer Connector (SIMULATED) | Result: Mismatch detected"
        ),
        ManualVerificationTask(
            id="TASK-014-05",
            application_id="VA-DEMO-2026-014",
            finding_id="FIND-014-005",
            rule_code="OCR-CONFIDENCE-LOW",
            rule_id="RULE-APH-005",
            title="Audited Accounts Operating Reserve Extraction Verification",
            trigger_reason="OCR extraction pipeline flagged low confidence (62%) on operating reserve amount field from Balance Sheet.",
            linked_document_id="DOC-014-04",
            linked_document_name="Audited_Accounts_FY2024-25.pdf",
            relevant_rule_clause="APH Table 5.1 Financial Operating Reserves",
            previous_automated_result="Needs clarification (OCR confidence 62%)",
            assigned_reviewer="Officer A",
            status="verified",
            reviewer_remarks="Manually inspected original PDF page 1. Figure is clearly legible as 'Rs. 45,00,000'. Matches audited balance sheet schedule III.",
            justification_note="Visual inspection confirms amount meets AICTE operating reserve threshold.",
            evidence_excerpt="Extracted: 'Rs. 45,00,000' (Confidence: 0.62) -> Verified visually",
            completed_at=datetime.datetime.utcnow(),
            completed_by="Officer A"
        ),
        ManualVerificationTask(
            id="TASK-015-01",
            application_id="VA-DEMO-2026-015",
            finding_id=None,
            rule_code="LAND-TITLE-REGISTRY",
            rule_id="RULE-APH-006",
            title="Land Ownership Sale Deed & Sub-Registrar Clearance",
            trigger_reason="New technical institution application requires manual cross-check of 7.50 acres registered ownership deed.",
            linked_document_id="DOC-015-01",
            linked_document_name="Land_Title_Deed_Registered.pdf",
            relevant_rule_clause="APH 2026–27 Ch. I §1.4 Land Norms",
            previous_automated_result="Met (Self-reported 7.50 Acres >= 5.0 Acres required)",
            assigned_reviewer="Officer B",
            status="verified",
            reviewer_remarks="Registered deed verified. Khasra / Survey Nos 102, 103, 104 in name of Trust registered for 99-year perpetual lease.",
            justification_note="Clear title certificate issued by Government Pleader attached.",
            evidence_excerpt="Registered Lease Deed Volume 442, Page 11-28, Sub-Registrar Office",
            completed_at=datetime.datetime.utcnow(),
            completed_by="Officer B"
        ),
        ManualVerificationTask(
            id="TASK-015-02",
            application_id="VA-DEMO-2026-015",
            finding_id=None,
            rule_code="BUILDING-COMPLETION-SANCTION",
            rule_id="RULE-APH-007",
            title="Approved Master Building Plan & Fire Staircase Layout",
            trigger_reason="Physical verification of instructional area (9,500 sq.m) against municipal approved plan.",
            linked_document_id="DOC-015-02",
            linked_document_name="Municipal_Building_Plan_Approval.pdf",
            relevant_rule_clause="APH 2026–27 Ch. I §1.6 Built-Up Area Norms",
            previous_automated_result="Met (12,450 sq.m built-up exceeds required 8,000 sq.m)",
            assigned_reviewer="Officer B",
            status="pending",
            reviewer_remarks=None,
            evidence_excerpt="Municipal Sanction Order #MUN-B-2025-449"
        )
    ]
    for t in tasks:
        db.add(t)

    # 9. Seed Compliance Checklist Items
    db.query(ComplianceChecklistItem).delete()
    checklists = [
        ComplianceChecklistItem(id="CHK-014-01", application_id="VA-DEMO-2026-014", clause_ref="§2.1.1", annexure="Annexure 2", section="§2.1", item_no="1", requirement_title="Signed Self-Disclosure Affidavit", requirement_description="Self-disclosure in the prescribed format on non-judicial stamp paper affirmed by Chairman/Secretary.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant", linked_document_id="DOC-014-02"),
        ComplianceChecklistItem(id="CHK-014-02", application_id="VA-DEMO-2026-014", clause_ref="§2.1.2", annexure="Annexure 2", section="§2.1", item_no="2", requirement_title="Valid Fire Safety Certificate / NOC", requirement_description="Fire safety certificate issued by the competent Fire Service Authority of the concerned State/UT.", is_mandatory=True, automated_status="deficiency", manual_status="discrepancy", overall_status="non_compliant", linked_document_id="DOC-014-01", notes="Certificate validity lapsed 2025-12-31; renewed clearance mandatory."),
        ComplianceChecklistItem(id="CHK-014-03", application_id="VA-DEMO-2026-014", clause_ref="§2.1.3", annexure="Annexure 2", section="§2.1", item_no="3", requirement_title="Structural Stability Certificate", requirement_description="Structural stability certificate issued by registered Structural Engineer confirming safety standards.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant", linked_document_id="DOC-014-03"),
        ComplianceChecklistItem(id="CHK-014-04", application_id="VA-DEMO-2026-014", clause_ref="§2.1.4", annexure="Annexure 2", section="§2.1", item_no="4", requirement_title="Building Occupancy Certificate", requirement_description="Occupancy Certificate / Completion Certificate issued by competent municipal authority.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant", linked_document_id="DOC-014-03"),
        ComplianceChecklistItem(id="CHK-014-05", application_id="VA-DEMO-2026-014", clause_ref="§2.1.5", annexure="Annexure 2", section="§2.1", item_no="5", requirement_title="Audited Balance Sheet & Financial Statements", requirement_description="Audited financial statement of preceding financial year showing operational viability and reserve.", is_mandatory=True, automated_status="needs_clarification", manual_status="in_progress", overall_status="under_review", linked_document_id="DOC-014-04"),
        ComplianceChecklistItem(id="CHK-014-06", application_id="VA-DEMO-2026-014", clause_ref="§2.1.6", annexure="Annexure 2", section="§2.1", item_no="6", requirement_title="Barrier-Free Built Environment for PwD", requirement_description="Certificate of barrier-free environment, ramps, lifts, and disabled-friendly toilets per PwD Act.", is_mandatory=True, automated_status="missing", manual_status="pending", overall_status="non_compliant", notes="Certificate missing from submitted dossier."),
        ComplianceChecklistItem(id="CHK-014-07", application_id="VA-DEMO-2026-014", clause_ref="§2.1.7", annexure="Annexure 2", section="§2.1", item_no="7", requirement_title="Internal Complaints Committee (ICC)", requirement_description="Constitution of ICC per Gender Sensitization and Prevention of Sexual Harassment regulations.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant"),
        ComplianceChecklistItem(id="CHK-014-08", application_id="VA-DEMO-2026-014", clause_ref="§2.1.8", annexure="Annexure 2", section="§2.1", item_no="8", requirement_title="Anti-Ragging Committee & Squad", requirement_description="Establishment of Anti-Ragging Committee and Squad as per AICTE Anti-Ragging Regulations.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant"),
        ComplianceChecklistItem(id="CHK-014-09", application_id="VA-DEMO-2026-014", clause_ref="§2.1.9", annexure="Annexure 2", section="§2.1", item_no="9", requirement_title="Student Enrollment & Faculty Portal Upload", requirement_description="Uploading of student enrollment and complete faculty cadre data on national AICTE portal.", is_mandatory=True, automated_status="needs_clarification", manual_status="pending", overall_status="under_review", notes="Reconciliation in progress."),
        ComplianceChecklistItem(id="CHK-014-10", application_id="VA-DEMO-2026-014", clause_ref="§2.1.10", annexure="Annexure 2", section="§2.1", item_no="10", requirement_title="Processing Fee Payment Realization", requirement_description="Payment of regulatory processing fee and realization in AICTE accounts.", is_mandatory=True, automated_status="met", manual_status="verified", overall_status="compliant", linked_document_id="DOC-014-06")
    ]
    for c in checklists:
        db.add(c)

    db.commit()

    # 10. Run initial validation on VA-DEMO-2026-014 so findings, alerts, and audit trail are deterministically established!
    val_run = evaluate_application(db, "VA-DEMO-2026-014", run_by="Officer A", evaluation_date=DEMO_EVALUATION_DATE)

    return {
        "status": "success",
        "applications_seeded": 2,
        "documents_generated": 6,
        "rules_configured": len(rules),
        "initial_validation_run_id": val_run.id,
        "initial_findings_count": val_run.deficiency_count + val_run.clarification_count
    }
