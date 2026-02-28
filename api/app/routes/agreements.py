from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import uuid4
import os
import shutil

router = APIRouter(prefix="/jobs/{job_id}/agreements", tags=["agreements"])

# --- In-memory store: job_id -> list[Agreement] ---
_AGREEMENTS: Dict[str, List["Agreement"]] = {}

API_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))  # .../fieldops/api
UPLOAD_DIR = os.path.join(API_DIR, "uploads", "agreements")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Money(BaseModel):
    amount: float
    currency: str = "USD"

class AgreementTerms(BaseModel):
    scopeText: str
    price: Money
    startDate: Optional[str] = None
    dueDate: Optional[str] = None
    paymentTerms: Optional[str] = None

class ClientAck(BaseModel):
    confirmed: bool
    name: str
    phone: Optional[str] = None
    confirmedAt: Optional[str] = None

class Agreement(BaseModel):
    agreementId: str
    createdAt: datetime
    audioUrl: Optional[str] = None  # local-dev URL path
    transcript: Optional[str] = None
    terms: Optional[AgreementTerms] = None
    clientAck: Optional[ClientAck] = None
    evidencePdfUrl: Optional[str] = None
    evidenceHash: Optional[str] = None

@router.get("", response_model=List[Agreement])
def list_agreements(job_id: str):
    return _AGREEMENTS.get(job_id, [])

@router.post("", response_model=Agreement)
def create_agreement(job_id: str, audio: UploadFile = File(...)):
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload an audio file.")

    agreement_id = str(uuid4())
    now = datetime.utcnow()

    # Save audio to disk (dev)
    ext = os.path.splitext(audio.filename or "")[1] or ".webm"
    filename = f"{job_id}_{agreement_id}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(audio.file, f)

    # Stub transcript/terms (placeholder until Gemini)
    transcript = "TRANSCRIPTION_PENDING"
    terms = AgreementTerms(
        scopeText="PENDING_SCOPE_EXTRACTION",
        price=Money(amount=0.0),
        paymentTerms=None,
    )

    agreement = Agreement(
        agreementId=agreement_id,
        createdAt=now,
        audioUrl=f"/_dev/uploads/agreements/{filename}",
        transcript=transcript,
        terms=terms,
    )

    _AGREEMENTS.setdefault(job_id, []).insert(0, agreement)
    return agreement
