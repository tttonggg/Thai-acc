from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class Quotation(BaseModel):
    __tablename__ = "quotations"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    quotation_number = Column(String(50), nullable=False, unique=True)
    
    # Dates
    issue_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=True)
    
    # Status: draft, sent, accepted, rejected, converted
    status = Column(String(20), nullable=False, default="draft")
    
    # Amounts (all THB)
    subtotal = Column(Numeric(19, 4), nullable=False, default=0)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=7)  # Default 7%
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    discount_amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Notes
    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    
    # Project tracking
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    # Reference to converted invoice
    converted_to_invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)
    
    # Relationships
    items = relationship("QuotationItem", back_populates="quotation", lazy="dynamic", cascade="all, delete-orphan")
    contact = relationship("Contact")
    project = relationship("Project")
    
    __table_args__ = (
        Index("ix_quotations_company_id", "company_id"),
        Index("ix_quotations_contact_id", "contact_id"),
        Index("ix_quotations_project_id", "project_id"),
        Index("ix_quotations_status", "status"),
        Index("ix_quotations_issue_date", "issue_date"),
    )


class QuotationItem(BaseModel):
    __tablename__ = "quotation_items"

    quotation_id = Column(UUID(as_uuid=True), ForeignKey("quotations.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)
    
    # Item details
    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(19, 4), nullable=False, default=1)
    unit_price = Column(Numeric(19, 4), nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)
    
    # Calculated
    amount = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Relationships
    quotation = relationship("Quotation", back_populates="items")
    product = relationship("Product")
    
    __table_args__ = (
        Index("ix_quotation_items_quotation_id", "quotation_id"),
    )
