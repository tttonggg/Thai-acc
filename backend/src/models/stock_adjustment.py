from sqlalchemy import Column, String, Numeric, ForeignKey, Index, Text
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class StockAdjustment(BaseModel):
    __tablename__ = "stock_adjustments"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    adjustment_type = Column(String(20), nullable=False)
    # initial, loss, damage, found, correction

    quantity_change = Column(Numeric(19, 4), nullable=False)
    # positive = increase stock, negative = decrease stock

    unit_cost = Column(Numeric(19, 4), nullable=False, default=0)
    total_value = Column(Numeric(19, 4), nullable=False, default=0)

    reason = Column(Text, nullable=True)
    reference_number = Column(String(100), nullable=True)

    # Relationships
    product = relationship("Product")

    __table_args__ = (
        Index("ix_stock_adjustments_company_id", "company_id"),
        Index("ix_stock_adjustments_product_id", "product_id"),
        Index("ix_stock_adjustments_type", "company_id", "adjustment_type"),
    )


class StockMovement(BaseModel):
    __tablename__ = "stock_movements"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False)

    movement_type = Column(String(20), nullable=False)
    # sale, purchase, adjustment, return

    quantity_before = Column(Numeric(19, 4), nullable=False)
    quantity_change = Column(Numeric(19, 4), nullable=False)
    quantity_after = Column(Numeric(19, 4), nullable=False)

    unit_cost = Column(Numeric(19, 4), nullable=False, default=0)
    total_value = Column(Numeric(19, 4), nullable=False, default=0)

    reference_document_type = Column(String(50), nullable=True)
    # invoice, purchase_invoice, stock_adjustment
    reference_document_id = Column(UUID(as_uuid=True), nullable=True)

    # Relationships
    product = relationship("Product")

    __table_args__ = (
        Index("ix_stock_movements_company_id", "company_id"),
        Index("ix_stock_movements_product_id", "product_id"),
        Index("ix_stock_movements_type", "company_id", "movement_type"),
        Index("ix_stock_movements_reference", "reference_document_type", "reference_document_id"),
    )
