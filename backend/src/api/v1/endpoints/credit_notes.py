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
from ....models.credit_note import CreditNote, CreditNoteItem
from ....models.contact import Contact
from ....models.invoice import Invoice
from ....models.project import Project
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class CreditNoteItemCreate(BaseModel):
    product_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)


class CreditNoteCreate(BaseModel):
    contact_id: UUID
    invoice_id: Optional[UUID] = None
    issue_date: date
    note_type: str = Field(default="sales_credit", pattern="^(sales_credit|sales_debit)$")
    project_id: Optional[UUID] = None
    reason: Optional[str] = None
    vat_rate: Decimal = Field(default=Decimal("7"), ge=0, le=100)
    currency_code: str = Field(default="THB", pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Decimal = Field(default=Decimal("1"), gt=0)
    items: List[CreditNoteItemCreate] = Field(..., min_length=1)


class CreditNoteUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    invoice_id: Optional[UUID] = None
    issue_date: Optional[date] = None
    note_type: Optional[str] = Field(None, pattern="^(sales_credit|sales_debit)$")
    project_id: Optional[UUID] = None
    reason: Optional[str] = None
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    currency_code: Optional[str] = Field(None, pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Optional[Decimal] = Field(None, gt=0)
    items: Optional[List[CreditNoteItemCreate]] = None


class CreditNoteItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    description: str
    quantity: Decimal
    unit_price: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class CreditNoteResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    invoice_id: Optional[UUID]
    document_number: str
    issue_date: date
    note_type: str
    status: str
    currency_code: str
    exchange_rate: Decimal
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    reason: Optional[str]
    confirmed_at: Optional[date]
    created_at: datetime
    updated_at: datetime
    created_by: Optional[UUID]
    updated_by: Optional[UUID]
    items: List[CreditNoteItemResponse]
    contact_name: Optional[str] = None
    invoice_number: Optional[str] = None

    class Config:
        from_attributes = True


def _calculate_totals(items_data: list, vat_rate: Decimal) -> tuple:
    subtotal = Decimal("0")
    for item in items_data:
        amount = item.quantity * item.unit_price
        subtotal += amount
    vat_amount = round(subtotal * vat_rate / Decimal("100"), 2)
    total_amount = subtotal + vat_amount
    return subtotal, vat_amount, total_amount


def _get_prefix(note_type: str) -> str:
    return "CN" if note_type == "sales_credit" else "DN"


@router.get("/", response_model=List[CreditNoteResponse])
def list_credit_notes(
    note_type: Optional[str] = None,
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    )

    if note_type:
        query = query.filter(CreditNote.note_type == note_type)
    if status:
        query = query.filter(CreditNote.status == status)
    if contact_id:
        query = query.filter(CreditNote.contact_id == contact_id)
    if search:
        query = query.filter(CreditNote.document_number.ilike(f"%{search}%"))

    notes = query.order_by(CreditNote.issue_date.desc(), CreditNote.created_at.desc()).all()

    result = []
    for note in notes:
        data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
        data["items"] = [
            {c.name: getattr(item, c.name) for c in item.__table__.columns}
            for item in note.items if item.deleted_at is None
        ]
        data["contact_name"] = note.contact.name if note.contact else None
        data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
        result.append(CreditNoteResponse(**data))
    return result


@router.post("/", response_model=CreditNoteResponse, status_code=status.HTTP_201_CREATED)
def create_credit_note(
    data: CreditNoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact
    contact = db.query(Contact).filter(
        Contact.id == data.contact_id,
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Validate invoice if provided
    if data.invoice_id:
        invoice = db.query(Invoice).filter(
            Invoice.id == data.invoice_id,
            Invoice.company_id == current_user.company_id,
            Invoice.deleted_at.is_(None)
        ).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

    subtotal, vat_amount, total_amount = _calculate_totals(data.items, data.vat_rate)

    prefix = _get_prefix(data.note_type)
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    doc_number = numbering.get_next_number(prefix, prefix)

    note = CreditNote(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        invoice_id=data.invoice_id,
        document_number=doc_number,
        issue_date=data.issue_date,
        note_type=data.note_type,
        status="draft",
        currency_code=data.currency_code,
        exchange_rate=data.exchange_rate,
        subtotal=subtotal,
        vat_rate=data.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        reason=data.reason,
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(note)
    db.flush()

    for item_data in data.items:
        db.add(CreditNoteItem(
            credit_note_id=note.id,
            product_id=item_data.product_id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            amount=item_data.quantity * item_data.unit_price,
            created_by=current_user.id,
            updated_by=current_user.id,
        ))

    db.commit()
    db.refresh(note)

    # Reload with relationships
    note = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(CreditNote.id == note.id).first()

    data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
    data["items"] = [
        {c.name: getattr(item, c.name) for c in item.__table__.columns}
        for item in note.items if item.deleted_at is None
    ]
    data["contact_name"] = note.contact.name if note.contact else None
    data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
    return CreditNoteResponse(**data)


@router.get("/{note_id}", response_model=CreditNoteResponse)
def get_credit_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(
        CreditNote.id == note_id,
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Credit note not found")

    data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
    data["items"] = [
        {c.name: getattr(item, c.name) for c in item.__table__.columns}
        for item in note.items if item.deleted_at is None
    ]
    data["contact_name"] = note.contact.name if note.contact else None
    data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
    return CreditNoteResponse(**data)


@router.put("/{note_id}", response_model=CreditNoteResponse)
def update_credit_note(
    note_id: UUID,
    data: CreditNoteUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CreditNote).options(
        joinedload(CreditNote.items),
    ).filter(
        CreditNote.id == note_id,
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    if note.status != "draft":
        raise HTTPException(status_code=400, detail="Can only edit draft credit notes")

    if data.contact_id:
        contact = db.query(Contact).filter(
            Contact.id == data.contact_id,
            Contact.company_id == current_user.company_id,
            Contact.deleted_at.is_(None)
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        note.contact_id = data.contact_id

    if data.invoice_id is not None:
        if data.invoice_id:
            invoice = db.query(Invoice).filter(
                Invoice.id == data.invoice_id,
                Invoice.company_id == current_user.company_id,
                Invoice.deleted_at.is_(None)
            ).first()
            if not invoice:
                raise HTTPException(status_code=404, detail="Invoice not found")
        note.invoice_id = data.invoice_id

    if data.issue_date:
        note.issue_date = data.issue_date
    if data.note_type:
        note.note_type = data.note_type
    if data.reason is not None:
        note.reason = data.reason
    if data.vat_rate is not None:
        note.vat_rate = data.vat_rate
    if data.currency_code:
        note.currency_code = data.currency_code
    if data.exchange_rate is not None:
        note.exchange_rate = data.exchange_rate

    # Update line items if provided
    if data.items is not None:
        # Delete existing items
        for item in note.items:
            item.deleted_at = datetime.utcnow()

        subtotal, vat_amount, total_amount = _calculate_totals(data.items, data.vat_rate if data.vat_rate is not None else note.vat_rate)
        note.subtotal = subtotal
        note.vat_amount = vat_amount
        note.total_amount = total_amount

        for item_data in data.items:
            db.add(CreditNoteItem(
                credit_note_id=note.id,
                product_id=item_data.product_id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                amount=item_data.quantity * item_data.unit_price,
                created_by=current_user.id,
                updated_by=current_user.id,
            ))
    elif data.vat_rate is not None and data.items is None:
        # Recalculate with new VAT rate
        items = [item for item in note.items if item.deleted_at is None]
        subtotal = sum(item.amount for item in items)
        vat_amount = round(subtotal * data.vat_rate / Decimal("100"), 2)
        note.subtotal = subtotal
        note.vat_amount = vat_amount
        note.total_amount = subtotal + vat_amount

    note.updated_by = current_user.id
    db.commit()
    db.refresh(note)

    note = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(CreditNote.id == note.id).first()

    data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
    data["items"] = [
        {c.name: getattr(item, c.name) for c in item.__table__.columns}
        for item in note.items if item.deleted_at is None
    ]
    data["contact_name"] = note.contact.name if note.contact else None
    data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
    return CreditNoteResponse(**data)


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credit_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CreditNote).filter(
        CreditNote.id == note_id,
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    if note.status == "confirmed":
        raise HTTPException(status_code=400, detail="Cannot delete confirmed credit note")

    note.deleted_at = datetime.utcnow()
    for item in note.items:
        item.deleted_at = datetime.utcnow()

    db.commit()
    return None


@router.post("/{note_id}/confirm", response_model=CreditNoteResponse)
def confirm_credit_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CreditNote).options(
        joinedload(CreditNote.items),
    ).filter(
        CreditNote.id == note_id,
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    if note.status != "draft":
        raise HTTPException(status_code=400, detail="Can only confirm draft credit notes")

    note.status = "confirmed"
    note.confirmed_at = datetime.utcnow()
    note.updated_by = current_user.id

    # Post GL
    gl_service = GLPostingService(db, str(current_user.company_id))
    try:
        if note.note_type == "sales_credit":
            gl_service.post_sales_credit_note(note)
        else:
            gl_service.post_sales_debit_note(note)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GL posting failed: {str(e)}")

    db.commit()
    db.refresh(note)

    note = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(CreditNote.id == note.id).first()

    data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
    data["items"] = [
        {c.name: getattr(item, c.name) for c in item.__table__.columns}
        for item in note.items if item.deleted_at is None
    ]
    data["contact_name"] = note.contact.name if note.contact else None
    data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
    return CreditNoteResponse(**data)


@router.post("/{note_id}/cancel", response_model=CreditNoteResponse)
def cancel_credit_note(
    note_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    note = db.query(CreditNote).options(
        joinedload(CreditNote.items),
    ).filter(
        CreditNote.id == note_id,
        CreditNote.company_id == current_user.company_id,
        CreditNote.deleted_at.is_(None)
    ).first()

    if not note:
        raise HTTPException(status_code=404, detail="Credit note not found")
    if note.status != "confirmed":
        raise HTTPException(status_code=400, detail="Can only cancel confirmed credit notes")

    note.status = "cancelled"
    note.updated_by = current_user.id

    # Reverse GL by posting opposite entry
    gl_service = GLPostingService(db, str(current_user.company_id))
    try:
        if note.note_type == "sales_credit":
            gl_service.reverse_sales_credit_note(note)
        else:
            gl_service.reverse_sales_debit_note(note)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"GL reversal failed: {str(e)}")

    db.commit()
    db.refresh(note)

    note = db.query(CreditNote).options(
        joinedload(CreditNote.contact),
        joinedload(CreditNote.invoice),
        joinedload(CreditNote.items),
    ).filter(CreditNote.id == note.id).first()

    data = {c.name: getattr(note, c.name) for c in note.__table__.columns}
    data["items"] = [
        {c.name: getattr(item, c.name) for c in item.__table__.columns}
        for item in note.items if item.deleted_at is None
    ]
    data["contact_name"] = note.contact.name if note.contact else None
    data["invoice_number"] = note.invoice.invoice_number if note.invoice else None
    return CreditNoteResponse(**data)
