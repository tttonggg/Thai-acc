import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-utils'

// GET - Three-Way Match Variance Report
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get('vendorId') || undefined
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const matchStatus = searchParams.get('matchStatus') || undefined
    const minQtyVariancePctParam = searchParams.get('minQtyVariancePct')
    const minPriceVariancePctParam = searchParams.get('minPriceVariancePct')

    // Parse numeric filters
    const minQtyVariancePct = minQtyVariancePctParam ? parseFloat(minQtyVariancePctParam) : undefined
    const minPriceVariancePct = minPriceVariancePctParam ? parseFloat(minPriceVariancePctParam) : undefined

    // Date range filter: use invoiceDate from linked PurchaseInvoice if available, else createdAt
    let startDate: Date | undefined
    let endDate: Date | undefined
    if (startDateParam) startDate = new Date(startDateParam)
    if (endDateParam) endDate = new Date(endDateParam + 'T23:59:59')

    // Build where clause: exclude MATCHED and null status records
    const where: any = {
      matchStatus: { notIn: ['MATCHED'] },
    }

    if (vendorId) {
      where.vendorId = vendorId
    }

    // Note: ThreeWayMatch has vendorId directly; also filter by invoice date when joining
    if (startDate || endDate) {
      where.OR = [
        {
          invoiceId: { not: null },
          purchaseInvoice: {
            invoiceDate: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          },
        },
        {
          invoiceId: null,
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {}),
          },
        },
      ]
    }

    if (matchStatus) {
      // Single status filter (overrides default exclusion of MATCHED/null handled above)
      delete where.matchStatus
      where.matchStatus = matchStatus
    }

    // ThreeWayMatch has no relations — fetch scalar fields + FKs, then resolve related entities separately
    const rawMatches = await prisma.threeWayMatch.findMany({
      where,
      select: {
        id: true,
        qtyPO: true, qtyGRN: true, qtyInvoice: true,
        pricePO: true, priceInvoice: true,
        qtyVariance: true, priceVariance: true,
        matchStatus: true, varianceNotes: true,
        createdAt: true,
        poId: true, grnId: true, invoiceId: true, vendorId: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Batch-fetch related entities (ThreeWayMatch has no relations — only FK fields)
    const poIds = [...new Set(rawMatches.map(m => m.poId).filter(Boolean))] as string[]
    const grnIds = [...new Set(rawMatches.map(m => m.grnId).filter(Boolean))] as string[]
    const invoiceIds = [...new Set(rawMatches.map(m => m.invoiceId).filter(Boolean))] as string[]
    const vendorIds = [...new Set(rawMatches.map(m => m.vendorId).filter(Boolean))] as string[]

    const [purchaseOrders, goodsReceiptNotes, purchaseInvoices, vendors] = await Promise.all([
      poIds.length ? prisma.purchaseOrder.findMany({
        where: { id: { in: poIds } },
        select: { id: true, orderNo: true, vendorId: true },
      }) : [],
      grnIds.length ? prisma.goodsReceiptNote.findMany({
        where: { id: { in: grnIds } },
        select: { id: true, grnNo: true, date: true },
      }) : [],
      invoiceIds.length ? prisma.purchaseInvoice.findMany({
        where: { id: { in: invoiceIds } },
        select: { id: true, invoiceNo: true, invoiceDate: true, vendorId: true },
      }) : [],
      vendorIds.length ? prisma.vendor.findMany({
        where: { id: { in: vendorIds } },
        select: { id: true, code: true, name: true },
      }) : [],
    ])

    const poMap: Record<string, { id: string; orderNo: string }> = Object.fromEntries(
      purchaseOrders.map(po => [po.id, po])
    )
    const grnMap: Record<string, { id: string; grnNo: string; date: Date }> = Object.fromEntries(
      goodsReceiptNotes.map(g => [g.id, g])
    )
    const invMap: Record<string, { id: string; invoiceNo: string; invoiceDate: Date; vendorId: string | null }> = Object.fromEntries(
      purchaseInvoices.map(i => [i.id, i])
    )
    const vendorMap: Record<string, { id: string; code: string; name: string }> = Object.fromEntries(
      vendors.map(v => [v.id, v])
    )

    // Calculate variance percentages and filter by minimums
    const items = rawMatches
      .map((match) => {
        const qtyVariancePct =
          match.qtyGRN !== 0 ? (Math.abs(match.qtyVariance) / match.qtyGRN) * 100 : null
        const priceVariancePct =
          match.pricePO !== 0 ? (Math.abs(match.priceVariance) / match.pricePO) * 100 : null

        const po = match.poId ? poMap[match.poId] : null
        const grn = match.grnId ? grnMap[match.grnId] : null
        const inv = match.invoiceId ? invMap[match.invoiceId] : null
        const vendor = match.vendorId ? vendorMap[match.vendorId] ?? null : null

        return {
          id: match.id,
          matchStatus: match.matchStatus,
          qtyPO: match.qtyPO,
          qtyGRN: match.qtyGRN,
          qtyInvoice: match.qtyInvoice,
          qtyVariance: match.qtyVariance,
          qtyVariancePct,
          pricePO: match.pricePO,
          priceInvoice: match.priceInvoice,
          priceVariance: match.priceVariance,
          priceVariancePct,
          varianceNotes: match.varianceNotes,
          createdAt: match.createdAt,
          purchaseOrder: po ? { orderNo: po.orderNo } : null,
          goodsReceiptNote: grn ? { grnNo: grn.grnNo, date: grn.date } : null,
          purchaseInvoice: inv ? { invoiceNo: inv.invoiceNo, invoiceDate: inv.invoiceDate, vendorId: inv.vendorId } : null,
          vendor,
        }
      })
      .filter((item) => {
        if (minQtyVariancePct !== undefined && item.qtyVariancePct !== null) {
          if (item.qtyVariancePct < minQtyVariancePct) return false
        }
        if (minPriceVariancePct !== undefined && item.priceVariancePct !== null) {
          if (item.priceVariancePct < minPriceVariancePct) return false
        }
        return true
      })

    // Sort: worst variance first (larger of qty or price variance %)
    items.sort((a, b) => {
      const aWorst =
        Math.max(a.qtyVariancePct ?? 0, a.priceVariancePct ?? 0)
      const bWorst =
        Math.max(b.qtyVariancePct ?? 0, b.priceVariancePct ?? 0)
      return bWorst - aWorst
    })

    // Build summary: byVendor
    const summaryVendorMap = new Map<string, { vendorId: string; vendorName: string; count: number }>()
    for (const item of items) {
      const vId = item.vendor?.id ?? 'unknown'
      const vName = item.vendor?.name ?? 'Unknown Vendor'
      const existing = summaryVendorMap.get(vId)
      if (existing) {
        existing.count++
      } else {
        summaryVendorMap.set(vId, { vendorId: vId, vendorName: vName, count: 1 })
      }
    }
    const byVendor = Array.from(summaryVendorMap.values()).sort((a, b) => b.count - a.count)

    // Build summary: byStatus
    const statusCounts: Record<string, number> = {}
    for (const item of items) {
      statusCounts[item.matchStatus] = (statusCounts[item.matchStatus] ?? 0) + 1
    }
    const byStatus = statusCounts

    return NextResponse.json({
      success: true,
      data: {
        items,
        summary: {
          totalItems: items.length,
          byVendor,
          byStatus,
        },
      },
    })
  } catch (error: any) {
    console.error('Variance Report API error:', error)

    if (error?.name === 'AuthError' || error?.statusCode === 401) {
      return NextResponse.json(
        { success: false, error: 'ไม่ได้รับอนุญาต - กรุณาเข้าสู่ระบบ' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการดึงข้อมูล: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
