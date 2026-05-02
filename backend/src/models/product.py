from sqlalchemy import Column, String, Text, Numeric, Boolean, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class Product(BaseModel):
    __tablename__ = "products"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    sku = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    
    # Pricing
    unit_price = Column(Numeric(19, 4), default=0, nullable=False)
    cost_price = Column(Numeric(19, 4), default=0, nullable=False)
    
    # Inventory
    track_inventory = Column(Boolean, default=True, nullable=False)
    cost_method = Column(String(10), default="FIFO", nullable=False)  # FIFO, AVG
    quantity_on_hand = Column(Numeric(19, 4), default=0, nullable=False)
    reorder_point = Column(Numeric(19, 4), default=0, nullable=False)
    
    # Unit
    unit_name = Column(String(50), default="ชิ้น", nullable=False)
    
    # Category
    category = Column(String(100), nullable=True)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="products")
    
    __table_args__ = (
        Index("ix_products_company_id", "company_id"),
        Index("ix_products_sku", "company_id", "sku"),
        Index("ix_products_category", "company_id", "category"),
    )
