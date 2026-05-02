from sqlalchemy import Column, String, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class ETaxSubmission(BaseModel):
    """Track e-Tax invoice submission history."""
    __tablename__ = "e_tax_submissions"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=False)

    # Submission tracking
    submission_type = Column(String(20), nullable=False, default="email")  # email, api
    status = Column(String(20), nullable=False, default="pending")  # pending, submitted, confirmed, failed

    # XML payload
    xml_payload = Column(Text, nullable=True)

    # Response from RD
    timestamp = Column(String(100), nullable=True)
    response_message = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Submitted date (when sent to RD)
    submitted_at = Column(Date, nullable=True)

    # Relationships
    invoice = relationship("Invoice")
