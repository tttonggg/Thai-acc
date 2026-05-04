"use client";

import { useEffect } from "react";

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

interface ModelContext {
  provideContext: (context: {
    name: string;
    description: string;
    url: string;
    tools: WebMCPTool[];
    [key: string]: unknown;
  }) => void;
}

export default function WebMCP() {
  useEffect(() => {
    if (typeof navigator === "undefined") return;

    const nav = navigator as Navigator & { modelContext?: ModelContext };
    if (!nav.modelContext?.provideContext) return;

    const tools: WebMCPTool[] = [
      {
        name: "search_invoices",
        description: "Search sales invoices by status, contact, or date range",
        inputSchema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["draft", "sent", "paid", "partially_paid", "cancelled"],
              description: "Invoice status filter",
            },
            contact_id: {
              type: "string",
              description: "Filter by customer contact ID",
            },
            search: {
              type: "string",
              description: "Search by invoice number",
            },
          },
        },
        execute: async (args) => {
          const params = new URLSearchParams();
          if (args.status) params.set("status", String(args.status));
          if (args.contact_id) params.set("contact_id", String(args.contact_id));
          if (args.search) params.set("search", String(args.search));
          const res = await fetch(`/api/v1/invoices?${params}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
          });
          return res.json();
        },
      },
      {
        name: "create_invoice",
        description: "Create a new sales invoice or tax invoice",
        inputSchema: {
          type: "object",
          properties: {
            contact_id: { type: "string", description: "Customer contact ID" },
            issue_date: { type: "string", description: "Invoice issue date (YYYY-MM-DD)" },
            due_date: { type: "string", description: "Payment due date (YYYY-MM-DD)" },
            items: {
              type: "array",
              description: "Line items",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  quantity: { type: "number" },
                  unit_price: { type: "number" },
                },
                required: ["description", "quantity", "unit_price"],
              },
            },
          },
          required: ["contact_id", "issue_date", "due_date", "items"],
        },
        execute: async (args) => {
          const res = await fetch("/api/v1/invoices", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
            },
            body: JSON.stringify(args),
          });
          return res.json();
        },
      },
      {
        name: "get_financial_report",
        description: "Get income statement or balance sheet report",
        inputSchema: {
          type: "object",
          properties: {
            report_type: {
              type: "string",
              enum: ["income-statement", "balance-sheet", "trial-balance"],
              description: "Type of financial report",
            },
            from_date: { type: "string", description: "Start date (YYYY-MM-DD)" },
            to_date: { type: "string", description: "End date (YYYY-MM-DD)" },
          },
          required: ["report_type"],
        },
        execute: async (args) => {
          const params = new URLSearchParams();
          if (args.from_date) params.set("from_date", String(args.from_date));
          if (args.to_date) params.set("to_date", String(args.to_date));
          const res = await fetch(
            `/api/v1/accounting/reports/${args.report_type}?${params}`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("access_token") || ""}`,
              },
            }
          );
          return res.json();
        },
      },
      {
        name: "list_contacts",
        description: "List customers and vendors",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["customer", "vendor", "both"],
              description: "Contact type filter",
            },
            search: { type: "string", description: "Search by name" },
          },
        },
        execute: async (args) => {
          const params = new URLSearchParams();
          if (args.type && args.type !== "both") params.set("type", String(args.type));
          if (args.search) params.set("search", String(args.search));
          const res = await fetch(`/api/v1/contacts?${params}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
          });
          return res.json();
        },
      },
      {
        name: "list_products",
        description: "List products and check inventory levels",
        inputSchema: {
          type: "object",
          properties: {
            search: { type: "string", description: "Search by product name or SKU" },
            category: { type: "string", description: "Filter by category" },
          },
        },
        execute: async (args) => {
          const params = new URLSearchParams();
          if (args.search) params.set("search", String(args.search));
          if (args.category) params.set("category", String(args.category));
          const res = await fetch(`/api/v1/products?${params}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` },
          });
          return res.json();
        },
      },
    ];

    nav.modelContext.provideContext({
      name: "Thai ACC",
      description:
        "Thai cloud accounting SaaS — manage quotations, invoices, receipts, purchase orders, bills, expenses, GL, bank reconciliation, inventory, and financial reports.",
      url: "https://acc3.k56mm.uk",
      tools,
    });
  }, []);

  return null;
}
