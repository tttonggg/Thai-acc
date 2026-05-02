from sqlalchemy import Column, String, Boolean, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class Company(BaseModel):
    __tablename__ = "companies"

    name = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    tax_id = Column(String(13), nullable=False, unique=True)
    branch_number = Column(String(5), default="00000", nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    logo_url = Column(String(500), nullable=True)
    
    # Fiscal year settings
    fiscal_year_start_month = Column(Integer, default=1, nullable=False)
    
    # Document numbering prefixes
    quotation_prefix = Column(String(10), default="QT", nullable=False)
    invoice_prefix = Column(String(10), default="IV", nullable=False)
    receipt_prefix = Column(String(10), default="RE", nullable=False)
    tax_invoice_prefix = Column(String(10), default="TX", nullable=False)
    purchase_order_prefix = Column(String(10), default="PO", nullable=False)
    expense_prefix = Column(String(10), default="EX", nullable=False)
    
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Relationships
    users = relationship("User", back_populates="company", lazy="dynamic")
    contacts = relationship("Contact", back_populates="company", lazy="dynamic")
    products = relationship("Product", back_populates="company", lazy="dynamic")
