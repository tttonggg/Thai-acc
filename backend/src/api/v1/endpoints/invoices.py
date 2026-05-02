from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime, timedelta

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.invoice import Invoice, InvoiceItem
from ....models.contact import Contact
from ....models.project import Project
from ....models.quotation import Quotation
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class InvoiceItemCreate(BaseModel):
    product_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class InvoiceCreate(BaseModel):
    contact_id: UUID
    quotation_id: Optional[UUID] = None
    issue_date: date
    due_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    vat_rate: Decimal = Field(default=Decimal("7"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    currency_code: str = Field(default="THB", pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Decimal = Field(default=Decimal("1"), gt=0)
    items: List[InvoiceItemCreate] = Field(..., min_length=1)


class InvoiceUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    currency_code: Optional[str] = Field(None, pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Optional[Decimal] = Field(None, gt=0)
    items: Optional[List[InvoiceItemCreate]] = None


class InvoiceItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    quotation_id: Optional[UUID]
    invoice_number: str
    tax_invoice_number: Optional[str]
    issue_date: date
    due_date: date
    status: str
    currency_code: str
    exchange_rate: Decimal
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    paid_amount: Decimal
    notes: Optional[str]
    terms: Optional[str]
    project_id: Optional[UUID]
    is_e_tax: str
    e_tax_status: Optional[str]
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[InvoiceItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InvoiceStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|sent|paid|partially_paid|overdue|cancelled)$")


VALID_INVOICE_TRANSITIONS = {
    "draft": {"draft", "sent", "cancelled"},
    "sent": {"sent", "paid", "partially_paid", "overdue", "cancelled"},
    "partially_paid": {"partially_paid", "paid", "overdue", "cancelled"},
    "overdue": {"overdue", "paid", "partially_paid", "cancelled"},
    "paid": {"paid"},
    "cancelled": {"cancelled"},
}


def _calculate_item_amount(item_data: InvoiceItemCreate) -> Decimal:
    return (
        item_data.quantity
        * item_data.unit_price
        * (Decimal("1") - item_data.discount_percent / Decimal("100"))
    ).quantize(Decimal("0.0001"))


def _build_invoice_response(invoice: Invoice, preloaded_items: Optional[List[InvoiceItem]] = None) -> dict:
    items = preloaded_items if preloaded_items is not None else list(invoice.items)
    return {
        "id": invoice.id,
        "company_id": invoice.company_id,
        "contact_id": invoice.contact_id,
        "quotation_id": invoice.quotation_id,
        "invoice_number": invoice.invoice_number,
        "tax_invoice_number": invoice.tax_invoice_number,
        "issue_date": invoice.issue_date,
        "due_date": invoice.due_date,
        "status": invoice.status,
        "currency_code": invoice.currency_code,
        "exchange_rate": invoice.exchange_rate,
        "subtotal": invoice.subtotal,
        "vat_rate": invoice.vat_rate,
        "vat_amount": invoice.vat_amount,
        "total_amount": invoice.total_amount,
        "discount_amount": invoice.discount_amount,
        "paid_amount": invoice.paid_amount,
        "notes": invoice.notes,
        "terms": invoice.terms,
        "project_id": invoice.project_id,
        "is_e_tax": invoice.is_e_tax,
        "e_tax_status": invoice.e_tax_status,
        "contact_name": invoice.contact.name if invoice.contact else None,
        "project_name": invoice.project.name if invoice.project else None,
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "description": item.description,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "discount_percent": item.discount_percent,
                "amount": item.amount,
            }
            for item in items
        ],
        "created_at": invoice.created_at,
        "updated_at": invoice.updated_at,
    }


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact
    contact = db.query(Contact).filter(
        Contact.id == data.contact_id,
        Contact.company_id == current_user.company_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project if provided
    if data.project_id:
        project = db.query(Project).filter(
            Project.id == data.project_id,
            Project.company_id == current_user.company_id
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Handle quotation conversion
    quotation = None
    if data.quotation_id:
        quotation = db.query(Quotation).filter(
            Quotation.id == data.quotation_id,
            Quotation.company_id == current_user.company_id,
            Quotation.status == "accepted"
        ).first()
        if not quotation:
            raise HTTPException(status_code=404, detail="Quotation not found or not accepted")

    # Generate invoice number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    invoice_number = numbering.get_next_number("IV", "IV")

    # Calculate due date
    due_date = data.due_date
    if not due_date:
        credit_days = int(contact.credit_days) if contact.credit_days else 30
        due_date = data.issue_date + timedelta(days=credit_days)

    # Calculate items and totals
    if quotation and not data.items:
        # Copy from quotation
        items_data = []
        for q_item in quotation.items:
            items_data.append(InvoiceItemCreate(
                product_id=q_item.product_id,
                description=q_item.description,
                quantity=q_item.quantity,
                unit_price=q_item.unit_price,
                discount_percent=q_item.discount_percent,
            ))
    else:
        items_data = data.items

    subtotal = Decimal("0")
    db_items = []
    for item_data in items_data:
        amount = _calculate_item_amount(item_data)
        subtotal += amount
        db_items.append(InvoiceItem(
            product_id=item_data.product_id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount_percent=item_data.discount_percent,
            amount=amount,
        ))

    vat_amount = round(subtotal * data.vat_rate / Decimal("100"), 2)
    total_amount = subtotal + vat_amount - data.discount_amount

    invoice = Invoice(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        quotation_id=data.quotation_id,
        invoice_number=invoice_number,
        issue_date=data.issue_date,
        due_date=due_date,
        status="draft",
        currency_code=data.currency_code,
        exchange_rate=data.exchange_rate,
        subtotal=subtotal,
        vat_rate=data.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        discount_amount=data.discount_amount,
        paid_amount=Decimal("0"),
        notes=data.notes,
        terms=data.terms,
        project_id=data.project_id,
    )
    db.add(invoice)
    db.flush()

    for db_item in db_items:
        db_item.invoice_id = invoice.id
        db.add(db_item)

    # Mark quotation as converted
    if quotation:
        quotation.status = "converted"
        quotation.converted_to_invoice_id = invoice.id

    db.commit()
    db.refresh(invoice)
    
    # Post to General Ledger
    try:
        gl_service = GLPostingService(db, str(current_user.company_id))
        gl_service.post_invoice(invoice)
        db.commit()
    except Exception:
        # GL posting failure shouldn't block invoice creation
        db.rollback()
    
    return _build_invoice_response(invoice, db_items)


@router.get("", response_model=List[InvoiceResponse])
def list_invoices(
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    e_tax_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice).options(
        joinedload(Invoice.contact), joinedload(Invoice.project)
    ).filter(
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None)
    )

    if status:
        query = query.filter(Invoice.status == status)
    if contact_id:
        query = query.filter(Invoice.contact_id == contact_id)
    if project_id:
        query = query.filter(Invoice.project_id == project_id)
    if is_overdue is not None and is_overdue:
        query = query.filter(Invoice.due_date < date.today(), Invoice.status.in_(["sent", "partially_paid"]))
    if search:
        query = query.filter(
            Invoice.invoice_number.ilike(f"%{search}%")
        )
    if e_tax_status:
        if e_tax_status == "pending":
            query = query.filter(Invoice.e_tax_xml.is_(None), Invoice.e_tax_error.is_(None))
        elif e_tax_status == "generated":
            query = query.filter(Invoice.e_tax_xml.isnot(None), Invoice.e_tax_submitted_at.is_(None), Invoice.e_tax_error.is_(None))
        elif e_tax_status == "submitted":
            query = query.filter(Invoice.e_tax_submitted_at.isnot(None), Invoice.e_tax_timestamp.is_(None), Invoice.e_tax_error.is_(None))
        elif e_tax_status == "confirmed":
            query = query.filter(Invoice.e_tax_timestamp.isnot(None), Invoice.e_tax_error.is_(None))
        elif e_tax_status == "failed":
            query = query.filter(Invoice.e_tax_error.isnot(None))

    invoices = query.order_by(Invoice.issue_date.desc()).all()

    # Preload items
    invoice_ids = [i.id for i in invoices]
    items_map = {}
    if invoice_ids:
        all_items = db.query(InvoiceItem).filter(InvoiceItem.invoice_id.in_(invoice_ids)).all()
        for item in all_items:
            items_map.setdefault(item.invoice_id, []).append(item)

    return [_build_invoice_response(i, items_map.get(i.id, [])) for i in invoices]


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.contact), joinedload(Invoice.project)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return _build_invoice_response(invoice)


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: UUID,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.contact), joinedload(Invoice.project)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status in ["paid", "cancelled"]:
        raise HTTPException(status_code=400, detail="Cannot update paid or cancelled invoice")

    update_data = data.model_dump(exclude_unset=True)

    # Validate contact
    if "contact_id" in update_data:
        contact = db.query(Contact).filter(
            Contact.id == update_data["contact_id"],
            Contact.company_id == current_user.company_id,
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project
    if "project_id" in update_data and update_data["project_id"] is not None:
        project = db.query(Project).filter(
            Project.id == update_data["project_id"],
            Project.company_id == current_user.company_id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Handle currency update
    if "currency_code" in update_data:
        invoice.currency_code = update_data.pop("currency_code")
    if "exchange_rate" in update_data:
        invoice.exchange_rate = Decimal(str(update_data.pop("exchange_rate")))

    # Handle items replacement
    if "items" in update_data and update_data["items"] is not None:
        db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice_id).delete(synchronize_session=False)

        subtotal = Decimal("0")
        for item_data in update_data["items"]:
            quantity = Decimal(str(item_data["quantity"]))
            unit_price = Decimal(str(item_data["unit_price"]))
            discount_percent = Decimal(str(item_data["discount_percent"]))
            amount = (quantity * unit_price * (Decimal("1") - discount_percent / Decimal("100"))).quantize(Decimal("0.0001"))
            subtotal += amount
            db.add(InvoiceItem(
                invoice_id=invoice_id,
                product_id=item_data.get("product_id"),
                description=item_data["description"],
                quantity=quantity,
                unit_price=unit_price,
                discount_percent=discount_percent,
                amount=amount,
            ))

        invoice.subtotal = subtotal
        vat_rate = Decimal(str(update_data.get("vat_rate", invoice.vat_rate)))
        discount_amount = Decimal(str(update_data.get("discount_amount", invoice.discount_amount)))
        invoice.vat_rate = vat_rate
        invoice.discount_amount = discount_amount
        invoice.vat_amount = round(subtotal * vat_rate / Decimal("100"), 2)
        invoice.total_amount = subtotal + invoice.vat_amount - discount_amount
        del update_data["items"]
    else:
        if "vat_rate" in update_data or "discount_amount" in update_data:
            vat_rate = Decimal(str(update_data.get("vat_rate", invoice.vat_rate)))
            discount_amount = Decimal(str(update_data.get("discount_amount", invoice.discount_amount)))
            invoice.vat_rate = vat_rate
            invoice.discount_amount = discount_amount
            invoice.vat_amount = round(invoice.subtotal * vat_rate / Decimal("100"), 2)
            invoice.total_amount = invoice.subtotal + invoice.vat_amount - discount_amount

    for field, value in update_data.items():
        if field in {"vat_rate", "discount_amount", "subtotal", "vat_amount", "total_amount"}:
            continue
        setattr(invoice, field, value)

    db.commit()
    db.refresh(invoice)
    return _build_invoice_response(invoice)


@router.put("/{invoice_id}/status", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: UUID,
    data: InvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).options(
        joinedload(Invoice.contact), joinedload(Invoice.project)
    ).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if data.status not in VALID_INVOICE_TRANSITIONS.get(invoice.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from '{invoice.status}' to '{data.status}'",
        )

    invoice.status = data.status
    db.commit()
    db.refresh(invoice)
    return _build_invoice_response(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_invoice(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.status not in ["draft", "cancelled"]:
        raise HTTPException(status_code=400, detail="Only draft or cancelled invoices can be deleted")

    invoice.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ============================================================
# e-Tax Invoice
# ============================================================

from ....services.e_tax import ETaxService
from ....models.e_tax_submission import ETaxSubmission
from ....models.company import Company


class ETaxGenerateResponse(BaseModel):
    invoice_id: UUID
    e_tax_status: str
    xml_payload: str


class ETaxSubmitResponse(BaseModel):
    invoice_id: UUID
    e_tax_status: str
    timestamp: Optional[str]
    message: str


class ETaxHistoryItem(BaseModel):
    id: UUID
    submission_type: str
    status: str
    timestamp: Optional[str]
    response_message: Optional[str]
    error_message: Optional[str]
    submitted_at: Optional[date]

    class Config:
        from_attributes = True


@router.post("/{invoice_id}/e-tax/generate", response_model=ETaxGenerateResponse)
def generate_e_tax(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate e-Tax XML for an invoice."""
    invoice = db.query(Invoice).options(
        joinedload(Invoice.contact),
        joinedload(Invoice.project),
    ).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    company = db.query(Company).filter(
        Company.id == current_user.company_id,
    ).first()

    # Build seller info
    seller = {
        "name": company.name,
        "tax_id": company.tax_id,
        "branch": company.branch_number or "00000",
        "address": company.address or "",
        "phone": company.phone or "",
        "email": company.email or "",
    }

    # Build buyer info
    buyer = {
        "name": invoice.contact.name,
        "tax_id": invoice.contact.tax_id or "N/A",
        "branch": invoice.contact.branch_number or "00000",
        "address": invoice.contact.address or "",
    }

    # Build items
    items_data = []
    for item in invoice.items:
        items_data.append({
            "description": item.description,
            "quantity": str(item.quantity),
            "unit_price": str(item.unit_price),
            "amount": str(item.amount),
            "vat_rate": str(invoice.vat_rate),
            "vat_amount": str(round(item.amount * invoice.vat_rate / Decimal("100"), 2)),
            "total_amount": str(item.amount + round(item.amount * invoice.vat_rate / Decimal("100"), 2)),
        })

    # Generate XML
    service = ETaxService()
    xml = service.generate_xml(
        invoice_number=invoice.invoice_number,
        tax_invoice_number=invoice.tax_invoice_number or invoice.invoice_number,
        issue_date=invoice.issue_date,
        seller=seller,
        buyer=buyer,
        items=items_data,
        subtotal=invoice.subtotal,
        vat_rate=invoice.vat_rate,
        vat_amount=invoice.vat_amount,
        total_amount=invoice.total_amount,
        discount_amount=invoice.discount_amount,
    )

    # Update invoice
    invoice.e_tax_xml = xml
    invoice.e_tax_status = "generated"
    db.commit()

    return ETaxGenerateResponse(
        invoice_id=invoice.id,
        e_tax_status="generated",
        xml_payload=xml,
    )


@router.post("/{invoice_id}/e-tax/submit", response_model=ETaxSubmitResponse)
def submit_e_tax(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit e-Tax XML to Revenue Department."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.e_tax_xml:
        raise HTTPException(status_code=400, detail="Please generate e-Tax XML first")

    # Submit via adapter
    service = ETaxService()
    result = service.submit(invoice.e_tax_xml, invoice.invoice_number)

    if result["success"]:
        invoice.e_tax_status = "submitted"
        invoice.e_tax_timestamp = result.get("timestamp")
        invoice.e_tax_submitted_at = date.today()
        invoice.e_tax_error = None
    else:
        invoice.e_tax_status = "failed"
        invoice.e_tax_error = result.get("error")

    db.commit()

    # Record submission history
    submission = ETaxSubmission(
        company_id=current_user.company_id,
        invoice_id=invoice.id,
        submission_type=service.adapter.get_name(),
        status="submitted" if result["success"] else "failed",
        xml_payload=invoice.e_tax_xml,
        timestamp=result.get("timestamp"),
        response_message=result.get("message"),
        error_message=result.get("error"),
        submitted_at=date.today(),
    )
    db.add(submission)
    db.commit()

    return ETaxSubmitResponse(
        invoice_id=invoice.id,
        e_tax_status=invoice.e_tax_status,
        timestamp=result.get("timestamp"),
        message=result.get("message", ""),
    )


@router.get("/{invoice_id}/e-tax/xml")
def download_e_tax_xml(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download e-Tax XML file."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if not invoice.e_tax_xml:
        raise HTTPException(status_code=404, detail="e-Tax XML not generated yet")

    from fastapi.responses import PlainTextResponse
    return PlainTextResponse(
        content=invoice.e_tax_xml,
        media_type="application/xml",
        headers={"Content-Disposition": f'attachment; filename="etax_{invoice.invoice_number}.xml"'},
    )


@router.get("/{invoice_id}/e-tax/history", response_model=List[ETaxHistoryItem])
def e_tax_history(
    invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get e-Tax submission history for an invoice."""
    invoice = db.query(Invoice).filter(
        Invoice.id == invoice_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None),
    ).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    submissions = db.query(ETaxSubmission).filter(
        ETaxSubmission.invoice_id == invoice_id,
        ETaxSubmission.company_id == current_user.company_id,
    ).order_by(ETaxSubmission.created_at.desc()).all()

    return submissions
