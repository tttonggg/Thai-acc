import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 Resetting database...')

  try {
    // Delete in correct order due to foreign key constraints
    console.log('🗑️  Deleting journal lines...')
    await prisma.journalLine.deleteMany({})

    console.log('🗑️  Deleting journal entries...')
    await prisma.journalEntry.deleteMany({})

    console.log('🗑️  Deleting invoice lines...')
    await prisma.invoiceLine.deleteMany({})

    console.log('🗑️  Deleting invoices...')
    await prisma.invoice.deleteMany({})

    console.log('🗑️  Deleting products...')
    await prisma.product.deleteMany({})

    console.log('🗑️  Deleting vendors...')
    await prisma.vendor.deleteMany({})

    console.log('🗑️  Deleting customers...')
    await prisma.customer.deleteMany({})

    console.log('🗑️  Deleting document numbers...')
    await prisma.documentNumber.deleteMany({})

    console.log('🗑️  Deleting chart of accounts...')
    await prisma.chartOfAccount.deleteMany({})

    console.log('🗑️  Deleting users...')
    await prisma.user.deleteMany({})

    console.log('🗑️  Deleting company...')
    await prisma.company.deleteMany({})

    console.log('✅ Database reset completed successfully!')
    console.log('')
    console.log('🌱 You can now run: npm run seed')
  } catch (error) {
    console.error('❌ Error resetting database:', error)
    throw error
  }
}

resetDatabase()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
