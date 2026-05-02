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
from ....models.expense_claim import ExpenseClaim
from ....models.contact import Contact
from ....models.project import Project
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class ExpenseClaimCreate(BaseModel):
    contact_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    employee_name: str = Field(..., min_length=1, max_length=100)
    expense_date: date
    category: str = Field(default="other", pattern="^(travel|meal|office|supplies|transportation|other)$")
    description: str = Field(..., min_length=1, max_length=500)
    amount: Decimal = Field(default=Decimal("0"), ge=0)
    vat_amount: Decimal = Field(default=Decimal("0"), ge=0)
    receipt_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None


class ExpenseClaimUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    employee_name: Optional[str] = Field(None, min_length=1, max_length=100)
    expense_date: Optional[date] = None
    category: Optional[str] = Field(None, pattern="^(travel|meal|office|supplies|transportation|other)$")
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    amount: Optional[Decimal] = Field(None, ge=0)
    vat_amount: Optional[Decimal] = Field(None, ge=0)
    receipt_url: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = None


class ExpenseClaimResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: Optional[UUID]
    project_id: Optional[UUID]
    claim_number: str
    employee_name: str
    expense_date: date
    category: str
    description: str
    amount: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    receipt_url: Optional[str]
    status: str
    approved_by: Optional[UUID]
    approved_at: Optional[date]
    notes: Optional[str]
    contact_name: Optional[str] = None
    project_name: Optional[str] = None
    approver_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseClaimStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|submitted|approved|paid|rejected|cancelled)$")


VALID_STATUS_TRANSITIONS = {
    "draft": {"draft", "submitted", "cancelled"},
    "submitted": {"submitted", "approved", "rejected"},
    "approved": {"approved", "paid"},
    "rejected": {"rejected"},
    "paid": {"paid"},
    "cancelled": {"cancelled"},
}


def _build_expense_claim_response(claim: ExpenseClaim) -> dict:
    return {
        "id": claim.id,
        "company_id": claim.company_id,
        "contact_id": claim.contact_id,
        "project_id": claim.project_id,
        "claim_number": claim.claim_number,
        "employee_name": claim.employee_name,
        "expense_date": claim.expense_date,
        "category": claim.category,
        "description": claim.description,
        "amount": claim.amount,
        "vat_amount": claim.vat_amount,
        "total_amount": claim.total_amount,
        "receipt_url": claim.receipt_url,
        "status": claim.status,
        "approved_by": claim.approved_by,
        "approved_at": claim.approved_at,
        "notes": claim.notes,
        "contact_name": claim.contact.name if claim.contact else None,
        "project_name": claim.project.name if claim.project else None,
        "approver_name": claim.approver.name if claim.approver else None,
        "created_at": claim.created_at,
        "updated_at": claim.updated_at,
    }


@router.post("", response_model=ExpenseClaimResponse, status_code=status.HTTP_201_CREATED)
def create_expense_claim(
    data: ExpenseClaimCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact if provided
    if data.contact_id:
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

    # Generate claim number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    claim_number = numbering.get_next_number("EX", "EX")

    # Calculate total amount
    amount = data.amount
    vat_amount = data.vat_amount
    total_amount = amount + vat_amount

    claim = ExpenseClaim(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        project_id=data.project_id,
        claim_number=claim_number,
        employee_name=data.employee_name,
        expense_date=data.expense_date,
        category=data.category,
        description=data.description,
        amount=amount,
        vat_amount=vat_amount,
        total_amount=total_amount,
        receipt_url=data.receipt_url,
        status="draft",
        notes=data.notes,
    )
    db.add(claim)
    db.commit()
    db.refresh(claim)
    return _build_expense_claim_response(claim)


@router.get("", response_model=List[ExpenseClaimResponse])
def list_expense_claims(
    status: Optional[str] = None,
    category: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ExpenseClaim).options(
        joinedload(ExpenseClaim.contact),
        joinedload(ExpenseClaim.project),
        joinedload(ExpenseClaim.approver),
    ).filter(
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None),
    )

    if status:
        query = query.filter(ExpenseClaim.status == status)
    if category:
        query = query.filter(ExpenseClaim.category == category)
    if contact_id:
        query = query.filter(ExpenseClaim.contact_id == contact_id)
    if project_id:
        query = query.filter(ExpenseClaim.project_id == project_id)
    if search:
        query = query.filter(
            (ExpenseClaim.claim_number.ilike(f"%{search}%"))
            | (ExpenseClaim.employee_name.ilike(f"%{search}%"))
            | (ExpenseClaim.description.ilike(f"%{search}%"))
        )

    claims = query.order_by(ExpenseClaim.expense_date.desc()).all()
    return [_build_expense_claim_response(c) for c in claims]


@router.get("/{claim_id}", response_model=ExpenseClaimResponse)
def get_expense_claim(
    claim_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(ExpenseClaim).options(
        joinedload(ExpenseClaim.contact),
        joinedload(ExpenseClaim.project),
        joinedload(ExpenseClaim.approver),
    ).filter(
        ExpenseClaim.id == claim_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None),
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")
    return _build_expense_claim_response(claim)


@router.put("/{claim_id}", response_model=ExpenseClaimResponse)
def update_expense_claim(
    claim_id: UUID,
    data: ExpenseClaimUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(ExpenseClaim).options(
        joinedload(ExpenseClaim.contact),
        joinedload(ExpenseClaim.project),
        joinedload(ExpenseClaim.approver),
    ).filter(
        ExpenseClaim.id == claim_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None),
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")

    if claim.status not in ["draft", "submitted"]:
        raise HTTPException(status_code=400, detail="Can only update draft or submitted expense claims")

    update_data = data.model_dump(exclude_unset=True)

    # Validate contact if changing
    if "contact_id" in update_data and update_data["contact_id"] is not None:
        contact = db.query(Contact).filter(
            Contact.id == update_data["contact_id"],
            Contact.company_id == current_user.company_id,
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

    # Validate project if changing
    if "project_id" in update_data and update_data["project_id"] is not None:
        project = db.query(Project).filter(
            Project.id == update_data["project_id"],
            Project.company_id == current_user.company_id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # Recalculate total if amount or vat_amount changed
    if "amount" in update_data or "vat_amount" in update_data:
        amount = Decimal(str(update_data.get("amount", claim.amount)))
        vat_amount = Decimal(str(update_data.get("vat_amount", claim.vat_amount)))
        claim.amount = amount
        claim.vat_amount = vat_amount
        claim.total_amount = amount + vat_amount

    # Update scalar fields
    for field, value in update_data.items():
        if field in {"amount", "vat_amount", "total_amount"}:
            continue
        setattr(claim, field, value)

    db.commit()
    db.refresh(claim)
    return _build_expense_claim_response(claim)


@router.put("/{claim_id}/status", response_model=ExpenseClaimResponse)
def update_expense_claim_status(
    claim_id: UUID,
    data: ExpenseClaimStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(ExpenseClaim).options(
        joinedload(ExpenseClaim.contact),
        joinedload(ExpenseClaim.project),
        joinedload(ExpenseClaim.approver),
    ).filter(
        ExpenseClaim.id == claim_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None),
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")

    if data.status not in VALID_STATUS_TRANSITIONS.get(claim.status, set()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{claim.status}' to '{data.status}'",
        )

    claim.status = data.status

    if data.status == "approved":
        claim.approved_by = current_user.id
        claim.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(claim)

    if data.status == "paid":
        try:
            gl_service = GLPostingService(db, str(current_user.company_id))
            gl_service.post_expense_claim(claim)
            db.commit()
        except Exception:
            # GL posting failure shouldn't block status update
            db.rollback()

    return _build_expense_claim_response(claim)


@router.delete("/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense_claim(
    claim_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    claim = db.query(ExpenseClaim).filter(
        ExpenseClaim.id == claim_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None),
    ).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Expense claim not found")

    if claim.status not in ["draft", "rejected"]:
        raise HTTPException(status_code=400, detail="Only draft or rejected expense claims can be deleted")

    claim.deleted_at = datetime.utcnow()
    db.commit()
    return None
