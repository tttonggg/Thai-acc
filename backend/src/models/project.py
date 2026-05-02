from sqlalchemy import Column, String, Text, Date, Numeric, ForeignKey, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class Project(BaseModel):
    """Projects for cost control and tracking."""
    __tablename__ = "projects"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    # Project code / controlling number
    project_code = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Project details
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    
    # Budget control
    budget_amount = Column(Numeric(19, 4), nullable=False, default=0)
    actual_cost = Column(Numeric(19, 4), nullable=False, default=0)
    
    # Status: active, completed, cancelled
    status = Column(String(20), nullable=False, default="active")
    
    # Customer reference (optional)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    
    # Relationships
    contact = relationship("Contact")
    
    __table_args__ = (
        Index("ix_projects_company_id", "company_id"),
        Index("ix_projects_code", "company_id", "project_code"),
        Index("ix_projects_status", "status"),
    )
