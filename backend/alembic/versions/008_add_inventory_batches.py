"""008_add_inventory_batches

Revision ID: 008
Revises: 007
Create Date: 2026-05-02

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table('inventory_batches',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('quantity', sa.Numeric(precision=19, scale=4), nullable=False),
        sa.Column('unit_cost', sa.Numeric(precision=19, scale=4), nullable=False),
        sa.Column('remaining_qty', sa.Numeric(precision=19, scale=4), nullable=False),
        sa.Column('purchase_date', sa.Date(), nullable=False),
        sa.Column('purchase_invoice_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.ForeignKeyConstraint(['purchase_invoice_id'], ['purchase_invoices.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_inventory_batches_company_id', 'inventory_batches', ['company_id'])
    op.create_index('ix_inventory_batches_product_id', 'inventory_batches', ['product_id'])
    op.create_index('ix_inventory_batches_pi_id', 'inventory_batches', ['purchase_invoice_id'])


def downgrade():
    op.drop_index('ix_inventory_batches_pi_id', table_name='inventory_batches')
    op.drop_index('ix_inventory_batches_product_id', table_name='inventory_batches')
    op.drop_index('ix_inventory_batches_company_id', table_name='inventory_batches')
    op.drop_table('inventory_batches')
