// Fixed Assets API (Agent 04: Fixed Assets Engineer - TAS 16)
// Schema-exact: Asset has no description/category/status fields
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth } from '@/lib/api-auth'
import { generateDepreciationSchedule, getAssetNetBookValue } from '@/lib/asset-service'

export async function GET(request: NextRequest) {
  try {
    await requireAuth()
    const assets = await prisma.asset.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    })

    const withNBV = await Promise.all(
      assets.map(async (asset) => {
        const nbv = await getAssetNetBookValue(asset.id)
        return { ...asset, ...nbv }
      })
    )

    return NextResponse.json({ success: true, data: withNBV })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth()
    const body = await request.json()

    const {
      code, name,
      purchaseDate, purchaseCost, salvageValue,
      usefulLifeYears, depreciationRate,
      glAccountId, accumDepAccountId, depExpenseAccountId,
    } = body

    if (!code || !name || !purchaseDate || !purchaseCost || !usefulLifeYears) {
      return NextResponse.json({ success: false, error: 'กรุณากรอกข้อมูลที่จำเป็นครบถ้วน' }, { status: 400 })
    }

    const asset = await prisma.asset.create({
      data: {
        code,
        name,
        purchaseDate: new Date(purchaseDate),
        purchaseCost: parseFloat(purchaseCost),
        salvageValue: parseFloat(salvageValue || '1'),
        usefulLifeYears: parseInt(usefulLifeYears),
        depreciationRate: parseFloat(depreciationRate || String(100 / parseInt(usefulLifeYears))),
        glAccountId,
        accumDepAccountId,
        depExpenseAccountId,
      }
    })

    const { created } = await generateDepreciationSchedule(asset.id)

    return NextResponse.json({
      success: true,
      data: asset,
      scheduleGenerated: created,
    }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
