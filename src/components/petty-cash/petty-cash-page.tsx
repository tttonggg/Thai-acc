'use client'

// ============================================
// 💰 Petty Cash Page
// Agent 03 (Finance): Petty Cash & Advances
// Tabs: Funds (กองทุน) | Vouchers (ใบสำคัญ)
// ============================================

import { useState, useEffect, useCallback } from 'react'
import { Wallet, Receipt, Plus, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

const fc = (n: number) => new Intl.NumberFormat('th-TH', { minimumFractionDigits: 2 }).format(n)
const fd = (d: string) => new Date(d).toLocaleDateString('th-TH', { dateStyle: 'medium' })

interface Fund {
  id: string; code: string; name: string
  maxAmount: number; currentBalance: number; isActive: boolean
  custodian?: { name: string }
}

interface Voucher {
  id: string; voucherNo: string; date: string
  payee: string; description: string; amount: number
  isReimbursed: boolean; fund?: { name: string }
}

// ─── Funds Tab ─────────────────────────────────────────────────────────────

function FundsTab({ onFundsLoaded }: { onFundsLoaded: (funds: Fund[]) => void }) {
  const [funds, setFunds] = useState<Fund[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ code: '', name: '', custodianId: '', glAccountId: '', maxAmount: '' })
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [fRes, uRes] = await Promise.all([
      window.fetch('/api/petty-cash/funds').then(r => r.json()),
      window.fetch('/api/users').then(r => r.json()),
    ])
    if (fRes.success) { setFunds(fRes.data); onFundsLoaded(fRes.data) }
    if (uRes.success || Array.isArray(uRes)) setUsers(Array.isArray(uRes) ? uRes : uRes.data || [])
    setLoading(false)
  }, [onFundsLoaded])
  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSubmit = async () => {
    const res = await window.fetch('/api/petty-cash/funds', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'สร้างกองทุนสำเร็จ', description: `${form.name}: ฿${fc(parseFloat(form.maxAmount))}` })
      setShowAdd(false)
      setForm({ code: '', name: '', custodianId: '', glAccountId: '', maxAmount: '' })
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />สร้างกองทุน</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>สร้างกองทุนเงินสดย่อย</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>รหัส *</Label><Input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="PCF-001" /></div>
                <div><Label>ชื่อกองทุน *</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
              </div>
              <div>
                <Label>ผู้ถือกองทุน *</Label>
                <Select value={form.custodianId} onValueChange={v => setForm(p => ({ ...p, custodianId: v }))}>
                  <SelectTrigger><SelectValue placeholder="เลือกผู้ถือ" /></SelectTrigger>
                  <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>วงเงิน (฿) *</Label><Input type="number" value={form.maxAmount} onChange={e => setForm(p => ({ ...p, maxAmount: e.target.value }))} /></div>
                <div><Label>GL Account ID *</Label><Input value={form.glAccountId} onChange={e => setForm(p => ({ ...p, glAccountId: e.target.value }))} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
              <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {funds.map(f => {
          const usedPct = ((f.maxAmount - f.currentBalance) / f.maxAmount) * 100
          const isLow = usedPct > 80
          return (
            <Card key={f.id} className={`border-2 ${isLow ? 'border-orange-300' : 'border-gray-200'}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-mono text-xs text-gray-400">{f.code}</p>
                    <p className="font-semibold text-gray-800">{f.name}</p>
                  </div>
                  <Wallet className={`h-6 w-6 ${isLow ? 'text-orange-400' : 'text-teal-400'}`} />
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>ยอดคงเหลือ</span>
                    <span>{Math.round(100 - usedPct)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isLow ? 'bg-orange-400' : 'bg-teal-400'}`}
                      style={{ width: `${100 - usedPct}%` }}
                    />
                  </div>
                  <p className={`text-lg font-bold mt-2 ${isLow ? 'text-orange-600' : 'text-teal-600'}`}>
                    ฿{fc(f.currentBalance)}
                    <span className="text-xs font-normal text-gray-400 ml-1">/ ฿{fc(f.maxAmount)}</span>
                  </p>
                  {isLow && <p className="text-xs text-orange-500 mt-1">⚠️ วงเงินใกล้หมด — กรุณาเติมเงิน</p>}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {funds.length === 0 && (
          <div className="col-span-3 text-center py-12 text-gray-400">
            <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>ยังไม่มีกองทุนเงินสดย่อย</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Vouchers Tab ───────────────────────────────────────────────────────────

function VouchersTab({ funds }: { funds: Fund[] }) {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ fundId: '', payee: '', description: '', amount: '', glExpenseAccountId: '', date: '' })
  const { toast } = useToast()

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const res = await window.fetch('/api/petty-cash/vouchers').then(r => r.json())
    if (res.success) setVouchers(res.data)
    setLoading(false)
  }, [])
  useEffect(() => { fetchAll() }, [fetchAll])

  const selectedFund = funds.find(f => f.id === form.fundId)

  const handleSubmit = async () => {
    const res = await window.fetch('/api/petty-cash/vouchers', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form),
    }).then(r => r.json())
    if (res.success) {
      toast({ title: 'บันทึกสำเร็จ', description: `฿${fc(parseFloat(form.amount))} — ${form.payee}` })
      setShowAdd(false)
      setForm({ fundId: '', payee: '', description: '', amount: '', glExpenseAccountId: '', date: '' })
      fetchAll()
    } else {
      toast({ title: 'ข้อผิดพลาด', description: res.error, variant: 'destructive' })
    }
  }

  if (loading) return <Skeleton className="h-64 rounded-xl" />

  const totalUnreimbursed = vouchers.filter(v => !v.isReimbursed).reduce((s, v) => s + v.amount, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {totalUnreimbursed > 0 && (
          <div className="text-sm text-orange-600 font-semibold bg-orange-50 px-3 py-2 rounded-lg">
            ⚠️ รอเบิกคืน: ฿{fc(totalUnreimbursed)}
          </div>
        )}
        <div className="ml-auto">
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm" className="bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4 mr-1" />บันทึกใบสำคัญ</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>ใบสำคัญเงินสดย่อย</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>กองทุน *</Label>
                  <Select value={form.fundId} onValueChange={v => setForm(p => ({ ...p, fundId: v }))}>
                    <SelectTrigger><SelectValue placeholder="เลือกกองทุน" /></SelectTrigger>
                    <SelectContent>
                      {funds.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} (คงเหลือ ฿{fc(f.currentBalance)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedFund && (
                    <p className="text-xs text-gray-400 mt-1">วงเงินคงเหลือ: ฿{fc(selectedFund.currentBalance)}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>วันที่</Label><Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
                  <div><Label>จำนวนเงิน (฿) *</Label><Input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} /></div>
                </div>
                <div><Label>จ่ายให้ *</Label><Input value={form.payee} onChange={e => setForm(p => ({ ...p, payee: e.target.value }))} /></div>
                <div><Label>รายละเอียด *</Label><Input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
                <div><Label>GL บัญชีค่าใช้จ่าย *</Label><Input value={form.glExpenseAccountId} onChange={e => setForm(p => ({ ...p, glExpenseAccountId: e.target.value }))} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
                <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">บันทึก</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เลขที่</TableHead>
                <TableHead>วันที่</TableHead>
                <TableHead>กองทุน</TableHead>
                <TableHead>จ่ายให้</TableHead>
                <TableHead>รายละเอียด</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead className="text-center">เบิกคืน</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400"><Receipt className="h-10 w-10 mx-auto mb-2 opacity-30" />ยังไม่มีใบสำคัญ</TableCell></TableRow>
              ) : vouchers.map(v => (
                <TableRow key={v.id}>
                  <TableCell className="font-mono text-sm">{v.voucherNo}</TableCell>
                  <TableCell className="text-sm">{fd(v.date)}</TableCell>
                  <TableCell className="text-sm">{v.fund?.name || '—'}</TableCell>
                  <TableCell className="text-sm">{v.payee}</TableCell>
                  <TableCell className="text-sm text-gray-600">{v.description}</TableCell>
                  <TableCell className="text-right font-semibold">฿{fc(v.amount)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={v.isReimbursed ? 'default' : 'secondary'} className="text-xs">
                      {v.isReimbursed ? '✅ เบิกแล้ว' : '⏳ รอเบิก'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────

export function PettyCashPage() {
  const [tab, setTab] = useState<'funds' | 'vouchers'>('funds')
  const [funds, setFunds] = useState<Fund[]>([])
  return (
    <div className="space-y-0">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">เงินสดย่อย (Petty Cash)</h1>
        <p className="text-sm text-gray-500">บริหารกองทุนเงินสดย่อยและใบสำคัญ พร้อมติดตามยอดคงเหลือแบบ Real-time</p>
      </div>
      <div className="border-b mb-6">
        <nav className="flex gap-1">
          {[{ id: 'funds' as const, label: 'กองทุน', icon: Wallet }, { id: 'vouchers' as const, label: 'ใบสำคัญ', icon: Receipt }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </nav>
      </div>
      {tab === 'funds'
        ? <FundsTab onFundsLoaded={setFunds} />
        : <VouchersTab funds={funds} />
      }
    </div>
  )
}
