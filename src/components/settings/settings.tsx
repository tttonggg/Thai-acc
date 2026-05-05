'use client';

import { useState, useEffect, useRef, lazy } from 'react';
const ApprovalConfigPage = lazy(() => import('@/components/approval/approval-config-page').then(m => ({ default: m.ApprovalConfigPage })));
const EmailSettingsTab = lazy(() => import('@/components/settings/email-settings-tab').then(m => ({ default: m.EmailSettingsTab })));
import {
  Building2,
  FileText,
  Users,
  Database,
  Save,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
  Shield,
  Mail,
  QrCode,
  MapPin,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { FileUpload } from '@/components/ui/file-upload';
import { useToast } from '@/hooks/use-toast';

interface CompanyInfo {
  name: string;
  nameEn: string;
  taxId: string;
  branchCode: string;
  address: string;
  subDistrict: string;
  district: string;
  province: string;
  postalCode: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  logo?: string;
  promptpayId: string;
  fiscalYearStart: number;
}

interface TaxRates {
  vatRate: number;
  whtPnd53Service: number;
  whtPnd53Rent: number;
  whtPnd53Prof: number;
  whtPnd53Contract: number;
  whtPnd53Advert: number;
}

interface DocumentNumberFormat {
  type: string;
  prefix: string;
  format: string;
  resetMonthly: boolean;
  resetYearly: boolean;
  currentNo: number;
}

interface Branch {
  id: string;
  code: string;
  name: string;
  address?: string;
  isActive: boolean;
}

const DOCUMENT_TYPES = [
  { type: 'invoice', label: 'ใบกำกับภาษี', defaultPrefix: 'INV' },
  { type: 'receipt', label: 'ใบเสร็จรับเงิน', defaultPrefix: 'RCP' },
  { type: 'payment', label: 'ใบจ่ายเงิน', defaultPrefix: 'PAY' },
  { type: 'journal', label: 'บันทึกบัญชี', defaultPrefix: 'JE' },
  { type: 'credit_note', label: 'ใบลดหนี้', defaultPrefix: 'CN' },
  { type: 'debit_note', label: 'ใบเพิ่มหนี้', defaultPrefix: 'DN' },
  { type: 'purchase', label: 'ใบซื้อ', defaultPrefix: 'PO' },
  { type: 'payroll', label: 'เงินเดือน', defaultPrefix: 'PAYROLL' },
  { type: 'petty_cash', label: 'เงินสดย่อย', defaultPrefix: 'PCV' },
];

export function Settings() {
  const { toast } = useToast();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: '',
    nameEn: '',
    taxId: '',
    branchCode: '00000',
    address: '',
    subDistrict: '',
    district: '',
    province: '',
    postalCode: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    logo: '',
    promptpayId: '',
    fiscalYearStart: 1,
  });
  const [taxRates, setTaxRates] = useState<TaxRates>({
    vatRate: 7,
    whtPnd53Service: 3,
    whtPnd53Rent: 5,
    whtPnd53Prof: 3,
    whtPnd53Contract: 1,
    whtPnd53Advert: 2,
  });
  const [documentNumbers, setDocumentNumbers] = useState<DocumentNumberFormat[]>([]);
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    smtpFromEmail: '',
    smtpFromName: '',
    reminderEnabled: false,
    reminderDays1: 7,
    reminderDays2: 14,
    reminderDays3: 30,
  });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchForm, setBranchForm] = useState({ code: '', name: '', address: '', isActive: true });
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string>('');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`/api/settings`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const { company, taxRates: tax, documentNumbers: docs, emailSettings: email } = result.data;

          if (email) {
            setEmailSettings({
              smtpHost: email.smtpHost ?? '',
              smtpPort: email.smtpPort ?? 587,
              smtpUser: email.smtpUser ?? '',
              smtpPassword: email.smtpPassword ?? '',
              smtpFromEmail: email.smtpFromEmail ?? '',
              smtpFromName: email.smtpFromName ?? '',
              reminderEnabled: email.reminderEnabled ?? false,
              reminderDays1: email.reminderDays1 ?? 7,
              reminderDays2: email.reminderDays2 ?? 14,
              reminderDays3: email.reminderDays3 ?? 30,
            });
          }

          if (company) {
            setCompanyInfo({
              name: company.name || '',
              nameEn: company.nameEn || '',
              taxId: company.taxId || '',
              branchCode: company.branchCode || '00000',
              address: company.address || '',
              subDistrict: company.subDistrict || '',
              district: company.district || '',
              province: company.province || '',
              postalCode: company.postalCode || '',
              phone: company.phone || '',
              fax: company.fax || '',
              email: company.email || '',
              website: company.website || '',
              logo: company.logo || '',
              promptpayId: (company as any).promptpayId || '',
              fiscalYearStart: (company as any).fiscalYearStart ?? 1,
            });
            setCompanyId(company.id);
          }

          if (tax) {
            setTaxRates(tax);
          }

          if (docs && docs.length > 0) {
            setDocumentNumbers(docs);
          } else {
            // Initialize with defaults
            initializeDocumentNumbers();
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeDocumentNumbers = () => {
    const defaults = DOCUMENT_TYPES.map((doc) => ({
      type: doc.type,
      prefix: doc.defaultPrefix,
      format: '{prefix}-{yyyy}-{mm}-{0000}',
      resetMonthly: true,
      resetYearly: false,
      currentNo: 0,
    }));
    setDocumentNumbers(defaults);
  };

  const handleSaveCompanyInfo = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/company`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(companyInfo),
      });

      if (response.ok) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'ข้อมูลบริษัทถูกบันทึกเรียบร้อยแล้ว',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save company info:', error);
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTaxRates = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxRates }),
      });

      if (response.ok) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'อัตราภาษีถูกบันทึกเรียบร้อยแล้ว',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save tax rates:', error);
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: 'ไม่สามารถบันทึกอัตราภาษีได้ กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDocumentNumbers = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/settings`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentNumbers }),
      });

      if (response.ok) {
        toast({
          title: 'บันทึกสำเร็จ',
          description: 'รูปแบบเลขที่เอกสารถูกบันทึกเรียบร้อยแล้ว',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save document numbers:', error);
      toast({
        title: 'บันทึกไม่สำเร็จ',
        description: 'ไม่สามารถบันทึกรูปแบบเลขที่เอกสารได้ กรุณาลองใหม่',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = async () => {
    initializeDocumentNumbers();
    toast({
      title: 'รีเซ็ตค่าเริ่มต้น',
      description: 'รูปแบบเลขที่เอกสารถูกรีเซ็ตเรียบร้อยแล้ว',
    });
  };

  const fetchBranches = async () => {
    if (!companyId) return;
    setLoadingBranches(true);
    try {
      const response = await fetch(`/api/branches`, { credentials: 'include' });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setBranches(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchBranches();
    }
  }, [companyId]);

  const handleOpenBranchDialog = (branch?: Branch) => {
    if (branch) {
      setEditingBranchId(branch.id);
      setBranchForm({ code: branch.code, name: branch.name, address: branch.address || '', isActive: branch.isActive });
    } else {
      setEditingBranchId(null);
      setBranchForm({ code: '', name: '', address: '', isActive: true });
    }
    setBranchDialogOpen(true);
  };

  const handleCloseBranchDialog = () => {
    setBranchDialogOpen(false);
    setEditingBranchId(null);
    setBranchForm({ code: '', name: '', address: '', isActive: true });
  };

  const handleSaveBranch = async () => {
    if (!branchForm.code || !branchForm.name) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const url = editingBranchId ? `/api/branches/${editingBranchId}` : '/api/branches';
      const method = editingBranchId ? 'PUT' : 'POST';
      const body = editingBranchId
        ? { code: branchForm.code, name: branchForm.name, address: branchForm.address, isActive: branchForm.isActive }
        : { companyId, code: branchForm.code, name: branchForm.name, address: branchForm.address };

      const response = await fetch(url, {
        credentials: 'include',
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({ title: editingBranchId ? 'แก้ไขสาขาสำเร็จ' : 'เพิ่มสาขาสำเร็จ' });
        handleCloseBranchDialog();
        fetchBranches();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Failed to save branch:', error);
      toast({ title: 'ไม่สำเร็จ', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('ต้องการลบสาขานี้ใช่หรือไม่?')) return;

    try {
      const response = await fetch(`/api/branches/${id}`, {
        credentials: 'include',
        method: 'DELETE',
      });

      if (response.ok) {
        toast({ title: 'ลบสาขาสำเร็จ' });
        fetchBranches();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Failed to delete branch:', error);
      toast({ title: 'ไม่สำเร็จ', description: error instanceof Error ? error.message : '', variant: 'destructive' });
    }
  };

  const updateDocumentNumber = (index: number, field: keyof DocumentNumberFormat, value: any) => {
    const updated = [...documentNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setDocumentNumbers(updated);
  };

  const handleLogoSelect = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile) return;

    const formData = new FormData();
    formData.append('file', logoFile);
    formData.append('type', 'logo');

    try {
      const response = await fetch(`/api/upload`, {
        credentials: 'include',
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCompanyInfo((prev) => ({ ...prev, logo: data.url }));
        toast({
          title: 'อัปโหลดโลโก้สำเร็จ',
          description: 'อัปโหลดโลโก้บริษัทเรียบร้อยแล้ว',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Failed to upload logo:', error);
      toast({
        title: 'อัปโหลดโลโก้ไม่สำเร็จ',
        description: 'ไม่สามารถอัปโหลดโลโก้ได้ กรุณาลองใหม่',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`/api/backup/export`, { credentials: 'include' });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thai-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: 'ส่งออกไม่สำเร็จ',
        description: 'ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่',
        variant: 'destructive',
      });
    }
  };

  const handleImportData = async () => {
    if (!importFile) return;

    setImporting(true);
    try {
      const fileContent = await importFile.text();
      const data = JSON.parse(fileContent);

      const response = await fetch(`/api/backup/import`, {
        credentials: 'include',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'นำเข้าสำเร็จ',
          description: `นำเข้าข้อมูลสำเร็จ: ${data.imported?.accounts || 0} บัญชี, ${data.imported?.customers || 0} ลูกค้า, ${data.imported?.vendors || 0} เจ้าหนี้`,
        });
        setImportFile(null);
        fetchSettings();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }
    } catch (error) {
      console.error('Failed to import data:', error);
      toast({
        title: 'นำเข้าไม่สำเร็จ',
        description:
          error instanceof Error
            ? error.message
            : 'ไม่สามารถนำเข้าข้อมูลได้ กรุณาตรวจสอบรูปแบบไฟล์',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleImportFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setImportFile(files[0]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">ตั้งค่า</h1>
        <p className="mt-1 text-gray-500">จัดการการตั้งค่าระบบ</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            ข้อมูลบริษัท
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="mr-2 h-4 w-4" />
            เอกสาร
          </TabsTrigger>
          <TabsTrigger value="taxes">
            <FileText className="mr-2 h-4 w-4" />
            ภาษี
          </TabsTrigger>
          <TabsTrigger value="branches">
            <MapPin className="mr-2 h-4 w-4" />
            สาขา
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="mr-2 h-4 w-4" />
            สำรองข้อมูล
          </TabsTrigger>
          <TabsTrigger value="promptpay">
            <QrCode className="mr-2 h-4 w-4" />
            พร้อมเพย์
          </TabsTrigger>
          <TabsTrigger value="approvals">
            <Shield className="mr-2 h-4 w-4" />
            การอนุมัติ
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="mr-2 h-4 w-4" />
            อีเมล
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ข้อมูลบริษัท</CardTitle>
              <CardDescription>ข้อมูลบริษัทสำหรับแสดงในเอกสาร</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <Label>ชื่อบริษัท (ไทย)</Label>
                  <Input
                    value={companyInfo.name}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>ชื่อบริษัท (อังกฤษ)</Label>
                  <Input
                    value={companyInfo.nameEn}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, nameEn: e.target.value })}
                  />
                </div>
                <div>
                  <Label>เลขประจำตัวผู้เสียภาษี</Label>
                  <Input
                    value={companyInfo.taxId}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                  />
                </div>
                <div>
                  <Label>รหัสสาขา</Label>
                  <Input
                    value={companyInfo.branchCode}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, branchCode: e.target.value })}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>ที่อยู่</Label>
                  <Textarea
                    value={companyInfo.address}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                  />
                </div>
                <div>
                  <Label>แขวง/ตำบล</Label>
                  <Input
                    value={companyInfo.subDistrict}
                    onChange={(e) =>
                      setCompanyInfo({ ...companyInfo, subDistrict: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>เขต/อำเภอ</Label>
                  <Input
                    value={companyInfo.district}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, district: e.target.value })}
                  />
                </div>
                <div>
                  <Label>จังหวัด</Label>
                  <Input
                    value={companyInfo.province}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, province: e.target.value })}
                  />
                </div>
                <div>
                  <Label>รหัสไปรษณีย์</Label>
                  <Input
                    value={companyInfo.postalCode}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, postalCode: e.target.value })}
                  />
                </div>
                <div>
                  <Label>โทรศัพท์</Label>
                  <Input
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label>โทรสาร</Label>
                  <Input
                    value={companyInfo.fax}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, fax: e.target.value })}
                  />
                </div>
                <div>
                  <Label>อีเมล</Label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>เว็บไซต์</Label>
                  <Input
                    value={companyInfo.website}
                    onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                  />
                </div>
                <div>
                  <Label>เดือนที่เริ่มปีบัญชี</Label>
                  <Select
                    value={companyInfo.fiscalYearStart.toString()}
                    onValueChange={(v) => setCompanyInfo({ ...companyInfo, fiscalYearStart: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">มกราคม</SelectItem>
                      <SelectItem value="2">กุมภาพันธ์</SelectItem>
                      <SelectItem value="3">มีนาคม</SelectItem>
                      <SelectItem value="4">เมษายน</SelectItem>
                      <SelectItem value="5">พฤษภาคม</SelectItem>
                      <SelectItem value="6">มิถุนายน</SelectItem>
                      <SelectItem value="7">กรกฎาคม</SelectItem>
                      <SelectItem value="8">สิงหาคม</SelectItem>
                      <SelectItem value="9">กันยายน</SelectItem>
                      <SelectItem value="10">ตุลาคม</SelectItem>
                      <SelectItem value="11">พฤศจิกายน</SelectItem>
                      <SelectItem value="12">ธันวาคม</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveCompanyInfo}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึกข้อมูล
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>โลโก้บริษัท</CardTitle>
              <CardDescription>อัปโหลดโลโก้สำหรับแสดงในเอกสาร</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="h-full w-full object-contain"
                    />
                  ) : companyInfo.logo ? (
                    <img
                      src={companyInfo.logo}
                      alt="Company logo"
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <FileUpload
                    accept="image/png,image/jpeg,image/jpg"
                    maxSize={2}
                    onFileSelect={handleLogoSelect}
                    label="อัปโหลดโลโก้"
                    description="คลิกเพื่อเลือกไฟล์รูปภาพ"
                  />
                  {logoFile && (
                    <Button onClick={handleLogoUpload} className="bg-green-600 hover:bg-green-700">
                      <Upload className="mr-2 h-4 w-4" />
                      บันทึกโลโก้
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">รองรับไฟล์ PNG, JPG ขนาดไม่เกิน 2MB</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promptpay" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>พร้อมเพย์ (PromptPay)</CardTitle>
              <CardDescription>เลขพร้อมเพย์สำหรับแสดง QR Code บนใบเสร็จ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-w-xs">
                <Label htmlFor="promptpayId">เลขพร้อมเพย์</Label>
                <Input
                  id="promptpayId"
                  placeholder="0-9999-00000-00-0"
                  value={companyInfo.promptpayId}
                  onChange={(e) =>
                    setCompanyInfo((prev) => ({ ...prev, promptpayId: e.target.value }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ตั้งค่าเลขที่เอกสาร</CardTitle>
                  <CardDescription>กำหนดรูปแบบเลขที่เอกสารอัตโนมัติ</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetDefaults}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  รีเซ็ตค่าเริ่มต้น
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {documentNumbers.map((doc, index) => {
                  const docType = DOCUMENT_TYPES.find((d) => d.type === doc.type);
                  if (!docType) return null;

                  return (
                    <div key={doc.type} className="space-y-3 rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{docType.label}</h3>
                        <span className="text-sm text-gray-500">
                          เลขที่ถัดไป: {doc.currentNo + 1}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                          <Label>คำนำหน้า</Label>
                          <Input
                            value={doc.prefix}
                            onChange={(e) => updateDocumentNumber(index, 'prefix', e.target.value)}
                            placeholder="INV"
                          />
                        </div>
                        <div>
                          <Label>รูปแบบ</Label>
                          <Input
                            value={doc.format}
                            onChange={(e) => updateDocumentNumber(index, 'format', e.target.value)}
                            placeholder="{prefix}-{yyyy}-{mm}-{0000}"
                          />
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={doc.resetMonthly}
                              onCheckedChange={(checked) =>
                                updateDocumentNumber(index, 'resetMonthly', checked)
                              }
                            />
                            <Label className="text-sm">รีเซ็ตรายเดือน</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={doc.resetYearly}
                              onCheckedChange={(checked) =>
                                updateDocumentNumber(index, 'resetYearly', checked)
                              }
                            />
                            <Label className="text-sm">รีเซ็ตรายปี</Label>
                          </div>
                        </div>
                        <div className="rounded bg-gray-50 p-2 text-sm">
                          <span className="text-gray-600">ตัวอย่าง: </span>
                          <span className="font-mono">
                            {doc.format
                              .replace('{prefix}', doc.prefix)
                              .replace('{yyyy}', new Date().getFullYear().toString())
                              .replace('{yy}', (new Date().getFullYear() % 100).toString())
                              .replace(
                                '{mm}',
                                (new Date().getMonth() + 1).toString().padStart(2, '0')
                              )
                              .replace('{0000}', '0001')
                              .replace('{000}', '001')
                              .replace('{00}', '01')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveDocumentNumbers}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึกรูปแบบเอกสาร
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxes" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>อัตราภาษี</CardTitle>
              <CardDescription>กำหนดอัตราภาษีเริ่มต้น</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border-b pb-6">
                  <h3 className="mb-4 font-semibold">ภาษีมูลค่าเพิ่ม (VAT)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>อัตราภาษีมูลค่าเพิ่ม (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.vatRate}
                        onChange={(e) =>
                          setTaxRates({ ...taxRates, vatRate: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 7%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 font-semibold">ภาษีหัก ณ ที่จ่าย (ภงด.53)</h3>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label>ค่าบริการ (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.whtPnd53Service}
                        onChange={(e) =>
                          setTaxRates({
                            ...taxRates,
                            whtPnd53Service: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 3%</p>
                    </div>
                    <div>
                      <Label>ค่าเช่า (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.whtPnd53Rent}
                        onChange={(e) =>
                          setTaxRates({
                            ...taxRates,
                            whtPnd53Rent: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 5%</p>
                    </div>
                    <div>
                      <Label>ค่าบริการวิชาชีพ (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.whtPnd53Prof}
                        onChange={(e) =>
                          setTaxRates({
                            ...taxRates,
                            whtPnd53Prof: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 3%</p>
                    </div>
                    <div>
                      <Label>ค่าจ้างทำของ (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.whtPnd53Contract}
                        onChange={(e) =>
                          setTaxRates({
                            ...taxRates,
                            whtPnd53Contract: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 1%</p>
                    </div>
                    <div>
                      <Label>ค่าโฆษณา (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={taxRates.whtPnd53Advert}
                        onChange={(e) =>
                          setTaxRates({
                            ...taxRates,
                            whtPnd53Advert: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <p className="mt-1 text-xs text-gray-500">อัตรามาตรฐาน: 2%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={handleSaveTaxRates}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      บันทึกอัตราภาษี
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>สาขา</CardTitle>
                  <CardDescription>จัดการข้อมูลสาขาของบริษัท</CardDescription>
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleOpenBranchDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  เพิ่มสาขา
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingBranches ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                </div>
              ) : branches.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  ยังไม่มีข้อมูลสาขา
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>รหัสสาขา</TableHead>
                      <TableHead>ชื่อสาขา</TableHead>
                      <TableHead>ที่อยู่</TableHead>
                      <TableHead>สถานะ</TableHead>
                      <TableHead className="text-right">จัดการ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell className="font-mono">{branch.code}</TableCell>
                        <TableCell>{branch.name}</TableCell>
                        <TableCell className="text-gray-500">{branch.address || '-'}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${branch.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {branch.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenBranchDialog(branch)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteBranch(branch.id)} className="text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สำรองข้อมูล</CardTitle>
              <CardDescription>สำรองและกู้คืนข้อมูลระบบ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Export Section */}
                <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
                  <Database className="h-8 w-8 text-blue-600" />
                  <div className="flex-1">
                    <p className="font-medium">ส่งออกข้อมูล</p>
                    <p className="text-sm text-gray-500">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON</p>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleExportData}>
                    <Download className="mr-2 h-4 w-4" />
                    ส่งออกข้อมูล
                  </Button>
                </div>

                {/* Import Section */}
                <div className="space-y-4 rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-4">
                    <Upload className="h-8 w-8 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium">นำเข้าข้อมูล</p>
                      <p className="text-sm text-gray-500">อัปโหลดไฟล์สำรองเพื่อกู้คืนข้อมูล</p>
                    </div>
                  </div>

                  <FileUpload
                    accept=".json"
                    maxSize={10}
                    onFileSelect={handleImportFileSelect}
                    label="เลือกไฟล์สำรองข้อมูล"
                    description="ไฟล์ JSON ที่ส่งออกจากระบบ"
                    uploadedFileName={importFile?.name}
                  />

                  {importFile && (
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={handleImportData}
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          กำลังนำเข้า...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          นำเข้าข้อมูล
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="mt-6 space-y-4">
          <ApprovalConfigPage />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailSettingsTab initial={emailSettings} />
        </TabsContent>
      </Tabs>

      {/* Branch Dialog */}
      <Dialog open={branchDialogOpen} onOpenChange={setBranchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranchId ? 'แก้ไขสาขา' : 'เพิ่มสาขาใหม่'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="branchCode">รหัสสาขา</Label>
              <Input
                id="branchCode"
                value={branchForm.code}
                onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                placeholder="001"
              />
            </div>
            <div>
              <Label htmlFor="branchName">ชื่อสาขา</Label>
              <Input
                id="branchName"
                value={branchForm.name}
                onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                placeholder="สำนักงานใหญ่"
              />
            </div>
            <div>
              <Label htmlFor="branchAddress">ที่อยู่</Label>
              <Textarea
                id="branchAddress"
                value={branchForm.address}
                onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                placeholder="ที่อยู่สาขา (ไม่บังคับ)"
              />
            </div>
            {editingBranchId && (
              <div className="flex items-center gap-2">
                <Switch
                  id="branchActive"
                  checked={branchForm.isActive}
                  onCheckedChange={(checked) => setBranchForm({ ...branchForm, isActive: checked })}
                />
                <Label htmlFor="branchActive">ใช้งาน</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveBranch} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
