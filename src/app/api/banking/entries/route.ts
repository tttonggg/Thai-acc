// Bank Statement Entries API
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-utils'
import prisma from '@/lib/db'
import { getUnmatchedEntries, matchBankEntries } from '@/lib/bank-match-service'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const { searchParams } = new URL(request.url)
    const bankAccountId = searchParams.get('bankAccountId')

    if (!bankAccountId) {
      return NextResponse.json({ success: false, error: 'กรุณาระบุบัญชีธนาคาร' }, { status: 400 })
    }

    // Get matched and unmatched entries
    const allEntries = await prisma.bankStatementEntry.findMany({
      where: { bankAccountId },
      orderBy: { valueDate: 'asc' },
    })

    const matchedEntries = allEntries.filter(e => e.matched)
    const unmatchedEntries = getUnmatchedEntries(bankAccountId)

    // Build response matching the expected structure
    const result = {
      matched: matchedEntries.map(e => ({
        entryId: e.id,
        matchedEntryId: e.matchedEntryId,
        matchedEntryType: e.matchedEntryType as 'JOURNAL_ENTRY' | 'PAYMENT' | 'RECEIPT' | null,
        matchConfidence: e.matchConfidence ?? 100,
        matchReason: 'จับคู่แล้ว',
      })),
      unmatched: unmatchedEntries,
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
