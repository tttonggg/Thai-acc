'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Mail, Bell, Send } from 'lucide-react'

interface EmailSettingsState {
  smtpHost: string
  smtpPort: number
  smtpUser: string
  smtpPassword: string
  smtpFromEmail: string
  smtpFromName: string
  reminderEnabled: boolean
  reminderDays1: number
  reminderDays2: number
  reminderDays3: number
}

interface Props {
  initial: EmailSettingsState
}

export function EmailSettingsTab({ initial }: Props) {
  const { toast } = useToast()
  const [settings, setSettings] = useState<EmailSettingsState>(initial)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch(`/api/settings`, {
        credentials: 'include',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailSettings: settings }),
      })
      if (response.ok) {
        toast({ title: 'บันทึกสำเร็จ', description: 'ตั้งค่าอีเมลถูกบันทึกเรียบร้อยแล้ว' })
      } else {
        throw new Error('Failed')
      }
    } catch {
      toast({ title: 'บันทึกไม่สำเร็จ', variant: 'destructive', description: 'ไม่สามารถบันทึกตั้งค่าอีเมลได้' })
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    setTesting(true)
    try {
      const response = await fetch(`/api/cron/check-overdue`, { credentials: 'include' })
      const data = await response.json()
      if (response.ok) {
        toast({
          title: 'ทดสอบสำเร็จ',
          description: `ประมวลผล ${data.processed} รายการ — ส่งสำเร็จ ${data.sent} รายการ`,
        })
      } else {
        throw new Error(data.error)
      }
    } catch (err) {
      toast({
        title: 'ทดสอบไม่สำเร็จ',
        variant: 'destructive',
        description: err instanceof Error ? err.message : 'ตรวจสอบการตั้งค่า SMTP',
      })
    } finally {
      setTesting(false)
    }
  }

  const update = (field: keyof EmailSettingsState, value: unknown) =>
    setSettings(prev => ({ ...prev, [field]: value }))

  return (
    <div className="space-y-6">
      {/* SMTP Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            ตั้งค่า SMTP
          </CardTitle>
          <CardDescription>ข้อมูลสำหรับส่งอีเมลแจ้งเตือน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>SMTP Host</Label>
              <Input
                placeholder="smtp.gmail.com"
                value={settings.smtpHost}
                onChange={e => update('smtpHost', e.target.value)}
              />
            </div>
            <div>
              <Label>SMTP Port</Label>
              <Input
                type="number"
                placeholder="587"
                value={settings.smtpPort || ''}
                onChange={e => update('smtpPort', parseInt(e.target.value) || 587)}
              />
            </div>
            <div>
              <Label>SMTP User</Label>
              <Input
                placeholder="your@email.com"
                value={settings.smtpUser}
                onChange={e => update('smtpUser', e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                placeholder="App password (not login password)"
                value={settings.smtpPassword}
                onChange={e => update('smtpPassword', e.target.value)}
              />
            </div>
            <div>
              <Label>From Email</Label>
              <Input
                placeholder="noreply@company.com"
                value={settings.smtpFromEmail}
                onChange={e => update('smtpFromEmail', e.target.value)}
              />
            </div>
            <div>
              <Label>From Name</Label>
              <Input
                placeholder="Keerati Accounting"
                value={settings.smtpFromName}
                onChange={e => update('smtpFromName', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            ตั้งค่าแจ้งเตือนอัตโนมัติ
          </CardTitle>
          <CardDescription>ส่งอีเมลแจ้งเตือนเมื่อใบวางบิลเกินกำหนด</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">เปิดใช้งานแจ้งเตือนอัตโนมัติ</p>
              <p className="text-sm text-gray-500">ส่งอีเมลแจ้งเตือนตามระยะเวลาที่กำหนด</p>
            </div>
            <Switch
              checked={settings.reminderEnabled}
              onCheckedChange={v => update('reminderEnabled', v)}
            />
          </div>

          {settings.reminderEnabled && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>ระดับ 1 (วัน)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.reminderDays1}
                  onChange={e => update('reminderDays1', parseInt(e.target.value) || 7)}
                />
                <p className="text-xs text-gray-500 mt-1">แจ้งเตือน</p>
              </div>
              <div>
                <Label>ระดับ 2 (วัน)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.reminderDays2}
                  onChange={e => update('reminderDays2', parseInt(e.target.value) || 14)}
                />
                <p className="text-xs text-gray-500 mt-1">เรียกชำระ</p>
              </div>
              <div>
                <Label>ระดับ 3 (วัน)</Label>
                <Input
                  type="number"
                  min={1}
                  value={settings.reminderDays3}
                  onChange={e => update('reminderDays3', parseInt(e.target.value) || 30)}
                />
                <p className="text-xs text-gray-500 mt-1">ขอติดตาม</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <Button variant="outline" onClick={handleTest} disabled={testing || !settings.smtpHost}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          ทดสอบ
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          บันทึก
        </Button>
      </div>
    </div>
  )
}
