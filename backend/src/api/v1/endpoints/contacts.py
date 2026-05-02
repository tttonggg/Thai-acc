from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.contact import Contact
from ....models.user import User

router = APIRouter()


class ContactCreate(BaseModel):
    type: str = Field(..., pattern="^(customer|vendor|both)$")
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None, min_length=13, max_length=13)
    branch_number: Optional[str] = Field(default="00000", max_length=5)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)
    credit_days: Decimal = Field(default=Decimal("0"), ge=0)


class ContactUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(customer|vendor|both)$")
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None, min_length=13, max_length=13)
    branch_number: Optional[str] = Field(None, max_length=5)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    credit_days: Optional[Decimal] = Field(None, ge=0)


class ContactResponse(BaseModel):
    id: UUID
    company_id: UUID
    type: str
    name: str
    name_en: Optional[str]
    tax_id: Optional[str]
    branch_number: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    credit_limit: Decimal
    credit_days: Decimal

    class Config:
        from_attributes = True


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = Contact(company_id=current_user.company_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("", response_model=List[ContactResponse])
def list_contacts(
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Contact).filter(
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    )
    
    if type:
        query = query.filter(Contact.type == type)
    if search:
        query = query.filter(Contact.name.ilike(f"%{search}%"))
    
    return query.order_by(Contact.name).all()


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: UUID,
    data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Soft delete
    from datetime import datetime
    contact.deleted_at = datetime.utcnow()
    db.commit()
    return None
