import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/api-utils'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schemas for import data
const accountImportSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  nameEn: z.string().nullable().optional(),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  level: z.number().int().positive(),
  parentId: z.string().nullable().optional(),
  isDetail: z.boolean(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean(),
  notes: z.string().nullable().optional(),
})

const customerImportSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  nameEn: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  branchCode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  subDistrict: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  website: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  creditLimit: z.number().default(0),
  creditDays: z.number().int().default(30),
  isActive: z.boolean().default(true),
  notes: z.string().nullable().optional(),
})

const vendorImportSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  nameEn: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  branchCode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  subDistrict: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  website: z.string().nullable().optional(),
  contactName: z.string().nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  bankAccountName: z.string().nullable().optional(),
  creditDays: z.number().int().default(30),
  isActive: z.boolean().default(true),
  notes: z.string().nullable().optional(),
})

const companyImportSchema = z.object({
  name: z.string(),
  nameEn: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  branchCode: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  subDistrict: z.string().nullable().optional(),
  district: z.string().nullable().optional(),
  province: z.string().nullable().optional(),
  postalCode: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  fax: z.string().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal('')),
  website: z.string().nullable().optional(),
  logo: z.string().nullable().optional(),
  fiscalYearStart: z.number().int().min(1).max(12).default(1),
})

export async function POST(request: NextRequest) {
  try {
    // Require ADMIN role
    await requireRole(['ADMIN'])

    const backup = await request.json()

    if (!backup.data) {
      return NextResponse.json({
        success: false,
        error: 'รูปแบบไฟล์สำรองข้อมูลไม่ถูกต้อง'
      }, { status: 400 })
    }

    let accountsImported = 0
    let customersImported = 0
    let vendorsImported = 0

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Import accounts with field validation
      if (backup.data.accounts && Array.isArray(backup.data.accounts)) {
        for (const account of backup.data.accounts) {
          // Validate and sanitize account data
          const validated = accountImportSchema.parse(account)

          // Only use validated fields
          const { id, code, name, nameEn, type, level, parentId, isDetail, isSystem, isActive, notes } = validated

          // Additional validation
          if (!code || !name || !type) {
            throw new Error(`Invalid account data: ${JSON.stringify(account)}`)
          }

          await tx.chartOfAccount.upsert({
            where: { id },
            update: {
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              type,
              level,
              parentId: parentId || null,
              isDetail,
              isSystem: isSystem || false,
              isActive,
              notes: notes?.trim() || null,
            },
            create: {
              id,
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              type,
              level,
              parentId: parentId || null,
              isDetail,
              isSystem: isSystem || false,
              isActive,
              notes: notes?.trim() || null,
            }
          })
          accountsImported++
        }
      }

      // Import customers with field validation
      if (backup.data.customers && Array.isArray(backup.data.customers)) {
        for (const customer of backup.data.customers) {
          const validated = customerImportSchema.parse(customer)

          if (!validated.code || !validated.name) {
            throw new Error(`Invalid customer data: ${JSON.stringify(customer)}`)
          }

          const { id, code, name, nameEn, taxId, branchCode, address, subDistrict, district, province, postalCode, phone, fax, email, website, contactName, contactPhone, creditLimit, creditDays, isActive, notes } = validated

          await tx.customer.upsert({
            where: { id },
            update: {
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              taxId: taxId?.trim() || null,
              branchCode: branchCode?.trim() || null,
              address: address?.trim() || null,
              subDistrict: subDistrict?.trim() || null,
              district: district?.trim() || null,
              province: province?.trim() || null,
              postalCode: postalCode?.trim() || null,
              phone: phone?.trim() || null,
              fax: fax?.trim() || null,
              email: email?.trim() || null,
              website: website?.trim() || null,
              contactName: contactName?.trim() || null,
              contactPhone: contactPhone?.trim() || null,
              creditLimit,
              creditDays,
              isActive,
              notes: notes?.trim() || null,
            },
            create: {
              id,
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              taxId: taxId?.trim() || null,
              branchCode: branchCode?.trim() || null,
              address: address?.trim() || null,
              subDistrict: subDistrict?.trim() || null,
              district: district?.trim() || null,
              province: province?.trim() || null,
              postalCode: postalCode?.trim() || null,
              phone: phone?.trim() || null,
              fax: fax?.trim() || null,
              email: email?.trim() || null,
              website: website?.trim() || null,
              contactName: contactName?.trim() || null,
              contactPhone: contactPhone?.trim() || null,
              creditLimit,
              creditDays,
              isActive,
              notes: notes?.trim() || null,
            }
          })
          customersImported++
        }
      }

      // Import vendors with field validation
      if (backup.data.vendors && Array.isArray(backup.data.vendors)) {
        for (const vendor of backup.data.vendors) {
          const validated = vendorImportSchema.parse(vendor)

          if (!validated.code || !validated.name) {
            throw new Error(`Invalid vendor data: ${JSON.stringify(vendor)}`)
          }

          const { id, code, name, nameEn, taxId, branchCode, address, subDistrict, district, province, postalCode, phone, fax, email, website, contactName, contactPhone, bankName, bankAccount, bankAccountName, creditDays, isActive, notes } = validated

          await tx.vendor.upsert({
            where: { id },
            update: {
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              taxId: taxId?.trim() || null,
              branchCode: branchCode?.trim() || null,
              address: address?.trim() || null,
              subDistrict: subDistrict?.trim() || null,
              district: district?.trim() || null,
              province: province?.trim() || null,
              postalCode: postalCode?.trim() || null,
              phone: phone?.trim() || null,
              fax: fax?.trim() || null,
              email: email?.trim() || null,
              website: website?.trim() || null,
              contactName: contactName?.trim() || null,
              contactPhone: contactPhone?.trim() || null,
              bankName: bankName?.trim() || null,
              bankAccount: bankAccount?.trim() || null,
              bankAccountName: bankAccountName?.trim() || null,
              creditDays,
              isActive,
              notes: notes?.trim() || null,
            },
            create: {
              id,
              code: code.trim(),
              name: name.trim(),
              nameEn: nameEn?.trim() || null,
              taxId: taxId?.trim() || null,
              branchCode: branchCode?.trim() || null,
              address: address?.trim() || null,
              subDistrict: subDistrict?.trim() || null,
              district: district?.trim() || null,
              province: province?.trim() || null,
              postalCode: postalCode?.trim() || null,
              phone: phone?.trim() || null,
              fax: fax?.trim() || null,
              email: email?.trim() || null,
              website: website?.trim() || null,
              contactName: contactName?.trim() || null,
              contactPhone: contactPhone?.trim() || null,
              bankName: bankName?.trim() || null,
              bankAccount: bankAccount?.trim() || null,
              bankAccountName: bankAccountName?.trim() || null,
              creditDays,
              isActive,
              notes: notes?.trim() || null,
            }
          })
          vendorsImported++
        }
      }

      // Import company info with field validation
      if (backup.data.company) {
        const validated = companyImportSchema.parse(backup.data.company)

        if (!validated.name) {
          throw new Error('Company name is required')
        }

        const existingCompany = await tx.company.findFirst()

        const companyData = {
          name: validated.name.trim(),
          nameEn: validated.nameEn?.trim() || null,
          taxId: validated.taxId?.trim() || null,
          branchCode: validated.branchCode?.trim() || null,
          address: validated.address?.trim() || null,
          subDistrict: validated.subDistrict?.trim() || null,
          district: validated.district?.trim() || null,
          province: validated.province?.trim() || null,
          postalCode: validated.postalCode?.trim() || null,
          phone: validated.phone?.trim() || null,
          fax: validated.fax?.trim() || null,
          email: validated.email?.trim() || null,
          website: validated.website?.trim() || null,
          logo: validated.logo || null,
          fiscalYearStart: validated.fiscalYearStart,
        }

        if (existingCompany) {
          await tx.company.update({
            where: { id: existingCompany.id },
            data: companyData
          })
        } else {
          await tx.company.create({
            data: companyData
          })
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'นำเข้าข้อมูลสำเร็จ',
      imported: {
        accounts: accountsImported,
        customers: customersImported,
        vendors: vendorsImported
      }
    })
  } catch (error) {

    // Provide user-friendly error messages
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'รูปแบบข้อมูลไม่ถูกต้อง',
        details: error.issues
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'นำเข้าข้อมูลไม่สำเร็จ กรุณาลองใหม่'
    }, { status: 500 })
  }
}
