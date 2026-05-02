"""004_add_bank_reconciliation

Revision ID: 004
Revises: 003
Create Date: 2026-05-01

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add gl_account_id to bank_accounts
    op.add_column('bank_accounts', sa.Column('gl_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chart_of_accounts.id'), nullable=True))
    op.create_index('ix_bank_accounts_gl_account_id', 'bank_accounts', ['gl_account_id'])

    # Add reconciliation fields to journal_entry_lines
    op.add_column('journal_entry_lines', sa.Column('is_reconciled', sa.String(1), nullable=False, server_default='N'))
    op.add_column('journal_entry_lines', sa.Column('reconciled_at', sa.Date(), nullable=True))
    op.add_column('journal_entry_lines', sa.Column('reconciled_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True))
    op.create_index('ix_journal_lines_reconciled', 'journal_entry_lines', ['is_reconciled'])


def downgrade() -> None:
    op.drop_index('ix_journal_lines_reconciled', table_name='journal_entry_lines')
    op.drop_column('journal_entry_lines', 'reconciled_by')
    op.drop_column('journal_entry_lines', 'reconciled_at')
    op.drop_column('journal_entry_lines', 'is_reconciled')

    op.drop_index('ix_bank_accounts_gl_account_id', table_name='bank_accounts')
    op.drop_column('bank_accounts', 'gl_account_id')
