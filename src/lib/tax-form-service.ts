// B3. Tax Form Service
// บริการแบบฟอร์มภาษี

import { prisma } from "@/lib/db"
import type { TaxForm, TaxFormLine, TaxFormType, TaxFormStatus } from "@prisma/client"
import { generatePDF } from "./pdf-generator"
import { generateExcelBuffer } from "./excel-export"

// PND3 Income Types (ประเภทเงินได้ ภงด.3)
const PND3_INCOME_TYPES = [
  { code: "1", name: "เงินเดือน ค่าจ้าง เบี้ยเลี้ยง โบนัส", rate: 5 },
  { code: "2", name: "ค่านายหน้า ค่าแห่งกำไร", rate: 5 },
  { code: "3", name: "ค่าดอกเบี้ย", rate: 15 },
  { code: "4", name: "ค่าปันผล เงินส่วนแบ่งกำไร", rate: 10 },
  { code: "5", name: "ค่าเช่าทรัพย์สิน", rate: 5 },
]

// PND53 Income Types (ประเภทเงินได้ ภงด.53)
const PND53_INCOME_TYPES = [
  { code: "1", name: "ค่าบริการ", rate: 3 },
  { code: "2", name: "ค่าเช่าอาคาร ที่ดิน สิ่งปลูกสร้าง", rate: 5 },
  { code: "3", name: "ค่าส่งออกสินค้า", rate: 0.5 },
  { code: "4", name: "ค่าจ้างทำของ จ้างเหมา", rate: 1 },
  { code: "5", name: "ค่าโฆษณา", rate: 2 },
  { code: "6", name: "ค่าบริการวิชาชีพอิสระ (บัญชี กฎหมาย สถาปัตย์)", rate: 3 },
]

/**
 * Generate PND3 Tax Form
 * สร้างแบบฟอร์ม ภงด.3
 */
export async function generatePND3(
  month: number,
  year: number,
  createdBy?: string
): Promise<TaxForm> {
  // Get all withholding tax records for PND3 type
  const whtRecords = await prisma.withholdingTax.findMany({
    where: {
      type: "PND3",
      taxMonth: month,
      taxYear: year,
    },
  })

  const totalAmount = whtRecords.reduce((sum, r) => sum + r.incomeAmount, 0)
  const totalTax = whtRecords.reduce((sum, r) => sum + r.whtAmount, 0)

  // Delete existing draft if exists
  await prisma.taxFormLine.deleteMany({
    where: {
      taxForm: {
        formType: "PND3",
        month,
        year,
        status: "DRAFT",
      },
    },
  })
  await prisma.taxForm.deleteMany({
    where: {
      formType: "PND3",
      month,
      year,
      status: "DRAFT",
    },
  })

  // Create tax form
  const taxForm = await prisma.taxForm.create({
    data: {
      formType: "PND3",
      month,
      year,
      status: "DRAFT",
      totalAmount,
      totalTax,
      lines: {
        create: whtRecords.map((record, index) => ({
          lineNo: index + 1,
          payeeId: record.payeeId,
          payeeName: record.payeeName,
          payeeTaxId: record.payeeTaxId,
          payeeAddress: record.payeeAddress,
          description: record.description || "",
          incomeType: record.incomeType || "1",
          incomeAmount: record.incomeAmount,
          taxRate: record.whtRate,
          taxAmount: record.whtAmount,
          documentRef: record.documentNo,
        })),
      },
    },
    include: { lines: true },
  })

  return taxForm
}

/**
 * Generate PND53 Tax Form
 * สร้างแบบฟอร์ม ภงด.53
 */
export async function generatePND53(
  month: number,
  year: number,
  createdBy?: string
): Promise<TaxForm> {
  // Get all withholding tax records for PND53 type
  const whtRecords = await prisma.withholdingTax.findMany({
    where: {
      type: "PND53",
      taxMonth: month,
      taxYear: year,
    },
  })

  const totalAmount = whtRecords.reduce((sum, r) => sum + r.incomeAmount, 0)
  const totalTax = whtRecords.reduce((sum, r) => sum + r.whtAmount, 0)

  // Delete existing draft if exists
  await prisma.taxFormLine.deleteMany({
    where: {
      taxForm: {
        formType: "PND53",
        month,
        year,
        status: "DRAFT",
      },
    },
  })
  await prisma.taxForm.deleteMany({
    where: {
      formType: "PND53",
      month,
      year,
      status: "DRAFT",
    },
  })

  // Create tax form
  const taxForm = await prisma.taxForm.create({
    data: {
      formType: "PND53",
      month,
      year,
      status: "DRAFT",
      totalAmount,
      totalTax,
      lines: {
        create: whtRecords.map((record, index) => ({
          lineNo: index + 1,
          payeeId: record.payeeId,
          payeeName: record.payeeName,
          payeeTaxId: record.payeeTaxId,
          payeeAddress: record.payeeAddress,
          description: record.description || "",
          incomeType: record.incomeType || "1",
          incomeAmount: record.incomeAmount,
          taxRate: record.whtRate,
          taxAmount: record.whtAmount,
          documentRef: record.documentNo,
        })),
      },
    },
    include: { lines: true },
  })

  return taxForm
}

/**
 * Generate PP30 (VAT Return) Tax Form
 * สร้างแบบฟอร์ม ภ.พ.30 (ภาษีมูลค่าเพิ่ม)
 */
export async function generatePP30(
  month: number,
  year: number,
  createdBy?: string
): Promise<TaxForm> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  // Get VAT records
  const vatRecords = await prisma.vatRecord.findMany({
    where: {
      taxMonth: month,
      taxYear: year,
    },
  })

  const outputVat = vatRecords
    .filter((r) => r.type === "OUTPUT")
    .reduce((sum, r) => sum + r.vatAmount, 0)

  const inputVat = vatRecords
    .filter((r) => r.type === "INPUT")
    .reduce((sum, r) => sum + r.vatAmount, 0)

  const totalAmount = vatRecords.reduce((sum, r) => sum + r.totalAmount, 0)
  const totalTax = outputVat - inputVat // Net VAT payable

  // Delete existing draft if exists
  await prisma.taxFormLine.deleteMany({
    where: {
      taxForm: {
        formType: "PP30",
        month,
        year,
        status: "DRAFT",
      },
    },
  })
  await prisma.taxForm.deleteMany({
    where: {
      formType: "PP30",
      month,
      year,
      status: "DRAFT",
    },
  })

  // Create tax form with summary lines
  const taxForm = await prisma.taxForm.create({
    data: {
      formType: "PP30",
      month,
      year,
      status: "DRAFT",
      totalAmount,
      totalTax,
      lines: {
        create: [
          {
            lineNo: 1,
            payeeName: "ภาษีขาย (Output VAT)",
            description: `ภาษีขายเดือน ${month}/${year}`,
            incomeType: "OUTPUT",
            incomeAmount: outputVat,
            taxRate: 7,
            taxAmount: outputVat,
          },
          {
            lineNo: 2,
            payeeName: "ภาษีซื้อ (Input VAT)",
            description: `ภาษีซื้อเดือน ${month}/${year}`,
            incomeType: "INPUT",
            incomeAmount: inputVat,
            taxRate: 7,
            taxAmount: inputVat,
          },
          {
            lineNo: 3,
            payeeName: "ภาษีสุทธิ (Net VAT)",
            description: `ภาษีที่ต้องชำระ/ขอคืน`,
            incomeType: "NET",
            incomeAmount: totalTax,
            taxRate: 0,
            taxAmount: totalTax,
          },
        ],
      },
    },
    include: { lines: true },
  })

  return taxForm
}

/**
 * Submit tax form
 * ส่งแบบฟอร์มภาษี
 */
export async function submitTaxForm(
  taxFormId: string,
  submittedBy: string
): Promise<TaxForm> {
  return prisma.taxForm.update({
    where: { id: taxFormId },
    data: {
      status: "SUBMITTED",
      submittedBy,
      submittedAt: new Date(),
    },
  })
}

/**
 * Mark tax form as filed
 * บันทึกการยื่นแบบภาษี
 */
export async function fileTaxForm(
  taxFormId: string,
  filingDate: Date,
  receiptNo?: string
): Promise<TaxForm> {
  return prisma.taxForm.update({
    where: { id: taxFormId },
    data: {
      status: "FILED",
      filingDate,
      receiptNo,
    },
  })
}

/**
 * Export tax form to PDF
 * ส่งออกแบบฟอร์มภาษีเป็น PDF
 */
export async function exportTaxFormToPDF(taxFormId: string): Promise<Uint8Array> {
  const taxForm = await prisma.taxForm.findUnique({
    where: { id: taxFormId },
    include: { lines: true },
  })

  if (!taxForm) {
    throw new Error("ไม่พบแบบฟอร์มภาษี")
  }

  const company = await prisma.company.findFirst()

  const formTypeNames: Record<string, string> = {
    PND3: "ภ.ง.ด. 3",
    PND53: "ภ.ง.ด. 53",
    PP30: "ภ.พ. 30",
  }

  const content = {
    formType: formTypeNames[taxForm.formType],
    companyName: company?.name || "",
    taxId: company?.taxId || "",
    month: taxForm.month,
    year: taxForm.year,
    totalAmount: taxForm.totalAmount,
    totalTax: taxForm.totalTax,
    lines: taxForm.lines.map((line) => ({
      lineNo: line.lineNo,
      payeeName: line.payeeName,
      payeeTaxId: line.payeeTaxId,
      description: line.description,
      incomeAmount: line.incomeAmount,
      taxRate: line.taxRate,
      taxAmount: line.taxAmount,
    })),
  }

  return generatePDF({
    type: "tax-form",
    content,
    title: `${formTypeNames[taxForm.formType]} เดือน ${taxForm.month}/${taxForm.year}`,
  })
}

/**
 * Export tax form to Excel
 * ส่งออกแบบฟอร์มภาษีเป็น Excel
 */
export async function exportTaxFormToExcel(taxFormId: string): Promise<Buffer> {
  const taxForm = await prisma.taxForm.findUnique({
    where: { id: taxFormId },
    include: { lines: true },
  })

  if (!taxForm) {
    throw new Error("ไม่พบแบบฟอร์มภาษี")
  }

  const company = await prisma.company.findFirst()

  const formTypeNames: Record<string, string> = {
    PND3: "ภ.ง.ด. 3",
    PND53: "ภ.ง.ด. 53",
    PP30: "ภ.พ. 30",
  }

  // Create workbook with multiple sheets
  const workbookData = {
    sheets: [
      {
        name: "ข้อมูลทั่วไป",
        data: [
          ["แบบฟอร์มภาษี", formTypeNames[taxForm.formType]],
          ["บริษัท", company?.name || ""],
          ["เลขประจำตัวผู้เสียภาษี", company?.taxId || ""],
          ["เดือน", taxForm.month],
          ["ปี", taxForm.year],
          ["สถานะ", taxForm.status],
          ["", ""],
          ["มูลค่ารวม", taxForm.totalAmount / 100],
          ["ภาษีรวม", taxForm.totalTax / 100],
        ],
      },
      {
        name: "รายละเอียด",
        data: [
          [
            "ลำดับ",
            "ผู้ถูกหักภาษี",
            "เลขประจำตัวผู้เสียภาษี",
            "รายการ",
            "มูลค่า",
            "อัตราภาษี",
            "ภาษี",
          ],
          ...taxForm.lines.map((line) => [
            line.lineNo,
            line.payeeName,
            line.payeeTaxId || "",
            line.description,
            line.incomeAmount / 100,
            line.taxRate,
            line.taxAmount / 100,
          ]),
        ],
      },
    ],
  }

  return generateExcelBuffer(workbookData)
}

/**
 * Get tax form summary for dashboard
 * สรุปข้อมูลแบบฟอร์มภาษีสำหรับ Dashboard
 */
export interface TaxFormSummary {
  month: number
  year: number
  forms: Array<{
    type: TaxFormType
    status: TaxFormStatus
    totalAmount: number
    totalTax: number
  }>
  totalsByType: Record<string, { amount: number; tax: number }>
}

export async function getTaxFormSummary(
  year: number,
  month?: number
): Promise<TaxFormSummary[]> {
  const where: { year: number; month?: number } = { year }
  if (month) where.month = month

  const taxForms = await prisma.taxForm.findMany({
    where,
    orderBy: [{ year: "desc" }, { month: "desc" }],
  })

  const summaryMap = new Map<string, TaxFormSummary>()

  for (const form of taxForms) {
    const key = `${form.year}-${form.month}`
    if (!summaryMap.has(key)) {
      summaryMap.set(key, {
        month: form.month,
        year: form.year,
        forms: [],
        totalsByType: {},
      })
    }

    const summary = summaryMap.get(key)!
    summary.forms.push({
      type: form.formType,
      status: form.status,
      totalAmount: form.totalAmount,
      totalTax: form.totalTax,
    })

    if (!summary.totalsByType[form.formType]) {
      summary.totalsByType[form.formType] = { amount: 0, tax: 0 }
    }
    summary.totalsByType[form.formType].amount += form.totalAmount
    summary.totalsByType[form.formType].tax += form.totalTax
  }

  return Array.from(summaryMap.values())
}

/**
 * Get PND3/PND53 income types
 * ดึงประเภทเงินได้สำหรับ ภงด.3/53
 */
export function getIncomeTypes(formType: "PND3" | "PND53"): Array<{
  code: string
  name: string
  rate: number
}> {
  return formType === "PND3" ? PND3_INCOME_TYPES : PND53_INCOME_TYPES
}

/**
 * Validate tax form before submission
 * ตรวจสอบความถูกต้องของแบบฟอร์มก่อนส่ง
 */
export async function validateTaxForm(
  taxFormId: string
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  const taxForm = await prisma.taxForm.findUnique({
    where: { id: taxFormId },
    include: { lines: true },
  })

  if (!taxForm) {
    return { valid: false, errors: ["ไม่พบแบบฟอร์มภาษี"] }
  }

  if (taxForm.lines.length === 0) {
    errors.push("ไม่มีรายการในฟอร์ม")
  }

  // Validate calculations
  const calculatedTotal = taxForm.lines.reduce(
    (sum, line) => sum + line.taxAmount,
    0
  )
  if (calculatedTotal !== taxForm.totalTax) {
    errors.push("ยอดภาษีรวมไม่ถูกต้อง")
  }

  // Validate required fields
  for (const line of taxForm.lines) {
    if (!line.payeeName) {
      errors.push(`รายการที่ ${line.lineNo}: ไม่มีชื่อผู้ถูกหักภาษี`)
    }
    if (line.taxRate <= 0) {
      errors.push(`รายการที่ ${line.lineNo}: อัตราภาษีต้องมากกว่า 0`)
    }
  }

  return { valid: errors.length === 0, errors }
}
