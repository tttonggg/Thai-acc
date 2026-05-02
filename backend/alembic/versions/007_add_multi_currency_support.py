"""add_multi_currency_support

Revision ID: 007
Revises: 006_add_bank_statement_import
Create Date: 2026-05-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '007_add_multi_currency_support'
down_revision = '006_add_bank_statement_import'
branch_labels = None
depends_on = None


def upgrade():
    # Add base_currency to companies
    op.add_column('companies', sa.Column('base_currency', sa.String(length=3), server_default='THB', nullable=False))
    
    # Create exchange_rates table
    op.create_table('exchange_rates',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('from_currency', sa.String(length=3), nullable=False),
        sa.Column('to_currency', sa.String(length=3), nullable=False),
        sa.Column('rate', sa.Numeric(precision=19, scale=6), nullable=False),
        sa.Column('effective_date', sa.Date(), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_exchange_rates_company_id', 'exchange_rates', ['company_id'])
    op.create_index('ix_exchange_rates_currency_pair', 'exchange_rates', ['company_id', 'from_currency', 'to_currency'])
    op.create_index('ix_exchange_rates_effective_date', 'exchange_rates', ['company_id', 'effective_date'])
    
    # Add currency fields to documents
    op.add_column('invoices', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('invoices', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))
    
    op.add_column('quotations', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('quotations', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))
    
    op.add_column('purchase_orders', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('purchase_orders', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))
    
    op.add_column('purchase_invoices', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('purchase_invoices', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))
    
    op.add_column('receipts', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('receipts', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))
    
    op.add_column('expense_claims', sa.Column('currency_code', sa.String(length=3), server_default='THB', nullable=False))
    op.add_column('expense_claims', sa.Column('exchange_rate', sa.Numeric(precision=19, scale=6), server_default='1', nullable=False))


def downgrade():
    op.drop_column('expense_claims', 'exchange_rate')
    op.drop_column('expense_claims', 'currency_code')
    op.drop_column('receipts', 'exchange_rate')
    op.drop_column('receipts', 'currency_code')
    op.drop_column('purchase_invoices', 'exchange_rate')
    op.drop_column('purchase_invoices', 'currency_code')
    op.drop_column('purchase_orders', 'exchange_rate')
    op.drop_column('purchase_orders', 'currency_code')
    op.drop_column('quotations', 'exchange_rate')
    op.drop_column('quotations', 'currency_code')
    op.drop_column('invoices', 'exchange_rate')
    op.drop_column('invoices', 'currency_code')
    
    op.drop_index('ix_exchange_rates_effective_date', table_name='exchange_rates')
    op.drop_index('ix_exchange_rates_currency_pair', table_name='exchange_rates')
    op.drop_index('ix_exchange_rates_company_id', table_name='exchange_rates')
    op.drop_table('exchange_rates')
    
    op.drop_column('companies', 'base_currency')
