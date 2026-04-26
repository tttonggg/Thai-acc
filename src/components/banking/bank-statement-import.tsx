'use client'

import { useState, useCallback, useRef } from 'react'
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Loader2, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface ParsedEntry {
  description: string
  amount: number
  type: 'CREDIT' | 'DEBIT'
  valueDate: string
  reference?: string
}

interface BankAccount {
  id: string
  code: string
  bankName: string
  accountNumber: string
}

interface ImportResult {
  success: boolean
  data?: {
    imported: number
    entries: Array<{
      id: string
      description: string
      amount: number
      type: string
      valueDate: string
    }>
  }
  error?: string
}

export function BankStatementImport() {
  const [files, setFiles] = useState<File[]>([])
  const [parsedEntries, setParsedEntries] = useState<ParsedEntry[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [selectedBankAccountId, setSelectedBankAccountId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Fetch bank accounts on mount
  useState(() => {
    const fetchAccounts = async () => {
      const res = await window.fetch(`/api/bank-accounts`, { credentials: 'include' }).then(r => r.json())
      if (res.success) setBankAccounts(res.data)
    }
    fetchAccounts()
  })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    handleFiles(selectedFiles)
  }, [])

  const handleFiles = async (selectedFiles: File[]) => {
    const validFiles = selectedFiles.filter(f =>
      f.name.endsWith('.xml') || f.name.endsWith('.camt053') || f.name.endsWith('.json')
    )

    if (validFiles.length === 0) {
      toast({
        title: 'ไม่รองรับไฟล์',
        description: 'กรุณาเลือกไฟล์ .xml หรือ .json (รูปแบบ CAMT.053)',
        variant: 'destructive',
      })
      return
    }

    setFiles(prev => [...prev, ...validFiles])
    setImportResult(null)

    // Parse first file immediately for preview
    const file = validFiles[0]
    setIsParsing(true)

    try {
      const text = await file.text()
      const isCamt = text.includes('camt.053') ||
        text.includes('BkToCstmrStmt') ||
        text.includes('urn:iso:std:iso:20022:tech:xsd:camt')

      if (isCamt) {
        parseCamtXml(text)
      } else {
        try {
          const json = JSON.parse(text)
          parseJsonFormat(json)
        } catch {
          toast({ title: 'ไม่สามารถอ่านไฟล์', variant: 'destructive' })
        }
      }
    } finally {
      setIsParsing(false)
    }
  }

  const parseCamtXml = (xml: string) => {
    const entries: ParsedEntry[] = []

    // Match Ntry blocks
    const ntryMatches = xml.match(/<Ntry[^>]*>[\s\S]*?<\/Ntry>/g) || []

    for (const block of ntryMatches) {
      const amtMatch = block.match(/<Amt[^>]*>([\d.]+)<\/Amt>/)
      if (!amtMatch) continue

      const amount = Math.round(parseFloat(amtMatch[1]) * 100)
      const cdtMatch = block.match(/<CdtDbtInd>([^<]+)<\/CdtDbtInd>/)
      const type = cdtMatch?.[1] === 'CRDT' ? 'CREDIT' : 'DEBIT'

      const valDtMatch = block.match(/<ValDt>[\s\S]*?<Dt>(\d{4}-\d{2}-\d{2})<\/Dt>[\s\S]*?<\/ValDt>/)
      const valueDate = valDtMatch?.[1] || new Date().toISOString().split('T')[0]

      const refMatch = block.match(/<NtryRef>([^<]+)<\/NtryRef>/)
      const reference = refMatch?.[1]

      let desc = ''
      const addtlMatch = block.match(/<AddtlNtryInf>([^<]+)<\/AddtlNtryInf>/)
      if (addtlMatch) desc = addtlMatch[1]
      if (!desc) {
        const rmtMatch = block.match(/<RmtInf>[\s\S]*?<Ustrd>([^<]+)<\/Ustrd>[\s\S]*?<\/RmtInf>/)
        if (rmtMatch) desc = rmtMatch[1]
      }
      if (!desc) {
        const e2eMatch = block.match(/<EndToEndId>([^<]+)<\/EndToEndId>/)
        if (e2eMatch) desc = e2eMatch[1]
      }
      if (!desc) desc = 'No description'

      entries.push({ description: desc, amount, type, valueDate, reference })
    }

    setParsedEntries(entries)
  }

  const parseJsonFormat = (data: any) => {
    const entries: ParsedEntry[] = []

    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        let amount = entry.amount
        if (entry.amountUnit === 'BAHT' || !entry.amountUnit) {
          amount = Math.round(amount * 100)
        }
        const type = entry.type === 'CREDIT' || entry.type === 'CRDT' ? 'CREDIT' : 'DEBIT'
        entries.push({
          description: entry.description || 'No description',
          amount,
          type,
          valueDate: entry.valueDate || new Date().toISOString().split('T')[0],
          reference: entry.reference,
        })
      }
    }

    setParsedEntries(entries)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    if (index === 0) setParsedEntries([])
  }

  const handleImport = async () => {
    if (!selectedBankAccountId) {
      toast({ title: 'กรุณาเลือกบัญชีธนาคาร', variant: 'destructive' })
      return
    }

    if (files.length === 0) {
      toast({ title: 'กรุณาเลือกไฟล์', variant: 'destructive' })
      return
    }

    setIsUploading(true)
    setImportResult(null)

    try {
      const formData = new FormData()
      formData.append('file', files[0])
      formData.append('bankAccountId', selectedBankAccountId)

      const res = await fetch(`/api/banking/import`, { credentials: 'include', 
        method: 'POST',
        headers: {
          'x-playwright-test': 'true',
        },
        body: formData,
      })

      const result = await res.json()
      setImportResult(result)

      if (result.success) {
        toast({
          title: 'นำเข้าสำเร็จ',
          description: `นำเข้า ${result.data.imported} รายการ`,
        })
        setFiles([])
        setParsedEntries([])
      } else {
        toast({
          title: 'เกิดข้อผิดพลาด',
          description: result.error,
          variant: 'destructive',
        })
      }
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถนำเข้าไฟล์ได้',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
    }
  }

  const formatBaht = (satang: number) => {
    return new Intl.NumberFormat('th-TH', {
      minimumFractionDigits: 2,
    }).format(satang / 100)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">นำเข้าสมุดบัญชีธนาคาร</h2>
        <p className="text-sm text-gray-500">รองรับไฟล์ CAMT.053 XML หรือ JSON</p>
      </div>

      {/* Bank Account Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>บัญชีธนาคาร</Label>
              <select
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={selectedBankAccountId}
                onChange={e => setSelectedBankAccountId(e.target.value)}
              >
                <option value="">-- เลือกบัญชี --</option>
                {bankAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bankName} - {acc.accountNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,.camt053,.json"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือก
          </p>
          <p className="text-xs text-gray-400">
            รองรับ .xml, .camt053, .json (CAMT.053 format)
          </p>
        </CardContent>
      </Card>

      {/* Selected Files */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                ไฟล์ที่เลือก ({files.length})
              </h3>
            </div>
            <div className="space-y-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{file.name}</span>
                    <span className="text-xs text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); removeFile(i) }}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Table */}
      {isParsing && (
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">กำลังอ่านไฟล์...</p>
          </CardContent>
        </Card>
      )}

      {parsedEntries.length > 0 && !isParsing && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                ตัวอย่างรายการ ({parsedEntries.length} รายการ)
              </h3>
              <Badge variant="secondary">{parsedEntries.length} entries</Badge>
            </div>
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>วันที่</TableHead>
                    <TableHead>รายละเอียด</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead className="text-right">จำนวนเงิน</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedEntries.slice(0, 50).map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm whitespace-nowrap">{formatDate(entry.valueDate)}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate" title={entry.description}>
                        {entry.description}
                      </TableCell>
                      <TableCell>
                        <Badge variant={entry.type === 'CREDIT' ? 'default' : 'secondary'} className="text-xs">
                          {entry.type === 'CREDIT' ? 'รับ' : 'จ่าย'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold whitespace-nowrap ${entry.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.type === 'CREDIT' ? '+' : '-'}฿{formatBaht(entry.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedEntries.length > 50 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  แสดง 50 จาก {parsedEntries.length} รายการ
                </p>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {parsedEntries.length > 0 && (
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => { setFiles([]); setParsedEntries([]) }}
          >
            ยกเลิก
          </Button>
          <Button
            onClick={handleImport}
            disabled={isUploading || !selectedBankAccountId}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                กำลังนำเข้า...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                นำเข้า {parsedEntries.length} รายการ
              </>
            )}
          </Button>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className={importResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              {importResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
              <div>
                <p className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {importResult.success ? 'นำเข้าสำเร็จ' : 'เกิดข้อผิดพลาด'}
                </p>
                {importResult.success ? (
                  <p className="text-sm text-green-700">
                    นำเข้า {importResult.data?.imported} รายการ
                  </p>
                ) : (
                  <p className="text-sm text-red-700">{importResult.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Simple Table components inline
function Table({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      {children}
    </table>
  )
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50">{children}</thead>
}

function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100">{children}</tbody>
}

function TableRow({ children }: { children: React.ReactNode }) {
  return <tr>{children}</tr>
}

function TableHead({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase ${className}`}>{children}</th>
}

function TableCell({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return <td className={`px-3 py-2 ${className}`} title={title}>{children}</td>
}
