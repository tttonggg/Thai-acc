from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index, CheckConstraint
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class BankStatementLine(BaseModel):
    """Individual line from a bank statement import."""
    __tablename__ = "bank_statement_lines"

    import_id = Column(UUID(as_uuid=True), ForeignKey("bank_statement_imports.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)
    debit_amount = Column(Numeric(19, 4), default=0)
    credit_amount = Column(Numeric(19, 4), default=0)
    is_matched = Column(String(1), nullable=False, default="N")  # Y/N
    matched_je_line_id = Column(UUID(as_uuid=True), ForeignKey("journal_entry_lines.id"), nullable=True)
    match_score = Column(Numeric(3, 2), nullable=True)  # 0.00 to 1.00

    # Relationships
    import_ = relationship("BankStatementImport", back_populates="lines")
    matched_je_line = relationship("JournalEntryLine")

    __table_args__ = (
        Index("ix_bank_stmt_lines_import_id", "import_id"),
        Index("ix_bank_stmt_lines_transaction_date", "transaction_date"),
        CheckConstraint("is_matched IN ('Y', 'N')", name="ck_stmt_line_matched"),
    )
