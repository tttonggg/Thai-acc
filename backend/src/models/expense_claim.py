from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class ExpenseClaim(BaseModel):
    __tablename__ = "expense_claims"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)

    claim_number = Column(String(50), nullable=False, unique=True)

    employee_name = Column(String(100), nullable=False)
    expense_date = Column(Date, nullable=False)

    # Category for expense classification
    category = Column(
        String(50),
        nullable=False,
        default="other",
    )  # travel, meal, office, supplies, transportation, other

    description = Column(String(500), nullable=False)

    amount = Column(Numeric(19, 4), nullable=False, default=0)
    vat_amount = Column(Numeric(19, 4), nullable=False, default=0)
    total_amount = Column(Numeric(19, 4), nullable=False, default=0)

    receipt_url = Column(String(500), nullable=True)

    # Status: draft, submitted, approved, paid, rejected
    status = Column(String(20), nullable=False, default="draft")

    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approved_at = Column(Date, nullable=True)

    notes = Column(Text, nullable=True)

    contact = relationship("Contact")
    project = relationship("Project")
    approver = relationship("User")

    __table_args__ = (
        Index("ix_expense_claims_company_id", "company_id"),
        Index("ix_expense_claims_contact_id", "contact_id"),
        Index("ix_expense_claims_project_id", "project_id"),
        Index("ix_expense_claims_status", "status"),
        Index("ix_expense_claims_category", "category"),
        Index("ix_expense_claims_expense_date", "expense_date"),
    )
