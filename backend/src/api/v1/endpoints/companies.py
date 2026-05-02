from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID

from ....core.database import get_db
from ....core.security import get_current_user, require_role
from ....models.company import Company
from ....models.user import User
from ....utils.seed_coa import seed_coa_for_company

router = APIRouter()


class CompanyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: str = Field(..., min_length=13, max_length=13)
    branch_number: str = Field(default="00000", max_length=5)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    fiscal_year_start_month: int = Field(default=1, ge=1, le=12)


class CompanyUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    fiscal_year_start_month: Optional[int] = Field(None, ge=1, le=12)


class CompanyResponse(BaseModel):
    id: UUID
    name: str
    name_en: Optional[str]
    tax_id: str
    branch_number: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    fiscal_year_start_month: int
    is_active: bool

    class Config:
        from_attributes = True


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    data: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role("admin")
    
    # Check for duplicate tax_id
    existing = db.query(Company).filter(Company.tax_id == data.tax_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this tax ID already exists")
    
    company = Company(**data.model_dump())
    db.add(company)
    db.commit()
    db.refresh(company)
    
    # Auto-seed Chart of Accounts for new company
    seed_coa_for_company(db, str(company.id))
    
    return company


@router.get("/my", response_model=CompanyResponse)
def get_my_company(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get the current user's company."""
    company = db.query(Company).filter(
        Company.id == current_user.company_id,
        Company.deleted_at.is_(None)
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/my", response_model=CompanyResponse)
def update_my_company(
    data: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the current user's company."""
    require_role("admin")
    
    company = db.query(Company).filter(
        Company.id == current_user.company_id
    ).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(company, field, value)
    
    db.commit()
    db.refresh(company)
    return company


@router.get("", response_model=List[CompanyResponse])
def list_companies(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role("admin")
    return db.query(Company).filter(Company.deleted_at.is_(None)).all()


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(
    company_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    require_role("admin")
    company = db.query(Company).filter(Company.id == company_id, Company.deleted_at.is_(None)).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company
