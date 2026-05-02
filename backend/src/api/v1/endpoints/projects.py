from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.project import Project
from ....models.contact import Contact
from ....models.invoice import Invoice
from ....models.receipt import Receipt
from ....models.purchase_invoice import PurchaseInvoice
from ....models.expense_claim import ExpenseClaim
from ....models.quotation import Quotation
from sqlalchemy import func

router = APIRouter()


class ProjectCreate(BaseModel):
    project_code: str = Field(..., min_length=1, max_length=50)
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_amount: Decimal = Field(default=Decimal("0"), ge=0)
    contact_id: Optional[UUID] = None


class ProjectUpdate(BaseModel):
    project_code: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget_amount: Optional[Decimal] = Field(None, ge=0)
    status: Optional[str] = Field(None, pattern="^(active|completed|cancelled)$")
    contact_id: Optional[UUID] = None


class ProjectResponse(BaseModel):
    id: UUID
    company_id: UUID
    project_code: str
    name: str
    description: Optional[str]
    start_date: Optional[date]
    end_date: Optional[date]
    budget_amount: Decimal
    actual_cost: Decimal
    status: str
    contact_id: Optional[UUID]
    contact_name: Optional[str] = None
    created_at: date
    updated_at: date

    class Config:
        from_attributes = True


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Check for duplicate project code within company
    existing = db.query(Project).filter(
        Project.company_id == current_user.company_id,
        Project.project_code == data.project_code,
        Project.deleted_at.is_(None),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")

    # Validate contact if provided
    if data.contact_id:
        contact = db.query(Contact).filter(
            Contact.id == data.contact_id,
            Contact.company_id == current_user.company_id,
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")

    project = Project(company_id=current_user.company_id, **data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        **{c.name: getattr(project, c.name) for c in Project.__table__.columns},
        "contact_name": project.contact.name if project.contact else None,
    }


@router.get("", response_model=List[ProjectResponse])
def list_projects(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project).filter(
        Project.company_id == current_user.company_id,
        Project.deleted_at.is_(None),
    )

    if status:
        query = query.filter(Project.status == status)
    if search:
        query = query.filter(
            Project.name.ilike(f"%{search}%") | Project.project_code.ilike(f"%{search}%")
        )

    projects = query.order_by(Project.project_code).all()
    return [
        {
            **{c.name: getattr(p, c.name) for c in Project.__table__.columns},
            "contact_name": p.contact.name if p.contact else None,
        }
        for p in projects
    ]


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.company_id == current_user.company_id,
        Project.deleted_at.is_(None),
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        **{c.name: getattr(project, c.name) for c in Project.__table__.columns},
        "contact_name": project.contact.name if project.contact else None,
    }


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.company_id == current_user.company_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)

    # Check duplicate code if changing
    if "project_code" in update_data and update_data["project_code"] != project.project_code:
        existing = db.query(Project).filter(
            Project.company_id == current_user.company_id,
            Project.project_code == update_data["project_code"],
            Project.id != project_id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Project code already exists")

    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return {
        **{c.name: getattr(project, c.name) for c in Project.__table__.columns},
        "contact_name": project.contact.name if project.contact else None,
    }


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.company_id == current_user.company_id,
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    from datetime import datetime
    project.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ============================================================
# Project Financials
# ============================================================

class ProjectFinancialsResponse(BaseModel):
    project_id: UUID
    quoted_amount: Decimal
    invoiced_amount: Decimal
    received_amount: Decimal
    purchase_invoice_amount: Decimal
    expense_claim_amount: Decimal
    total_cost: Decimal
    gross_profit: Decimal
    profit_margin: Decimal
    budget_amount: Decimal
    budget_remaining: Decimal
    budget_used_percent: Decimal

    class Config:
        from_attributes = True


@router.get("/{project_id}/financials", response_model=ProjectFinancialsResponse)
def project_financials(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Aggregate financial data for a single project from all related transactions."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.company_id == current_user.company_id,
        Project.deleted_at.is_(None),
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    quoted = db.query(func.coalesce(func.sum(Quotation.total_amount), Decimal("0"))).filter(
        Quotation.project_id == project_id,
        Quotation.deleted_at.is_(None),
    ).scalar() or Decimal("0")

    invoiced = db.query(func.coalesce(func.sum(Invoice.total_amount), Decimal("0"))).filter(
        Invoice.project_id == project_id,
        Invoice.deleted_at.is_(None),
    ).scalar() or Decimal("0")

    received = db.query(func.coalesce(func.sum(Receipt.total_amount), Decimal("0"))).filter(
        Receipt.project_id == project_id,
        Receipt.deleted_at.is_(None),
    ).scalar() or Decimal("0")

    pi_amount = db.query(func.coalesce(func.sum(PurchaseInvoice.total_amount), Decimal("0"))).filter(
        PurchaseInvoice.project_id == project_id,
        PurchaseInvoice.deleted_at.is_(None),
    ).scalar() or Decimal("0")

    ec_amount = db.query(func.coalesce(func.sum(ExpenseClaim.total_amount), Decimal("0"))).filter(
        ExpenseClaim.project_id == project_id,
        ExpenseClaim.deleted_at.is_(None),
    ).scalar() or Decimal("0")

    total_cost = pi_amount + ec_amount
    gross_profit = invoiced - total_cost
    profit_margin = (gross_profit / invoiced * 100) if invoiced > 0 else Decimal("0")

    budget = project.budget_amount or Decimal("0")
    budget_remaining = budget - total_cost
    budget_used = (total_cost / budget * 100) if budget > 0 else Decimal("0")

    return ProjectFinancialsResponse(
        project_id=project_id,
        quoted_amount=quoted,
        invoiced_amount=invoiced,
        received_amount=received,
        purchase_invoice_amount=pi_amount,
        expense_claim_amount=ec_amount,
        total_cost=total_cost,
        gross_profit=gross_profit,
        profit_margin=profit_margin.quantize(Decimal("0.01")),
        budget_amount=budget,
        budget_remaining=budget_remaining,
        budget_used_percent=budget_used.quantize(Decimal("0.01")),
    )


class ProjectSummaryItem(BaseModel):
    project_id: UUID
    project_code: str
    name: str
    status: str
    budget_amount: Decimal
    invoiced_amount: Decimal
    total_cost: Decimal
    gross_profit: Decimal
    profit_margin: Decimal

    class Config:
        from_attributes = True


@router.get("/financials/summary", response_model=List[ProjectSummaryItem])
def projects_financials_summary(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Summary of financials across all projects (for dashboard)."""
    projects = db.query(Project).filter(
        Project.company_id == current_user.company_id,
        Project.deleted_at.is_(None),
    ).order_by(Project.project_code).all()

    result = []
    for p in projects:
        invoiced = db.query(func.coalesce(func.sum(Invoice.total_amount), Decimal("0"))).filter(
            Invoice.project_id == p.id,
            Invoice.deleted_at.is_(None),
        ).scalar() or Decimal("0")

        pi_amount = db.query(func.coalesce(func.sum(PurchaseInvoice.total_amount), Decimal("0"))).filter(
            PurchaseInvoice.project_id == p.id,
            PurchaseInvoice.deleted_at.is_(None),
        ).scalar() or Decimal("0")

        ec_amount = db.query(func.coalesce(func.sum(ExpenseClaim.total_amount), Decimal("0"))).filter(
            ExpenseClaim.project_id == p.id,
            ExpenseClaim.deleted_at.is_(None),
        ).scalar() or Decimal("0")

        total_cost = pi_amount + ec_amount
        gross_profit = invoiced - total_cost
        margin = (gross_profit / invoiced * 100) if invoiced > 0 else Decimal("0")

        result.append(ProjectSummaryItem(
            project_id=p.id,
            project_code=p.project_code,
            name=p.name,
            status=p.status,
            budget_amount=p.budget_amount or Decimal("0"),
            invoiced_amount=invoiced,
            total_cost=total_cost,
            gross_profit=gross_profit,
            profit_margin=margin.quantize(Decimal("0.01")),
        ))

    # Sort by gross profit desc, return top N
    result.sort(key=lambda x: x.gross_profit, reverse=True)
    return result[:limit]
