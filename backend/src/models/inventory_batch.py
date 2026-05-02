from sqlalchemy import Column, String, Date, Numeric, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class InventoryBatch(BaseModel):
    __tablename__ = "inventory_batches"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    # Batch details
    quantity = Column(Numeric(19, 4), nullable=False)        # original quantity purchased
    unit_cost = Column(Numeric(19, 4), nullable=False)       # cost per unit
    remaining_qty = Column(Numeric(19, 4), nullable=False)   # quantity still available

    # Source
    purchase_date = Column(Date, nullable=False)
    purchase_invoice_id = Column(UUID(as_uuid=True), ForeignKey("purchase_invoices.id"), nullable=True)

    # Status
    is_active = Column(Boolean, default=True, nullable=False)

    # Relationships
    product = relationship("Product")
    purchase_invoice = relationship("PurchaseInvoice")

    __table_args__ = (
        Index("ix_inventory_batches_company_id", "company_id"),
        Index("ix_inventory_batches_product_id", "product_id"),
        Index("ix_inventory_batches_pi_id", "purchase_invoice_id"),
    )
