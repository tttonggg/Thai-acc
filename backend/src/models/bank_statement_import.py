from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class BankStatementImport(BaseModel):
    """Bank statement import header."""
    __tablename__ = "bank_statement_imports"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    statement_date_from = Column(Date, nullable=True)
    statement_date_to = Column(Date, nullable=True)
    total_debit = Column(Numeric(19, 4), default=0)
    total_credit = Column(Numeric(19, 4), default=0)
    status = Column(String(20), nullable=False, default="pending")  # pending, processing, completed, failed
    error_message = Column(Text, nullable=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    # Relationships
    bank_account = relationship("BankAccount")
    lines = relationship("BankStatementLine", back_populates="import_", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_bank_stmt_imports_company_id", "company_id"),
        Index("ix_bank_stmt_imports_bank_account_id", "bank_account_id"),
        CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed')", name="ck_stmt_import_status"),
    )
