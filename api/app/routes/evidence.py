from datetime import datetime
from typing import Any, Dict
import hashlib
import json
import os

from fastapi import APIRouter, HTTPException

from app.routes.agreements import _AGREEMENTS, Agreement

router = APIRouter(prefix="/jobs/{job_id}/agreements/{agreement_id}", tags=["evidence"])

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))  # .../api
EVIDENCE_DIR = os.path.join(API_DIR, "uploads", "evidence")
os.makedirs(EVIDENCE_DIR, exist_ok=True)


def _model_to_dict(value: Any) -> Any:
    if value is None:
        return None
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if hasattr(value, "dict"):
        return value.dict()
    return value


def _canonical_summary(job_id: str, agreement: Agreement) -> Dict[str, Any]:
    return {
        "jobId": job_id,
        "agreementId": agreement.agreementId,
        "createdAt": agreement.createdAt.isoformat() + "Z",
        "audioUrl": agreement.audioUrl,
        "transcript": agreement.transcript,
        "terms": _model_to_dict(agreement.terms),
        "clientAck": _model_to_dict(getattr(agreement, "clientAck", None)),
        "generatedAt": datetime.utcnow().isoformat() + "Z",
        "type": "EVIDENCE_RECORD_V1",
    }


def _hash_summary(summary: Dict[str, Any]) -> str:
    canonical = json.dumps(summary, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def _draw_wrapped_text(pdf_canvas: Any, x: int, y: int, text: str, max_width: int, line_height: int = 14) -> int:
    words = (text or "").split()
    line = ""
    for word in words:
        candidate = (line + " " + word).strip()
        if pdf_canvas.stringWidth(candidate, "Helvetica", 10) <= max_width:
            line = candidate
            continue

        pdf_canvas.setFont("Helvetica", 10)
        pdf_canvas.drawString(x, y, line)
        y -= line_height
        line = word

    if line:
        pdf_canvas.setFont("Helvetica", 10)
        pdf_canvas.drawString(x, y, line)
        y -= line_height

    return y


@router.post("/evidence", response_model=Agreement)
def generate_evidence(job_id: str, agreement_id: str):
    try:
        from reportlab.lib.pagesizes import LETTER
        from reportlab.pdfgen import canvas
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PDF generation dependency missing. Install reportlab in the API environment.",
        ) from exc

    agreements = _AGREEMENTS.get(job_id, [])
    agreement = next((item for item in agreements if item.agreementId == agreement_id), None)
    if not agreement:
        raise HTTPException(status_code=404, detail="Agreement not found")

    summary = _canonical_summary(job_id, agreement)
    evidence_hash = _hash_summary(summary)

    filename = f"{job_id}_{agreement_id}_{evidence_hash[:12]}.pdf"
    pdf_path = os.path.join(EVIDENCE_DIR, filename)

    pdf_canvas = canvas.Canvas(pdf_path, pagesize=LETTER)
    width, height = LETTER
    margin = 54

    y = height - margin
    pdf_canvas.setFont("Helvetica-Bold", 16)
    pdf_canvas.drawString(margin, y, "FieldOps Evidence Record")
    y -= 22

    pdf_canvas.setFont("Helvetica", 10)
    pdf_canvas.drawString(margin, y, f"Generated (UTC): {summary['generatedAt']}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Job ID: {job_id}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Agreement ID: {agreement_id}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Evidence Hash (sha256): {evidence_hash}")
    y -= 20

    pdf_canvas.setFont("Helvetica-Bold", 12)
    pdf_canvas.drawString(margin, y, "Agreement Summary")
    y -= 16

    terms = summary.get("terms") or {}
    scope = terms.get("scopeText") or "—"
    price = (terms.get("price") or {}).get("amount")
    payment_terms = terms.get("paymentTerms") or "—"
    start_date = terms.get("startDate") or "—"
    due_date = terms.get("dueDate") or "—"

    pdf_canvas.setFont("Helvetica", 10)
    pdf_canvas.drawString(margin, y, f"Scope: {scope[:120]}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Price: {price if price is not None else '—'} USD")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Start: {start_date}   Due: {due_date}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Payment Terms: {payment_terms[:120]}")
    y -= 20

    pdf_canvas.setFont("Helvetica-Bold", 12)
    pdf_canvas.drawString(margin, y, "Transcript")
    y -= 16

    transcript = summary.get("transcript") or "—"
    y = _draw_wrapped_text(pdf_canvas, margin, y, transcript, max_width=int(width - 2 * margin))

    y -= 10
    pdf_canvas.setFont("Helvetica-Bold", 12)
    pdf_canvas.drawString(margin, y, "Client Acknowledgment")
    y -= 16

    ack = summary.get("clientAck") or {}
    pdf_canvas.setFont("Helvetica", 10)
    pdf_canvas.drawString(margin, y, f"Confirmed: {ack.get('confirmed', False)}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Name: {ack.get('name', '—')}")
    y -= 14
    pdf_canvas.drawString(margin, y, f"Confirmed At: {ack.get('confirmedAt', '—')}")
    y -= 20

    pdf_canvas.setFont("Helvetica-Oblique", 9)
    pdf_canvas.drawString(
        margin,
        y,
        "Disclaimer: This document is a contemporaneous record of communication and acknowledgment. Not legal advice.",
    )

    pdf_canvas.showPage()
    pdf_canvas.save()

    agreement.evidencePdfUrl = f"/_dev/uploads/evidence/{filename}"
    agreement.evidenceHash = evidence_hash

    return agreement
