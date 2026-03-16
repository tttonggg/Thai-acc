'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sun, Moon, Monitor, Type, LayoutGrid, Bell, Globe } from 'lucide-react'

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  density: 'compact' | 'normal' | 'comfortable'
  language: 'th' | 'en'
  pageSize: number
  dateFormat: string
  emailNotifications: boolean
  pushNotifications: boolean
}

interface UserPreferencesDialogProps {
  isOpen: boolean
  onClose: () => void
  preferences: UserPreferences
  onSave: (preferences: UserPreferences) => void
}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  density: 'normal',
  language: 'th',
  pageSize: 25,
  dateFormat: 'DD/MM/YYYY',
  emailNotifications: true,
  pushNotifications: true,
}

export function UserPreferencesDialog({
  isOpen,
  onClose,
  preferences,
  onSave,
}: UserPreferencesDialogProps) {
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>({
    ...defaultPreferences,
    ...preferences,
  })
  const { theme, setTheme } = useTheme()

  const handleSave = () => {
    onSave(localPrefs)
    setTheme(localPrefs.theme)
    onClose()
  }

  const handleThemeChange = (value: string) => {
    setLocalPrefs({ ...localPrefs, theme: value as UserPreferences['theme'] })
  }

  const handleDensityChange = (value: string) => {
    setLocalPrefs({ ...localPrefs, density: value as UserPreferences['density'] })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            ตั้งค่าผู้ใช้
          </DialogTitle>
          <DialogDescription>
            ปรับแต่งการแสดงผลและพฤติกรรมของระบบตามความต้องการของคุณ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* Theme */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">ธีม</h3>
            </div>
            <RadioGroup
              value={localPrefs.theme}
              onValueChange={handleThemeChange}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="light"
                  id="theme-light"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-light"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Sun className="mb-3 h-6 w-6" />
                  สว่าง
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="dark"
                  id="theme-dark"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-dark"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Moon className="mb-3 h-6 w-6" />
                  มืด
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="system"
                  id="theme-system"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="theme-system"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <Monitor className="mb-3 h-6 w-6" />
                  ตามระบบ
                </Label>
              </div>
            </RadioGroup>
          </section>

          {/* Density */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">ความหนาแน่น</h3>
            </div>
            <RadioGroup
              value={localPrefs.density}
              onValueChange={handleDensityChange}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="compact" id="density-compact" />
                <Label htmlFor="density-compact">กระชับ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="normal" id="density-normal" />
                <Label htmlFor="density-normal">ปกติ</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comfortable" id="density-comfortable" />
                <Label htmlFor="density-comfortable">ห่าง</Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              ปรับระยะห่างระหว่างองค์ประกอบต่างๆ บนหน้าจอ
            </p>
          </section>

          {/* Language */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">ภาษา</h3>
            </div>
            <Select
              value={localPrefs.language}
              onValueChange={(v) =>
                setLocalPrefs({ ...localPrefs, language: v as 'th' | 'en' })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="th">ไทย (Thai)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* Page Size */}
          <section className="space-y-4">
            <h3 className="font-medium">จำนวนรายการต่อหน้า</h3>
            <div className="flex items-center gap-4">
              <Slider
                value={[localPrefs.pageSize]}
                onValueChange={([v]) =>
                  setLocalPrefs({ ...localPrefs, pageSize: v })
                }
                min={10}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="w-12 text-right font-mono">
                {localPrefs.pageSize}
              </span>
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-medium">การแจ้งเตือน</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif">อีเมลแจ้งเตือน</Label>
                  <p className="text-sm text-muted-foreground">
                    รับการแจ้งเตือนทางอีเมล
                  </p>
                </div>
                <Switch
                  id="email-notif"
                  checked={localPrefs.emailNotifications}
                  onCheckedChange={(v) =>
                    setLocalPrefs({ ...localPrefs, emailNotifications: v })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notif">แจ้งเตือนแบบพุช</Label>
                  <p className="text-sm text-muted-foreground">
                    แสดงการแจ้งเตือนบนเดสก์ท็อป
                  </p>
                </div>
                <Switch
                  id="push-notif"
                  checked={localPrefs.pushNotifications}
                  onCheckedChange={(v) =>
                    setLocalPrefs({ ...localPrefs, pushNotifications: v })
                  }
                />
              </div>
            </div>
          </section>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button onClick={handleSave}>บันทึกการตั้งค่า</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Hook for managing user preferences
export function useUserPreferences(userId?: string) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (userId) {
      loadPreferences()
    } else {
      // Load from localStorage for guests
      const saved = localStorage.getItem('userPreferences')
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) })
      }
      setIsLoading(false)
    }
  }, [userId])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences({ ...defaultPreferences, ...data.preferences })
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const savePreferences = useCallback(
    async (newPrefs: UserPreferences) => {
      setPreferences(newPrefs)

      if (userId) {
        try {
          await fetch('/api/user/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newPrefs),
          })
        } catch (error) {
          console.error('Failed to save preferences:', error)
        }
      } else {
        localStorage.setItem('userPreferences', JSON.stringify(newPrefs))
      }
    },
    [userId]
  )

  return {
    preferences,
    isLoading,
    savePreferences,
    setPreferences,
  }
}

// Apply density class to container
export function getDensityClass(density: UserPreferences['density']): string {
  switch (density) {
    case 'compact':
      return 'space-y-2 p-2'
    case 'comfortable':
      return 'space-y-6 p-6'
    case 'normal':
    default:
      return 'space-y-4 p-4'
  }
}

// Theme toggle button
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">สลับธีม</span>
    </Button>
  )
}
