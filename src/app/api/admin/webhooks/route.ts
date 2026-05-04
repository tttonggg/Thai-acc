/**
 * Webhook Management API
 * Phase D: API Mastery - Webhooks
 *
 * Endpoints:
 * - GET /api/admin/webhooks - List all webhooks
 * - POST /api/admin/webhooks - Create new webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllWebhooks, createWebhook, WebhookEvents } from '@/lib/services/webhook-service';

// GET /api/admin/webhooks - List all webhooks
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const webhooks = await getAllWebhooks();

    // Transform for response
    const formattedWebhooks = webhooks.map((w) => ({
      id: w.id,
      name: w.name,
      url: w.url,
      events: w.events.split(',').map((e) => e.trim()),
      isActive: w.isActive,
      retryCount: w.retryCount,
      deliveryCount: w._count.deliveries,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: formattedWebhooks,
    });
  } catch (error: unknown) {
    console.error('Error fetching webhooks:', error);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

// POST /api/admin/webhooks - Create new webhook
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.url || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, url, events' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Validate events
    const validEvents = Object.values(WebhookEvents);
    const invalidEvents = body.events.filter((e: string) => !validEvents.includes(e as any));
    if (invalidEvents.length > 0) {
      return NextResponse.json({ error: 'Invalid events', invalidEvents }, { status: 400 });
    }

    const webhook = await createWebhook({
      name: body.name,
      url: body.url,
      events: body.events,
      secret: body.secret,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events: webhook.events.split(',').map((e) => e.trim()),
        isActive: webhook.isActive,
        retryCount: webhook.retryCount,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Error creating webhook:', error);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
