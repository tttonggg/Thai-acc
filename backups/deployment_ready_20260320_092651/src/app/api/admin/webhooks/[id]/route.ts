/**
 * Webhook Detail API
 * Phase D: API Mastery - Webhooks
 * 
 * Endpoints:
 * - GET /api/admin/webhooks/[id] - Get webhook details with history
 * - PUT /api/admin/webhooks/[id] - Update webhook
 * - DELETE /api/admin/webhooks/[id] - Delete webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import {
  getWebhookWithHistory,
  updateWebhook,
  deleteWebhook,
  getWebhookStats,
} from '@/lib/services/webhook-service';

// GET /api/admin/webhooks/[id] - Get webhook details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const webhook = await getWebhookWithHistory(id);

    if (!webhook) {
      return NextResponse.json(
        { error: 'Webhook not found' },
        { status: 404 }
      );
    }

    const stats = await getWebhookStats(id);

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events.split(',').map(e => e.trim()),
        isActive: webhook.isActive,
        retryCount: webhook.retryCount,
        createdAt: webhook.createdAt,
        updatedAt: webhook.updatedAt,
        stats,
        deliveries: webhook.deliveries.map(d => ({
          id: d.id,
          event: d.event,
          success: d.success,
          duration: d.duration,
          responseStatus: d.responseStatus,
          deliveredAt: d.deliveredAt,
          error: d.errorMessage,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching webhook:', error);
    return NextResponse.json(
      { error: 'Failed to fetch webhook' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/webhooks/[id] - Update webhook
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();

    // Validate URL if provided
    if (body.url) {
      try {
        new URL(body.url);
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL' },
          { status: 400 }
        );
      }
    }

    const webhook = await updateWebhook(id, {
      name: body.name,
      url: body.url,
      events: body.events,
      isActive: body.isActive,
      retryCount: body.retryCount,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events.split(',').map(e => e.trim()),
        isActive: webhook.isActive,
        retryCount: webhook.retryCount,
        updatedAt: webhook.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating webhook:', error);
    return NextResponse.json(
      { error: 'Failed to update webhook' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/webhooks/[id] - Delete webhook
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    await deleteWebhook(id);

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to delete webhook' },
      { status: 500 }
    );
  }
}
