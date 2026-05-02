"""005_add_e_tax_invoice

Revision ID: 005
Revises: 004
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Expand invoices e-tax fields
    op.add_column('invoices', sa.Column('e_tax_xml', sa.Text(), nullable=True))
    op.add_column('invoices', sa.Column('e_tax_timestamp', sa.String(100), nullable=True))
    op.add_column('invoices', sa.Column('e_tax_submitted_at', sa.Date(), nullable=True))
    op.add_column('invoices', sa.Column('e_tax_error', sa.Text(), nullable=True))

    # Create e_tax_submissions table
    op.create_table(
        'e_tax_submissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('submission_type', sa.String(20), nullable=False, server_default='email'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('xml_payload', sa.Text(), nullable=True),
        sa.Column('timestamp', sa.String(100), nullable=True),
        sa.Column('response_message', sa.Text(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('submitted_at', sa.Date(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )


def downgrade() -> None:
    op.drop_table('e_tax_submissions')
    op.drop_column('invoices', 'e_tax_error')
    op.drop_column('invoices', 'e_tax_submitted_at')
    op.drop_column('invoices', 'e_tax_timestamp')
    op.drop_column('invoices', 'e_tax_xml')
