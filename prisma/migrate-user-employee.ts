/**
 * Migration: Link existing Users to Employees
 * Required for RBAC Phase 1 - creates Employee records for existing users
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Starting User-Employee migration...')

  // Get all existing users without a userEmployee link
  const usersWithoutEmployee = await prisma.user.findMany({
    where: {
      userEmployee: null,
    },
    include: {
      preferences: true,
    },
  })

  console.log(`📊 Found ${usersWithoutEmployee.length} users without employee links`)

  for (const user of usersWithoutEmployee) {
    // Create Employee record for this user
    const employee = await prisma.employee.create({
      data: {
        employeeCode: `EMP-${user.id.slice(-6).toUpperCase()}`,
        firstName: user.name || 'Unknown',
        lastName: '',
        hireDate: new Date(),
        baseSalary: 0,
        position: user.role,
        department: user.role === 'ADMIN' ? 'Admin' : user.role === 'ACCOUNTANT' ? 'Accounting' : 'General',
      },
    })

    // Create UserEmployee link
    await prisma.userEmployee.create({
      data: {
        userId: user.id,
        employeeId: employee.id,
      },
    })

    console.log(`✅ Linked user ${user.email} to employee ${employee.employeeCode}`)
  }

  // Now create EmployeeRole assignments based on user's role
  console.log('')
  console.log('🎭 Assigning roles to employees based on User.role...')

  // Get departments
  const departments = await prisma.department.findMany()
  const deptMap: Record<string, string> = {}
  for (const dept of departments) {
    deptMap[dept.code] = dept.id
  }

  // Ensure we have basic departments
  const procurementDept = deptMap['PROC'] || deptMap['PURCH'] || departments[0]?.id
  const accountingDept = deptMap['ACC'] || deptMap['ACCT'] || departments[1]?.id || procurementDept

  // Get system roles
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  const accountantRole = await prisma.role.findUnique({ where: { name: 'ACCOUNTANT' } })
  const procurementRole = await prisma.role.findUnique({ where: { name: 'PROCUREMENT' } })
  const viewerRole = await prisma.role.findUnique({ where: { name: 'VIEWER' } })

  // Get all users with their employee links
  const allUsers = await prisma.user.findMany({
    include: {
      userEmployee: {
        include: {
          employee: true,
        },
      },
    },
  })

  for (const user of allUsers) {
    if (!user.userEmployee) continue

    const employeeId = user.userEmployee.employeeId

    // Map User.role to RBAC Role
    let targetRoleId: string | null = null
    let targetDeptId: string | null = null

    switch (user.role) {
      case 'ADMIN':
        targetRoleId = adminRole?.id || null
        targetDeptId = procurementDept
        break
      case 'ACCOUNTANT':
        targetRoleId = accountantRole?.id || null
        targetDeptId = accountingDept
        break
      case 'USER':
        targetRoleId = procurementRole?.id || null
        targetDeptId = procurementDept
        break
      case 'VIEWER':
        targetRoleId = viewerRole?.id || null
        targetDeptId = procurementDept
        break
    }

    if (targetRoleId && targetDeptId) {
      // Check if already has this role
      const existingRole = await prisma.employeeRole.findFirst({
        where: {
          employeeId,
          departmentId: targetDeptId,
          roleId: targetRoleId,
        },
      })

      if (!existingRole) {
        await prisma.employeeRole.create({
          data: {
            employeeId,
            departmentId: targetDeptId,
            roleId: targetRoleId,
            isPrimary: true,
          },
        })
        console.log(`✅ Assigned ${user.role} role to ${user.email} in department ${targetDeptId}`)
      }
    }
  }

  console.log('')
  console.log('✅ User-Employee migration complete!')
  console.log('')
  console.log('📊 Summary:')
  console.log(`   - ${usersWithoutEmployee.length} users linked to employees`)
  console.log('')
  console.log('📝 Next steps:')
  console.log('   1. Phase 2: Implement checkPermission/requirePermission in api-utils')
  console.log('   2. Phase 3: Update sidebar to use permission-based filtering')
}

main()
  .catch((e) => {
    console.error('❌ Migration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })