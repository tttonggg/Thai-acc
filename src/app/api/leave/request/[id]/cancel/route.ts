// Cancel Leave Request API (Phase 3b)
import { NextRequest, NextResponse } from 'next/server'
import { cancelLeave } from '@/lib/leave-service'
import { requireAuth } from '@/lib/api-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Get employeeId from request body or query
    const body = await request.json().catch(() => ({}))
    const employeeId = body.employeeId || user.id

    const result = await cancelLeave(id, employeeId)
    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 })
  }
}