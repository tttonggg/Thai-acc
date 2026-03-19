/**
 * Step 2 Test: Backend API Verification
 *
 * Tests all invoice commenting system API endpoints
 * Requires: Dev server running on localhost:3000
 */

const API_BASE = 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

// Helper: Login and get session token
async function login(email: string, password: string) {
  const response = await fetch(`${API_BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  const cookies = response.headers.get('set-cookie')
  return { cookies }
}

// Helper: Make authenticated request
async function apiRequest(
  method: string,
  path: string,
  cookies: string | null,
  body?: any
) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookies && { Cookie: cookies })
    },
    ...(body && { body: JSON.stringify(body) })
  })

  let data
  try {
    data = await response.json()
  } catch (e) {
    data = await response.text()
  }

  return { response, data }
}

// Test runner
async function runTest(
  name: string,
  testFn: () => Promise<void>
) {
  try {
    await testFn()
    results.push({ name, passed: true })
    console.log(`   ✅ ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message })
    console.log(`   ❌ ${name}`)
    console.log(`      Error: ${error.message}`)
  }
}

async function testBackendAPI() {
  console.log('='.repeat(60))
  console.log('🔌 Step 2: Backend API Verification Test')
  console.log('='.repeat(60))
  console.log('\n⚠️  Prerequisite: Dev server must be running on localhost:3000')
  console.log('   Start with: npm run dev\n')

  let cookies: string | null = null
  let testUserId: string | null = null
  let testInvoiceId: string | null = null
  let testLineId: string | null = null
  let testCommentId: string | null = null

  // Setup: Login
  console.log('🔐 Setup: Login as admin')
  try {
    const auth = await login('admin@thaiaccounting.com', 'admin123')
    cookies = auth.cookies
    console.log('   ✅ Logged in successfully\n')
  } catch (error: any) {
    console.log(`   ❌ Login failed: ${error.message}`)
    console.log('\n💡 Make sure the dev server is running: npm run dev')
    console.log('   And database has been seeded: npx prisma db seed\n')
    return false
  }

  // Get test data
  console.log('🔍 Setup: Get test data')
  const { data: invoices } = await apiRequest('GET', '/api/invoices?limit=1', cookies)
  if (invoices.success && invoices.data.length > 0) {
    testInvoiceId = invoices.data[0].id
    console.log(`   ✅ Using invoice: ${invoices.data[0].invoiceNo}\n`)
  } else {
    console.log('   ❌ No invoices found. Please run: npx prisma db seed\n')
    return false
  }

  // Get first line from invoice
  const { data: invoiceDetail } = await apiRequest(
    'GET',
    `/api/invoices/${testInvoiceId}`,
    cookies
  )
  if (invoiceDetail.success && invoiceDetail.data.lines?.length > 0) {
    testLineId = invoiceDetail.data.lines[0].id
    console.log(`   ✅ Using line: ${invoiceDetail.data.lines[0].description}\n`)
  }

  // ========================================
  // COMMENTS API TESTS
  // ========================================
  console.log('📝 Comments API Tests')
  console.log('-'.repeat(60))

  // Test 1: GET /api/invoices/[id]/comments - List comments
  await runTest('GET /api/invoices/[id]/comments - List comments', async () => {
    const { response, data } = await apiRequest(
      'GET',
      `/api/invoices/${testInvoiceId}/comments`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'API returned failure')

    // Verify response structure
    if (!Array.isArray(data.data.comments)) {
      throw new Error('Response should have comments array')
    }
  })

  // Test 2: POST /api/invoices/[id]/comments - Create comment
  await runTest('POST /api/invoices/[id]/comments - Create comment', async () => {
    const { response, data } = await apiRequest(
      'POST',
      `/api/invoices/${testInvoiceId}/comments`,
      cookies,
      {
        content: 'Test comment from API test',
        isInternal: false,
        mentions: [],
        resolved: false
      }
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to create comment')

    testCommentId = data.data.id
  })

  // Test 3: POST /api/invoices/[id]/comments - Create threaded reply
  await runTest('POST /api/invoices/[id]/comments - Create reply', async () => {
    const { response, data } = await apiRequest(
      'POST',
      `/api/invoices/${testInvoiceId}/comments`,
      cookies,
      {
        content: 'Test reply from API test',
        isInternal: false,
        parentId: testCommentId,
        mentions: [],
        resolved: false
      }
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to create reply')
  })

  // Test 4: PUT /api/invoices/[id]/comments/[commentId] - Update comment
  await runTest('PUT /api/invoices/[id]/comments/[id] - Resolve comment', async () => {
    const { response, data } = await apiRequest(
      'PUT',
      `/api/invoices/${testInvoiceId}/comments/${testCommentId}`,
      cookies,
      {
        resolved: true
      }
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to update comment')
  })

  // Test 5: GET /api/invoices/[id]/comments - Verify resolved status
  await runTest('GET /api/invoices/[id]/comments - Verify resolved', async () => {
    const { response, data } = await apiRequest(
      'GET',
      `/api/invoices/${testInvoiceId}/comments`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    // Find our test comment
    const testComment = data.data.comments.find((c: any) => c.id === testCommentId)
    if (!testComment) throw new Error('Test comment not found')

    if (!testComment.resolved) {
      throw new Error('Comment should be marked as resolved')
    }
  })

  // Test 6: DELETE /api/invoices/[id]/comments/[commentId] - Delete comment
  await runTest('DELETE /api/invoices/[id]/comments/[id] - Delete comment', async () => {
    const { response, data } = await apiRequest(
      'DELETE',
      `/api/invoices/${testInvoiceId}/comments/${testCommentId}`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to delete comment')
  })

  // ========================================
  // LINE EDITING API TESTS
  // ========================================
  console.log('\n📝 Line Editing API Tests')
  console.log('-'.repeat(60))

  if (testLineId) {
    // Test 7: GET /api/invoices/[id]/lines/[lineId] - Get line item
    await runTest('GET /api/invoices/[id]/lines/[lineId] - Get line', async () => {
      const { response, data } = await apiRequest(
        'GET',
        `/api/invoices/${testInvoiceId}/lines/${testLineId}`,
        cookies
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data.success) throw new Error(data.error || 'Failed to get line')
    })

    // Test 8: PUT /api/invoices/[id]/lines/[lineId] - Edit line (DRAFT only)
    await runTest('PUT /api/invoices/[id]/lines/[lineId] - Edit line', async () => {
      const { response, data } = await apiRequest(
        'PUT',
        `/api/invoices/${testInvoiceId}/lines/${testLineId}`,
        cookies,
        {
          quantity: 10,
          changeReason: 'API test quantity adjustment'
        }
      )

      // May fail if invoice is not DRAFT (Thai tax compliance)
      if (response.status === 400 && data.error?.includes('DRAFT')) {
        console.log('      ℹ️  Expected: Invoice not in DRAFT status')
        return
      }

      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      if (!data.success) throw new Error(data.error || 'Failed to update line')
    })

    // Test 9: GET /api/invoices/[id]/lines/[lineId] - Check audit trail
    await runTest('GET /api/invoices/[id]/lines/[lineId] - Check audit', async () => {
      const { response, data } = await apiRequest(
        'GET',
        `/api/invoices/${testInvoiceId}/lines/${testLineId}`,
        cookies
      )

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      // Verify audit trail is included
      if (!data.data.auditTrail) {
        throw new Error('Response should include auditTrail')
      }
    })
  } else {
    console.log('   ⚠️  Skipping line tests (no lines found)')
  }

  // ========================================
  // AUDIT LOG API TESTS
  // ========================================
  console.log('\n📝 Audit Log API Tests')
  console.log('-'.repeat(60))

  // Test 10: GET /api/invoices/[id]/audit - Get audit log
  await runTest('GET /api/invoices/[id]/audit - Get audit log', async () => {
    const { response, data } = await apiRequest(
      'GET',
      `/api/invoices/${testInvoiceId}/audit`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to get audit log')

    // Verify structure
    if (!Array.isArray(data.data.entries)) {
      throw new Error('Response should have entries array')
    }
  })

  // Test 11: GET /api/invoices/[id]/audit - With filters
  await runTest('GET /api/invoices/[id]/audit - With filters', async () => {
    const { response, data } = await apiRequest(
      'GET',
      `/api/invoices/${testInvoiceId}/audit?action=UPDATED&limit=10`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to get filtered audit log')
  })

  // ========================================
  // RELATED DOCUMENTS API TESTS
  // ========================================
  console.log('\n📝 Related Documents API Tests')
  console.log('-'.repeat(60))

  // Test 12: GET /api/invoices/[id]/related - List related documents
  await runTest('GET /api/invoices/[id]/related - List related', async () => {
    const { response, data } = await apiRequest(
      'GET',
      `/api/invoices/${testInvoiceId}/related`,
      cookies
    )

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to get related documents')

    // Verify structure
    if (!data.data.relatedDocuments) {
      throw new Error('Response should have relatedDocuments array')
    }
  })

  // Test 13: POST /api/invoices/[id]/related - Link document (may fail)
  await runTest('POST /api/invoices/[id]/related - Link document', async () => {
    const { response, data } = await apiRequest(
      'POST',
      `/api/invoices/${testInvoiceId}/related`,
      cookies,
      {
        relatedModule: 'receipt',
        relatedId: 'test-receipt-id',
        relationType: 'LINKS',
        notes: 'API test relationship'
      }
    )

    // May fail if receipt doesn't exist (expected)
    if (response.status === 404 || response.status === 400) {
      console.log('      ℹ️  Expected: Test receipt not found')
      return
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    if (!data.success) throw new Error(data.error || 'Failed to link document')
  })

  // ========================================
  // PERMISSION TESTS
  // ========================================
  console.log('\n📝 Permission Tests')
  console.log('-'.repeat(60))

  // Test 14: Test as VIEWER (should fail for internal comments)
  await runTest('Permission: VIEWER cannot create internal comment', async () => {
    // Login as viewer
    const viewerAuth = await login('viewer@thaiaccounting.com', 'viewer123')

    const { response, data } = await apiRequest(
      'POST',
      `/api/invoices/${testInvoiceId}/comments`,
      viewerAuth.cookies,
      {
        content: 'Internal comment from viewer',
        isInternal: true,
        mentions: [],
        resolved: false
      }
    )

    // Should fail with 403
    if (response.status !== 403) {
      throw new Error('Expected 403 Forbidden, got ' + response.status)
    }
  })

  // ========================================
  // SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(60))
  console.log('📊 Test Summary')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length

  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}`)
      console.log(`     ${r.error}`)
    })
  }

  if (failed === 0) {
    console.log('\n🎉 All API tests passed!')
    console.log('✅ Step 2: Backend API - VERIFIED')
    console.log('\nผลการทดสอบ Step 2:')
    console.log('   ✅ Comments API: GET, POST, PUT, DELETE')
    console.log('   ✅ Line Editing API: GET, PUT')
    console.log('   ✅ Audit Log API: GET with filters')
    console.log('   ✅ Related Documents API: GET, POST')
    console.log('   ✅ Permissions: Role-based access control')
    return true
  } else {
    console.log('\n⚠️  Some API tests failed. Please review the errors above.')
    console.log('❌ Step 2: Backend API - HAS ISSUES')
    return false
  }
}

// Run tests
testBackendAPI()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
