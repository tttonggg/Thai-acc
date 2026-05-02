from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.product import Product
from ....models.stock_adjustment import StockAdjustment, StockMovement
from ....services.gl_posting import GLPostingService

router = APIRouter()


class StockAdjustmentCreate(BaseModel):
    product_id: UUID
    adjustment_type: str = Field(..., pattern="^(initial|loss|damage|found|correction)$")
    quantity_change: Decimal = Field(..., gt=0)
    unit_cost: Decimal = Field(default=Decimal("0"), ge=0)
    reason: Optional[str] = None
    reference_number: Optional[str] = None


class StockAdjustmentResponse(BaseModel):
    id: UUID
    company_id: UUID
    product_id: UUID
    adjustment_type: str
    quantity_change: Decimal
    unit_cost: Decimal
    total_value: Decimal
    reason: Optional[str]
    reference_number: Optional[str]
    created_at: str

    class Config:
        from_attributes = True


class StockMovementResponse(BaseModel):
    id: UUID
    company_id: UUID
    product_id: UUID
    movement_type: str
    quantity_before: Decimal
    quantity_change: Decimal
    quantity_after: Decimal
    unit_cost: Decimal
    total_value: Decimal
    reference_document_type: Optional[str]
    reference_document_id: Optional[UUID]
    created_at: str

    class Config:
        from_attributes = True


@router.post("", response_model=StockAdjustmentResponse, status_code=status.HTTP_201_CREATED)
def create_stock_adjustment(
    data: StockAdjustmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate product
    product = db.query(Product).filter(
        Product.id == data.product_id,
        Product.company_id == current_user.company_id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Calculate total value
    if data.unit_cost > 0:
        unit_cost = data.unit_cost
    else:
        unit_cost = product.cost_price if product.cost_price else Decimal("0")

    # Determine actual quantity change direction
    if data.adjustment_type in ["loss", "damage"]:
        qty_change = -abs(data.quantity_change)
    else:
        qty_change = abs(data.quantity_change)

    total_value = abs(qty_change) * unit_cost

    # Check if reducing stock below zero
    if qty_change < 0 and product.quantity_on_hand + qty_change < 0:
        raise HTTPException(status_code=400, detail="Cannot reduce stock below zero")

    # Create adjustment
    adjustment = StockAdjustment(
        company_id=current_user.company_id,
        product_id=data.product_id,
        adjustment_type=data.adjustment_type,
        quantity_change=qty_change,
        unit_cost=unit_cost,
        total_value=total_value,
        reason=data.reason,
        reference_number=data.reference_number,
    )
    db.add(adjustment)

    # Record movement
    qty_before = product.quantity_on_hand
    qty_after = qty_before + qty_change

    movement = StockMovement(
        company_id=current_user.company_id,
        product_id=data.product_id,
        movement_type="adjustment",
        quantity_before=qty_before,
        quantity_change=qty_change,
        quantity_after=qty_after,
        unit_cost=unit_cost,
        total_value=total_value,
        reference_document_type="stock_adjustment",
    )
    db.add(movement)

    # Update product stock
    product.quantity_on_hand = qty_after

    # Flush to get IDs
    db.flush()

    # Link movement to adjustment
    movement.reference_document_id = adjustment.id

    # Post GL if value > 0
    if total_value > 0:
        try:
            gl_service = GLPostingService(db, str(current_user.company_id))
            gl_service.post_stock_adjustment(adjustment, str(current_user.id))
        except Exception:
            # GL posting failure shouldn't block adjustment
            db.rollback()
            pass

    db.commit()
    db.refresh(adjustment)
    return adjustment


@router.get("", response_model=List[StockAdjustmentResponse])
def list_stock_adjustments(
    product_id: Optional[UUID] = None,
    adjustment_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(StockAdjustment).filter(
        StockAdjustment.company_id == current_user.company_id,
    ).order_by(StockAdjustment.created_at.desc())

    if product_id:
        query = query.filter(StockAdjustment.product_id == product_id)
    if adjustment_type:
        query = query.filter(StockAdjustment.adjustment_type == adjustment_type)

    return query.all()


@router.get("/movements/{product_id}", response_model=List[StockMovementResponse])
def get_stock_movements(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate product belongs to company
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id,
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    movements = db.query(StockMovement).filter(
        StockMovement.product_id == product_id,
        StockMovement.company_id == current_user.company_id,
    ).order_by(StockMovement.created_at.desc()).all()

    return movements
