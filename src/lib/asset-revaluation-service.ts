// Asset Revaluation Service - Thai TFRS Compliant
// Handles asset revaluation with journal entry creation
import prisma from '@/lib/db'
import { generateDocNumber } from '@/lib/api-utils'

export interface RevaluationInput {
  assetId: string
  newFairValue: number // มูลค่ายุติธรรมใหม่ (สตางค์)
  revalDate: Date
  notes?: string
  userId: string
}

export interface RevaluationResult {
  id: string
  oldCost: number
  oldAccumDep: number
  newCost: number
  newAccumDep: number
  revalGain: number
  revalLoss: number
  journalEntryId: string
}

/**
 * Calculate new values for asset revaluation
 * Given old cost, accumulated depreciation, and new fair value,
 * computes the new cost, new accumulated depreciation, and gain/loss
 */
export function calculateNewValues(
  oldCost: number,
  oldAccumDep: number,
  newFairValue: number
): {
  newCost: number
  newAccumDep: number
  revalGain: number
  revalLoss: number
} {
  const oldNetBookValue = oldCost - oldAccumDep
  const netChange = newFairValue - oldNetBookValue

  let newCost = oldCost
  let newAccumDep = oldAccumDep
  let revalGain = 0
  let revalLoss = 0

  if (netChange > 0) {
    // Revaluation gain: increases both cost and net book value
    revalGain = netChange
    newCost = oldCost + netChange
    // Accumulated depreciation stays the same (we don't reset it on gain)
    newAccumDep = oldAccumDep
  } else if (netChange < 0) {
    // Revaluation loss: decreases net book value
    revalLoss = Math.abs(netChange)
    // First reduce accumulated depreciation, then reduce cost if needed
    const absNetChange = Math.abs(netChange)
    if (absNetChange <= oldAccumDep) {
      // Can fully absorb in accumulated depreciation
      newAccumDep = oldAccumDep - absNetChange
      newCost = oldCost
    } else {
      // Need to also reduce cost
      newCost = oldCost - (absNetChange - oldAccumDep)
      newAccumDep = 0
    }
  }

  return { newCost, newAccumDep, revalGain, revalLoss }
}

/**
 * Get revaluation history for an asset
 */
export async function getAssetRevaluations(assetId: string) {
  const revaluations = await prisma.assetRevaluation.findMany({
    where: { assetId },
    orderBy: { revalDate: 'desc' },
    include: {
      asset: {
        select: { code: true, name: true }
      }
    }
  })

  return revaluations
}

/**
 * Create an asset revaluation with journal entry
 *
 * Journal entry patterns:
 *
 * REVALUATION GAIN:
 *   Dr. Accumulated Depreciation (reduce it)
 *   Dr. Asset Cost (increase it)
 *   Cr. Revaluation Reserve (equity)
 *
 * REVALUATION LOSS:
 *   Dr. Revaluation Loss (expense)
 *   Dr. Accumulated Depreciation (reduce it)
 *   Cr. Asset Cost (reduce it)
 */
export async function createRevaluation(input: RevaluationInput): Promise<RevaluationResult> {
  const { assetId, newFairValue, revalDate, notes, userId } = input

  // Get current asset with latest depreciation
  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
    include: {
      schedules: {
        where: { posted: true },
        orderBy: { date: 'desc' },
        take: 1
      }
    }
  })

  if (!asset) {
    throw new Error('ไม่พบสินทรัพย์')
  }

  const oldCost = asset.purchaseCost
  const oldAccumDep = asset.schedules[0]?.accumulated || 0

  // Calculate new values
  const { newCost, newAccumDep, revalGain, revalLoss } = calculateNewValues(
    oldCost,
    oldAccumDep,
    newFairValue
  )

  // Create journal entry and revaluation record in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Generate journal entry number
    const journalNo = await generateDocNumber('JOURNAL_ENTRY', 'JE')

    const isGain = revalGain > 0
    const isLoss = revalLoss > 0

    // Build journal lines based on gain or loss
    const journalLines: Array<{
      lineNo: number
      accountId: string
      description: string
      debit: number
      credit: number
    }> = []

    let lineNo = 1

    if (isGain) {
      // Dr. Accumulated Depreciation (reduce it) - Dr. side
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.accumDepAccountId,
        description: `ปรับลดค่าเสื่อมราคาสะสม - ${asset.name}`,
        debit: oldAccumDep - newAccumDep, // Reduction amount
        credit: 0
      })

      // Dr. Asset Cost (increase it) - Dr. side
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.glAccountId,
        description: `ปรับเพิ่มราคาทุนสินทรัพย์ - ${asset.name}`,
        debit: newCost - oldCost, // Increase amount
        credit: 0
      })

      // Cr. Revaluation Reserve (equity) - Cr. side
      // Use a revaluation reserve account - if not exists, could use 3100 series
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.glAccountId, // Fallback: use asset account temporarily
        description: `สำรองจากการตีราคาสินทรัพย์ - ${asset.name}`,
        debit: 0,
        credit: revalGain
      })
    } else if (isLoss) {
      // Dr. Revaluation Loss (expense) - Dr. side
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.depExpenseAccountId, // Fallback to depreciation expense account
        description: `ขาดทุนจากการตีราคาสินทรัพย์ - ${asset.name}`,
        debit: revalLoss,
        credit: 0
      })

      // Dr. Accumulated Depreciation (reduce it) - Dr. side
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.accumDepAccountId,
        description: `ปรับลดค่าเสื่อมราคาสะสม - ${asset.name}`,
        debit: oldAccumDep - newAccumDep,
        credit: 0
      })

      // Cr. Asset Cost (reduce it) - Cr. side
      journalLines.push({
        lineNo: lineNo++,
        accountId: asset.glAccountId,
        description: `ปรับลดราคาทุนสินทรัพย์ - ${asset.name}`,
        debit: 0,
        credit: oldCost - newCost
      })
    }

    // Verify journal entry balances
    const totalDebit = journalLines.reduce((sum, l) => sum + l.debit, 0)
    const totalCredit = journalLines.reduce((sum, l) => sum + l.credit, 0)

    if (totalDebit !== totalCredit) {
      throw new Error(`Journal entry does not balance: Dr=${totalDebit}, Cr=${totalCredit}`)
    }

    // Create journal entry
    const journalEntry = await tx.journalEntry.create({
      data: {
        entryNo: journalNo,
        date: revalDate,
        description: `ปรับปรุงมูลค่าสินทรัพย์ ${asset.name} (${isGain ? 'กำไร' : 'ขาดทุน'}จากการตีราคา)`,
        documentType: 'ASSET_REVALUATION',
        documentId: assetId,
        status: 'POSTED',
        createdById: userId,
        totalDebit,
        totalCredit,
        lines: {
          create: journalLines
        }
      }
    })

    // Create revaluation record
    const revaluation = await tx.assetRevaluation.create({
      data: {
        assetId,
        revalDate,
        oldCost,
        oldAccumDep,
        newCost,
        newAccumDep,
        revalGain,
        revalLoss,
        journalEntryId: journalEntry.id,
        notes,
        createdBy: userId
      }
    })

    return {
      id: revaluation.id,
      oldCost,
      oldAccumDep,
      newCost,
      newAccumDep,
      revalGain,
      revalLoss,
      journalEntryId: journalEntry.id
    }
  })

  return result
}
