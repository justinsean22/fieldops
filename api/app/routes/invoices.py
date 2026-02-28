from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime
from uuid import uuid4

# Import the in-memory agreements store and model
from app.routes.agreements import _AGREEMENTS, Agreement

router = APIRouter(prefix="/jobs/{job_id}/invoices", tags=["invoices"])

# job_id -> list[Invoice]
_INVOICES: Dict[str, List["Invoice"]] = {}

class InvoiceLineItem(BaseModel):
    desc: str
    qty: Optional[float] = None
    unit: Optional[str] = None
    unitPrice: float
    total: float

class InvoiceTotals(BaseModel):
    subtotal: float
    tax: Optional[float] = None
    total: float
    depositDue: Optional[float] = None

class Invoice(BaseModel):
    invoiceId: str
    createdAt: datetime
    sentAt: Optional[datetime] = None
    paidAt: Optional[datetime] = None
    invoiceNumber: str
    lineItems: List[InvoiceLineItem]
    totals: InvoiceTotals
    pdfUrl: Optional[str] = None
    shareUrl: Optional[str] = None

def _next_invoice_number() -> str:
    # Simple dev numbering; later replace with Firestore counter / date-based scheme
    return f"INV-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid4())[:8].upper()}"

@router.get("", response_model=List[Invoice])
def list_invoices(job_id: str):
    return _INVOICES.get(job_id, [])

@router.post("/from-latest-agreement", response_model=Invoice)
def create_invoice_from_latest_agreement(job_id: str):
    agreements = _AGREEMENTS.get(job_id, [])
    if not agreements:
        raise HTTPException(status_code=400, detail="No agreement found for this job")

    latest: Agreement = agreements[0]

    # Pull from agreement terms (may be stubbed)
    scope = (latest.terms.scopeText if latest.terms else None) or "Job work"
    amount = (latest.terms.price.amount if latest.terms and latest.terms.price else None)
    if amount is None:
        amount = 0.0

    line = InvoiceLineItem(
        desc=scope,
        unitPrice=float(amount),
        total=float(amount),
    )
    subtotal = float(amount)

    invoice = Invoice(
        invoiceId=str(uuid4()),
        createdAt=datetime.utcnow(),
        invoiceNumber=_next_invoice_number(),
        lineItems=[line],
        totals=InvoiceTotals(subtotal=subtotal, total=subtotal),
    )

    _INVOICES.setdefault(job_id, []).insert(0, invoice)
    return invoice
