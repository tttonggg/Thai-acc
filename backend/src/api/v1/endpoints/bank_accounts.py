from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.bank_account import BankAccount
from ....models.gl import ChartOfAccount, JournalEntryLine, JournalEntry
from ....models.contact import Contact
from ....models.bank_statement_import import BankStatementImport
from ....models.bank_statement_line import BankStatementLine
from ....services.bank_statement_service import BankStatementImportService

router = APIRouter()


# ============================================================
# Bank Accounts
# ============================================================

class BankAccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_number: Optional[str] = Field(None, max_length=50)
    bank_name: Optional[str] = Field(None, max_length=100)
    account_type: str = Field(default="bank", pattern="^(cash|bank|promptpay)$")
    opening_balance: Decimal = Field(default=Decimal("0"), ge=0)
    promptpay_number: Optional[str] = Field(None, max_length=15)
    gl_account_id: Optional[UUID] = None


class BankAccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_number: Optional[str] = Field(None, max_length=50)
    bank_name: Optional[str] = Field(None, max_length=100)
    account_type: Optional[str] = Field(None, pattern="^(cash|bank|promptpay)$")
    opening_balance: Optional[Decimal] = Field(None, ge=0)
    current_balance: Optional[Decimal] = Field(None, ge=0)
    promptpay_number: Optional[str] = Field(None, max_length=15)
    gl_account_id: Optional[UUID] = None
    is_active: Optional[str] = Field(None, pattern="^(Y|N)$")


class BankAccountResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    account_number: Optional[str]
    bank_name: Optional[str]
    account_type: str
    opening_balance: Decimal
    current_balance: Decimal
    promptpay_number: Optional[str]
    gl_account_id: Optional[UUID]
    gl_account_name: Optional[str] = None
    gl_account_code: Optional[str] = None
    is_active: str

    class Config:
        from_attributes = True


@router.post("", response_model=BankAccountResponse, status_code=status.HTTP_201_CREATED)
def create_bank_account(
    data: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate GL account if provided
    if data.gl_account_id:
        gl_acc = db.query(ChartOfAccount).filter(
            ChartOfAccount.id == data.gl_account_id,
            ChartOfAccount.company_id == current_user.company_id,
        ).first()
        if not gl_acc:
            raise HTTPException(status_code=404, detail="GL account not found")

    account = BankAccount(
        company_id=current_user.company_id,
        current_balance=data.opening_balance,
        **data.model_dump(),
    )
    db.add(account)
    db.commit()
    db.refresh(account)
    return _build_response(account)


@router.get("", response_model=List[BankAccountResponse])
def list_bank_accounts(
    account_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(BankAccount).filter(
        BankAccount.company_id == current_user.company_id,
    )
    if account_type:
        query = query.filter(BankAccount.account_type == account_type)

    accounts = query.order_by(BankAccount.name).all()
    return [_build_response(a) for a in accounts]


@router.get("/{account_id}", response_model=BankAccountResponse)
def get_bank_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")
    return _build_response(account)


@router.put("/{account_id}", response_model=BankAccountResponse)
def update_bank_account(
    account_id: UUID,
    data: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    # Validate GL account if provided
    if data.gl_account_id:
        gl_acc = db.query(ChartOfAccount).filter(
            ChartOfAccount.id == data.gl_account_id,
            ChartOfAccount.company_id == current_user.company_id,
        ).first()
        if not gl_acc:
            raise HTTPException(status_code=404, detail="GL account not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(account, field, value)

    db.commit()
    db.refresh(account)
    return _build_response(account)


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bank_account(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    account.is_active = "N"
    db.commit()
    return None


def _build_response(account: BankAccount) -> dict:
    return {
        "id": account.id,
        "company_id": account.company_id,
        "name": account.name,
        "account_number": account.account_number,
        "bank_name": account.bank_name,
        "account_type": account.account_type,
        "opening_balance": account.opening_balance,
        "current_balance": account.current_balance,
        "promptpay_number": account.promptpay_number,
        "gl_account_id": account.gl_account_id,
        "gl_account_name": account.gl_account.name if account.gl_account else None,
        "gl_account_code": account.gl_account.code if account.gl_account else None,
        "is_active": account.is_active,
    }


# ============================================================
# Reconciliation
# ============================================================

class ReconciliationLineResponse(BaseModel):
    id: UUID
    journal_entry_id: UUID
    entry_date: date
    entry_type: str
    document_number: Optional[str]
    description: Optional[str]
    debit_amount: Decimal
    credit_amount: Decimal
    is_reconciled: str
    reconciled_at: Optional[date]

    class Config:
        from_attributes = True


class ReconcileRequest(BaseModel):
    line_ids: List[UUID]
    reconcile: bool = True  # True = reconcile, False = unreconcile


@router.get("/{account_id}/transactions", response_model=List[ReconciliationLineResponse])
def bank_transactions(
    account_id: UUID,
    is_reconciled: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List GL journal entry lines for a bank account (by GL account link)."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    if not account.gl_account_id:
        return []

    query = (
        db.query(JournalEntryLine, JournalEntry)
        .join(JournalEntry, JournalEntryLine.journal_entry_id == JournalEntry.id)
        .filter(
            JournalEntryLine.account_id == account.gl_account_id,
            JournalEntry.company_id == current_user.company_id,
            JournalEntry.status == "posted",
        )
    )

    if is_reconciled is not None:
        query = query.filter(JournalEntryLine.is_reconciled == is_reconciled)
    if from_date:
        query = query.filter(JournalEntry.entry_date >= from_date)
    if to_date:
        query = query.filter(JournalEntry.entry_date <= to_date)

    results = query.order_by(JournalEntry.entry_date.desc()).all()

    return [
        ReconciliationLineResponse(
            id=line.id,
            journal_entry_id=line.journal_entry_id,
            entry_date=entry.entry_date,
            entry_type=entry.entry_type,
            document_number=entry.document_number,
            description=line.description or entry.description,
            debit_amount=line.debit_amount,
            credit_amount=line.credit_amount,
            is_reconciled=line.is_reconciled,
            reconciled_at=line.reconciled_at,
        )
        for line, entry in results
    ]


@router.post("/{account_id}/reconcile", status_code=status.HTTP_200_OK)
def reconcile_lines(
    account_id: UUID,
    data: ReconcileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark JE lines as reconciled or unreconciled."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    lines = db.query(JournalEntryLine).filter(
        JournalEntryLine.id.in_(data.line_ids),
    ).all()

    for line in lines:
        if data.reconcile:
            line.is_reconciled = "Y"
            line.reconciled_at = date.today()
            line.reconciled_by = current_user.id
        else:
            line.is_reconciled = "N"
            line.reconciled_at = None
            line.reconciled_by = None

    db.commit()
    return {"reconciled": len(lines)}


# ============================================================
# Bank Statement Import
# ============================================================

class BankStatementImportResponse(BaseModel):
    id: UUID
    company_id: UUID
    bank_account_id: UUID
    file_name: str
    statement_date_from: Optional[date]
    statement_date_to: Optional[date]
    total_debit: Decimal
    total_credit: Decimal
    status: str
    error_message: Optional[str]
    created_at: datetime
    line_count: int = 0

    class Config:
        from_attributes = True


class BankStatementLineResponse(BaseModel):
    id: UUID
    import_id: UUID
    transaction_date: date
    description: Optional[str]
    reference_number: Optional[str]
    debit_amount: Decimal
    credit_amount: Decimal
    is_matched: str
    matched_je_line_id: Optional[UUID]
    match_score: Optional[Decimal]

    class Config:
        from_attributes = True


class MatchSuggestion(BaseModel):
    je_line_id: UUID
    entry_date: Optional[date]
    description: Optional[str]
    document_number: Optional[str]
    debit_amount: Decimal
    credit_amount: Decimal
    score: float


class MatchRequest(BaseModel):
    line_id: UUID
    je_line_id: Optional[UUID] = None


@router.post("/{account_id}/statements/import", response_model=BankStatementImportResponse, status_code=status.HTTP_201_CREATED)
def import_statement(
    account_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload and parse a bank statement CSV file."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    content = file.file.read()
    try:
        import_record = BankStatementImportService.process_import(
            bank_account_id=account_id,
            file_content=content,
            file_name=file.filename or "statement.csv",
            db=db,
            company_id=current_user.company_id,
            created_by=current_user.id,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse statement: {str(e)}")

    return _build_import_response(import_record)


@router.get("/{account_id}/statements", response_model=List[BankStatementImportResponse])
def list_statement_imports(
    account_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all statement imports for a bank account."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    imports = db.query(BankStatementImport).filter(
        BankStatementImport.bank_account_id == account_id,
        BankStatementImport.company_id == current_user.company_id,
        BankStatementImport.deleted_at.is_(None),
    ).order_by(BankStatementImport.created_at.desc()).all()

    return [_build_import_response(i) for i in imports]


@router.get("/{account_id}/statements/{import_id}/lines", response_model=List[BankStatementLineResponse])
def get_statement_lines(
    account_id: UUID,
    import_id: UUID,
    unmatched_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all lines for a statement import."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    import_record = db.query(BankStatementImport).filter(
        BankStatementImport.id == import_id,
        BankStatementImport.bank_account_id == account_id,
        BankStatementImport.company_id == current_user.company_id,
        BankStatementImport.deleted_at.is_(None),
    ).first()
    if not import_record:
        raise HTTPException(status_code=404, detail="Statement import not found")

    query = db.query(BankStatementLine).filter(
        BankStatementLine.import_id == import_id,
        BankStatementLine.deleted_at.is_(None),
    )

    if unmatched_only:
        query = query.filter(BankStatementLine.is_matched == "N")

    lines = query.order_by(BankStatementLine.transaction_date.desc()).all()
    return [_build_line_response(l) for l in lines]


@router.get("/{account_id}/statements/{import_id}/suggestions")
def get_match_suggestions(
    account_id: UUID,
    import_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get match suggestions for all unmatched lines in a statement import."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    import_record = db.query(BankStatementImport).filter(
        BankStatementImport.id == import_id,
        BankStatementImport.bank_account_id == account_id,
        BankStatementImport.company_id == current_user.company_id,
        BankStatementImport.deleted_at.is_(None),
    ).first()
    if not import_record:
        raise HTTPException(status_code=404, detail="Statement import not found")

    suggestions = BankStatementImportService.suggest_matches(
        import_id=import_id,
        db=db,
        company_id=current_user.company_id,
    )
    return {"suggestions": suggestions}


@router.post("/{account_id}/statements/{import_id}/match", response_model=BankStatementLineResponse)
def match_statement_line(
    account_id: UUID,
    import_id: UUID,
    data: MatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Match or unmatch a statement line to a journal entry line."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    try:
        line = BankStatementImportService.match_line(
            line_id=data.line_id,
            je_line_id=data.je_line_id,
            db=db,
            company_id=current_user.company_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _build_line_response(line)


@router.delete("/{account_id}/statements/{import_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_statement_import(
    account_id: UUID,
    import_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a statement import and all its lines."""
    account = db.query(BankAccount).filter(
        BankAccount.id == account_id,
        BankAccount.company_id == current_user.company_id,
    ).first()
    if not account:
        raise HTTPException(status_code=404, detail="Bank account not found")

    try:
        BankStatementImportService.delete_import(
            import_id=import_id,
            db=db,
            company_id=current_user.company_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return None


def _build_import_response(import_record: BankStatementImport) -> dict:
    return {
        "id": import_record.id,
        "company_id": import_record.company_id,
        "bank_account_id": import_record.bank_account_id,
        "file_name": import_record.file_name,
        "statement_date_from": import_record.statement_date_from,
        "statement_date_to": import_record.statement_date_to,
        "total_debit": import_record.total_debit,
        "total_credit": import_record.total_credit,
        "status": import_record.status,
        "error_message": import_record.error_message,
        "created_at": import_record.created_at,
        "line_count": len([l for l in import_record.lines if l.deleted_at is None]),
    }


def _build_line_response(line: BankStatementLine) -> dict:
    return {
        "id": line.id,
        "import_id": line.import_id,
        "transaction_date": line.transaction_date,
        "description": line.description,
        "reference_number": line.reference_number,
        "debit_amount": line.debit_amount,
        "credit_amount": line.credit_amount,
        "is_matched": line.is_matched,
        "matched_je_line_id": line.matched_je_line_id,
        "match_score": line.match_score,
    }
