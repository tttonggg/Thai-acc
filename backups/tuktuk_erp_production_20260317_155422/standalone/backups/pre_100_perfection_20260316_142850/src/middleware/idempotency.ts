/**
 * Idempotency Middleware
 *
 * Prevents duplicate operations by using idempotency keys.
 * For financial operations (receipts, payments, journal entries),
 * the client sends an Idempotency-Key header with a unique value.
 * If the same key is sent again, the original response is returned.
 *
 * Usage:
 * 1. Client generates unique idempotency key (UUID v4)
 * 2. Client includes header: Idempotency-Key: <uuid>
 * 3. Server checks if key was already used
 * 4. If yes, return cached response
 * 5. If no, process request and cache result
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// Idempotency record expiration (24 hours)
const IDEMPOTENCY_EXPIRY_HOURS = 24

interface IdempotencyRecord {
  id: string
  key: string
  endpoint: string
  responseBody: string
  statusCode: number
  createdAt: Date
}

/**
 * Check if an idempotency key exists and return the cached response
 */
export async function checkIdempotency(
  request: NextRequest,
  options?: {
    required?: boolean // Whether idempotency key is required
  }
): Promise<NextResponse | null> {
  const { required = false } = options || {}

  // Get idempotency key from header
  const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')

  // If required and not provided, return error
  if (required && !idempotencyKey) {
    return NextResponse.json(
      {
        success: false,
        error: 'Idempotency-Key header is required for this operation',
        code: 'IDEMPOTENCY_KEY_REQUIRED',
      },
      { status: 400 }
    )
  }

  // If no key provided and not required, skip check
  if (!idempotencyKey) {
    return null
  }

  // Validate idempotency key format (should be UUID)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(idempotencyKey)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Idempotency-Key must be a valid UUID',
        code: 'INVALID_IDEMPOTENCY_KEY',
      },
      { status: 400 }
    )
  }

  // Check if we have a cached response in the database
  // We'll use a simple approach: check each relevant table
  const endpoint = request.nextUrl.pathname

  // Check receipts table
  if (endpoint.includes('/receipts')) {
    const existingReceipt = await prisma.receipt.findUnique({
      where: { idempotencyKey }
    })

    if (existingReceipt) {
      return NextResponse.json(
        {
          success: true,
          data: existingReceipt,
          idempotent: true, // Indicates this is a cached response
          message: 'This request was already processed',
        },
        { status: 200 }
      )
    }
  }

  // Check payments table
  if (endpoint.includes('/payments')) {
    const existingPayment = await prisma.payment.findUnique({
      where: { idempotencyKey }
    })

    if (existingPayment) {
      return NextResponse.json(
        {
          success: true,
          data: existingPayment,
          idempotent: true,
          message: 'This request was already processed',
        },
        { status: 200 }
      )
    }
  }

  // Check journal entries table
  if (endpoint.includes('/journal') || endpoint.includes('/post')) {
    const existingEntry = await prisma.journalEntry.findUnique({
      where: { idempotencyKey }
    })

    if (existingEntry) {
      return NextResponse.json(
        {
          success: true,
          data: existingEntry,
          idempotent: true,
          message: 'This request was already processed',
        },
        { status: 200 }
      )
    }
  }

  // No existing record found, proceed with request
  return null
}

/**
 * Store the result of an idempotent operation
 */
export async function storeIdempotencyResult(
  idempotencyKey: string,
  endpoint: string,
  response: NextResponse
): Promise<void> {
  try {
    // Extract the data from the response
    const responseData = await response.json()

    // Determine which table to update based on endpoint
    if (endpoint.includes('/receipts') && responseData.data?.id) {
      await prisma.receipt.update({
        where: { id: responseData.data.id },
        data: { idempotencyKey }
      })
    } else if (endpoint.includes('/payments') && responseData.data?.id) {
      await prisma.payment.update({
        where: { id: responseData.data.id },
        data: { idempotencyKey }
      })
    } else if ((endpoint.includes('/journal') || endpoint.includes('/post')) && responseData.data?.id) {
      await prisma.journalEntry.update({
        where: { id: responseData.data.id },
        data: { idempotencyKey }
      })
    }
  } catch (error) {
    console.error('Failed to store idempotency result:', error)
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Clean up expired idempotency records
 * This should be run periodically (e.g., via cron job)
 */
export async function cleanupExpiredIdempotencyRecords(): Promise<number> {
  try {
    const expiryDate = new Date()
    expiryDate.setHours(expiryDate.getHours() - IDEMPOTENCY_EXPIRY_HOURS)

    // Reset idempotency keys for old records
    // Note: SQLite doesn't support setting NULL in update easily, so we set to a unique placeholder
    const placeholder = `expired-${Date.now()}`

    const [
      receiptResult,
      paymentResult,
      journalResult,
    ] = await Promise.all([
      prisma.receipt.updateMany({
        where: {
          idempotencyKey: { not: null },
          createdAt: { lt: expiryDate }
        },
        data: { idempotencyKey: placeholder }
      }),
      prisma.payment.updateMany({
        where: {
          idempotencyKey: { not: null },
          createdAt: { lt: expiryDate }
        },
        data: { idempotencyKey: placeholder }
      }),
      prisma.journalEntry.updateMany({
        where: {
          idempotencyKey: { not: null },
          createdAt: { lt: expiryDate }
        },
        data: { idempotencyKey: placeholder }
      }),
    ])

    const totalCleaned = receiptResult.count + paymentResult.count + journalResult.count

    return totalCleaned
  } catch (error) {
    console.error('Failed to cleanup expired idempotency records:', error)
    return 0
  }
}

/**
 * Middleware wrapper for Next.js API routes
 */
export function withIdempotency(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options?: {
    required?: boolean
  }
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Check if this request was already processed
    const cachedResponse = await checkIdempotency(request, options)

    if (cachedResponse) {
      return cachedResponse
    }

    // Process the request
    const response = await handler(request)

    // Store the result if it was successful
    if (response.status === 200 || response.status === 201) {
      const idempotencyKey = request.headers.get('Idempotency-Key') || request.headers.get('idempotency-key')
      if (idempotencyKey) {
        await storeIdempotencyResult(idempotencyKey, request.nextUrl.pathname, response)
      }
    }

    return response
  }
}
