from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index, CheckConstraint
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class BankAccount(BaseModel):
    """Cash and bank accounts for finance module."""
    __tablename__ = "bank_accounts"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    account_number = Column(String(50), nullable=True)
    bank_name = Column(String(100), nullable=True)
    account_type = Column(String(20), nullable=False, default="cash")  # cash, bank, promptpay
    
    # Balance tracking
    opening_balance = Column(Numeric(19, 4), nullable=False, default=0)
    current_balance = Column(Numeric(19, 4), nullable=False, default=0)
    
    # For PromptPay
    promptpay_number = Column(String(15), nullable=True)

    # Link to GL account for reconciliation
    gl_account_id = Column(UUID(as_uuid=True), ForeignKey("chart_of_accounts.id"), nullable=True)

    is_active = Column(String(1), nullable=False, default="Y")

    # Relationships
    gl_account = relationship("ChartOfAccount")

    __table_args__ = (
        Index("ix_bank_accounts_company_id", "company_id"),
        Index("ix_bank_accounts_gl_account_id", "gl_account_id"),
        CheckConstraint("account_type IN ('cash', 'bank', 'promptpay')", name="ck_bank_account_type"),
    )
