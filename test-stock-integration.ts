/**
 * STOCK INTEGRATION PRODUCTION TEST
 * Testing stock movements with real SQLite database
 */

import prisma from './src/lib/db'
import { recordStockMovement, calculateCOGS, getInventoryValuation } from './src/lib/inventory-service'

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

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...')
  await prisma.stockMovement.deleteMany({})
  await prisma.stockBalance.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.warehouse.deleteMany({})
}

async function setupTestData() {
  console.log('\n📋 Setting up test data...')

  // Create main warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      id: 'wh-test-main',
      code: 'WH-MAIN',
      name: 'Main Warehouse',
      type: 'MAIN',
      isActive: true,
    }
  })
  log('✓ Created warehouse:', warehouse)

  // Create secondary warehouse for transfers
  const warehouse2 = await prisma.warehouse.create({
    data: {
      id: 'wh-test-branch',
      code: 'WH-BRANCH',
      name: 'Branch Warehouse',
      type: 'BRANCH',
      isActive: true,
    }
  })
  log('✓ Created branch warehouse:', warehouse2)

  // Create inventory products
  const product1 = await prisma.product.create({
    data: {
      id: 'prod-test-001',
      code: 'TEST001',
      name: 'Test Product A',
      type: 'PRODUCT',
      isInventory: true,
      costingMethod: 'WEIGHTED_AVERAGE',
      unit: 'PCS',
      salePrice: 100,
      costPrice: 50,
    }
  })
  log('✓ Created product 1:', product1)

  const product2 = await prisma.product.create({
    data: {
      id: 'prod-test-002',
      code: 'TEST002',
      name: 'Test Product B',
      type: 'PRODUCT',
      isInventory: true,
      costingMethod: 'WEIGHTED_AVERAGE',
      unit: 'PCS',
      salePrice: 200,
      costPrice: 100,
    }
  })
  log('✓ Created product 2:', product2)

  return { warehouse, warehouse2, product1, product2 }
}

// ========================================
// TEST 1: Basic RECEIVE Movement
// ========================================
async function test1_ReceiveMovement() {
  const { warehouse, product1 } = await setupTestData()

  // Initial receive: 100 units @ 50 THB
  const result = await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
    notes: 'Initial stock receive',
  })

  log('✓ Stock movement created:', {
    movementId: result.movement.id,
    type: result.movement.type,
    quantity: result.movement.quantity,
    unitCost: result.movement.unitCost,
    totalCost: result.movement.totalCost,
  })

  // Verify StockBalance
  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance) throw new Error('StockBalance not created')
  if (balance.quantity !== 100) throw new Error(`Expected quantity 100, got ${balance.quantity}`)
  if (balance.unitCost !== 50) throw new Error(`Expected unitCost 50, got ${balance.unitCost}`)
  if (balance.totalCost !== 5000) throw new Error(`Expected totalCost 5000, got ${balance.totalCost}`)

  log('✓ StockBalance verified:', {
    quantity: balance.quantity,
    unitCost: balance.unitCost,
    totalCost: balance.totalCost,
  })

  await cleanup()
}

// ========================================
// TEST 2: Weighted Average Cost Calculation
// ========================================
async function test2_WeightedAverageCost() {
  const { warehouse, product1 } = await setupTestData()

  // First receive: 100 units @ 50 THB = 5,000 THB
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
  })

  // Second receive: 50 units @ 60 THB = 3,000 THB
  // Expected: (150 units, 8,000 THB) → unitCost = 8000/150 = 53.33
  const result2 = await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 60,
  })

  log('✓ Second receive completed', {
    expectedQty: 150,
    expectedUnitCost: 53.33,
    expectedTotalCost: 8000,
  })

  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance) throw new Error('StockBalance not found')
  if (Math.abs(balance.quantity - 150) > 0.01) throw new Error(`Expected quantity 150, got ${balance.quantity}`)
  if (Math.abs(balance.unitCost - 53.33) > 0.01) throw new Error(`Expected unitCost ~53.33, got ${balance.unitCost}`)
  if (Math.abs(balance.totalCost - 8000) > 0.01) throw new Error(`Expected totalCost 8000, got ${balance.totalCost}`)

  log('✓ Weighted average verified:', {
    quantity: balance.quantity,
    unitCost: Math.round(balance.unitCost * 100) / 100,
    totalCost: Math.round(balance.totalCost * 100) / 100,
  })

  await cleanup()
}

// ========================================
// TEST 3: ISSUE Movement (Stock Out)
// ========================================
async function test3_IssueMovement() {
  const { warehouse, product1 } = await setupTestData()

  // Setup: Receive 100 units @ 50 THB
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
  })

  // Issue 30 units
  const result = await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ISSUE',
    quantity: 30,
    unitCost: 50, // Should use current unitCost
    referenceId: 'ref-001',
    referenceNo: 'INV-001',
  })

  log('✓ Issue movement created:', {
    movementId: result.movement.id,
    referenceId: result.movement.referenceId,
    referenceNo: result.movement.referenceNo,
  })

  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance) throw new Error('StockBalance not found')
  if (balance.quantity !== 70) throw new Error(`Expected quantity 70, got ${balance.quantity}`)
  if (balance.totalCost !== 3500) throw new Error(`Expected totalCost 3500, got ${balance.totalCost}`)

  log('✓ Issue verified:', {
    quantity: balance.quantity,
    unitCost: balance.unitCost,
    totalCost: balance.totalCost,
  })

  await cleanup()
}

// ========================================
// TEST 4: Multiple Products
// ========================================
async function test4_MultipleProducts() {
  const { warehouse, product1, product2 } = await setupTestData()

  // Stock both products
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 200,
    unitCost: 50,
  })

  await recordStockMovement({
    productId: product2.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 100,
  })

  const valuation = await getInventoryValuation(warehouse.id)

  log('✓ Inventory valuation:', {
    totalProducts: valuation.summary.totalProducts,
    totalQty: valuation.summary.totalQty,
    totalValue: valuation.summary.totalValue,
  })

  if (valuation.summary.totalProducts !== 2) throw new Error('Expected 2 products')
  if (valuation.summary.totalQty !== 300) throw new Error('Expected 300 total quantity')
  if (valuation.summary.totalValue !== 20000) throw new Error('Expected 20000 total value')

  await cleanup()
}

// ========================================
// TEST 5: TRANSFER Between Warehouses
// ========================================
async function test5_TransferBetweenWarehouses() {
  const { warehouse, warehouse2, product1 } = await setupTestData()

  // Setup: Receive 100 units in main warehouse
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
  })

  // Transfer 30 units to branch
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'TRANSFER_OUT',
    quantity: 30,
    unitCost: 50,
    referenceNo: 'TF-001',
  })

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse2.id,
    type: 'TRANSFER_IN',
    quantity: 30,
    unitCost: 50,
    referenceNo: 'TF-001',
  })

  const mainBalance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  const branchBalance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse2.id } }
  })

  if (!mainBalance || mainBalance.quantity !== 70) throw new Error(`Main warehouse should have 70 units, got ${mainBalance?.quantity}`)
  if (!branchBalance || branchBalance.quantity !== 30) throw new Error(`Branch warehouse should have 30 units, got ${branchBalance?.quantity}`)

  log('✓ Transfer verified:', {
    mainWarehouse: mainBalance.quantity,
    branchWarehouse: branchBalance.quantity,
  })

  await cleanup()
}

// ========================================
// TEST 6: COGS Calculation
// ========================================
async function test6_COGSCalculation() {
  const { warehouse, product1 } = await setupTestData()

  // Setup: Receive with varying costs
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
  })

  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 60,
  })

  // Weighted average = 8000 / 150 = 53.33
  // COGS for 30 units = 30 * 53.33 = 1600
  const cogs = await calculateCOGS(product1.id, warehouse.id, 30)

  log('✓ COGS calculated:', {
    quantity: 30,
    expectedCOGS: 1600,
    actualCOGS: Math.round(cogs),
  })

  if (Math.abs(cogs - 1600) > 1) throw new Error(`Expected COGS ~1600, got ${cogs}`)

  await cleanup()
}

// ========================================
// TEST 7: Stock Validation (Insufficient Stock)
// ========================================
async function test7_InsufficientStock() {
  const { warehouse, product1 } = await setupTestData()

  // Setup: Receive only 50 units
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 50,
    unitCost: 50,
  })

  // Try to issue 100 units - should fail
  try {
    await recordStockMovement({
      productId: product1.id,
      warehouseId: warehouse.id,
      type: 'ISSUE',
      quantity: 100,
      unitCost: 50,
    })
    throw new Error('Should have thrown error for insufficient stock')
  } catch (error) {
    if ((error as Error).message.includes('สต็อกไม่เพียงพอ')) {
      log('✓ Insufficient stock error correctly thrown')
    } else {
      throw error
    }
  }

  await cleanup()
}

// ========================================
// TEST 8: ADJUST Movement (Stock Correction)
// ========================================
async function test8_AdjustMovement() {
  const { warehouse, product1 } = await setupTestData()

  // Setup: Receive 100 units
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'RECEIVE',
    quantity: 100,
    unitCost: 50,
  })

  // Adjust +10 (physical count found more)
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ADJUST',
    quantity: 10,
    unitCost: 50,
    notes: 'Stock adjustment - physical count',
  })

  const balance = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance || balance.quantity !== 110) throw new Error(`Expected 110 units, got ${balance?.quantity}`)

  log('✓ Adjustment verified:', { quantity: balance.quantity })

  // Adjust -5 (physical count found less)
  await recordStockMovement({
    productId: product1.id,
    warehouseId: warehouse.id,
    type: 'ADJUST',
    quantity: -5,
    unitCost: 50,
    notes: 'Stock adjustment - damage',
  })

  const balance2 = await prisma.stockBalance.findUnique({
    where: { productId_warehouseId: { productId: product1.id, warehouseId: warehouse.id } }
  })

  if (!balance2 || balance2.quantity !== 105) throw new Error(`Expected 105 units, got ${balance2?.quantity}`)

  log('✓ Negative adjustment verified:', { quantity: balance2.quantity })

  await cleanup()
}

// ========================================
// RUN ALL TESTS
// ========================================
async function main() {
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   STOCK INTEGRATION PRODUCTION TEST                      ║')
  console.log('║   Testing with real SQLite database                      ║')
  console.log('╚══════════════════════════════════════════════════════════╝')

  await runTest('Test 1: Basic RECEIVE Movement', test1_ReceiveMovement)
  await runTest('Test 2: Weighted Average Cost Calculation', test2_WeightedAverageCost)
  await runTest('Test 3: ISSUE Movement (Stock Out)', test3_IssueMovement)
  await runTest('Test 4: Multiple Products', test4_MultipleProducts)
  await runTest('Test 5: TRANSFER Between Warehouses', test5_TransferBetweenWarehouses)
  await runTest('Test 6: COGS Calculation', test6_COGSCalculation)
  await runTest('Test 7: Stock Validation (Insufficient Stock)', test7_InsufficientStock)
  await runTest('Test 8: ADJUST Movement (Stock Correction)', test8_AdjustMovement)

  // ========================================
  // FINAL REPORT
  // ========================================
  console.log('\n')
  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║   STOCK INTEGRATION TEST REPORT                          ║')
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
    console.log('\n🎉 All stock integration tests passed successfully!')
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.')
  }

  await prisma.$disconnect()
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
