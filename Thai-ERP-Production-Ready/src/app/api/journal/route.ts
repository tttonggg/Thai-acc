import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { z } from 'zod'
import { requireAuth, requireRole } from '@/lib/api-auth'

// Validation schema for journal entry
const journalLineSchema = z.object({
  accountId: z.string().min(1, 'ต้องเลือกบัญชี'),
  description: z.string().optional(),
  debit: z.number().min(0, 'เดบิตต้องไม่ติดลบ').default(0),
  credit: z.number().min(0, 'เครดิตต้องไม่ติดลบ').default(0),
})

const journalEntrySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  description: z.string().optional(),
  reference: z.string().optional(),
  documentType: z.string().optional(),
  documentId: z.string().optional(),
  notes: z.string().optional(),
  lines: z.array(journalLineSchema).min(2, 'ต้องมีอย่างน้อย 2 รายการ'),
}).refine(
  (data) => {
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0)
    return Math.abs(totalDebit - totalCredit) < 0.01
  },
  { message: 'ยอดเดบิตและเครดิตต้องเท่ากัน' }
)

// Generate entry number
async function generateEntryNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  
  const prefix = `JV-${year}${month}`
  
  const lastEntry = await prisma.journalEntry.findFirst({
    where: {
      entryNo: {
        startsWith: prefix,
      },
    },
    orderBy: { entryNo: 'desc' },
  })
  
  let nextNum = 1
  if (lastEntry) {
    const lastNum = parseInt(lastEntry.entryNo.split('-')[2] || '0')
    nextNum = lastNum + 1
  }
  
  return `${prefix}-${String(nextNum).padStart(4, '0')}`
}

// GET - List journal entries (ACCOUNTANT or ADMIN only)
export async function GET(request: NextRequest) {
  try {
    // Require ACCOUNTANT or ADMIN role
    await requireRole(['ACCOUNTANT', 'ADMIN'])

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')
    
    const skip = (page - 1) * limit
    
    const where: any = {}
    
    if (status) {
      where.status = status
    }
    
    if (startDate || endDate) {
      where.date = {}
      if (startDate) where.date.gte = new Date(startDate)
      if (endDate) where.date.lte = new Date(endDate)
    }
    
    if (search) {
      where.OR = [
        { entryNo: { contains: search } },
        { description: { contains: search } },
        { reference: { contains: search } },
      ]
    }
    
    const [entries, total] = await Promise.all([
      prisma.journalEntry.findMany({
        where,
        include: {
          lines: {
            include: {
              account: true,
            },
            orderBy: { lineNo: 'asc' },
          },
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.journalEntry.count({ where }),
    ])
    
    return NextResponse.json({
      success: true,
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    // Handle auth errors
    if (error?.statusCode === 401 || error?.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }
    if (error?.statusCode === 403) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 403 }
      )
    }
    console.error('Journal API error:', error)
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' },
      { status: 500 }
    )
  }
}

// POST - Create journal entry (ACCOUNTANT or ADMIN only)
export async function POST(request: NextRequest) {
  try {
    // Require ACCOUNTANT or ADMIN role
    await requireRole(['ACCOUNTANT', 'ADMIN'])

    const body = await request.json()
    const validatedData = journalEntrySchema.parse(body)
    
    // Calculate totals
    const totalDebit = validatedData.lines.reduce((sum, line) => sum + line.debit, 0)
    const totalCredit = validatedData.lines.reduce((sum, line) => sum + line.credit, 0)
    
    // Generate entry number
    const entryNo = await generateEntryNumber()
    
    // Create journal entry with lines
    const entry = await prisma.journalEntry.create({
      data: {
        entryNo,
        date: validatedData.date,
        description: validatedData.description,
        reference: validatedData.reference,
        documentType: validatedData.documentType,
        documentId: validatedData.documentId,
        totalDebit,
        totalCredit,
        notes: validatedData.notes,
        status: 'DRAFT',
        lines: {
          create: validatedData.lines.map((line, index) => ({
            lineNo: index + 1,
            accountId: line.accountId,
            description: line.description,
            debit: line.debit,
            credit: line.credit,
          })),
        },
      },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
    })
    
    return NextResponse.json({ success: true, data: entry })
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'ข้อมูลไม่ถูกต้อง', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการสร้างบันทึกบัญชี' },
      { status: 500 }
    )
  }
}
