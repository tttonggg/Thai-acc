from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class Invoice(BaseModel):
    __tablename__ = "invoices"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    
    # Document numbers
    invoice_number = Column(String(50), nullable=False, unique=True)
    tax_invoice_number = Column(String(50), nullable=True, unique=True)
    
    # Source
    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id"), nullable=True)
    
    # Project tracking
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Dates
    issue_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)
    
    # Status: draft, sent, paid, partially_paid, overdue, cancelled
    status = Column(String(20), nullable=False, default="draft")
    
    # Amounts
    subtotal = Column(Numeric(19, 4), nullable=False, default=0)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=7)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    discount_amount = Column(Numeric(19, 4), nullable=False, default=0)
    paid_amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Notes
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    
    # e-Tax
    is_e_tax = Column(String(1), nullable=False, default="N")  # Y/N
    e_tax_status = Column(String(20), nullable=False, default="pending")  # pending, generated, submitted, confirmed, failed
    e_tax_xml = Column(Text, nullable=True)
    e_tax_timestamp = Column(String(100), nullable=True)
    e_tax_submitted_at = Column(Date, nullable=True)
    e_tax_error = Column(Text, nullable=True)
    
    # Relationships
    items = relationship("InvoiceItem", back_populates="invoice", lazy="dynamic", cascade="all, delete-orphan")
    contact = relationship("Contact")
    project = relationship("Project")
    receipts = relationship("Receipt", back_populates="invoice", lazy="dynamic")
    
    __table_args__ = (
        Index("ix_invoices_company_id", "company_id"),
        Index("ix_invoices_contact_id", "contact_id"),
        Index("ix_invoices_project_id", "project_id"),
        Index("ix_invoices_status", "status"),
        Index("ix_invoices_issue_date", "issue_date"),
        Index("ix_invoices_due_date", "due_date"),
    )


class InvoiceItem(BaseModel):
    __tablename__ = "invoice_items"

    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    
    # Item details
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(19, 4), nullable=False, default=1)
    unit_price = Column(Numeric(19, 4), nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)
    
    # Calculated
    amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product")
    
    __table_args__ = (
        Index("ix_invoice_items_invoice_id", "invoice_id"),
    )
