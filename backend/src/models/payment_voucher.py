from sqlalchemy import Column, String, Date, Numeric, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from .types import CrossPlatformUUID as UUID
from .base import BaseModel


class PaymentVoucher(BaseModel):
    __tablename__ = "payment_vouchers"

    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id"), nullable=False)
    contact_id = Column(UUID(as_uuid=True), ForeignKey("contacts.id"), nullable=False)
    bank_account_id = Column(UUID(as_uuid=True), ForeignKey("bank_accounts.id"), nullable=True)

    voucher_number = Column(String(50), nullable=False, unique=True)

    payment_date = Column(Date, nullable=False)
    payment_method = Column(String(20), nullable=False, default="bank_transfer")
    # cash, bank_transfer, cheque, credit_card, promptpay

    currency_code = Column(String(3), nullable=False, default="THB")
    exchange_rate = Column(Numeric(19, 6), nullable=False, default=1)

    total_amount = Column(Numeric(19, 4), nullable=False, default=0)
    wht_amount = Column(Numeric(19, 4), nullable=False, default=0)
    notes = Column(Text, nullable=True)

    # Status: draft, posted, cancelled
    status = Column(String(20), nullable=False, default="draft")
    posted_at = Column(Date, nullable=True)

    lines = relationship(
        "PaymentVoucherLine",
        back_populates="payment_voucher",
        lazy="select",
        cascade="all, delete-orphan",
    )
    contact = relationship("Contact")
    bank_account = relationship("BankAccount")

    __table_args__ = (
        Index("ix_payment_vouchers_company_id", "company_id"),
        Index("ix_payment_vouchers_contact_id", "contact_id"),
        Index("ix_payment_vouchers_status", "status"),
        Index("ix_payment_vouchers_payment_date", "payment_date"),
    )


class PaymentVoucherLine(BaseModel):
    __tablename__ = "payment_voucher_lines"

    payment_voucher_id = Column(
        UUID(as_uuid=True), ForeignKey("payment_vouchers.id"), nullable=False
    )
    purchase_invoice_id = Column(
        UUID(as_uuid=True), ForeignKey("purchase_invoices.id"), nullable=False
    )

    amount = Column(Numeric(19, 4), nullable=False, default=0)
    discount_taken = Column(Numeric(19, 4), nullable=False, default=0)

    payment_voucher = relationship("PaymentVoucher", back_populates="lines")
    purchase_invoice = relationship("PurchaseInvoice")

    __table_args__ = (
        Index("ix_payment_voucher_lines_pv_id", "payment_voucher_id"),
        Index("ix_payment_voucher_lines_pi_id", "purchase_invoice_id"),
    )
