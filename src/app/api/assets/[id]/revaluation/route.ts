// POST /api/assets/[id]/revaluation - Create asset revaluation
import { NextRequest, NextResponse } from 'next/server'
import { createRevaluation } from '@/lib/asset-revaluation-service'
import { requireAuth, canEdit } from '@/lib/api-utils'
import { z } from 'zod'

const revaluationSchema = z.object({
  newFairValue: z.number().int().positive('มูลค่ายุติธรรมต้องเป็นตัวเลขบวก'),
  revalDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()

    if (!(await canEdit())) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์บันทึกการตีราคาสินทรัพย์' },
        { status: 403 }
      )
    }

    const { id: assetId } = await params
    const body = await request.json()

    // Validate input
    const validation = revaluationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.issues[0].message },
        { status: 400 }
      )
    }

    const { newFairValue, revalDate, notes } = validation.data

    const result = await createRevaluation({
      assetId,
      newFairValue,
      revalDate: new Date(revalDate),
      notes,
      userId: user.id
    })

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Revaluation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'เกิดข้อผิดพลาดในการบันทึกการตีราคา' },
      { status: 500 }
    )
  }
}
