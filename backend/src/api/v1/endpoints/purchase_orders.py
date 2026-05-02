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
from ....models.purchase_order import PurchaseOrder, PurchaseOrderItem
from ....models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem
from ....models.contact import Contact
from ....models.project import Project
from ....services.document_numbering import DocumentNumberingService

router = APIRouter()


class PurchaseOrderItemCreate(BaseModel):
    product_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class PurchaseOrderCreate(BaseModel):
    contact_id: UUID
    order_date: date
    expected_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    vat_rate: Decimal = Field(default=Decimal("7"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    items: List[PurchaseOrderItemCreate] = Field(..., min_length=1)


class PurchaseOrderUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    order_date: Optional[date] = None
    expected_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    items: Optional[List[PurchaseOrderItemCreate]] = None


class PurchaseOrderItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class PurchaseOrderResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    po_number: str
    order_date: date
    expected_date: Optional[date]
    status: str
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    notes: Optional[str]
    project_id: Optional[UUID]
    converted_to_purchase_invoice_id: Optional[UUID]
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[PurchaseOrderItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|sent|confirmed|received|billed|cancelled)$")


VALID_PO_TRANSITIONS = {
    "draft": {"draft", "sent", "cancelled"},
    "sent": {"sent", "confirmed", "cancelled"},
    "confirmed": {"confirmed", "received", "cancelled"},
    "received": {"received", "billed", "cancelled"},
    "billed": {"billed"},
    "cancelled": {"cancelled"},
}


def _calculate_item_amount(item_data: PurchaseOrderItemCreate) -> Decimal:
    return (
        item_data.quantity
        * item_data.unit_price
        * (Decimal("1") - item_data.discount_percent / Decimal("100"))
    ).quantize(Decimal("0.0001"))


def _build_purchase_order_response(
    purchase_order: PurchaseOrder, preloaded_items: Optional[List[PurchaseOrderItem]] = None
) -> dict:
    items = preloaded_items if preloaded_items is not None else list(purchase_order.items)
    return {
        "id": purchase_order.id,
        "company_id": purchase_order.company_id,
        "contact_id": purchase_order.contact_id,
        "po_number": purchase_order.po_number,
        "order_date": purchase_order.order_date,
        "expected_date": purchase_order.expected_date,
        "status": purchase_order.status,
        "subtotal": purchase_order.subtotal,
        "vat_rate": purchase_order.vat_rate,
        "vat_amount": purchase_order.vat_amount,
        "total_amount": purchase_order.total_amount,
        "discount_amount": purchase_order.discount_amount,
        "notes": purchase_order.notes,
        "project_id": purchase_order.project_id,
        "converted_to_purchase_invoice_id": purchase_order.converted_to_purchase_invoice_id,
        "contact_name": purchase_order.contact.name if purchase_order.contact else None,
        "project_name": purchase_order.project.name if purchase_order.project else None,
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
        "created_at": purchase_order.created_at,
        "updated_at": purchase_order.updated_at,
    }


@router.post("", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact belongs to company
    contact = (
        db.query(Contact)
        .filter(Contact.id == data.contact_id, Contact.company_id == current_user.company_id)
        .first()
    )
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project if provided
    if data.project_id:
        project = (
            db.query(Project)
            .filter(Project.id == data.project_id, Project.company_id == current_user.company_id)
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Generate PO number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    po_number = numbering.get_next_number("PO", "PO")

    # Calculate items and totals
    subtotal = Decimal("0")
    db_items = []
    for item_data in data.items:
        amount = _calculate_item_amount(item_data)
        subtotal += amount
        db_items.append(
            PurchaseOrderItem(
                product_id=item_data.product_id,
                description=item_data.description,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                discount_percent=item_data.discount_percent,
                amount=amount,
            )
        )

    vat_amount = round(subtotal * data.vat_rate / Decimal("100"), 2)
    total_amount = subtotal + vat_amount - data.discount_amount

    purchase_order = PurchaseOrder(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        po_number=po_number,
        order_date=data.order_date,
        expected_date=data.expected_date,
        status="draft",
        subtotal=subtotal,
        vat_rate=data.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        discount_amount=data.discount_amount,
        notes=data.notes,
        project_id=data.project_id,
    )
    db.add(purchase_order)
    db.flush()  # Get purchase_order.id before adding items

    for db_item in db_items:
        db_item.purchase_order_id = purchase_order.id
        db.add(db_item)

    db.commit()
    db.refresh(purchase_order)
    return _build_purchase_order_response(purchase_order, db_items)


@router.get("", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.contact), joinedload(PurchaseOrder.project))
        .filter(
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
    )

    if status:
        query = query.filter(PurchaseOrder.status == status)
    if contact_id:
        query = query.filter(PurchaseOrder.contact_id == contact_id)
    if project_id:
        query = query.filter(PurchaseOrder.project_id == project_id)
    if search:
        query = query.filter(PurchaseOrder.po_number.ilike(f"%{search}%"))

    purchase_orders = query.order_by(PurchaseOrder.order_date.desc()).all()

    # Preload items to avoid N+1 with dynamic relationship
    po_ids = [po.id for po in purchase_orders]
    items_map: dict = {}
    if po_ids:
        all_items = db.query(PurchaseOrderItem).filter(PurchaseOrderItem.purchase_order_id.in_(po_ids)).all()
        for item in all_items:
            items_map.setdefault(item.purchase_order_id, []).append(item)

    return [_build_purchase_order_response(po, items_map.get(po.id, [])) for po in purchase_orders]


@router.get("/{po_id}", response_model=PurchaseOrderResponse)
def get_purchase_order(
    po_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_order = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.contact), joinedload(PurchaseOrder.project))
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
        .first()
    )
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return _build_purchase_order_response(purchase_order)


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    po_id: UUID,
    data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_order = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.contact), joinedload(PurchaseOrder.project))
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
        .first()
    )
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if purchase_order.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft purchase orders can be updated")

    update_data = data.model_dump(exclude_unset=True)

    # Validate contact if changing
    if "contact_id" in update_data:
        contact = (
            db.query(Contact)
            .filter(
                Contact.id == update_data["contact_id"],
                Contact.company_id == current_user.company_id,
            )
            .first()
        )
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project if changing
    if "project_id" in update_data and update_data["project_id"] is not None:
        project = (
            db.query(Project)
            .filter(
                Project.id == update_data["project_id"],
                Project.company_id == current_user.company_id,
            )
            .first()
        )
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Handle items replacement
    if "items" in update_data and update_data["items"] is not None:
        db.query(PurchaseOrderItem).filter(PurchaseOrderItem.purchase_order_id == po_id).delete(
            synchronize_session=False
        )

        subtotal = Decimal("0")
        for item_data in update_data["items"]:
            quantity = Decimal(str(item_data["quantity"]))
            unit_price = Decimal(str(item_data["unit_price"]))
            discount_percent = Decimal(str(item_data["discount_percent"]))
            amount = (
                quantity
                * unit_price
                * (Decimal("1") - discount_percent / Decimal("100"))
            ).quantize(Decimal("0.0001"))
            subtotal += amount
            db.add(
                PurchaseOrderItem(
                    purchase_order_id=po_id,
                    product_id=item_data.get("product_id"),
                    description=item_data["description"],
                    quantity=quantity,
                    unit_price=unit_price,
                    discount_percent=discount_percent,
                    amount=amount,
                )
            )

        purchase_order.subtotal = subtotal
        vat_rate = Decimal(str(update_data.get("vat_rate", purchase_order.vat_rate)))
        discount_amount = Decimal(str(update_data.get("discount_amount", purchase_order.discount_amount)))
        purchase_order.vat_rate = vat_rate
        purchase_order.discount_amount = discount_amount
        purchase_order.vat_amount = round(subtotal * vat_rate / Decimal("100"), 2)
        purchase_order.total_amount = subtotal + purchase_order.vat_amount - discount_amount

        del update_data["items"]
    else:
        # Recalculate with potentially new vat_rate or discount_amount
        if "vat_rate" in update_data or "discount_amount" in update_data:
            vat_rate = Decimal(str(update_data.get("vat_rate", purchase_order.vat_rate)))
            discount_amount = Decimal(str(update_data.get("discount_amount", purchase_order.discount_amount)))
            purchase_order.vat_rate = vat_rate
            purchase_order.discount_amount = discount_amount
            purchase_order.vat_amount = round(purchase_order.subtotal * vat_rate / Decimal("100"), 2)
            purchase_order.total_amount = purchase_order.subtotal + purchase_order.vat_amount - discount_amount

    # Update scalar fields
    for field, value in update_data.items():
        if field in {"vat_rate", "discount_amount", "subtotal", "vat_amount", "total_amount"}:
            continue
        setattr(purchase_order, field, value)

    db.commit()
    db.refresh(purchase_order)
    return _build_purchase_order_response(purchase_order)


@router.put("/{po_id}/status", response_model=PurchaseOrderResponse)
def update_purchase_order_status(
    po_id: UUID,
    data: PurchaseOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_order = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.contact), joinedload(PurchaseOrder.project))
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
        .first()
    )
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if data.status not in VALID_PO_TRANSITIONS.get(purchase_order.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{purchase_order.status}' to '{data.status}'",
        )

    purchase_order.status = data.status
    db.commit()
    db.refresh(purchase_order)
    return _build_purchase_order_response(purchase_order)


@router.delete("/{po_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_purchase_order(
    po_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_order = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
        .first()
    )
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if purchase_order.status not in ["draft", "sent"]:
        raise HTTPException(status_code=400, detail="Only draft or sent purchase orders can be deleted")

    purchase_order.deleted_at = datetime.utcnow()
    db.commit()
    return None


@router.post("/{po_id}/convert", response_model=PurchaseOrderResponse)
def convert_to_purchase_invoice(
    po_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    purchase_order = (
        db.query(PurchaseOrder)
        .options(joinedload(PurchaseOrder.contact), joinedload(PurchaseOrder.project))
        .filter(
            PurchaseOrder.id == po_id,
            PurchaseOrder.company_id == current_user.company_id,
            PurchaseOrder.deleted_at.is_(None),
        )
        .first()
    )
    if not purchase_order:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    if purchase_order.status != "received":
        raise HTTPException(status_code=400, detail="Only received purchase orders can be converted to purchase invoice")

    if purchase_order.converted_to_purchase_invoice_id:
        raise HTTPException(status_code=400, detail="Purchase order already converted")

    contact = purchase_order.contact
    bill_date = date.today()
    credit_days = int(contact.credit_days) if contact and contact.credit_days else 30
    due_date = bill_date + timedelta(days=credit_days)

    # Generate bill number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    bill_number = numbering.get_next_number("PI", "PI")

    # Create purchase invoice
    purchase_invoice = PurchaseInvoice(
        company_id=current_user.company_id,
        contact_id=purchase_order.contact_id,
        project_id=purchase_order.project_id,
        purchase_order_id=purchase_order.id,
        bill_number=bill_number,
        bill_date=bill_date,
        due_date=due_date,
        status="draft",
        subtotal=purchase_order.subtotal,
        vat_rate=purchase_order.vat_rate,
        vat_amount=purchase_order.vat_amount,
        total_amount=purchase_order.total_amount,
        discount_amount=purchase_order.discount_amount,
        paid_amount=Decimal("0"),
        notes=purchase_order.notes,
    )
    db.add(purchase_invoice)
    db.flush()

    # Copy items from PO
    for po_item in purchase_order.items:
        db.add(
            PurchaseInvoiceItem(
                purchase_invoice_id=purchase_invoice.id,
                product_id=po_item.product_id,
                description=po_item.description,
                quantity=po_item.quantity,
                unit_price=po_item.unit_price,
                discount_percent=po_item.discount_percent,
                amount=po_item.amount,
            )
        )

    # Update PO status and link
    purchase_order.status = "billed"
    purchase_order.converted_to_purchase_invoice_id = purchase_invoice.id

    db.commit()
    db.refresh(purchase_order)
    return _build_purchase_order_response(purchase_order)
