/**
 * Webhook Service with HMAC Request Signing
 * Secure webhook delivery with signature verification
 */

import { prisma } from './db';
import {
  encrypt,
  decrypt,
  createHmacSignature,
  verifyHmacSignature,
  generateSecureToken,
} from './encryption-service';

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  statusCode?: number;
  error?: string;
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

  const webhook = await prisma.webhookEndpoint.create({
    data: {
      name,
      url,
      secret: encryptedSecret as string,
      events: events.join(','),
      retryCount,
      isActive: true,
    },
  });

  return { id: webhook.id, secret };
}

/**
 * Sign webhook payload
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
 * Deliver webhook to endpoint
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

  // Attempt delivery with retries
  let lastError: string | undefined;

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
        },
        body,
        // 30 second timeout
        signal: AbortSignal.timeout(30000),
      });

      // Record delivery attempt
      await prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: JSON.stringify(data),
          signature,
          responseStatus: response.status,
          responseBody: await response.text(),
          duration: 0,
          success: response.ok,
        },
      });

      if (response.ok) {
        return { success: true, statusCode: response.status };
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
          payload: JSON.stringify(data),
          signature,
          success: false,
          error: lastError,
        },
      });
    }

    // Wait before retry (exponential backoff)
    if (attempt < webhook.retryCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return { success: false, error: lastError };
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
    errorMessage: string | null;
  }>
> {
  const deliveries = await prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { deliveredAt: 'desc' },
    take: limit,
  });

  return deliveries.map((d) => ({
    id: d.id,
    event: d.event,
    success: d.success,
    responseStatus: d.responseStatus,
    deliveredAt: d.deliveredAt,
    retryCount: 0,
    errorMessage: d.error || null,
  }));
}

/**
 * Rotate webhook secret
 */
export async function rotateWebhookSecret(webhookId: string): Promise<string | null> {
  const newSecret = generateSecureToken(32);
  const encryptedSecret = encrypt(newSecret);

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
 * Parse webhook signature header
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
 * Verify timestamped signature
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
 * Webhook event types
 */
export const WebhookEvents = {
  INVOICE: {
    CREATED: 'invoice.created',
    UPDATED: 'invoice.updated',
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
  },
  VENDOR: {
    CREATED: 'vendor.created',
    UPDATED: 'vendor.updated',
  },
  JOURNAL: {
    POSTED: 'journal.posted',
  },
} as const;
