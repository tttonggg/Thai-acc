from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.product import Product
from ....models.user import User

router = APIRouter()


class ProductCreate(BaseModel):
    sku: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    unit_price: Decimal = Field(default=Decimal("0"), ge=0)
    cost_price: Decimal = Field(default=Decimal("0"), ge=0)
    track_inventory: bool = True
    cost_method: str = Field(default="FIFO", pattern="^(FIFO|AVG)$")
    quantity_on_hand: Decimal = Field(default=Decimal("0"), ge=0)
    reorder_point: Decimal = Field(default=Decimal("0"), ge=0)
    unit_name: str = Field(default="ชิ้น", max_length=50)
    category: Optional[str] = Field(None, max_length=100)


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, min_length=1, max_length=100)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    track_inventory: Optional[bool] = None
    cost_method: Optional[str] = Field(None, pattern="^(FIFO|AVG)$")
    quantity_on_hand: Optional[Decimal] = Field(None, ge=0)
    reorder_point: Optional[Decimal] = Field(None, ge=0)
    unit_name: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None


class ProductResponse(BaseModel):
    id: UUID
    company_id: UUID
    sku: str
    name: str
    name_en: Optional[str]
    description: Optional[str]
    unit_price: Decimal
    cost_price: Decimal
    track_inventory: bool
    cost_method: str
    quantity_on_hand: Decimal
    reorder_point: Decimal
    unit_name: str
    category: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check for duplicate SKU within the SAME company
    existing = db.query(Product).filter(
        Product.company_id == current_user.company_id,
        Product.sku == data.sku,
        Product.deleted_at.is_(None)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Product with this SKU already exists in your company")
    
    product = Product(company_id=current_user.company_id, **data.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.get("", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Product).filter(
        Product.company_id == current_user.company_id,
        Product.deleted_at.is_(None)
    )
    
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    return query.order_by(Product.name).all()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id,
        Product.deleted_at.is_(None)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: UUID,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # If SKU is being updated, check for duplicates
    update_data = data.model_dump(exclude_unset=True)
    if "sku" in update_data and update_data["sku"] != product.sku:
        existing = db.query(Product).filter(
            Product.company_id == current_user.company_id,
            Product.sku == update_data["sku"],
            Product.id != product_id,
            Product.deleted_at.is_(None)
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product with this SKU already exists in your company")
    
    for field, value in update_data.items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Soft delete
    from datetime import datetime
    product.deleted_at = datetime.utcnow()
    db.commit()
    return None
