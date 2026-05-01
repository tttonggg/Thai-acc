/**
 * Webhook Security Service
 * Implements HMAC-SHA256 signature verification and retry logic
 */

import { prisma } from './db';
import {
  encrypt,
  decrypt,
  createHmacSignature,
  verifyHmacSignature,
  generateSecureToken,
} from './encryption';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
  retryCount?: number;
}

/**
 * Create a new webhook endpoint
 */
export async function createWebhookEndpoint(
  name: string,
  url: string,
  events: string[],
  retryCount: number = 3
): Promise<{ id: string; secret: string }> {
  const secret = generateSecureToken(32);
  const encryptedSecret = encrypt(secret);

  if (!encryptedSecret) {
    throw new Error('Failed to encrypt webhook secret');
  }

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      name,
      url,
      secret: encryptedSecret,
      events: events.join(','),
      retryCount,
      isActive: true,
    },
  });

  return { id: webhook.id, secret };
}

/**
 * Sign webhook payload with HMAC-SHA256
 */
export function signWebhookPayload(
  payload: WebhookPayload,
  secret: string
): { signature: string; body: string } {
  const body = JSON.stringify(payload);
  const signature = createHmacSignature(body, secret);

  return { signature, body };
}

/**
 * Verify webhook signature (for receiving webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  return verifyHmacSignature(payload, signature, secret);
}

/**
 * Deliver webhook to endpoint with retry logic
 */
export async function deliverWebhook(
  webhookId: string,
  event: string,
  data: Record<string, unknown>
): Promise<WebhookDeliveryResult> {
  const webhook = await prisma.webhookEndpoint.findUnique({
    where: { id: webhookId },
  });

  if (!webhook || !webhook.isActive) {
    return { success: false, error: 'Webhook not found or inactive' };
  }

  const secret = decrypt(webhook.secret);
  if (!secret) {
    return { success: false, error: 'Failed to decrypt webhook secret' };
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const { signature, body } = signWebhookPayload(payload, secret);

  // Attempt delivery with exponential backoff retries
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  for (let attempt = 0; attempt < webhook.retryCount; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhookId,
          'X-Webhook-Attempt': String(attempt + 1),
          'X-Webhook-Timestamp': payload.timestamp,
        },
        body,
        // 30 second timeout
        signal: AbortSignal.timeout(30000),
      });

      lastStatusCode = response.status;

      // Record delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: body,
          responseStatus: response.status,
          responseBody: await response.text(),
          duration: 0, // Would need actual timing
          success: response.ok,
        },
      });

      if (response.ok) {
        return {
          success: true,
          statusCode: response.status,
          retryCount: attempt,
        };
      }

      lastError = `HTTP ${response.status}`;

      // Don't retry 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        break;
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';

      // Record failed delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: body,
          duration: 0,
          success: false,
          error: lastError,
        },
      });
    }

    // Wait before retry (exponential backoff: 1s, 2s, 4s, ...)
    if (attempt < webhook.retryCount - 1) {
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    error: lastError,
    statusCode: lastStatusCode,
    retryCount: webhook.retryCount,
  };
}

/**
 * Get webhook delivery history
 */
export async function getWebhookDeliveries(
  webhookId: string,
  limit: number = 50
): Promise<
  Array<{
    id: string;
    event: string;
    success: boolean;
    responseStatus: number | null;
    deliveredAt: Date;
    retryCount: number;
    error: string | null;
  }>
> {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { deliveredAt: 'desc' },
    take: limit,
  });

  return deliveries.map((d: any) => ({
    id: d.id,
    event: d.event,
    success: d.success,
    responseStatus: d.responseStatus,
    deliveredAt: d.deliveredAt,
    retryCount: 0, // Not tracked in this schema version
    error: d.error,
  }));
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(webhookId: string): Promise<string | null> {
  const newSecret = generateSecureToken(32);
  const encryptedSecret = encrypt(newSecret);

  if (!encryptedSecret) {
    return null;
  }

  try {
    await prisma.webhookEndpoint.update({
      where: { id: webhookId },
      data: { secret: encryptedSecret },
    });
    return newSecret;
  } catch {
    return null;
  }
}

/**
 * Parse webhook signature header (Stripe-style)
 * Format: t=timestamp,v1=signature
 */
export function parseSignatureHeader(header: string): { timestamp: number; signatures: string[] } {
  const parts = header.split(',');
  const result: { timestamp: number; signatures: string[] } = { timestamp: 0, signatures: [] };

  for (const part of parts) {
    const [key, value] = part.split('=');
    if (key === 't') {
      result.timestamp = parseInt(value, 10);
    } else if (key === 'v1') {
      result.signatures.push(value);
    }
  }

  return result;
}

/**
 * Create timestamped signature (Stripe-style)
 */
export function createTimestampedSignature(
  payload: string,
  secret: string,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmacSignature(signedPayload, secret);
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify timestamped signature with tolerance
 */
export function verifyTimestampedSignature(
  payload: string,
  header: string,
  secret: string,
  toleranceSeconds: number = 300 // 5 minute tolerance
): boolean {
  const { timestamp, signatures } = parseSignatureHeader(header);

  // Check timestamp tolerance
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = createHmacSignature(signedPayload, secret);

  return signatures.some((sig) => sig === expectedSignature);
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  event: string,
  data: Record<string, unknown>
): Promise<Array<{ webhookId: string; result: WebhookDeliveryResult }>> {
  const webhooks = await prisma.webhookEndpoint.findMany({
    where: {
      isActive: true,
      events: { contains: event },
    },
  });

  const results = await Promise.all(
    webhooks.map(async (webhook) => {
      const result = await deliverWebhook(webhook.id, event, data);
      return { webhookId: webhook.id, result };
    })
  );

  return results;
}

/**
 * Webhook event types
 */
export const WebhookEvents = {
  INVOICE: {
    CREATED: 'invoice.created',
    UPDATED: 'invoice.updated',
    DELETED: 'invoice.deleted',
    PAID: 'invoice.paid',
    VOIDED: 'invoice.voided',
  },
  PAYMENT: {
    RECEIVED: 'payment.received',
    SENT: 'payment.sent',
  },
  CUSTOMER: {
    CREATED: 'customer.created',
    UPDATED: 'customer.updated',
    DELETED: 'customer.deleted',
  },
  VENDOR: {
    CREATED: 'vendor.created',
    UPDATED: 'vendor.updated',
    DELETED: 'vendor.deleted',
  },
  JOURNAL: {
    POSTED: 'journal.posted',
  },
  RECEIPT: {
    CREATED: 'receipt.created',
    POSTED: 'receipt.posted',
  },
  STOCK: {
    MOVEMENT: 'stock.movement',
    ADJUSTMENT: 'stock.adjustment',
  },
} as const;

/**
 * Validate incoming webhook request
 */
export function validateIncomingWebhook(
  payload: string,
  signature: string,
  secret: string,
  options?: {
    timestampTolerance?: number;
    useTimestampedSignature?: boolean;
  }
): boolean {
  if (options?.useTimestampedSignature) {
    return verifyTimestampedSignature(payload, signature, secret, options.timestampTolerance);
  }
  return verifyWebhookSignature(payload, signature, secret);
}
