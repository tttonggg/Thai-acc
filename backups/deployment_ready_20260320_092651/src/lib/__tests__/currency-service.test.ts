/**
 * Currency Service - Comprehensive Unit Tests
 * Tests for multi-currency operations, exchange rates, and gain/loss calculations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  convertCurrency,
  getExchangeRate,
  setExchangeRate,
  fetchLatestRates,
  updateExchangeRatesFromAPI,
  calculateRealizedGainLoss,
  calculateUnrealizedGainLoss,
  postGainLossToGL,
  formatForeignAmount,
  generateMultiCurrencyReport,
  initializeDefaultCurrencies,
} from '../currency-service'

// Mock the prisma client - use vi.hoisted to avoid hoisting issues
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    exchangeRate: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    currency: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
    },
    invoice: {
      findMany: vi.fn(),
    },
    currencyGainLoss: {
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}))

vi.mock('@/lib/db', () => ({
  prisma: mockPrisma,
  default: mockPrisma,
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Currency Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('convertCurrency', () => {
    it('should convert currency correctly using cross rates', () => {
      // USD to THB: 100 USD * 35 = 3500 THB
      // THB to EUR: 3500 / 38 = 92.11 EUR
      const result = convertCurrency(100, 35, 38)
      expect(result).toBeCloseTo(92.11, 2)
    })

    it('should handle THB to foreign currency conversion', () => {
      // 1000 THB to USD (rate 35 means 1 USD = 35 THB)
      const result = convertCurrency(1000, 1, 35)
      expect(result).toBeCloseTo(28.57, 2)
    })

    it('should return same amount when rates are equal', () => {
      const result = convertCurrency(1000, 35, 35)
      expect(result).toBe(1000)
    })

    it('should handle zero amount', () => {
      const result = convertCurrency(0, 35, 38)
      expect(result).toBe(0)
    })

    it('should handle very large amounts', () => {
      const result = convertCurrency(1000000000, 35, 1)
      expect(result).toBe(35000000000)
    })

    it('should handle fractional rates', () => {
      const result = convertCurrency(100, 35.254, 38.123)
      expect(result).toBeCloseTo(92.47, 2)
    })
  })

  describe('getExchangeRate', () => {
    it('should return 1 for THB', async () => {
      const rate = await getExchangeRate('THB')
      expect(rate).toBe(1)
    })

    it('should return rate for specific date', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.exchangeRate.findFirst.mockResolvedValue({
        rate: 35.5,
        date: new Date('2024-03-15'),
      })

      const rate = await getExchangeRate('USD', new Date('2024-03-15'))
      expect(rate).toBe(35.5)
    })

    it('should return latest rate when no date specified', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.exchangeRate.findFirst.mockResolvedValue({
        rate: 36.0,
        date: new Date(),
      })

      const rate = await getExchangeRate('EUR')
      expect(rate).toBe(36.0)
    })

    it('should throw error when rate not found', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.exchangeRate.findFirst.mockResolvedValue(null)
      mockPrisma.currency.findUnique.mockResolvedValue(null)

      await expect(getExchangeRate('XYZ')).rejects.toThrow('ไม่พบอัตราแลกเปลี่ยนสำหรับ XYZ')
    })

    it('should fallback to currency default rate', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.exchangeRate.findFirst.mockResolvedValueOnce(null)
      mockPrisma.currency.findUnique.mockResolvedValue({ id: 'curr-1', code: 'USD' })
      mockPrisma.exchangeRate.findFirst.mockResolvedValueOnce({ rate: 35.0 })

      const rate = await getExchangeRate('USD')
      expect(rate).toBe(35.0)
    })
  })

  describe('setExchangeRate', () => {
    it('should create exchange rate record', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findUnique.mockResolvedValue({ id: 'curr-1', code: 'USD' })
      mockPrisma.exchangeRate.create.mockResolvedValue({
        id: 'rate-1',
        fromCurrency: 'USD',
        toCurrency: 'THB',
        rate: 35.5,
      })

      const result = await setExchangeRate('USD', 'THB', 35.5, new Date(), 'MANUAL', 'ref-1', 'user-1')

      expect(result).toBeDefined()
      expect(result.fromCurrency).toBe('USD')
      expect(result.rate).toBe(35.5)
    })

    it('should include source information', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findUnique.mockResolvedValue({ id: 'curr-1' })
      
      await setExchangeRate('EUR', 'THB', 38.0, new Date(), 'API', 'api-ref', 'system')

      expect(mockPrisma.exchangeRate.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            source: 'API',
            sourceRef: 'api-ref',
            createdBy: 'system',
          }),
        })
      )
    })
  })

  describe('fetchLatestRates', () => {
    it('should fetch rates from external API', async () => {
      const mockResponse = {
        rates: {
          USD: 0.02857,  // 1 THB = 0.02857 USD, so 1 USD = 35 THB
          EUR: 0.02632,  // 1 THB = 0.02632 EUR, so 1 EUR = 38 THB
          JPY: 4.35,     // 1 THB = 4.35 JPY, so 1 JPY = 0.23 THB
        },
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      const rates = await fetchLatestRates()

      expect(rates).toBeInstanceOf(Array)
      expect(rates.length).toBeGreaterThan(0)
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('exchangerate-api.com'))
    })

    it('should throw error when API fails', async () => {
      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      })

      await expect(fetchLatestRates()).rejects.toThrow('Failed to fetch exchange rates')
    })

    it('should handle network errors', async () => {
      ;(global.fetch as any).mockRejectedValue(new Error('Network error'))

      await expect(fetchLatestRates()).rejects.toThrow('Network error')
    })
  })

  describe('updateExchangeRatesFromAPI', () => {
    it('should update rates for all active currencies', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findMany.mockResolvedValue([
        { id: 'curr-1', code: 'USD' },
        { id: 'curr-2', code: 'EUR' },
      ])

      const mockResponse = {
        rates: {
          USD: 0.02857,
          EUR: 0.02632,
        },
      }

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      })

      mockPrisma.currency.findUnique.mockResolvedValue({ id: 'curr-1' })
      mockPrisma.exchangeRate.create.mockResolvedValue({ id: 'rate-1' })

      const updatedCount = await updateExchangeRatesFromAPI('user-1')

      expect(updatedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('calculateRealizedGainLoss', () => {
    it('should calculate gain when rate increases', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currencyGainLoss.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'gl-1', ...data.data })
      )

      // Original rate: 35, Current rate: 36, Amount: 1000 USD
      // Gain = 1000 * (36 - 35) = 1000 THB
      const result = await calculateRealizedGainLoss(
        'Invoice',
        'inv-1',
        'USD',
        35,
        36,
        1000,
        new Date()
      )

      expect(result.gainLossAmount).toBe(1000)
      expect(result.type).toBe('REALIZED')
    })

    it('should calculate loss when rate decreases', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currencyGainLoss.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'gl-1', ...data.data })
      )

      // Original rate: 36, Current rate: 35, Amount: 1000 USD
      // Loss = 1000 * (35 - 36) = -1000 THB
      const result = await calculateRealizedGainLoss(
        'Payment',
        'pay-1',
        'USD',
        36,
        35,
        1000,
        new Date()
      )

      expect(result.gainLossAmount).toBe(-1000)
    })

    it('should round gain/loss amount', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currencyGainLoss.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'gl-1', ...data.data })
      )

      const result = await calculateRealizedGainLoss(
        'Invoice',
        'inv-1',
        'EUR',
        35.123,
        36.456,
        100.55,
        new Date()
      )

      expect(Number.isInteger(result.gainLossAmount)).toBe(true)
    })

    it('should set isPosted to false initially', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currencyGainLoss.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'gl-1', ...data.data })
      )

      const result = await calculateRealizedGainLoss(
        'Invoice',
        'inv-1',
        'USD',
        35,
        36,
        1000,
        new Date()
      )

      expect(result.isPosted).toBe(false)
    })
  })

  describe('calculateUnrealizedGainLoss', () => {
    it('should calculate for all unpaid foreign currency invoices', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          foreignAmount: 1000,
          exchangeRate: 35,
          currency: { code: 'USD' },
        },
      ])
      mockPrisma.exchangeRate.findFirst.mockResolvedValue({ rate: 36 })
      mockPrisma.currencyGainLoss.create.mockImplementation((data: any) => 
        Promise.resolve({ id: 'gl-1', ...data.data })
      )

      const results = await calculateUnrealizedGainLoss()

      expect(results).toBeInstanceOf(Array)
      expect(results.length).toBe(1)
      expect(results[0].type).toBe('UNREALIZED')
    })

    it('should skip invoices with no currency', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          foreignAmount: 1000,
          exchangeRate: 35,
          currency: null,
        },
      ])

      const results = await calculateUnrealizedGainLoss()

      expect(results.length).toBe(0)
    })

    it('should skip THB invoices', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          foreignAmount: 1000,
          exchangeRate: 1,
          currency: { code: 'THB' },
        },
      ])

      const results = await calculateUnrealizedGainLoss()

      expect(results.length).toBe(0)
    })

    it('should skip zero gain/loss items', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.invoice.findMany.mockResolvedValue([
        {
          id: 'inv-1',
          foreignAmount: 1000,
          exchangeRate: 35,
          currency: { code: 'USD' },
        },
      ])
      mockPrisma.exchangeRate.findFirst.mockResolvedValue({ rate: 35 }) // Same rate = no gain/loss

      const results = await calculateUnrealizedGainLoss()

      expect(results.length).toBe(0)
    })
  })

  describe('postGainLossToGL', () => {
    it('should mark gain/loss as posted and link to journal entry', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currencyGainLoss.update.mockResolvedValue({
        id: 'gl-1',
        isPosted: true,
        journalEntryId: 'je-1',
      })

      const result = await postGainLossToGL('gl-1', 'je-1')

      expect(result.isPosted).toBe(true)
      expect(result.journalEntryId).toBe('je-1')
      expect(mockPrisma.currencyGainLoss.update).toHaveBeenCalledWith({
        where: { id: 'gl-1' },
        data: { isPosted: true, journalEntryId: 'je-1' },
      })
    })
  })

  describe('formatForeignAmount', () => {
    it('should format with currency symbol and code', () => {
      const currency = {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
      } as any

      const result = formatForeignAmount(1234.56, currency)
      expect(result).toContain('$')
      expect(result).toContain('USD')
      expect(result).toContain('1,234.56')
    })

    it('should use correct decimal places', () => {
      const currency = {
        code: 'JPY',
        symbol: '¥',
        decimalPlaces: 0,
      } as any

      const result = formatForeignAmount(1234, currency)
      expect(result).toBe('¥1,234 JPY')
    })

    it('should handle negative amounts', () => {
      const currency = {
        code: 'EUR',
        symbol: '€',
        decimalPlaces: 2,
      } as any

      const result = formatForeignAmount(-500.25, currency)
      expect(result).toContain('-')
      expect(result).toContain('500.25')
    })
  })

  describe('generateMultiCurrencyReport', () => {
    it('should generate report with all currencies', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findFirst.mockResolvedValue({ code: 'THB', name: 'Thai Baht' })
      mockPrisma.currency.findMany.mockResolvedValue([
        {
          id: 'curr-1',
          code: 'USD',
          name: 'US Dollar',
          updatedAt: new Date(),
          exchangeRates: [{ rate: 35, date: new Date() }],
        },
      ])
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.$queryRaw.mockResolvedValue([{ totalAmount: 0, foreignAmount: 0 }])
      mockPrisma.currencyGainLoss.groupBy.mockResolvedValue([])

      const report = await generateMultiCurrencyReport()

      expect(report.baseCurrency).toBe('THB')
      expect(report.currencies).toBeInstanceOf(Array)
      expect(report.reportDate).toBeInstanceOf(Date)
    })

    it('should calculate receivables for each currency', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findFirst.mockResolvedValue({ code: 'THB' })
      mockPrisma.currency.findMany.mockResolvedValue([
        {
          id: 'curr-1',
          code: 'USD',
          name: 'US Dollar',
          updatedAt: new Date(),
          exchangeRates: [{ rate: 35, date: new Date() }],
        },
      ])
      mockPrisma.invoice.findMany.mockResolvedValue([
        { foreignAmount: 1000, totalAmount: 35000 },
        { foreignAmount: 500, totalAmount: 17500 },
      ])
      mockPrisma.$queryRaw.mockResolvedValue([{ totalAmount: 0, foreignAmount: 0 }])
      mockPrisma.currencyGainLoss.groupBy.mockResolvedValue([])

      const report = await generateMultiCurrencyReport()

      expect(report.currencies[0].receivables.count).toBe(2)
      expect(report.currencies[0].receivables.foreignAmount).toBe(1500)
      expect(report.currencies[0].receivables.thbAmount).toBe(52500)
    })

    it('should include realized and unrealized gain/loss', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.findFirst.mockResolvedValue({ code: 'THB' })
      mockPrisma.currency.findMany.mockResolvedValue([
        {
          id: 'curr-1',
          code: 'USD',
          name: 'US Dollar',
          updatedAt: new Date(),
          exchangeRates: [{ rate: 35, date: new Date() }],
        },
      ])
      mockPrisma.invoice.findMany.mockResolvedValue([])
      mockPrisma.$queryRaw.mockResolvedValue([{ totalAmount: 0, foreignAmount: 0 }])
      mockPrisma.currencyGainLoss.groupBy.mockResolvedValue([
        { type: 'REALIZED', _sum: { gainLossAmount: 5000 } },
        { type: 'UNREALIZED', _sum: { gainLossAmount: -2000 } },
      ])

      const report = await generateMultiCurrencyReport()

      expect(report.currencies[0].realizedGainLoss).toBe(5000)
      expect(report.currencies[0].unrealizedGainLoss).toBe(-2000)
    })
  })

  describe('initializeDefaultCurrencies', () => {
    it('should create default currencies', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      mockPrisma.currency.upsert.mockResolvedValue({ id: 'curr-1' })

      await initializeDefaultCurrencies()

      expect(mockPrisma.currency.upsert).toHaveBeenCalledTimes(8) // 8 default currencies
    })

    it('should set THB as base currency', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      const upsertCalls: any[] = []
      mockPrisma.currency.upsert.mockImplementation((args: any) => {
        upsertCalls.push(args)
        return Promise.resolve({ id: 'curr-1' })
      })

      await initializeDefaultCurrencies()

      const thbCall = upsertCalls.find(c => c.where.code === 'THB')
      expect(thbCall).toBeDefined()
      expect(thbCall.update.isBase).toBe(true)
    })

    it('should handle JPY with 0 decimal places', async () => {
      const mockPrisma = (await import('@/lib/db')).default
      const upsertCalls: any[] = []
      mockPrisma.currency.upsert.mockImplementation((args: any) => {
        upsertCalls.push(args)
        return Promise.resolve({ id: 'curr-1' })
      })

      await initializeDefaultCurrencies()

      const jpyCall = upsertCalls.find(c => c.where.code === 'JPY')
      expect(jpyCall.update.decimalPlaces).toBe(0)
    })
  })
})
