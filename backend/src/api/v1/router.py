from fastapi import APIRouter
from .endpoints import auth, companies, contacts, products, projects, quotations, invoices, receipts, purchase_orders, purchase_invoices, expense_claims, accounting, bank_accounts, exchange_rates, stock_adjustments, credit_notes

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(quotations.router, prefix="/quotations", tags=["Quotations"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["Receipts"])
api_router.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["Purchase Orders"])
api_router.include_router(purchase_invoices.router, prefix="/purchase-invoices", tags=["Purchase Invoices"])
api_router.include_router(expense_claims.router, prefix="/expense-claims", tags=["Expense Claims"])
api_router.include_router(accounting.router, prefix="/accounting", tags=["Accounting"])
api_router.include_router(bank_accounts.router, prefix="/bank-accounts", tags=["Bank Accounts"])
api_router.include_router(exchange_rates.router, prefix="/exchange-rates", tags=["Exchange Rates"])
api_router.include_router(stock_adjustments.router, prefix="/stock-adjustments", tags=["Stock Adjustments"])
api_router.include_router(credit_notes.router, prefix="/credit-notes", tags=["Credit Notes"])
