// VAT Reports API
// /api/reports/vat - VAT output and input report
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'

/**
 * GET /api/reports/vat
 * Generate VAT report (ภาษีขายและภาษีซื้อ)
 * Query parameters:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
  try {
    await requireAuth()

    const searchParams = request.nextUrl.searchParams
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { success: false, error: 'กรุณาระบุวันที่เริ่มต้นและวันที่สิ้นสุด' },
        { status: 400 }
      )
    }

    const startDate = new Date(startDateStr)
    const endDate = new Date(endDateStr)

    // Set endDate to end of day
    endDate.setHours(23, 59, 59, 999)

    // Get the month and year from startDate for monthly data
    const taxMonth = startDate.getMonth() + 1
    const taxYear = startDate.getFullYear()

    // Fetch VAT OUTPUT records (ภาษีขาย)
    const vatOutputRecords = await prisma.vatRecord.findMany({
      where: {
        type: 'OUTPUT',
        documentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        documentDate: 'desc',
      },
    })

    // Fetch VAT INPUT records (ภาษีซื้อ)
    const vatInputRecords = await prisma.vatRecord.findMany({
      where: {
        type: 'INPUT',
        documentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        documentDate: 'desc',
      },
    })

    // Transform output records to match UI expectations
    const transformedOutputRecords = vatOutputRecords.map((record) => ({
      id: record.id,
      date: record.documentDate.toISOString().split('T')[0],
      docNo: record.documentNo,
      name: record.customerName || '-',
      amount: record.subtotal,
      vat: record.vatAmount,
    }))

    // Transform input records to match UI expectations
    const transformedInputRecords = vatInputRecords.map((record) => ({
      id: record.id,
      date: record.documentDate.toISOString().split('T')[0],
      docNo: record.documentNo,
      name: record.vendorName || '-',
      amount: record.subtotal,
      vat: record.vatAmount,
    }))

    // Calculate totals
    const totalVatOutput = transformedOutputRecords.reduce(
      (sum, r) => sum + r.vat,
      0
    )
    const totalVatInput = transformedInputRecords.reduce(
      (sum, r) => sum + r.vat,
      0
    )
    const netVat = totalVatOutput - totalVatInput

    // Calculate total amounts
    const totalOutputAmount = transformedOutputRecords.reduce(
      (sum, r) => sum + r.amount,
      0
    )
    const totalInputAmount = transformedInputRecords.reduce(
      (sum, r) => sum + r.amount,
      0
    )

    // ✅ OPTIMIZED: Generate monthly data for the chart (last 12 months)
    // Use groupBy instead of loop (was 24 queries, now 2)
    const months = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ]

    // Get the full date range for the 12-month period
    const endDateOfPeriod = new Date(taxYear, taxMonth, 0, 23, 59, 59, 999)
    const startDateOfPeriod = new Date(taxYear, taxMonth - 12, 1)

    // Fetch all OUTPUT VAT data grouped by month in ONE query
    const vatOutputByMonth = await prisma.vatRecord.groupBy({
      by: ['taxMonth', 'taxYear'],
      where: {
        type: 'OUTPUT',
        documentDate: {
          gte: startDateOfPeriod,
          lte: endDateOfPeriod,
        },
      },
      _sum: {
        vatAmount: true,
      },
    })

    // Fetch all INPUT VAT data grouped by month in ONE query
    const vatInputByMonth = await prisma.vatRecord.groupBy({
      by: ['taxMonth', 'taxYear'],
      where: {
        type: 'INPUT',
        documentDate: {
          gte: startDateOfPeriod,
          lte: endDateOfPeriod,
        },
      },
      _sum: {
        vatAmount: true,
      },
    })

    // Build monthly data from aggregated results
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(taxYear, taxMonth - 1 - i, 1)
      const monthNum = monthDate.getMonth() + 1
      const yearNum = monthDate.getFullYear()

      const outputRecord = vatOutputByMonth.find(r => r.taxMonth === monthNum && r.taxYear === yearNum)
      const inputRecord = vatInputByMonth.find(r => r.taxMonth === monthNum && r.taxYear === yearNum)

      monthlyData.push({
        month: months[monthDate.getMonth()],
        vatOutput: (outputRecord?._sum.vatAmount || 0),
        vatInput: (inputRecord?._sum.vatAmount || 0),
        net: (outputRecord?._sum.vatAmount || 0) - (inputRecord?._sum.vatAmount || 0),
      })
    }

    return NextResponse.json({
      success: true,
      monthlyData,
      vatOutputRecords: transformedOutputRecords,
      vatInputRecords: transformedInputRecords,
      totals: {
        vatOutput: totalVatOutput,
        vatInput: totalVatInput,
        netVat,
        outputAmount: totalOutputAmount,
        inputAmount: totalInputAmount,
      },
      summary: {
        outputRecordCount: transformedOutputRecords.length,
        inputRecordCount: transformedInputRecords.length,
      },
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
        error: 'เกิดข้อผิดพลาดในการสร้างรายงานภาษีมูลค่าเพิ่ม',
      },
      { status: 500 }
    )
  }
}
