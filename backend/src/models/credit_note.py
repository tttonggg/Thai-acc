from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class CreditNote(BaseModel):
    __tablename__ = "credit_notes"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)

    document_number = Column(String(50), nullable=False, unique=True)
    issue_date = Column(Date, nullable=False)

    note_type = Column(String(20), nullable=False, default="sales_credit")  # sales_credit, sales_debit
    status = Column(String(20), nullable=False, default="draft")  # draft, confirmed, cancelled

    # Currency
    currency_code = Column(String(3), nullable=False, default="THB")
    exchange_rate = Column(Numeric(19, 6), nullable=False, default=1)

    # Amounts (in document currency)
    subtotal = Column(Numeric(19, 4), nullable=False, default=0)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=7)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)

    reason = Column(Text, nullable=True)
    confirmed_at = Column(Date, nullable=True)

    # Relationships
    items = relationship("CreditNoteItem", back_populates="credit_note", lazy="select", cascade="all, delete-orphan")
    contact = relationship("Contact")
    invoice = relationship("Invoice")

    __table_args__ = (
        Index("ix_credit_notes_company_id", "company_id"),
        Index("ix_credit_notes_contact_id", "contact_id"),
        Index("ix_credit_notes_invoice_id", "invoice_id"),
        Index("ix_credit_notes_note_type", "note_type"),
        Index("ix_credit_notes_status", "status"),
        Index("ix_credit_notes_issue_date", "issue_date"),
    )


class CreditNoteItem(BaseModel):
    __tablename__ = "credit_note_items"

    credit_note_id = Column(UUID(as_uuid=True), ForeignKey("credit_notes.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(19, 4), nullable=False, default=1)
    unit_price = Column(Numeric(19, 4), nullable=False, default=0)
    amount = Column(Numeric(19, 4), nullable=False, default=0)

    credit_note = relationship("CreditNote", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("ix_credit_note_items_credit_note_id", "credit_note_id"),
        Index("ix_credit_note_items_product_id", "product_id"),
    )
