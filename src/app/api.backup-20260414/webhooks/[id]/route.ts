/**
 * GET /api/webhooks/[id]
 * Get webhook details and delivery history
 * 
 * PATCH /api/webhooks/[id]
 * Update webhook
 * 
 * DELETE /api/webhooks/[id]
 * Delete webhook
 */

import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { getWebhookDeliveries, rotateWebhookSecret } from '@/lib/webhook-service'

interface Params {
  params: Promise<{ id: string }>
}

// GET - Get webhook details
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    const webhook = await prisma.webhookEndpoint.findUnique({
      where: { id },
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
    })

    if (!webhook) {
      return Response.json(
        { success: false, error: 'Webhook not found' },
        { status: 404 }
      )
    }

    const deliveries = await getWebhookDeliveries(id, 20)

    return Response.json({
      success: true,
      data: {
        ...webhook,
        events: webhook.events.split(','),
        deliveries,
      },
    })
  } catch (error) {
    console.error('Get webhook error:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch webhook' },
      { status: 500 }
    )
  }
}

// PATCH - Update webhook
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { name, url, events, isActive, retryCount, rotateSecret } = body

    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (events !== undefined) updateData.events = events.join(',')
    if (isActive !== undefined) updateData.isActive = isActive
    if (retryCount !== undefined) updateData.retryCount = retryCount

    const webhook = await prisma.webhookEndpoint.update({
      where: { id },
      data: updateData,
    })

    let newSecret: string | null = null
    if (rotateSecret) {
      newSecret = await rotateWebhookSecret(id)
    }

    return Response.json({
      success: true,
      data: {
        id: webhook.id,
        ...(newSecret && { 
          secret: newSecret,
          message: 'Secret rotated. Save the new secret - it will not be shown again.'
        }),
      },
    })
  } catch (error) {
    console.error('Update webhook error:', error)
    return Response.json(
      { success: false, error: 'Failed to update webhook' },
      { status: 500 }
    )
  }
}

// DELETE - Delete webhook
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return Response.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'ADMIN') {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { id } = await params

    await prisma.webhookEndpoint.delete({
      where: { id },
    })

    return Response.json({
      success: true,
      data: { message: 'Webhook deleted successfully' },
    })
  } catch (error) {
    console.error('Delete webhook error:', error)
    return Response.json(
      { success: false, error: 'Failed to delete webhook' },
      { status: 500 }
    )
  }
}
