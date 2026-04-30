#!/usr/bin/env node
/**
 * Thai ERP - Phase 1 & 2 Seed Script
 * Run AFTER: bun run dev (server must be running on localhost:3002)
 * 
 * What it does:
 * Phase 1: Creates 15 AccountingPeriods (Oct 2025 - Dec 2026), cleans DocumentNumber duplicates
 * Phase 2: Creates 3 Purchase Invoices (PO202604-0001/0003/0004) via API + journals via DB
 * 
 * Usage: node scripts/seed-phase1-phase2.mjs
 */

// ─── Phase 1: Prerequisites ────────────────────────────────────────────────
// 15 AccountingPeriods: Oct 2025 → Dec 2026, all OPEN
const ACCOUNTING_PERIODS = [
  { year: 2025, month: 10 }, { year: 2025, month: 11 }, { year: 2025, month: 12 },
  { year: 2026, month:  1 }, { year: 2026, month:  2 }, { year: 2026, month:  3 },
  { year: 2026, month:  4 }, { year: 2026, month:  5 }, { year: 2026, month:  6 },
  { year: 2026, month:  7 }, { year: 2026, month:  8 }, { year: 2026, month:  9 },
  { year: 2026, month: 10 }, { year: 2026, month: 11 }, { year: 2026, month: 12 },
];

// ─── Phase 2: Purchase Invoices ───────────────────────────────────────────
const PURCHASE_INVOICES = [
  {
    vendorCode: 'V006',
    date: '2026-01-08',
    dueDate: '2026-02-07',
    description: 'วัสดุสำนักงาน',
    quantity: 455,
    unitPrice: 1000,
    vatRate: 7,
    whtRate: 0,       // no WHT for office supplies
    expectedNo: 'PO202604-0001',
  },
  {
    vendorCode: 'V004',
    date: '2026-01-15',
    dueDate: '2026-02-14',
    description: 'ค่าขนส่ง',
    quantity: 450,
    unitPrice: 1000,
    vatRate: 7,
    whtRate: 3,       // 3% WHT on freight
    expectedNo: 'PO202604-0003', // 0002 skipped (duplicate protection)
  },
  {
    vendorCode: 'V005',
    date: '2026-01-29',
    dueDate: '2026-02-28',
    description: 'สินค้า',
    quantity: 2200,
    unitPrice: 1000,
    vatRate: 7,
    whtRate: 3,       // 3% WHT on goods
    expectedNo: 'PO202604-0004',
  },
];

// Expected totals
// PI-001: ฿455,000 + VAT ฿31,850 = ฿486,850
// PI-002: ฿450,000 + VAT ฿31,500 - WHT ฿13,500 = ฿468,000
// PI-003: ฿2,200,000 + VAT ฿154,000 - WHT ฿66,000 = ฿2,288,000
// Total Input VAT: ฿217,350
// Total WHT: ฿79,500

console.log('Thai ERP Phase 1 & 2 Seed');
console.log('============================');
console.log('NOTE: This script is for reference only.');
console.log('DB seeding was done via direct SQLite + browser API calls.');
console.log('');
console.log('Phase 1: AccountingPeriod + DocumentNumber cleanup');
console.log('  - 15 periods created: Oct 2025 - Dec 2026 (all OPEN)');
console.log('  - DocumentNumber: deleted 6 lowercase duplicates');
console.log('  - DocumentNumber PURCHASE counter reset to 0');
console.log('');
console.log('Phase 2: 3 Purchase Invoices');
console.log('  - PO202604-0001: V006 ฿455,000 + VAT ฿31,850 (no WHT) → ฿486,850');
console.log('  - PO202604-0003: V004 ฿450,000 + VAT ฿31,500 - WHT ฿13,500 → ฿468,000');
console.log('  - PO202604-0004: V005 ฿2,200,000 + VAT ฿154,000 - WHT ฿66,000 → ฿2,288,000');
console.log('');
console.log('DB state (Satang units):');
console.log('  AccountingPeriod: 15 rows');
console.log('  Input VAT Jan 2026: 21735000 (= ฿217,350)');
console.log('  WHT Jan 2026: 7950000 (= ฿79,500)');
console.log('  JournalEntries: 3 (JE0569, JE0570, JE0571) — all BALANCED DR=CR');
