// Leave Types API (Phase 3b)
import { NextRequest, NextResponse } from 'next/server'
import { getLeaveTypes } from '@/lib/leave-service'
import { requireAuth } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const types = await getLeaveTypes()
    return NextResponse.json({ success: true, data: types })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}