import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'
import { z } from 'zod'

// Validation schema for template
const templateSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อเทมเพลต'),
  config: z.object({
    reportType: z.string(),
    reportName: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    comparePrevious: z.boolean().optional(),
    includeZeroBalances: z.boolean().optional(),
    accountLevel: z.string().optional(),
    columnAccountCode: z.boolean().optional(),
    columnAccountName: z.boolean().optional(),
    columnAccountNameEn: z.boolean().optional(),
    columnOpeningBalance: z.boolean().optional(),
    columnDebits: z.boolean().optional(),
    columnCredits: z.boolean().optional(),
    columnClosingBalance: z.boolean().optional(),
    columnBudget: z.boolean().optional(),
    columnVariance: z.boolean().optional(),
    filterAccountType: z.string().optional(),
    filterAccountFrom: z.string().optional(),
    filterAccountTo: z.string().optional(),
    outputFormat: z.string().optional(),
    notes: z.string().optional(),
  }),
})

/**
 * POST /api/reports/templates
 * Save a new report template
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const session = await requireAuth()

    // Parse and validate request body
    const body = await request.json()
    const { name, config } = templateSchema.parse(body)

    // Create template using ScheduledReport model
    const template = await prisma.scheduledReport.create({
      data: {
        name,
        reportType: config.reportType,
        schedule: 'manual', // Manual template, not scheduled
        enabled: false, // Templates are disabled by default
        parameters: config,
        recipients: '',
        outputFormat: 'PDF',
        createdBy: session.user?.id || 'system',
        time: '00:00',
      },
    })

    return NextResponse.json({
      success: true,
      data: template,
    })
  } catch (error: any) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'ข้อมูลไม่ถูกต้อง: ' + error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 }
      )
    }

    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการบันทึกเทมเพลต',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/reports/templates
 * Get all report templates
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    await requireAuth()

    // Fetch all manual templates (schedule = 'manual')
    const templates = await prisma.scheduledReport.findMany({
      where: {
        schedule: 'manual',
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: templates,
    })
  } catch (error: any) {
    // Handle auth errors
    if (error.name === 'AuthError') {
      return NextResponse.json(
        { success: false, error: error.message || 'กรุณาเข้าสู่ระบบ' },
        { status: error.statusCode || 401 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลเทมเพลต',
      },
      { status: 500 }
    )
  }
}
