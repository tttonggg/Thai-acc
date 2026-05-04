import { NextResponse } from "next/server";

const LANDING_MARKDOWN = `# Thai ACC — โปรแกรมบัญชีออนไลน์ครบวงจรสำหรับธุรกิจไทย

## Overview

Thai ACC is a full-featured Thai cloud accounting platform for SMEs. It covers sales documents, purchasing, expense claims, bank reconciliation, general ledger, financial statements, and e-Tax Invoice compliance.

## Features

- **e-Tax Invoice** — Generate and submit tax invoices to the Thai Revenue Department
- **Sales** — Quotations, invoices, receipts, credit/debit notes
- **Purchasing** — Purchase orders, purchase invoices (AP), payment vouchers
- **Expense Claims** — Employee reimbursements with approval workflow
- **Bank & Cash** — Bank reconciliation, check management, petty cash
- **General Ledger** — Journal entries, trial balance, income statement, balance sheet
- **Inventory** — FIFO costing, stock adjustments, product tracking
- **Projects** — Cost control and budgeting by project
- **Reports** — AR/AP aging, P.P.30 VAT report, withholding tax reports
- **Multi-Currency** — USD, EUR, GBP, JPY, CNY with exchange rates

## API

- Base URL: https://acc3.k56mm.uk/api/v1
- Authentication: Bearer token (JWT)
- Docs: https://acc3.k56mm.uk/api/v1/docs
- OpenAPI: https://acc3.k56mm.uk/api/v1/openapi.json

## Agent Skills

- Create invoices and purchase invoices
- List journal entries and financial reports
- Reconcile bank accounts
- Manage products and inventory

## Links

- [Login](https://acc3.k56mm.uk/login)
- [Register](https://acc3.k56mm.uk/register)
- [Dashboard](https://acc3.k56mm.uk/dashboard)
`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "home";

  if (path !== "home") {
    return NextResponse.json(
      { detail: "Markdown not available for this path" },
      { status: 404 }
    );
  }

  return new NextResponse(LANDING_MARKDOWN, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}
