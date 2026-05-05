import { NextRequest, NextResponse } from 'next/server'
import { checkOverdueInvoices } from '@/lib/email-service'
import { requireAdmin } from '@/lib/api-auth'

export async function GET(req: NextRequest) {
  // Optional: require secret header for cron security
  const authHeader = req.headers.get('x-cron-secret')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== cronSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await checkOverdueInvoices()
    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
