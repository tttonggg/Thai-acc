import { db } from '@/lib/db';
import { z } from 'zod';
import { invoiceCommentSchema, updateInvoiceCommentSchema } from '@/lib/validations';
import { apiResponse, notFoundError, apiError } from '@/lib/api-utils';
import { requireAuth } from '@/lib/api-utils';

// GET /api/invoices/[id]/comments - List comments with threading
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if invoice exists
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // IDOR Protection: Check ownership - only ADMIN can access any invoice
    if (user.role !== 'ADMIN' && invoice.createdById && invoice.createdById !== user.id) {
      return apiError('ไม่มีสิทธิ์เข้าถึงข้อมูล', 403);
    }

    // Parse query parameters
    const url = new URL(request.url);
    const includeResolved = url.searchParams.get('includeResolved') !== 'false';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Fetch comments with threading support
    const comments = await db.invoiceComment.findMany({
      where: {
        invoiceId: id,
        parentId: null, // Only top-level comments
        // Hide internal comments from non-ADMIN users
        ...(user.role !== 'ADMIN' ? { isInternal: false } : {}),
        // Filter resolved comments if requested
        ...(includeResolved === false ? { resolved: false } : {}),
      },
      include: {
        replies: {
          include: {
            replies: true, // Support 2-level threading
          },
          orderBy: { createdAt: 'asc' },
        },
        invoice: {
          select: {
            invoiceNo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(limit, 100),
    });

    // Fetch user details for each comment
    const commentsWithUsers = await Promise.all(
      comments.map(async (comment) => {
        const commentUser = await db.user.findUnique({
          where: { id: comment.userId },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

        // Fetch mentioned users
        const mentionedUsers = await Promise.all(
          (comment.mentions || []).map(async (userId) => {
            const u = await db.user.findUnique({
              where: { id: userId },
              select: { id: true, name: true, email: true },
            });
            return u;
          })
        );

        return {
          ...comment,
          user: commentUser,
          mentionedUsers: mentionedUsers.filter(Boolean),
          replyCount: comment.replies.length,
        };
      })
    );

    return apiResponse({
      comments: commentsWithUsers,
      pagination: {
        limit,
        count: commentsWithUsers.length,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการดึงข้อมูลคอมเมนต์');
  }
}

// POST /api/invoices/[id]/comments - Add comment with threading, mentions, and attachments
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if invoice exists
    const invoice = await db.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return notFoundError('ไม่พบใบกำกับภาษี');
    }

    // IDOR Protection: Check ownership - only ADMIN can comment on any invoice
    if (user.role !== 'ADMIN' && invoice.createdById && invoice.createdById !== user.id) {
      return apiError('ไม่มีสิทธิ์แสดงความคิดเห็น', 403);
    }

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์แสดงความคิดเห็น', 403);
    }

    const body = await request.json();

    // VIEWER cannot add internal comments
    if (body.isInternal && user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์เพิ่มความคิดเห็นภายใน', 403);
    }

    const validatedData = invoiceCommentSchema.parse(body);

    // If parentId is provided, check if parent comment exists
    if (validatedData.parentId) {
      const parentComment = await db.invoiceComment.findUnique({
        where: { id: validatedData.parentId },
        select: { id: true, invoiceId: true },
      });

      if (!parentComment || parentComment.invoiceId !== id) {
        return apiError('ไม่พบความคิดเห็นหลัก', 404);
      }
    }

    // Get client IP for audit log
    const clientIp = getClientIp(request.headers);

    // Create comment with transaction
    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.invoiceComment.create({
        data: {
          invoiceId: id,
          userId: user.id,
          content: validatedData.content,
          isInternal: validatedData.isInternal,
          parentId: validatedData.parentId,
          mentions: validatedData.mentions || [],
          attachments: validatedData.attachments,
          resolved: validatedData.resolved || false,
        },
        include: {
          invoice: {
            select: {
              invoiceNo: true,
            },
          },
        },
      });

      // Create notifications for mentions
      if (validatedData.mentions && validatedData.mentions.length > 0) {
        await tx.commentNotification.createMany({
          data: validatedData.mentions.map((userId) => ({
            userId,
            commentId: newComment.id,
            invoiceId: id,
            type: 'MENTION',
          })),
        });
      }

      // If this is a reply, notify parent comment author
      if (validatedData.parentId) {
        const parentComment = await tx.invoiceComment.findUnique({
          where: { id: validatedData.parentId },
          select: { userId: true },
        });

        if (parentComment && parentComment.userId !== user.id) {
          await tx.commentNotification.create({
            data: {
              userId: parentComment.userId,
              commentId: newComment.id,
              invoiceId: id,
              type: 'REPLY',
            },
          });
        }
      }

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'CREATE',
          entityType: 'InvoiceComment',
          entityId: newComment.id,
          afterState: {
            content: newComment.content,
            isInternal: newComment.isInternal,
            parentId: newComment.parentId,
          },
          ipAddress: clientIp,
        },
      });

      return newComment;
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'COMMENT',
        module: 'invoices',
        recordId: id,
        details: {
          commentId: comment.id,
          isInternal: comment.isInternal,
          parentId: comment.parentId,
          mentions: comment.mentions?.length || 0,
        },
        status: 'success',
      },
    });

    // Return comment with user info
    const commentWithUser = {
      ...comment,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };

    return apiResponse(commentWithUser);
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    if (error instanceof z.ZodError) {
      return apiError('ข้อมูลไม่ถูกต้อง: ' + error.issues[0].message);
    }
    return apiError('เกิดข้อผิดพลาดในการเพิ่มคอมเมนต์');
  }
}
