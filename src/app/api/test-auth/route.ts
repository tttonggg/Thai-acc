import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Test database connection
    const creditNoteCount = await db.creditNote.count()
    const debitNoteCount = await db.debitNote.count()
    const stockTakeCount = await db.stockTake.count()

    return NextResponse.json({
      success: true,
      message: 'Authentication and database working!',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      database: {
        creditNoteCount,
        debitNoteCount,
        stockTakeCount,
      },
    })
  } catch (error: any) {
    console.error('Test API Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
    }, { status: 500 })
  }
}
