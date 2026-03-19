import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiResponse, apiError, unauthorizedError, forbiddenError, generateDocNumber, calculateInvoiceTotals } from '@/lib/api-utils'
import { AuthError } from '@/lib/api-auth'
import { db } from '@/lib/db'
import { z } from 'zod'

// Wrapper that properly handles auth with request context
async function requireAuthWithRequest(request: NextRequest): Promise<any> {
  // Import the requireAuth that accepts request from api-auth
  const { requireAuth: requireAuthWithReq } = await import('@/lib/api-auth')
  return requireAuthWithReq(request)
}

// Validation schema for credit note line
const creditNoteLineSchema = z.object({
  productId: z.string().optional().nullable(),
  description: z.string().min(1, 'ต้องระบุรายการ'),
  quantity: z.number().positive('จำนวนต้องมากกว่า 0'),
  unit: z.string().default('ชิ้น'),
  unitPrice: z.number().min(0, 'ราคาต้องไม่ติดลบ'),
  discount: z.number().min(0).default(0),
  amount: z.number().min(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
  returnStock: z.boolean().default(false),
})

// Validation schema for credit note
const creditNoteSchema = z.object({
  creditNoteDate: z.string().transform((val) => new Date(val)),
  customerId: z.string().min(1, 'ต้องเลือกลูกค้า'),
  invoiceId: z.string().optional().nullable(),
  reason: z.enum(['RETURN', 'DISCOUNT', 'ALLOWANCE', 'CANCELLATION']).default('RETURN'),
  subtotal: z.number().min(0).default(0),
  vatRate: z.number().min(0).max(100).default(7),
  vatAmount: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  notes: z.string().optional(),
  lines: z.array(creditNoteLineSchema).min(1, 'ต้องมีอย่างน้อย 1 รายการ'),
})

// GET /api/credit-notes - List credit notes
export async function GET(request: NextRequest) {
  try {
    await requireAuthWithRequest(request)

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20'))
    const status = searchParams.get('status')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (startDate || endDate) {
      where.creditNoteDate = {}
      if (startDate) where.creditNoteDate.gte = new Date(startDate)
      if (endDate) where.creditNoteDate.lte = new Date(endDate)
    }

    if (search) {
      where.OR = [
        { creditNoteNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { notes: { contains: search } },
      ]
    }

    // Fetch credit notes without customer first to avoid null relationship errors
    const [creditNotes, total] = await Promise.all([
      db.creditNote.findMany({
        where,
        include: {
          invoice: {
            select: { id: true, invoiceNo: true }
          },
        },
        orderBy: { creditNoteDate: 'desc' },
        skip,
        take: limit,
      }),
      db.creditNote.count({ where }),
    ])

    // Fetch customers separately for credit notes that have them
    const customerIds = creditNotes.map((cn: any) => cn.customerId).filter((id: string) => id != null)
    const customers = customerIds.length > 0
      ? await db.customer.findMany({
          where: {
            id: { in: customerIds }
          },
          select: { id: true, code: true, name: true, taxId: true }
        })
      : []

    // Create a map for quick customer lookup
    const customerMap = new Map(customers.map((c: any) => [c.id, c]))

    // Attach customers to credit notes
    const creditNotesWithCustomers = creditNotes.map((cn: any) => ({
      ...cn,
      customer: cn.customerId ? customerMap.get(cn.customerId) || null : null
    }))

    // Filter out credit notes with null customers (data integrity issue)
    const validCreditNotes = creditNotesWithCustomers.filter((cn: any) => cn.customer !== null)

    // Transform data to match frontend interface (flatten customer.name to customerName)
    const transformedCreditNotes = validCreditNotes.map((cn: any) => {
      try {
        return {
          ...cn,
          customerName: cn.customer?.name || '',
          customerCode: cn.customer?.code || '',
          customerTaxId: cn.customer?.taxId || '',
          creditNoteDate: cn.creditNoteDate ? cn.creditNoteDate.toISOString() : '',
          createdAt: cn.createdAt ? cn.createdAt.toISOString() : '',
          updatedAt: cn.updatedAt ? cn.updatedAt.toISOString() : '',
        }
      } catch (err) {
        console.error('Error transforming credit note:', cn.id, err)
        return {
          ...cn,
          customerName: '',
          customerCode: '',
          customerTaxId: '',
          creditNoteDate: '',
          createdAt: '',
          updatedAt: '',
        }
      }
    })

    return Response.json({
      success: true,
      data: transformedCreditNotes,
      pagination: {
        page,
        limit,
        total: validCreditNotes.length, // Use actual count after filtering
        totalPages: Math.ceil(validCreditNotes.length / limit),
      },
    })
  } catch (error) {
    console.error('Credit Notes API Error:', error)
    if (error instanceof AuthError || (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต'))) {
      return unauthorizedError()
    }
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลใบลดหนี้')
  }
}

// POST /api/credit-notes - Create credit note
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthWithRequest(request)

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์สร้างใบลดหนี้', 403)
    }

    const body = await request.json()
    const validatedData = creditNoteSchema.parse(body)

    // Verify customer exists
    const customer = await db.customer.findUnique({
      where: { id: validatedData.customerId }
    })

    if (!customer) {
      return apiError('ไม่พบลูกค้า')
    }

    // If invoice is provided, verify it exists and belongs to customer
    if (validatedData.invoiceId) {
      const invoice = await db.invoice.findUnique({
        where: { id: validatedData.invoiceId }
      })

      if (!invoice) {
        return apiError('ไม่พบใบกำกับภาษี')
      }

      if (invoice.customerId !== validatedData.customerId) {
        return apiError('ใบกำกับภาษีไม่ตรงกับลูกค้า')
      }
    }

    // Generate credit note number
    const creditNoteNo = await generateDocNumber('CREDIT_NOTE', 'CN')

    // Create credit note with status ISSUED (no draft for credit notes in Thai accounting)
    const creditNote = await db.$transaction(async (tx) => {
      // Get system settings for configurable account IDs
      const settings = await tx.systemSettings.findFirst()

      // Look up required accounts by code
      const [
        salesReturnsAccount,
        vatOutputAccount,
        arAccount
      ] = await Promise.all([
        // Sales Returns and Allowances (4xxx) - Default to '4130'
        tx.chartOfAccount.findFirst({
          where: { code: settings?.salesReturnsAccountId || '4130' }
        }),
        // VAT Output (2xxx) - Default to '2132'
        tx.chartOfAccount.findFirst({
          where: { code: settings?.vatOutputAccountId || '2132' }
        }),
        // Accounts Receivable (1xxx) - Default to '1121'
        tx.chartOfAccount.findFirst({
          where: { code: settings?.arAccountId || '1121' }
        })
      ])

      if (!salesReturnsAccount) {
        throw new Error(`Sales returns account not found: ${settings?.salesReturnsAccountId || '4130'}`)
      }
      if (!vatOutputAccount) {
        throw new Error(`VAT output account not found: ${settings?.vatOutputAccountId || '2132'}`)
      }
      if (!arAccount) {
        throw new Error(`AR account not found: ${settings?.arAccountId || '1121'}`)
      }

      const note = await tx.creditNote.create({
        data: {
          creditNoteNo,
          creditNoteDate: validatedData.creditNoteDate,
          customerId: validatedData.customerId,
          invoiceId: validatedData.invoiceId,
          reason: validatedData.reason,
          subtotal: validatedData.subtotal,
          vatRate: validatedData.vatRate,
          vatAmount: validatedData.vatAmount,
          totalAmount: validatedData.totalAmount,
          status: 'ISSUED',
          notes: validatedData.notes,
        },
        include: {
          customer: true,
          invoice: true,
        },
      })

      // Credit Note Accounting Entry:
      // Debit Sales Returns (4xxx) - Reverse revenue
      // Debit VAT Output (2xxx) - Reverse output VAT
      // Credit Accounts Receivable (11xx) - Reduce customer debt
      const journalEntry = await tx.journalEntry.create({
        data: {
          entryNo: await generateDocNumber('JOURNAL_ENTRY', 'JE'),
          date: validatedData.creditNoteDate,
          description: `ใบลดหนี้ ${creditNoteNo} - ${customer.name}`,
          reference: creditNoteNo,
          documentType: 'CREDIT_NOTE',
          documentId: note.id,
          totalDebit: note.totalAmount,
          totalCredit: note.totalAmount,
          status: 'POSTED',
          lines: {
            create: [
              {
                lineNo: 1,
                accountId: salesReturnsAccount.id,
                description: `คืนสินค้า/ลดหนี้ ${creditNoteNo}`,
                debit: validatedData.subtotal,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: vatOutputAccount.id,
                description: `VAT ใบลดหนี้ ${creditNoteNo}`,
                debit: validatedData.vatAmount,
                credit: 0,
              },
              {
                lineNo: 3,
                accountId: arAccount.id,
                description: `ลดหนี้ลูกค้า ${customer.name}`,
                debit: 0,
                credit: note.totalAmount,
              },
            ],
          },
        },
      })

      // Update credit note with journal entry ID
      await tx.creditNote.update({
        where: { id: note.id },
        data: { journalEntryId: journalEntry.id }
      })

      return note
    })

    // ✅ OPTIMIZED: Handle stock returns in batch (outside transaction)
    // Filter lines that need stock return
    const returnLines = validatedData.lines.filter(line => line.returnStock && line.productId)

    if (returnLines.length > 0) {
      try {
        // Get or create default warehouse ONCE (not in loop)
        let warehouse = await db.warehouse.findFirst({
          where: { type: 'MAIN', isActive: true }
        })

        if (!warehouse) {
          warehouse = await db.warehouse.create({
            data: {
              code: 'WH-MAIN',
              name: 'คลังสินค้าหลัก',
              type: 'MAIN',
              location: 'หลัก',
              isActive: true
            }
          })
        }

        // Batch create all stock movements in parallel
        await Promise.all(returnLines.map(line =>
          db.stockMovement.create({
            data: {
              productId: line.productId!,
              warehouseId: warehouse.id,
              type: 'RETURN',
              quantity: line.quantity,
              unitCost: line.unitPrice,
              totalCost: line.quantity * line.unitPrice,
              date: validatedData.creditNoteDate,
              referenceId: creditNote.id,
              referenceNo: creditNoteNo,
              notes: `คืนสินค้าจากใบลดหนี้ ${creditNoteNo}`,
              sourceChannel: 'CREDIT_NOTE',
            }
          })
        ))
      } catch (stockError) {
        // Log but don't fail the credit note
        console.error('Stock return error:', stockError)
      }
    }

    // Fetch complete credit note with relations
    const completeCreditNote = await db.creditNote.findUnique({
      where: { id: creditNote.id },
      include: {
        customer: true,
        invoice: true,
      },
    })

    return apiResponse({ success: true, data: completeCreditNote }, 201)
  } catch (error) {
    console.error('Credit Note Creation Error:', error)
    if (error instanceof AuthError || (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต'))) {
      return unauthorizedError()
    }
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
      return apiError(`ข้อมูลไม่ถูกต้อง: ${issues}`, 400)
    }
    if (error instanceof Error && error.message.includes('account not found')) {
      return apiError(`บัญชีไม่ถูกต้อง: ${error.message}`, 400)
    }
    console.error('Error message:', error?.message)
    return apiError('เกิดข้อผิดพลาดในการสร้างใบลดหนี้')
  }
}
