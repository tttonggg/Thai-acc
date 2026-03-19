// Excel Export Service for Thai Accounting ERP
// Services for exporting reports to Excel format using SheetJS (xlsx)

import * as XLSX from 'xlsx'

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface TrialBalanceData {
  code: string
  name: string
  nameEn?: string | null
  type: string
  debit: number
  credit: number
  balance: number
}

export interface TrialBalanceReportData {
  accounts: TrialBalanceData[]
  totals: {
    debit: number
    credit: number
    isBalanced: boolean
  }
  asOfDate: string
}

export interface IncomeStatementAccount {
  code: string
  name: string
  nameEn?: string | null
  amount: number
}

export interface IncomeStatementData {
  revenue: IncomeStatementAccount[]
  expenses: IncomeStatementAccount[]
  totalRevenue: number
  totalExpenses: number
  netIncome: number
}

export interface BalanceSheetAccount {
  code: string
  name: string
  nameEn?: string | null
  amount: number
}

export interface BalanceSheetData {
  assets: BalanceSheetAccount[]
  liabilities: BalanceSheetAccount[]
  equity: BalanceSheetAccount[]
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  isBalanced: boolean
}

export interface ARAgingCustomer {
  customerId: string
  customerCode: string
  customerName: string
  current: number
  days30: number
  days60: number
  days90: number
  over90: number
  total: number
}

export interface ARAgingData {
  customers: ARAgingCustomer[]
  totals: {
    current: number
    days30: number
    days60: number
    days90: number
    over90: number
    total: number
  }
  asOfDate: string
}

export interface APAgingVendor {
  vendorId: string
  vendorCode: string
  vendorName: string
  current: number
  days30: number
  days60: number
  days90: number
  over90: number
  total: number
}

export interface APAgingData {
  vendors: APAgingVendor[]
  totals: {
    current: number
    days30: number
    days60: number
    days90: number
    over90: number
    total: number
  }
  asOfDate: string
}

export interface VATMonthlyData {
  month: string
  monthNameTh: string
  salesVat: number
  purchaseVat: number
  payableVat: number
}

export interface VATReportData {
  monthlyData: VATMonthlyData[]
  ytdTotals: {
    salesVat: number
    purchaseVat: number
    payableVat: number
  }
  year: number
}

export interface WHTEntry {
  date: string
  description: string
  taxId: string
  amount: number
  taxRate: number
  withholdingTax: number
  netPayment: number
}

export interface WHTReportData {
  formType: 'PND3' | 'PND53'
  month: string
  year: number
  entries: WHTEntry[]
  totals: {
    grossAmount: number
    withholdingTax: number
    netPayment: number
  }
}

// ============================================================================
// Excel Styling Utilities
// ============================================================================

interface CellStyle {
  bold?: boolean
  italic?: boolean
  fontSize?: number
  fontName?: string
  fgColor?: { rgb: string }
  bgColor?: { rgb: string }
  hAlign?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'center' | 'bottom'
  border?: {
    top?: string
    bottom?: string
    left?: string
    right?: string
  }
  numberFormat?: string
}

const STYLES = {
  HEADER: {
    bold: true,
    fontSize: 11,
    bgColor: { rgb: 'E0E0E0' },
    hAlign: 'center' as const,
    vAlign: 'center' as const,
    border: {
      top: 'thin',
      bottom: 'medium',
      left: 'thin',
      right: 'thin',
    },
  },
  TOTAL_ROW: {
    bold: true,
    fontSize: 11,
    bgColor: { rgb: 'FFF9E6' },
    hAlign: 'right' as const,
    vAlign: 'center' as const,
    border: {
      top: 'medium',
      bottom: 'thin',
      left: 'thin',
      right: 'thin',
    },
  },
  SUBTOTAL_ROW: {
    bold: true,
    fontSize: 11,
    bgColor: { rgb: 'E6F3FF' },
    hAlign: 'right' as const,
    vAlign: 'center' as const,
  },
  CURRENCY: {
    numberFormat: '฿#,##0.00',
    hAlign: 'right' as const,
  },
  PERCENTAGE: {
    numberFormat: '0.00%',
    hAlign: 'right' as const,
  },
  NUMBER: {
    numberFormat: '#,##0.00',
    hAlign: 'right' as const,
  },
  TEXT_LEFT: {
    hAlign: 'left' as const,
  },
  TEXT_CENTER: {
    hAlign: 'center' as const,
  },
}

// ============================================================================
// Column Width Utilities
// ============================================================================

function autoFitColumnWidths(data: any[][], minWidth: number = 10, maxWidth: number = 50): number[] {
  if (!data || data.length === 0) return [15, 20, 20, 20]

  const colCount = data[0].length
  const widths: number[] = []

  for (let col = 0; col < colCount; col++) {
    let maxLen = minWidth

    for (let row = 0; row < data.length; row++) {
      const cellValue = data[row][col]
      if (cellValue !== undefined && cellValue !== null) {
        const strLen = String(cellValue).length
        if (strLen > maxLen) {
          maxLen = Math.min(strLen, maxWidth)
        }
      }
    }

    // Add some padding
    widths.push(Math.min(maxLen + 2, maxWidth))
  }

  return widths
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear() + 543
  return `${day}/${month}/${year}`
}

function formatMonthThai(month: number): string {
  const months = [
    'มกราคม',
    'กุมภาพันธ์',
    'มีนาคม',
    'เมษายน',
    'พฤษภาคม',
    'มิถุนายน',
    'กรกฎาคม',
    'สิงหาคม',
    'กันยายน',
    'ตุลาคม',
    'พฤศจิกายน',
    'ธันวาคม',
  ]
  return months[month - 1] || ''
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0
  return value / total
}

// ============================================================================
// Trial Balance Export
// ============================================================================

export async function generateTrialBalanceExcel(data: TrialBalanceReportData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows
  const rows: any[][] = []

  // Header
  rows.push(['รหัสบัญชี', 'ชื่อบัญชี', 'เดบิต', 'เครดิต'])

  // Data rows
  for (const account of data.accounts) {
    rows.push([
      account.code,
      account.name,
      account.debit || 0,
      account.credit || 0,
    ])
  }

  // Total row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    data.totals.debit,
    data.totals.credit,
  ])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Code
    { wch: 40 }, // Name
    { wch: 20 }, // Debit
    { wch: 20 }, // Credit
  ]

  // Set column alignments (not directly supported in basic xlsx, but we can format numbers)
  // The number formatting will be applied when the file is opened in Excel

  // Set number format for currency columns
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 1; row <= range.e.r; row++) {
    // Debit column (C)
    const debitCell = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (worksheet[debitCell]) {
      worksheet[debitCell].z = '฿#,##0.00'
      worksheet[debitCell].s = { ...STYLES.CURRENCY }
    }

    // Credit column (D)
    const creditCell = XLSX.utils.encode_cell({ r: row, c: 3 })
    if (worksheet[creditCell]) {
      worksheet[creditCell].z = '฿#,##0.00'
      worksheet[creditCell].s = { ...STYLES.CURRENCY }
    }
  }

  // Style header row
  for (let col = 0; col <= 3; col++) {
    const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
    if (worksheet[headerCell]) {
      worksheet[headerCell].s = STYLES.HEADER
    }
  }

  // Style total row
  const totalRow = range.e.r
  for (let col = 0; col <= 3; col++) {
    const totalCell = XLSX.utils.encode_cell({ r: totalRow, c: col })
    if (worksheet[totalCell]) {
      worksheet[totalCell].s = STYLES.TOTAL_ROW
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'งบทดลอง')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// Income Statement Export
// ============================================================================

export async function generateIncomeStatementExcel(data: IncomeStatementData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows
  const rows: any[][] = []

  // Header
  rows.push(['รหัสบัญชี', 'ชื่อบัญชี', 'จำนวนเงิน'])

  // Revenue section
  rows.push(['', 'รายได้', ''])
  for (const revenue of data.revenue) {
    rows.push([revenue.code, '  ' + revenue.name, revenue.amount])
  }
  rows.push(['', 'รวมรายได้', data.totalRevenue])
  rows.push([]) // Empty row

  // Expense section
  rows.push(['', 'ค่าใช้จ่าย', ''])
  for (const expense of data.expenses) {
    rows.push([expense.code, '  ' + expense.name, expense.amount])
  }
  rows.push(['', 'รวมค่าใช้จ่าย', data.totalExpenses])
  rows.push([]) // Empty row

  // Net income
  const netIncomeLabel = data.netIncome >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'
  rows.push(['', netIncomeLabel, Math.abs(data.netIncome)])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Code
    { wch: 50 }, // Name
    { wch: 20 }, // Amount
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    // Amount column (C)
    const amountCell = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (worksheet[amountCell] && typeof worksheet[amountCell].v === 'number') {
      worksheet[amountCell].z = '฿#,##0.00'
      worksheet[amountCell].s = { ...STYLES.CURRENCY }
    }

    // Style header row
    if (row === 0) {
      for (let col = 0; col <= 2; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
    }

    // Style section headers and totals
    const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[nameCell] && typeof worksheet[nameCell].v === 'string') {
      const value = worksheet[nameCell].v as string
      if (value === 'รายได้' || value === 'ค่าใช้จ่าย') {
        worksheet[nameCell].s = { bold: true, fontSize: 11 }
      } else if (value.includes('รวม') || value.includes('กำไร') || value.includes('ขาดทุน')) {
        worksheet[nameCell].s = STYLES.SUBTOTAL_ROW

        // Also style the amount cell
        if (worksheet[amountCell]) {
          worksheet[amountCell].s = STYLES.TOTAL_ROW
        }
      }
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'งบกำไรขาดทุน')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// Balance Sheet Export
// ============================================================================

export async function generateBalanceSheetExcel(data: BalanceSheetData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows
  const rows: any[][] = []

  // Header
  rows.push(['รหัสบัญชี', 'ชื่อบัญชี', 'จำนวนเงิน'])

  // Assets section
  rows.push(['', 'สินทรัพย์', ''])
  for (const asset of data.assets) {
    rows.push([asset.code, '  ' + asset.name, asset.amount])
  }
  rows.push(['', 'รวมสินทรัพย์', data.totalAssets])
  rows.push([]) // Empty row

  // Liabilities section
  rows.push(['', 'หนี้สิน', ''])
  for (const liability of data.liabilities) {
    rows.push([liability.code, '  ' + liability.name, liability.amount])
  }
  rows.push(['', 'รวมหนี้สิน', data.totalLiabilities])
  rows.push([]) // Empty row

  // Equity section
  rows.push(['', 'ส่วนของผู้ถือหุ้น', ''])
  for (const equity of data.equity) {
    rows.push([equity.code, '  ' + equity.name, equity.amount])
  }
  rows.push(['', 'รวมส่วนของผู้ถือหุ้น', data.totalEquity])
  rows.push([]) // Empty row

  // Total validation
  rows.push(['', 'รวมหนี้สินและส่วนของผู้ถือหุ้น', data.totalLiabilities + data.totalEquity])

  // Validation row
  const isBalanced = Math.abs(data.totalAssets - (data.totalLiabilities + data.totalEquity)) < 0.01
  rows.push(['', 'ตรวจสอบ (สินทรัพย์ = หนี้สิน + ส่วนของผู้ถือหุ้น)', isBalanced ? 'ถูกต้อง' : 'ไม่ถูกต้อง'])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Code
    { wch: 50 }, // Name
    { wch: 20 }, // Amount
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    // Amount column (C)
    const amountCell = XLSX.utils.encode_cell({ r: row, c: 2 })
    if (worksheet[amountCell] && typeof worksheet[amountCell].v === 'number') {
      worksheet[amountCell].z = '฿#,##0.00'
      worksheet[amountCell].s = { ...STYLES.CURRENCY }
    }

    // Style header row
    if (row === 0) {
      for (let col = 0; col <= 2; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
    }

    // Style section headers and totals
    const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[nameCell] && typeof worksheet[nameCell].v === 'string') {
      const value = worksheet[nameCell].v as string
      if (value === 'สินทรัพย์' || value === 'หนี้สิน' || value === 'ส่วนของผู้ถือหุ้น') {
        worksheet[nameCell].s = { bold: true, fontSize: 11 }
      } else if (value.includes('รวม') || value.includes('ตรวจสอบ')) {
        worksheet[nameCell].s = STYLES.SUBTOTAL_ROW

        // Also style the amount cell
        if (worksheet[amountCell]) {
          if (typeof worksheet[amountCell].v === 'number') {
            worksheet[amountCell].s = STYLES.TOTAL_ROW
          } else {
            worksheet[amountCell].s = { ...STYLES.SUBTOTAL_ROW, hAlign: 'center' as const }
          }
        }
      }
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'งบดุล')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// AR Aging Export
// ============================================================================

export async function generateARAgingExcel(data: ARAgingData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows
  const rows: any[][] = []

  // Header
  rows.push([
    'รหัสลูกค้า',
    'ชื่อลูกค้า',
    '0-30 วัน',
    '31-60 วัน',
    '61-90 วัน',
    'มากกว่า 90 วัน',
    'รวมทั้งสิ้น',
    '% ของทั้งหมด',
  ])

  // Data rows
  for (const customer of data.customers) {
    const percentage = calculatePercentage(customer.total, data.totals.total)
    rows.push([
      customer.customerCode,
      customer.customerName,
      customer.current,
      customer.days30,
      customer.days60,
      customer.days90,
      customer.over90,
      customer.total,
      percentage,
    ])
  }

  // Total row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    data.totals.current,
    data.totals.days30,
    data.totals.days60,
    data.totals.days90,
    data.totals.over90,
    data.totals.total,
    1.0,
  ])

  // Summary row
  rows.push([])
  rows.push(['', 'สรุป', '', '', '', '', '', ''])
  rows.push(['', 'วันที่อ้างอิง', formatDateThai(data.asOfDate), '', '', '', '', ''])
  rows.push(['', 'จำนวนลูกค้าทั้งหมด', data.customers.length, '', '', '', '', ''])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Customer Code
    { wch: 40 }, // Customer Name
    { wch: 12 }, // 0-30 days
    { wch: 12 }, // 31-60 days
    { wch: 12 }, // 61-90 days
    { wch: 15 }, // Over 90 days
    { wch: 15 }, // Total
    { wch: 12 }, // Percentage
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 1; row <= range.e.r; row++) {
    // Style header row
    if (row === 0) {
      for (let col = 0; col <= 7; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
      continue
    }

    // Apply currency format to amount columns (C to H)
    for (let col = 2; col <= 7; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cell] && typeof worksheet[cell].v === 'number') {
        if (col === 7) {
          // Percentage column
          worksheet[cell].z = '0.00%'
          worksheet[cell].s = STYLES.PERCENTAGE
        } else {
          // Currency columns
          worksheet[cell].z = '฿#,##0.00'
          worksheet[cell].s = STYLES.CURRENCY
        }
      }
    }

    // Style total row
    const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[nameCell] && worksheet[nameCell].v === 'รวมทั้งสิ้น') {
      for (let col = 0; col <= 7; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cell]) {
          worksheet[cell].s = STYLES.TOTAL_ROW
        }
      }
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ลูกหนี้คงเหลือ')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// AP Aging Export
// ============================================================================

export async function generateAPAgingExcel(data: APAgingData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows
  const rows: any[][] = []

  // Header
  rows.push([
    'รหัสเจ้าหนี้',
    'ชื่อเจ้าหนี้',
    '0-30 วัน',
    '31-60 วัน',
    '61-90 วัน',
    'มากกว่า 90 วัน',
    'รวมทั้งสิ้น',
    '% ของทั้งหมด',
  ])

  // Data rows
  for (const vendor of data.vendors) {
    const percentage = calculatePercentage(vendor.total, data.totals.total)
    rows.push([
      vendor.vendorCode,
      vendor.vendorName,
      vendor.current,
      vendor.days30,
      vendor.days60,
      vendor.days90,
      vendor.over90,
      vendor.total,
      percentage,
    ])
  }

  // Total row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    data.totals.current,
    data.totals.days30,
    data.totals.days60,
    data.totals.days90,
    data.totals.over90,
    data.totals.total,
    1.0,
  ])

  // Summary row
  rows.push([])
  rows.push(['', 'สรุป', '', '', '', '', '', ''])
  rows.push(['', 'วันที่อ้างอิง', formatDateThai(data.asOfDate), '', '', '', '', ''])
  rows.push(['', 'จำนวนเจ้าหนี้ทั้งหมด', data.vendors.length, '', '', '', '', ''])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 15 }, // Vendor Code
    { wch: 40 }, // Vendor Name
    { wch: 12 }, // 0-30 days
    { wch: 12 }, // 31-60 days
    { wch: 12 }, // 61-90 days
    { wch: 15 }, // Over 90 days
    { wch: 15 }, // Total
    { wch: 12 }, // Percentage
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 1; row <= range.e.r; row++) {
    // Style header row
    if (row === 0) {
      for (let col = 0; col <= 7; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
      continue
    }

    // Apply currency format to amount columns (C to H)
    for (let col = 2; col <= 7; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cell] && typeof worksheet[cell].v === 'number') {
        if (col === 7) {
          // Percentage column
          worksheet[cell].z = '0.00%'
          worksheet[cell].s = STYLES.PERCENTAGE
        } else {
          // Currency columns
          worksheet[cell].z = '฿#,##0.00'
          worksheet[cell].s = STYLES.CURRENCY
        }
      }
    }

    // Style total row
    const nameCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[nameCell] && worksheet[nameCell].v === 'รวมทั้งสิ้น') {
      for (let col = 0; col <= 7; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cell]) {
          worksheet[cell].s = STYLES.TOTAL_ROW
        }
      }
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: worksheet['!ref'] }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'เจ้าหนี้คงเหลือ')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// VAT Report Export (PP30 format)
// ============================================================================

export async function generateVATReportExcel(data: VATReportData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Prepare rows for monthly data
  const rows: any[][] = []

  // Header
  rows.push(['เดือน', 'ภาษีขาย', 'ภาษีซื้อ', 'ภาษีที่ต้องชำระ'])

  // Monthly data rows
  for (const monthData of data.monthlyData) {
    rows.push([
      monthData.monthNameTh,
      monthData.salesVat,
      monthData.purchaseVat,
      monthData.payableVat,
    ])
  }

  // YTD Total row
  rows.push([
    '',
    data.ytdTotals.salesVat,
    data.ytdTotals.purchaseVat,
    data.ytdTotals.payableVat,
  ])

  // Summary
  rows.push([])
  rows.push(['', 'สรุป', '', '', ''])
  rows.push(['', 'ปีภาษี', data.year, '', '', ''])
  rows.push([
    '',
    'ภาษีขายรวมทั้งปี',
    data.ytdTotals.salesVat,
    '',
    '',
    '',
  ])
  rows.push([
    '',
    'ภาษีซื้อรวมทั้งปี',
    data.ytdTotals.purchaseVat,
    '',
    '',
    '',
  ])
  rows.push([
    '',
    'ภาษีที่ต้องชำระรวมทั้งปี',
    data.ytdTotals.payableVat,
    '',
    '',
    '',
  ])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Month
    { wch: 20 }, // Sales VAT
    { wch: 20 }, // Purchase VAT
    { wch: 20 }, // Payable VAT
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')
  for (let row = 0; row <= range.e.r; row++) {
    // Style header row
    if (row === 0) {
      for (let col = 0; col <= 3; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 0, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
      continue
    }

    // Apply currency format to amount columns (B to D)
    for (let col = 1; col <= 3; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cell] && typeof worksheet[cell].v === 'number') {
        worksheet[cell].z = '฿#,##0.00'
        worksheet[cell].s = STYLES.CURRENCY
      }
    }

    // Style total row
    const monthCell = XLSX.utils.encode_cell({ r: row, c: 0 })
    if (worksheet[monthCell] && worksheet[monthCell].v === '') {
      // This could be the YTD total row (first empty month cell)
      const labelCell = XLSX.utils.encode_cell({ r: row, c: 1 })
      if (worksheet[labelCell] && typeof worksheet[labelCell].v === 'number') {
        // This is the YTD total row
        for (let col = 0; col <= 3; col++) {
          const cell = XLSX.utils.encode_cell({ r: row, c: col })
          if (worksheet[cell]) {
            worksheet[cell].s = STYLES.TOTAL_ROW
          }
        }
      }
    }

    // Style summary section
    const labelCell2 = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[labelCell2] && typeof worksheet[labelCell2].v === 'string') {
      const value = worksheet[labelCell2].v as string
      if (value === 'สรุป' || value.includes('รวมทั้งปี')) {
        worksheet[labelCell2].s = { bold: true, fontSize: 11 }
      }
    }
  }

  // Freeze header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1 }

  // Add auto-filter
  if (worksheet['!ref']) {
    worksheet['!autofilter'] = { ref: 'A1:D' + (data.monthlyData.length + 1) }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ภาษีมูลค่าเพิ่ม (PP30)')

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// WHT Report Export (PND3/PND53 format)
// ============================================================================

export async function generateWHTReportExcel(data: WHTReportData): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Form type name
  const formTypeName = data.formType === 'PND3' ? 'ภงด.3 (เงินเดือน)' : 'ภงด.53 (ค่าบริการ/ค่าเช่า)'

  // Prepare rows
  const rows: any[][] = []

  // Header info
  rows.push([`รายงานภาษีหัก ณ ที่จ่าย ${formTypeName}`])
  rows.push([`ปีงบประมาณ: ${data.year}`])
  rows.push([`เดือน: ${formatMonthThai(parseInt(data.month))}`])
  rows.push([])

  // Table header
  rows.push([
    'วันที่',
    'รายการ',
    'เลขประจำตัวผู้เสียภาษี',
    'จำนวนเงิน',
    'อัตราภาษี (%)',
    'ภาษีหัก ณ ที่จ่าย',
    'จ่ายสุทธิ',
  ])

  // Data rows
  for (const entry of data.entries) {
    rows.push([
      entry.date,
      entry.description,
      entry.taxId,
      entry.amount,
      entry.taxRate,
      entry.withholdingTax,
      entry.netPayment,
    ])
  }

  // Total row
  rows.push([
    '',
    'รวมทั้งสิ้น',
    '',
    data.totals.grossAmount,
    '',
    data.totals.withholdingTax,
    data.totals.netPayment,
  ])

  // Summary
  rows.push([])
  rows.push(['', 'สรุป', '', '', '', '', ''])
  rows.push(['', 'จำนวนรายการ', data.entries.length, '', '', '', ''])
  rows.push(['', 'ยอดเงินรวม', data.totals.grossAmount, '', '', '', ''])
  rows.push(['', 'ภาษีหัก ณ ที่จ่ายรวม', data.totals.withholdingTax, '', '', '', ''])
  rows.push(['', 'จ่ายสุทธิรวม', data.totals.netPayment, '', '', '', ''])

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(rows)

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 40 }, // Description
    { wch: 20 }, // Tax ID
    { wch: 15 }, // Amount
    { wch: 12 }, // Tax Rate
    { wch: 15 }, // Withholding Tax
    { wch: 15 }, // Net Payment
  ]

  // Apply formatting
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1')

  // Merge header cells for title
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
  ]

  for (let row = 0; row <= range.e.r; row++) {
    // Style title rows
    if (row < 4) {
      for (let col = 0; col <= 6; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cell]) {
          if (row === 0) {
            worksheet[cell].s = { bold: true, fontSize: 14, hAlign: 'center' as const }
          } else if (row < 3) {
            worksheet[cell].s = { fontSize: 11, hAlign: 'center' as const }
          }
        }
      }
      continue
    }

    // Style table header
    if (row === 4) {
      for (let col = 0; col <= 6; col++) {
        const headerCell = XLSX.utils.encode_cell({ r: 4, c: col })
        if (worksheet[headerCell]) {
          worksheet[headerCell].s = STYLES.HEADER
        }
      }
      continue
    }

    // Apply currency/number formatting to data rows
    // Amount column (D), Tax Rate column (E), WHT column (F), Net Payment column (G)
    for (let col = 3; col <= 6; col++) {
      const cell = XLSX.utils.encode_cell({ r: row, c: col })
      if (worksheet[cell] && typeof worksheet[cell].v === 'number') {
        if (col === 4) {
          // Tax rate percentage
          worksheet[cell].z = '0.00'
          worksheet[cell].s = STYLES.NUMBER
        } else {
          // Currency columns
          worksheet[cell].z = '฿#,##0.00'
          worksheet[cell].s = STYLES.CURRENCY
        }
      }
    }

    // Style total row
    const descCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[descCell] && worksheet[descCell].v === 'รวมทั้งสิ้น') {
      for (let col = 0; col <= 6; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col })
        if (worksheet[cell]) {
          worksheet[cell].s = STYLES.TOTAL_ROW
        }
      }
    }

    // Style summary section
    const labelCell = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (worksheet[labelCell] && typeof worksheet[labelCell].v === 'string') {
      const value = worksheet[labelCell].v as string
      if (value === 'สรุป' || value.includes('รวม')) {
        worksheet[labelCell].s = { bold: true, fontSize: 11 }
      }
    }
  }

  // Freeze table header row
  worksheet['!freeze'] = { xSplit: 0, ySplit: 5 }

  // Add auto-filter to data table
  const dataRowCount = data.entries.length
  if (dataRowCount > 0) {
    worksheet['!autofilter'] = { ref: `A5:G${5 + dataRowCount}` }
  }

  // Add to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, data.formType)

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// ============================================================================
// Multi-Sheet Export (Combined Reports)
// ============================================================================

export async function generateCombinedReportsExcel(params: {
  trialBalance?: TrialBalanceReportData
  incomeStatement?: IncomeStatementData
  balanceSheet?: BalanceSheetData
}): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Add Trial Balance if provided
  if (params.trialBalance) {
    const tbBuffer = await generateTrialBalanceExcel(params.trialBalance)
    const tbWorkbook = XLSX.read(tbBuffer, { type: 'buffer' })
    const tbWorksheet = tbWorkbook.Sheets[tbWorkbook.SheetNames[0]]
    XLSX.utils.book_append_sheet(workbook, tbWorksheet, 'งบทดลอง')
  }

  // Add Income Statement if provided
  if (params.incomeStatement) {
    const isBuffer = await generateIncomeStatementExcel(params.incomeStatement)
    const isWorkbook = XLSX.read(isBuffer, { type: 'buffer' })
    const isWorksheet = isWorkbook.Sheets[isWorkbook.SheetNames[0]]
    XLSX.utils.book_append_sheet(workbook, isWorksheet, 'งบกำไรขาดทุน')
  }

  // Add Balance Sheet if provided
  if (params.balanceSheet) {
    const bsBuffer = await generateBalanceSheetExcel(params.balanceSheet)
    const bsWorkbook = XLSX.read(bsBuffer, { type: 'buffer' })
    const bsWorksheet = bsWorkbook.Sheets[bsWorkbook.SheetNames[0]]
    XLSX.utils.book_append_sheet(workbook, bsWorksheet, 'งบดุล')
  }

  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

  return buffer as Buffer
}

// Stub function for generating Excel buffer from workbook data
export async function generateExcelBuffer(workbookData: {
  sheets: Array<{
    name: string
    data: unknown[][]
  }>
}): Promise<Buffer> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  
  workbookData.sheets.forEach(sheet => {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.data)
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
  })
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}
