"""003_create_expense_tables

Revision ID: 003
Revises: 002
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # purchase_orders
    op.create_table(
        'purchase_orders',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('po_number', sa.String(50), nullable=False, unique=True),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('expected_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('subtotal', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='7'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('converted_to_purchase_invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('purchase_invoices.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_purchase_orders_company_id', 'purchase_orders', ['company_id'])
    op.create_index('ix_purchase_orders_contact_id', 'purchase_orders', ['contact_id'])
    op.create_index('ix_purchase_orders_project_id', 'purchase_orders', ['project_id'])
    op.create_index('ix_purchase_orders_status', 'purchase_orders', ['status'])
    op.create_index('ix_purchase_orders_order_date', 'purchase_orders', ['order_date'])

    # purchase_order_items
    op.create_table(
        'purchase_order_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('purchase_orders.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('quantity', sa.Numeric(19, 4), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_percent', sa.Numeric(5, 2), nullable=False, server_default='0'),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_purchase_order_items_po_id', 'purchase_order_items', ['purchase_order_id'])

    # purchase_invoices
    op.create_table(
        'purchase_invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('purchase_order_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('purchase_orders.id'), nullable=True),
        sa.Column('bill_number', sa.String(50), nullable=False, unique=True),
        sa.Column('bill_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('subtotal', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='7'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('paid_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_purchase_invoices_company_id', 'purchase_invoices', ['company_id'])
    op.create_index('ix_purchase_invoices_contact_id', 'purchase_invoices', ['contact_id'])
    op.create_index('ix_purchase_invoices_project_id', 'purchase_invoices', ['project_id'])
    op.create_index('ix_purchase_invoices_po_id', 'purchase_invoices', ['purchase_order_id'])
    op.create_index('ix_purchase_invoices_status', 'purchase_invoices', ['status'])
    op.create_index('ix_purchase_invoices_bill_date', 'purchase_invoices', ['bill_date'])
    op.create_index('ix_purchase_invoices_due_date', 'purchase_invoices', ['due_date'])

    # purchase_invoice_items
    op.create_table(
        'purchase_invoice_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('purchase_invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('purchase_invoices.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('quantity', sa.Numeric(19, 4), nullable=False, server_default='1'),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_percent', sa.Numeric(5, 2), nullable=False, server_default='0'),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_purchase_invoice_items_pi_id', 'purchase_invoice_items', ['purchase_invoice_id'])

    # expense_claims
    op.create_table(
        'expense_claims',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('claim_number', sa.String(50), nullable=False, unique=True),
        sa.Column('employee_name', sa.String(100), nullable=False),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False, server_default='other'),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('receipt_url', sa.String(500), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('approved_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at', sa.Date(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_expense_claims_company_id', 'expense_claims', ['company_id'])
    op.create_index('ix_expense_claims_contact_id', 'expense_claims', ['contact_id'])
    op.create_index('ix_expense_claims_project_id', 'expense_claims', ['project_id'])
    op.create_index('ix_expense_claims_status', 'expense_claims', ['status'])
    op.create_index('ix_expense_claims_category', 'expense_claims', ['category'])
    op.create_index('ix_expense_claims_expense_date', 'expense_claims', ['expense_date'])


def downgrade() -> None:
    op.drop_index('ix_expense_claims_expense_date', table_name='expense_claims')
    op.drop_index('ix_expense_claims_category', table_name='expense_claims')
    op.drop_index('ix_expense_claims_status', table_name='expense_claims')
    op.drop_index('ix_expense_claims_project_id', table_name='expense_claims')
    op.drop_index('ix_expense_claims_contact_id', table_name='expense_claims')
    op.drop_index('ix_expense_claims_company_id', table_name='expense_claims')
    op.drop_table('expense_claims')

    op.drop_index('ix_purchase_invoice_items_pi_id', table_name='purchase_invoice_items')
    op.drop_table('purchase_invoice_items')

    op.drop_index('ix_purchase_invoices_due_date', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_bill_date', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_status', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_po_id', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_project_id', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_contact_id', table_name='purchase_invoices')
    op.drop_index('ix_purchase_invoices_company_id', table_name='purchase_invoices')
    op.drop_table('purchase_invoices')

    op.drop_index('ix_purchase_order_items_po_id', table_name='purchase_order_items')
    op.drop_table('purchase_order_items')

    op.drop_index('ix_purchase_orders_order_date', table_name='purchase_orders')
    op.drop_index('ix_purchase_orders_status', table_name='purchase_orders')
    op.drop_index('ix_purchase_orders_project_id', table_name='purchase_orders')
    op.drop_index('ix_purchase_orders_contact_id', table_name='purchase_orders')
    op.drop_index('ix_purchase_orders_company_id', table_name='purchase_orders')
    op.drop_table('purchase_orders')
