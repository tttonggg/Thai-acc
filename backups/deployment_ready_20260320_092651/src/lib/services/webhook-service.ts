/**
 * Webhook Service for Thai Accounting ERP
 * Phase D: API Mastery - Webhooks
 * 
 * Features:
 * - Event emission
 * - Retry logic with exponential backoff
 * - HMAC signature verification
 * - Delivery tracking
 */

import { prisma } from '@/lib/db';
import crypto from 'crypto';

// Webhook event types
export const WebhookEvents = {
  // Invoice events
  INVOICE_CREATED: 'INVOICE_CREATED',
  INVOICE_UPDATED: 'INVOICE_UPDATED',
  INVOICE_ISSUED: 'INVOICE_ISSUED',
  INVOICE_PAID: 'INVOICE_PAID',
  INVOICE_VOIDED: 'INVOICE_VOIDED',
  
  // Receipt events
  RECEIPT_CREATED: 'RECEIPT_CREATED',
  RECEIPT_POSTED: 'RECEIPT_POSTED',
  
  // Payment events
  PAYMENT_CREATED: 'PAYMENT_CREATED',
  PAYMENT_POSTED: 'PAYMENT_POSTED',
  
  // Journal events
  JOURNAL_ENTRY_POSTED: 'JOURNAL_ENTRY_POSTED',
  
  // Customer events
  CUSTOMER_CREATED: 'CUSTOMER_CREATED',
  CUSTOMER_UPDATED: 'CUSTOMER_UPDATED',
  
  // Product events
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  
  // Stock events
  STOCK_MOVEMENT: 'STOCK_MOVEMENT',
} as const;

export type WebhookEvent = typeof WebhookEvents[keyof typeof WebhookEvents];

// Webhook payload interface
interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  data: any;
}

// Delivery result
interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  duration: number;
  error?: string;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(
  webhook: {
    id: string;
    url: string;
    secret: string;
  },
  payload: WebhookPayload
): Promise<DeliveryResult> {
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhook.secret);
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': payload.event,
        'X-Webhook-ID': crypto.randomUUID(),
        'X-Webhook-Timestamp': payload.timestamp,
        'User-Agent': 'ThaiAccountingERP-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseBody = await response.text();
    const duration = Date.now() - startTime;

    return {
      success: response.ok,
      statusCode: response.status,
      responseBody: responseBody.slice(0, 10000), // Limit response size
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      success: false,
      duration,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Emit webhook event to all subscribed endpoints
 */
export async function emitWebhookEvent(
  event: WebhookEvent,
  data: any
): Promise<void> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  // Find all active webhooks subscribed to this event
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: {
      isActive: true,
      events: {
        contains: event,
      },
    },
  });

  // Deliver to each webhook (in parallel)
  await Promise.allSettled(
    webhooks.map(async (webhook) => {
      let attempt = 0;
      let success = false;

      while (attempt < webhook.retryCount && !success) {
        attempt++;

        const result = await deliverWebhook(
          { id: webhook.id, url: webhook.url, secret: webhook.secret },
          payload
        );

        success = result.success;

        // Log delivery attempt
        await prisma.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event,
            payload: JSON.stringify(payload),
            responseStatus: result.statusCode,
            responseBody: result.responseBody,
            duration: result.duration,
            success: result.success,
            error: result.error,
          },
        });

        // Update webhook last triggered/error
        await prisma.webhookEndpoint.update({
          where: { id: webhook.id },
          data: {
            updatedAt: new Date(),
          },
        });

        if (!success && attempt < webhook.retryCount) {
          // Wait before retry (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    })
  );
}

/**
 * Create new webhook subscription
 */
export async function createWebhook(data: {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}) {
  const secret = data.secret || crypto.randomBytes(32).toString('hex');

  return prisma.webhookEndpoint.create({
    data: {
      name: data.name,
      url: data.url,
      events: data.events.join(','),
      secret,
      isActive: true,
      retryCount: 3,
    },
  });
}

/**
 * Update webhook subscription
 */
export async function updateWebhook(
  id: string,
  data: Partial<{
    name: string;
    url: string;
    events: string[];
    isActive: boolean;
    retryCount: number;
  }>
) {
  return prisma.webhookEndpoint.update({
    where: { id },
    data: {
      ...data,
      ...(data.events && { events: data.events.join(',') }),
    },
  });
}

/**
 * Delete webhook subscription
 */
export async function deleteWebhook(id: string) {
  return prisma.webhookEndpoint.delete({
    where: { id },
  });
}

/**
 * Get webhook with delivery history
 */
export async function getWebhookWithHistory(id: string) {
  return prisma.webhookEndpoint.findUnique({
    where: { id },
    include: {
      deliveries: {
        orderBy: { deliveredAt: 'desc' },
        take: 50,
      },
    },
  });
}

/**
 * Get all webhooks
 */
export async function getAllWebhooks() {
  return prisma.webhookEndpoint.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { deliveries: true },
      },
    },
  });
}

/**
 * Test webhook endpoint
 */
export async function testWebhook(id: string): Promise<{
  success: boolean;
  statusCode?: number;
  duration: number;
  error?: string;
}> {
  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id },
  });

  if (!webhook) {
    throw new Error('Webhook not found');
  }

  const payload: WebhookPayload = {
    event: 'TEST',
    timestamp: new Date().toISOString(),
    data: { message: 'This is a test webhook from Thai Accounting ERP' },
  };

  const result = await deliverWebhook(
    { id: webhook.id, url: webhook.url, secret: webhook.secret },
    payload
  );

  return {
    success: result.success,
    statusCode: result.statusCode,
    duration: result.duration,
    error: result.error,
  };
}

/**
 * Clean up old webhook deliveries
 */
export async function cleanupOldDeliveries(days: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return prisma.webhookDelivery.deleteMany({
    where: {
      deliveredAt: {
        lt: cutoffDate,
      },
    },
  });
}

/**
 * Get webhook delivery stats
 */
export async function getWebhookStats(webhookId: string) {
  const [total, successful, failed] = await Promise.all([
    prisma.webhookDelivery.count({ where: { webhookId } }),
    prisma.webhookDelivery.count({ where: { webhookId, success: true } }),
    prisma.webhookDelivery.count({ where: { webhookId, success: false } }),
  ]);

  const recentDeliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { deliveredAt: 'desc' },
    take: 10,
    select: {
      event: true,
      success: true,
      duration: true,
      deliveredAt: true,
    },
  });

  return {
    total,
    successful,
    failed,
    successRate: total > 0 ? successful / total : 0,
    recentDeliveries,
  };
}
