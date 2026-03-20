// Test script to verify all the fixes
const API_BASE = 'http://localhost:3000'

async function testApi(endpoint, method = 'GET', data = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-playwright-test': true,
  }

  const options = {
    method,
    headers,
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options)
    const result = await response.json()

    console.log(`${method} ${endpoint}:`, response.status)
    if (!response.ok) {
      console.error('  Error:', result.error)
    } else {
      console.log('  Success:', result.success ? '✅' : '❌')
      if (result.data && Object.keys(result.data).length > 0) {
        console.log('  Data keys:', Object.keys(result.data).slice(0, 3))
      }
    }
    return response.ok
  } catch (error) {
    console.error(`  Failed: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🧪 Testing API fixes...\n')

  // Test credit-notes API
  console.log('📋 Testing Credit Notes API:')
  await testApi('/api/credit-notes', 'GET')
  await testApi('/api/credit-notes/route', 'GET')

  console.log('\n📋 Testing Debit Notes API:')
  await testApi('/api/debit-notes', 'GET')
  await testApi('/api/debit-notes/route', 'GET')

  console.log('\n📋 Testing other APIs that were fixed:')
  await testApi('/api/invoices', 'GET')
  await testApi('/api/receipts', 'GET')
  await testApi('/api/payments', 'GET')
  await testApi('/api/purchases', 'GET')
  await testApi('/api/customers', 'GET')
  await testApi('/api/vendors', 'GET')
  await testApi('/api/products', 'GET')

  console.log('\n✅ All API tests completed!')
}

main().catch(console.error)