from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.contact import Contact
from ....models.user import User
from ....models.quotation import Quotation
from ....models.invoice import Invoice
from ....models.receipt import Receipt
from ....models.purchase_order import PurchaseOrder
from ....models.purchase_invoice import PurchaseInvoice
from ....models.expense_claim import ExpenseClaim
from datetime import datetime

router = APIRouter()


class ContactCreate(BaseModel):
    type: str = Field(..., pattern="^(customer|vendor|both)$")
    name: str = Field(..., min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None, min_length=13, max_length=13)
    branch_number: Optional[str] = Field(default="00000", max_length=5)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)
    credit_days: Decimal = Field(default=Decimal("0"), ge=0)


class ContactUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(customer|vendor|both)$")
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    name_en: Optional[str] = Field(None, max_length=255)
    tax_id: Optional[str] = Field(None, min_length=13, max_length=13)
    branch_number: Optional[str] = Field(None, max_length=5)
    address: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[str] = Field(None, max_length=255)
    credit_limit: Optional[Decimal] = Field(None, ge=0)
    credit_days: Optional[Decimal] = Field(None, ge=0)


class ContactResponse(BaseModel):
    id: UUID
    company_id: UUID
    type: str
    name: str
    name_en: Optional[str]
    tax_id: Optional[str]
    branch_number: Optional[str]
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    credit_limit: Decimal
    credit_days: Decimal

    class Config:
        from_attributes = True


@router.post("", response_model=ContactResponse, status_code=status.HTTP_201_CREATED)
def create_contact(
    data: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = Contact(company_id=current_user.company_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return contact


@router.get("", response_model=List[ContactResponse])
def list_contacts(
    type: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Contact).filter(
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    )
    
    if type:
        query = query.filter(Contact.type == type)
    if search:
        query = query.filter(Contact.name.ilike(f"%{search}%"))
    
    return query.order_by(Contact.name).all()


@router.get("/{contact_id}", response_model=ContactResponse)
def get_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: UUID,
    data: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contact(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Soft delete
    contact.deleted_at = datetime.utcnow()
    db.commit()
    return None


# ============================================================
# Contact Transaction History
# ============================================================

class ContactTransactionItem(BaseModel):
    id: UUID
    document_type: str
    document_type_label: str
    document_number: str
    document_date: str
    status: str
    status_label: str
    description: Optional[str]
    amount: Decimal
    link: str


class ContactTransactionSummary(BaseModel):
    total_invoiced: Decimal
    total_paid: Decimal
    total_outstanding: Decimal
    total_purchased: Decimal
    total_expense_claimed: Decimal
    quotation_count: int
    invoice_count: int
    receipt_count: int
    purchase_order_count: int
    purchase_invoice_count: int
    expense_claim_count: int


class ContactTransactionsResponse(BaseModel):
    contact: ContactResponse
    summary: ContactTransactionSummary
    transactions: List[ContactTransactionItem]


@router.get("/{contact_id}/transactions", response_model=ContactTransactionsResponse)
def get_contact_transactions(
    contact_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get unified transaction history for a contact across all document types."""
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.company_id == current_user.company_id,
        Contact.deleted_at.is_(None)
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Query all document types
    quotations = db.query(Quotation).filter(
        Quotation.contact_id == contact_id,
        Quotation.company_id == current_user.company_id,
        Quotation.deleted_at.is_(None)
    ).all()

    invoices = db.query(Invoice).filter(
        Invoice.contact_id == contact_id,
        Invoice.company_id == current_user.company_id,
        Invoice.deleted_at.is_(None)
    ).all()

    receipts = db.query(Receipt).filter(
        Receipt.contact_id == contact_id,
        Receipt.company_id == current_user.company_id,
        Receipt.deleted_at.is_(None)
    ).all()

    purchase_orders = db.query(PurchaseOrder).filter(
        PurchaseOrder.contact_id == contact_id,
        PurchaseOrder.company_id == current_user.company_id,
        PurchaseOrder.deleted_at.is_(None)
    ).all()

    purchase_invoices = db.query(PurchaseInvoice).filter(
        PurchaseInvoice.contact_id == contact_id,
        PurchaseInvoice.company_id == current_user.company_id,
        PurchaseInvoice.deleted_at.is_(None)
    ).all()

    expense_claims = db.query(ExpenseClaim).filter(
        ExpenseClaim.contact_id == contact_id,
        ExpenseClaim.company_id == current_user.company_id,
        ExpenseClaim.deleted_at.is_(None)
    ).all()

    # Build unified transaction list
    transactions = []

    for q in quotations:
        transactions.append(ContactTransactionItem(
            id=q.id,
            document_type="quotation",
            document_type_label="ใบเสนอราคา",
            document_number=q.quotation_number,
            document_date=q.issue_date.isoformat() if q.issue_date else "",
            status=q.status,
            status_label=_get_status_label(q.status, "quotation"),
            description=q.notes,
            amount=q.total_amount,
            link=f"/income/quotations/{q.id}"
        ))

    for inv in invoices:
        transactions.append(ContactTransactionItem(
            id=inv.id,
            document_type="invoice",
            document_type_label="ใบแจ้งหนี้",
            document_number=inv.invoice_number,
            document_date=inv.issue_date.isoformat() if inv.issue_date else "",
            status=inv.status,
            status_label=_get_status_label(inv.status, "invoice"),
            description=inv.notes,
            amount=inv.total_amount,
            link=f"/income/invoices/{inv.id}"
        ))

    for r in receipts:
        transactions.append(ContactTransactionItem(
            id=r.id,
            document_type="receipt",
            document_type_label="ใบเสร็จ",
            document_number=r.receipt_number,
            document_date=r.receipt_date.isoformat() if r.receipt_date else "",
            status="paid",
            status_label="ชำระแล้ว",
            description=f"ชำระเงิน: {r.payment_method}",
            amount=r.total_amount,
            link=f"/income/receipts/{r.id}"
        ))

    for po in purchase_orders:
        transactions.append(ContactTransactionItem(
            id=po.id,
            document_type="purchase_order",
            document_type_label="ใบสั่งซื้อ",
            document_number=po.po_number,
            document_date=po.order_date.isoformat() if po.order_date else "",
            status=po.status,
            status_label=_get_status_label(po.status, "purchase_order"),
            description=po.notes,
            amount=po.total_amount,
            link=f"/expenses/purchase-orders/{po.id}"
        ))

    for pi in purchase_invoices:
        transactions.append(ContactTransactionItem(
            id=pi.id,
            document_type="purchase_invoice",
            document_type_label="ใบรับสินค้า",
            document_number=pi.bill_number,
            document_date=pi.bill_date.isoformat() if pi.bill_date else "",
            status=pi.status,
            status_label=_get_status_label(pi.status, "purchase_invoice"),
            description=pi.notes,
            amount=pi.total_amount,
            link=f"/expenses/purchase-invoices/{pi.id}"
        ))

    for ec in expense_claims:
        transactions.append(ContactTransactionItem(
            id=ec.id,
            document_type="expense_claim",
            document_type_label="เบิกค่าใช้จ่าย",
            document_number=ec.claim_number,
            document_date=ec.expense_date.isoformat() if ec.expense_date else "",
            status=ec.status,
            status_label=_get_status_label(ec.status, "expense_claim"),
            description=ec.description,
            amount=ec.total_amount,
            link=f"/expenses/expense-claims/{ec.id}"
        ))

    # Sort by date descending
    transactions.sort(key=lambda x: x.document_date or "", reverse=True)

    # Calculate summary
    total_invoiced = sum(inv.total_amount for inv in invoices)
    total_paid = sum(r.total_amount for r in receipts)
    total_purchased = sum(pi.total_amount for pi in purchase_invoices)
    total_expense = sum(ec.total_amount for ec in expense_claims)

    summary = ContactTransactionSummary(
        total_invoiced=total_invoiced,
        total_paid=total_paid,
        total_outstanding=total_invoiced - total_paid,
        total_purchased=total_purchased,
        total_expense_claimed=total_expense,
        quotation_count=len(quotations),
        invoice_count=len(invoices),
        receipt_count=len(receipts),
        purchase_order_count=len(purchase_orders),
        purchase_invoice_count=len(purchase_invoices),
        expense_claim_count=len(expense_claims)
    )

    return ContactTransactionsResponse(
        contact=contact,
        summary=summary,
        transactions=transactions[:100]  # Limit to 100 most recent
    )


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
        },
        "expense_claim": {
            "draft": "ร่าง",
            "submitted": "ส่งแล้ว",
            "approved": "อนุมัติ",
            "rejected": "ปฏิเสธ",
            "reimbursed": "จ่ายคืนแล้ว"
        }
    }
    return labels.get(doc_type, {}).get(status, status)
