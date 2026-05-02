from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class Receipt(BaseModel):
    __tablename__ = "receipts"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    
    # Project tracking
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Document number
    receipt_number = Column(String(50), nullable=False, unique=True)
    
    # Dates
    receipt_date = Column(Date, nullable=False)
    
    # Currency
    currency_code = Column(String(3), nullable=False, default="THB")
    exchange_rate = Column(Numeric(19, 6), nullable=False, default=1)

    # Amounts
    amount = Column(Numeric(19, 4), nullable=False, default=0)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Payment method
    payment_method = Column(String(20), nullable=False, default="cash")  # cash, bank_transfer, cheque, credit_card, promptpay
    payment_reference = Column(String(100), nullable=True)  # Cheque number, transfer ref
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=True)
    
    # Status
    status = Column(String(20), nullable=False, default="active")  # active, cancelled
    
    # Notes
    notes = Column(Text, nullable=True)
    
    # WHT (Withholding Tax)
    wht_amount = Column(Numeric(19, 4), nullable=False, default=0)
    wht_rate = Column(Numeric(5, 2), nullable=False, default=0)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="receipts")
    contact = relationship("Contact")
    project = relationship("Project")
    
    __table_args__ = (
        Index("ix_receipts_company_id", "company_id"),
        Index("ix_receipts_invoice_id", "invoice_id"),
        Index("ix_receipts_receipt_date", "receipt_date"),
    )
