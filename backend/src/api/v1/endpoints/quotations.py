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
from ....models.quotation import Quotation, QuotationItem
from ....models.contact import Contact
from ....models.project import Project
from ....services.document_numbering import DocumentNumberingService

router = APIRouter()


class QuotationItemCreate(BaseModel):
    product_id: Optional[UUID] = None
    description: str = Field(..., min_length=1, max_length=500)
    quantity: Decimal = Field(default=Decimal("1"), gt=0)
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    discount_percent: Decimal = Field(default=Decimal("0"), ge=0, le=100)


class QuotationCreate(BaseModel):
    contact_id: UUID
    issue_date: date
    expiry_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    currency_code: str = Field(default="THB", max_length=3)
    exchange_rate: Decimal = Field(default=Decimal("1"), gt=0)
    vat_rate: Decimal = Field(default=Decimal("7"), ge=0, le=100)
    discount_amount: Decimal = Field(default=Decimal("0"), ge=0)
    items: List[QuotationItemCreate] = Field(..., min_length=1)


class QuotationUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    project_id: Optional[UUID] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    vat_rate: Optional[Decimal] = Field(None, ge=0, le=100)
    discount_amount: Optional[Decimal] = Field(None, ge=0)
    items: Optional[List[QuotationItemCreate]] = None


class QuotationItemResponse(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    description: str
    quantity: Decimal
    unit_price: Decimal
    discount_percent: Decimal
    amount: Decimal

    class Config:
        from_attributes = True


class QuotationResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    quotation_number: str
    issue_date: date
    expiry_date: Optional[date]
    status: str
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    discount_amount: Decimal
    currency_code: str
    exchange_rate: Decimal
    notes: Optional[str]
    terms: Optional[str]
    project_id: Optional[UUID]
    converted_to_invoice_id: Optional[UUID]
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    items: List[QuotationItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|sent|accepted|rejected|converted)$")


VALID_STATUS_TRANSITIONS = {
    "draft": {"draft", "sent"},
    "sent": {"sent", "accepted", "rejected"},
    "accepted": {"accepted", "converted"},
    "rejected": {"rejected"},
    "converted": {"converted"},
}


def _calculate_item_amount(item_data: QuotationItemCreate) -> Decimal:
    return (
        item_data.quantity
        * item_data.unit_price
        * (Decimal("1") - item_data.discount_percent / Decimal("100"))
    ).quantize(Decimal("0.0001"))


def _build_quotation_response(
    quotation: Quotation, preloaded_items: Optional[List[QuotationItem]] = None
) -> dict:
    items = preloaded_items if preloaded_items is not None else list(quotation.items)
    return {
        "id": quotation.id,
        "company_id": quotation.company_id,
        "contact_id": quotation.contact_id,
        "quotation_number": quotation.quotation_number,
        "issue_date": quotation.issue_date,
        "expiry_date": quotation.expiry_date,
        "status": quotation.status,
        "subtotal": quotation.subtotal,
        "vat_rate": quotation.vat_rate,
        "vat_amount": quotation.vat_amount,
        "total_amount": quotation.total_amount,
        "discount_amount": quotation.discount_amount,
        "currency_code": quotation.currency_code,
        "exchange_rate": quotation.exchange_rate,
        "notes": quotation.notes,
        "terms": quotation.terms,
        "project_id": quotation.project_id,
        "converted_to_invoice_id": quotation.converted_to_invoice_id,
        "contact_name": quotation.contact.name if quotation.contact else None,
        "project_name": quotation.project.name if quotation.project else None,
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
        "created_at": quotation.created_at,
        "updated_at": quotation.updated_at,
    }


@router.post("", response_model=QuotationResponse, status_code=status.HTTP_201_CREATED)
def create_quotation(
    data: QuotationCreate,
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

    # Generate quotation number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    quotation_number = numbering.get_next_number("QT", "QT")

    # Calculate items and totals
    subtotal = Decimal("0")
    db_items = []
    for item_data in data.items:
        amount = _calculate_item_amount(item_data)
        subtotal += amount
        db_items.append(
            QuotationItem(
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

    quotation = Quotation(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        quotation_number=quotation_number,
        issue_date=data.issue_date,
        expiry_date=data.expiry_date,
        status="draft",
        currency_code=data.currency_code,
        exchange_rate=data.exchange_rate,
        subtotal=subtotal,
        vat_rate=data.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        discount_amount=data.discount_amount,
        notes=data.notes,
        terms=data.terms,
        project_id=data.project_id,
    )
    db.add(quotation)
    db.flush()  # Get quotation.id before adding items

    for db_item in db_items:
        db_item.quotation_id = quotation.id
        db.add(db_item)

    db.commit()
    db.refresh(quotation)
    return _build_quotation_response(quotation, db_items)


@router.get("", response_model=List[QuotationResponse])
def list_quotations(
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Quotation)
        .options(joinedload(Quotation.contact), joinedload(Quotation.project))
        .filter(Quotation.company_id == current_user.company_id, Quotation.deleted_at.is_(None))
    )

    if status:
        query = query.filter(Quotation.status == status)
    if contact_id:
        query = query.filter(Quotation.contact_id == contact_id)
    if project_id:
        query = query.filter(Quotation.project_id == project_id)
    if search:
        contact_ids_subquery = (
            db.query(Contact.id)
            .filter(Contact.company_id == current_user.company_id, Contact.name.ilike(f"%{search}%"))
            .subquery()
        )
        query = query.filter(
            (Quotation.quotation_number.ilike(f"%{search}%"))
            | (Quotation.contact_id.in_(contact_ids_subquery))
        )

    quotations = query.order_by(Quotation.issue_date.desc()).all()

    # Preload items to avoid N+1 with dynamic relationship
    quotation_ids = [q.id for q in quotations]
    items_map: dict = {}
    if quotation_ids:
        all_items = db.query(QuotationItem).filter(QuotationItem.quotation_id.in_(quotation_ids)).all()
        for item in all_items:
            items_map.setdefault(item.quotation_id, []).append(item)

    return [_build_quotation_response(q, items_map.get(q.id, [])) for q in quotations]


@router.get("/{quotation_id}", response_model=QuotationResponse)
def get_quotation(
    quotation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.contact), joinedload(Quotation.project))
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == current_user.company_id,
            Quotation.deleted_at.is_(None),
        )
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return _build_quotation_response(quotation)


@router.put("/{quotation_id}", response_model=QuotationResponse)
def update_quotation(
    quotation_id: UUID,
    data: QuotationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.contact), joinedload(Quotation.project))
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == current_user.company_id,
            Quotation.deleted_at.is_(None),
        )
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if quotation.status == "converted":
        raise HTTPException(status_code=400, detail="Cannot update a converted quotation")

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
        db.query(QuotationItem).filter(QuotationItem.quotation_id == quotation_id).delete(
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
                QuotationItem(
                    quotation_id=quotation_id,
                    product_id=item_data.get("product_id"),
                    description=item_data["description"],
                    quantity=quantity,
                    unit_price=unit_price,
                    discount_percent=discount_percent,
                    amount=amount,
                )
            )

        quotation.subtotal = subtotal
        vat_rate = Decimal(str(update_data.get("vat_rate", quotation.vat_rate)))
        discount_amount = Decimal(str(update_data.get("discount_amount", quotation.discount_amount)))
        quotation.vat_rate = vat_rate
        quotation.discount_amount = discount_amount
        quotation.vat_amount = round(subtotal * vat_rate / Decimal("100"), 2)
        quotation.total_amount = subtotal + quotation.vat_amount - discount_amount

        del update_data["items"]
    else:
        # Recalculate with potentially new vat_rate or discount_amount
        if "vat_rate" in update_data or "discount_amount" in update_data:
            vat_rate = Decimal(str(update_data.get("vat_rate", quotation.vat_rate)))
            discount_amount = Decimal(str(update_data.get("discount_amount", quotation.discount_amount)))
            quotation.vat_rate = vat_rate
            quotation.discount_amount = discount_amount
            quotation.vat_amount = round(quotation.subtotal * vat_rate / Decimal("100"), 2)
            quotation.total_amount = quotation.subtotal + quotation.vat_amount - discount_amount

    # Update scalar fields
    for field, value in update_data.items():
        if field in {"vat_rate", "discount_amount", "subtotal", "vat_amount", "total_amount"}:
            continue
        setattr(quotation, field, value)

    db.commit()
    db.refresh(quotation)
    return _build_quotation_response(quotation)


@router.put("/{quotation_id}/status", response_model=QuotationResponse)
def update_quotation_status(
    quotation_id: UUID,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = (
        db.query(Quotation)
        .options(joinedload(Quotation.contact), joinedload(Quotation.project))
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == current_user.company_id,
            Quotation.deleted_at.is_(None),
        )
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if data.status not in VALID_STATUS_TRANSITIONS.get(quotation.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{quotation.status}' to '{data.status}'",
        )

    quotation.status = data.status
    db.commit()
    db.refresh(quotation)
    return _build_quotation_response(quotation)


@router.delete("/{quotation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_quotation(
    quotation_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    quotation = (
        db.query(Quotation)
        .filter(
            Quotation.id == quotation_id,
            Quotation.company_id == current_user.company_id,
            Quotation.deleted_at.is_(None),
        )
        .first()
    )
    if not quotation:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if quotation.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft quotations can be deleted")

    quotation.deleted_at = datetime.utcnow()
    db.commit()
    return None
