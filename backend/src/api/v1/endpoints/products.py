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
from ....models.quotation import Quotation, QuotationItem
from ....models.invoice import Invoice, InvoiceItem
from ....models.purchase_order import PurchaseOrder, PurchaseOrderItem
from ....models.purchase_invoice import PurchaseInvoice, PurchaseInvoiceItem
from datetime import datetime

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
    product.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ============================================================
# Product Transaction History
# ============================================================

class ProductTransactionItem(BaseModel):
    id: UUID
    document_type: str
    document_type_label: str
    document_number: str
    document_date: str
    status: str
    status_label: str
    contact_name: Optional[str]
    description: Optional[str]
    quantity: Decimal
    unit_price: Decimal
    amount: Decimal
    link: str


class ProductTransactionSummary(BaseModel):
    total_sold_quantity: Decimal
    total_purchased_quantity: Decimal
    total_sold_amount: Decimal
    total_purchased_amount: Decimal
    quotation_count: int
    invoice_count: int
    purchase_order_count: int
    purchase_invoice_count: int


class ProductTransactionsResponse(BaseModel):
    product: ProductResponse
    summary: ProductTransactionSummary
    transactions: List[ProductTransactionItem]


@router.get("/{product_id}/transactions", response_model=ProductTransactionsResponse)
def get_product_transactions(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unified transaction history for a product across all document types."""
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id,
        Product.deleted_at.is_(None)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Query quotation items with parent document
    quotation_items = db.query(QuotationItem, Quotation).join(
        Quotation, QuotationItem.quotation_id == Quotation.id
    ).filter(
        QuotationItem.product_id == product_id,
        Quotation.company_id == current_user.company_id,
        Quotation.deleted_at.is_(None)
    ).all()

    # Query invoice items with parent document
    invoice_items = db.query(InvoiceItem, Invoice).join(
        Invoice, InvoiceItem.invoice_id == Invoice.id
    ).filter(
        InvoiceItem.product_id == product_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None)
    ).all()

    # Query purchase order items with parent document
    po_items = db.query(PurchaseOrderItem, PurchaseOrder).join(
        PurchaseOrder, PurchaseOrderItem.purchase_order_id == PurchaseOrder.id
    ).filter(
        PurchaseOrderItem.product_id == product_id,
        PurchaseOrder.company_id == current_user.company_id,
        PurchaseOrder.deleted_at.is_(None)
    ).all()

    # Query purchase invoice items with parent document
    pi_items = db.query(PurchaseInvoiceItem, PurchaseInvoice).join(
        PurchaseInvoice, PurchaseInvoiceItem.purchase_invoice_id == PurchaseInvoice.id
    ).filter(
        PurchaseInvoiceItem.product_id == product_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None)
    ).all()

    # Build unified transaction list
    transactions = []

    for item, doc in quotation_items:
        transactions.append(ProductTransactionItem(
            id=item.id,
            document_type="quotation",
            document_type_label="ใบเสนอราคา",
            document_number=doc.quotation_number,
            document_date=doc.issue_date.isoformat() if doc.issue_date else "",
            status=doc.status,
            status_label=_get_status_label(doc.status, "quotation"),
            contact_name=doc.contact.name if doc.contact else None,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            amount=item.amount,
            link=f"/income/quotations/{doc.id}"
        ))

    for item, doc in invoice_items:
        transactions.append(ProductTransactionItem(
            id=item.id,
            document_type="invoice",
            document_type_label="ใบแจ้งหนี้",
            document_number=doc.invoice_number,
            document_date=doc.issue_date.isoformat() if doc.issue_date else "",
            status=doc.status,
            status_label=_get_status_label(doc.status, "invoice"),
            contact_name=doc.contact.name if doc.contact else None,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            amount=item.amount,
            link=f"/income/invoices/{doc.id}"
        ))

    for item, doc in po_items:
        transactions.append(ProductTransactionItem(
            id=item.id,
            document_type="purchase_order",
            document_type_label="ใบสั่งซื้อ",
            document_number=doc.po_number,
            document_date=doc.order_date.isoformat() if doc.order_date else "",
            status=doc.status,
            status_label=_get_status_label(doc.status, "purchase_order"),
            contact_name=doc.contact.name if doc.contact else None,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            amount=item.amount,
            link=f"/expenses/purchase-orders/{doc.id}"
        ))

    for item, doc in pi_items:
        transactions.append(ProductTransactionItem(
            id=item.id,
            document_type="purchase_invoice",
            document_type_label="ใบรับสินค้า",
            document_number=doc.bill_number,
            document_date=doc.bill_date.isoformat() if doc.bill_date else "",
            status=doc.status,
            status_label=_get_status_label(doc.status, "purchase_invoice"),
            contact_name=doc.contact.name if doc.contact else None,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            amount=item.amount,
            link=f"/expenses/purchase-invoices/{doc.id}"
        ))

    # Sort by date descending
    transactions.sort(key=lambda x: x.document_date or "", reverse=True)

    # Calculate summary
    total_sold_qty = sum(item.quantity for item, doc in invoice_items)
    total_purchased_qty = sum(item.quantity for item, doc in po_items) + sum(item.quantity for item, doc in pi_items)
    total_sold_amt = sum(item.amount for item, doc in invoice_items)
    total_purchased_amt = sum(item.amount for item, doc in po_items) + sum(item.amount for item, doc in pi_items)

    summary = ProductTransactionSummary(
        total_sold_quantity=total_sold_qty,
        total_purchased_quantity=total_purchased_qty,
        total_sold_amount=total_sold_amt,
        total_purchased_amount=total_purchased_amt,
        quotation_count=len(quotation_items),
        invoice_count=len(invoice_items),
        purchase_order_count=len(po_items),
        purchase_invoice_count=len(pi_items)
    )

    return ProductTransactionsResponse(
        product=product,
        summary=summary,
        transactions=transactions[:100]
    )


# ============================================================
# FIFO Inventory Layers
# ============================================================

class FifoLayerItem(BaseModel):
    id: UUID
    quantity: Decimal
    unit_cost: Decimal
    remaining_qty: Decimal
    purchase_date: str
    purchase_invoice_id: Optional[UUID]
    is_active: bool


@router.get("/{product_id}/fifo-layers", response_model=List[FifoLayerItem])
def get_product_fifo_layers(
    product_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get FIFO inventory batches for a product."""
    from ....models.inventory_batch import InventoryBatch

    product = db.query(Product).filter(
        Product.id == product_id,
        Product.company_id == current_user.company_id,
        Product.deleted_at.is_(None)
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    batches = (
        db.query(InventoryBatch)
        .filter(
            InventoryBatch.product_id == product_id,
            InventoryBatch.company_id == current_user.company_id,
        )
        .order_by(InventoryBatch.purchase_date.asc(), InventoryBatch.created_at.asc())
        .all()
    )

    return [
        FifoLayerItem(
            id=b.id,
            quantity=b.quantity,
            unit_cost=b.unit_cost,
            remaining_qty=b.remaining_qty,
            purchase_date=b.purchase_date.isoformat() if b.purchase_date else "",
            purchase_invoice_id=b.purchase_invoice_id,
            is_active=b.is_active,
        )
        for b in batches
    ]


def _get_status_label(status: str, doc_type: str) -> str:
    """Map status codes to Thai labels."""
    labels = {
        "quotation": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "accepted": "อนุมัติ",
            "rejected": "ปฏิเสธ",
            "converted": "แปลงแล้ว"
        },
        "invoice": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "paid": "ชำระแล้ว",
            "partially_paid": "ชำระบางส่วน",
            "overdue": "เกินกำหนด",
            "cancelled": "ยกเลิก"
        },
        "purchase_order": {
            "draft": "ร่าง",
            "sent": "ส่งแล้ว",
            "confirmed": "ยืนยัน",
            "received": "รับแล้ว",
            "billed": "วางบิลแล้ว",
            "cancelled": "ยกเลิก"
        },
        "purchase_invoice": {
            "draft": "ร่าง",
            "received": "รับแล้ว",
            "approved": "อนุมัติ",
            "partially_paid": "ชำระบางส่วน",
            "paid": "ชำระแล้ว",
            "cancelled": "ยกเลิก"
        }
    }
    return labels.get(doc_type, {}).get(status, status)
