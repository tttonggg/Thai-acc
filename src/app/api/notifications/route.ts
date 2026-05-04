import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
        ...(unreadOnly && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    });
  } catch (error: unknown) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// POST /api/notifications - Create notification (admin/system only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, type, title, message, module, recordId, actionUrl, metadata } = body;

    const notification = await prisma.notification.create({
      data: {
        userId: userId || session.user.id,
        type: type || 'INFO',
        title,
        message,
        module,
        recordId,
        actionUrl,
        metadata,
      },
    });

    return NextResponse.json({ success: true, notification });
  } catch (error: unknown) {
    console.error('Error creating notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

// DELETE /api/notifications - Clear all notifications
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json({ error: 'Failed to clear notifications' }, { status: 500 });
  }
}
