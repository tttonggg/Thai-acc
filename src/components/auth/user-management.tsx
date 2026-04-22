'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  Lock, 
  Unlock,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  Eye
} from 'lucide-react'

interface User {
  id: string
  email: string
  name: string | null
  role: 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER'
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

const roleLabels: Record<string, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  ACCOUNTANT: 'นักบัญชี',
  USER: 'ผู้ใช้ทั่วไป',
  VIEWER: 'ผู้ดูเท่านั้น',
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200',
  ACCOUNTANT: 'bg-blue-100 text-blue-800 border-blue-200',
  USER: 'bg-green-100 text-green-800 border-green-200',
  VIEWER: 'bg-gray-100 text-gray-800 border-gray-200',
}

const roleIcons: Record<string, React.ReactNode> = {
  ADMIN: <ShieldAlert className="w-4 h-4" />,
  ACCOUNTANT: <ShieldCheck className="w-4 h-4" />,
  USER: <Shield className="w-4 h-4" />,
  VIEWER: <Eye className="w-4 h-4" />,
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'ACCOUNTANT' | 'USER' | 'VIEWER',
    isActive: true,
  })
  const [formLoading, setFormLoading] = useState(false)

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users`, { credentials: 'include' })
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('')
        setSuccess('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Reset form
  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'USER',
      isActive: true,
    })
    setSelectedUser(null)
  }

  // Add user
  const handleAddUser = async () => {
    if (!formData.email || !formData.password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน')
      return
    }

    try {
      setFormLoading(true)
      const response = await fetch(`/api/users`, { credentials: 'include', 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to create user')
      }

      setSuccess('เพิ่มผู้ใช้สำเร็จ')
      setShowAddDialog(false)
      resetForm()
      fetchUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถเพิ่มผู้ใช้ได้'
      setError(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Edit user
  const handleEditUser = async () => {
    if (!selectedUser || !formData.email) {
      setError('ข้อมูลไม่ครบถ้วน')
      return
    }

    try {
      setFormLoading(true)
      const updateData: Record<string, unknown> = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      }
      
      // Only include password if provided
      if (formData.password) {
        updateData.password = formData.password
      }

      const response = await fetch(`/api/users/${selectedUser.id}`, { credentials: 'include', 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to update user')
      }

      setSuccess('อัปเดตผู้ใช้สำเร็จ')
      setShowEditDialog(false)
      resetForm()
      fetchUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถอัปเดตผู้ใช้ได้'
      setError(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Delete user
  const handleDeleteUser = async () => {
    if (!selectedUser) return

    try {
      setFormLoading(true)
      const response = await fetch(`/api/users/${selectedUser.id}`, { credentials: 'include', 
        method: 'DELETE',
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData.error || 'Failed to delete user')
      }

      setSuccess('ลบผู้ใช้สำเร็จ')
      setShowDeleteDialog(false)
      resetForm()
      fetchUsers()
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'ไม่สามารถลบผู้ใช้ได้'
      setError(errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  // Open edit dialog
  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setFormData({
      email: user.email,
      name: user.name || '',
      password: '',
      role: user.role,
      isActive: user.isActive,
    })
    setShowEditDialog(true)
  }

  // Open delete dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user)
    setShowDeleteDialog(true)
  }

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6" />
            จัดการผู้ใช้งาน
          </h1>
          <p className="text-gray-600 mt-1">จัดการบัญชีผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
        </div>
        <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มผู้ใช้
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200 text-green-800">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>รายการผู้ใช้งาน ({users.length} คน)</CardTitle>
          <CardDescription>รายชื่อผู้ใช้ทั้งหมดในระบบ</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">ไม่พบข้อมูลผู้ใช้</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้</TableHead>
                  <TableHead>บทบาท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>เข้าสู่ระบบล่าสุด</TableHead>
                  <TableHead>สร้างเมื่อ</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                          {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{user.name || '-'}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[user.role]}>
                        <span className="flex items-center gap-1">
                          {roleIcons[user.role]}
                          {roleLabels[user.role]}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? 'default' : 'secondary'}>
                        {user.isActive ? (
                          <><Unlock className="w-3 h-3 mr-1" /> ใช้งานได้</>
                        ) : (
                          <><Lock className="w-3 h-3 mr-1" /> ปิดการใช้งาน</>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.lastLoginAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => openDeleteDialog(user)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Role Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">คำอธิบายบทบาท</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-5 h-5 text-red-600" />
                <span className="font-semibold text-red-800">ผู้ดูแลระบบ (Admin)</span>
              </div>
              <p className="text-sm text-red-700">เข้าถึงทุกฟังก์ชัน จัดการผู้ใช้ ตั้งค่าระบบ</p>
            </div>
            <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-800">นักบัญชี (Accountant)</span>
              </div>
              <p className="text-sm text-blue-700">บันทึกบัญชี ออกใบแจ้งหนี้ รายงานการเงิน</p>
            </div>
            <div className="p-4 rounded-lg border bg-green-50 border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-green-600" />
                <span className="font-semibold text-green-800">ผู้ใช้ทั่วไป (User)</span>
              </div>
              <p className="text-sm text-green-700">สร้าง/แก้ไขข้อมูลลูกค้า ผู้ขาย ใบแจ้งหนี้</p>
            </div>
            <div className="p-4 rounded-lg border bg-gray-50 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-gray-600" />
                <span className="font-semibold text-gray-800">ผู้ดูเท่านั้น (Viewer)</span>
              </div>
              <p className="text-sm text-gray-700">ดูข้อมูลได้อย่างเดียว แก้ไขไม่ได้</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5" />
              เพิ่มผู้ใช้ใหม่
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้ใหม่
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-email">อีเมล *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">ชื่อ</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ชื่อผู้ใช้"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-password">รหัสผ่าน *</Label>
              <Input
                id="add-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-role">บทบาท</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as typeof formData.role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ผู้ดูแลระบบ (Admin)</SelectItem>
                  <SelectItem value="ACCOUNTANT">นักบัญชี (Accountant)</SelectItem>
                  <SelectItem value="USER">ผู้ใช้ทั่วไป (User)</SelectItem>
                  <SelectItem value="VIEWER">ผู้ดูเท่านั้น (Viewer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAddUser} disabled={formLoading}>
              {formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5" />
              แก้ไขผู้ใช้
            </DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลผู้ใช้ {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">อีเมล *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">ชื่อ</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">รหัสผ่านใหม่ (เว้นว่างหากไม่ต้องการเปลี่ยน)</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">บทบาท</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value as typeof formData.role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">ผู้ดูแลระบบ (Admin)</SelectItem>
                  <SelectItem value="ACCOUNTANT">นักบัญชี (Accountant)</SelectItem>
                  <SelectItem value="USER">ผู้ใช้ทั่วไป (User)</SelectItem>
                  <SelectItem value="VIEWER">ผู้ดูเท่านั้น (Viewer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">สถานะ</Label>
              <Select
                value={formData.isActive ? 'active' : 'inactive'}
                onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">ใช้งานได้</SelectItem>
                  <SelectItem value="inactive">ปิดการใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditUser} disabled={formLoading}>
              {formLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">ยืนยันการลบ</DialogTitle>
            <DialogDescription>
              คุณต้องการลบผู้ใช้ <strong>{selectedUser?.email}</strong> ใช่หรือไม่?
              <br />
              <span className="text-red-500">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteUser}
              disabled={formLoading}
            >
              {formLoading ? 'กำลังลบ...' : 'ลบ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
