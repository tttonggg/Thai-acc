// B5. Inter-Company Transaction Service
// บริการรายการระหว่างบริษัท

import { prisma } from "@/lib/db"
import type { Entity, InterCompanyTransaction, ConsolidationAdjustment } from "@prisma/client"

/**
 * Create entity (company in group)
 * สร้างบริษัทในเครือ
 */
export async function createEntity(
  code: string,
  name: string,
  options: {
    nameEn?: string
    taxId?: string
    isPrimary?: boolean
    metadata?: Record<string, unknown>
  } = {}
): Promise<Entity> {
  if (options.isPrimary) {
    // Ensure no other entity is primary
    await prisma.entity.updateMany({
      where: { isPrimary: true },
      data: { isPrimary: false },
    })
  }

  return prisma.entity.upsert({
    where: { code },
    update: {
      name,
      nameEn: options.nameEn,
      taxId: options.taxId,
      isPrimary: options.isPrimary,
      metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
      isActive: true,
    },
    create: {
      code,
      name,
      nameEn: options.nameEn,
      taxId: options.taxId,
      isPrimary: options.isPrimary || false,
      metadata: options.metadata ? JSON.stringify(options.metadata) : undefined,
    },
  })
}

/**
 * Record inter-company transaction
 * บันทึกรายการระหว่างบริษัท
 */
export async function recordInterCompanyTransaction(
  fromEntityId: string,
  toEntityId: string,
  documentType: string,
  documentId: string,
  documentNo: string,
  amount: number,
  description?: string
): Promise<InterCompanyTransaction> {
  if (fromEntityId === toEntityId) {
    throw new Error("ไม่สามารถบันทึกรายการระหว่างบริษัทเดียวกันได้")
  }

  return prisma.interCompanyTransaction.create({
    data: {
      fromEntityId,
      toEntityId,
      documentType,
      documentId,
      documentNo,
      amount,
      description,
    },
  })
}

/**
 * Get inter-company transactions for reconciliation
 * ดึงรายการระหว่างบริษัทสำหรับกระทบยอด
 */
export async function getInterCompanyTransactions(
  filters: {
    fromEntityId?: string
    toEntityId?: string
    startDate?: Date
    endDate?: Date
    isEliminated?: boolean
  } = {}
): Promise<InterCompanyTransaction[]> {
  const where: {
    fromEntityId?: string
    toEntityId?: string
    createdAt?: { gte?: Date; lte?: Date }
    isEliminated?: boolean
  } = {}

  if (filters.fromEntityId) where.fromEntityId = filters.fromEntityId
  if (filters.toEntityId) where.toEntityId = filters.toEntityId
  if (filters.isEliminated !== undefined) where.isEliminated = filters.isEliminated
  if (filters.startDate || filters.endDate) {
    where.createdAt = {}
    if (filters.startDate) where.createdAt.gte = filters.startDate
    if (filters.endDate) where.createdAt.lte = filters.endDate
  }

  return prisma.interCompanyTransaction.findMany({
    where,
    include: {
      fromEntity: true,
      toEntity: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

/**
 * Create elimination entry
 * สร้างรายการกำจัดขั้นตอนรวม
 */
export async function createEliminationEntry(
  transactionId: string,
  journalEntryId: string,
  eliminatedBy: string
): Promise<InterCompanyTransaction> {
  return prisma.interCompanyTransaction.update({
    where: { id: transactionId },
    data: {
      isEliminated: true,
      eliminationEntryId: journalEntryId,
      eliminatedAt: new Date(),
      eliminatedBy,
    },
  })
}

/**
 * Auto-eliminate matching inter-company transactions
 * กำจัดขั้นตอนรวมอัตโนมัติสำหรับรายการที่ตรงกัน
 */
export async function autoEliminateTransactions(
  eliminatedBy: string
): Promise<number> {
  // Find matching pairs (one from A->B, one from B->A with same amount)
  const transactions = await prisma.interCompanyTransaction.findMany({
    where: { isEliminated: false },
    include: { fromEntity: true, toEntity: true },
  })

  let eliminatedCount = 0

  for (const tx of transactions) {
    // Find matching reverse transaction
    const match = transactions.find(
      (t) =>
        t.id !== tx.id &&
        !t.isEliminated &&
        t.fromEntityId === tx.toEntityId &&
        t.toEntityId === tx.fromEntityId &&
        t.amount === tx.amount &&
        !t.isEliminated
    )

    if (match) {
      // Create elimination journal entry
      const eliminationEntry = await prisma.journalEntry.create({
        data: {
          entryNo: await generateEliminationEntryNo(),
          date: new Date(),
          description: `กำจัดขั้นตอนรวม: ${tx.documentNo} <-> ${match.documentNo}`,
          reference: `${tx.documentNo},${match.documentNo}`,
          documentType: "ELIMINATION",
          status: "POSTED",
          lines: {
            create: [
              // Reverse the inter-company receivable/payable
              {
                lineNo: 1,
                accountId: await getInterCompanyPayableAccountId(),
                description: `กำจัดเจ้าหนี้ระหว่างบริษัท`,
                debit: tx.amount,
                credit: 0,
              },
              {
                lineNo: 2,
                accountId: await getInterCompanyReceivableAccountId(),
                description: `กำจัดลูกหนี้ระหว่างบริษัท`,
                debit: 0,
                credit: tx.amount,
              },
            ],
          },
        },
      })

      // Mark both transactions as eliminated
      await createEliminationEntry(tx.id, eliminationEntry.id, eliminatedBy)
      await createEliminationEntry(match.id, eliminationEntry.id, eliminatedBy)

      eliminatedCount += 2
    }
  }

  return eliminatedCount
}

/**
 * Generate elimination entry number
 * สร้างเลขที่รายการกำจัด
 */
async function generateEliminationEntryNo(): Promise<string> {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")

  const count = await prisma.journalEntry.count({
    where: {
      entryNo: { startsWith: `ELIM-${year}${month}` },
    },
  })

  return `ELIM-${year}${month}-${String(count + 1).padStart(4, "0")}`
}

/**
 * Get inter-company payable account ID (create if not exists)
 */
async function getInterCompanyPayableAccountId(): Promise<string> {
  let account = await prisma.chartOfAccount.findFirst({
    where: { code: "2120" }, // Inter-company payable
  })

  if (!account) {
    // Create the account
    account = await prisma.chartOfAccount.create({
      data: {
        code: "2120",
        name: "เจ้าหนี้ระหว่างบริษัท",
        nameEn: "Inter-company Payables",
        type: "LIABILITY",
        level: 3,
        isDetail: true,
        isSystem: true,
      },
    })
  }

  return account.id
}

/**
 * Get inter-company receivable account ID (create if not exists)
 */
async function getInterCompanyReceivableAccountId(): Promise<string> {
  let account = await prisma.chartOfAccount.findFirst({
    where: { code: "1130" }, // Inter-company receivable
  })

  if (!account) {
    // Create the account
    account = await prisma.chartOfAccount.create({
      data: {
        code: "1130",
        name: "ลูกหนี้ระหว่างบริษัท",
        nameEn: "Inter-company Receivables",
        type: "ASSET",
        level: 3,
        isDetail: true,
        isSystem: true,
      },
    })
  }

  return account.id
}

/**
 * Create consolidation adjustment
 * สร้างรายการปรับปรุงการรวมงบการเงิน
 */
export async function createConsolidationAdjustment(
  year: number,
  month: number,
  type: "ELIMINATION" | "REALLOCATION" | "TRANSLATION",
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string,
  journalEntryId?: string
): Promise<ConsolidationAdjustment> {
  return prisma.consolidationAdjustment.create({
    data: {
      year,
      month,
      type,
      fromAccountId,
      toAccountId,
      amount,
      description,
      journalEntryId,
    },
  })
}

/**
 * Generate consolidated trial balance
 * สร้างงบทดลองรวม
 */
export interface ConsolidatedTrialBalance {
  year: number
  month: number
  entities: Array<{
    entityId: string
    entityCode: string
    entityName: string
    balances: Array<{
      accountId: string
      accountCode: string
      accountName: string
      debit: number
      credit: number
    }>
  }>
  consolidated: Array<{
    accountId: string
    accountCode: string
    accountName: string
    totalDebit: number
    totalCredit: number
    eliminations: number
    netDebit: number
    netCredit: number
  }>
}

export async function generateConsolidatedTrialBalance(
  year: number,
  month: number
): Promise<ConsolidatedTrialBalance> {
  const entities = await prisma.entity.findMany({
    where: { isActive: true },
  })

  const endDate = new Date(year, month, 0, 23, 59, 59)
  const accounts = await prisma.chartOfAccount.findMany({
    where: { isActive: true, isDetail: true },
  })

  const result: ConsolidatedTrialBalance = {
    year,
    month,
    entities: [],
    consolidated: [],
  }

  // Get balances for each entity
  for (const entity of entities) {
    const entityBalances = []

    for (const account of accounts) {
      const lines = await prisma.journalLine.findMany({
        where: {
          accountId: account.id,
          entry: {
            date: { lte: endDate },
            status: "POSTED",
            deletedAt: null,
          },
        },
      })

      const debit = lines.reduce((sum, l) => sum + l.debit, 0)
      const credit = lines.reduce((sum, l) => sum + l.credit, 0)

      if (debit > 0 || credit > 0) {
        entityBalances.push({
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          debit,
          credit,
        })
      }
    }

    result.entities.push({
      entityId: entity.id,
      entityCode: entity.code,
      entityName: entity.name,
      balances: entityBalances,
    })
  }

  // Calculate consolidated balances
  const consolidatedMap = new Map<
    string,
    {
      accountId: string
      accountCode: string
      accountName: string
      totalDebit: number
      totalCredit: number
      eliminations: number
    }
  >()

  for (const entity of result.entities) {
    for (const balance of entity.balances) {
      if (!consolidatedMap.has(balance.accountId)) {
        consolidatedMap.set(balance.accountId, {
          accountId: balance.accountId,
          accountCode: balance.accountCode,
          accountName: balance.accountName,
          totalDebit: 0,
          totalCredit: 0,
          eliminations: 0,
        })
      }

      const consolidated = consolidatedMap.get(balance.accountId)!
      consolidated.totalDebit += balance.debit
      consolidated.totalCredit += balance.credit
    }
  }

  // Get eliminations
  const eliminations = await prisma.interCompanyTransaction.findMany({
    where: {
      isEliminated: true,
      eliminatedAt: { lte: endDate },
    },
  })

  // Calculate net balances
  for (const item of consolidatedMap.values()) {
    result.consolidated.push({
      ...item,
      eliminations: 0, // Would need detailed tracking
      netDebit: item.totalDebit,
      netCredit: item.totalCredit,
    })
  }

  return result
}

/**
 * Get inter-company reconciliation report
 * รายงานการกระทบยอดระหว่างบริษัท
 */
export interface InterCompanyReconciliationReport {
  pairs: Array<{
    entityA: { id: string; name: string }
    entityB: { id: string; name: string }
    aToB: number
    bToA: number
    net: number
    differences: Array<{
      documentNo: string
      amount: number
      status: "matched" | "unmatched"
    }>
  }>
  summary: {
    totalReceivables: number
    totalPayables: number
    unmatchedAmount: number
  }
}

export async function generateInterCompanyReconciliationReport(
  startDate?: Date,
  endDate?: Date
): Promise<InterCompanyReconciliationReport> {
  const transactions = await getInterCompanyTransactions({
    startDate,
    endDate,
  })

  const entities = await prisma.entity.findMany({
    where: { isActive: true },
  })

  const report: InterCompanyReconciliationReport = {
    pairs: [],
    summary: { totalReceivables: 0, totalPayables: 0, unmatchedAmount: 0 },
  }

  // Group transactions by entity pair
  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const entityA = entities[i]
      const entityB = entities[j]

      const aToBTx = transactions.filter(
        (t) => t.fromEntityId === entityA.id && t.toEntityId === entityB.id
      )
      const bToATx = transactions.filter(
        (t) => t.fromEntityId === entityB.id && t.toEntityId === entityA.id
      )

      const aToB = aToBTx.reduce((sum, t) => sum + t.amount, 0)
      const bToA = bToATx.reduce((sum, t) => sum + t.amount, 0)

      if (aToB > 0 || bToA > 0) {
        const differences = []

        // Match transactions
        for (const tx of aToBTx) {
          const match = bToATx.find(
            (t) => t.amount === tx.amount && !t.isEliminated
          )
          differences.push({
            documentNo: tx.documentNo,
            amount: tx.amount,
            status: match ? "matched" : "unmatched",
          })
        }

        report.pairs.push({
          entityA: { id: entityA.id, name: entityA.name },
          entityB: { id: entityB.id, name: entityB.name },
          aToB,
          bToA,
          net: aToB - bToA,
          differences,
        })

        report.summary.totalReceivables += aToB
        report.summary.totalPayables += bToA
        report.summary.unmatchedAmount += Math.abs(aToB - bToA)
      }
    }
  }

  return report
}

/**
 * Initialize default entity (primary company)
 * สร้างบริษัทหลักเริ่มต้น
 */
export async function initializePrimaryEntity(): Promise<Entity> {
  const existing = await prisma.entity.findFirst({
    where: { isPrimary: true },
  })

  if (existing) return existing

  const company = await prisma.company.findFirst()

  return createEntity(
    "HEAD",
    company?.name || "บริษัทหลัก",
    {
      nameEn: company?.nameEn,
      taxId: company?.taxId,
      isPrimary: true,
    }
  )
}
