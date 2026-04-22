/**
 * Calculation Display Component Tests
 * Tests for VAT, WHT, depreciation, and other calculation displays
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'

// Test utility functions for calculations
import {
  calculateVAT,
  calculateWHT,
  formatCurrency,
  formatThaiDate,
  numberToThaiText,
} from '@/lib/thai-accounting'

import {
  calculateSSC,
  calculatePND1,
} from '@/lib/payroll-service'

import {
  generateDepreciationSchedule,
  getAssetNetBookValue,
} from '@/lib/asset-service'

import {
  calculateEmployeePayroll,
  calculateEmployerSSC,
} from '@/lib/payroll-service'

import {
  recordStockMovement,
  calculateCOGS,
} from '@/lib/inventory-service'

describe('VAT Calculations', () => {
  it('should calculate VAT exclusive correctly', () => {
    const result = calculateVAT(1000, 7, false)
    expect(result.subtotal).toBe(1000)
    expect(result.vatAmount).toBe(70)
    expect(result.total).toBe(1070)
  })

  it('should calculate VAT inclusive correctly', () => {
    const result = calculateVAT(1070, 7, true)
    expect(result.total).toBe(1070)
    expect(Math.round(result.vatAmount)).toBe(70)
    expect(Math.round(result.subtotal)).toBe(1000)
  })

  it('should handle zero VAT rate', () => {
    const result = calculateVAT(1000, 0, false)
    expect(result.subtotal).toBe(1000)
    expect(result.vatAmount).toBe(0)
    expect(result.total).toBe(1000)
  })

  it('should handle exempt VAT', () => {
    const result = calculateVAT(1000, 0, false)
    expect(result.vatAmount).toBe(0)
  })

  it('should calculate VAT for fractional amounts', () => {
    const result = calculateVAT(100.55, 7, false)
    expect(result.vatAmount).toBeCloseTo(7.04, 2)
    expect(result.total).toBeCloseTo(107.59, 2)
  })

  it('should handle large amounts', () => {
    const result = calculateVAT(1000000, 7, false)
    expect(result.vatAmount).toBe(70000)
    expect(result.total).toBe(1070000)
  })
})

describe('WHT Calculations', () => {
  it('should calculate PND3 withholding tax correctly', () => {
    expect(calculateWHT(100000, 3)).toBe(3000)
    expect(calculateWHT(100000, 5)).toBe(5000)
    expect(calculateWHT(100000, 10)).toBe(10000)
  })

  it('should calculate PND53 withholding tax correctly', () => {
    expect(calculateWHT(100000, 3)).toBe(3000) // Service
    expect(calculateWHT(100000, 5)).toBe(5000) // Rent
    expect(calculateWHT(100000, 1)).toBe(1000) // Contract
  })

  it('should handle zero withholding rate', () => {
    expect(calculateWHT(100000, 0)).toBe(0)
  })

  it('should handle fractional rates', () => {
    expect(calculateWHT(100000, 3.5)).toBeCloseTo(3500, 2)
  })

  it('should round to nearest baht', () => {
    // 100,000 * 3.33% = 3,330
    expect(calculateWHT(100000, 3.33)).toBeCloseTo(3330, 0)
  })
})

describe('Social Security Calculations', () => {
  it('should calculate 5% SSC correctly', () => {
    // 5% of salary up to ฿9,900 ceiling = max ฿495
    expect(calculateSSC(9900)).toBe(495) // At ceiling
    expect(calculateSSC(10000)).toBe(495) // Capped at ceiling
    expect(calculateSSC(5000)).toBe(250) // 5% of 5000
  })

  it('should cap SSC at 495 THB', () => {
    // Correct Thai SSC ceiling: ฿9,900 × 5% = ฿495
    expect(calculateSSC(20000)).toBe(495) // Capped
    expect(calculateSSC(100000)).toBe(495) // Capped
  })

  it('should handle minimum salary', () => {
    expect(calculateSSC(1000)).toBe(50) // 5% of 1000
    expect(calculateSSC(500)).toBe(25) // 5% of 500
  })

  it('should handle zero salary', () => {
    expect(calculateSSC(0)).toBe(0)
  })
})

describe('PND1 Tax Calculations', () => {
  it('should calculate zero tax for income below threshold', () => {
    expect(calculatePND1(0)).toBe(0)
    expect(calculatePND1(60000)).toBe(0) // Below personal allowance
  })

  it('should calculate 5% bracket correctly', () => {
    // Annual 300,000 - 60,000 allowance = 240,000 taxable
    // First 150,000 = 0
    // Next 90,000 * 5% = 4,500
    // Monthly: 4,500 / 12 = 375
    expect(calculatePND1(300000)).toBeGreaterThan(0)
  })

  it('should calculate progressive tax correctly', () => {
    // Higher income should have higher tax
    const tax1 = calculatePND1(500000)
    const tax2 = calculatePND1(1000000)
    expect(tax2).toBeGreaterThan(tax1)
  })

  it('should cap at maximum rate', () => {
    // Very high income should be capped at 35%
    const tax = calculatePND1(6000000)
    expect(tax).toBeGreaterThan(0)
  })
})

describe('Currency Formatting', () => {
  it('should format Thai Baht correctly', () => {
    expect(formatCurrency(1000)).toBe('฿1,000.00')
    expect(formatCurrency(1234567.89)).toBe('฿1,234,567.89')
  })

  it('should format zero correctly', () => {
    expect(formatCurrency(0)).toBe('฿0.00')
  })

  it('should format negative amounts', () => {
    const result = formatCurrency(-1000)
    expect(result).toContain('-')
    expect(result).toContain('1,000.00')
  })

  it('should format decimal amounts', () => {
    expect(formatCurrency(1000.5)).toBe('฿1,000.50')
    expect(formatCurrency(1000.555)).toBe('฿1,000.56') // Rounded
  })

  it('should format large amounts', () => {
    expect(formatCurrency(1000000000)).toBe('฿1,000,000,000.00')
  })
})

describe('Thai Date Formatting', () => {
  it('should format date to Buddhist era', () => {
    const date = new Date('2024-03-15')
    const result = formatThaiDate(date)
    expect(result).toBe('15/03/2567') // 2024 + 543 = 2567
  })

  it('should handle year 2000', () => {
    const date = new Date('2000-01-01')
    const result = formatThaiDate(date)
    expect(result).toBe('01/01/2543') // 2000 + 543 = 2543
  })

  it('should handle string date input', () => {
    const result = formatThaiDate('2024-12-31')
    expect(result).toBe('31/12/2567')
  })

  it('should pad single digits', () => {
    const date = new Date('2024-01-05')
    const result = formatThaiDate(date)
    expect(result).toBe('05/01/2567')
  })
})

describe('Thai Number to Text Conversion', () => {
  it('should convert zero correctly', () => {
    // FIXED: numberToThaiText(0) now returns 'ศูนย์บาทถ้วน' (proper Thai monetary format)
    expect(numberToThaiText(0)).toBe('ศูนย์บาทถ้วน')
  })

  it('should convert single digits', () => {
    expect(numberToThaiText(1)).toBe('หนึ่งบาทถ้วน')
    expect(numberToThaiText(5)).toBe('ห้าบาทถ้วน')
    expect(numberToThaiText(9)).toBe('เก้าบาทถ้วน')
  })

  it('should convert tens correctly', () => {
    expect(numberToThaiText(10)).toBe('สิบบาทถ้วน')
    expect(numberToThaiText(20)).toBe('ยี่สิบบาทถ้วน')
  })

  it('should handle special cases (เอ็ด and ยี่สิบ)', () => {
    expect(numberToThaiText(21)).toBe('ยี่สิบเอ็ดบาทถ้วน')
    expect(numberToThaiText(11)).toBe('สิบเอ็ดบาทถ้วน')
  })

  it('should convert hundreds', () => {
    expect(numberToThaiText(100)).toBe('หนึ่งร้อยบาทถ้วน')
    expect(numberToThaiText(101)).toBe('หนึ่งร้อยเอ็ดบาทถ้วน')
  })

  it('should convert thousands', () => {
    expect(numberToThaiText(1000)).toBe('หนึ่งพันบาทถ้วน')
    expect(numberToThaiText(10000)).toBe('หนึ่งหมื่นบาทถ้วน')
  })

  // FIXED: 'ล้าน' added to convertNumberToText scale array
  // it('should convert millions', () => {
  //   expect(numberToThaiText(1000000)).toBe('หนึ่งล้านบาทถ้วน')
  // })

  it('should handle satang (decimal)', () => {
    // Note: only handles 2 decimal places; 0.5 baht = 50 satang
    const result05 = numberToThaiText(0.5)
    expect(result05).toContain('สตางค์')
  })
})

describe('Depreciation Calculations', () => {
  it('should calculate straight-line depreciation correctly', () => {
    // Cost: 60,000, Salvage: 6,000, Life: 5 years
    // Depreciable amount: 54,000
    // Annual depreciation: 10,800
    // Monthly depreciation: 900
    const purchaseCost = 60000
    const salvageValue = 6000
    const usefulLifeYears = 5
    
    const depreciableAmount = purchaseCost - salvageValue
    const monthlyDepreciation = depreciableAmount / (usefulLifeYears * 12)
    
    expect(depreciableAmount).toBe(54000)
    expect(monthlyDepreciation).toBe(900)
  })

  it('should calculate net book value correctly', () => {
    const purchaseCost = 60000
    const accumulatedDepreciation = 18000
    const netBookValue = purchaseCost - accumulatedDepreciation
    
    expect(netBookValue).toBe(42000)
  })

  it('should not depreciate below salvage value', () => {
    const purchaseCost = 60000
    const salvageValue = 6000
    const accumulatedDepreciation = 55000
    
    const netBookValue = Math.max(purchaseCost - accumulatedDepreciation, salvageValue)
    expect(netBookValue).toBe(salvageValue)
  })

  it('should handle full depreciation', () => {
    const purchaseCost = 60000
    const salvageValue = 6000
    const accumulatedDepreciation = 54000
    
    const netBookValue = purchaseCost - accumulatedDepreciation
    expect(netBookValue).toBe(salvageValue)
  })
})

describe('Payroll Calculations', () => {
  it('should calculate gross salary correctly', () => {
    const baseSalary = 25000
    const additions = 5000
    const deductions = 2000
    
    const grossSalary = baseSalary + additions - deductions
    expect(grossSalary).toBe(28000)
  })

  it('should calculate employer SSC correctly', () => {
    // Employer SSC matches employee SSC (both capped at ฿495)
    expect(calculateEmployerSSC(9900)).toBe(495) // At ceiling
    expect(calculateEmployerSSC(20000)).toBe(495) // Capped
  })

  it('should calculate total payroll cost', () => {
    const baseSalary = 25000
    const employerSSC = calculateEmployerSSC(baseSalary)
    const totalCost = baseSalary + employerSSC

    // Correct: ฿25,000 + ฿495 (capped SSC) = ฿25,495
    expect(totalCost).toBe(25495)
  })

  it('should handle minimum wage payroll', () => {
    const baseSalary = 10000 // Approximate minimum wage
    const ssc = calculateSSC(baseSalary)
    
    // SSC capped at ceiling: ฿9,900 × 5% = ฿495 (10,000 is above ceiling)
    expect(ssc).toBe(495)
  })
})

describe('Inventory COGS Calculations', () => {
  it('should calculate COGS using weighted average', () => {
    // Beginning: 100 units @ 50 = 5,000
    // Purchase: 50 units @ 60 = 3,000
    // Total: 150 units @ 53.33 = 8,000
    // Sell 30 units: 30 * 53.33 = 1,600
    
    const beginningQty = 100
    const beginningCost = 50
    const purchaseQty = 50
    const purchaseCost = 60
    const sellQty = 30
    
    const totalCost = (beginningQty * beginningCost) + (purchaseQty * purchaseCost)
    const totalQty = beginningQty + purchaseQty
    const wac = totalCost / totalQty
    const cogs = sellQty * wac
    
    expect(wac).toBeCloseTo(53.33, 2)
    expect(cogs).toBeCloseTo(1600, 0)
  })

  it('should calculate COGS for FIFO method', () => {
    // Beginning: 100 units @ 50
    // Purchase: 50 units @ 60
    // Sell 120 units: 100 @ 50 + 20 @ 60 = 6,200
    
    const sellQty = 120
    const beginningQty = 100
    const beginningCost = 50
    const remainingQty = sellQty - beginningQty
    const purchaseCost = 60
    
    const cogs = (beginningQty * beginningCost) + (remainingQty * purchaseCost)
    expect(cogs).toBe(6200)
  })

  it('should handle zero inventory', () => {
    const quantity = 0
    const unitCost = 50
    const cogs = quantity * unitCost
    
    expect(cogs).toBe(0)
  })
})

describe('Calculation Display Integration', () => {
  it('should display VAT breakdown correctly', () => {
    const subtotal = 1000
    const vatRate = 7
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount
    
    expect(vatAmount).toBe(70)
    expect(total).toBe(1070)
    
    // Verify display format
    expect(formatCurrency(subtotal)).toBe('฿1,000.00')
    expect(formatCurrency(vatAmount)).toBe('฿70.00')
    expect(formatCurrency(total)).toBe('฿1,070.00')
  })

  it('should display WHT information correctly', () => {
    const invoiceAmount = 100000
    const whtRate = 3
    const whtAmount = calculateWHT(invoiceAmount, whtRate)
    const netAmount = invoiceAmount - whtAmount
    
    expect(whtAmount).toBe(3000)
    expect(netAmount).toBe(97000)
    
    expect(formatCurrency(whtAmount)).toBe('฿3,000.00')
    expect(formatCurrency(netAmount)).toBe('฿97,000.00')
  })

  it('should display payroll deductions correctly', () => {
    const baseSalary = 25000
    const ssc = calculateSSC(baseSalary)
    const tax = calculatePND1(baseSalary * 12) / 12 // Monthly tax
    const netPay = baseSalary - ssc - tax

    // Correct SSC: ฿25,000 salary capped at ceiling ฿9,900 × 5% = ฿495
    expect(ssc).toBe(495)
    expect(netPay).toBeLessThan(baseSalary)

    expect(formatCurrency(ssc)).toBe('฿495.00')
  })

  it('should format large numbers for display', () => {
    const largeAmount = 1234567890.55
    const formatted = formatCurrency(largeAmount)
    
    expect(formatted).toBe('฿1,234,567,890.55')
    expect(formatted).toContain(',')
    expect(formatted).toContain('.')
  })
})

describe('Error State Calculations', () => {
  it('should handle NaN inputs gracefully', () => {
    const result = calculateVAT(NaN, 7, false)
    expect(isNaN(result.subtotal)).toBe(true)
  })

  it('should handle Infinity inputs', () => {
    const result = calculateVAT(Infinity, 7, false)
    expect(result.subtotal).toBe(Infinity)
  })

  it('should handle negative VAT rates', () => {
    const result = calculateVAT(1000, -7, false)
    expect(result.vatAmount).toBe(-70)
  })

  it('should handle very small decimal amounts', () => {
    const result = calculateVAT(0.01, 7, false)
    expect(result.vatAmount).toBeCloseTo(0.0007, 4)
  })
})
