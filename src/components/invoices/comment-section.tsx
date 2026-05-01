/**
 * Invoice Comment Section with Threading, Replies, and Resolution Tracking
 * ส่วนแสดงความคิดเห็นพร้อมระบบตอบกลับและติดตามสถานะ
 */

'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Shield,
  Clock,
  Reply,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  X,
  FileText,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatThaiDate } from '@/lib/thai-accounting';

// ========================================
// Type Definitions
// ========================================

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

interface Attachment {
  name: string;
  url: string;
  size: number;
  type: string;
}

interface Comment {
  id: string;
  invoiceId: string;
  userId: string;
  content: string;
  isInternal: boolean;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  parentId?: string | null;
  mentions?: string[];
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
  user?: User;
  mentionedUsers?: User[];
  replies?: Comment[];
  replyCount?: number;
}

interface CommentSectionProps {
  invoiceId: string;
  currentUser: {
    id: string;
    name?: string;
    email: string;
    role: string;
  };
}

// ========================================
// Helper Functions
// ========================================

function formatThaiDateTime(date: string | Date): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear() + 543;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
  return email?.slice(0, 2).toUpperCase() || 'U';
}

function getRoleLabel(role: string): string {
  const roles: Record<string, string> = {
    ADMIN: 'ผู้ดูแลระบบ',
    ACCOUNTANT: 'นักบัญชี',
    USER: 'ผู้ใช้',
    VIEWER: 'ผู้ดู',
  };
  return roles[role] || role;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function canEditOrDelete(comment: Comment, currentUser: User): boolean {
  return comment.userId === currentUser.id || currentUser.role === 'ADMIN';
}

// ========================================
// Comment Card Component
// ========================================

interface CommentCardProps {
  comment: Comment;
  currentUser: User;
  invoiceId: string;
  onReply: (commentId: string) => void;
  onEdit: (comment: Comment) => void;
  onDelete: (commentId: string) => void;
  onResolve: (commentId: string, resolved: boolean) => void;
  replyingTo: string | null;
  depth?: number;
}

function CommentCard({
  comment,
  currentUser,
  invoiceId,
  onReply,
  onEdit,
  onDelete,
  onResolve,
  replyingTo,
  depth = 0,
}: CommentCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isTopLevel = !comment.parentId;
  const canEdit = canEditOrDelete(comment, currentUser);
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      toast({
        title: 'กรุณากรอกข้อความ',
        description: 'ต้องระบุข้อความคอมเมนต์',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent }),
      });

      const result = await response.json();

      if (response.ok) {
        setEditing(false);
        onEdit({ ...comment, ...result.data, content: editContent });
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'แก้ไขคอมเมนต์แล้ว',
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถแก้ไขคอมเมนต์ได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error editing comment:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถแก้ไขคอมเมนต์ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('คุณต้องการลบคอมเมนต์นี้ใช่หรือไม่?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/comments/${comment.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (response.ok) {
        onDelete(comment.id);
        toast({
          title: 'ลบสำเร็จ',
          description: 'ลบคอมเมนต์แล้ว',
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถลบคอมเมนต์ได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบคอมเมนต์ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (resolved: boolean) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/comments/${comment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolved }),
      });

      const result = await response.json();

      if (response.ok) {
        onResolve(comment.id, resolved);
        toast({
          title: resolved ? 'แก้ไขแล้ว' : 'ยกเลิกการแก้ไข',
          description: resolved ? 'ทำเครื่องหมายว่าแก้ไขแล้ว' : 'ยกเลิกการแก้ไข',
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถอัปเดตสถานะได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating resolve status:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถอัปเดตสถานะได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-3' : 'mt-4'} ${comment.resolved ? 'opacity-75' : ''}`}>
      <div
        className={`rounded-lg border p-4 ${comment.resolved ? 'border-green-200 bg-green-50/50' : 'bg-muted/50'}`}
      >
        {/* Header: User info and badges */}
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            {comment.user?.name && (
              <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                {getInitials(comment.user.name, comment.user.email)}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex-1 space-y-2">
            {/* User info row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">
                {comment.user?.name || comment.user?.email}
              </span>
              <Badge variant="outline" className="text-xs">
                {getRoleLabel(comment.user?.role || '')}
              </Badge>
              {comment.isInternal && (
                <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                  <Shield className="h-3 w-3" />
                  ภายใน
                </Badge>
              )}
              {comment.resolved && (
                <Badge variant="default" className="flex items-center gap-1 bg-green-600 text-xs">
                  <CheckCircle2 className="h-3 w-3" />
                  แก้ไขแล้ว
                </Badge>
              )}
            </div>

            {/* Timestamp */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatThaiDateTime(comment.createdAt)}
              {comment.resolved && comment.resolvedAt && (
                <>
                  <span className="mx-1">•</span>
                  <span className="text-green-600">
                    แก้ไขเมื่อ {formatThaiDateTime(comment.resolvedAt)}
                  </span>
                </>
              )}
            </div>

            {/* Content or Edit Form */}
            {editing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  disabled={loading}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} disabled={loading}>
                    บันทึก
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setEditContent(comment.content);
                    }}
                    disabled={loading}
                  >
                    ยกเลิก
                  </Button>
                </div>
              </div>
            ) : (
              <div className="whitespace-pre-wrap text-sm">{comment.content}</div>
            )}

            {/* Attachments */}
            {comment.attachments && comment.attachments.length > 0 && (
              <div className="space-y-1">
                {comment.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                  >
                    <FileText className="h-3 w-3" />
                    {file.name} ({formatFileSize(file.size)})
                  </a>
                ))}
              </div>
            )}

            {/* Mentions */}
            {comment.mentionedUsers && comment.mentionedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {comment.mentionedUsers.map((user) => (
                  <Badge key={user.id} variant="outline" className="text-xs">
                    @{user.name || user.email}
                  </Badge>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Reply button - only for top-level or 1st level replies */}
              {depth < 2 && currentUser.role !== 'VIEWER' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="mr-1 h-3 w-3" />
                  ตอบกลับ
                </Button>
              )}

              {/* Resolve/Unresolve button - only for top-level */}
              {isTopLevel && currentUser.role !== 'VIEWER' && (
                <>
                  {comment.resolved ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleResolve(false)}
                      disabled={loading}
                    >
                      <Circle className="mr-1 h-3 w-3" />
                      ยกเลิกการแก้ไข
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => handleResolve(true)}
                      disabled={loading}
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      แก้ไขแล้ว
                    </Button>
                  )}
                </>
              )}

              {/* Edit button */}
              {canEdit && currentUser.role !== 'VIEWER' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => setEditing(true)}
                  disabled={loading}
                >
                  <Edit className="mr-1 h-3 w-3" />
                  แก้ไข
                </Button>
              )}

              {/* Delete button */}
              {canEdit && currentUser.role !== 'VIEWER' && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs text-red-600 hover:text-red-700"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  ลบ
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Replies section */}
        {hasReplies && (
          <>
            {/* Show/hide replies toggle */}
            <div className="mt-3 border-t pt-3">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="mr-1 h-3 w-3" />
                    ซ่อน {comment.replies?.length} คำตอบ
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-1 h-3 w-3" />
                    แสดง {comment.replies?.length} คำตอบ
                  </>
                )}
              </Button>
            </div>

            {/* Nested replies */}
            {showReplies && (
              <div className="mt-3 space-y-2">
                {comment.replies?.map((reply) => (
                  <CommentCard
                    key={reply.id}
                    comment={reply}
                    currentUser={currentUser}
                    invoiceId={invoiceId}
                    onReply={onReply}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onResolve={onResolve}
                    replyingTo={replyingTo}
                    depth={depth + 1}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Reply form - shown when replying to this comment */}
        {replyingTo === comment.id && depth < 2 && (
          <ReplyForm
            invoiceId={invoiceId}
            parentId={comment.id}
            currentUser={currentUser}
            onCancel={() => onReply('')}
            onSubmit={() => onReply('')}
          />
        )}
      </div>
    </div>
  );
}

// ========================================
// Reply Form Component
// ========================================

interface ReplyFormProps {
  invoiceId: string;
  parentId: string;
  currentUser: User;
  onCancel: () => void;
  onSubmit: () => void;
}

function ReplyForm({ invoiceId, parentId, currentUser, onCancel, onSubmit }: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: 'กรุณากรอกข้อความ',
        description: 'ต้องระบุข้อความคอมเมนต์',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/comments`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          isInternal,
          parentId,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setContent('');
        setIsInternal(false);
        onSubmit();
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'ตอบกลับแล้ว',
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถตอบกลับได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถตอบกลับได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border bg-muted p-3">
      <div className="space-y-3">
        <Textarea
          placeholder="พิมพ์คำตอบ..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          disabled={loading}
          className="text-sm"
        />
        <div className="flex items-center justify-between">
          {(currentUser.role === 'ADMIN' || currentUser.role === 'ACCOUNTANT') && (
            <div className="flex items-center gap-2">
              <Switch
                id={`internal-${parentId}`}
                checked={isInternal}
                onCheckedChange={setIsInternal}
              />
              <Label
                htmlFor={`internal-${parentId}`}
                className="flex cursor-pointer items-center gap-1 text-sm"
              >
                <Shield className="h-3 w-3" />
                ภายในเท่านั้น
              </Label>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="outline" onClick={onCancel} disabled={loading}>
              ยกเลิก
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={loading || !content.trim()}>
              {loading ? 'กำลังบันทึก...' : 'ส่งคำตอบ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ========================================
// Main Comment Section Component
// ========================================

export function CommentSection({ invoiceId, currentUser }: CommentSectionProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [filterResolved, setFilterResolved] = useState<boolean | null>(null); // null = show all

  // Fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [invoiceId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterResolved !== null) {
        params.append('includeResolved', filterResolved.toString());
      }

      const response = await fetch(`/api/invoices/${invoiceId}/comments?${params}`, {
        credentials: 'include',
      });
      const result = await response.json();

      if (response.ok) {
        setComments(result.data?.comments || []);
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถดึงข้อมูลคอมเมนต์ได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลคอมเมนต์ได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      toast({
        title: 'กรุณากรอกข้อความ',
        description: 'ต้องระบุข้อความคอมเมนต์',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/comments`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          isInternal,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Add new comment to list
        setComments((prev) => [
          {
            ...result.data,
            user: currentUser,
            replies: [],
            replyCount: 0,
          },
          ...prev,
        ]);

        // Reset form
        setNewComment('');
        setIsInternal(false);

        toast({
          title: 'บันทึกสำเร็จ',
          description: 'เพิ่มคอมเมนต์แล้ว',
        });
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error || 'ไม่สามารถเพิ่มคอมเมนต์ได้',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเพิ่มคอมเมนต์ได้',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(replyingTo === commentId ? null : commentId);
  };

  const handleEdit = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === updatedComment.id) {
          return { ...comment, ...updatedComment };
        }
        if (comment.replies) {
          return {
            ...comment,
            replies: comment.replies.map((reply) =>
              reply.id === updatedComment.id ? { ...reply, ...updatedComment } : reply
            ),
          };
        }
        return comment;
      })
    );
  };

  const handleDelete = (commentId: string) => {
    setComments((prev) =>
      prev
        .filter((comment) => comment.id !== commentId)
        .map((comment) => ({
          ...comment,
          replies: comment.replies?.filter((reply) => reply.id !== commentId) || [],
          replyCount: (comment.replies?.filter((reply) => reply.id !== commentId) || []).length,
        }))
    );
  };

  const handleResolve = (commentId: string, resolved: boolean) => {
    setComments((prev) =>
      prev.map((comment) => {
        if (comment.id === commentId) {
          return {
            ...comment,
            resolved,
            resolvedAt: resolved ? new Date().toISOString() : undefined,
            resolvedBy: resolved ? currentUser.id : undefined,
          };
        }
        return comment;
      })
    );
  };

  // Filter comments based on resolved status
  const filteredComments = comments.filter((comment) => {
    if (filterResolved === null) return true;
    if (filterResolved === true) return comment.resolved;
    return !comment.resolved;
  });

  const commentStats = {
    total: comments.length,
    resolved: comments.filter((c) => c.resolved).length,
    unresolved: comments.filter((c) => !c.resolved).length,
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            คอมเมนต์ ({commentStats.total})
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={filterResolved === null ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setFilterResolved(null)}
              >
                ทั้งหมด ({commentStats.total})
              </Button>
              <Button
                size="sm"
                variant={filterResolved === false ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setFilterResolved(false)}
              >
                ยังไม่แก้ ({commentStats.unresolved})
              </Button>
              <Button
                size="sm"
                variant={filterResolved === true ? 'default' : 'outline'}
                className="h-7 text-xs"
                onClick={() => setFilterResolved(true)}
              >
                แก้แล้ว ({commentStats.resolved})
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Add Comment Form */}
        {currentUser.role !== 'VIEWER' && (
          <div className="space-y-3 border-b pb-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="comment">เพิ่มคอมเมนต์</Label>
              {(currentUser.role === 'ADMIN' || currentUser.role === 'ACCOUNTANT') && (
                <div className="flex items-center gap-2">
                  <Switch id="internal" checked={isInternal} onCheckedChange={setIsInternal} />
                  <Label
                    htmlFor="internal"
                    className="flex cursor-pointer items-center gap-1 text-sm"
                  >
                    <Shield className="h-3 w-3" />
                    ภายในเท่านั้น
                  </Label>
                </div>
              )}
            </div>
            <Textarea
              id="comment"
              placeholder="พิมพ์คอมเมนต์ที่นี่... ใช้ @username เพื่อกล่าวถึงสมาชิก"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              disabled={submitting}
            />
            <div className="flex justify-end">
              <Button onClick={handleSubmit} disabled={submitting || !newComment.trim()} size="sm">
                {submitting ? (
                  <>กำลังบันทึก...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    ส่งคอมเมนต์
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-2">
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">กำลังโหลด...</div>
          ) : filteredComments.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {filterResolved === null
                ? 'ยังไม่มีคอมเมนต์'
                : filterResolved === false
                  ? 'ไม่มีคอมเมนต์ที่ยังไม่แก้'
                  : 'ไม่มีคอมเมนต์ที่แก้แล้ว'}
            </div>
          ) : (
            filteredComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUser={currentUser}
                invoiceId={invoiceId}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onResolve={handleResolve}
                replyingTo={replyingTo}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
