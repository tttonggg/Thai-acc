from sqlalchemy import Column, String, Integer, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel


class DocumentSequence(BaseModel):
    """Tracks sequential document numbers per company, year, and document type."""
    __tablename__ = "document_sequences"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    year = Column(Integer, nullable=False)
    doc_type = Column(String(10), nullable=False)  # QT, IV, RE, TX, PO, EX
    prefix = Column(String(10), nullable=False)
    last_number = Column(Integer, nullable=False, default=0)
    
    __table_args__ = (
        Index("ix_doc_sequences_company_year_type", "company_id", "year", "doc_type", unique=True),
    )
    
    def get_next_number(self) -> int:
        """Get next sequential number."""
        self.last_number += 1
        return self.last_number
    
    def format_number(self) -> str:
        """Format as {PREFIX}-{YEAR}-{SEQUENCE:04d}."""
        return f"{self.prefix}-{self.year}-{self.last_number:04d}"
