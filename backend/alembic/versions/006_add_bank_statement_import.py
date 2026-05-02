"""006_add_bank_statement_import

Revision ID: 006
Revises: 005
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create bank_statement_imports table
    op.create_table(
        'bank_statement_imports',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bank_accounts.id'), nullable=False),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('statement_date_from', sa.Date(), nullable=True),
        sa.Column('statement_date_to', sa.Date(), nullable=True),
        sa.Column('total_debit', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_credit', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_bank_stmt_imports_company_id', 'bank_statement_imports', ['company_id'])
    op.create_index('ix_bank_stmt_imports_bank_account_id', 'bank_statement_imports', ['bank_account_id'])

    # Create bank_statement_lines table
    op.create_table(
        'bank_statement_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('import_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bank_statement_imports.id'), nullable=False),
        sa.Column('transaction_date', sa.Date(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('reference_number', sa.String(100), nullable=True),
        sa.Column('debit_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('credit_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('is_matched', sa.String(1), nullable=False, server_default='N'),
        sa.Column('matched_je_line_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('journal_entry_lines.id'), nullable=True),
        sa.Column('match_score', sa.Numeric(3, 2), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_bank_stmt_lines_import_id', 'bank_statement_lines', ['import_id'])
    op.create_index('ix_bank_stmt_lines_transaction_date', 'bank_statement_lines', ['transaction_date'])


def downgrade() -> None:
    op.drop_table('bank_statement_lines')
    op.drop_table('bank_statement_imports')
