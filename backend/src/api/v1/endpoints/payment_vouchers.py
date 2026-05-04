from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from decimal import Decimal
from datetime import date, datetime

from ....core.database import get_db
from ....core.security import get_current_user
from ....models.user import User
from ....models.payment_voucher import PaymentVoucher, PaymentVoucherLine
from ....models.purchase_invoice import PurchaseInvoice
from ....models.contact import Contact
from ....models.bank_account import BankAccount
from ....services.document_numbering import DocumentNumberingService
from ....services.gl_posting import GLPostingService

router = APIRouter()


class PaymentVoucherLineCreate(BaseModel):
    purchase_invoice_id: UUID
    amount: Decimal = Field(..., gt=0)
    discount_taken: Decimal = Field(default=Decimal("0"), ge=0)


class PaymentVoucherCreate(BaseModel):
    contact_id: UUID
    payment_date: date
    payment_method: str = Field(
        default="bank_transfer",
        pattern="^(cash|bank_transfer|cheque|credit_card|promptpay)$",
    )
    bank_account_id: Optional[UUID] = None
    currency_code: str = Field(default="THB", pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Decimal = Field(default=Decimal("1"), gt=0)
    wht_amount: Decimal = Field(default=Decimal("0"), ge=0)
    notes: Optional[str] = None
    lines: List[PaymentVoucherLineCreate] = Field(..., min_length=1)


class PaymentVoucherUpdate(BaseModel):
    contact_id: Optional[UUID] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = Field(
        None, pattern="^(cash|bank_transfer|cheque|credit_card|promptpay)$"
    )
    bank_account_id: Optional[UUID] = None
    currency_code: Optional[str] = Field(None, pattern="^(THB|USD|EUR|CNY|JPY|GBP)$")
    exchange_rate: Optional[Decimal] = Field(None, gt=0)
    wht_amount: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = None
    lines: Optional[List[PaymentVoucherLineCreate]] = None


class PaymentVoucherLineResponse(BaseModel):
    id: UUID
    purchase_invoice_id: UUID
    amount: Decimal
    discount_taken: Decimal

    class Config:
        from_attributes = True


class PaymentVoucherResponse(BaseModel):
    id: UUID
    company_id: UUID
    contact_id: UUID
    bank_account_id: Optional[UUID]
    voucher_number: str
    payment_date: date
    payment_method: str
    currency_code: str
    exchange_rate: Decimal
    total_amount: Decimal
    wht_amount: Decimal
    notes: Optional[str]
    status: str
    posted_at: Optional[date]
    lines: List[PaymentVoucherLineResponse]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


@router.get("", response_model=List[PaymentVoucherResponse])
def list_payment_vouchers(
    status: Optional[str] = None,
    contact_id: Optional[UUID] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PaymentVoucher)
        .options(joinedload(PaymentVoucher.lines))
        .filter(
            PaymentVoucher.company_id == current_user.company_id,
            PaymentVoucher.deleted_at.is_(None),
        )
    )
    if status:
        query = query.filter(PaymentVoucher.status == status)
    if contact_id:
        query = query.filter(PaymentVoucher.contact_id == contact_id)
    if from_date:
        query = query.filter(PaymentVoucher.payment_date >= from_date)
    if to_date:
        query = query.filter(PaymentVoucher.payment_date <= to_date)
    if search:
        query = query.filter(PaymentVoucher.voucher_number.ilike(f"%{search}%"))
    return query.order_by(PaymentVoucher.payment_date.desc()).all()


@router.post("", response_model=PaymentVoucherResponse, status_code=status.HTTP_201_CREATED)
def create_payment_voucher(
    data: PaymentVoucherCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate contact exists
    contact = db.query(Contact).filter(
        Contact.id == data.contact_id,
        Contact.company_id == current_user.company_id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    # Validate bank_account if provided
    if data.bank_account_id:
        ba = db.query(BankAccount).filter(
            BankAccount.id == data.bank_account_id,
            BankAccount.company_id == current_user.company_id,
        ).first()
        if not ba:
            raise HTTPException(status_code=404, detail="Bank account not found")

    # Validate lines and calculate total
    total = Decimal("0")
    for line in data.lines:
        pi = db.query(PurchaseInvoice).filter(
            PurchaseInvoice.id == line.purchase_invoice_id,
            PurchaseInvoice.company_id == current_user.company_id,
            PurchaseInvoice.deleted_at.is_(None),
        ).first()
        if not pi:
            raise HTTPException(status_code=404, detail=f"Purchase invoice {line.purchase_invoice_id} not found")
        if pi.contact_id != data.contact_id:
            raise HTTPException(status_code=400, detail="Purchase invoice belongs to different vendor")
        unpaid = pi.total_amount - pi.paid_amount
        if line.amount > unpaid:
            raise HTTPException(status_code=400, detail=f"Amount {line.amount} exceeds unpaid balance {unpaid}")
        total += line.amount

    # Generate voucher number
    numbering = DocumentNumberingService(db, str(current_user.company_id))
    voucher_number = numbering.get_next_number("PV", "PV")

    voucher = PaymentVoucher(
        company_id=current_user.company_id,
        contact_id=data.contact_id,
        bank_account_id=data.bank_account_id,
        voucher_number=voucher_number,
        payment_date=data.payment_date,
        payment_method=data.payment_method,
        currency_code=data.currency_code,
        exchange_rate=data.exchange_rate,
        total_amount=total,
        wht_amount=data.wht_amount,
        notes=data.notes,
        status="draft",
        created_by=current_user.id,
        updated_by=current_user.id,
    )
    db.add(voucher)
    db.flush()

    for line in data.lines:
        db.add(PaymentVoucherLine(
            payment_voucher_id=voucher.id,
            purchase_invoice_id=line.purchase_invoice_id,
            amount=line.amount,
            discount_taken=line.discount_taken,
            created_by=current_user.id,
            updated_by=current_user.id,
        ))

    db.commit()
    db.refresh(voucher)
    return voucher


@router.get("/{voucher_id}", response_model=PaymentVoucherResponse)
def get_payment_voucher(
    voucher_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = (
        db.query(PaymentVoucher)
        .options(joinedload(PaymentVoucher.lines))
        .filter(
            PaymentVoucher.id == voucher_id,
            PaymentVoucher.company_id == current_user.company_id,
            PaymentVoucher.deleted_at.is_(None),
        )
        .first()
    )
    if not voucher:
        raise HTTPException(status_code=404, detail="Payment voucher not found")
    return voucher


@router.put("/{voucher_id}", response_model=PaymentVoucherResponse)
def update_payment_voucher(
    voucher_id: UUID,
    data: PaymentVoucherUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = db.query(PaymentVoucher).filter(
        PaymentVoucher.id == voucher_id,
        PaymentVoucher.company_id == current_user.company_id,
        PaymentVoucher.deleted_at.is_(None),
    ).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Payment voucher not found")
    if voucher.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot update non-draft voucher")

    if data.contact_id:
        contact = db.query(Contact).filter(
            Contact.id == data.contact_id,
            Contact.company_id == current_user.company_id,
        ).first()
        if not contact:
            raise HTTPException(status_code=404, detail="Contact not found")
        voucher.contact_id = data.contact_id

    if data.bank_account_id is not None:
        if data.bank_account_id:
            ba = db.query(BankAccount).filter(
                BankAccount.id == data.bank_account_id,
                BankAccount.company_id == current_user.company_id,
            ).first()
            if not ba:
                raise HTTPException(status_code=404, detail="Bank account not found")
        voucher.bank_account_id = data.bank_account_id

    if data.payment_date:
        voucher.payment_date = data.payment_date
    if data.payment_method:
        voucher.payment_method = data.payment_method
    if data.currency_code:
        voucher.currency_code = data.currency_code
    if data.exchange_rate:
        voucher.exchange_rate = data.exchange_rate
    if data.wht_amount is not None:
        voucher.wht_amount = data.wht_amount
    if data.notes is not None:
        voucher.notes = data.notes

    # Update lines if provided
    if data.lines:
        total = Decimal("0")
        for line in data.lines:
            pi = db.query(PurchaseInvoice).filter(
                PurchaseInvoice.id == line.purchase_invoice_id,
                PurchaseInvoice.company_id == current_user.company_id,
            ).first()
            if not pi:
                raise HTTPException(status_code=404, detail="Purchase invoice not found")
            if pi.contact_id != voucher.contact_id:
                raise HTTPException(status_code=400, detail="Purchase invoice belongs to different vendor")
            unpaid = pi.total_amount - pi.paid_amount
            if line.amount > unpaid:
                raise HTTPException(status_code=400, detail=f"Amount exceeds unpaid balance {unpaid}")
            total += line.amount

        # Delete old lines
        db.query(PaymentVoucherLine).filter(
            PaymentVoucherLine.payment_voucher_id == voucher.id
        ).delete(synchronize_session=False)

        for line in data.lines:
            db.add(PaymentVoucherLine(
                payment_voucher_id=voucher.id,
                purchase_invoice_id=line.purchase_invoice_id,
                amount=line.amount,
                discount_taken=line.discount_taken,
                updated_by=current_user.id,
            ))
        voucher.total_amount = total

    voucher.updated_by = current_user.id
    db.commit()
    db.refresh(voucher)
    return voucher


@router.delete("/{voucher_id}")
def delete_payment_voucher(
    voucher_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = db.query(PaymentVoucher).filter(
        PaymentVoucher.id == voucher_id,
        PaymentVoucher.company_id == current_user.company_id,
        PaymentVoucher.deleted_at.is_(None),
    ).first()
    if not voucher:
        raise HTTPException(status_code=404, detail="Payment voucher not found")
    if voucher.status != "draft":
        raise HTTPException(status_code=400, detail="Cannot delete non-draft voucher")

    voucher.deleted_at = datetime.utcnow()
    voucher.updated_by = current_user.id
    db.commit()
    return {"message": "Payment voucher deleted"}


@router.post("/{voucher_id}/post")
def post_payment_voucher(
    voucher_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = (
        db.query(PaymentVoucher)
        .options(joinedload(PaymentVoucher.lines))
        .filter(
            PaymentVoucher.id == voucher_id,
            PaymentVoucher.company_id == current_user.company_id,
            PaymentVoucher.deleted_at.is_(None),
        )
        .first()
    )
    if not voucher:
        raise HTTPException(status_code=404, detail="Payment voucher not found")
    if voucher.status != "draft":
        raise HTTPException(status_code=400, detail="Voucher already posted")

    # Update purchase invoice statuses
    for line in voucher.lines:
        pi = db.query(PurchaseInvoice).filter(
            PurchaseInvoice.id == line.purchase_invoice_id,
        ).first()
        if pi:
            pi.paid_amount += line.amount
            if pi.paid_amount >= pi.total_amount:
                pi.status = "paid"
            elif pi.paid_amount > 0:
                pi.status = "partially_paid"

    voucher.status = "posted"
    voucher.posted_at = datetime.utcnow().date()
    voucher.updated_by = current_user.id

    # Post GL
    gl_service = GLPostingService(db, str(current_user.company_id))
    gl_service.post_payment_voucher(voucher)

    db.commit()
    return {"message": "Payment voucher posted", "status": "posted"}


@router.post("/{voucher_id}/cancel")
def cancel_payment_voucher(
    voucher_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    voucher = (
        db.query(PaymentVoucher)
        .options(joinedload(PaymentVoucher.lines))
        .filter(
            PaymentVoucher.id == voucher_id,
            PaymentVoucher.company_id == current_user.company_id,
            PaymentVoucher.deleted_at.is_(None),
        )
        .first()
    )
    if not voucher:
        raise HTTPException(status_code=404, detail="Payment voucher not found")
    if voucher.status != "posted":
        raise HTTPException(status_code=400, detail="Only posted vouchers can be cancelled")

    # Reverse PI paid amounts
    for line in voucher.lines:
        pi = db.query(PurchaseInvoice).filter(
            PurchaseInvoice.id == line.purchase_invoice_id,
        ).first()
        if pi:
            pi.paid_amount -= line.amount
            if pi.paid_amount <= 0:
                pi.paid_amount = Decimal("0")
                pi.status = "received"
            elif pi.paid_amount < pi.total_amount:
                pi.status = "partially_paid"

    voucher.status = "cancelled"
    voucher.updated_by = current_user.id

    # Reverse GL
    gl_service = GLPostingService(db, str(current_user.company_id))
    gl_service.reverse_payment_voucher(voucher)

    db.commit()
    return {"message": "Payment voucher cancelled", "status": "cancelled"}
