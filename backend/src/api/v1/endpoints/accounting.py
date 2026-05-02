from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.gl import ChartOfAccount, JournalEntry, JournalEntryLine
from ....models.user import User

router = APIRouter()


# ============================================================
# Chart of Accounts
# ============================================================

class COACreate(BaseModel):
    code: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    account_type: str = Field(..., pattern="^(asset|liability|equity|revenue|expense)$")
    account_sub_type: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None
    is_active: Optional[str] = "Y"


class COAUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    account_sub_type: Optional[str] = Field(None, max_length=50)
    parent_id: Optional[UUID] = None
    is_active: Optional[str] = Field(None, pattern="^(Y|N)$")


class COAResponse(BaseModel):
    id: UUID
    company_id: UUID
    code: str
    name: str
    name_en: Optional[str]
    account_type: str
    account_sub_type: Optional[str]
    parent_id: Optional[UUID]
    balance: Decimal
    is_active: str

    class Config:
        from_attributes = True


@router.post("/chart-of-accounts", response_model=COAResponse, status_code=status.HTTP_201_CREATED)
def create_coa(
    data: COACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check code uniqueness within company
    existing = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == current_user.company_id,
        ChartOfAccount.code == data.code,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account code already exists")

    account = ChartOfAccount(company_id=current_user.company_id, **data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/chart-of-accounts", response_model=List[COAResponse])
def list_coa(
    account_type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == current_user.company_id,
    )

    if account_type:
        query = query.filter(ChartOfAccount.account_type == account_type)
    if search:
        query = query.filter(
            (ChartOfAccount.name.ilike(f"%{search}%")) |
            (ChartOfAccount.code.ilike(f"%{search}%"))
        )

    return query.order_by(ChartOfAccount.code).all()


@router.get("/chart-of-accounts/{account_id}", response_model=COAResponse)
def get_coa(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(ChartOfAccount).filter(
        ChartOfAccount.id == account_id,
        ChartOfAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/chart-of-accounts/{account_id}", response_model=COAResponse)
def update_coa(
    account_id: UUID,
    data: COAUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    account = db.query(ChartOfAccount).filter(
        ChartOfAccount.id == account_id,
        ChartOfAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return account


# ============================================================
# Journal Entries
# ============================================================

class JELineCreate(BaseModel):
    account_id: UUID
    description: Optional[str] = Field(None, max_length=255)
    debit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    credit_amount: Decimal = Field(default=Decimal("0"), ge=0)
    contact_id: Optional[UUID] = None
    project_id: Optional[UUID] = None


class JECreate(BaseModel):
    entry_date: date
    reference: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    lines: List[JELineCreate] = Field(..., min_length=2)


class JELineResponse(BaseModel):
    id: UUID
    account_id: UUID
    description: Optional[str]
    debit_amount: Decimal
    credit_amount: Decimal
    contact_id: Optional[UUID]
    project_id: Optional[UUID]

    class Config:
        from_attributes = True


class JEResponse(BaseModel):
    id: UUID
    company_id: UUID
    entry_type: str
    document_id: Optional[UUID]
    document_number: Optional[str]
    entry_date: date
    reference: Optional[str]
    description: Optional[str]
    total_debit: Decimal
    total_credit: Decimal
    status: str
    lines: List[JELineResponse]

    class Config:
        from_attributes = True


@router.post("/journal-entries", response_model=JEResponse, status_code=status.HTTP_201_CREATED)
def create_journal_entry(
    data: JECreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_debit = sum(line.debit_amount for line in data.lines)
    total_credit = sum(line.credit_amount for line in data.lines)

    if total_debit != total_credit:
        raise HTTPException(status_code=400, detail="Journal entry must balance: total debit = total credit")
    if total_debit == 0:
        raise HTTPException(status_code=400, detail="Journal entry must have non-zero amounts")

    entry = JournalEntry(
        company_id=current_user.company_id,
        entry_type="adjustment",
        entry_date=data.entry_date,
        reference=data.reference,
        description=data.description,
        total_debit=total_debit,
        total_credit=total_credit,
    )
    db.add(entry)
    db.flush()

    for line in data.lines:
        db.add(JournalEntryLine(
            journal_entry_id=entry.id,
            account_id=line.account_id,
            description=line.description,
            debit_amount=line.debit_amount,
            credit_amount=line.credit_amount,
            contact_id=line.contact_id,
            project_id=line.project_id,
        ))

    db.commit()
    db.refresh(entry)

    lines = []
    for line in entry.lines:
        lines.append({
            "id": line.id,
            "account_id": line.account_id,
            "description": line.description,
            "debit_amount": line.debit_amount,
            "credit_amount": line.credit_amount,
            "contact_id": line.contact_id,
            "project_id": line.project_id,
        })

    return {
        "id": entry.id,
        "company_id": entry.company_id,
        "entry_type": entry.entry_type,
        "document_id": entry.document_id,
        "document_number": entry.document_number,
        "entry_date": entry.entry_date,
        "reference": entry.reference,
        "description": entry.description,
        "total_debit": entry.total_debit,
        "total_credit": entry.total_credit,
        "status": entry.status,
        "lines": lines,
    }


@router.get("/journal-entries", response_model=List[JEResponse])
def list_journal_entries(
    entry_type: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(JournalEntry).filter(
        JournalEntry.company_id == current_user.company_id,
    )

    if entry_type:
        query = query.filter(JournalEntry.entry_type == entry_type)
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)

    entries = query.order_by(JournalEntry.entry_date.desc()).offset(offset).limit(limit).all()

    # Build response with account info for lines
    result = []
    for entry in entries:
        lines = []
        for line in entry.lines:
            lines.append({
                "id": line.id,
                "account_id": line.account_id,
                "description": line.description,
                "debit_amount": line.debit_amount,
                "credit_amount": line.credit_amount,
                "contact_id": line.contact_id,
                "project_id": line.project_id,
            })
        result.append({
            "id": entry.id,
            "company_id": entry.company_id,
            "entry_type": entry.entry_type,
            "document_id": entry.document_id,
            "document_number": entry.document_number,
            "entry_date": entry.entry_date,
            "reference": entry.reference,
            "description": entry.description,
            "total_debit": entry.total_debit,
            "total_credit": entry.total_credit,
            "status": entry.status,
            "lines": lines,
        })

    return result


@router.get("/journal-entries/{entry_id}", response_model=JEResponse)
def get_journal_entry(
    entry_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    entry = db.query(JournalEntry).filter(
        JournalEntry.id == entry_id,
        JournalEntry.company_id == current_user.company_id,
    ).first()
    if not entry:
        raise HTTPException(status_code=404, detail="Journal entry not found")

    lines = []
    for line in entry.lines:
        lines.append({
            "id": line.id,
            "account_id": line.account_id,
            "description": line.description,
            "debit_amount": line.debit_amount,
            "credit_amount": line.credit_amount,
            "contact_id": line.contact_id,
            "project_id": line.project_id,
        })

    return {
        "id": entry.id,
        "company_id": entry.company_id,
        "entry_type": entry.entry_type,
        "document_id": entry.document_id,
        "document_number": entry.document_number,
        "entry_date": entry.entry_date,
        "reference": entry.reference,
        "description": entry.description,
        "total_debit": entry.total_debit,
        "total_credit": entry.total_credit,
        "status": entry.status,
        "lines": lines,
    }


# ============================================================
# Reports
# ============================================================

from sqlalchemy import func


class TrialBalanceItem(BaseModel):
    account_id: UUID
    code: str
    name: str
    account_type: str
    total_debit: Decimal
    total_credit: Decimal
    balance: Decimal

    class Config:
        from_attributes = True


class TrialBalanceResponse(BaseModel):
    items: List[TrialBalanceItem]
    grand_total_debit: Decimal
    grand_total_credit: Decimal


@router.get("/reports/trial-balance", response_model=TrialBalanceResponse)
def trial_balance(
    as_of: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Trial Balance report — all accounts with aggregated debits/credits."""
    accounts = db.query(ChartOfAccount).filter(
        ChartOfAccount.company_id == current_user.company_id,
        ChartOfAccount.is_active == "Y",
    ).order_by(ChartOfAccount.code).all()

    lines_query = db.query(JournalEntryLine).join(JournalEntry).filter(
        JournalEntry.company_id == current_user.company_id,
        JournalEntry.status == "posted",
    )
    if as_of:
        lines_query = lines_query.filter(JournalEntry.entry_date <= as_of)

    agg = (
        lines_query
        .with_entities(
            JournalEntryLine.account_id,
            func.coalesce(func.sum(JournalEntryLine.debit_amount), Decimal("0")).label("total_debit"),
            func.coalesce(func.sum(JournalEntryLine.credit_amount), Decimal("0")).label("total_credit"),
        )
        .group_by(JournalEntryLine.account_id)
        .all()
    )
    agg_map = {row.account_id: (row.total_debit, row.total_credit) for row in agg}

    items = []
    grand_debit = Decimal("0")
    grand_credit = Decimal("0")

    for account in accounts:
        td, tc = agg_map.get(account.id, (Decimal("0"), Decimal("0")))
        if account.account_type in ("asset", "expense"):
            balance = td - tc
        else:
            balance = tc - td

        items.append(TrialBalanceItem(
            account_id=account.id,
            code=account.code,
            name=account.name,
            account_type=account.account_type,
            total_debit=td,
            total_credit=tc,
            balance=balance,
        ))
        grand_debit += td
        grand_credit += tc

    return TrialBalanceResponse(
        items=items,
        grand_total_debit=grand_debit,
        grand_total_credit=grand_credit,
    )


class IncomeStatementItem(BaseModel):
    account_id: UUID
    code: str
    name: str
    amount: Decimal

    class Config:
        from_attributes = True


class IncomeStatementResponse(BaseModel):
    revenue_items: List[IncomeStatementItem]
    expense_items: List[IncomeStatementItem]
    total_revenue: Decimal
    total_expenses: Decimal
    net_income: Decimal


@router.get("/reports/income-statement", response_model=IncomeStatementResponse)
def income_statement(
    from_date: date,
    to_date: date,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Income Statement (Profit & Loss) for a date range."""
    agg = (
        db.query(
            ChartOfAccount.id,
            ChartOfAccount.code,
            ChartOfAccount.name,
            ChartOfAccount.account_type,
            func.coalesce(func.sum(JournalEntryLine.debit_amount), Decimal("0")).label("total_debit"),
            func.coalesce(func.sum(JournalEntryLine.credit_amount), Decimal("0")).label("total_credit"),
        )
        .join(JournalEntryLine, ChartOfAccount.id == JournalEntryLine.account_id)
        .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            ChartOfAccount.company_id == current_user.company_id,
            ChartOfAccount.account_type.in_(["revenue", "expense"]),
            JournalEntry.status == "posted",
            JournalEntry.entry_date >= from_date,
            JournalEntry.entry_date <= to_date,
        )
        .group_by(ChartOfAccount.id, ChartOfAccount.code, ChartOfAccount.name, ChartOfAccount.account_type)
        .order_by(ChartOfAccount.code)
        .all()
    )

    revenue_items = []
    expense_items = []
    total_revenue = Decimal("0")
    total_expenses = Decimal("0")

    for row in agg:
        if row.account_type == "revenue":
            amount = row.total_credit - row.total_debit
            revenue_items.append(IncomeStatementItem(
                account_id=row.id, code=row.code, name=row.name, amount=amount
            ))
            total_revenue += amount
        else:
            amount = row.total_debit - row.total_credit
            expense_items.append(IncomeStatementItem(
                account_id=row.id, code=row.code, name=row.name, amount=amount
            ))
            total_expenses += amount

    return IncomeStatementResponse(
        revenue_items=revenue_items,
        expense_items=expense_items,
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        net_income=total_revenue - total_expenses,
    )


class BalanceSheetItem(BaseModel):
    account_id: UUID
    code: str
    name: str
    amount: Decimal

    class Config:
        from_attributes = True


class BalanceSheetResponse(BaseModel):
    asset_items: List[BalanceSheetItem]
    liability_items: List[BalanceSheetItem]
    equity_items: List[BalanceSheetItem]
    total_assets: Decimal
    total_liabilities: Decimal
    total_equity: Decimal
    liabilities_plus_equity: Decimal


@router.get("/reports/balance-sheet", response_model=BalanceSheetResponse)
def balance_sheet(
    as_of: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Balance Sheet as of a given date (defaults to today)."""
    if as_of is None:
        as_of = date.today()

    agg = (
        db.query(
            ChartOfAccount.id,
            ChartOfAccount.code,
            ChartOfAccount.name,
            ChartOfAccount.account_type,
            func.coalesce(func.sum(JournalEntryLine.debit_amount), Decimal("0")).label("total_debit"),
            func.coalesce(func.sum(JournalEntryLine.credit_amount), Decimal("0")).label("total_credit"),
        )
        .join(JournalEntryLine, ChartOfAccount.id == JournalEntryLine.account_id)
        .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            ChartOfAccount.company_id == current_user.company_id,
            ChartOfAccount.account_type.in_(["asset", "liability", "equity"]),
            JournalEntry.status == "posted",
            JournalEntry.entry_date <= as_of,
        )
        .group_by(ChartOfAccount.id, ChartOfAccount.code, ChartOfAccount.name, ChartOfAccount.account_type)
        .order_by(ChartOfAccount.code)
        .all()
    )

    asset_items = []
    liability_items = []
    equity_items = []
    total_assets = Decimal("0")
    total_liabilities = Decimal("0")
    total_equity = Decimal("0")

    for row in agg:
        if row.account_type == "asset":
            amount = row.total_debit - row.total_credit
            asset_items.append(BalanceSheetItem(
                account_id=row.id, code=row.code, name=row.name, amount=amount
            ))
            total_assets += amount
        elif row.account_type == "liability":
            amount = row.total_credit - row.total_debit
            liability_items.append(BalanceSheetItem(
                account_id=row.id, code=row.code, name=row.name, amount=amount
            ))
            total_liabilities += amount
        else:
            amount = row.total_credit - row.total_debit
            equity_items.append(BalanceSheetItem(
                account_id=row.id, code=row.code, name=row.name, amount=amount
            ))
            total_equity += amount

    return BalanceSheetResponse(
        asset_items=asset_items,
        liability_items=liability_items,
        equity_items=equity_items,
        total_assets=total_assets,
        total_liabilities=total_liabilities,
        total_equity=total_equity,
        liabilities_plus_equity=total_liabilities + total_equity,
    )


# ============================================================
# AR / AP Aging Reports
# ============================================================

from ....models.invoice import Invoice
from ....models.purchase_invoice import PurchaseInvoice
from ....models.contact import Contact
from datetime import date as dt_date


class ARAgingItem(BaseModel):
    contact_id: UUID
    contact_name: str
    current: Decimal
    days_1_30: Decimal
    days_31_60: Decimal
    days_61_90: Decimal
    days_over_90: Decimal
    total_outstanding: Decimal

    class Config:
        from_attributes = True


class ARAgingResponse(BaseModel):
    as_of: dt_date
    items: List[ARAgingItem]
    grand_current: Decimal
    grand_1_30: Decimal
    grand_31_60: Decimal
    grand_61_90: Decimal
    grand_over_90: Decimal
    grand_total: Decimal


@router.get("/reports/ar-aging", response_model=ARAgingResponse)
def ar_aging(
    as_of: Optional[dt_date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accounts Receivable Aging — outstanding invoices grouped by days overdue."""
    if as_of is None:
        as_of = dt_date.today()

    # Invoices with outstanding balance
    invoices = (
        db.query(Invoice, Contact)
        .join(Contact, Invoice.contact_id == Contact.id)
        .filter(
            Invoice.company_id == current_user.company_id,
            Invoice.status.in_(["sent", "partially_paid", "overdue"]),
            Invoice.deleted_at.is_(None),
        )
        .all()
    )

    buckets = {}
    for inv, contact in invoices:
        outstanding = (inv.total_amount or Decimal("0")) - (inv.paid_amount or Decimal("0"))
        if outstanding <= 0:
            continue

        days_overdue = (as_of - inv.due_date).days
        if days_overdue <= 0:
            bucket = "current"
        elif days_overdue <= 30:
            bucket = "days_1_30"
        elif days_overdue <= 60:
            bucket = "days_31_60"
        elif days_overdue <= 90:
            bucket = "days_61_90"
        else:
            bucket = "days_over_90"

        cid = str(contact.id)
        if cid not in buckets:
            buckets[cid] = {
                "contact_id": contact.id,
                "contact_name": contact.name,
                "current": Decimal("0"),
                "days_1_30": Decimal("0"),
                "days_31_60": Decimal("0"),
                "days_61_90": Decimal("0"),
                "days_over_90": Decimal("0"),
                "total": Decimal("0"),
            }
        buckets[cid][bucket] += outstanding
        buckets[cid]["total"] += outstanding

    items = sorted(
        [ARAgingItem(**{k: v for k, v in b.items() if k != "total"}, total_outstanding=b["total"]) for b in buckets.values()],
        key=lambda x: x.total_outstanding,
        reverse=True,
    )

    return ARAgingResponse(
        as_of=as_of,
        items=items,
        grand_current=sum(i.current for i in items),
        grand_1_30=sum(i.days_1_30 for i in items),
        grand_31_60=sum(i.days_31_60 for i in items),
        grand_61_90=sum(i.days_61_90 for i in items),
        grand_over_90=sum(i.days_over_90 for i in items),
        grand_total=sum(i.total_outstanding for i in items),
    )


class APAgingItem(BaseModel):
    contact_id: UUID
    contact_name: str
    current: Decimal
    days_1_30: Decimal
    days_31_60: Decimal
    days_61_90: Decimal
    days_over_90: Decimal
    total_outstanding: Decimal

    class Config:
        from_attributes = True


class APAgingResponse(BaseModel):
    as_of: dt_date
    items: List[APAgingItem]
    grand_current: Decimal
    grand_1_30: Decimal
    grand_31_60: Decimal
    grand_61_90: Decimal
    grand_over_90: Decimal
    grand_total: Decimal


@router.get("/reports/ap-aging", response_model=APAgingResponse)
def ap_aging(
    as_of: Optional[dt_date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accounts Payable Aging — outstanding purchase invoices grouped by days overdue."""
    if as_of is None:
        as_of = dt_date.today()

    purchase_invoices = (
        db.query(PurchaseInvoice, Contact)
        .join(Contact, PurchaseInvoice.contact_id == Contact.id)
        .filter(
            PurchaseInvoice.company_id == current_user.company_id,
            PurchaseInvoice.status.in_(["received", "approved", "partially_paid"]),
            PurchaseInvoice.deleted_at.is_(None),
        )
        .all()
    )

    buckets = {}
    for inv, contact in purchase_invoices:
        outstanding = (inv.total_amount or Decimal("0")) - (inv.paid_amount or Decimal("0"))
        if outstanding <= 0:
            continue

        days_overdue = (as_of - inv.due_date).days
        if days_overdue <= 0:
            bucket = "current"
        elif days_overdue <= 30:
            bucket = "days_1_30"
        elif days_overdue <= 60:
            bucket = "days_31_60"
        elif days_overdue <= 90:
            bucket = "days_61_90"
        else:
            bucket = "days_over_90"

        cid = str(contact.id)
        if cid not in buckets:
            buckets[cid] = {
                "contact_id": contact.id,
                "contact_name": contact.name,
                "current": Decimal("0"),
                "days_1_30": Decimal("0"),
                "days_31_60": Decimal("0"),
                "days_61_90": Decimal("0"),
                "days_over_90": Decimal("0"),
                "total": Decimal("0"),
            }
        buckets[cid][bucket] += outstanding
        buckets[cid]["total"] += outstanding

    items = sorted(
        [APAgingItem(**{k: v for k, v in b.items() if k != "total"}, total_outstanding=b["total"]) for b in buckets.values()],
        key=lambda x: x.total_outstanding,
        reverse=True,
    )

    return APAgingResponse(
        as_of=as_of,
        items=items,
        grand_current=sum(i.current for i in items),
        grand_1_30=sum(i.days_1_30 for i in items),
        grand_31_60=sum(i.days_31_60 for i in items),
        grand_61_90=sum(i.days_61_90 for i in items),
        grand_over_90=sum(i.days_over_90 for i in items),
        grand_total=sum(i.total_outstanding for i in items),
    )
