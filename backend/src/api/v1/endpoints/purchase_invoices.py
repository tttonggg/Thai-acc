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
from ....models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem
from ....models.contact import Contact
from ....models.project import Project
from ....models.purchase_order import PurchaseOrder
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class PurchaseInvoiceItemCreate(BaseModel):
    product_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class PurchaseInvoiceCreate(BaseModel):
    contact_id: UUID
    purchase_order_id: Optional[UUID] = None
    bill_date: date
    due_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    vat_rate: Decimal = Field(default=Decimal("7"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    items: List[PurchaseInvoiceItemCreate] = Field(..., min_length=1)


class PurchaseInvoiceUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    purchase_order_id: Optional[UUID] = None
    bill_date: Optional[date] = None
    due_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    items: Optional[List[PurchaseInvoiceItemCreate]] = None


class PurchaseInvoiceItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class PurchaseInvoiceResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    purchase_order_id: Optional[UUID]
    bill_number: str
    bill_date: date
    due_date: date
    status: str
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    paid_amount: Decimal
    notes: Optional[str]
    project_id: Optional[UUID]
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    purchase_order_number: Optional[str] = None
    items: List[PurchaseInvoiceItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseInvoiceStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|received|approved|partially_paid|paid|cancelled)$")


VALID_PURCHASE_INVOICE_TRANSITIONS = {
    "draft": {"draft", "received", "cancelled"},
    "received": {"received", "approved", "cancelled"},
    "approved": {"approved", "partially_paid", "paid", "cancelled"},
    "partially_paid": {"partially_paid", "paid", "cancelled"},
    "paid": {"paid"},
    "cancelled": {"cancelled"},
}


def _calculate_item_amount(item_data: PurchaseInvoiceItemCreate) -> Decimal:
    return (
        item_data.quantity
        * item_data.unit_price
        * (Decimal("1") - item_data.discount_percent / Decimal("100"))
    ).quantize(Decimal("0.0001"))


def _build_purchase_invoice_response(
    purchase_invoice: PurchaseInvoice,
    preloaded_items: Optional[List[PurchaseInvoiceItem]] = None,
) -> dict:
    items = preloaded_items if preloaded_items is not None else list(purchase_invoice.items)
    return {
        "id": purchase_invoice.id,
        "company_id": purchase_invoice.company_id,
        "contact_id": purchase_invoice.contact_id,
        "purchase_order_id": purchase_invoice.purchase_order_id,
        "bill_number": purchase_invoice.bill_number,
        "bill_date": purchase_invoice.bill_date,
        "due_date": purchase_invoice.due_date,
        "status": purchase_invoice.status,
        "subtotal": purchase_invoice.subtotal,
        "vat_rate": purchase_invoice.vat_rate,
        "vat_amount": purchase_invoice.vat_amount,
        "total_amount": purchase_invoice.total_amount,
        "discount_amount": purchase_invoice.discount_amount,
        "paid_amount": purchase_invoice.paid_amount,
        "notes": purchase_invoice.notes,
        "project_id": purchase_invoice.project_id,
        "contact_name": purchase_invoice.contact.name if purchase_invoice.contact else None,
        "project_name": purchase_invoice.project.name if purchase_invoice.project else None,
        "purchase_order_number": purchase_invoice.purchase_order.po_number if purchase_invoice.purchase_order else None,
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
        "created_at": purchase_invoice.created_at,
        "updated_at": purchase_invoice.updated_at,
    }


@router.post("", response_model=PurchaseInvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_invoice(
    data: PurchaseInvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact
    contact = db.query(Contact).filter(
        Contact.id == data.contact_id,
        Contact.company_id == current_user.company_id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project if provided
    if data.project_id:
        project = db.query(Project).filter(
            Project.id == data.project_id,
            Project.company_id == current_user.company_id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Validate purchase order if provided
    if data.purchase_order_id:
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.id == data.purchase_order_id,
            PurchaseOrder.company_id == current_user.company_id,
        ).first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")

    # Generate bill number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    bill_number = numbering.get_next_number("EX", "EX")

    # Calculate due date
    due_date = data.due_date
    if not due_date:
        due_date = data.bill_date + timedelta(days=30)

    # Calculate items and totals
    subtotal = Decimal("0")
    db_items = []
    for item_data in data.items:
        amount = _calculate_item_amount(item_data)
        subtotal += amount
        db_items.append(PurchaseInvoiceItem(
            product_id=item_data.product_id,
            description=item_data.description,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount_percent=item_data.discount_percent,
            amount=amount,
        ))

    vat_amount = round(subtotal * data.vat_rate / Decimal("100"), 2)
    total_amount = subtotal + vat_amount - data.discount_amount

    purchase_invoice = PurchaseInvoice(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        purchase_order_id=data.purchase_order_id,
        bill_number=bill_number,
        bill_date=data.bill_date,
        due_date=due_date,
        status="draft",
        subtotal=subtotal,
        vat_rate=data.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        discount_amount=data.discount_amount,
        paid_amount=Decimal("0"),
        notes=data.notes,
        project_id=data.project_id,
    )
    db.add(purchase_invoice)
    db.flush()

    for db_item in db_items:
        db_item.purchase_invoice_id = purchase_invoice.id
        db.add(db_item)

    db.commit()
    db.refresh(purchase_invoice)

    # Post to General Ledger
    try:
        gl_service = GLPostingService(db, str(current_user.company_id))
        gl_service.post_purchase_invoice(purchase_invoice)
        db.commit()
    except Exception:
        # GL posting failure shouldn't block purchase invoice creation
        db.rollback()

    return _build_purchase_invoice_response(purchase_invoice, db_items)


@router.get("", response_model=List[PurchaseInvoiceResponse])
def list_purchase_invoices(
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    is_overdue: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PurchaseInvoice).options(
        joinedload(PurchaseInvoice.items),
        joinedload(PurchaseInvoice.contact),
        joinedload(PurchaseInvoice.project),
        joinedload(PurchaseInvoice.purchase_order),
    ).filter(
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None),
    )

    if status:
        query = query.filter(PurchaseInvoice.status == status)
    if contact_id:
        query = query.filter(PurchaseInvoice.contact_id == contact_id)
    if project_id:
        query = query.filter(PurchaseInvoice.project_id == project_id)
    if is_overdue is not None and is_overdue:
        query = query.filter(
            PurchaseInvoice.due_date < date.today(),
            PurchaseInvoice.status.in_(["received", "approved", "partially_paid"]),
        )
    if search:
        query = query.filter(
            PurchaseInvoice.bill_number.ilike(f"%{search}%")
        )

    purchase_invoices = query.order_by(PurchaseInvoice.bill_date.desc()).all()
    return [_build_purchase_invoice_response(pi) for pi in purchase_invoices]


@router.get("/{purchase_invoice_id}", response_model=PurchaseInvoiceResponse)
def get_purchase_invoice(
    purchase_invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_invoice = db.query(PurchaseInvoice).options(
        joinedload(PurchaseInvoice.items),
        joinedload(PurchaseInvoice.contact),
        joinedload(PurchaseInvoice.project),
        joinedload(PurchaseInvoice.purchase_order),
    ).filter(
        PurchaseInvoice.id == purchase_invoice_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None),
    ).first()
    if not purchase_invoice:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")
    return _build_purchase_invoice_response(purchase_invoice)


@router.put("/{purchase_invoice_id}", response_model=PurchaseInvoiceResponse)
def update_purchase_invoice(
    purchase_invoice_id: UUID,
    data: PurchaseInvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_invoice = db.query(PurchaseInvoice).options(
        joinedload(PurchaseInvoice.contact),
        joinedload(PurchaseInvoice.project),
        joinedload(PurchaseInvoice.purchase_order),
    ).filter(
        PurchaseInvoice.id == purchase_invoice_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None),
    ).first()
    if not purchase_invoice:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")

    if purchase_invoice.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft purchase invoices can be updated")

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

    # Validate purchase order
    if "purchase_order_id" in update_data and update_data["purchase_order_id"] is not None:
        po = db.query(PurchaseOrder).filter(
            PurchaseOrder.id == update_data["purchase_order_id"],
            PurchaseOrder.company_id == current_user.company_id,
        ).first()
        if not po:
            raise HTTPException(status_code=404, detail="Purchase order not found")

    # Handle items replacement
    if "items" in update_data and update_data["items"] is not None:
        db.query(PurchaseInvoiceItem).filter(
            PurchaseInvoiceItem.purchase_invoice_id == purchase_invoice_id
        ).delete(synchronize_session=False)

        subtotal = Decimal("0")
        for item_data in update_data["items"]:
            quantity = Decimal(str(item_data["quantity"]))
            unit_price = Decimal(str(item_data["unit_price"]))
            discount_percent = Decimal(str(item_data["discount_percent"]))
            amount = (quantity * unit_price * (Decimal("1") - discount_percent / Decimal("100"))).quantize(Decimal("0.0001"))
            subtotal += amount
            db.add(PurchaseInvoiceItem(
                purchase_invoice_id=purchase_invoice_id,
                product_id=item_data.get("product_id"),
                description=item_data["description"],
                quantity=quantity,
                unit_price=unit_price,
                discount_percent=discount_percent,
                amount=amount,
            ))

        purchase_invoice.subtotal = subtotal
        vat_rate = Decimal(str(update_data.get("vat_rate", purchase_invoice.vat_rate)))
        discount_amount = Decimal(str(update_data.get("discount_amount", purchase_invoice.discount_amount)))
        purchase_invoice.vat_rate = vat_rate
        purchase_invoice.discount_amount = discount_amount
        purchase_invoice.vat_amount = round(subtotal * vat_rate / Decimal("100"), 2)
        purchase_invoice.total_amount = subtotal + purchase_invoice.vat_amount - discount_amount
        del update_data["items"]
    else:
        if "vat_rate" in update_data or "discount_amount" in update_data:
            vat_rate = Decimal(str(update_data.get("vat_rate", purchase_invoice.vat_rate)))
            discount_amount = Decimal(str(update_data.get("discount_amount", purchase_invoice.discount_amount)))
            purchase_invoice.vat_rate = vat_rate
            purchase_invoice.discount_amount = discount_amount
            purchase_invoice.vat_amount = round(purchase_invoice.subtotal * vat_rate / Decimal("100"), 2)
            purchase_invoice.total_amount = purchase_invoice.subtotal + purchase_invoice.vat_amount - discount_amount

    for field, value in update_data.items():
        if field in {"vat_rate", "discount_amount", "subtotal", "vat_amount", "total_amount"}:
            continue
        setattr(purchase_invoice, field, value)

    db.commit()
    db.refresh(purchase_invoice)
    return _build_purchase_invoice_response(purchase_invoice)


@router.put("/{purchase_invoice_id}/status", response_model=PurchaseInvoiceResponse)
def update_purchase_invoice_status(
    purchase_invoice_id: UUID,
    data: PurchaseInvoiceStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_invoice = db.query(PurchaseInvoice).options(
        joinedload(PurchaseInvoice.contact),
        joinedload(PurchaseInvoice.project),
        joinedload(PurchaseInvoice.purchase_order),
    ).filter(
        PurchaseInvoice.id == purchase_invoice_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None),
    ).first()
    if not purchase_invoice:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")

    if data.status not in VALID_PURCHASE_INVOICE_TRANSITIONS.get(purchase_invoice.status, set()):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status transition from '{purchase_invoice.status}' to '{data.status}'",
        )

    purchase_invoice.status = data.status
    db.commit()
    db.refresh(purchase_invoice)
    return _build_purchase_invoice_response(purchase_invoice)


@router.delete("/{purchase_invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_invoice(
    purchase_invoice_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_invoice = db.query(PurchaseInvoice).filter(
        PurchaseInvoice.id == purchase_invoice_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None),
    ).first()
    if not purchase_invoice:
        raise HTTPException(status_code=404, detail="Purchase invoice not found")

    if purchase_invoice.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft purchase invoices can be deleted")

    purchase_invoice.deleted_at = datetime.utcnow()
    db.commit()
    return None
