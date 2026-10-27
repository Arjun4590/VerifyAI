import json
import logging
from pathlib import Path
from typing import Dict, Any, List
import openpyxl
from sqlalchemy.orm import Session
from .config import WORKBOOK_PATH
from .models import (
    CatalogueCategory,
    CatalogueDocument,
    CatalogueCandidateRule,
    CatalogueExternalRef,
    CatalogueImportLog,
)

logger = logging.getLogger(__name__)

def import_handbook_catalogue(db: Session, file_path: Path = None) -> Dict[str, Any]:
    """
    Deterministic workbook importer for handbook_extraction.xlsx.
    Imports all 5 sheets:
      - Summary
      - Categories (21 categories)
      - Documents (170 document & requirement items)
      - External refs (534 external reference records)
      - Rule candidates (1,304 candidate rule records)
    Preserves raw text, provenance (workbook, sheet, row), flags, and mappings.
    Idempotent: safe to run repeatedly without duplicate records.
    """
    target_path = file_path or WORKBOOK_PATH
    if not target_path.exists():
        raise FileNotFoundError(
            f"Handbook extraction workbook not found at: {target_path}. "
            f"Please ensure handbook_extraction.xlsx is placed in the project root."
        )

    wb = openpyxl.load_workbook(target_path, data_only=True)
    expected_sheets = ["Summary", "Categories", "Documents", "External refs", "Rule candidates"]
    missing_sheets = [s for s in expected_sheets if s not in wb.sheetnames]
    if missing_sheets:
        raise ValueError(f"Workbook is missing required sheet(s): {missing_sheets}")

    results: Dict[str, Any] = {
        "workbook": target_path.name,
        "sheets": {},
        "total_records_imported": 0,
        "errors": []
    }

    filename = target_path.name

    # 1. Clear existing catalogue data for clean idempotent import
    db.query(CatalogueCategory).delete()
    db.query(CatalogueDocument).delete()
    db.query(CatalogueCandidateRule).delete()
    db.query(CatalogueExternalRef).delete()
    db.commit()

    # --- 1. Sheet: Summary ---
    summary_sheet = wb["Summary"]
    summary_lines = []
    for r in range(2, summary_sheet.max_row + 1):
        val = summary_sheet.cell(r, 1).value
        if val is not None:
            summary_lines.append(str(val).strip())

    import_log_summary = CatalogueImportLog(
        workbook_filename=filename,
        sheet_name="Summary",
        total_rows=len(summary_lines),
        imported_rows=len(summary_lines),
        skipped_rows=0,
        error_log_json=json.dumps({"summary_entries": summary_lines})
    )
    db.add(import_log_summary)
    results["sheets"]["Summary"] = {
        "total_source_rows": len(summary_lines),
        "imported": len(summary_lines),
        "skipped": 0,
        "notes": summary_lines[:3]
    }

    # --- 2. Sheet: Categories ---
    cat_sheet = wb["Categories"]
    cat_headers = [cat_sheet.cell(1, c).value for c in range(1, cat_sheet.max_column + 1)]
    categories_imported = 0
    categories_skipped = 0
    cat_errors = []

    for r in range(2, cat_sheet.max_row + 1):
        cat_id_val = cat_sheet.cell(r, 1).value
        nature_val = cat_sheet.cell(r, 2).value
        if cat_id_val is None and nature_val is None:
            categories_skipped += 1
            continue

        try:
            cat_id = int(cat_id_val)
            nature_of_app = str(nature_val or "").strip()
            self_disc = str(cat_sheet.cell(r, 3).value or "").strip()
            scrutiny = str(cat_sheet.cell(r, 4).value or "").strip()
            evc = str(cat_sheet.cell(r, 5).value or "").strip()
            sac_shc = str(cat_sheet.cell(r, 6).value or "").strip()
            annexure2_sections = str(cat_sheet.cell(r, 7).value or "").strip()
            own_items_val = cat_sheet.cell(r, 8).value
            own_items = int(own_items_val) if own_items_val is not None else 0
            note = str(cat_sheet.cell(r, 9).value or "").strip() if cat_sheet.cell(r, 9).value else None

            # Detect unresolved mapping warning
            mapping_status = "extracted"
            mapping_notes = None
            if "needs review" in annexure2_sections.lower() or "no annexure-2 section found" in annexure2_sections.lower():
                mapping_status = "unresolved_needs_review"
                mapping_notes = "Handbook has no direct Annexure-2 section mapping; handbook states processed per UGC norms. Authorized review required."
            elif "by reference" in annexure2_sections.lower():
                mapping_status = "by_reference"
                mapping_notes = "Includes requirements from other sections by reference."

            cat_record = CatalogueCategory(
                cat_id=cat_id,
                nature_of_application=nature_of_app,
                self_disclosure=self_disc,
                scrutiny=scrutiny,
                evc=evc,
                sac_shc=sac_shc,
                annexure2_sections=annexure2_sections,
                own_document_items=own_items,
                note=note,
                source_workbook=filename,
                sheet_name="Categories",
                source_row=r,
                mapping_status=mapping_status,
                mapping_notes=mapping_notes,
            )
            db.add(cat_record)
            categories_imported += 1
        except Exception as e:
            cat_errors.append(f"Row {r}: {str(e)}")
            categories_skipped += 1

    results["sheets"]["Categories"] = {
        "total_source_rows": cat_sheet.max_row - 1,
        "imported": categories_imported,
        "skipped": categories_skipped,
        "errors": cat_errors
    }
    db.add(CatalogueImportLog(
        workbook_filename=filename,
        sheet_name="Categories",
        total_rows=cat_sheet.max_row - 1,
        imported_rows=categories_imported,
        skipped_rows=categories_skipped,
        error_log_json=json.dumps(cat_errors) if cat_errors else None
    ))

    # --- 3. Sheet: Documents ---
    doc_sheet = wb["Documents"]
    docs_imported = 0
    docs_skipped = 0
    doc_errors = []

    for r in range(2, doc_sheet.max_row + 1):
        annexure_val = doc_sheet.cell(r, 1).value
        text_val = doc_sheet.cell(r, 7).value
        if annexure_val is None and text_val is None:
            docs_skipped += 1
            continue

        try:
            annexure = str(annexure_val or "").strip()
            section = str(doc_sheet.cell(r, 2).value or "").strip()
            section_title = str(doc_sheet.cell(r, 3).value or "").strip()
            seq_val = doc_sheet.cell(r, 4).value
            seq = int(seq_val) if seq_val is not None else None
            item_no = str(doc_sheet.cell(r, 5).value or "").strip()
            page_val = doc_sheet.cell(r, 6).value
            page = int(page_val) if page_val is not None else None
            text = str(text_val or "").strip()
            kind = str(doc_sheet.cell(r, 8).value or "document/requirement").strip()
            doc_types = str(doc_sheet.cell(r, 9).value or "").strip() if doc_sheet.cell(r, 9).value else None
            possible_verifier = str(doc_sheet.cell(r, 10).value or "").strip() if doc_sheet.cell(r, 10).value else None
            cond_val = doc_sheet.cell(r, 11).value
            conditional = bool(cond_val) if cond_val is not None else False
            refs = str(doc_sheet.cell(r, 12).value or "").strip() if doc_sheet.cell(r, 12).value else None

            doc_record = CatalogueDocument(
                annexure=annexure,
                section=section,
                section_title=section_title,
                seq=seq,
                item_no=item_no,
                page=page,
                text=text,
                kind=kind,
                document_types=doc_types,
                possible_verifier=possible_verifier,
                conditional=conditional,
                refs=refs,
                source_workbook=filename,
                sheet_name="Documents",
                source_row=r,
            )
            db.add(doc_record)
            docs_imported += 1
        except Exception as e:
            doc_errors.append(f"Row {r}: {str(e)}")
            docs_skipped += 1

    results["sheets"]["Documents"] = {
        "total_source_rows": doc_sheet.max_row - 1,
        "imported": docs_imported,
        "skipped": docs_skipped,
        "errors": doc_errors
    }
    db.add(CatalogueImportLog(
        workbook_filename=filename,
        sheet_name="Documents",
        total_rows=doc_sheet.max_row - 1,
        imported_rows=docs_imported,
        skipped_rows=docs_skipped,
        error_log_json=json.dumps(doc_errors) if doc_errors else None
    ))

    # --- 4. Sheet: External refs ---
    ref_sheet = wb["External refs"]
    refs_imported = 0
    refs_skipped = 0
    ref_errors = []

    for r in range(2, ref_sheet.max_row + 1):
        sentence_val = ref_sheet.cell(r, 5).value
        if sentence_val is None:
            refs_skipped += 1
            continue

        try:
            page_val = ref_sheet.cell(r, 1).value
            page = int(page_val) if page_val is not None else None
            clause_val = ref_sheet.cell(r, 2).value
            clause = str(clause_val).strip() if clause_val is not None else None
            ref_types = str(ref_sheet.cell(r, 3).value or "").strip()
            keywords = str(ref_sheet.cell(r, 4).value or "").strip()
            sentence = str(sentence_val).strip()

            ref_record = CatalogueExternalRef(
                page=page,
                clause=clause,
                ref_types=ref_types,
                keywords=keywords,
                sentence=sentence,
                integration_status="unavailable",
                notes="Extracted from handbook text. Integration status tracked independently.",
                source_workbook=filename,
                sheet_name="External refs",
                source_row=r,
            )
            db.add(ref_record)
            refs_imported += 1
        except Exception as e:
            ref_errors.append(f"Row {r}: {str(e)}")
            refs_skipped += 1

    results["sheets"]["External refs"] = {
        "total_source_rows": ref_sheet.max_row - 1,
        "imported": refs_imported,
        "skipped": refs_skipped,
        "errors": ref_errors
    }
    db.add(CatalogueImportLog(
        workbook_filename=filename,
        sheet_name="External refs",
        total_rows=ref_sheet.max_row - 1,
        imported_rows=refs_imported,
        skipped_rows=refs_skipped,
        error_log_json=json.dumps(ref_errors) if ref_errors else None
    ))

    # --- 5. Sheet: Rule candidates ---
    rule_sheet = wb["Rule candidates"]
    candidates_imported = 0
    candidates_skipped = 0
    cand_errors = []

    for r in range(2, rule_sheet.max_row + 1):
        cand_id_val = rule_sheet.cell(r, 1).value
        sentence_val = rule_sheet.cell(r, 9).value
        if cand_id_val is None and sentence_val is None:
            candidates_skipped += 1
            continue

        try:
            cand_id = str(cand_id_val or f"R_ROW_{r}").strip()
            page_val = rule_sheet.cell(r, 2).value
            page = int(page_val) if page_val is not None else None
            clause_val = rule_sheet.cell(r, 3).value
            clause = str(clause_val).strip() if clause_val is not None else None
            modality = str(rule_sheet.cell(r, 4).value or "").strip()
            has_number = bool(rule_sheet.cell(r, 5).value)
            conditional = bool(rule_sheet.cell(r, 6).value)
            points_outside = bool(rule_sheet.cell(r, 7).value)
            type_guess = str(rule_sheet.cell(r, 8).value or "").strip()
            sentence = str(sentence_val or "").strip()

            cand_record = CatalogueCandidateRule(
                cand_id=cand_id,
                page=page,
                clause=clause,
                modality=modality,
                has_number=has_number,
                conditional=conditional,
                points_outside_handbook=points_outside,
                type_guess=type_guess,
                sentence=sentence,
                lifecycle_status="candidate",
                review_notes="Candidate sentence extracted by NLP rule-mining. Not an approved regulatory rule.",
                source_workbook=filename,
                sheet_name="Rule candidates",
                source_row=r,
            )
            db.add(cand_record)
            candidates_imported += 1
        except Exception as e:
            cand_errors.append(f"Row {r}: {str(e)}")
            candidates_skipped += 1

    results["sheets"]["Rule candidates"] = {
        "total_source_rows": rule_sheet.max_row - 1,
        "imported": candidates_imported,
        "skipped": candidates_skipped,
        "errors": cand_errors
    }
    db.add(CatalogueImportLog(
        workbook_filename=filename,
        sheet_name="Rule candidates",
        total_rows=rule_sheet.max_row - 1,
        imported_rows=candidates_imported,
        skipped_rows=candidates_skipped,
        error_log_json=json.dumps(cand_errors) if cand_errors else None
    ))

    db.commit()

    total_imported = categories_imported + docs_imported + refs_imported + candidates_imported
    results["total_records_imported"] = total_imported
    return results
