'use client'
import { useState, useEffect, useCallback } from 'react'
import { Landmark, CreditCard, Plus, RefreshCw, CheckCircle, Clock, AlertCircle, XCircle, Scale } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' })

interface BankAccount { id: string; code: string; bankName: string; branchName: string; accountNumber: string; accountName: string; glAccountId: string }
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
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ code: '', bankName: '', branchName: '', accountNumber: '', accountName: '', glAccountId: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch('/api/bank-accounts').then(r => r.json())
    if (res.success) setAccounts(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async () => {
    const res = await window.fetch('/api/bank-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }).then(r => r.json())
    if (res.success) { toast({ title: 'บันทึกสำเร็จ' }); setShowAdd(false); fetchAll() }
    else toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />เพิ่มบัญชีธนาคาร</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>เพิ่มบัญชีธนาคาร</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>รหัส *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="BANK-001" /></div>
                <div><Label>ธนาคาร *</Label><Input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} placeholder="ธ.กสิกรไทย" /></div>
              </div>
              <div><Label>สาขา</Label><Input value={form.branchName} onChange={e => setForm(p => ({ ...p, branchName: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>เลขที่บัญชี *</Label><Input value={form.accountNumber} onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))} /></div>
                <div><Label>ชื่อบัญชี</Label><Input value={form.accountName} onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))} /></div>
              </div>
              <div><Label>GL Account ID *</Label><Input value={form.glAccountId} onChange={e => setForm(p => ({ ...p, glAccountId: e.target.value }))} placeholder="ID ของบัญชีแยกประเภท" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {accounts.map(a => (
          <Card key={a.id} className="bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-blue-200 text-xs uppercase tracking-wide">{a.bankName}</p>
                  <p className="text-xl font-bold mt-1 font-mono">{a.accountNumber}</p>
                  <p className="text-blue-100 text-sm mt-1">{a.accountName}</p>
                  {a.branchName && <p className="text-blue-300 text-xs mt-1">สาขา {a.branchName}</p>}
                </div>
                <Landmark className="h-8 w-8 text-blue-300" />
              </div>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-2 text-center py-12 text-gray-400"><Landmark className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>ยังไม่มีบัญชีธนาคาร</p></div>
        )}
      </div>
    </div>
  )
}

function ChequeRegisterTab() {
  const [cheques, setCheques] = useState<Cheque[]>([])
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ chequeNo: '', type: 'RECEIVE', bankAccountId: '', amount: '', dueDate: '', payeeName: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [chRes, accRes] = await Promise.all([window.fetch('/api/cheques').then(r => r.json()), window.fetch('/api/bank-accounts').then(r => r.json())])
    if (chRes.success) setCheques(chRes.data)
    if (accRes.success) setAccounts(accRes.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async () => {
    const res = await window.fetch('/api/cheques', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount) }) }).then(r => r.json())
    if (res.success) { toast({ title: 'บันทึกสำเร็จ' }); setShowAdd(false); fetchAll() }
    else toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />เพิ่มเช็ค</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>บันทึกเช็ค</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>เลขที่เช็ค *</Label><Input value={form.chequeNo} onChange={e => setForm(p => ({ ...p, chequeNo: e.target.value }))} /></div>
                <div><Label>ประเภท</Label>
                  <Select value={form.type} onValueChange={v => setForm(p => ({ ...p, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="RECEIVE">เช็ครับ</SelectItem><SelectItem value="PAY">เช็คจ่าย</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>บัญชีธนาคาร *</Label>
                <Select value={form.bankAccountId} onValueChange={v => setForm(p => ({ ...p, bankAccountId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกบัญชี" /></SelectTrigger>
                  <SelectContent>{accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.bankName} {a.accountNumber}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>จำนวน *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                <div><Label>วันครบกำหนด *</Label><Input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              </div>
              <div><Label>ผู้รับ/จ่าย</Label><Input value={form.payeeName} onChange={e => setForm(p => ({ ...p, payeeName: e.target.value }))} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>เลขที่</TableHead><TableHead>ประเภท</TableHead><TableHead>ธนาคาร</TableHead><TableHead>ผู้รับ/จ่าย</TableHead><TableHead>ครบกำหนด</TableHead><TableHead className="text-right">จำนวน</TableHead><TableHead className="text-center">สถานะ</TableHead></TableRow></TableHeader>
            <TableBody>
              {cheques.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">ยังไม่มีรายการเช็ค</TableCell></TableRow>
                : cheques.map(c => {
                  const st = CHEQUE_STATUS[c.status] || { label: c.status, color: 'bg-gray-100 text-gray-600' }
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.chequeNo}</TableCell>
                      <TableCell><Badge variant={c.type === 'RECEIVE' ? 'default' : 'secondary'} className="text-xs">{c.type === 'RECEIVE' ? 'รับ' : 'จ่าย'}</Badge></TableCell>
                      <TableCell className="text-sm">{c.bankAccount.bankName}</TableCell>
                      <TableCell className="text-sm">{c.payeeName || '—'}</TableCell>
                      <TableCell className="text-sm">{fd(c.dueDate)}</TableCell>
                      <TableCell className="text-right font-semibold">฿{fc(c.amount)}</TableCell>
                      <TableCell className="text-center"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                    </TableRow>
                  )
                })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ReconciliationTab() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [statementDate, setStatementDate] = useState('')
  const [statementBalance, setStatementBalance] = useState('')
  const [unreconciledCheques, setUnreconciledCheques] = useState<Cheque[]>([])
  const [selectedCheques, setSelectedCheques] = useState<Set<string>>(new Set())
  const [calculatedBookBalance, setCalculatedBookBalance] = useState(0)
  const [difference, setDifference] = useState(0)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Fetch bank accounts
  useEffect(() => {
    const fetchAccounts = async () => {
      const res = await window.fetch('/api/bank-accounts').then(r => r.json())
      if (res.success) setAccounts(res.data)
    }
    fetchAccounts()
  }, [])

  // Fetch unreconciled items when account is selected
  useEffect(() => {
    if (selectedAccountId) {
      const fetchItems = async () => {
        setLoading(true)
        const res = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`).then(r => r.json())
        if (res.success) {
          setUnreconciledCheques(res.data.unreconciledCheques)
          // Calculate initial book balance
          const bookBalance = res.data.unreconciledCheques.reduce((acc: number, cheque: Cheque) => {
            return cheque.type === 'RECEIVE' ? acc + cheque.amount : acc - cheque.amount
          }, 0)
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

    const res = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`, {
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
      const refreshRes = await window.fetch(`/api/bank-accounts/${selectedAccountId}/reconcile`).then(r => r.json())
      if (refreshRes.success) {
        setUnreconciledCheques(refreshRes.data.unreconciledCheques)
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
                รายการที่ยังไม่กระทบยอด ({unreconciledCheques.length})
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
  const [tab, setTab] = useState<'accounts' | 'cheques' | 'reconciliation'>('accounts')
  return (
    <div className="space-y-0">
      <div className="mb-4"><h1 className="text-2xl font-bold text-gray-800">บัญชีธนาคาร & เช็ค</h1><p className="text-sm text-gray-500">จัดการบัญชีธนาคาร เช็ครับ-จ่าย และกระทบยอด</p></div>
      <div className="border-b mb-6">
        <nav className="flex gap-1">
          {[{ id: 'accounts' as const, label: 'บัญชีธนาคาร', icon: Landmark }, { id: 'cheques' as const, label: 'ทะเบียนเช็ค', icon: CreditCard }, { id: 'reconciliation' as const, label: 'กระทบยอด', icon: Scale }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'accounts' ? <BankAccountsTab /> : tab === 'cheques' ? <ChequeRegisterTab /> : <ReconciliationTab />}
    </div>
  )
}
