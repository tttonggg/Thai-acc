'use client'

import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  Calculator,
  Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'

interface JournalLine {
  id: string
  accountId: string
  accountName: string
  description: string
  debit: number
  credit: number
}

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface JournalEntry {
  id: string
  entryNo: string
  date: string
  description: string
  totalDebit: number
  totalCredit: number
  status: string
}

const initialJournalLines: JournalLine[] = [
  { id: '1', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
  { id: '2', accountId: '', accountName: '', description: '', debit: 0, credit: 0 },
]

export function JournalEntry() {
  const { toast } = useToast()
  const [journalDate, setJournalDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [lines, setLines] = useState<JournalLine[]>(initialJournalLines)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true)
  const [isLoadingEntries, setIsLoadingEntries] = useState(true)

  // Fetch accounts from API
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch('/api/accounts')
        if (!res.ok) {
          console.error('Failed to fetch accounts:', res.status, res.statusText)
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        console.log('Accounts fetched:', data?.length || 0)
        setAccounts(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Error fetching accounts:', error)
        setAccounts([]) // Set empty array on error
        toast({
          title: "ข้อผิดพลาด",
          description: "ไม่สามารถดึงข้อมูลบัญชีได้: " + (error instanceof Error ? error.message : 'Unknown error'),
          variant: "destructive"
        })
      } finally {
        setIsLoadingAccounts(false)
      }
    }

    fetchAccounts()
  }, [toast])

  // Fetch recent entries from API
  useEffect(() => {
    const fetchRecentEntries = async () => {
      try {
        const res = await fetch('/api/journal?limit=10')
        if (res.ok) {
          const result = await res.json()
          setRecentEntries(result.data || [])
        } else {
          console.error('Failed to fetch recent entries')
        }
      } catch (error) {
        console.error('Error fetching recent entries:', error)
      } finally {
        setIsLoadingEntries(false)
      }
    }

    fetchRecentEntries()
  }, [])

  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01
  const difference = Math.abs(totalDebit - totalCredit)

  const addLine = () => {
    setLines([...lines, {
      id: Date.now().toString(),
      accountId: '',
      accountName: '',
      description: '',
      debit: 0,
      credit: 0
    }])
  }

  const removeLine = (id: string) => {
    if (lines.length > 2) {
      setLines(lines.filter(l => l.id !== id))
    }
  }

  const updateLine = (id: string, field: keyof JournalLine, value: string | number) => {
    setLines(lines.map(line => {
      if (line.id === id) {
        if (field === 'accountId') {
          const account = accounts.find(a => a.id === value)
          return { ...line, accountId: value as string, accountName: account?.name || '' }
        }
        return { ...line, [field]: value }
      }
      return line
    }))
  }

  const handleSave = async () => {
    // Validation: at least 2 lines
    if (lines.length < 2) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ต้องมีอย่างน้อย 2 รายการ",
        variant: "destructive"
      })
      return
    }

    // Validation: all lines must have accounts
    const emptyAccounts = lines.filter(l => !l.accountId)
    if (emptyAccounts.length > 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณาเลือกบัญชีให้ครบทุกรายการ",
        variant: "destructive"
      })
      return
    }

    // Validation: must be balanced
    if (!isBalanced) {
      toast({
        title: "ข้อผิดพลาด",
        description: `รายการไม่สมดุล (ผลต่าง: ฿${difference.toLocaleString('th-TH', { minimumFractionDigits: 2 })})`,
        variant: "destructive"
      })
      return
    }

    // Validation: must have at least some amounts
    if (totalDebit === 0 && totalCredit === 0) {
      toast({
        title: "ข้อผิดพลาด",
        description: "ต้องมียอดเดบิตหรือเครดิต",
        variant: "destructive"
      })
      return
    }

    setIsSaving(true)

    try {
      // Prepare data
      const journalData = {
        date: journalDate,
        description,
        reference,
        lines: lines.map(l => ({
          accountId: l.accountId,
          description: l.description,
          debit: l.debit,
          credit: l.credit
        }))
      }

      // POST to API
      const res = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(journalData)
      })

      // Handle response
      if (res.ok) {
        const result = await res.json()
        toast({
          title: "บันทึกสำเร็จ",
          description: `บันทึกบัญชีเลขที่ ${result.data.entryNo} แล้ว`
        })

        // Reset form
        setDescription('')
        setReference('')
        setLines(initialJournalLines)

        // Refresh recent entries
        const entriesRes = await fetch('/api/journal?limit=10')
        if (entriesRes.ok) {
          const entriesResult = await entriesRes.json()
          setRecentEntries(entriesResult.data || [])
        }
      } else {
        const errorData = await res.json()
        toast({
          title: "ข้อผิดพลาด",
          description: errorData.error || 'บันทึกไม่สำเร็จ',
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error saving journal entry:', error)
      toast({
        title: "ข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการบันทึก",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">บันทึกบัญชี</h1>
          <p className="text-gray-500 mt-1">บันทึกรายการบัญชีรายวัน</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" aria-label="คำนวณ">
            <Calculator className="h-4 w-4 mr-2" aria-hidden="true" />
            คำนวณ
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSave}
            disabled={!isBalanced || isSaving}
            aria-busy={isSaving}
            aria-label="บันทึกรายการบัญชี"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                กำลังบันทึก...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                บันทึก
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Journal Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ข้อมูลรายการ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="entryNo">เลขที่บันทึก</Label>
              <Input id="entryNo" value="JV-2024-0001" readOnly className="bg-gray-50" aria-label="เลขที่บันทึก" />
            </div>
            <div>
              <Label htmlFor="date">วันที่</Label>
              <Input 
                id="date" 
                type="date" 
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                aria-label="เลือกวันที่"
              />
            </div>
            <div>
              <Label htmlFor="reference">เอกสารอ้างอิง</Label>
              <Input 
                id="reference" 
                placeholder="เช่น ใบกำกับภาษีเลขที่..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                aria-label="เอกสารอ้างอิง"
              />
            </div>
            <div className="md:col-span-4">
              <Label htmlFor="description">รายการ</Label>
              <Textarea 
                id="description" 
                placeholder="อธิบายรายการบัญชี..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-label="รายการ"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal Lines */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">รายการบัญชี</CardTitle>
          <Button variant="outline" size="sm" onClick={addLine} aria-label="เพิ่มรายการบัญชี">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            เพิ่มรายการ
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]" scope="col">บัญชี</TableHead>
                <TableHead scope="col">รายการ</TableHead>
                <TableHead className="w-[150px] text-right" scope="col">เดบิต</TableHead>
                <TableHead className="w-[150px] text-right" scope="col">เครดิต</TableHead>
                <TableHead className="w-[80px]" scope="col" aria-label="การจัดการ"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.map((line, index) => (
                <TableRow key={line.id} aria-label={`รายการที่ ${index + 1}`}>
                  <TableCell>
                    <Select
                      value={line.accountId}
                      onValueChange={(v) => updateLine(line.id, 'accountId', v)}
                      disabled={isLoadingAccounts}
                      aria-label="เลือกบัญชี"
                    >
                      <SelectTrigger id={`account-${line.id}`}>
                        <SelectValue placeholder={isLoadingAccounts ? "กำลังโหลด..." : "เลือกบัญชี"} />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts?.length > 0 ? (
                          accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-gray-500 text-center">
                            ไม่พบข้อมูลบัญชี
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input 
                      value={line.description}
                      onChange={(e) => updateLine(line.id, 'description', e.target.value)}
                      placeholder="รายการ..."
                      id={`description-${line.id}`}
                      aria-label="รายการ"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      className="text-right"
                      value={line.debit || ''}
                      onChange={(e) => updateLine(line.id, 'debit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      id={`debit-${line.id}`}
                      aria-label="จำนวนเดบิต"
                    />
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number"
                      className="text-right"
                      value={line.credit || ''}
                      onChange={(e) => updateLine(line.id, 'credit', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      id={`credit-${line.id}`}
                      aria-label="จำนวนเครดิต"
                    />
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => removeLine(line.id)}
                      disabled={lines.length <= 2}
                      aria-label="ลบรายการ"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Totals */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-8">
                <div>
                  <span className="text-sm text-gray-500">รวมเดบิต: </span>
                  <span className="font-semibold text-blue-600">฿{totalDebit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">รวมเครดิต: </span>
                  <span className="font-semibold text-green-600">฿{totalCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                </div>
                {!isBalanced && (totalDebit > 0 || totalCredit > 0) && (
                  <div>
                    <span className="text-sm text-gray-500">ผลต่าง: </span>
                    <span className="font-semibold text-red-600">฿{difference.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>
              <div>
                {isBalanced && (totalDebit > 0 || totalCredit > 0) ? (
                  <Badge className="bg-green-100 text-green-800 border-2 border-green-300" role="status" aria-label="สมดุล">
                    สมดุล ✓
                  </Badge>
                ) : totalDebit > 0 || totalCredit > 0 ? (
                  <Badge className="bg-red-100 text-red-800 border-2 border-red-300" role="alert" aria-label="ไม่สมดุล">
                    ไม่สมดุล
                  </Badge>
                ) : (
                  <Badge className="bg-gray-100 text-gray-600 border-2 border-gray-300" role="status" aria-label="รอข้อมูล">
                    รอข้อมูล
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Journal Entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">รายการล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingEntries ? (
            <div className="flex items-center justify-center py-8" role="status" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" aria-hidden="true" />
              <span className="ml-2 text-gray-500">กำลังโหลด...</span>
            </div>
          ) : recentEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              ไม่มีรายการบันทึกบัญชี
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">เลขที่</TableHead>
                  <TableHead scope="col">วันที่</TableHead>
                  <TableHead scope="col">รายการ</TableHead>
                  <TableHead className="text-right" scope="col">เดบิต</TableHead>
                  <TableHead className="text-right" scope="col">เครดิต</TableHead>
                  <TableHead scope="col">สถานะ</TableHead>
                  <TableHead className="text-center" scope="col" aria-label="การจัดการ"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-mono">{entry.entryNo}</TableCell>
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString('th-TH', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>{entry.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      ฿{entry.totalDebit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                      ฿{entry.totalCredit.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      {entry.status === 'POSTED' ? (
                        <Badge className="bg-green-100 text-green-800">ลงบัญชีแล้ว</Badge>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800">ฉบับร่าง</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="แก้ไขรายการ">
                          <Edit className="h-4 w-4 text-blue-600" aria-hidden="true" />
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
    </div>
  )
}
