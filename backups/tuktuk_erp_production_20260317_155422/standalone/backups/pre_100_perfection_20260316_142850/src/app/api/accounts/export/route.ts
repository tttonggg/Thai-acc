import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' }
    })

    // Create CSV content
    const headers = 'code,name,type,isDetail\n'
    const rows = accounts.map((a: any) => 
      `${a.code},"${a.name}",${a.type},${a.isDetail}`
    ).join('\n')

    const csv = headers + rows

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to export accounts' 
    }, { status: 500 })
  }
}
