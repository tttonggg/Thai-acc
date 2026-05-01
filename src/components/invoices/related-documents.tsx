'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DeleteConfirmDialog } from '@/components/ui/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Link2,
  Trash2,
  ExternalLink,
  FileText,
  Receipt,
  CreditCard,
  FileEdit,
  FileX,
  RefreshCw,
} from 'lucide-react';
import { formatThaiDate, formatCurrency } from '@/lib/thai-accounting';

// Types
interface RelatedDocumentDetails {
  id: string;
  module: string;
  documentNo: string;
  documentDate: Date | string;
  amount?: number;
  status?: string;
  customerName?: string;
  vendorName?: string;
}

interface RelatedDocument {
  id: string;
  relationType: string;
  direction: 'outbound' | 'inbound';
  notes?: string | null;
  createdAt: Date | string;
  details: RelatedDocumentDetails;
}

interface RelatedDocumentsSummary {
  total: number;
  links: number;
  cancels: number;
  replaces: number;
  refunds: number;
  adjusts: number;
}

interface RelatedDocumentsResponse {
  invoiceId: string;
  invoiceNo: string;
  relatedDocuments: RelatedDocument[];
  summary: RelatedDocumentsSummary;
}

interface RelatedDocumentsProps {
  invoiceId: string;
  onDocumentClick?: (module: string, id: string) => void;
  compact?: boolean;
  showAddButton?: boolean;
}

// Document type configuration
const DOCUMENT_TYPES = {
  invoice: {
    label: 'ใบกำกับภาษี',
    icon: '🧾',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    searchPath: '/api/invoices',
  },
  receipt: {
    label: 'ใบเสร็จรับเงิน',
    icon: '📄',
    color: 'bg-green-100 text-green-800 border-green-200',
    searchPath: '/api/receipts',
  },
  credit_note: {
    label: 'ใบลดหนี้',
    icon: '📝',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    searchPath: '/api/credit-notes',
  },
  debit_note: {
    label: 'ใบเพิ่มหนี้',
    icon: '📋',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    searchPath: '/api/debit-notes',
  },
  payment: {
    label: 'ใบจ่ายเงิน',
    icon: '💳',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    searchPath: '/api/payments',
  },
} as const;

// Relation type configuration
const RELATION_TYPES = {
  LINKS: { label: 'เชื่อมโยง', icon: Link2, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CANCELS: { label: 'ยกเลิก', icon: FileX, color: 'bg-red-50 text-red-700 border-red-200' },
  REPLACES: {
    label: 'แทนที่',
    icon: RefreshCw,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  REFUNDS: {
    label: 'คืนเงิน',
    icon: CreditCard,
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  ADJUSTS: {
    label: 'ปรับปรุง',
    icon: FileEdit,
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
} as const;

// Status badge colors
const getStatusColor = (status: string) => {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'ISSUED':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'VOID':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'ฉบับร่าง',
  ISSUED: 'ออกแล้ว',
  PAID: 'จ่ายแล้ว',
  CANCELLED: 'ยกเลิก',
  VOID: 'เลิก',
};

export function RelatedDocuments({
  invoiceId,
  onDocumentClick,
  compact = false,
  showAddButton = true,
}: RelatedDocumentsProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [relatedDocs, setRelatedDocs] = useState<RelatedDocument[]>([]);
  const [summary, setSummary] = useState<RelatedDocumentsSummary>({
    total: 0,
    links: 0,
    cancels: 0,
    replaces: 0,
    refunds: 0,
    adjusts: 0,
  });

  // Add relation dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
  const [selectedRelationType, setSelectedRelationType] = useState<string>('');
  const [relationNotes, setRelationNotes] = useState<string>('');

  // Delete confirmation state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [relationToDelete, setRelationToDelete] = useState<string | null>(null);

  // Fetch related documents
  const fetchRelatedDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/related`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch related documents');
      }

      const data: RelatedDocumentsResponse = await response.json();
      setRelatedDocs(data.relatedDocuments);
      setSummary(
        data.summary ?? {
          total: 0,
          links: 0,
          cancels: 0,
          replaces: 0,
          refunds: 0,
          adjusts: 0,
        }
      );
    } catch (error) {
      console.error('Error fetching related documents:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถดึงข้อมูลเอกสารที่เกี่ยวข้องได้',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchRelatedDocuments();
    }
  }, [invoiceId]);

  // Search documents by type
  const searchDocuments = async (docType: string) => {
    if (!docType) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const config = DOCUMENT_TYPES[docType as keyof typeof DOCUMENT_TYPES];
      if (!config) return;

      const response = await fetch(config.searchPath);
      if (!response.ok) {
        throw new Error('Failed to search documents');
      }

      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching documents:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถค้นหาเอกสารได้',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle document type selection
  const handleDocTypeChange = (value: string) => {
    setSelectedDocType(value);
    setSelectedDocumentId('');
    setSearchResults([]);
    if (value) {
      searchDocuments(value);
    }
  };

  // Add relation
  const handleAddRelation = async () => {
    if (!selectedDocType || !selectedDocumentId || !selectedRelationType) {
      toast({
        title: 'กรุณาตรวจสอบข้อมูล',
        description: 'กรุณาระบุประเภทเอกสาร เอกสารที่เกี่ยวข้อง และประเภทความสัมพันธ์',
        variant: 'destructive',
      });
      return;
    }

    setAddLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/related`, {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relatedModule: selectedDocType,
          relatedId: selectedDocumentId,
          relationType: selectedRelationType,
          notes: relationNotes || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'ไม่สามารถเชื่อมโยงเอกสารได้');
      }

      toast({
        title: 'เชื่อมโยงสำเร็จ',
        description: 'เชื่อมโยงเอกสารเรียบร้อยแล้ว',
      });

      // Reset form and close dialog
      setSelectedDocType('');
      setSelectedDocumentId('');
      setSelectedRelationType('');
      setRelationNotes('');
      setSearchResults([]);
      setAddDialogOpen(false);

      // Refresh related documents
      fetchRelatedDocuments();
    } catch (error: any) {
      console.error('Error adding relation:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message || 'ไม่สามารถเชื่อมโยงเอกสารได้',
        variant: 'destructive',
      });
    } finally {
      setAddLoading(false);
    }
  };

  // Remove relation
  const handleRemoveRelation = async () => {
    if (!relationToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}/related?relatedId=${relationToDelete}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to remove relation');
      }

      toast({
        title: 'ลบความสัมพันธ์สำเร็จ',
        description: 'ลบความสัมพันธ์เอกสารเรียบร้อยแล้ว',
      });

      setDeleteDialogOpen(false);
      setRelationToDelete(null);

      // Refresh related documents
      fetchRelatedDocuments();
    } catch (error) {
      console.error('Error removing relation:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบความสัมพันธ์เอกสารได้',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle document click
  const handleDocumentClick = (module: string, id: string) => {
    if (onDocumentClick) {
      onDocumentClick(module, id);
    } else {
      // Default navigation
      const modulePath =
        module === 'credit_note'
          ? 'credit-notes'
          : module === 'debit_note'
            ? 'debit-notes'
            : module + 's';
      router.push(`/${modulePath}/${id}`);
    }
  };

  // Get document number field based on module
  const getDocumentNumber = (doc: any, module: string) => {
    switch (module) {
      case 'invoice':
        return doc.invoiceNo;
      case 'receipt':
        return doc.receiptNo;
      case 'credit_note':
        return doc.creditNoteNo;
      case 'debit_note':
        return doc.debitNoteNo;
      case 'payment':
        return doc.paymentNo;
      default:
        return doc.documentNo || doc.id;
    }
  };

  // Get document date field based on module
  const getDocumentDate = (doc: any, module: string) => {
    switch (module) {
      case 'invoice':
        return doc.invoiceDate;
      case 'receipt':
        return doc.receiptDate;
      case 'credit_note':
        return doc.creditNoteDate;
      case 'debit_note':
        return doc.debitNoteDate;
      case 'payment':
        return doc.paymentDate;
      default:
        return doc.documentDate || doc.createdAt;
    }
  };

  // Render document card
  const renderDocumentCard = (rel: RelatedDocument) => {
    const { details, relationType, direction, notes } = rel;
    const docConfig = DOCUMENT_TYPES[details.module as keyof typeof DOCUMENT_TYPES];
    const relationConfig = RELATION_TYPES[relationType as keyof typeof RELATION_TYPES];
    const RelationIcon = relationConfig.icon;

    const amount = details.amount ? formatCurrency(details.amount / 100) : '-';
    const statusColor = details.status
      ? getStatusColor(details.status)
      : 'bg-gray-100 text-gray-800';
    const statusLabel = details.status ? STATUS_LABELS[details.status] || details.status : '-';

    return (
      <Card key={rel.id} className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            {/* Document Info */}
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                {/* Document Type Badge */}
                <Badge className={docConfig.color}>
                  <span className="mr-1">{docConfig.icon}</span>
                  {docConfig.label}
                </Badge>

                {/* Relation Type Badge */}
                <Badge variant="outline" className={relationConfig.color}>
                  <RelationIcon className="mr-1 h-3 w-3" />
                  {relationConfig.label}
                  {direction === 'inbound' && ' (จากเอกสารอื่น)'}
                </Badge>

                {/* Status Badge */}
                {details.status && (
                  <Badge variant="outline" className={statusColor}>
                    {statusLabel}
                  </Badge>
                )}
              </div>

              {/* Document Number */}
              <button
                onClick={() => handleDocumentClick(details.module, details.id)}
                className="mb-1 flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                aria-label={`เปิดเอกสาร ${details.documentNo}`}
              >
                {details.documentNo}
                <ExternalLink className="h-3 w-3" />
              </button>

              {/* Document Details */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">วันที่:</span>{' '}
                  {formatThaiDate(details.documentDate)}
                </div>
                <div>
                  <span className="font-medium">ยอด:</span> {amount}
                </div>
              </div>

              {/* Notes */}
              {notes && (
                <p className="mt-2 text-xs italic text-muted-foreground">หมายเหตุ: {notes}</p>
              )}
            </div>

            {/* Remove Button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => {
                setRelationToDelete(rel.id);
                setDeleteDialogOpen(true);
              }}
              aria-label="ลบความสัมพันธ์"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>เอกสารที่เกี่ยวข้อง</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">กำลังโหลด...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>เอกสารที่เกี่ยวข้อง</CardTitle>
              <CardDescription>
                เอกสารที่เชื่อมโยงกับใบกำกับภาษีนี้ ({summary.total} รายการ)
              </CardDescription>
            </div>
            {showAddButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                className="gap-2"
              >
                <Link2 className="h-4 w-4" />
                เชื่อมโยงเอกสาร
              </Button>
            )}
          </div>

          {/* Summary Badges */}
          {!compact && summary.total > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {summary.links > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Link2 className="h-3 w-3" />
                  เชื่อมโยง {summary.links}
                </Badge>
              )}
              {summary.cancels > 0 && (
                <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700">
                  <FileX className="h-3 w-3" />
                  ยกเลิก {summary.cancels}
                </Badge>
              )}
              {summary.replaces > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 border-orange-200 bg-orange-50 text-orange-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  แทนที่ {summary.replaces}
                </Badge>
              )}
              {summary.refunds > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 border-green-200 bg-green-50 text-green-700"
                >
                  <CreditCard className="h-3 w-3" />
                  คืนเงิน {summary.refunds}
                </Badge>
              )}
              {summary.adjusts > 0 && (
                <Badge
                  variant="outline"
                  className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700"
                >
                  <FileEdit className="h-3 w-3" />
                  ปรับปรุง {summary.adjusts}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent>
          {relatedDocs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileText className="mx-auto mb-4 h-12 w-12 opacity-20" />
              <p>ไม่มีเอกสารที่เกี่ยวข้อง</p>
              {showAddButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  className="mt-4"
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  เชื่อมโยงเอกสาร
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">{relatedDocs.map(renderDocumentCard)}</div>
          )}
        </CardContent>
      </Card>

      {/* Add Relation Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เชื่อมโยงเอกสาร</DialogTitle>
            <DialogDescription>เชื่อมโยงเอกสารอื่นกับใบกำกับภาษีนี้</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="docType">ประเภทเอกสาร *</Label>
              <Select value={selectedDocType} onValueChange={handleDocTypeChange}>
                <SelectTrigger id="docType">
                  <SelectValue placeholder="เลือกประเภทเอกสาร" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DOCUMENT_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <span className="mr-2">{config.icon}</span>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Document Selection */}
            {selectedDocType && (
              <div className="space-y-2">
                <Label htmlFor="document">เอกสารที่เกี่ยวข้อง *</Label>
                {searchLoading ? (
                  <div className="flex items-center justify-center rounded-md border py-4">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    กำลังค้นหา...
                  </div>
                ) : (
                  <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
                    <SelectTrigger id="document">
                      <SelectValue placeholder="เลือกเอกสาร" />
                    </SelectTrigger>
                    <SelectContent>
                      {searchResults.length === 0 ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          ไม่พบเอกสาร
                        </div>
                      ) : (
                        searchResults.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {getDocumentNumber(doc, selectedDocType)} -{' '}
                            {formatThaiDate(getDocumentDate(doc, selectedDocType))}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Relation Type */}
            <div className="space-y-2">
              <Label htmlFor="relationType">ประเภทความสัมพันธ์ *</Label>
              <Select value={selectedRelationType} onValueChange={setSelectedRelationType}>
                <SelectTrigger id="relationType">
                  <SelectValue placeholder="เลือกประเภทความสัมพันธ์" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RELATION_TYPES).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <config.icon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">หมายเหตุ</Label>
              <Input
                id="notes"
                placeholder="หมายเหตุ (ถ้ามี)"
                value={relationNotes}
                onChange={(e) => setRelationNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)} disabled={addLoading}>
              ยกเลิก
            </Button>
            <Button
              onClick={handleAddRelation}
              disabled={
                addLoading || !selectedDocType || !selectedDocumentId || !selectedRelationType
              }
            >
              {addLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  เชื่อมโยง
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="ยืนยันการลบความสัมพันธ์"
        message="คุณต้องการลบความสัมพันธ์เอกสารนี้ใช่หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้"
        confirmLabel="ลบ"
        onConfirm={handleRemoveRelation}
        loading={deleteLoading}
      />
    </>
  );
}
