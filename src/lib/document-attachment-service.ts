/**
 * Document Attachment Service
 * Client-side service for interacting with the document-attachment API
 */

import type { User } from '@prisma/client';

// API response type (dates serialized as strings via JSON)
export interface DocumentAttachmentApiResponse {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  storedFileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string | null;
  uploadedById: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  uploadedBy: Pick<User, 'id' | 'name' | 'email'> | null;
}

const API_BASE = '/api/document-attachments';

export type DocumentAttachmentWithUploader = DocumentAttachmentApiResponse;

/**
 * Upload a document attachment
 * @param formData - FormData containing file, entityType, entityId
 * @param entityType - Type of entity (e.g., 'invoice', 'receipt')
 * @param entityId - ID of the entity
 * @returns Created document attachment
 */
export async function uploadDocument(
  formData: FormData,
  entityType: string,
  entityId: string
): Promise<DocumentAttachmentWithUploader> {
  // Ensure formData has the required fields
  formData.append('entityType', entityType);
  formData.append('entityId', entityId);

  const response = await fetch(API_BASE, {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'อัปโหลดเอกสารแนบไม่สำเร็จ');
  }

  return result.data;
}

/**
 * Get all document attachments for an entity
 * @param entityType - Type of entity
 * @param entityId - ID of the entity
 * @returns Array of document attachments
 */
export async function getDocuments(
  entityType: string,
  entityId: string
): Promise<DocumentAttachmentWithUploader[]> {
  const url = new URL(API_BASE, window.location.origin);
  url.searchParams.append('entityType', entityType);
  url.searchParams.append('entityId', entityId);

  const response = await fetch(url.toString());

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'ดึงข้อมูลเอกสารแนบไม่สำเร็จ');
  }

  return result.data;
}

/**
 * Delete a document attachment (soft delete)
 * @param attachmentId - ID of the attachment to delete
 */
export async function deleteDocument(attachmentId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/${attachmentId}`, {
    method: 'DELETE',
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'ลบเอกสารแนบไม่สำเร็จ');
  }
}
