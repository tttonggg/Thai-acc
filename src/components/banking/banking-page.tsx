'use client'
import { useState, useEffect, useCallback } from 'react'
import { Landmark, CreditCard, Plus, RefreshCw, CheckCircle, Clock, AlertCircle, XCircle, Scale, Pencil, Trash2, ArrowRight, X, Upload, Link2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { BankAccountEditDialog } from './bank-account-edit-dialog'
import { ChequeEditDialog } from './cheque-edit-dialog'
import { BankStatementImport } from './bank-statement-import'
import { BankMatching } from './bank-matching'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' })

interface BankAccount { id: string; code: string; bankName: string; branchName: string; accountNumber: string; accountName: string; glAccountId: string; isActive: boolean }
interface Cheque { id: string; chequeNo: string; type: 'RECEIVE' | 'PAY'; bankAccount: { bankName: string }; amount: number; dueDate: string; payeeName: string | null; status: string; isReconciled: boolean }
interface ReconciliationItem { id: string; type: string }

const CHEQUE_STATUS: Record<string, { label: string; color: string }> = {
  ON_HAND: { label: 'ถืออยู่', color: 'bg-blue-100 text-blue-700' },
  DEPOSITED: { label: 'นำฝาก', color: 'bg-yellow-100 text-yellow-700' },
  CLEARED: { label: 'ผ่านแล้ว', color: 'bg-green-100 text-green-700' },
  BOUNCED: { label: 'เด้ง', color: 'bg-red-100 text-red-700' },
  CANCELLED: { label: 'ยกเลิก', color: 'bg-gray-100 text-gray-500' },
}

function BankAccountsTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null)
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch(`/api/bank-accounts`, { credentials: 'include' }).then(r => r.json())
    if (res.success) setAccounts(res.data)
    setLoading(false)
  }, [])
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account)
    setShowEdit(true)
  }

  const handleAdd = () => {
    setSelectedAccount(null)
    setShowEdit(true)
  }

  const handleDelete = async () => {
    if (!accountToDelete) return

    const res = await window.fetch(`/api/bank-accounts/${accountToDelete.id}`, { credentials: 'include',  method: 'DELETE' }).then(r => r.json())
    if (res.success) {
      toast({ title: 'ลบบัญชีธนาคารสำเร็จ' })
      setShowDeleteDialog(false)
      setAccountToDelete(null)
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const confirmDelete = (account: BankAccount) => {
    setAccountToDelete(account)
    setShowDeleteDialog(true)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />เพิ่มบัญชีธนาคาร
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(a => (
          <Card key={a.id} className={`${a.isActive ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gray-300'} text-white relative`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className={`${a.isActive ? 'text-blue-200' : 'text-gray-500'} text-xs uppercase tracking-wide`}>{a.bankName}</p>
                  <p className="text-xl font-bold mt-1 font-mono">{a.accountNumber}</p>
                  <p className={`${a.isActive ? 'text-blue-100' : 'text-gray-600'} text-sm mt-1`}>{a.accountName || '—'}</p>
                  {a.branchName && <p className={`${a.isActive ? 'text-blue-300' : 'text-gray-500'} text-xs mt-1`}>สาขา {a.branchName}</p>}
                  {!a.isActive && <Badge variant="secondary" className="mt-2">ระงับการใช้งาน</Badge>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleEdit(a)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-white hover:bg-red-500/50" onClick={() => confirmDelete(a)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400"><Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>ยังไม่มีบัญชีธนาคาร</p></div>
        )}
      </div>

      {/* Edit Dialog */}
      <BankAccountEditDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={fetchAll}
        account={selectedAccount}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบบัญชีธนาคาร</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            คุณต้องการลบบัญชีธนาคาร <strong>{accountToDelete?.bankName} - {accountToDelete?.accountNumber}</strong> ใช่หรือไม่?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ChequeRegisterTab() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [selectedCheque, setSelectedCheque] = useState<Cheque | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [chequeToDelete, setChequeToDelete] = useState<Cheque | null>(null)
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [chRes, accRes] = await Promise.all([window.fetch(`/api/cheques`, { credentials: 'include' }).then(r => r.json()), window.fetch(`/api/bank-accounts`, { credentials: 'include' }).then(r => r.json())])
    if (chRes.success) setCheques(chRes.data)
    if (accRes.success) setAccounts(accRes.data)
    setLoading(false)
  }, [])
  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const handleEdit = (cheque: Cheque) => {
    setSelectedCheque(cheque)
    setShowEdit(true)
  }

  const handleAdd = () => {
    setSelectedCheque(null)
    setShowEdit(true)
  }

  const handleDelete = async () => {
    if (!chequeToDelete) return

    const res = await window.fetch(`/api/cheques/${chequeToDelete.id}`, { credentials: 'include',  method: 'DELETE' }).then(r => r.json())
    if (res.success) {
      toast({ title: 'ลบเช็คสำเร็จ' })
      setShowDeleteDialog(false)
      setChequeToDelete(null)
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const confirmDelete = (cheque: Cheque) => {
    setChequeToDelete(cheque)
    setShowDeleteDialog(true)
  }

  const updateStatus = async (cheque: Cheque, newStatus: string) => {
    const res = await window.fetch(`/api/cheques/${cheque.id}`, { credentials: 'include', 
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus, clearedDate: new Date().toISOString() })
    }).then(r => r.json())

    if (res.success) {
      toast({ title: 'อัปเดตสถานะเช็คสำเร็จ' })
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-12 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-1" />เพิ่มเช็ค
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <Table>
              <TableHeader><TableRow><TableHead>เลขที่</TableHead><TableHead>ประเภท</TableHead><TableHead>ธนาคาร</TableHead><TableHead>ผู้รับ/จ่าย</TableHead><TableHead>ครบกำหนด</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead className="text-center">สถานะ</TableHead><TableHead className="text-center">จัดการ</TableHead></TableRow></TableHeader>
              <TableBody>
                {cheques.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-400">ยังไม่มีรายการเช็ค</TableCell></TableRow>
                  : cheques.map(c => {
                    const st = CHEQUE_STATUS[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-600' }
                    const canEdit = c.status === 'ON_HAND'
                    return (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.chequeNo}</TableCell>
                        <TableCell><Badge variant={c.type === 'RECEIVE' ? 'default' : 'secondary'} className="text-xs">{c.type === 'RECEIVE' ? 'รับ' : 'จ่าย'}</Badge></TableCell>
                        <TableCell className="text-sm">{c.bankAccount.bankName}</TableCell>
                        <TableCell className="text-sm">{c.payeeName || '—'}</TableCell>
                        <TableCell className="text-sm">{fd(c.dueDate)}</TableCell>
                        <TableCell className="text-right font-semibold">฿{fc(c.amount)}</TableCell>
                        <TableCell className="text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center gap-1">
                            {canEdit && (
                              <>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleEdit(c)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => confirmDelete(c)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                            {c.status === 'ON_HAND' && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-700" onClick={() => updateStatus(c, 'DEPOSITED')} title="นำฝาก">
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            )}
                            {c.status === 'DEPOSITED' && (
                              <>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-700" onClick={() => updateStatus(c, 'CLEARED')} title="ผ่าน">
                                  <CheckCircle className="h-3 w-3" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => updateStatus(c, 'BOUNCED')} title="เด้ง">
                                  <XCircle className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ChequeEditDialog
        open={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={fetchAll}
        cheque={selectedCheque}
        bankAccounts={accounts}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบเช็ค</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            คุณต้องการลบเช็คเลขที่ <strong>{chequeToDelete?.chequeNo}</strong> ใช่หรือไม่?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>ยกเลิก</Button>
            <Button variant="destructive" onClick={handleDelete}>ลบ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ReconciliationTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [statementDate, setStatementDate] = useState('')
  const [statementBalance, setStatementBalance] = useState('')
  const [unreconciledCheques, setUnreconciledCheques] = useState<Cheque[]>([])
  const [unreconciledReceipts, setUnreconciledReceipts] = useState<any[]>([])
  const [unreconciledPayments, setUnreconciledPayments] = useState<any[]>([])
  const [selectedCheques, setSelectedCheques] = useState<Set<string>>(new Set())
  const [calculatedBookBalance, setCalculatedBookBalance] = useState(0)
  const [difference, setDifference] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await window.fetch(`/api/bank-accounts`, { credentials: 'include' }).then(r => r.json())
      if (res.success) setAccounts(res.data)
    }
    fetchAccounts()
  }, [])

  // Fetch unreconciled items when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      const fetchItems = async () => {
        setLoading(true)
        const res = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`, { credentials: 'include' }).then(r => r.json())
        if (res.success) {
          setUnreconciledCheques(res.data.unreconciledCheques)
          setUnreconciledReceipts(res.data.unreconciledReceipts || [])
          setUnreconciledPayments(res.data.unreconciledPayments || [])
          // Calculate initial book balance from ALL unreconciled items
          // Cheques RECEIVE: +, Cheques PAYMENT: -
          // Receipts: always + (money into bank)
          // Payments: always - (money out of bank)
          const chequesTotal = (res.data.unreconciledCheques || []).reduce((acc: number, c: Cheque) => 
            acc + (c.type === 'RECEIVE' ? c.amount : -c.amount), 0)
          const receiptsTotal = (res.data.unreconciledReceipts || []).reduce((acc: number, r: any) => 
            acc + r.amount, 0)
          const paymentsTotal = (res.data.unreconciledPayments || []).reduce((acc: number, p: any) => 
            acc - p.amount, 0)
          const bookBalance = chequesTotal + receiptsTotal + paymentsTotal
          setCalculatedBookBalance(bookBalance)
        }
        setLoading(false)
      }
      fetchItems()
    }
  }, [selectedAccountId])

  // Calculate book balance when cheques are selected/deselected
  useEffect(() => {
    if (selectedAccountId && unreconciledCheques.length > 0) {
      const selectedChequeObjects = unreconciledCheques.filter(c => selectedCheques.has(c.id))
      const bookBalance = selectedChequeObjects.reduce((acc, cheque) => {
        return cheque.type === 'RECEIVE' ? acc + cheque.amount : acc - cheque.amount
      }, 0)
      setCalculatedBookBalance(bookBalance)

      const stmtBalance = parseFloat(statementBalance) || 0
      setDifference(stmtBalance - bookBalance)
    }
  }, [selectedCheques, statementBalance, unreconciledCheques])

  const handleReconcile = async () => {
    if (!selectedAccountId || !statementDate || !statementBalance) {
      toast({ title: 'กรุณากรอกข้อมูลให้ครบ', variant: 'destructive' })
      return
    }

    const reconciledItems = Array.from(selectedCheques).map(id => ({ id, type: 'CHEQUE' as const }))

    const res = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`, { credentials: 'include', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        statementDate,
        statementBalance: parseFloat(statementBalance),
        reconciledItems,
      }),
    }).then(r => r.json())

    if (res.success) {
      toast({
        title: 'กระทบยอดสำเร็จ',
        description: `ยอดตามสมุดบัญชี: ฿${fc(res.data.bookBalance)}, ผลต่าง: ฿${fc(res.data.difference)}`,
      })
      // Reset form
      setSelectedCheques(new Set())
      setStatementBalance('')
      // Refresh unreconciled items
      const refreshRes = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`, { credentials: 'include' }).then(r => r.json())
      if (refreshRes.success) {
        setUnreconciledCheques(refreshRes.data.unreconciledCheques)
        setUnreconciledReceipts(refreshRes.data.unreconciledReceipts || [])
        setUnreconciledPayments(refreshRes.data.unreconciledPayments || [])
      }
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  const toggleCheque = (id: string) => {
    const newSelected = new Set(selectedCheques)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedCheques(newSelected)
  }

  return (
    <div className="space-y-4">
      {/* Bank Account and Statement Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>บัญชีธนาคาร</Label>
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.bankName} - {a.accountNumber}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>วันที่รายการเดินบัญชี</Label>
              <Input type="date" value={statementDate} onChange={e => setStatementDate(e.target.value)} />
            </div>
            <div>
              <Label>ยอดเงินตามรายการเดินบัญชี</Label>
              <Input type="number" value={statementBalance} onChange={e => setStatementBalance(e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Comparison */}
      {selectedAccountId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className={difference === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">ยอดเงินตามรายการเดินบัญชี</p>
              <p className="text-2xl font-bold text-gray-800">฿{fc(parseFloat(statementBalance) || 0)}</p>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">ยอดเงินตามสมุดบัญชี (จากรายการที่เลือก)</p>
              <p className="text-2xl font-bold text-gray-800">฿{fc(calculatedBookBalance)}</p>
            </CardContent>
          </Card>
          <Card className={difference === 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">ผลต่าง</p>
              <p className={`text-2xl font-bold ${difference === 0 ? 'text-green-600' : 'text-red-600'}`}>
                {difference >= 0 ? '+' : ''}฿{fc(difference)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Two Panel View */}
      {selectedAccountId && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Unreconciled Items */}
          <Card>
            <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  รายการที่ยังไม่กระทบยอด (เช็ค: {unreconciledCheques.length}, ใบเสร็จ: {unreconciledReceipts.length}, ใบจ่าย: {unreconciledPayments.length})
                </h3>
              {loading ? (
                <Skeleton className="h-64" />
              ) : unreconciledCheques.length === 0 ? (
                <p className="text-center text-gray-400 py-8">ไม่มีรายการที่ยังไม่กระทบยอด</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unreconciledCheques.map(cheque => (
                    <div
                      key={cheque.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCheques.has(cheque.id) ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'
                      }`}
                      onClick={() => toggleCheque(cheque.id)}
                    >
                      <Checkbox checked={selectedCheques.has(cheque.id)} />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cheque.chequeNo}</p>
                        <p className="text-xs text-gray-500">{fd(cheque.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${cheque.type === 'RECEIVE' ? 'text-green-600' : 'text-red-600'}`}>
                          {cheque.type === 'RECEIVE' ? '+' : '-'}฿{fc(cheque.amount)}
                        </p>
                        <Badge variant={cheque.type === 'RECEIVE' ? 'default' : 'secondary'} className="text-xs">
                          {cheque.type === 'RECEIVE' ? 'รับ' : 'จ่าย'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected for Reconciliation */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                รายการที่เลือกกระทบยอด ({selectedCheques.size})
              </h3>
              {selectedCheques.size === 0 ? (
                <p className="text-center text-gray-400 py-8">ยังไม่ได้เลือกรายการ</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {unreconciledCheques.filter(c => selectedCheques.has(c.id)).map(cheque => (
                    <div key={cheque.id} className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{cheque.chequeNo}</p>
                        <p className="text-xs text-gray-500">{fd(cheque.dueDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${cheque.type === 'RECEIVE' ? 'text-green-600' : 'text-red-600'}`}>
                          {cheque.type === 'RECEIVE' ? '+' : '-'}฿{fc(cheque.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reconcile Button */}
              <div className="mt-4 pt-4 border-t">
                <Button
                  onClick={handleReconcile}
                  disabled={selectedCheques.size === 0 || !statementDate || !statementBalance}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Scale className="h-4 w-4 mr-2" />
                  กระทบยอด ({selectedCheques.size} รายการ)
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export function BankingPage() {
  const [tab, setTab] = useState<'accounts' | 'cheques' | 'reconciliation' | 'import' | 'matching'>('accounts')
  return (
    <div className="space-y-0">
      <div className="mb-4"><h1 className="text-2xl font-bold text-gray-800">บัญชีธนาคาร & เช็ค</h1><p className="text-sm text-gray-500">จัดการบัญชีธนาคาร เช็ครับ-จ่าย และกระทบยอด</p></div>
      <div className="border-b mb-6">
        <nav className="flex gap-1">
          {[
            { id: 'accounts' as const, label: 'บัญชีธนาคาร', icon: Landmark },
            { id: 'cheques' as const, label: 'ทะเบียนเช็ค', icon: CreditCard },
            { id: 'import' as const, label: 'นำเข้า Bank', icon: Upload },
            { id: 'matching' as const, label: 'จับคู่', icon: Link2 },
            { id: 'reconciliation' as const, label: 'กระทบยอด', icon: Scale },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'accounts' ? <BankAccountsTab /> :
       tab === 'cheques' ? <ChequeRegisterTab /> :
       tab === 'import' ? <BankStatementImport /> :
       tab === 'matching' ? <BankMatching /> :
       <ReconciliationTab />}
    </div>
  )
}
