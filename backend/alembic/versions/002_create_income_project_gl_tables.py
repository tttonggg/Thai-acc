"""Create income, project, and GL tables

Revision ID: 002
Revises: 001
Create Date: 2026-04-30

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('project_code', sa.String(50), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('budget_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('actual_cost', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Document sequences table
    op.create_table(
        'document_sequences',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('doc_type', sa.String(10), nullable=False),
        sa.Column('prefix', sa.String(10), nullable=False),
        sa.Column('last_number', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    # Bank accounts table
    op.create_table(
        'bank_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('account_number', sa.String(50), nullable=True),
        sa.Column('bank_name', sa.String(100), nullable=True),
        sa.Column('account_type', sa.String(20), nullable=False, server_default='cash'),
        sa.Column('opening_balance', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('current_balance', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('promptpay_number', sa.String(15), nullable=True),
        sa.Column('is_active', sa.String(1), nullable=False, server_default='Y'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Chart of accounts table
    op.create_table(
        'chart_of_accounts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('code', sa.String(20), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('name_en', sa.String(255), nullable=True),
        sa.Column('account_type', sa.String(20), nullable=False),
        sa.Column('account_sub_type', sa.String(50), nullable=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chart_of_accounts.id'), nullable=True),
        sa.Column('balance', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('is_active', sa.String(1), nullable=False, server_default='Y'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Quotations table (without converted_to_invoice_id FK — added later after invoices exist)
    op.create_table(
        'quotations',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=False),
        sa.Column('quotation_number', sa.String(50), nullable=False, unique=True),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('expiry_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('subtotal', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='7'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('converted_to_invoice_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Quotation items table
    op.create_table(
        'quotation_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('quotation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotations.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('quantity', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_percent', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    # Invoices table
    op.create_table(
        'invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=False),
        sa.Column('invoice_number', sa.String(50), nullable=False, unique=True),
        sa.Column('tax_invoice_number', sa.String(50), nullable=True, unique=True),
        sa.Column('quotation_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('quotations.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('issue_date', sa.Date(), nullable=False),
        sa.Column('due_date', sa.Date(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='draft'),
        sa.Column('subtotal', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_rate', sa.Numeric(5, 2), nullable=False, server_default='7'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('paid_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('terms', sa.Text(), nullable=True),
        sa.Column('is_e_tax', sa.String(1), nullable=False, server_default='N'),
        sa.Column('e_tax_status', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Add converted_to_invoice_id FK to quotations now that invoices exist
    op.create_foreign_key(
        'fk_quotations_converted_to_invoice',
        'quotations', 'invoices',
        ['converted_to_invoice_id'], ['id']
    )

    # Invoice items table
    op.create_table(
        'invoice_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('product_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('products.id'), nullable=True),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('quantity', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('unit_price', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('discount_percent', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    # Receipts table
    op.create_table(
        'receipts',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=False),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('receipt_number', sa.String(50), nullable=False, unique=True),
        sa.Column('receipt_date', sa.Date(), nullable=False),
        sa.Column('amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('vat_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('payment_method', sa.String(20), nullable=False, server_default='cash'),
        sa.Column('payment_reference', sa.String(100), nullable=True),
        sa.Column('bank_account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('bank_accounts.id'), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('wht_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('wht_rate', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Journal entries table
    op.create_table(
        'journal_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('entry_type', sa.String(20), nullable=False),
        sa.Column('document_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('document_number', sa.String(50), nullable=True),
        sa.Column('entry_date', sa.Date(), nullable=False),
        sa.Column('reference', sa.String(100), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('total_debit', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('total_credit', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('status', sa.String(20), nullable=False, server_default='posted'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('updated_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('deleted_at', sa.DateTime(), nullable=True),
    )

    # Journal entry lines table
    op.create_table(
        'journal_entry_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('journal_entry_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('journal_entries.id'), nullable=False),
        sa.Column('account_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('chart_of_accounts.id'), nullable=False),
        sa.Column('description', sa.String(255), nullable=True),
        sa.Column('debit_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('credit_amount', sa.Numeric(19, 4), nullable=False, server_default='0'),
        sa.Column('contact_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('contacts.id'), nullable=True),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
    )

    # Projects indexes
    op.create_index('ix_projects_company_id', 'projects', ['company_id'])
    op.create_index('ix_projects_company_code', 'projects', ['company_id', 'project_code'], unique=True)
    op.create_index('ix_projects_status', 'projects', ['status'])

    # Document sequences unique index
    op.create_index('ix_docseq_company_year_type', 'document_sequences', ['company_id', 'year', 'doc_type'], unique=True)

    # Bank accounts indexes
    op.create_index('ix_bank_accounts_company_id', 'bank_accounts', ['company_id'])

    # Chart of accounts indexes
    op.create_index('ix_coa_company_id', 'chart_of_accounts', ['company_id'])
    op.create_index('ix_coa_company_code', 'chart_of_accounts', ['company_id', 'code'])
    op.create_index('ix_coa_company_type', 'chart_of_accounts', ['company_id', 'account_type'])

    # Quotations indexes
    op.create_index('ix_quotations_company_id', 'quotations', ['company_id'])
    op.create_index('ix_quotations_contact_id', 'quotations', ['contact_id'])
    op.create_index('ix_quotations_project_id', 'quotations', ['project_id'])
    op.create_index('ix_quotations_status', 'quotations', ['status'])
    op.create_index('ix_quotations_issue_date', 'quotations', ['issue_date'])

    # Quotation items indexes
    op.create_index('ix_quotation_items_quotation_id', 'quotation_items', ['quotation_id'])

    # Invoices indexes
    op.create_index('ix_invoices_company_id', 'invoices', ['company_id'])
    op.create_index('ix_invoices_contact_id', 'invoices', ['contact_id'])
    op.create_index('ix_invoices_project_id', 'invoices', ['project_id'])
    op.create_index('ix_invoices_status', 'invoices', ['status'])
    op.create_index('ix_invoices_issue_date', 'invoices', ['issue_date'])
    op.create_index('ix_invoices_due_date', 'invoices', ['due_date'])

    # Invoice items indexes
    op.create_index('ix_invoice_items_invoice_id', 'invoice_items', ['invoice_id'])

    # Receipts indexes
    op.create_index('ix_receipts_company_id', 'receipts', ['company_id'])
    op.create_index('ix_receipts_invoice_id', 'receipts', ['invoice_id'])
    op.create_index('ix_receipts_receipt_date', 'receipts', ['receipt_date'])

    # Journal entries indexes
    op.create_index('ix_journal_entries_company_id', 'journal_entries', ['company_id'])
    op.create_index('ix_journal_entries_entry_date', 'journal_entries', ['entry_date'])
    op.create_index('ix_journal_entries_entry_type', 'journal_entries', ['entry_type'])

    # Journal entry lines indexes
    op.create_index('ix_je_lines_journal_entry_id', 'journal_entry_lines', ['journal_entry_id'])
    op.create_index('ix_je_lines_account_id', 'journal_entry_lines', ['account_id'])


def downgrade() -> None:
    # Journal entry lines
    op.drop_index('ix_je_lines_account_id', table_name='journal_entry_lines')
    op.drop_index('ix_je_lines_journal_entry_id', table_name='journal_entry_lines')
    op.drop_table('journal_entry_lines')

    # Journal entries
    op.drop_index('ix_journal_entries_entry_type', table_name='journal_entries')
    op.drop_index('ix_journal_entries_entry_date', table_name='journal_entries')
    op.drop_index('ix_journal_entries_company_id', table_name='journal_entries')
    op.drop_table('journal_entries')

    # Receipts
    op.drop_index('ix_receipts_receipt_date', table_name='receipts')
    op.drop_index('ix_receipts_invoice_id', table_name='receipts')
    op.drop_index('ix_receipts_company_id', table_name='receipts')
    op.drop_table('receipts')

    # Invoice items
    op.drop_index('ix_invoice_items_invoice_id', table_name='invoice_items')
    op.drop_table('invoice_items')

    # Invoices
    op.drop_index('ix_invoices_due_date', table_name='invoices')
    op.drop_index('ix_invoices_issue_date', table_name='invoices')
    op.drop_index('ix_invoices_status', table_name='invoices')
    op.drop_index('ix_invoices_project_id', table_name='invoices')
    op.drop_index('ix_invoices_contact_id', table_name='invoices')
    op.drop_index('ix_invoices_company_id', table_name='invoices')
    op.drop_table('invoices')

    # Quotation items
    op.drop_index('ix_quotation_items_quotation_id', table_name='quotation_items')
    op.drop_table('quotation_items')

    # Quotations (drop FK first, then indexes, then table)
    op.drop_constraint('fk_quotations_converted_to_invoice', 'quotations', type_='foreignkey')
    op.drop_index('ix_quotations_issue_date', table_name='quotations')
    op.drop_index('ix_quotations_status', table_name='quotations')
    op.drop_index('ix_quotations_project_id', table_name='quotations')
    op.drop_index('ix_quotations_contact_id', table_name='quotations')
    op.drop_index('ix_quotations_company_id', table_name='quotations')
    op.drop_table('quotations')

    # Chart of accounts
    op.drop_index('ix_coa_company_type', table_name='chart_of_accounts')
    op.drop_index('ix_coa_company_code', table_name='chart_of_accounts')
    op.drop_index('ix_coa_company_id', table_name='chart_of_accounts')
    op.drop_table('chart_of_accounts')

    # Bank accounts
    op.drop_index('ix_bank_accounts_company_id', table_name='bank_accounts')
    op.drop_table('bank_accounts')

    # Document sequences
    op.drop_index('ix_docseq_company_year_type', table_name='document_sequences')
    op.drop_table('document_sequences')

    # Projects
    op.drop_index('ix_projects_status', table_name='projects')
    op.drop_index('ix_projects_company_code', table_name='projects')
    op.drop_index('ix_projects_company_id', table_name='projects')
    op.drop_table('projects')
