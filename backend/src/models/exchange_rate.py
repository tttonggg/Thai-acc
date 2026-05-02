from sqlalchemy import Column, String, Numeric, Date, ForeignKey, Index
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class ExchangeRate(BaseModel):
    __tablename__ = "exchange_rates"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    
    from_currency = Column(String(3), nullable=False)  # e.g. USD
    to_currency = Column(String(3), nullable=False)    # e.g. THB
    rate = Column(Numeric(19, 6), nullable=False)      # e.g. 36.50
    effective_date = Column(Date, nullable=False)
    
    source = Column(String(50), nullable=True)  # "manual", "bot", "ecb"
    
    __table_args__ = (
        Index("ix_exchange_rates_company_id", "company_id"),
        Index("ix_exchange_rates_currency_pair", "company_id", "from_currency", "to_currency"),
        Index("ix_exchange_rates_effective_date", "company_id", "effective_date"),
    )
