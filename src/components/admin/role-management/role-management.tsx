'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth-store'

interface Permission {
  id: string
  module: string
  action: string
  code: string
  description: string | null
}

interface Role {
  id: string
  name: string
  description: string | null
  type: 'SYSTEM' | 'CUSTOM'
  isActive: boolean
  permissions: Array<{
    permission: Permission
  }>
  _count: {
    employeeRoles: number
  }
}

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const { hasPermission } = useAuthStore()

  const canManage = hasPermission('admin', 'manage')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/roles'),
        fetch('/api/admin/permissions'),
      ])

      if (!rolesRes.ok || !permsRes.ok) {
        throw new Error('Failed to load data')
      }

      const rolesData = await rolesRes.json()
      const permsData = await permsRes.json()

      setRoles(rolesData.data || [])
      setPermissions(permsData.data?.permissions || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function togglePermission(roleId: string, permissionId: string, enabled: boolean) {
    if (!canManage) return

    try {
      if (enabled) {
        await fetch('/api/admin/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId, addPermissionId: permissionId }),
        })
      } else {
        await fetch('/api/admin/roles', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roleId, removePermissionId: permissionId }),
        })
      }
      await loadData()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  if (loading) {
    return <div className="p-6">กำลังโหลด...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">เกิดข้อผิดพลาด: {error}</div>
  }

  const systemRoles = roles.filter(r => r.type === 'SYSTEM')
  const customRoles = roles.filter(r => r.type === 'CUSTOM')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">การจัดการสิทธิ์ (Role Management)</h1>
      </div>

      {!canManage && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">คุณไม่มีสิทธิ์ในการจัดการบทบาท ติดต่อผู้ดูแลระบบ</p>
        </div>
      )}

      {/* System Roles */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">บทบาทระบบ (System Roles)</h2>
        <div className="grid gap-4">
          {systemRoles.map(role => (
            <div
              key={role.id}
              className={`border rounded-lg p-4 ${selectedRole?.id === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{role.name}</h3>
                  <p className="text-sm text-gray-500">{role.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {role._count.employeeRoles} ผู้ใช้
                </div>
              </div>

              {selectedRole?.id === role.id && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium mb-2">สิทธิ์ในบทบาทนี้:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(rp => (
                      <span
                        key={rp.permission.id}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {rp.permission.code}
                      </span>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-gray-400 text-sm">ไม่มีสิทธิ์</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Roles */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">บทบาทที่กำหนดเอง (Custom Roles)</h2>
        {customRoles.length === 0 ? (
          <p className="text-gray-500">ยังไม่มีบทบาทที่กำหนดเอง</p>
        ) : (
          <div className="grid gap-4">
            {customRoles.map(role => (
              <div
                key={role.id}
                className={`border rounded-lg p-4 ${selectedRole?.id === role.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                onClick={() => setSelectedRole(selectedRole?.id === role.id ? null : role)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{role.name}</h3>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {role._count.employeeRoles} ผู้ใช้
                  </div>
                </div>

                {selectedRole?.id === role.id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium mb-2">สิทธิ์ในบทบาทนี้:</p>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.map(rp => (
                        <span
                          key={rp.permission.id}
                          className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                        >
                          {rp.permission.code}
                        </span>
                      ))}
                      {role.permissions.length === 0 && (
                        <span className="text-gray-400 text-sm">ไม่มีสิทธิ์</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permission Reference */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">สิทธิ์ทั้งหมด (All Permissions)</h2>
        <div className="border rounded-lg p-4">
          {Object.entries(
            permissions.reduce((acc, perm) => {
              if (!acc[perm.module]) acc[perm.module] = []
              acc[perm.module].push(perm)
              return acc
            }, {} as Record<string, Permission[]>)
          ).map(([module, perms]) => (
            <div key={module} className="mb-4 last:mb-0">
              <h3 className="font-medium text-sm mb-2">{module}</h3>
              <div className="flex flex-wrap gap-2">
                {perms.map(perm => (
                  <span
                    key={perm.id}
                    className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded"
                  >
                    {perm.action}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}