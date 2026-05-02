from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.exchange_rate import ExchangeRate

router = APIRouter()


class ExchangeRateCreate(BaseModel):
    from_currency: str = Field(..., pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    to_currency: str = Field(..., pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    rate: Decimal = Field(..., gt=0)
    effective_date: date


class ExchangeRateResponse(BaseModel):
    id: UUID
    company_id: UUID
    from_currency: str
    to_currency: str
    rate: Decimal
    effective_date: date
    source: Optional[str]
    created_at: date

    class Config:
        from_attributes = True


@router.get("", response_model=List[ExchangeRateResponse])
def list_exchange_rates(
    from_currency: Optional[str] = None,
    to_currency: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ExchangeRate).filter(
        ExchangeRate.company_id == current_user.company_id,
    ).order_by(ExchangeRate.effective_date.desc())
    
    if from_currency:
        query = query.filter(ExchangeRate.from_currency == from_currency)
    if to_currency:
        query = query.filter(ExchangeRate.to_currency == to_currency)
    
    return query.all()


@router.post("", response_model=ExchangeRateResponse)
def create_exchange_rate(
    data: ExchangeRateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rate = ExchangeRate(
        company_id=current_user.company_id,
        from_currency=data.from_currency,
        to_currency=data.to_currency,
        rate=data.rate,
        effective_date=data.effective_date,
        source="manual",
    )
    db.add(rate)
    db.commit()
    db.refresh(rate)
    return rate


@router.get("/latest/{from_currency}/{to_currency}")
def get_latest_rate(
    from_currency: str,
    to_currency: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rate = db.query(ExchangeRate).filter(
        ExchangeRate.company_id == current_user.company_id,
        ExchangeRate.from_currency == from_currency,
        ExchangeRate.to_currency == to_currency,
    ).order_by(ExchangeRate.effective_date.desc()).first()
    
    if not rate:
        # Default rates (fallback)
        defaults = {
            ("USD", "THB"): Decimal("36.50"),
            ("EUR", "THB"): Decimal("39.50"),
            ("CNY", "THB"): Decimal("5.05"),
            ("JPY", "THB"): Decimal("0.245"),
            ("GBP", "THB"): Decimal("46.20"),
        }
        default_rate = defaults.get((from_currency, to_currency))
        if default_rate:
            return {"from_currency": from_currency, "to_currency": to_currency, "rate": default_rate, "source": "default"}
        raise HTTPException(status_code=404, detail="Exchange rate not found")
    
    return {"from_currency": rate.from_currency, "to_currency": rate.to_currency, "rate": rate.rate, "source": rate.source}
