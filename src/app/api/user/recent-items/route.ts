import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET /api/user/recent-items - Get user's recent items
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const recentItems = await prisma.recentItem.findMany({
      where: { userId: session.user.id },
      orderBy: { accessedAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, items: recentItems })
  } catch (error) {
    console.error('Error fetching recent items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recent items' },
      { status: 500 }
    )
  }
}

// POST /api/user/recent-items - Add a recent item
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { module, recordId, recordName, recordType, action } = body

    // Upsert recent item (update if exists, create if not)
    const recentItem = await prisma.recentItem.upsert({
      where: {
        userId_module_recordId: {
          userId: session.user.id,
          module,
          recordId,
        },
      },
      update: {
        recordName,
        action,
        accessedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        module,
        recordId,
        recordName,
        recordType,
        action,
      },
    })

    return NextResponse.json({ success: true, item: recentItem })
  } catch (error) {
    console.error('Error adding recent item:', error)
    return NextResponse.json(
      { error: 'Failed to add recent item' },
      { status: 500 }
    )
  }
}

// DELETE /api/user/recent-items - Clear all recent items
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.recentItem.deleteMany({
      where: { userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing recent items:', error)
    return NextResponse.json(
      { error: 'Failed to clear recent items' },
      { status: 500 }
    )
  }
}
