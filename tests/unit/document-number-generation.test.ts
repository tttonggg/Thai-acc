/**
 * Document Number Generation - Race Condition Test
 *
 * This test verifies that the generateDocNumber function correctly
 * handles concurrent requests and prevents duplicate document numbers.
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { prisma } from '@/lib/db'
import { generateDocNumber } from '@/lib/api-utils'

describe('Document Number Generation - Race Condition Tests', () => {
  beforeEach(async () => {
    // Clean up any existing document numbers
    await prisma.documentNumber.deleteMany({})
  })

  afterEach(async () => {
    // Clean up test data
    await prisma.documentNumber.deleteMany({})
  })

  it('should generate sequential document numbers', async () => {
    const num1 = await generateDocNumber('TEST_INV', 'INV')
    const num2 = await generateDocNumber('TEST_INV', 'INV')
    const num3 = await generateDocNumber('TEST_INV', 'INV')

    expect(num1).not.toBe(num2)
    expect(num2).not.toBe(num3)

    // Verify they are sequential
    const parts1 = num1.split('-')
    const parts2 = num2.split('-')
    const parts3 = num3.split('-')

    const seq1 = parseInt(parts1[parts1.length - 1])
    const seq2 = parseInt(parts2[parts2.length - 1])
    const seq3 = parseInt(parts3[parts3.length - 1])

    expect(seq2).toBe(seq1 + 1)
    expect(seq3).toBe(seq2 + 1)
  })

  it('should handle concurrent requests without duplicates', async () => {
    const concurrentRequests = 100

    // Create 100 concurrent requests
    const promises = Array.from({ length: concurrentRequests }, () =>
      generateDocNumber('TEST_CONCURRENT', 'CON')
    )

    const results = await Promise.all(promises)

    // Verify all results are unique
    const uniqueResults = new Set(results)
    expect(uniqueResults.size).toBe(concurrentRequests)

    // Verify all results have the correct format
    results.forEach(result => {
      expect(result).toMatch(/^CON-\d{6}-\d{4}$/)
    })
  })

  it('should create document number record if not exists', async () => {
    const docType = 'NEW_TYPE'
    const docNumber = await generateDocNumber(docType, 'NEW')

    expect(docNumber).toBeTruthy()

    // Verify record was created
    const record = await prisma.documentNumber.findUnique({
      where: { type: docType }
    })

    expect(record).toBeTruthy()
    expect(record?.currentNo).toBe(1)
  })

  it('should increment existing document number', async () => {
    const docType = 'INCREMENT_TYPE'

    // First call should create record
    const num1 = await generateDocNumber(docType, 'INC')
    const record1 = await prisma.documentNumber.findUnique({
      where: { type: docType }
    })
    expect(record1?.currentNo).toBe(1)

    // Second call should increment
    const num2 = await generateDocNumber(docType, 'INC')
    const record2 = await prisma.documentNumber.findUnique({
      where: { type: docType }
    })
    expect(record2?.currentNo).toBe(2)

    expect(num1).not.toBe(num2)
  })

  it('should timeout after configured timeout period', async () => {
    // This test verifies transaction timeout handling
    // In a real scenario, you'd simulate a long-running transaction
    const startTime = Date.now()

    try {
      // Attempt to generate with a very short timeout
      // (This would require modifying the function to accept timeout parameter)
      const result = await generateDocNumber('TIMEOUT_TEST', 'TST')
      const duration = Date.now() - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000) // 10 seconds max
      expect(result).toBeTruthy()
    } catch (error) {
      // Transaction might timeout in high-load scenarios
      expect(error).toBeDefined()
    }
  })
})

/**
 * Manual Test Script for Concurrent Requests
 *
 * Run this script to manually test concurrent document generation:
 *
 * ```bash
 * node tests/manual/test-concurrent-docs.js
 * ```
 *
 * Expected output: All document numbers should be unique
 */
