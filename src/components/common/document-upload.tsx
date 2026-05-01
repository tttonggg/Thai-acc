'use client';

import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Trash2,
  X,
  Loader2,
  Download,
  Paperclip,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  uploadDocument,
  getDocuments,
  deleteDocument,
  type DocumentAttachmentWithUploader,
} from '@/lib/document-attachment-service';

interface DocumentUploadProps {
  entityType: string;
  entityId: string;
  onUploadComplete?: (attachment: DocumentAttachmentWithUploader) => void;
}

// Format file size to human readable
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get icon component based on mime type
function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType === 'application/pdf') return FileText;
  if (
    mimeType === 'text/csv' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
    return FileSpreadsheet;
  if (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return FileText;
  return File;
}

// Format date to Thai locale
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DocumentUpload({ entityType, entityId, onUploadComplete }: DocumentUploadProps) {
  const [attachments, setAttachments] = useState<DocumentAttachmentWithUploader[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents on mount
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await getDocuments(entityType, entityId);
      setAttachments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดเอกสาร');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  // Load on first render
  useState(() => {
    loadDocuments();
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploaded = await uploadDocument(formData, entityType, entityId);
      setAttachments((prev) => [uploaded, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.(uploaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดเอกสารไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  };

  // Cancel upload
  const handleCancelUpload = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Delete attachment
  const handleDelete = async (attachmentId: string) => {
    setDeleteLoading(attachmentId);
    setError(null);

    try {
      await deleteDocument(attachmentId);
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ลบเอกสารไม่สำเร็จ');
    } finally {
      setDeleteLoading(null);
    }
  };

  // Download file (open in new tab)
  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = window.open(fileUrl, '_blank');
    if (!link) {
      // Fallback: trigger download
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.click();
    }
  };

  const acceptedTypes = 'image/*,application/pdf,.csv,.xls,.xlsx,.doc,.docx';

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Upload className="h-4 w-4" />
            อัปโหลดเอกสาร
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Drop Zone */}
          <div
            className="cursor-pointer rounded-lg border-2 border-dashed border-gray-200 p-6 text-center transition-colors hover:border-gray-300"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p className="text-sm text-gray-600">คลิกเพื่อเลือกไฟล์ หรือลากไฟล์มาวางที่นี่</p>
            <p className="mt-1 text-xs text-gray-400">
              รองรับ: รูปภาพ, PDF, Excel, Word (ขนาดไม่เกิน 10MB)
            </p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="flex items-center justify-between rounded-lg border bg-gray-50 p-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {(() => {
                  const Icon = getFileIcon(selectedFile.type);
                  return <Icon className="h-5 w-5 shrink-0 text-gray-500" />;
                })()}
                <div className="overflow-hidden">
                  <p className="truncate text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <>
                    <Button size="sm" onClick={handleUpload}>
                      อัปโหลด
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancelUpload}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              <X className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Paperclip className="h-4 w-4" />
            เอกสารแนบ ({attachments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : attachments.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <FileText className="mx-auto mb-2 h-10 w-10 text-gray-300" />
              <p className="text-sm">ยังไม่มีเอกสารแนบ</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attachments.map((attachment) => {
                const Icon = getFileIcon(attachment.mimeType);
                const canDelete = !deleteLoading || deleteLoading !== attachment.id;
                const createdAtDate = attachment.createdAt as string;

                return (
                  <div
                    key={attachment.id}
                    className="group flex items-center justify-between rounded-lg bg-gray-50 p-3 transition-colors hover:bg-gray-100"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
                      <Icon className="h-5 w-5 shrink-0 text-gray-500" />
                      <div className="min-w-0 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                          className="block truncate text-left text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                          title={attachment.fileName}
                        >
                          {attachment.fileName}
                        </button>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(attachment.fileSize)}</span>
                          <span>•</span>
                          <span>{attachment.uploadedBy?.name || 'ไม่ระบุ'}</span>
                          <span>•</span>
                          <span>{formatDate(createdAtDate)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-red-500 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-700 group-hover:opacity-100"
                      onClick={() => handleDelete(attachment.id)}
                      disabled={!canDelete}
                    >
                      {deleteLoading === attachment.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
