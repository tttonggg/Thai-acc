'use client';

import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Paperclip, Mail, Lock, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CommentFormData {
  content: string;
  isInternal: boolean;
  attachments?: File[];
  mentions?: string[];
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface CommentInputProps {
  onSubmit: (data: CommentFormData) => Promise<void>;
  onCancel?: () => void;
  initialContent?: string;
  placeholder?: string;
  allowInternal?: boolean;
  allowAttachments?: boolean;
  allowMentions?: boolean;
  submitLabel?: string;
  showInternalToggle?: boolean;
  autoFocus?: boolean;
  users?: User[];
}

export function CommentInput({
  onSubmit,
  onCancel,
  initialContent = '',
  placeholder = 'เขียนความคิดเห็น...',
  allowInternal = true,
  allowAttachments = true,
  allowMentions = true,
  submitLabel = 'ส่งความคิดเห็น',
  showInternalToggle = true,
  autoFocus = false,
  users = [],
}: CommentInputProps) {
  const [content, setContent] = React.useState(initialContent);
  const [isInternal, setIsInternal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [mentions, setMentions] = React.useState<string[]>([]);
  const [showMentionPopover, setShowMentionPopover] = React.useState(false);
  const [mentionQuery, setMentionQuery] = React.useState('');
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const [cursorPosition, setCursorPosition] = React.useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Focus textarea on mount if autoFocus is true
  React.useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Update content when initialContent changes
  React.useEffect(() => {
    setContent(initialContent);
  }, [initialContent]);

  const filteredUsers = React.useMemo(() => {
    if (!mentionQuery) return [];
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(mentionQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(mentionQuery.toLowerCase())
    );
  }, [mentionQuery, users]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setCursorPosition(e.target.selectionStart);

    // Check for @mention trigger
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newContent.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch && allowMentions) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionPopover(true);
      setMentionIndex(0);
    } else {
      setShowMentionPopover(false);
      setMentionQuery('');
    }
  };

  const handleMentionSelect = (user: User) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    const newContent =
      textBeforeCursor.substring(0, lastAtIndex) + `@${user.name}` + textAfterCursor;

    setContent(newContent);
    setMentions([...mentions, user.id]);
    setShowMentionPopover(false);
    setMentionQuery('');

    // Focus textarea and move cursor after the mention
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = lastAtIndex + user.name.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionPopover) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setMentionIndex((prev) => (prev + 1) % filteredUsers.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setMentionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredUsers[mentionIndex]) {
        handleMentionSelect(filteredUsers[mentionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowMentionPopover(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    // Reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        content: content.trim(),
        isInternal,
        attachments: attachments.length > 0 ? attachments : undefined,
        mentions: mentions.length > 0 ? mentions : undefined,
      });

      // Clear form after successful submit
      setContent('');
      setIsInternal(false);
      setAttachments([]);
      setMentions([]);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent(initialContent);
    setIsInternal(false);
    setAttachments([]);
    setMentions([]);
    onCancel?.();
  };

  const handleKeyDownForSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-lg border transition-colors',
        isInternal && 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'
      )}
    >
      {/* Internal Comment Indicator */}
      {isInternal && (
        <div className="flex items-center gap-1.5 rounded-t-lg border-b border-amber-200 bg-amber-100/50 px-3 py-1.5 dark:border-amber-800 dark:bg-amber-900/20">
          <Lock className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            ความคิดเห็นภายใน (เฉพาะผู้ดูแลระบบเท่านั้น)
          </span>
        </div>
      )}

      {/* Textarea with Mention Popover */}
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={(e) => {
            handleKeyDown(e);
            handleKeyDownForSubmit(e);
          }}
          placeholder={placeholder}
          rows={4}
          className={cn(
            'resize-none rounded-t-none border-0 focus-visible:ring-0',
            isInternal && 'bg-transparent dark:bg-transparent'
          )}
          disabled={isSubmitting}
        />

        {/* Mention Autocomplete Popover */}
        {showMentionPopover && filteredUsers.length > 0 && (
          <Popover open={showMentionPopover} onOpenChange={setShowMentionPopover}>
            <PopoverTrigger asChild>
              <div />
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-0"
              align="start"
              side="bottom"
              style={{
                position: 'absolute',
                top: `${textareaRef.current?.selectionStart ? 100 : 0}px`,
              }}
            >
              <div className="max-h-60 overflow-y-auto">
                {filteredUsers.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleMentionSelect(user)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent',
                      index === mentionIndex && 'bg-accent'
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {index === mentionIndex && <Check className="h-4 w-4 text-muted-foreground" />}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t px-3 py-2">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-md bg-accent px-2 py-1 text-sm"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span className="max-w-[150px] truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="ml-1 transition-colors hover:text-destructive"
                  disabled={isSubmitting}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Controls */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2">
          {/* Internal Toggle */}
          {showInternalToggle && allowInternal && (
            <div className="flex items-center gap-2">
              <Switch
                id="internal-toggle"
                checked={isInternal}
                onCheckedChange={setIsInternal}
                disabled={isSubmitting}
              />
              <label
                htmlFor="internal-toggle"
                className="flex cursor-pointer items-center gap-1 text-sm font-medium"
              >
                <Lock className="h-3.5 w-3.5" />
                ภายใน
              </label>
            </div>
          )}

          {/* Attachment Button */}
          {allowAttachments && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                disabled={isSubmitting}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="h-8 px-2"
              >
                <Paperclip className="mr-1 h-4 w-4" />
                แนบไฟล์
              </Button>
            </>
          )}

          {/* Mention Hint */}
          {allowMentions && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              พิมพ์ @ เพื่อกล่าวถึง
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Character Counter */}
          <span className="mr-2 text-xs text-muted-foreground">{content.length} ตัวอักษร</span>

          {/* Cancel Button */}
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              disabled={isSubmitting}
              className="h-8"
            >
              ยกเลิก
            </Button>
          )}

          {/* Submit Button */}
          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || isSubmitting}
            className="h-8"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                กำลังบันทึก...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
