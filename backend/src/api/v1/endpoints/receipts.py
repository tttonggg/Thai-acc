from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.receipt import Receipt
from ....models.invoice import Invoice
from ....models.contact import Contact
from ....models.project import Project
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class ReceiptCreate(BaseModel):
    invoice_id: UUID
    receipt_date: date
    amount: Decimal = Field(..., gt=0)
    payment_method: str = Field(default="cash", pattern="^(cash|bank_transfer|cheque|credit_card|promptpay)$")
    payment_reference: Optional[str] = Field(None, max_length=100)
    bank_account_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    wht_amount: Decimal = Field(default=Decimal("0"), ge=0)
    wht_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class ReceiptUpdate(BaseModel):
    receipt_date: Optional[date] = None
    payment_method: Optional[str] = Field(None, pattern="^(cash|bank_transfer|cheque|credit_card|promptpay)$")
    payment_reference: Optional[str] = Field(None, max_length=100)
    bank_account_id: Optional[UUID] = None
    notes: Optional[str] = None


class ReceiptResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    invoice_id: UUID
    project_id: Optional[UUID]
    receipt_number: str
    receipt_date: date
    amount: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    payment_method: str
    payment_reference: Optional[str]
    bank_account_id: Optional[UUID]
    status: str
    notes: Optional[str]
    wht_amount: Decimal
    wht_rate: Decimal
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    invoice_number: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def _build_receipt_response(receipt: Receipt) -> dict:
    return {
        "id": receipt.id,
        "company_id": receipt.company_id,
        "contact_id": receipt.contact_id,
        "invoice_id": receipt.invoice_id,
        "project_id": receipt.project_id,
        "receipt_number": receipt.receipt_number,
        "receipt_date": receipt.receipt_date,
        "amount": receipt.amount,
        "vat_amount": receipt.vat_amount,
        "total_amount": receipt.total_amount,
        "payment_method": receipt.payment_method,
        "payment_reference": receipt.payment_reference,
        "bank_account_id": receipt.bank_account_id,
        "status": receipt.status,
        "notes": receipt.notes,
        "wht_amount": receipt.wht_amount,
        "wht_rate": receipt.wht_rate,
        "contact_name": receipt.contact.name if receipt.contact else None,
        "project_name": receipt.project.name if receipt.project else None,
        "invoice_number": receipt.invoice.invoice_number if receipt.invoice else None,
        "created_at": receipt.created_at,
        "updated_at": receipt.updated_at,
    }


@router.post("", response_model=ReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(
    data: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate invoice
    invoice = db.query(Invoice).filter(
        Invoice.id == data.invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status in ["paid", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invoice already paid or cancelled")

    # Check amount doesn't exceed remaining
    remaining = invoice.total_amount - invoice.paid_amount
    if data.amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Amount exceeds remaining balance. Remaining: {remaining}"
        )

    # Validate project if provided
    if data.project_id:
        project = db.query(Project).filter(
            Project.id == data.project_id,
            Project.company_id == current_user.company_id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Generate receipt number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    receipt_number = numbering.get_next_number("RE", "RE")

    # Calculate amounts
    vat_amount = round(data.amount * invoice.vat_rate / Decimal("100"), 2)
    total_amount = data.amount - data.wht_amount

    receipt = Receipt(
        company_id=current_user.company_id,
        contact_id=invoice.contact_id,
        invoice_id=data.invoice_id,
        project_id=data.project_id,
        receipt_number=receipt_number,
        receipt_date=data.receipt_date,
        amount=data.amount,
        vat_amount=vat_amount,
        total_amount=total_amount,
        payment_method=data.payment_method,
        payment_reference=data.payment_reference,
        bank_account_id=data.bank_account_id,
        status="active",
        notes=data.notes,
        wht_amount=data.wht_amount,
        wht_rate=data.wht_rate,
    )
    db.add(receipt)

    # Update invoice
    invoice.paid_amount += data.amount
    if invoice.paid_amount >= invoice.total_amount:
        invoice.status = "paid"
    else:
        invoice.status = "partially_paid"

    db.commit()
    db.refresh(receipt)
    
    # Post to General Ledger
    try:
        gl_service = GLPostingService(db, str(current_user.company_id))
        gl_service.post_receipt(receipt)
        db.commit()
    except Exception:
        # GL posting failure shouldn't block receipt creation
        db.rollback()
    
    return _build_receipt_response(receipt)


@router.get("", response_model=List[ReceiptResponse])
def list_receipts(
    invoice_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Receipt).options(
        joinedload(Receipt.contact),
        joinedload(Receipt.project),
        joinedload(Receipt.invoice),
    ).filter(
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None),
    )

    if invoice_id:
        query = query.filter(Receipt.invoice_id == invoice_id)
    if project_id:
        query = query.filter(Receipt.project_id == project_id)
    if payment_method:
        query = query.filter(Receipt.payment_method == payment_method)
    if start_date:
        query = query.filter(Receipt.receipt_date >= start_date)
    if end_date:
        query = query.filter(Receipt.receipt_date <= end_date)

    receipts = query.order_by(Receipt.receipt_date.desc()).all()
    return [_build_receipt_response(r) for r in receipts]


@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(Receipt).options(
        joinedload(Receipt.contact),
        joinedload(Receipt.project),
        joinedload(Receipt.invoice),
    ).filter(
        Receipt.id == receipt_id,
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None),
    ).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return _build_receipt_response(receipt)


@router.put("/{receipt_id}", response_model=ReceiptResponse)
def update_receipt(
    receipt_id: UUID,
    data: ReceiptUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None),
    ).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    if receipt.status == "cancelled":
        raise HTTPException(status_code=400, detail="Cannot update cancelled receipt")

    # Update fields
    if data.receipt_date is not None:
        receipt.receipt_date = data.receipt_date
    if data.payment_method is not None:
        receipt.payment_method = data.payment_method
    if data.payment_reference is not None:
        receipt.payment_reference = data.payment_reference
    if data.bank_account_id is not None:
        receipt.bank_account_id = data.bank_account_id
    if data.notes is not None:
        receipt.notes = data.notes

    db.commit()
    db.refresh(receipt)
    return _build_receipt_response(receipt)


@router.delete("/{receipt_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_receipt(
    receipt_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    receipt = db.query(Receipt).filter(
        Receipt.id == receipt_id,
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None),
    ).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")

    # Reverse invoice paid amount
    invoice = db.query(Invoice).filter(Invoice.id == receipt.invoice_id).first()
    if invoice:
        invoice.paid_amount -= receipt.amount
        if invoice.paid_amount <= 0:
            invoice.status = "sent"
        else:
            invoice.status = "partially_paid"

    receipt.deleted_at = datetime.utcnow()
    db.commit()
    return None
