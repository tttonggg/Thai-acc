from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class PurchaseInvoice(BaseModel):
    __tablename__ = "purchase_invoices"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    purchase_order_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=True
    )

    bill_number = Column(String(50), nullable=False, unique=True)

    bill_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=False)

    # Status: draft, received, approved, partially_paid, paid, cancelled
    status = Column(String(20), nullable=False, default="draft")

    subtotal = Column(Numeric(19, 4), nullable=False, default=0)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=7)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    discount_amount = Column(Numeric(19, 4), nullable=False, default=0)
    paid_amount = Column(Numeric(19, 4), nullable=False, default=0)

    notes = Column(Text, nullable=True)

    items = relationship(
        "PurchaseInvoiceItem",
        back_populates="purchase_invoice",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    contact = relationship("Contact")
    project = relationship("Project")
    purchase_order = relationship(
        "PurchaseOrder",
        foreign_keys="PurchaseInvoice.purchase_order_id",
    )

    __table_args__ = (
        Index("ix_purchase_invoices_company_id", "company_id"),
        Index("ix_purchase_invoices_contact_id", "contact_id"),
        Index("ix_purchase_invoices_project_id", "project_id"),
        Index("ix_purchase_invoices_po_id", "purchase_order_id"),
        Index("ix_purchase_invoices_status", "status"),
        Index("ix_purchase_invoices_bill_date", "bill_date"),
        Index("ix_purchase_invoices_due_date", "due_date"),
    )


class PurchaseInvoiceItem(BaseModel):
    __tablename__ = "purchase_invoice_items"

    purchase_invoice_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_invoices.id"), nullable=False
    )
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(19, 4), nullable=False, default=1)
    unit_price = Column(Numeric(19, 4), nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)

    amount = Column(Numeric(19, 4), nullable=False, default=0)

    purchase_invoice = relationship("PurchaseInvoice", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("ix_purchase_invoice_items_pi_id", "purchase_invoice_id"),
    )
