from sqlalchemy import Column, String, Text, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class Contact(BaseModel):
    __tablename__ = "contacts"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    type = Column(String(20), nullable=False)  # customer, vendor, both
    name = Column(String(255), nullable=False)
    name_en = Column(String(255), nullable=True)
    tax_id = Column(String(13), nullable=True)
    branch_number = Column(String(5), default="00000", nullable=True)
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    
    # Credit settings
    credit_limit = Column(Numeric(19, 4), default=0, nullable=False)
    credit_days = Column(Numeric(19, 4), default=0, nullable=False)
    
    # Relationships
    company = relationship("Company", back_populates="contacts")
    
    __table_args__ = (
        Index("ix_contacts_company_id", "company_id"),
        Index("ix_contacts_type", "type"),
        Index("ix_contacts_company_tax", "company_id", "tax_id"),
    )
