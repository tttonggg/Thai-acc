from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class PurchaseOrder(BaseModel):
    __tablename__ = "purchase_orders"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)

    po_number = Column(String(50), nullable=False, unique=True)

    order_date = Column(Date, nullable=False)
    expected_date = Column(Date, nullable=True)

    # Status: draft, sent, confirmed, received, billed, cancelled
    status = Column(String(20), nullable=False, default="draft")

    # Currency
    currency_code = Column(String(3), nullable=False, default="THB")
    exchange_rate = Column(Numeric(19, 6), nullable=False, default=1)

    subtotal = Column(Numeric(19, 4), nullable=False, default=0)
    vat_rate = Column(Numeric(5, 2), nullable=False, default=7)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    discount_amount = Column(Numeric(19, 4), nullable=False, default=0)

    notes = Column(Text, nullable=True)

    converted_to_purchase_invoice_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_invoices.id"), nullable=True
    )

    items = relationship(
        "PurchaseOrderItem",
        back_populates="purchase_order",
        lazy="dynamic",
        cascade="all, delete-orphan",
    )
    contact = relationship("Contact")
    project = relationship("Project")
    converted_purchase_invoice = relationship(
        "PurchaseInvoice",
        foreign_keys="PurchaseOrder.converted_to_purchase_invoice_id",
    )

    __table_args__ = (
        Index("ix_purchase_orders_company_id", "company_id"),
        Index("ix_purchase_orders_contact_id", "contact_id"),
        Index("ix_purchase_orders_project_id", "project_id"),
        Index("ix_purchase_orders_status", "status"),
        Index("ix_purchase_orders_order_date", "order_date"),
    )


class PurchaseOrderItem(BaseModel):
    __tablename__ = "purchase_order_items"

    purchase_order_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_orders.id"), nullable=False
    )
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=True)

    description = Column(String(500), nullable=False)
    quantity = Column(Numeric(19, 4), nullable=False, default=1)
    unit_price = Column(Numeric(19, 4), nullable=False, default=0)
    discount_percent = Column(Numeric(5, 2), nullable=False, default=0)

    amount = Column(Numeric(19, 4), nullable=False, default=0)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")

    __table_args__ = (
        Index("ix_purchase_order_items_po_id", "purchase_order_id"),
    )
