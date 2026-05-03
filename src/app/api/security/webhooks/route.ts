/**
 * Webhook Management API Routes
 * GET /api/security/webhooks - List webhooks
 * POST /api/security/webhooks - Create webhook
 * PUT /api/security/webhooks/:id - Update webhook
 * DELETE /api/security/webhooks/:id - Delete webhook
 * POST /api/security/webhooks/:id/test - Test webhook
 * POST /api/security/webhooks/:id/rotate - Rotate secret
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole, getClientIp } from '@/lib/api-utils';
import {
  createWebhookEndpoint,
  getWebhookDeliveries,
  rotateWebhookSecret,
  deliverWebhook,
  WebhookEvents,
} from '@/lib/webhook-security';
import { logSecurityEvent } from '@/lib/audit-service';
import { prisma } from '@/lib/db';

// GET - List webhooks
export async function GET(request: NextRequest) {
  try {
    await requireRole(['ADMIN']);

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (id) {
      // Get single webhook with deliveries
      const webhook = await prisma.webhookEndpoint.findUnique({
        where: { id },
        include: {
          deliveries: {
            orderBy: { deliveredAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!webhook) {
        return NextResponse.json({ success: false, error: 'Webhook not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          ...webhook,
          secret: undefined, // Don't expose secret
        },
      });
    }

    // List all webhooks
    const webhooks = await prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: webhooks.map((w) => ({
        ...w,
        secret: undefined, // Don't expose secret
      })),
    });
  } catch (error: any) {
    console.error('Webhooks GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create webhook or perform action
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN']);
    const body = await request.json();
    const { action, id } = body;

    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    if (action === 'create') {
      const { name, url: webhookUrl, events, retryCount } = body;

      if (!name || !webhookUrl || !events) {
        return NextResponse.json(
          { success: false, error: 'Name, URL, and events required' },
          { status: 400 }
        );
      }

      const result = await createWebhookEndpoint(name, webhookUrl, events, retryCount);

      await logSecurityEvent(
        user.id,
        'CREATE' as any,
        { resource: 'webhook', webhookId: result.id },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        data: {
          id: result.id,
          secret: result.secret, // Only show once on creation
        },
      });
    }

    if (action === 'test' && id) {
      const result = await deliverWebhook(id, 'test', { message: 'Test webhook' });

      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    if (action === 'rotate' && id) {
      const newSecret = await rotateWebhookSecret(id);

      if (!newSecret) {
        return NextResponse.json(
          { success: false, error: 'Failed to rotate secret' },
          { status: 500 }
        );
      }

      await logSecurityEvent(
        user.id,
        'UPDATE' as any,
        { resource: 'webhook', webhookId: id, action: 'rotate_secret' },
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        data: { secret: newSecret },
      });
    }

    if (action === 'trigger' && id) {
      const { event, data } = body;

      if (!event) {
        return NextResponse.json({ success: false, error: 'Event required' }, { status: 400 });
      }

      const result = await deliverWebhook(id, event, data || {});

      return NextResponse.json({
        success: result.success,
        data: result,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Webhooks POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update webhook
export async function PUT(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN']);
    const body = await request.json();
    const { id, name, url: webhookUrl, events, isActive, retryCount } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Webhook ID required' }, { status: 400 });
    }

    const webhook = await prisma.webhookEndpoint.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(webhookUrl && { url: webhookUrl }),
        ...(events && { events: events.join(',') }),
        ...(isActive !== undefined && { isActive }),
        ...(retryCount && { retryCount }),
      },
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logSecurityEvent(
      user.id,
      'UPDATE' as any,
      { resource: 'webhook', webhookId: id },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      data: {
        ...webhook,
        secret: undefined,
      },
    });
  } catch (error: any) {
    console.error('Webhooks PUT error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete webhook
export async function DELETE(request: NextRequest) {
  try {
    const user = await requireRole(['ADMIN']);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Webhook ID required' }, { status: 400 });
    }

    await prisma.webhookEndpoint.delete({
      where: { id },
    });

    const ipAddress = getClientIp(request.headers);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    await logSecurityEvent(
      user.id,
      'DELETE' as any,
      { resource: 'webhook', webhookId: id },
      ipAddress,
      userAgent
    );

    return NextResponse.json({
      success: true,
      message: 'Webhook deleted',
    });
  } catch (error: any) {
    console.error('Webhooks DELETE error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
