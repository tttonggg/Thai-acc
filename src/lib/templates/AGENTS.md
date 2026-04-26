<!-- Parent: ../../AGENTS.md -->
<!-- Generated: 2026-04-26 -->

# src/lib/templates

## Purpose

HTML templates for PDF generation of invoices, receipts, and other documents.

## Parent Reference
<!-- Parent: ../AGENTS.md -->

## Key Files

| File | Description |
|------|-------------|
| `invoice-template.html` | Invoice PDF HTML template |
| `receipt-template.html` | Receipt PDF HTML template |

## For AI Agents

- Templates use HTML with inline CSS for PDF generation
- Modify templates when changing invoice/receipt PDF format
- Templates are processed by `pdf-generator.ts` or `pdfkit-generator.ts`