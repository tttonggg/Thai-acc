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
from ....models.purchase_order import PurchaseOrder
from ....models.receipt import Receipt
from sqlalchemy import func
from datetime import datetime

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
    created_at: datetime
    updated_at: datetime

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


# ============================================================
# Project Transaction History
# ============================================================

class ProjectTransactionItem(BaseModel):
    id: UUID
    document_type: str
    document_type_label: str
    document_number: str
    document_date: str
    status: str
    status_label: str
    contact_name: Optional[str]
    description: Optional[str]
    amount: Decimal
    link: str


class ProjectTransactionSummary(BaseModel):
    total_quoted: Decimal
    total_invoiced: Decimal
    total_received: Decimal
    total_purchased: Decimal
    total_expense: Decimal
    quotation_count: int
    invoice_count: int
    receipt_count: int
    purchase_order_count: int
    purchase_invoice_count: int
    expense_claim_count: int


class ProjectTransactionsResponse(BaseModel):
    project: ProjectResponse
    summary: ProjectTransactionSummary
    transactions: List[ProjectTransactionItem]


@router.get("/{project_id}/transactions", response_model=ProjectTransactionsResponse)
def get_project_transactions(
    project_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unified transaction history for a project across all document types."""
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.company_id == current_user.company_id,
        Project.deleted_at.is_(None)
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Query all document types by project_id
    quotations = db.query(Quotation).filter(
        Quotation.project_id == project_id,
        Quotation.company_id == current_user.company_id,
        Quotation.deleted_at.is_(None)
    ).all()

    invoices = db.query(Invoice).filter(
        Invoice.project_id == project_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None)
    ).all()

    receipts = db.query(Receipt).filter(
        Receipt.project_id == project_id,
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None)
    ).all()

    purchase_orders = db.query(PurchaseOrder).filter(
        PurchaseOrder.project_id == project_id,
        PurchaseOrder.company_id == current_user.company_id,
        PurchaseOrder.deleted_at.is_(None)
    ).all()

    purchase_invoices = db.query(PurchaseInvoice).filter(
        PurchaseInvoice.project_id == project_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None)
    ).all()

    expense_claims = db.query(ExpenseClaim).filter(
        ExpenseClaim.project_id == project_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None)
    ).all()

    # Build unified transaction list
    transactions = []

    for q in quotations:
        transactions.append(ProjectTransactionItem(
            id=q.id,
            document_type="quotation",
            document_type_label="ใบเสนอราคา",
            document_number=q.quotation_number,
            document_date=q.issue_date.isoformat() if q.issue_date else "",
            status=q.status,
            status_label=_get_tx_status_label(q.status, "quotation"),
            contact_name=q.contact.name if q.contact else None,
            description=q.notes,
            amount=q.total_amount,
            link=f"/income/quotations/{q.id}"
        ))

    for inv in invoices:
        transactions.append(ProjectTransactionItem(
            id=inv.id,
            document_type="invoice",
            document_type_label="ใบแจ้งหนี้",
            document_number=inv.invoice_number,
            document_date=inv.issue_date.isoformat() if inv.issue_date else "",
            status=inv.status,
            status_label=_get_tx_status_label(inv.status, "invoice"),
            contact_name=inv.contact.name if inv.contact else None,
            description=inv.notes,
            amount=inv.total_amount,
            link=f"/income/invoices/{inv.id}"
        ))

    for r in receipts:
        transactions.append(ProjectTransactionItem(
            id=r.id,
            document_type="receipt",
            document_type_label="ใบเสร็จ",
            document_number=r.receipt_number,
            document_date=r.receipt_date.isoformat() if r.receipt_date else "",
            status="paid",
            status_label="ชำระแล้ว",
            contact_name=r.contact.name if r.contact else None,
            description=f"ชำระเงิน: {r.payment_method}",
            amount=r.total_amount,
            link=f"/income/receipts/{r.id}"
        ))

    for po in purchase_orders:
        transactions.append(ProjectTransactionItem(
            id=po.id,
            document_type="purchase_order",
            document_type_label="ใบสั่งซื้อ",
            document_number=po.po_number,
            document_date=po.order_date.isoformat() if po.order_date else "",
            status=po.status,
            status_label=_get_tx_status_label(po.status, "purchase_order"),
            contact_name=po.contact.name if po.contact else None,
            description=po.notes,
            amount=po.total_amount,
            link=f"/expenses/purchase-orders/{po.id}"
        ))

    for pi in purchase_invoices:
        transactions.append(ProjectTransactionItem(
            id=pi.id,
            document_type="purchase_invoice",
            document_type_label="ใบรับสินค้า",
            document_number=pi.bill_number,
            document_date=pi.bill_date.isoformat() if pi.bill_date else "",
            status=pi.status,
            status_label=_get_tx_status_label(pi.status, "purchase_invoice"),
            contact_name=pi.contact.name if pi.contact else None,
            description=pi.notes,
            amount=pi.total_amount,
            link=f"/expenses/purchase-invoices/{pi.id}"
        ))

    for ec in expense_claims:
        transactions.append(ProjectTransactionItem(
            id=ec.id,
            document_type="expense_claim",
            document_type_label="เบิกค่าใช้จ่าย",
            document_number=ec.claim_number,
            document_date=ec.expense_date.isoformat() if ec.expense_date else "",
            status=ec.status,
            status_label=_get_tx_status_label(ec.status, "expense_claim"),
            contact_name=ec.employee_name,
            description=ec.description,
            amount=ec.total_amount,
            link=f"/expenses/expense-claims/{ec.id}"
        ))

    # Sort by date descending
    transactions.sort(key=lambda x: x.document_date or "", reverse=True)

    # Calculate summary
    total_quoted = sum(q.total_amount for q in quotations)
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_received = sum(r.total_amount for r in receipts)
    total_purchased = sum(po.total_amount for po in purchase_orders) + sum(pi.total_amount for pi in purchase_invoices)
    total_expense = sum(ec.total_amount for ec in expense_claims)

    summary = ProjectTransactionSummary(
        total_quoted=total_quoted,
        total_invoiced=total_invoiced,
        total_received=total_received,
        total_purchased=total_purchased,
        total_expense=total_expense,
        quotation_count=len(quotations),
        invoice_count=len(invoices),
        receipt_count=len(receipts),
        purchase_order_count=len(purchase_orders),
        purchase_invoice_count=len(purchase_invoices),
        expense_claim_count=len(expense_claims)
    )

    return ProjectTransactionsResponse(
        project={
            **{c.name: getattr(project, c.name) for c in Project.__table__.columns},
            "contact_name": project.contact.name if project.contact else None,
        },
        summary=summary,
        transactions=transactions[:100]
    )


def _get_tx_status_label(status: str, doc_type: str) -> str:
    """Map status codes to Thai labels."""
    labels = {
        "quotation": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "accepted": "อนุมัติ",
            "rejected": "ปฏิเสธ",
            "converted": "แปลงแล้ว"
        },
        "invoice": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "paid": "ชำระแล้ว",
            "partially_paid": "ชำระบางส่วน",
            "overdue": "เกินกำหนด",
            "cancelled": "ยกเลิก"
        },
        "purchase_order": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "confirmed": "ยืนยัน",
            "received": "รับแล้ว",
            "billed": "วางบิลแล้ว",
            "cancelled": "ยกเลิก"
        },
        "purchase_invoice": {
            "draft": "ร่าง",
            "received": "รับแล้ว",
            "approved": "อนุมัติ",
            "partially_paid": "ชำระบางส่วน",
            "paid": "ชำระแล้ว",
            "cancelled": "ยกเลิก"
        },
        "expense_claim": {
            "draft": "ร่าง",
            "submitted": "ส่งแล้ว",
            "approved": "อนุมัติ",
            "rejected": "ปฏิเสธ",
            "reimbursed": "จ่ายคืนแล้ว"
        }
    }
    return labels.get(doc_type, {}).get(status, status)
