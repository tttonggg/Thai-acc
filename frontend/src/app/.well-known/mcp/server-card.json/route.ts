import { NextResponse } from "next/server";

export async function GET() {
  const serverCard = {
    schema_version: "v1",
    name: "Thai ACC API",
    serverInfo: {
      name: "Thai ACC API",
      version: "0.3.0-alpha",
      description:
        "Thai cloud accounting SaaS API — quotations, invoices, receipts, purchase orders, bills, expense claims, GL, e-Tax, bank reconciliation, inventory FIFO, and financial reports.",
    },
    transport: {
      type: "http",
      endpoint: "https://acc3.k56mm.uk/api/v1",
    },
    capabilities: {
      auth: {
        type: "Bearer",
        header: "Authorization",
      },
      documentation: {
        openapi: "https://acc3.k56mm.uk/api/v1/openapi.json",
        html: "https://acc3.k56mm.uk/api/v1/docs",
      },
    },
    endpoints: [
      {
        path: "/auth/login",
        method: "POST",
        description: "Authenticate and receive access token",
      },
      {
        path: "/auth/register",
        method: "POST",
        description: "Register a new company and user",
      },
      {
        path: "/invoices",
        method: "GET,POST",
        description: "Sales invoices and tax invoices",
      },
      {
        path: "/purchase-invoices",
        method: "GET,POST",
        description: "Purchase invoices (AP bills)",
      },
      {
        path: "/quotations",
        method: "GET,POST",
        description: "Sales quotations",
      },
      {
        path: "/receipts",
        method: "GET,POST",
        description: "Payment receipts",
      },
      {
        path: "/expense-claims",
        method: "GET,POST",
        description: "Employee expense claims",
      },
      {
        path: "/accounting/journal-entries",
        method: "GET,POST",
        description: "General ledger journal entries",
      },
      {
        path: "/accounting/reports/income-statement",
        method: "GET",
        description: "Income statement (P&L)",
      },
      {
        path: "/accounting/reports/balance-sheet",
        method: "GET",
        description: "Balance sheet",
      },
      {
        path: "/products",
        method: "GET,POST",
        description: "Products and inventory",
      },
      {
        path: "/contacts",
        method: "GET,POST",
        description: "Customers and vendors",
      },
      {
        path: "/bank-accounts",
        method: "GET,POST",
        description: "Bank accounts and reconciliation",
      },
      {
        path: "/projects",
        method: "GET,POST",
        description: "Projects and cost control",
      },
    ],
    auth: {
      type: "Bearer",
      header: "Authorization",
    },
  };

  return NextResponse.json(serverCard, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
