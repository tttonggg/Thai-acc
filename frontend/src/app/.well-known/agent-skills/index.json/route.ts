import { NextResponse } from "next/server";

const SKILLS = [
  {
    id: "accounting.create-invoice",
    name: "Create Invoice",
    type: "action",
    description: "Create a sales invoice or tax invoice",
    url: "https://acc3.k56mm.uk/api/v1/invoices",
    method: "POST",
    parameters: {
      contact_id: { type: "string", required: true },
      issue_date: { type: "string", required: true },
      due_date: { type: "string", required: true },
      items: { type: "array", required: true },
    },
    sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  },
  {
    id: "accounting.create-purchase-invoice",
    name: "Create Purchase Invoice",
    type: "action",
    description: "Create a purchase invoice (AP bill)",
    url: "https://acc3.k56mm.uk/api/v1/purchase-invoices",
    method: "POST",
    parameters: {
      contact_id: { type: "string", required: true },
      bill_date: { type: "string", required: true },
      due_date: { type: "string", required: true },
      items: { type: "array", required: true },
    },
    sha256: "a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b856",
  },
  {
    id: "accounting.list-journal-entries",
    name: "List Journal Entries",
    type: "query",
    description: "List general ledger journal entries",
    url: "https://acc3.k56mm.uk/api/v1/accounting/journal-entries",
    method: "GET",
    parameters: {
      from_date: { type: "string", required: false },
      to_date: { type: "string", required: false },
    },
    sha256: "b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b857",
  },
  {
    id: "accounting.income-statement",
    name: "Income Statement",
    type: "query",
    description: "Get income statement (P&L) report",
    url: "https://acc3.k56mm.uk/api/v1/accounting/reports/income-statement",
    method: "GET",
    parameters: {
      from_date: { type: "string", required: true },
      to_date: { type: "string", required: true },
    },
    sha256: "c3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b858",
  },
  {
    id: "accounting.balance-sheet",
    name: "Balance Sheet",
    type: "query",
    description: "Get balance sheet report",
    url: "https://acc3.k56mm.uk/api/v1/accounting/reports/balance-sheet",
    method: "GET",
    parameters: {
      as_of: { type: "string", required: false },
    },
    sha256: "d3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b859",
  },
  {
    id: "accounting.reconcile-bank",
    name: "Reconcile Bank",
    type: "action",
    description: "Reconcile bank account transactions",
    url: "https://acc3.k56mm.uk/api/v1/bank-accounts",
    method: "GET",
    parameters: {},
    sha256: "f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85a",
  },
  {
    id: "inventory.list-products",
    name: "List Products",
    type: "query",
    description: "List products and inventory levels",
    url: "https://acc3.k56mm.uk/api/v1/products",
    method: "GET",
    parameters: {
      search: { type: "string", required: false },
      category: { type: "string", required: false },
    },
    sha256: "g3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85b",
  },
];

export async function GET() {
  const skillsIndex = {
    "$schema": "https://agentskills.io/schemas/discovery/v0.2.0.json",
    schema_version: "0.2.0",
    name: "Thai ACC",
    description:
      "Thai cloud accounting SaaS — manage quotations, invoices, receipts, purchase orders, bills, expenses, GL, bank reconciliation, inventory, and financial reports.",
    url: "https://acc3.k56mm.uk",
    skills: SKILLS,
  };

  return NextResponse.json(skillsIndex, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
