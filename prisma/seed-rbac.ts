/**
 * RBAC Seed - Permissions, Roles, and Default Mappings
 * Run AFTER main seed.ts to set up RBAC system
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Permissions to create
const permissions = [
  // Invoice permissions
  { module: 'invoice', action: 'create', code: 'invoice.create', description: 'สร้างใบวางบิล' },
  { module: 'invoice', action: 'read', code: 'invoice.read', description: 'ดูใบวางบิล' },
  { module: 'invoice', action: 'update', code: 'invoice.update', description: 'แก้ไขใบวางบิล' },
  { module: 'invoice', action: 'delete', code: 'invoice.delete', description: 'ลบใบวางบิล' },
  { module: 'invoice', action: 'post', code: 'invoice.post', description: 'อนุมัติใบวางบิล' },
  { module: 'invoice', action: 'void', code: 'invoice.void', description: 'ยกเลิกใบวางบิล' },

  // Purchase Request permissions
  { module: 'purchase_request', action: 'create', code: 'pr.create', description: 'สร้างใบขอซื้อ' },
  { module: 'purchase_request', action: 'read', code: 'pr.read', description: 'ดูใบขอซื้อ' },
  { module: 'purchase_request', action: 'update', code: 'pr.update', description: 'แก้ไขใบขอซื้อ' },
  { module: 'purchase_request', action: 'delete', code: 'pr.delete', description: 'ลบใบขอซื้อ' },
  { module: 'purchase_request', action: 'approve', code: 'pr.approve', description: 'อนุมัติใบขอซื้อ' },
  { module: 'purchase_request', action: 'submit', code: 'pr.submit', description: 'ส่งใบขอซื้อเพื่ออนุมัติ' },

  // Purchase Order permissions
  { module: 'purchase_order', action: 'create', code: 'po.create', description: 'สร้างใบสั่งซื้อ' },
  { module: 'purchase_order', action: 'read', code: 'po.read', description: 'ดูใบสั่งซื้อ' },
  { module: 'purchase_order', action: 'update', code: 'po.update', description: 'แก้ไขใบสั่งซื้อ' },
  { module: 'purchase_order', action: 'delete', code: 'po.delete', description: 'ลบใบสั่งซื้อ' },
  { module: 'purchase_order', action: 'receive', code: 'po.receive', description: 'รับสินค้าเข้า' },

  // Receipt permissions
  { module: 'receipt', action: 'create', code: 'receipt.create', description: 'สร้างใบเสร็จรับเงิน' },
  { module: 'receipt', action: 'read', code: 'receipt.read', description: 'ดูใบเสร็จรับเงิน' },
  { module: 'receipt', action: 'update', code: 'receipt.update', description: 'แก้ไขใบเสร็จรับเงิน' },
  { module: 'receipt', action: 'post', code: 'receipt.post', description: 'อนุมัติใบเสร็จรับเงิน' },
  { module: 'receipt', action: 'void', code: 'receipt.void', description: 'ยกเลิกใบเสร็จรับเงิน' },

  // Journal permissions
  { module: 'journal', action: 'create', code: 'journal.create', description: 'สร้างรายการบันทึกบัญชี' },
  { module: 'journal', action: 'read', code: 'journal.read', description: 'ดูรายการบันทึกบัญชี' },
  { module: 'journal', action: 'post', code: 'journal.post', description: 'อนุมัติรายการบันทึกบัญชี' },

  // Report permissions
  { module: 'report', action: 'read', code: 'report.read', description: 'ดูรายงาน' },
  { module: 'report', action: 'export', code: 'report.export', description: 'ส่งออกรายงาน' },

  // Admin permissions
  { module: 'admin', action: 'manage', code: 'admin.manage', description: 'จัดการระบบ' },
  { module: 'admin', action: 'users', code: 'admin.users', description: 'จัดการผู้ใช้' },
  { module: 'admin', action: 'roles', code: 'admin.roles', description: 'จัดการสิทธิ์' },
]

// System roles to create
const systemRoles = [
  { name: 'ADMIN', description: 'ผู้ดูแลระบบ - เข้าถึงทุกฟังก์ชัน', type: 'SYSTEM' as const },
  { name: 'ACCOUNTANT', description: 'นักบัญชี - เข้าถึงฟังก์ชันบัญชีทั้งหมด', type: 'SYSTEM' as const },
  { name: 'PROCUREMENT', description: 'พนักงานจัดซื้อ - เข้าถึง PR/PO และ GRN', type: 'SYSTEM' as const },
  { name: 'VIEWER', description: 'ผู้ดู - ดูรายงานเท่านั้น', type: 'SYSTEM' as const },
]

// Role-Permission mappings (which permissions each role gets)
const rolePermissions: Record<string, string[]> = {
  ADMIN: permissions.map(p => p.code), // All permissions
  ACCOUNTANT: [
    'invoice.create', 'invoice.read', 'invoice.update', 'invoice.post', 'invoice.void',
    'receipt.create', 'receipt.read', 'receipt.update', 'receipt.post', 'receipt.void',
    'journal.create', 'journal.read', 'journal.post',
    'report.read', 'report.export',
  ],
  PROCUREMENT: [
    'pr.create', 'pr.read', 'pr.update', 'pr.submit', 'pr.approve',
    'po.create', 'po.read', 'po.update', 'po.receive',
    'report.read',
  ],
  VIEWER: ['report.read', 'report.export'],
}

async function main() {
  console.log('🔐 Starting RBAC seed...')

  // Create permissions
  console.log('📋 Creating permissions...')
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    })
  }
  console.log(`✅ Created ${permissions.length} permissions`)

  // Create system roles
  console.log('🎭 Creating system roles...')
  for (const role of systemRoles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    })
  }
  console.log(`✅ Created ${systemRoles.length} system roles`)

  // Assign permissions to roles
  console.log('🔗 Assigning permissions to roles...')
  for (const [roleName, permCodes] of Object.entries(rolePermissions)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } })
    if (!role) {
      console.warn(`⚠️ Role ${roleName} not found, skipping`)
      continue
    }

    for (const permCode of permCodes) {
      const permission = await prisma.permission.findUnique({ where: { code: permCode } })
      if (!permission) {
        console.warn(`⚠️ Permission ${permCode} not found, skipping`)
        continue
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      })
    }
    console.log(`✅ Assigned ${permCodes.length} permissions to ${roleName}`)
  }

  console.log('✅ RBAC seed complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - ${permissions.length} permissions`)
  console.log(`   - ${systemRoles.length} system roles (ADMIN, ACCOUNTANT, PROCUREMENT, VIEWER)`)
  console.log('')
  console.log('📝 Next: Run migration to link existing users to employees')
}

main()
  .catch((e) => {
    console.error('❌ RBAC seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })