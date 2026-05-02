"""Create foundation tables: companies, users, contacts, products

Revision ID: 001
Revises: 
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Companies table
    op.create_table(
        'companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('tax_id', sa.String(13), nullable=False, unique=True),
        sa.Column('branch_number', sa.String(5), nullable=False, server_default='00000'),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('logo_url', sa.String(500), nullable=True),
        sa.Column('fiscal_year_start_month', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('quotation_prefix', sa.String(10), nullable=False, server_default='QT'),
        sa.Column('invoice_prefix', sa.String(10), nullable=False, server_default='IV'),
        sa.Column('receipt_prefix', sa.String(10), nullable=False, server_default='RE'),
        sa.Column('tax_invoice_prefix', sa.String(10), nullable=False, server_default='TX'),
        sa.Column('purchase_order_prefix', sa.String(10), nullable=False, server_default='PO'),
        sa.Column('expense_prefix', sa.String(10), nullable=False, server_default='EX'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('hashed_password', sa.String(255), nullable=False),
        sa.Column('first_name', sa.String(100), nullable=False),
        sa.Column('last_name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('role', sa.String(20), nullable=False, server_default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Contacts table
    op.create_table(
        'contacts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('tax_id', sa.String(13), nullable=True),
        sa.Column('branch_number', sa.String(5), nullable=True, server_default='00000'),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('credit_limit', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('credit_days', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Contacts indexes
    op.create_index('ix_contacts_company_id', 'contacts', ['company_id'])
    op.create_index('ix_contacts_type', 'contacts', ['type'])
    op.create_index('ix_contacts_company_tax', 'contacts', ['company_id', 'tax_id'])

    # Products table
    op.create_table(
        'products',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('sku', sa.String(100), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('cost_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('track_inventory', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('cost_method', sa.String(10), nullable=False, server_default='FIFO'),
        sa.Column('quantity_on_hand', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('reorder_point', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('unit_name', sa.String(50), nullable=False, server_default='ชิ้น'),
        sa.Column('category', sa.String(100), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Products indexes
    op.create_index('ix_products_company_id', 'products', ['company_id'])
    op.create_index('ix_products_sku', 'products', ['company_id', 'sku'])
    op.create_index('ix_products_category', 'products', ['company_id', 'category'])


def downgrade() -> None:
    op.drop_index('ix_products_category', table_name='products')
    op.drop_index('ix_products_sku', table_name='products')
    op.drop_index('ix_products_company_id', table_name='products')
    op.drop_table('products')

    op.drop_index('ix_contacts_company_tax', table_name='contacts')
    op.drop_index('ix_contacts_type', table_name='contacts')
    op.drop_index('ix_contacts_company_id', table_name='contacts')
    op.drop_table('contacts')

    op.drop_table('users')
    op.drop_table('companies')
