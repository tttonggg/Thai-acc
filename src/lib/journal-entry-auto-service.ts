/**
 * Journal Entry Auto-Service
 * Creates Journal Entries when documents transition to POSTED/ISSUED.
 * Account codes: 1100=เงินสด, 1101=ธนาคาร, 1102=ลูกหนี้, 1103=VATรับคืน,
 *   2100=VATจ่าย/เจ้าหนี้, 2101=WHTจ่าย, 4100=รายได้, 5100=ต้นทุน
 * All monetary values in Satang (integer).
 */
import { prisma } from "@/lib/db"
import { checkPeriodStatus } from "@/lib/period-service"
import { generateDocNumber } from "@/lib/api-utils"
import type { JournalEntry } from "@prisma/client"

// Types
type PrismaTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]
interface JELine { accountId: string; description: string; debit: number; credit: number }
interface CreateJEResult {
  journalEntry: JournalEntry
  lines: Array<{ accountCode: string; accountName: string; debit: number; credit: number }>
}

// Account codes (hard-coded per spec)
const AC = { CASH:"1100", BANK:"1101", AR:"1102", INPUT_VAT:"1103", AP:"2100", WHT_PAYABLE:"2101", REVENUE:"4100", COGS:"5100" } as const

async function getAccountId(tx: PrismaTx, code: string): Promise<string> {
  const a = await tx.chartOfAccount.findUnique({ where: { code }, select: { id: true }})
  if (!a) throw new Error(`ไม่พบบัญชี: ${code}`)
  return a.id
}

async function createJournalEntry(tx: PrismaTx, params: {
  date: Date; description: string; reference: string; documentType: string; documentId: string; lines: JELine[]
}): Promise<CreateJEResult> {
  const { date, description, reference, documentType, documentId, lines } = params
  const totalDebit = lines.reduce((s, l) => s + l.debit, 0)
  const totalCredit = lines.reduce((s, l) => s + l.credit, 0)
  if (totalDebit !== totalCredit) throw new Error(`Unbalanced JE: Dr=${totalDebit} Cr=${totalCredit}`)
  if (totalDebit === 0) throw new Error("JE has zero amount")

  const entryNo = await generateDocNumber("JOURNAL_ENTRY", "JE")
  const journalEntry = await tx.journalEntry.create({
    data: { entryNo, date, description, reference, documentType, documentId, totalDebit, totalCredit, status: "POSTED",
      lines: { create: lines.map((l, i) => ({ lineNo: i+1, accountId: l.accountId, description: l.description, debit: l.debit, credit: l.credit, reference })) }
    },
    include: { lines: { include: { account: { select: { code: true, name: true } } } } }
  })
  return { journalEntry, lines: journalEntry.lines.map(l => ({ accountCode: l.account.code, accountName: l.account.name, debit: l.debit, credit: l.credit })) }
}

// 1. Invoice Posted → ISSUED
// DR: AR (customer.accountReceivableCode or '1102') × totalAmount
// CR: Revenue (4100) × subtotal | Output VAT (2100) × vatAmount
// CR: WHT Payable (2101) × withholdingAmount (if > 0)
export async function onInvoicePosted(invoiceId: string): Promise<CreateJEResult> {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { customer: true }})
  if (!invoice) throw new Error("ไม่พบใบกำกับภาษี")
  if (invoice.journalEntryId) throw new Error("ใบกำกับภาษีนี้ถูกสร้างรายการบัญชีแล้ว")
  if (invoice.status !== "ISSUED") throw new Error("ใบกำกับภาษีต้องมีสถานะ ISSUED")
  const p = await checkPeriodStatus(invoice.invoiceDate)
  if (!p.isValid) throw new Error(p.error || "ไม่สามารถสร้างรายการบัญชีในงวดที่ปิดแล้ว")

  return prisma.$transaction(async (tx) => {
    const arCode = invoice.customer.accountReceivableCode || "1102"
    const lines: JELine[] = [
      { accountId: await getAccountId(tx, arCode), description: `ลูกหนี้ - ${invoice.customer.name}`, debit: invoice.totalAmount, credit: 0 },
      { accountId: await getAccountId(tx, AC.REVENUE), description: `รายได้ ${invoice.invoiceNo}`, debit: 0, credit: invoice.subtotal },
      { accountId: await getAccountId(tx, AC.AP), description: `VAT ขาย ${invoice.invoiceNo}`, debit: 0, credit: invoice.vatAmount },
    ]
    if (invoice.withholdingAmount > 0) {
      lines.push({ accountId: await getAccountId(tx, AC.WHT_PAYABLE), description: `WHT ${invoice.invoiceNo}`, debit: 0, credit: invoice.withholdingAmount })
    }
    const result = await createJournalEntry(tx, { date: invoice.invoiceDate, description: `ขาย ${invoice.invoiceNo}`, reference: invoice.invoiceNo, documentType: "INVOICE", documentId: invoice.id, lines })
    await tx.invoice.update({ where: { id: invoiceId }, data: { journalEntryId: result.journalEntry.id } })
    return result
  })
}

// 2. Receipt Posted → POSTED
// DR: Cash/Bank (CASH='1100', BANK='1101') × amount
// CR: AR (1102) × amount
// DR: WHT Receivable (1103) × whtAmount | CR: WHT Payable (2101) × whtAmount (if > 0)
export async function onReceiptPosted(receiptId: string): Promise<CreateJEResult> {
  const r = await prisma.receipt.findUnique({ where: { id: receiptId }, include: { customer: true }})
  if (!r) throw new Error("ไม่พบใบเสร็จรับเงิน")
  if (r.journalEntryId) throw new Error("ใบเสร็จรับเงินนี้ถูกสร้างรายการบัญชีแล้ว")
  if (r.status !== "POSTED") throw new Error("ใบเสร็จรับเงินต้องมีสถานะ POSTED")
  const p = await checkPeriodStatus(r.receiptDate)
  if (!p.isValid) throw new Error(p.error || "ไม่สามารถสร้างรายการบัญชีในงวดที่ปิดแล้ว")

  return prisma.$transaction(async (tx) => {
    const cbCode = r.paymentMethod === "CASH" ? AC.CASH : AC.BANK
    const lines: JELine[] = [
      { accountId: await getAccountId(tx, cbCode), description: `รับเงินจาก ${r.customer.name}`, debit: r.amount, credit: 0 },
      { accountId: await getAccountId(tx, AC.AR), description: `ชำระหนี้ ${r.receiptNo}`, debit: 0, credit: r.amount },
    ]
    if (r.whtAmount > 0) {
      lines.push(
        { accountId: await getAccountId(tx, AC.INPUT_VAT), description: `WHT รับคืน ${r.receiptNo}`, debit: r.whtAmount, credit: 0 },
        { accountId: await getAccountId(tx, AC.WHT_PAYABLE), description: `WHT ค้างนำส่ง ${r.receiptNo}`, debit: 0, credit: r.whtAmount },
      )
    }
    const result = await createJournalEntry(tx, { date: r.receiptDate, description: `รับเงิน ${r.receiptNo}`, reference: r.receiptNo, documentType: "RECEIPT", documentId: r.id, lines })
    await tx.receipt.update({ where: { id: receiptId }, data: { journalEntryId: result.journalEntry.id } })
    return result
  })
}

// 3. Payment Posted → POSTED
// DR: AP (2100) × amount
// CR: Cash/Bank (1100 or 1101) × amount
export async function onPaymentPosted(paymentId: string): Promise<CreateJEResult> {
  const p = await prisma.payment.findUnique({ where: { id: paymentId }, include: { vendor: true }})
  if (!p) throw new Error("ไม่พบใบจ่ายเงิน")
  if (p.journalEntryId) throw new Error("ใบจ่ายเงินนี้ถูกสร้างรายการบัญชีแล้ว")
  if (p.status !== "POSTED") throw new Error("ใบจ่ายเงินต้องมีสถานะ POSTED")
  const periodCheck = await checkPeriodStatus(p.paymentDate)
  if (!periodCheck.isValid) throw new Error(periodCheck.error || "ไม่สามารถสร้างรายการบัญชีในงวดที่ปิดแล้ว")

  return prisma.$transaction(async (tx) => {
    const cbCode = p.paymentMethod === "CASH" ? AC.CASH : AC.BANK
    const lines: JELine[] = [
      { accountId: await getAccountId(tx, AC.AP), description: `จ่ายชำระหนี้ ${p.vendor.name}`, debit: p.amount, credit: 0 },
      { accountId: await getAccountId(tx, cbCode), description: `จ่ายเงิน ${p.paymentNo}`, debit: 0, credit: p.amount },
    ]
    const result = await createJournalEntry(tx, { date: p.paymentDate, description: `จ่ายเงินให้ผู้ขาย ${p.vendor.name} เลขที่ ${p.paymentNo}`, reference: p.paymentNo, documentType: "PAYMENT", documentId: p.id, lines })
    await tx.payment.update({ where: { id: paymentId }, data: { journalEntryId: result.journalEntry.id } })
    return result
  })
}

// 4. Purchase Invoice Posted → ISSUED
// DR: COGS (5100) × subtotal | Input VAT (1103) × vatAmount
// CR: AP (2100) × totalAmount
// DR: WHT Payable (2101) × withholdingAmount (if > 0)
export async function onPurchaseInvoicePosted(purchaseInvoiceId: string): Promise<CreateJEResult> {
  const pi = await prisma.purchaseInvoice.findUnique({ where: { id: purchaseInvoiceId }, include: { vendor: true }})
  if (!pi) throw new Error("ไม่พบใบซื้อ")
  if (pi.journalEntryId) throw new Error("ใบซื้อนี้ถูกสร้างรายการบัญชีแล้ว")
  if (pi.status !== "ISSUED") throw new Error("ใบซื้อต้องมีสถานะ ISSUED")
  const p = await checkPeriodStatus(pi.invoiceDate)
  if (!p.isValid) throw new Error(p.error || "ไม่สามารถสร้างรายการบัญชีในงวดที่ปิดแล้ว")

  return prisma.$transaction(async (tx) => {
    const lines: JELine[] = [
      { accountId: await getAccountId(tx, AC.COGS), description: `ต้นทุนซื้อ ${pi.invoiceNo}`, debit: pi.subtotal, credit: 0 },
      { accountId: await getAccountId(tx, AC.INPUT_VAT), description: `VAT ซื้อ ${pi.invoiceNo}`, debit: pi.vatAmount, credit: 0 },
      { accountId: await getAccountId(tx, AC.AP), description: `เจ้าหนี้ - ${pi.vendor.name}`, debit: 0, credit: pi.totalAmount },
    ]
    if (pi.withholdingAmount > 0) {
      lines.push({ accountId: await getAccountId(tx, AC.WHT_PAYABLE), description: `WHT ${pi.invoiceNo}`, debit: pi.withholdingAmount, credit: 0 })
    }
    const result = await createJournalEntry(tx, { date: pi.invoiceDate, description: `ซื้อ ${pi.invoiceNo}`, reference: pi.invoiceNo, documentType: "PURCHASE_INVOICE", documentId: pi.id, lines })
    await tx.purchaseInvoice.update({ where: { id: purchaseInvoiceId }, data: { journalEntryId: result.journalEntry.id } })
    return result
  })
}

// 5. Credit Note Posted → ISSUED (reversal of Invoice)
// DR: Revenue (4100) × subtotal | Output VAT (2100) × vatAmount
// CR: AR (1102) × totalAmount
export async function onCreditNotePosted(creditNoteId: string): Promise<CreateJEResult> {
  const cn = await prisma.creditNote.findUnique({ where: { id: creditNoteId }, include: { customer: true }})
  if (!cn) throw new Error("ไม่พบใบลดหนี้")
  if (cn.journalEntryId) throw new Error("ใบลดหนี้นี้ถูกสร้างรายการบัญชีแล้ว")
  if (cn.status !== "ISSUED") throw new Error("ใบลดหนี้ต้องมีสถานะ ISSUED")
  const p = await checkPeriodStatus(cn.creditNoteDate)
  if (!p.isValid) throw new Error(p.error || "ไม่สามารถสร้างรายการบัญชีในงวดที่ปิดแล้ว")

  return prisma.$transaction(async (tx) => {
    const lines: JELine[] = [
      { accountId: await getAccountId(tx, AC.REVENUE), description: `คืน/ลดหนี้ ${cn.creditNoteNo}`, debit: cn.subtotal, credit: 0 },
      { accountId: await getAccountId(tx, AC.AP), description: `VAT คืน ${cn.creditNoteNo}`, debit: cn.vatAmount, credit: 0 },
      { accountId: await getAccountId(tx, AC.AR), description: `ลดหนี้ ${cn.customer.name}`, debit: 0, credit: cn.totalAmount },
    ]
    const result = await createJournalEntry(tx, { date: cn.creditNoteDate, description: `ใบลดหนี้ ${cn.creditNoteNo} - ${cn.customer.name}`, reference: cn.creditNoteNo, documentType: "CREDIT_NOTE", documentId: cn.id, lines })
    await tx.creditNote.update({ where: { id: creditNoteId }, data: { journalEntryId: result.journalEntry.id } })
    return result
  })
}
