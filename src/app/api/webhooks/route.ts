/**
 * GET /api/webhooks
 * List webhook endpoints
 *
 * POST /api/webhooks
 * Create new webhook endpoint
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createWebhookEndpoint } from '@/lib/webhook-service';

// GET - List webhooks
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const webhooks = await prisma.webhookEndpoint.findMany({
      select: {
        id: true,
        name: true,
        url: true,
        events: true,
        isActive: true,
        retryCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return Response.json({
      success: true,
      data: webhooks.map((w) => ({
        ...w,
        events: w.events.split(','),
      })),
    });
  } catch (error: unknown) {
    console.error('List webhooks error:', error);
    return Response.json({ success: false, error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST - Create webhook
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json({ success: false, error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { name, url, events, retryCount } = body;

    if (!name || !url || !events || !Array.isArray(events)) {
      return Response.json(
        { success: false, error: 'name, url, and events array required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return Response.json({ success: false, error: 'Invalid URL format' }, { status: 400 });
    }

    const result = await createWebhookEndpoint(name, url, events, retryCount);

    return Response.json(
      {
        success: true,
        data: {
          id: result.id,
          secret: result.secret,
          message: 'Webhook created. Save the secret - it will not be shown again.',
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Create webhook error:', error);
    return Response.json({ success: false, error: 'Failed to create webhook' }, { status: 500 });
  }
}
