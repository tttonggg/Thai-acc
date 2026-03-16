// B2. Multi-Currency Service
// บริการสกุลเงินต่างประเทศ

import { prisma } from "@/lib/db"
import type { Currency, ExchangeRate, CurrencyGainLoss } from "@prisma/client"

const EXCHANGE_RATE_API_KEY = process.env.EXCHANGE_RATE_API_KEY
const EXCHANGE_RATE_API_URL = "https://api.exchangerate-api.com/v4/latest"

/**
 * Convert amount between currencies
 * แปลงจำนวนเงินระหว่างสกุลเงิน
 */
export function convertCurrency(
  amount: number,
  fromRate: number,
  toRate: number
): number {
  // Convert from source currency to THB, then to target
  const amountInTHB = amount * fromRate
  return amountInTHB / toRate
}

/**
 * Get exchange rate for a currency on a specific date
 * ดึงอัตราแลกเปลี่ยนสำหรับสกุลเงินในวันที่กำหนด
 */
export async function getExchangeRate(
  currencyCode: string,
  date: Date = new Date()
): Promise<number> {
  if (currencyCode === "THB") return 1

  // Find rate for the date (or closest before)
  const rate = await prisma.exchangeRate.findFirst({
    where: {
      fromCurrency: currencyCode,
      toCurrency: "THB",
      date: { lte: date },
    },
    orderBy: { date: "desc" },
  })

  if (rate) return rate.rate

  // Return default rate from Currency table
  const currency = await prisma.currency.findUnique({
    where: { code: currencyCode },
  })

  if (currency) {
    // Get latest rate
    const latestRate = await prisma.exchangeRate.findFirst({
      where: { fromCurrency: currencyCode, toCurrency: "THB" },
      orderBy: { date: "desc" },
    })
    if (latestRate) return latestRate.rate
  }

  throw new Error(`ไม่พบอัตราแลกเปลี่ยนสำหรับ ${currencyCode}`)
}

/**
 * Create or update exchange rate
 * สร้างหรืออัปเดตอัตราแลกเปลี่ยน
 */
export async function setExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  rate: number,
  date: Date = new Date(),
  source: "MANUAL" | "API" | "SYSTEM" = "MANUAL",
  sourceRef?: string,
  createdBy?: string
): Promise<ExchangeRate> {
  const currency = await prisma.currency.findUnique({
    where: { code: fromCurrency },
  })

  return prisma.exchangeRate.create({
    data: {
      currencyId: currency?.id,
      fromCurrency,
      toCurrency,
      rate,
      date,
      source,
      sourceRef,
      createdBy,
    },
  })
}

/**
 * Fetch latest rates from external API
 * ดึงอัตราแลกเปลี่ยนล่าสุดจาก API ภายนอก
 */
export async function fetchLatestRates(): Promise<
  Array<{ code: string; rate: number }>
> {
  try {
    const response = await fetch(`${EXCHANGE_RATE_API_URL}/THB`)
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates")
    }

    const data = await response.json()
    const rates: Array<{ code: string; rate: number }> = []

    // Convert rates to THB base (API returns THB per 1 unit of foreign currency)
    // But we need foreign currency per 1 THB
    for (const [code, rate] of Object.entries(data.rates)) {
      if (code !== "THB") {
        rates.push({ code, rate: rate as number })
      }
    }

    return rates
  } catch (error) {
    console.error("Error fetching exchange rates:", error)
    throw error
  }
}

/**
 * Update all exchange rates from API
 * อัปเดตอัตราแลกเปลี่ยนทั้งหมดจาก API
 */
export async function updateExchangeRatesFromAPI(
  createdBy?: string
): Promise<number> {
  const rates = await fetchLatestRates()
  const today = new Date()

  let updatedCount = 0
  for (const { code, rate } of rates) {
    const currency = await prisma.currency.findUnique({ where: { code } })
    if (currency) {
      await setExchangeRate(code, "THB", rate, today, "API", "exchangerate-api.com", createdBy)
      updatedCount++
    }
  }

  return updatedCount
}

/**
 * Calculate realized gain/loss on payment
 * คำนวณกำไร/ขาดทุนจากการเปลี่ยนแปลงอัตราแลกเปลี่ยนที่เกิดขึ้นจริง
 */
export async function calculateRealizedGainLoss(
  documentType: string,
  documentId: string,
  currencyCode: string,
  originalRate: number,
  currentRate: number,
  foreignAmount: number,
  date: Date = new Date()
): Promise<CurrencyGainLoss> {
  const gainLossAmount = Math.round(
    foreignAmount * (currentRate - originalRate)
  )

  return prisma.currencyGainLoss.create({
    data: {
      type: "REALIZED",
      documentType,
      documentId,
      currencyCode,
      originalRate,
      currentRate,
      amount: foreignAmount,
      gainLossAmount,
      date,
      isPosted: false,
    },
  })
}

/**
 * Calculate unrealized gain/loss for open foreign currency items
 * คำนวณกำไร/ขาดทุนจากการเปลี่ยนแปลงอัตราแลกเปลี่ยนที่ยังไม่เกิดขึ้นจริง
 */
export async function calculateUnrealizedGainLoss(
  asOfDate: Date = new Date()
): Promise<CurrencyGainLoss[]> {
  const results: CurrencyGainLoss[] = []

  // Get all unpaid invoices with foreign currency
  const unpaidInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ["ISSUED", "PARTIAL"] },
      currencyId: { not: null },
      isActive: true,
    },
    include: { currency: true },
  })

  for (const invoice of unpaidInvoices) {
    if (!invoice.currency || invoice.currency.code === "THB") continue

    const currentRate = await getExchangeRate(invoice.currency.code, asOfDate)
    const gainLossAmount = Math.round(
      (invoice.foreignAmount || 0) * (currentRate - invoice.exchangeRate)
    )

    if (gainLossAmount !== 0) {
      const gainLoss = await prisma.currencyGainLoss.create({
        data: {
          type: "UNREALIZED",
          documentType: "Invoice",
          documentId: invoice.id,
          currencyCode: invoice.currency.code,
          originalRate: invoice.exchangeRate,
          currentRate,
          amount: invoice.foreignAmount || 0,
          gainLossAmount,
          date: asOfDate,
          isPosted: false,
        },
      })
      results.push(gainLoss)
    }
  }

  return results
}

/**
 * Post gain/loss to journal entries
 * บันทึกกำไร/ขาดทุนลงบัญชี
 */
export async function postGainLossToGL(
  gainLossId: string,
  journalEntryId: string
): Promise<CurrencyGainLoss> {
  return prisma.currencyGainLoss.update({
    where: { id: gainLossId },
    data: {
      isPosted: true,
      journalEntryId,
    },
  })
}

/**
 * Format amount in foreign currency
 * จัดรูปแบบจำนวนเงินต่างประเทศ
 */
export function formatForeignAmount(
  amount: number,
  currency: Currency
): string {
  return `${currency.symbol}${amount.toLocaleString("th-TH", {
    minimumFractionDigits: currency.decimalPlaces,
    maximumFractionDigits: currency.decimalPlaces,
  })} ${currency.code}`
}

/**
 * Get multi-currency report data
 * ดึงข้อมูลรายงานหลายสกุลเงิน
 */
export interface MultiCurrencyReport {
  baseCurrency: string
  reportDate: Date
  currencies: Array<{
    code: string
    name: string
    currentRate: number
    lastUpdated: Date
    receivables: {
      count: number
      foreignAmount: number
      thbAmount: number
    }
    payables: {
      count: number
      foreignAmount: number
      thbAmount: number
    }
    realizedGainLoss: number
    unrealizedGainLoss: number
  }>
}

export async function generateMultiCurrencyReport(
  asOfDate: Date = new Date()
): Promise<MultiCurrencyReport> {
  const baseCurrency = await prisma.currency.findFirst({
    where: { isBase: true },
  })

  const currencies = await prisma.currency.findMany({
    where: { isActive: true, isBase: false },
    include: {
      exchangeRates: {
        orderBy: { date: "desc" },
        take: 1,
      },
    },
  })

  const report: MultiCurrencyReport = {
    baseCurrency: baseCurrency?.code || "THB",
    reportDate: asOfDate,
    currencies: [],
  }

  for (const currency of currencies) {
    const currentRate = currency.exchangeRates[0]?.rate || 1
    const lastUpdated = currency.exchangeRates[0]?.date || currency.updatedAt

    // Get receivables
    const receivableInvoices = await prisma.invoice.findMany({
      where: {
        currencyId: currency.id,
        status: { in: ["ISSUED", "PARTIAL"] },
        isActive: true,
      },
    })

    const receivablesForeign = receivableInvoices.reduce(
      (sum, inv) => sum + (inv.foreignAmount || inv.totalAmount),
      0
    )
    const receivablesTHB = receivableInvoices.reduce(
      (sum, inv) => sum + inv.totalAmount,
      0
    )

    // Get payables (purchase invoices)
    const payableInvoices = await prisma.$queryRaw<
      Array<{ totalAmount: number; foreignAmount: number }>
    >`
      SELECT 
        COALESCE(SUM(totalAmount), 0) as totalAmount,
        COALESCE(SUM(foreignAmount), 0) as foreignAmount
      FROM PurchaseInvoice
      WHERE currencyId = ${currency.id}
        AND status IN ('ISSUED', 'PARTIAL')
        AND isActive = 1
    `

    // Get gain/loss
    const gainLoss = await prisma.currencyGainLoss.groupBy({
      by: ["type"],
      where: { currencyCode: currency.code },
      _sum: { gainLossAmount: true },
    })

    const realizedGainLoss =
      gainLoss.find((g) => g.type === "REALIZED")?._sum.gainLossAmount || 0
    const unrealizedGainLoss =
      gainLoss.find((g) => g.type === "UNREALIZED")?._sum.gainLossAmount || 0

    report.currencies.push({
      code: currency.code,
      name: currency.name,
      currentRate,
      lastUpdated,
      receivables: {
        count: receivableInvoices.length,
        foreignAmount: receivablesForeign,
        thbAmount: receivablesTHB,
      },
      payables: {
        count: 0,
        foreignAmount: payableInvoices[0]?.foreignAmount || 0,
        thbAmount: payableInvoices[0]?.totalAmount || 0,
      },
      realizedGainLoss,
      unrealizedGainLoss,
    })
  }

  return report
}

/**
 * Initialize default currencies
 * สร้างสกุลเงินเริ่มต้น
 */
export async function initializeDefaultCurrencies(): Promise<void> {
  const defaults = [
    { code: "THB", name: "Thai Baht", nameTh: "บาท", symbol: "฿", isBase: true, decimalPlaces: 2 },
    { code: "USD", name: "US Dollar", nameTh: "ดอลลาร์สหรัฐ", symbol: "$", isBase: false, decimalPlaces: 2 },
    { code: "EUR", name: "Euro", nameTh: "ยูโร", symbol: "€", isBase: false, decimalPlaces: 2 },
    { code: "GBP", name: "British Pound", nameTh: "ปอนด์สเตอร์ลิง", symbol: "£", isBase: false, decimalPlaces: 2 },
    { code: "JPY", name: "Japanese Yen", nameTh: "เยนญี่ปุ่น", symbol: "¥", isBase: false, decimalPlaces: 0 },
    { code: "CNY", name: "Chinese Yuan", nameTh: "หยวนจีน", symbol: "¥", isBase: false, decimalPlaces: 2 },
    { code: "SGD", name: "Singapore Dollar", nameTh: "ดอลลาร์สิงคโปร์", symbol: "S$", isBase: false, decimalPlaces: 2 },
    { code: "MYR", name: "Malaysian Ringgit", nameTh: "ริงกิตมาเลเซีย", symbol: "RM", isBase: false, decimalPlaces: 2 },
  ]

  for (const curr of defaults) {
    await prisma.currency.upsert({
      where: { code: curr.code },
      update: curr,
      create: curr,
    })
  }
}
