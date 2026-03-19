import { db } from "@/lib/db"
import { requireAuth, apiResponse, apiError, unauthorizedError, generateDocNumber } from "@/lib/api-utils"
import { z } from "zod"

// Validation schema
const paymentAllocationSchema = z.object({
  invoiceId: z.string().min(1, "กรุณาเลือกใบซื้อ"),
  amount: z.number().min(0, "จำนวนเงินต้องไม่น้อยกว่า 0"),
  whtRate: z.number().min(0).max(100).default(0),
  whtAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
})

const paymentSchema = z.object({
  vendorId: z.string().min(1, "กรุณาเลือกผู้ขาย"),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.enum(["CASH", "TRANSFER", "CHEQUE", "CREDIT", "OTHER"]),
  bankAccountId: z.string().optional(),
  chequeNo: z.string().optional(),
  chequeDate: z.string().or(z.date()).optional(),
  amount: z.number().min(0, "จำนวนเงินต้องไม่น้อยกว่า 0"),
  whtAmount: z.number().min(0).default(0),
  unallocated: z.number().min(0).default(0),
  notes: z.string().optional(),
  allocations: z.array(paymentAllocationSchema).min(1, "ต้องมีการจัดจ่ายอย่างน้อย 1 รายการ"),
  status: z.enum(["DRAFT", "POSTED"]).default("DRAFT"),
})

// GET /api/payments - List payments
export async function GET(request: Request) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "20"))
    const status = searchParams.get("status")
    const vendorId = searchParams.get("vendorId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const search = searchParams.get("search")

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    if (startDate || endDate) {
      where.paymentDate = {}
      if (startDate) where.paymentDate.gte = new Date(startDate)
      if (endDate) where.paymentDate.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { paymentNo: { contains: search } },
        { vendor: { name: { contains: search } } },
      ]
    }

    const [payments, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { paymentDate: "desc" },
        skip,
        take: limit,
        include: {
          vendor: {
            select: { id: true, code: true, name: true, taxId: true }
          },
          bankAccount: {
            select: { id: true, code: true, bankName: true, accountNumber: true }
          },
          allocations: {
            include: {
              invoice: {
                select: { id: true, invoiceNo: true, invoiceDate: true, totalAmount: true }
              }
            }
          }
        }
      }),
      db.payment.count({ where })
    ])

    return apiResponse({
      success: true,
      data: payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    return apiError("เกิดข้อผิดพลาดในการดึงข้อมูลใบจ่ายเงิน")
  }
}

// POST /api/payments - Create payment
export async function POST(request: Request) {
  try {
    const user = await requireAuth()

    if (user.role === "VIEWER") {
      return apiError("ไม่มีสิทธิ์สร้างใบจ่ายเงิน", 403)
    }

    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    // Verify vendor exists
    const vendor = await db.vendor.findUnique({
      where: { id: validatedData.vendorId }
    })

    if (!vendor) {
      return apiError("ไม่พบผู้ขาย")
    }

    // Verify bank account if transfer/cheque
    if ((validatedData.paymentMethod === "TRANSFER" || validatedData.paymentMethod === "CHEQUE") && validatedData.bankAccountId) {
      const bankAccount = await db.bankAccount.findUnique({
        where: { id: validatedData.bankAccountId }
      })
      if (!bankAccount) {
        return apiError("ไม่พบบัญชีธนาคาร")
      }
    }

    // Verify all invoices exist and belong to vendor
    const invoiceIds = validatedData.allocations.map(a => a.invoiceId)
    const invoices = await db.purchaseInvoice.findMany({
      where: {
        id: { in: invoiceIds },
        vendorId: validatedData.vendorId
      }
    })

    if (invoices.length !== invoiceIds.length) {
      return apiError("ไม่พบใบซื้อบางรายการ หรือใบซื้อไม่ใช่ของผู้ขายรายนี้")
    }

    // Calculate totals
    const totalAllocated = validatedData.allocations.reduce((sum, a) => sum + a.amount, 0)
    const totalWHT = validatedData.allocations.reduce((sum, a) => sum + a.whtAmount, 0)

    // Validate total amount
    if (validatedData.amount < totalAllocated) {
      return apiError("ยอดจ่ายรวมต้องไม่น้อยกว่ายอดจัดจ่าย")
    }

    // Generate payment number
    const paymentNo = await generateDocNumber("PAYMENT", "PAY")

    // Create payment with allocations
    const payment = await db.payment.create({
      data: {
        paymentNo,
        paymentDate: new Date(validatedData.paymentDate),
        vendorId: validatedData.vendorId,
        paymentMethod: validatedData.paymentMethod,
        bankAccountId: validatedData.bankAccountId,
        chequeNo: validatedData.chequeNo,
        chequeDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : null,
        amount: validatedData.amount,
        whtAmount: totalWHT,
        unallocated: validatedData.amount - totalAllocated,
        notes: validatedData.notes,
        status: validatedData.status,
        createdById: user.id,
        allocations: {
          create: validatedData.allocations.map((allocation, index) => ({
            invoiceId: allocation.invoiceId,
            amount: allocation.amount,
            whtRate: allocation.whtRate,
            whtAmount: allocation.whtAmount,
            notes: allocation.notes,
          }))
        }
      },
      include: {
        vendor: true,
        allocations: {
          include: {
            invoice: true
          }
        }
      }
    })

    // Create cheque record if payment by cheque
    if (validatedData.paymentMethod === "CHEQUE" && validatedData.chequeNo) {
      const bankAccount = validatedData.bankAccountId
        ? await db.bankAccount.findUnique({ where: { id: validatedData.bankAccountId } })
        : null

      await db.cheque.create({
        data: {
          chequeNo: validatedData.chequeNo,
          type: "PAY",
          bankAccountId: validatedData.bankAccountId || "",
          dueDate: validatedData.chequeDate ? new Date(validatedData.chequeDate) : new Date(validatedData.paymentDate),
          amount: validatedData.amount,
          payeeName: vendor.name,
          status: "ON_HAND",
          documentRef: paymentNo,
          paymentId: payment.id,
        }
      })
    }

    // If POSTED, create journal entry
    if (validatedData.status === "POSTED") {
      await postPaymentToGL(payment)
    }

    return apiResponse(payment, 201)
  } catch (error) {
    if (error instanceof Error && error.message.includes("ไม่ได้รับอนุญาต")) {
      return unauthorizedError()
    }
    if (error instanceof Error && error.name === "ZodError") {
      return apiError("ข้อมูลไม่ถูกต้อง: " + error.message)
    }
    console.error("Payment creation error:", error)
    return apiError("เกิดข้อผิดพลาดในการสร้างใบจ่ายเงิน")
  }
}

// Post payment to General Ledger
async function postPaymentToGL(payment: any) {
  // Get AP account (2120 - เจ้าหนี้การค้า)
  const apAccount = await db.chartOfAccount.findFirst({
    where: { code: "2120" }
  })

  // Get cash/bank account based on payment method
  let cashAccountId: string | null = null
  if (payment.paymentMethod === "CASH") {
    const cashAccount = await db.chartOfAccount.findFirst({
      where: { code: "1110" } // เงินสด
    })
    cashAccountId = cashAccount?.id || null
  } else if (payment.bankAccountId) {
    const bankAccount = await db.bankAccount.findUnique({
      where: { id: payment.bankAccountId },
      include: { chartOfAccount: true }
    })
    // BankAccount should reference GL account
    const bankGlAccount = await db.chartOfAccount.findFirst({
      where: { code: { startsWith: "112" } } // เงินฝากธนาคาร
    })
    cashAccountId = bankGlAccount?.id || null
  }

  // Get WHT receivable account
  const whtAccount = await db.chartOfAccount.findFirst({
    where: { code: "2130" } // ภาษีหัก ณ ที่จ่าย
  })

  if (!apAccount) {
    throw new Error("ไม่พบบัญชีเจ้าหนี้การค้า (2120)")
  }

  // Create journal entry lines
  const lines: any[] = []

  // Debit: AP (reduce liability)
  for (const allocation of payment.allocations) {
    lines.push({
      accountId: apAccount!.id,
      description: `จ่ายเงินเจ้าหนี้ ${payment.vendor.name} ใบซื้อ ${allocation.invoice.invoiceNo}`,
      debit: allocation.amount + allocation.whtAmount,
      credit: 0,
      reference: payment.paymentNo,
    })
  }

  // Credit: Cash/Bank
  if (cashAccountId) {
    lines.push({
      accountId: cashAccountId,
      description: `จ่ายเงินเจ้าหนี้ ${payment.vendor.name}`,
      debit: 0,
      credit: payment.amount - payment.unallocated,
      reference: payment.paymentNo,
    })
  }

  // Credit: Unallocated (vendor credit)
  if (payment.unallocated > 0) {
    lines.push({
      accountId: apAccount.id,
      description: `เครดิตเจ้าหนี้ ${payment.vendor.name}`,
      debit: 0,
      credit: payment.unallocated,
      reference: payment.paymentNo,
    })
  }

  // Credit: WHT (if any)
  if (payment.whtAmount > 0 && whtAccount) {
    lines.push({
      accountId: whtAccount.id,
      description: `ภาษีหัก ณ ที่จ่าย ${payment.vendor.name}`,
      debit: 0,
      credit: payment.whtAmount,
      reference: payment.paymentNo,
    })
  }

  // Create journal entry
  const journalEntry = await db.journalEntry.create({
    data: {
      date: payment.paymentDate,
      description: `ใบจ่ายเงิน ${payment.paymentNo} - ${payment.vendor.name}`,
      reference: payment.paymentNo,
      documentType: "PAYMENT",
      documentId: payment.id,
      totalDebit: lines.reduce((sum, l) => sum + l.debit, 0),
      totalCredit: lines.reduce((sum, l) => sum + l.credit, 0),
      status: "POSTED",
      lines: {
        create: lines.map((line, index) => ({
          ...line,
          lineNo: index + 1,
        }))
      }
    }
  })

  // Update payment with journal entry ID
  await db.payment.update({
    where: { id: payment.id },
    data: { journalEntryId: journalEntry.id }
  })

  // Update invoice balances
  for (const allocation of payment.allocations) {
    await db.purchaseInvoice.update({
      where: { id: allocation.invoiceId },
      data: {
        paidAmount: {
          increment: allocation.amount
        }
      }
    })
  }

  return journalEntry
}
