"""add credit debit notes

Revision ID: 009
Revises: 008_add_inventory_batches
Create Date: 2026-05-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from src.models.types import CrossPlatformUUID

# revision identifiers, used by Alembic.
revision: str = '009'
down_revision: Union[str, None] = '008_add_inventory_batches'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'credit_notes',
        sa.Column('id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('company_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('contact_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('invoice_id', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('document_number', sa.String(50), nullable=False),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('note_type', sa.String(20), nullable=False, server_default='sales_credit'),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('currency_code', sa.String(3), nullable=False, server_default='THB'),
        sa.Column('exchange_rate', sa.Numeric(19, 6), nullable=False, server_default='1'),
        sa.Column('subtotal', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='7'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('confirmed_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('document_number'),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['contact_id'], ['contacts.id']),
        sa.ForeignKeyConstraint(['invoice_id'], ['invoices.id']),
    )
    op.create_index('ix_credit_notes_company_id', 'credit_notes', ['company_id'])
    op.create_index('ix_credit_notes_contact_id', 'credit_notes', ['contact_id'])
    op.create_index('ix_credit_notes_invoice_id', 'credit_notes', ['invoice_id'])
    op.create_index('ix_credit_notes_note_type', 'credit_notes', ['note_type'])
    op.create_index('ix_credit_notes_status', 'credit_notes', ['status'])
    op.create_index('ix_credit_notes_issue_date', 'credit_notes', ['issue_date'])

    op.create_table(
        'credit_note_items',
        sa.Column('id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('credit_note_id', CrossPlatformUUID(as_uuid=True), nullable=False),
        sa.Column('product_id', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('quantity', sa.Numeric(19, 4), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('created_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', CrossPlatformUUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['credit_note_id'], ['credit_notes.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
    )
    op.create_index('ix_credit_note_items_credit_note_id', 'credit_note_items', ['credit_note_id'])
    op.create_index('ix_credit_note_items_product_id', 'credit_note_items', ['product_id'])


def downgrade() -> None:
    op.drop_index('ix_credit_note_items_product_id', table_name='credit_note_items')
    op.drop_index('ix_credit_note_items_credit_note_id', table_name='credit_note_items')
    op.drop_table('credit_note_items')
    op.drop_index('ix_credit_notes_issue_date', table_name='credit_notes')
    op.drop_index('ix_credit_notes_status', table_name='credit_notes')
    op.drop_index('ix_credit_notes_note_type', table_name='credit_notes')
    op.drop_index('ix_credit_notes_invoice_id', table_name='credit_notes')
    op.drop_index('ix_credit_notes_contact_id', table_name='credit_notes')
    op.drop_index('ix_credit_notes_company_id', table_name='credit_notes')
    op.drop_table('credit_notes')
