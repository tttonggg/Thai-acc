"""add payment vouchers

Revision ID: 010
Revises: 009_add_credit_debit_notes
Create Date: 2026-05-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from src.models.types import CrossPlatformUUID

# revision identifiers, used by Alembic.
revision: str = '010'
down_revision: Union[str, None] = '009'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'payment_vouchers',
        sa.Column('id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('company_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('bank_account_id', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('voucher_number', sa.String(50), nullable=False),
        sa.Column('payment_date', sa.Date(), nullable=False),
        sa.Column('payment_method', sa.String(20), nullable=False, server_default='bank_transfer'),
        sa.Column('currency_code', sa.String(3), nullable=False, server_default='THB'),
        sa.Column('exchange_rate', sa.Numeric(19, 6), nullable=False, server_default='1'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('wht_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('posted_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('voucher_number'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.ForeignKeyConstraint(['bank_account_id'], ['bank_accounts.id']),
    )
    op.create_index('ix_payment_vouchers_company_id', 'payment_vouchers', ['company_id'])
    op.create_index('ix_payment_vouchers_contact_id', 'payment_vouchers', ['contact_id'])
    op.create_index('ix_payment_vouchers_status', 'payment_vouchers', ['status'])
    op.create_index('ix_payment_vouchers_payment_date', 'payment_vouchers', ['payment_date'])

    op.create_table(
        'payment_voucher_lines',
        sa.Column('id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('payment_voucher_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('purchase_invoice_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_taken', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['payment_voucher_id'], ['payment_vouchers.id']),
        sa.ForeignKeyConstraint(['purchase_invoice_id'], ['purchase_invoices.id']),
    )
    op.create_index('ix_payment_voucher_lines_pv_id', 'payment_voucher_lines', ['payment_voucher_id'])
    op.create_index('ix_payment_voucher_lines_pi_id', 'payment_voucher_lines', ['purchase_invoice_id'])


def downgrade() -> None:
    op.drop_index('ix_payment_voucher_lines_pi_id', table_name='payment_voucher_lines')
    op.drop_index('ix_payment_voucher_lines_pv_id', table_name='payment_voucher_lines')
    op.drop_table('payment_voucher_lines')
    op.drop_index('ix_payment_vouchers_payment_date', table_name='payment_vouchers')
    op.drop_index('ix_payment_vouchers_status', table_name='payment_vouchers')
    op.drop_index('ix_payment_vouchers_contact_id', table_name='payment_vouchers')
    op.drop_index('ix_payment_vouchers_company_id', table_name='payment_vouchers')
    op.drop_table('payment_vouchers')
