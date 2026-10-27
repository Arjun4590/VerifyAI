import hashlib
import json
from pathlib import Path
from typing import Dict, Any, Tuple
import pymupdf  # PyMuPDF
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from .config import DOCUMENTS_DIR, SYNTHETIC_DOC_BANNER

def generate_watermarked_pdf(
    file_path: Path,
    title: str,
    institution_name: str,
    body_lines: list[str],
    doc_id_label: str,
    pages: int = 1
) -> str:
    """
    Generates a realistic synthetic PDF fixture with visible demo banner/watermark.
    Returns SHA-256 hash of the generated file.
    """
    file_path.parent.mkdir(parents=True, exist_ok=True)
    c = canvas.Canvas(str(file_path), pagesize=letter)
    width, height = letter

    for page_num in range(1, pages + 1):
        # 1. Background / Border
        c.setStrokeColor(colors.HexColor("#cbd5e1"))
        c.setLineWidth(1)
        c.rect(30, 30, width - 60, height - 60)

        # 2. Top Banner
        c.setFillColor(colors.HexColor("#fef2f2"))
        c.rect(30, height - 55, width - 60, 25, fill=1, stroke=0)
        c.setFillColor(colors.HexColor("#991b1b"))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(width / 2.0, height - 48, SYNTHETIC_DOC_BANNER)

        # 3. Header
        c.setFillColor(colors.HexColor("#0f172a"))
        c.setFont("Helvetica-Bold", 14)
        c.drawCentredString(width / 2.0, height - 85, title.upper())

        c.setFont("Helvetica-Bold", 10)
        c.setFillColor(colors.HexColor("#2563eb"))
        c.drawCentredString(width / 2.0, height - 105, f"INSTITUTION: {institution_name.upper()}")

        c.setFont("Helvetica", 9)
        c.setFillColor(colors.HexColor("#475569"))
        c.drawCentredString(width / 2.0, height - 120, f"DOCUMENT REF: {doc_id_label} | PAGE {page_num} OF {pages}")

        # Horizontal Divider
        c.setStrokeColor(colors.HexColor("#e2e8f0"))
        c.setLineWidth(1)
        c.line(50, height - 130, width - 50, height - 130)

        # 4. Body Content
        c.setFont("Helvetica", 10)
        c.setFillColor(colors.HexColor("#1e293b"))
        y = height - 160
        for line in body_lines:
            if y < 80:
                break
            if line.startswith("## "):
                c.setFont("Helvetica-Bold", 11)
                c.setFillColor(colors.HexColor("#0f172a"))
                y -= 8
                c.drawString(60, y, line[3:])
                y -= 14
                c.setFont("Helvetica", 10)
                c.setFillColor(colors.HexColor("#1e293b"))
            elif line.startswith("**"):
                c.setFont("Helvetica-Bold", 10)
                c.drawString(60, y, line.replace("**", ""))
                y -= 14
                c.setFont("Helvetica", 10)
            else:
                c.drawString(60, y, line)
                y -= 14

        # 5. Signatory Stamp / Seal
        c.setStrokeColor(colors.HexColor("#1e3a8a"))
        c.setFillColor(colors.HexColor("#eff6ff"))
        c.roundRect(width - 240, 70, 180, 50, 4, fill=1, stroke=1)
        c.setFillColor(colors.HexColor("#1e3a8a"))
        c.setFont("Helvetica-Bold", 8)
        c.drawString(width - 230, 105, "[OFFICIAL REGULATORY SEAL - DEMO]")
        c.setFont("Helvetica", 7)
        c.drawString(width - 230, 93, "Signed & Verified by Competent Authority")
        c.drawString(width - 230, 81, f"Digital Stamp: VERIFYAI-FIXTURE-{doc_id_label}")

        # 6. Bottom Banner
        c.setFillColor(colors.HexColor("#991b1b"))
        c.setFont("Helvetica-Bold", 8)
        c.drawCentredString(width / 2.0, 42, SYNTHETIC_DOC_BANNER)

        c.showPage()

    c.save()

    # Calculate SHA-256
    with open(file_path, "rb") as f:
        file_hash = hashlib.sha256(f.read()).hexdigest()

    return file_hash

def extract_pdf_info(file_path: Path) -> Tuple[int, str, Dict[str, Any]]:
    """
    Uses PyMuPDF to extract text, page count, and metadata from a PDF file.
    """
    if not file_path.exists():
        return 0, "", {}

    doc = pymupdf.open(str(file_path))
    page_count = len(doc)
    text_parts = []
    for page_idx in range(page_count):
        text_parts.append(doc[page_idx].get_text())

    full_text = "\n--- PAGE BREAK ---\n".join(text_parts)
    meta = doc.metadata or {}
    clean_meta = {
        "format": meta.get("format", "PDF"),
        "title": meta.get("title", ""),
        "author": meta.get("author", ""),
        "creator": meta.get("creator", "VerifyAI Synthetic Generator"),
        "producer": meta.get("producer", "ReportLab / PyMuPDF"),
        "pages": page_count,
        "is_encrypted": doc.is_encrypted,
    }
    doc.close()
    return page_count, full_text, clean_meta
