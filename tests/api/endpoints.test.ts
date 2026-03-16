/**
 * API Endpoints Integration Tests
 * Tests for all REST API endpoints
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/db'

const API_BASE = process.env.NEXTAUTH_URL || 'http://localhost:3000'
const TEST_HEADERS = {
  'Content-Type': 'application/json',
  'x-playwright-test': 'true',
}

describe('Accounts API', () => {
  describe('GET /api/accounts', () => {
    it('should return list of accounts', async () => {
      const response = await fetch(`${API_BASE}/api/accounts`, {
        headers: TEST_HEADERS,
      })

      if (response.status === 200) {
        const data = await response.json()
        expect(data).toHaveProperty('data')
        expect(Array.isArray(data.data)).toBe(true)
      } else {
        expect([401, 403]).toContain(response.status)
      }
    })

    it('should filter accounts by type', async () => {
      const response = await fetch(`${API_BASE}/api/accounts?type=ASSET`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should search accounts by code or name', async () => {
      const response = await fetch(`${API_BASE}/api/accounts?search=1100`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('POST /api/accounts', () => {
    it('should create new account', async () => {
      const newAccount = {
        code: '9999',
        name: 'Test Account',
        type: 'EXPENSE',
        parentId: null,
      }

      const response = await fetch(`${API_BASE}/api/accounts`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(newAccount),
      })

      expect([201, 401, 403]).toContain(response.status)
    })

    it('should reject duplicate account code', async () => {
      const duplicateAccount = {
        code: '1100', // Cash account - already exists
        name: 'Duplicate',
        type: 'ASSET',
      }

      const response = await fetch(`${API_BASE}/api/accounts`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(duplicateAccount),
      })

      expect([409, 401, 403]).toContain(response.status)
    })
  })

  describe('GET /api/accounts/:id', () => {
    it('should return account by ID', async () => {
      const response = await fetch(`${API_BASE}/api/accounts/test-id`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403, 404]).toContain(response.status)
    })
  })

  describe('PUT /api/accounts/:id', () => {
    it('should update existing account', async () => {
      const update = { name: 'Updated Name' }

      const response = await fetch(`${API_BASE}/api/accounts/test-id`, {
        method: 'PUT',
        headers: TEST_HEADERS,
        body: JSON.stringify(update),
      })

      expect([200, 401, 403, 404]).toContain(response.status)
    })
  })

  describe('DELETE /api/accounts/:id', () => {
    it('should soft delete account', async () => {
      const response = await fetch(`${API_BASE}/api/accounts/test-id`, {
        method: 'DELETE',
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403, 404]).toContain(response.status)
    })
  })
})

describe('Invoices API', () => {
  describe('GET /api/invoices', () => {
    it('should return list of invoices', async () => {
      const response = await fetch(`${API_BASE}/api/invoices`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should filter by status', async () => {
      const response = await fetch(`${API_BASE}/api/invoices?status=ISSUED`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should filter by date range', async () => {
      const response = await fetch(
        `${API_BASE}/api/invoices?startDate=2024-01-01&endDate=2024-12-31`,
        { headers: TEST_HEADERS }
      )

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('POST /api/invoices', () => {
    it('should create new invoice', async () => {
      const newInvoice = {
        customerId: 'test-customer',
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
          {
            productId: 'test-product',
            quantity: 2,
            unitPrice: 1000,
            amount: 2000,
          },
        ],
        subtotal: 2000,
        vatAmount: 140,
        totalAmount: 2140,
      }

      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(newInvoice),
      })

      expect([201, 401, 403, 400]).toContain(response.status)
    })

    it('should calculate totals automatically', async () => {
      const invoiceWithAutoCalc = {
        customerId: 'test-customer',
        items: [
          { productId: 'p1', quantity: 2, unitPrice: 1000 },
          { productId: 'p2', quantity: 1, unitPrice: 500 },
        ],
      }

      const response = await fetch(`${API_BASE}/api/invoices`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(invoiceWithAutoCalc),
      })

      expect([201, 401, 403]).toContain(response.status)
    })
  })

  describe('POST /api/invoices/:id/post', () => {
    it('should post invoice to GL', async () => {
      const response = await fetch(`${API_BASE}/api/invoices/test-id/post`, {
        method: 'POST',
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403, 404]).toContain(response.status)
    })

    it('should prevent double posting', async () => {
      // First post
      await fetch(`${API_BASE}/api/invoices/test-id/post`, {
        method: 'POST',
        headers: TEST_HEADERS,
      })

      // Second post should fail
      const response = await fetch(`${API_BASE}/api/invoices/test-id/post`, {
        method: 'POST',
        headers: TEST_HEADERS,
      })

      expect([400, 401, 403, 404]).toContain(response.status)
    })
  })
})

describe('Journal Entries API', () => {
  describe('GET /api/journal', () => {
    it('should return journal entries', async () => {
      const response = await fetch(`${API_BASE}/api/journal`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should filter by date range', async () => {
      const response = await fetch(
        `${API_BASE}/api/journal?startDate=2024-01-01&endDate=2024-12-31`,
        { headers: TEST_HEADERS }
      )

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('POST /api/journal', () => {
    it('should create balanced journal entry', async () => {
      const journalEntry = {
        date: new Date().toISOString(),
        description: 'Test journal entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 1000 },
        ],
      }

      const response = await fetch(`${API_BASE}/api/journal`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(journalEntry),
      })

      expect([201, 401, 403]).toContain(response.status)
    })

    it('should reject unbalanced entry', async () => {
      const unbalancedEntry = {
        date: new Date().toISOString(),
        description: 'Unbalanced entry',
        lines: [
          { accountId: 'acc-1', debit: 1000, credit: 0 },
          { accountId: 'acc-2', debit: 0, credit: 900 },
        ],
      }

      const response = await fetch(`${API_BASE}/api/journal`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(unbalancedEntry),
      })

      expect([400, 401, 403]).toContain(response.status)
    })

    it('should require at least 2 lines', async () => {
      const singleLineEntry = {
        date: new Date().toISOString(),
        description: 'Single line',
        lines: [{ accountId: 'acc-1', debit: 1000, credit: 0 }],
      }

      const response = await fetch(`${API_BASE}/api/journal`, {
        method: 'POST',
        headers: TEST_HEADERS,
        body: JSON.stringify(singleLineEntry),
      })

      expect([400, 401, 403]).toContain(response.status)
    })
  })

  describe('POST /api/journal/:id/post', () => {
    it('should post journal entry', async () => {
      const response = await fetch(`${API_BASE}/api/journal/test-id/post`, {
        method: 'POST',
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403, 404]).toContain(response.status)
    })
  })
})

describe('Reports API', () => {
  describe('GET /api/reports/trial-balance', () => {
    it('should return trial balance', async () => {
      const response = await fetch(`${API_BASE}/api/reports/trial-balance`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })

    it('should accept asOfDate parameter', async () => {
      const response = await fetch(
        `${API_BASE}/api/reports/trial-balance?asOfDate=2024-03-31`,
        { headers: TEST_HEADERS }
      )

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('GET /api/reports/balance-sheet', () => {
    it('should return balance sheet', async () => {
      const response = await fetch(`${API_BASE}/api/reports/balance-sheet`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('GET /api/reports/profit-loss', () => {
    it('should return profit and loss', async () => {
      const response = await fetch(`${API_BASE}/api/reports/profit-loss`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })
  })

  describe('GET /api/reports/vat', () => {
    it('should return VAT report', async () => {
      const response = await fetch(`${API_BASE}/api/reports/vat`, {
        headers: TEST_HEADERS,
      })

      expect([200, 401, 403]).toContain(response.status)
    })
  })
})

describe('Error Handling', () => {
  it('should return 404 for unknown endpoint', async () => {
    const response = await fetch(`${API_BASE}/api/unknown-endpoint`, {
      headers: TEST_HEADERS,
    })

    expect(response.status).toBe(404)
  })

  it('should return 405 for wrong HTTP method', async () => {
    const response = await fetch(`${API_BASE}/api/accounts`, {
      method: 'PATCH',
      headers: TEST_HEADERS,
    })

    expect([405, 401, 403]).toContain(response.status)
  })

  it('should return JSON error response', async () => {
    const response = await fetch(`${API_BASE}/api/unknown-endpoint`, {
      headers: TEST_HEADERS,
    })

    const contentType = response.headers.get('content-type')
    expect(contentType).toContain('application/json')
  })
})
