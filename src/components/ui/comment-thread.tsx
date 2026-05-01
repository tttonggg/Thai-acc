'use client';

import * as React from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  MessageSquare,
  Reply,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Trash2,
  User,
  FileText,
  Paperclip,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole } from '@prisma/client';

// ============================================
// Types
// ============================================

interface CommentUser {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
}

interface CommentAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface InvoiceComment {
  id: string;
  invoiceId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  parentId: string | null;
  mentions: string[];
  attachments: CommentAttachment[] | null;
  resolved: boolean;
  resolvedAt: Date | null;
  resolvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: CommentUser;
  mentionedUsers?: CommentUser[];
  replies?: InvoiceComment[];
  replyCount?: number;
}

export interface CommentWithUser extends InvoiceComment {
  user: CommentUser;
  mentionedUsers?: CommentUser[];
  replies?: CommentWithUser[];
  replyCount?: number;
}

interface CommentThreadProps {
  comment: CommentWithUser;
  invoiceId: string;
  currentUser: CommentUser;
  onReply?: (parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  level?: number;
  showReplies?: boolean;
}

// ============================================
// Utility Functions
// ============================================

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeVariant(role: UserRole): 'default' | 'secondary' {
  return role === 'ADMIN' ? 'default' : 'secondary';
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    if (hours === 0) {
      const minutes = Math.floor(diffInHours * 60);
      return minutes <= 1 ? 'เมื่อสักครู่' : `${minutes} นาทีที่แล้ว`;
    }
    return `${hours} ชั่วโมงที่แล้ว`;
  } else if (diffInHours < 48) {
    return `วันนี้ ${format(date, 'HH:mm', { locale: th })}`;
  } else if (diffInHours < 24 * 7) {
    const days = Math.floor(diffInHours / 24);
    return `${days} วันที่แล้ว`;
  } else {
    return format(date, 'd MMM yyyy HH:mm', { locale: th });
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function parseMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');

  return lines.map((line, index) => {
    // Bold text **text** or __text__
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Links [text](url)
    line = line.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-primary hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Mentions @username
    line = line.replace(
      /@(\w+)/g,
      '<span class="bg-primary/10 text-primary px-1 rounded font-medium">@$1</span>'
    );

    return (
      <p key={index} className="mb-2 last:mb-0">
        <span dangerouslySetInnerHTML={{ __html: line }} />
      </p>
    );
  });
}

// ============================================
// Sub-Components
// ============================================

function CommentHeader({
  user,
  isInternal,
  resolved,
  createdAt,
  level,
}: {
  user: CommentUser;
  isInternal: boolean;
  resolved: boolean;
  createdAt: Date;
  level: number;
}) {
  return (
    <div className="mb-3 flex items-start gap-3">
      <Avatar className={cn('size-10', level > 0 && 'size-8')}>
        <AvatarImage src={undefined} alt={user.name || user.email} />
        <AvatarFallback className="bg-primary/10 font-semibold text-primary">
          {getInitials(user.name, user.email)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold">{user.name || user.email}</span>
          <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
            {user.role}
          </Badge>
          {isInternal && (
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-xs text-orange-700"
            >
              ภายใน
            </Badge>
          )}
          {resolved && (
            <Badge
              variant="outline"
              className="border-green-200 bg-green-50 text-xs text-green-700"
            >
              <CheckCircle2 className="mr-1 size-3" />
              แก้ไขแล้ว
            </Badge>
          )}
        </div>
        <div className="mt-0.5 text-xs text-muted-foreground">{formatRelativeTime(createdAt)}</div>
      </div>
    </div>
  );
}

function CommentContent({
  content,
  attachments,
}: {
  content: string;
  attachments: CommentAttachment[] | null;
}) {
  return (
    <div className="space-y-3">
      <div className="whitespace-pre-wrap text-sm leading-relaxed">{parseMarkdown(content)}</div>

      {attachments && attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <a
              key={index}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 rounded-lg border bg-muted/50 p-2 transition-colors hover:bg-muted"
            >
              <Paperclip className="size-4 text-muted-foreground group-hover:text-primary" />
              <FileText className="size-4 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium group-hover:text-primary">
                  {attachment.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatFileSize(attachment.size)}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CommentActions({
  comment,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
  level,
  isReplying,
  setIsReplying,
}: {
  comment: CommentWithUser;
  currentUser: CommentUser;
  onReply?: (parentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onDelete?: (commentId: string) => void;
  onResolve?: (commentId: string) => void;
  onUnresolve?: (commentId: string) => void;
  level: number;
  isReplying: boolean;
  setIsReplying: (value: boolean) => void;
}) {
  const canEdit = currentUser.id === comment.userId || currentUser.role === 'ADMIN';
  const canDelete = currentUser.id === comment.userId || currentUser.role === 'ADMIN';
  const canResolve = currentUser.role === 'ADMIN' || currentUser.role === 'ACCOUNTANT';
  const canReply = level < 2; // Max 2 levels of nesting

  const [isLoading, setIsLoading] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);

  const handleAction = async (action: () => void | Promise<void>) => {
    setIsLoading(true);
    try {
      await action();
    } catch (error) {
      console.error('Action error:', error);
    } finally {
      setIsLoading(false);
      setShowMenu(false);
    }
  };

  return (
    <div className="mt-3 flex items-center gap-2 border-t pt-3">
      {canReply && onReply && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => {
            setIsReplying(!isReplying);
            if (!isReplying) {
              onReply(comment.id);
            }
          }}
          disabled={isLoading}
        >
          <Reply className="mr-1 size-3" />
          ตอบกลับ
        </Button>
      )}

      {!comment.resolved && canResolve && onResolve && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-green-700 hover:bg-green-50 hover:text-green-800"
          onClick={() => handleAction(() => onResolve(comment.id))}
          disabled={isLoading}
        >
          <CheckCircle2 className="mr-1 size-3" />
          แก้ไขแล้ว
        </Button>
      )}

      {comment.resolved && canResolve && onUnresolve && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => handleAction(() => onUnresolve(comment.id))}
          disabled={isLoading}
        >
          ยกเลิกการแก้ไข
        </Button>
      )}

      <div className="flex-1" />

      {(canEdit || canDelete) && (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="size-4" />
          </Button>

          {showMenu && (
            <div className="absolute right-0 top-full z-10 mt-1 min-w-[120px] rounded-md border bg-popover shadow-sm">
              {canEdit && onEdit && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => handleAction(() => onEdit(comment.id, comment.content))}
                  disabled={isLoading}
                >
                  <Edit2 className="size-3" />
                  แก้ไข
                </button>
              )}
              {canDelete && onDelete && (
                <button
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-accent"
                  onClick={() => handleAction(() => onDelete(comment.id))}
                  disabled={isLoading}
                >
                  <Trash2 className="size-3" />
                  ลบ
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyForm({
  parentId,
  invoiceId,
  onSubmit,
  onCancel,
}: {
  parentId: string;
  invoiceId: string;
  onSubmit: (content: string) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Reply error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 border-t pt-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="เขียนตอบกลับ..."
        className="min-h-[80px] w-full resize-y rounded-md border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        disabled={isSubmitting}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
          {isSubmitting ? 'กำลังส่ง...' : 'ส่งตอบกลับ'}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={isSubmitting}>
          ยกเลิก
        </Button>
      </div>
    </form>
  );
}

// ============================================
// Main Component
// ============================================

export function CommentThread({
  comment,
  invoiceId,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  onUnresolve,
  level = 0,
  showReplies = true,
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length || comment.replyCount || 0;

  const handleReplySubmit = async (content: string) => {
    if (!onReply) return;

    setIsSubmittingReply(true);
    setError(null);

    try {
      await onReply(content);
      setIsReplying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งตอบกลับ');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className={cn('relative', level > 0 && 'ml-8 border-l-2 border-muted pl-4')}>
      <Card className={cn('overflow-hidden', level > 0 && 'border-muted/50 shadow-none')}>
        <CardContent className="p-4">
          <CommentHeader
            user={comment.user}
            isInternal={comment.isInternal}
            resolved={comment.resolved}
            createdAt={new Date(comment.createdAt)}
            level={level}
          />

          <CommentContent
            content={comment.content}
            attachments={comment.attachments as CommentAttachment[] | null}
          />

          {error && (
            <div className="mt-3 rounded bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <CommentActions
            comment={comment}
            currentUser={currentUser}
            onReply={onReply ? () => {} : undefined}
            onEdit={onEdit}
            onDelete={onDelete}
            onResolve={onResolve}
            onUnresolve={onUnresolve}
            level={level}
            isReplying={isReplying}
            setIsReplying={setIsReplying}
          />

          {isReplying && onReply && (
            <ReplyForm
              parentId={comment.id}
              invoiceId={invoiceId}
              onSubmit={handleReplySubmit}
              onCancel={() => setIsReplying(false)}
            />
          )}
        </CardContent>
      </Card>

      {/* Replies Section */}
      {hasReplies && showReplies && (
        <div className="mt-3 space-y-3">
          {replyCount > 0 && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {isCollapsed ? (
                <>
                  <ChevronDown className="size-3" />
                  แสดง {replyCount} การตอบกลับ
                </>
              ) : (
                <>
                  <ChevronUp className="size-3" />
                  ซ่อน {replyCount} การตอบกลับ
                </>
              )}
            </button>
          )}

          {!isCollapsed &&
            comment.replies?.map((reply) => (
              <CommentThread
                key={reply.id}
                comment={reply}
                invoiceId={invoiceId}
                currentUser={currentUser}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
                level={level + 1}
                showReplies={false} // Don't show nested replies beyond 2 levels
              />
            ))}
        </div>
      )}
    </div>
  );
}
