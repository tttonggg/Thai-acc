from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index, CheckConstraint
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class ChartOfAccount(BaseModel):
    """Chart of Accounts - GL accounts."""
    __tablename__ = "chart_of_accounts"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    code = Column(String(20), nullable=False)
    name = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    
    # Account type: asset, liability, equity, revenue, expense
    account_type = Column(String(20), nullable=False)
    
    # Sub-type for reporting
    account_sub_type = Column(String(50), nullable=True)
    
    # Parent account for hierarchy
    parent_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=True)
    
    # Balance tracking (running balance)
    balance = Column(Numeric(19, 4), nullable=False, default=0)
    
    is_active = Column(String(1), nullable=False, default="Y")
    
    # Relationships
    parent = relationship("ChartOfAccount", remote_side="ChartOfAccount.id")
    
    __table_args__ = (
        Index("ix_coa_company_id", "company_id"),
        Index("ix_coa_code", "company_id", "code"),
        Index("ix_coa_type", "company_id", "account_type"),
        CheckConstraint("account_type IN ('asset', 'liability', 'equity', 'revenue', 'expense')", name="ck_coa_account_type"),
    )


class JournalEntry(BaseModel):
    """GL journal entry header."""
    __tablename__ = "journal_entries"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Reference to source document
    entry_type = Column(String(20), nullable=False)  # invoice, receipt, purchase, adjustment
    document_id = Column(UUID(as_uuid=True), nullable=True)
    document_number = Column(String(50), nullable=True)
    
    # Entry details
    entry_date = Column(Date, nullable=False)
    reference = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    
    # Totals (must balance)
    total_debit = Column(Numeric(19, 4), nullable=False, default=0)
    total_credit = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Status
    status = Column(String(20), nullable=False, default="posted")  # posted, reversed
    
    # Relationships
    lines = relationship("JournalEntryLine", back_populates="journal_entry", lazy="dynamic", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index("ix_journal_entries_company_id", "company_id"),
        Index("ix_journal_entries_date", "entry_date"),
        Index("ix_journal_entries_type", "entry_type"),
    )


class JournalEntryLine(BaseModel):
    """GL journal entry line (detail)."""
    __tablename__ = "journal_entry_lines"

    journal_entry_id = Column(UUID(as_uuid=True), ForeignKey("journal_entries.id"), nullable=False)
    account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=False)
    
    # Line details
    description = Column(String(255), nullable=True)
    debit_amount = Column(Numeric(19, 4), nullable=False, default=0)
    credit_amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # For sub-ledger tracking
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    
    # Project tracking
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)

    # Bank reconciliation
    is_reconciled = Column(String(1), nullable=False, default="N")
    reconciled_at = Column(Date, nullable=True)
    reconciled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="lines")
    account = relationship("ChartOfAccount")

    __table_args__ = (
        Index("ix_journal_lines_entry_id", "journal_entry_id"),
        Index("ix_journal_lines_account_id", "account_id"),
        Index("ix_journal_lines_reconciled", "is_reconciled"),
    )
