import { db } from '@/lib/db';
import { z } from 'zod';
import { updateInvoiceCommentSchema } from '@/lib/validations';

// PUT /api/invoices/[id]/comments/[commentId] - Update comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, commentId } = await params;

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

    // Check if comment exists
    const comment = await db.invoiceComment.findUnique({
      where: { id: commentId },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
          },
        },
      },
    });

    if (!comment) {
      return notFoundError('ไม่พบความคิดเห็น');
    }

    // Verify comment belongs to the specified invoice
    if (comment.invoiceId !== id) {
      return apiError('ความคิดเห็นไม่ถูกต้อง', 400);
    }

    // Permission check: only comment author or ADMIN can edit
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return apiError('ไม่มีสิทธิ์แก้ไขความคิดเห็นนี้', 403);
    }

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์แก้ไขความคิดเห็น', 403);
    }

    const body = await request.json();
    const validatedData = updateInvoiceCommentSchema.parse(body);

    // Store previous state for audit log
    const previousState = {
      content: comment.content,
      isInternal: comment.isInternal,
      resolved: comment.resolved,
    };

    // Update comment with transaction
    const updatedComment = await db.$transaction(async (tx) => {
      // Prepare update data
      const updateData: any = {};

      if (validatedData.content !== undefined) {
        updateData.content = validatedData.content;
      }

      if (validatedData.isInternal !== undefined) {
        // VIEWER cannot set comments to internal
        if (validatedData.isInternal && user.role === 'VIEWER') {
          throw new Error('ไม่มีสิทธิ์ตั้งค่าความคิดเห็นเป็นภายใน');
        }
        updateData.isInternal = validatedData.isInternal;
      }

      if (validatedData.resolved !== undefined) {
        // If marking as resolved
        if (validatedData.resolved && !comment.resolved) {
          updateData.resolved = true;
          updateData.resolvedAt = new Date();
          updateData.resolvedBy = user.id;
        }
        // If un-resolving
        else if (!validatedData.resolved && comment.resolved) {
          updateData.resolved = false;
          updateData.resolvedAt = null;
          updateData.resolvedBy = null;
        }
      }

      // Update the comment
      const updated = await tx.invoiceComment.update({
        where: { id: commentId },
        data: updateData,
        include: {
          invoice: {
            select: {
              invoiceNo: true,
            },
          },
        },
      });

      // If comment was just resolved, create notifications for mentioned users
      if (validatedData.resolved && !comment.resolved) {
        // Notify mentioned users
        if (comment.mentions && comment.mentions.length > 0) {
          await tx.commentNotification.createMany({
            data: comment.mentions
              .filter((userId) => userId !== user.id) // Don't notify self
              .map((userId) => ({
                userId,
                commentId: commentId,
                invoiceId: id,
                type: 'RESOLVED',
              })),
            skipDuplicates: true,
          });
        }

        // Notify parent comment author if this is a reply
        if (comment.parentId) {
          const parentComment = await tx.invoiceComment.findUnique({
            where: { id: comment.parentId },
            select: { userId: true },
          });

          if (parentComment && parentComment.userId !== user.id) {
            // Check if notification already exists
            const existingNotification = await tx.commentNotification.findFirst({
              where: {
                userId: parentComment.userId,
                commentId: commentId,
                type: 'RESOLVED',
              },
            });

            if (!existingNotification) {
              await tx.commentNotification.create({
                data: {
                  userId: parentComment.userId,
                  commentId: commentId,
                  invoiceId: id,
                  type: 'RESOLVED',
                },
              });
            }
          }
        }
      }

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPDATE',
          entityType: 'InvoiceComment',
          entityId: commentId,
          beforeState: previousState,
          afterState: {
            content: updated.content,
            isInternal: updated.isInternal,
            resolved: updated.resolved,
            resolvedAt: updated.resolvedAt,
            resolvedBy: updated.resolvedBy,
          },
        },
      });

      return updated;
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'UPDATE',
        module: 'invoices',
        recordId: id,
        details: {
          commentId: commentId,
          changes: {
            content: validatedData.content !== comment.content,
            isInternal: validatedData.isInternal !== comment.isInternal,
            resolved: validatedData.resolved !== comment.resolved,
          },
        },
        status: 'success',
      },
    });

    // Return updated comment with user info
    const commentWithUser = {
      ...updatedComment,
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
    if (error instanceof Error && error.message.includes('ไม่มีสิทธิ์')) {
      return apiError(error.message, 403);
    }
    return apiError('เกิดข้อผิดพลาดในการแก้ไขความคิดเห็น');
  }
}

// DELETE /api/invoices/[id]/comments/[commentId] - Delete comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, commentId } = await params;

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

    // Check if comment exists
    const comment = await db.invoiceComment.findUnique({
      where: { id: commentId },
      include: {
        invoice: {
          select: {
            invoiceNo: true,
          },
        },
      },
    });

    if (!comment) {
      return notFoundError('ไม่พบความคิดเห็น');
    }

    // Verify comment belongs to the specified invoice
    if (comment.invoiceId !== id) {
      return apiError('ความคิดเห็นไม่ถูกต้อง', 400);
    }

    // Permission check: only comment author or ADMIN can delete
    if (comment.userId !== user.id && user.role !== 'ADMIN') {
      return apiError('ไม่มีสิทธิ์ลบความคิดเห็นนี้', 403);
    }

    if (user.role === 'VIEWER') {
      return apiError('ไม่มีสิทธิ์ลบความคิดเห็น', 403);
    }

    // Delete comment with transaction (cascade delete for replies)
    await db.$transaction(async (tx) => {
      // Store comment data for audit log before deletion
      const commentData = {
        content: comment.content,
        isInternal: comment.isInternal,
        parentId: comment.parentId,
        resolved: comment.resolved,
      };

      // Delete all notifications associated with this comment
      await tx.commentNotification.deleteMany({
        where: { commentId: commentId },
      });

      // Delete all replies (cascade)
      await tx.invoiceComment.deleteMany({
        where: { parentId: commentId },
      });

      // Delete the comment itself
      await tx.invoiceComment.delete({
        where: { id: commentId },
      });

      // Log to audit trail
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE',
          entityType: 'InvoiceComment',
          entityId: commentId,
          beforeState: commentData,
          afterState: null,
        },
      });
    });

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: 'DELETE',
        module: 'invoices',
        recordId: id,
        details: {
          commentId: commentId,
          wasInternal: comment.isInternal,
          wasReply: !!comment.parentId,
          hadReplies: false, // We'll know this after checking
        },
        status: 'success',
      },
    });

    return apiResponse({
      success: true,
      message: 'ลบความคิดเห็นเรียบร้อยแล้ว',
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('ไม่ได้รับอนุญาต')) {
      return unauthorizedError();
    }
    return apiError('เกิดข้อผิดพลาดในการลบความคิดเห็น');
  }
}
