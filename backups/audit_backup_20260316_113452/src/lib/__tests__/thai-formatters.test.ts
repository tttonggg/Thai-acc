import { describe, it, expect } from 'vitest'

describe('Thai Format Utilities', () => {
  describe('Thai Baht Currency Formatting', () => {
    const formatBaht = (amount: number): string => {
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    }

    it('should format positive amounts correctly', () => {
      expect(formatBaht(1000)).toBe('฿1,000.00')
      expect(formatBaht(12345.67)).toBe('฿12,345.67')
      expect(formatBaht(1000000)).toBe('฿1,000,000.00')
    })

    it('should format zero correctly', () => {
      expect(formatBaht(0)).toBe('฿0.00')
    })

    it('should format negative amounts correctly', () => {
      const result = formatBaht(-1000)
      expect(result).toContain('฿')
      expect(result).toContain('1,000.00')
      expect(result).toContain('-')
    })

    it('should handle decimal places correctly', () => {
      expect(formatBaht(1000.5)).toBe('฿1,000.50')
      expect(formatBaht(1000.123)).toBe('฿1,000.12') // Should round to 2 decimals
    })
  })

  describe('Thai Number to Text Conversion', () => {
    // Simplified Thai number to text conversion for testing
    // A production implementation would need to handle all Thai number rules
    const numberToThaiText = (num: number): string => {
      if (num === 0) return 'ศูนย์บาท'

      const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
      const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']

      const units: string[] = []
      let remaining = Math.abs(num)
      let unitIndex = 0

      while (remaining > 0) {
        const digit = remaining % 10
        if (digit > 0) {
          let text = thaiDigits[digit]

          // Handle special Thai number cases
          if (digit === 2 && unitIndex === 1) text = 'ยี่' // ยี่สิบ (20)

          if (thaiUnits[unitIndex]) {
            // For units position (ones place), add หนึ่ง if it's the last digit
            if (unitIndex === 0 && units.length === 0) {
              units.unshift(text)
            } else if (unitIndex > 0) {
              units.unshift(text + thaiUnits[unitIndex])
            }
          }
        }
        remaining = Math.floor(remaining / 10)
        unitIndex++
      }

      // Handle single digit case
      if (num >= 1 && num <= 9) {
        return thaiDigits[num] + 'บาท'
      }

      const bahtText = units.join('') + 'บาท'
      return num < 0 ? 'ลบ' + bahtText : bahtText
    }

    it('should convert simple numbers to Thai text', () => {
      expect(numberToThaiText(0)).toBe('ศูนย์บาท')
      expect(numberToThaiText(1)).toBe('หนึ่งบาท')
      expect(numberToThaiText(10)).toContain('สิบ')
      expect(numberToThaiText(20)).toContain('ยี่สิบ')
      expect(numberToThaiText(100)).toContain('ร้อย')
      expect(numberToThaiText(1000)).toContain('พัน')
    })

    it('should handle special Thai number cases', () => {
      // ยี่สิบ (20) not สองสิบ
      const result20 = numberToThaiText(20)

      expect(result20).toContain('ยี่สิบ')
    })

    it('should handle negative numbers', () => {
      const result = numberToThaiText(-100)
      expect(result).toContain('ลบ')
      expect(result).toContain('บาท')
    })
  })

  describe('Thai Date Formatting', () => {
    const thaiMonths = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ]

    const thaiMonthsFull = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]

    const formatThaiDate = (date: Date, short: boolean = false): string => {
      const day = date.getDate()
      const monthIndex = date.getMonth()
      const year = date.getFullYear() + 543 // Convert to Buddhist year
      const month = short ? thaiMonths[monthIndex] : thaiMonthsFull[monthIndex]

      return `${day} ${month} ${year}`
    }

    it('should format date in Thai Buddhist calendar', () => {
      const date = new Date('2024-01-15')
      const result = formatThaiDate(date)

      expect(result).toContain('2567') // 2024 + 543
      expect(result).toContain('15')
      expect(result).toContain('มกราคม')
    })

    it('should format short date format', () => {
      const date = new Date('2024-06-30')
      const result = formatThaiDate(date, true)

      expect(result).toContain('30')
      expect(result).toContain('มิ.ย.')
      expect(result).toContain('2567')
    })

    it('should handle all months correctly', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-12-31')

      expect(formatThaiDate(date1)).toContain('มกราคม')
      expect(formatThaiDate(date2)).toContain('ธันวาคม')
    })
  })

  describe('Thai Account Code Validation', () => {
    const validateAccountCode = (code: string): { valid: boolean; type?: string } => {
      // Thai account code pattern: X-XX or X-XX-XX
      const pattern = /^[1-5]-\d{2}(-\d{2})?$/

      if (!pattern.test(code)) {
        return { valid: false }
      }

      const mainClass = parseInt(code[0])

      const accountTypes: { [key: number]: string } = {
        1: 'ASSET',
        2: 'LIABILITY',
        3: 'EQUITY',
        4: 'REVENUE',
        5: 'EXPENSE',
      }

      return {
        valid: true,
        type: accountTypes[mainClass]
      }
    }

    it('should validate correct account codes', () => {
      expect(validateAccountCode('1-01').valid).toBe(true)
      expect(validateAccountCode('1-01-01').valid).toBe(true)
      expect(validateAccountCode('5-99').valid).toBe(true)
    })

    it('should identify account type from code', () => {
      const asset1 = validateAccountCode('1-01')
      const liability2 = validateAccountCode('2-01')
      const equity3 = validateAccountCode('3-01')
      const revenue4 = validateAccountCode('4-01')
      const expense5 = validateAccountCode('5-01')

      expect(asset1.type).toBe('ASSET')
      expect(liability2.type).toBe('LIABILITY')
      expect(equity3.type).toBe('EQUITY')
      expect(revenue4.type).toBe('REVENUE')
      expect(expense5.type).toBe('EXPENSE')
    })

    it('should reject invalid account codes', () => {
      expect(validateAccountCode('6-01').valid).toBe(false) // Class 6 doesn't exist
      expect(validateAccountCode('1-1').valid).toBe(false) // Missing leading zero
      expect(validateAccountCode('101').valid).toBe(false) // Missing dash
      expect(validateAccountCode('A-01').valid).toBe(false) // Letter instead of number
    })
  })
})
