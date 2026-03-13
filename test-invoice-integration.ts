/**
 * INVOICE & PURCHASE STOCK INTEGRATION TEST
 * Testing stock movements triggered by invoices and purchases
 */

import prisma from './src/lib/db'
import { recordStockMovement, calculateCOGS } from './src/lib/inventory-service'

interface TestResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

const results: TestResult[] = []

function log(message: string, data?: any) {
  console.log(message)
  if (data) console.log(JSON.stringify(data, null, 2))
}

async function runTest(name: string, testFn: () => Promise<void>) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`TEST: ${name}`)
  console.log('='.repeat(60))
  try {
    await testFn()
    results.push({ name, passed: true, message: 'Success' })
    console.log(`✅ PASSED: ${name}`)
  } catch (error) {
    results.push({ name, passed: false, message: (error as Error).message })
    console.log(`❌ FAILED: ${name}`)
    console.log((error as Error).message)
  }
}

async function cleanup(timestamp: string) {
  console.log('\n🧹 Cleaning up test data...')
  // Cleanup happens at the start of the next test, so we just log here
}

async function setupIntegrationData() {
  console.log('\n📋 Setting up integration test data...')

  // Clean up any leftover test data first
  await prisma.stockMovement.deleteMany({
    where: {
      OR: [
        { referenceNo: { startsWith: 'PO-' } },
        { referenceNo: { startsWith: 'INV-' } },
        { referenceNo: { startsWith: 'ADJ-' } },
      ]
    }
  })
  await prisma.stockBalance.deleteMany({})
  await prisma.product.deleteMany({
    where: { code: { startsWith: 'PROD-' } }
  })
  await prisma.warehouse.deleteMany({
    where: { code: { startsWith: 'WH-' } }
  })
  await prisma.customer.deleteMany({
    where: { code: { startsWith: 'CUST-' } }
  })
  await prisma.vendor.deleteMany({
    where: { code: { startsWith: 'VEND-' } }
  })

  // Create unique IDs for each test run
  const timestamp = Date.now().toString(36)

  // Create warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      id: `wh-integration-${timestamp}`,
      code: `WH-INT-${timestamp}`,
      name: 'Integration Test Warehouse',
      type: 'MAIN',
      isActive: true,
    }
  })

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      id: `cust-integration-${timestamp}`,
      code: `CUST-${timestamp}`,
      name: 'Test Customer Co., Ltd.',
      taxId: '1234567890123',
    }
  })

  // Create vendor
  const vendor = await prisma.vendor.create({
    data: {
      id: `vend-integration-${timestamp}`,
      code: `VEND-${timestamp}`,
      name: 'Test Vendor Co., Ltd.',
      taxId: '9876543210987',
    }
  })

  // Create inventory products
  const product1 = await prisma.product.create({
    data: {
      id: `prod-integration-001-${timestamp}`,
      code: `PROD-001-${timestamp}`,
      name: 'Integration Product A',
      type: 'PRODUCT',
      isInventory: true,
      costingMethod: 'WEIGHTED_AVERAGE',
      unit: 'PCS',
      salePrice: 150,
      costPrice: 80,
    }
  })

  const product2 = await prisma.product.create({
    data: {
      id: `prod-integration-002-${timestamp}`,
      code: `PROD-002-${timestamp}`,
      name: 'Integration Product B',
      type: 'PRODUCT',
      isInventory: true,
      costingMethod: 'WEIGHTED_AVERAGE',
      unit: 'PCS',
      salePrice: 200,
      costPrice: 100,
    }
  })

  return { warehouse, customer, vendor, product1, product2, timestamp }
}

// ========================================
// TEST 1: Purchase Invoice Stock Receive
// ========================================
async function test1_PurchaseInvoiceReceive() {
  const { warehouse, vendor, product1, product2, timestamp } = await setupIntegrationData()

  // Simulate purchase invoice receiving stock
  // Purchase: 100 units of product1 @ 80 THB, 50 units of product2 @ 100 THB
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 80,
    referenceId: 'po-001',
    referenceNo: 'PO-2026-001',
    notes: 'Purchase from vendor',
    sourceChannel: 'PURCHASE_INVOICE',
  })

  await recordStockMovement({
    productId: product2.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 100,
    referenceId: 'po-001',
    referenceNo: 'PO-2026-001',
    notes: 'Purchase from vendor',
    sourceChannel: 'PURCHASE_INVOICE',
  })

  // Verify stock balances
  const balance1 = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  const balance2 = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product2.id, warehouseId: warehouse.id } }
  })

  if (!balance1 || balance1.quantity !== 100) throw new Error('Product 1 balance incorrect')
  if (!balance2 || balance2.quantity !== 50) throw new Error('Product 2 balance incorrect')

  // Verify stock movements
  const movements = await prisma.stockMovement.findMany({
    where: { referenceNo: 'PO-2026-001' }
  })

  if (movements.length !== 2) throw new Error('Expected 2 stock movements')

  log('✓ Purchase receive verified:', {
    product1: { qty: balance1.quantity, cost: balance1.totalCost },
    product2: { qty: balance2.quantity, cost: balance2.totalCost },
    movements: movements.length,
  })

  await cleanup(timestamp)
}

// ========================================
// TEST 2: Sales Invoice Stock Issue
// ========================================
async function test2_SalesInvoiceIssue() {
  const { warehouse, customer, product1, timestamp } = await setupIntegrationData()

  // First receive stock
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 80,
  })

  // Simulate sales invoice issuing stock
  const cogs = await calculateCOGS(product1.id, warehouse.id, 30)

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ISSUE',
    quantity: 30,
    unitCost: cogs / 30, // Calculate unit cost from COGS
    referenceId: 'inv-001',
    referenceNo: 'INV-2026-001',
    notes: 'Sales to customer',
    sourceChannel: 'SALES_INVOICE',
  })

  // Verify stock balance after issue
  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance || balance.quantity !== 70) throw new Error('Expected 70 units after issue')

  // Verify stock movement
  const movement = await prisma.stockMovement.findFirst({
    where: { referenceNo: 'INV-2026-001' }
  })

  if (!movement) throw new Error('Stock movement not found for invoice')

  log('✓ Sales issue verified:', {
    remainingQty: balance.quantity,
    cogs: Math.round(cogs),
    movementType: movement.type,
  })

  await cleanup(timestamp)
}

// ========================================
// TEST 3: Multi-Line Invoice
// ========================================
async function test3_MultiLineInvoice() {
  const { warehouse, customer, product1, product2, timestamp } = await setupIntegrationData()

  // Receive stock for both products
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 200,
    unitCost: 80,
  })

  await recordStockMovement({
    productId: product2.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 150,
    unitCost: 100,
  })

  // Simulate multi-line sales invoice
  const invoiceNo = 'INV-2026-002'

  // Line 1: 50 units of product1
  const cogs1 = await calculateCOGS(product1.id, warehouse.id, 50)
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ISSUE',
    quantity: 50,
    unitCost: cogs1 / 50,
    referenceNo: invoiceNo,
    sourceChannel: 'SALES_INVOICE',
  })

  // Line 2: 30 units of product2
  const cogs2 = await calculateCOGS(product2.id, warehouse.id, 30)
  await recordStockMovement({
    productId: product2.id,
    warehouseId: warehouse.id,
    type: 'ISSUE',
    quantity: 30,
    unitCost: cogs2 / 30,
    referenceNo: invoiceNo,
    sourceChannel: 'SALES_INVOICE',
  })

  // Verify final balances
  const balance1 = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  const balance2 = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product2.id, warehouseId: warehouse.id } }
  })

  if (!balance1 || balance1.quantity !== 150) throw new Error('Product 1: Expected 150 units')
  if (!balance2 || balance2.quantity !== 120) throw new Error('Product 2: Expected 120 units')

  // Verify all movements for this invoice
  const movements = await prisma.stockMovement.findMany({
    where: { referenceNo: invoiceNo }
  })

  if (movements.length !== 2) throw new Error('Expected 2 movements for multi-line invoice')

  log('✓ Multi-line invoice verified:', {
    product1Qty: balance1.quantity,
    product2Qty: balance2.quantity,
    totalMovements: movements.length,
    totalCOGS: Math.round(cogs1 + cogs2),
  })

  await cleanup(timestamp)
}

// ========================================
// TEST 4: Stock Movement Reference Tracking
// ========================================
async function test4_ReferenceTracking() {
  const { warehouse, vendor, product1, timestamp } = await setupIntegrationData()

  // Create movements with different references
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 80,
    referenceId: 'po-001',
    referenceNo: 'PO-001',
    sourceChannel: 'PURCHASE_INVOICE',
  })

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ISSUE',
    quantity: 20,
    unitCost: 80,
    referenceId: 'inv-001',
    referenceNo: 'INV-001',
    sourceChannel: 'SALES_INVOICE',
  })

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ADJUST',
    quantity: 5,
    unitCost: 80,
    referenceId: 'adj-001',
    referenceNo: 'ADJ-001',
    notes: 'Physical count adjustment',
    sourceChannel: 'MANUAL',
  })

  // Query movements by reference
  const poMovements = await prisma.stockMovement.findMany({
    where: { referenceNo: 'PO-001' }
  })

  const invMovements = await prisma.stockMovement.findMany({
    where: { referenceNo: 'INV-001' }
  })

  const adjMovements = await prisma.stockMovement.findMany({
    where: { referenceNo: 'ADJ-001' }
  })

  if (poMovements.length !== 1) throw new Error('PO movements not found')
  if (invMovements.length !== 1) throw new Error('INV movements not found')
  if (adjMovements.length !== 1) throw new Error('ADJ movements not found')

  log('✓ Reference tracking verified:', {
    poMovement: { type: poMovements[0].type, qty: poMovements[0].quantity },
    invMovement: { type: invMovements[0].type, qty: invMovements[0].quantity },
    adjMovement: { type: adjMovements[0].type, qty: adjMovements[0].quantity },
  })

  await cleanup(timestamp)
}

// ========================================
// TEST 5: Stock Valuation Report
// ========================================
async function test5_StockValuationReport() {
  const { warehouse, product1, product2 } = await setupIntegrationData()

  // Receive stock at different costs
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 80,
  })

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 90, // Higher cost
  })

  await recordStockMovement({
    productId: product2.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 200,
    unitCost: 100,
  })

  // Get stock valuation
  const { getInventoryValuation } = await import('./src/lib/inventory-service')
  const valuation = await getInventoryValuation(warehouse.id)

  // Expected: Product1: 150 units @ 83.33 = 12,500, Product2: 200 units @ 100 = 20,000
  const expectedValue = 12500 + 20000

  if (Math.abs(valuation.totalValue - expectedValue) > 100) {
    throw new Error(`Expected value ~${expectedValue}, got ${valuation.totalValue}`)
  }

  log('✓ Stock valuation verified:', {
    totalProducts: valuation.summary.totalProducts,
    totalQty: valuation.summary.totalQty,
    totalValue: Math.round(valuation.totalValue),
    expectedValue,
  })

  await cleanup(timestamp)
}

// ========================================
// TEST 6: Insufficient Stock Prevention
// ========================================
async function test6_InsufficientStockPrevention() {
  const { warehouse, product1 } = await setupIntegrationData()

  // Receive only 50 units
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 80,
  })

  // Try to issue 100 units - should fail
  try {
    await recordStockMovement({
      productId: product1.id,
      warehouseId: warehouse.id,
      type: 'ISSUE',
      quantity: 100,
      unitCost: 80,
      referenceNo: 'INV-TEST',
    })
    throw new Error('Should have thrown error for insufficient stock')
  } catch (error) {
    if ((error as Error).message.includes('สต็อกไม่เพียงพอ')) {
      log('✓ Insufficient stock correctly prevented')

      // Verify stock wasn't affected
      const balance = await prisma.stockBalance.findUnique({
        where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
      })

      if (!balance || balance.quantity !== 50) {
        throw new Error('Stock was incorrectly modified')
      }

      log('✓ Stock balance preserved:', { quantity: balance?.quantity })
    } else {
      throw error
    }
  }

  await cleanup(timestamp)
}

// ========================================
// RUN ALL TESTS
// ========================================
async function main() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   INVOICE & PURCHASE STOCK INTEGRATION TEST            ║')
  console.log('║   Testing real-world invoice/purchase workflows        ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  await runTest('Test 1: Purchase Invoice Stock Receive', test1_PurchaseInvoiceReceive)
  await runTest('Test 2: Sales Invoice Stock Issue', test2_SalesInvoiceIssue)
  await runTest('Test 3: Multi-Line Invoice', test3_MultiLineInvoice)
  await runTest('Test 4: Stock Movement Reference Tracking', test4_ReferenceTracking)
  await runTest('Test 5: Stock Valuation Report', test5_StockValuationReport)
  await runTest('Test 6: Insufficient Stock Prevention', test6_InsufficientStockPrevention)

  // ========================================
  // FINAL REPORT
  // ========================================
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   INTEGRATION TEST REPORT                                ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log('\n')

  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`)
    if (!r.passed) {
      console.log(`   Error: ${r.message}`)
    }
  })

  const passed = results.filter(r => r.passed).length
  const total = results.length

  console.log('\n' + '='.repeat(60))
  console.log(`SUMMARY: ${passed}/${total} tests passed`)
  console.log('='.repeat(60))

  if (passed === total) {
    console.log('\n🎉 All invoice/purchase integration tests passed!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
