/**
 * Utility Functions - Comprehensive Unit Tests
 * Tests for cn() and other utility functions
 */

import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('Utils', () => {
  describe('cn()', () => {
    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-4 py-2', 'bg-blue-500')
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      const result = cn('px-4', isActive && 'bg-blue-500')
      expect(result).toBe('px-4 bg-blue-500')
    })

    it('should handle false conditional classes', () => {
      const isActive = false
      const result = cn('px-4', isActive && 'bg-blue-500')
      expect(result).toBe('px-4')
    })

    it('should merge conflicting classes (last wins)', () => {
      const result = cn('px-4', 'px-6')
      expect(result).toBe('px-6')
    })

    it('should handle arrays of classes', () => {
      const result = cn(['px-4', 'py-2'], ['bg-blue-500'])
      expect(result).toBe('px-4 py-2 bg-blue-500')
    })

    it('should handle nested arrays', () => {
      const result = cn(['px-4', ['py-2', 'm-2']])
      expect(result).toBe('px-4 py-2 m-2')
    })

    it('should handle objects for conditional classes', () => {
      const result = cn('px-4', { 'bg-blue-500': true, 'bg-red-500': false })
      expect(result).toBe('px-4 bg-blue-500')
    })

    it('should handle undefined and null values', () => {
      const result = cn('px-4', undefined, 'py-2', null)
      expect(result).toBe('px-4 py-2')
    })

    it('should merge complex Tailwind classes', () => {
      const result = cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium',
        'bg-blue-500 text-white hover:bg-blue-600',
        'disabled:opacity-50 disabled:pointer-events-none'
      )
      expect(result).toContain('inline-flex')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('hover:bg-blue-600')
    })

    it('should handle empty input', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('should handle single class', () => {
      const result = cn('px-4')
      expect(result).toBe('px-4')
    })

    it('should deduplicate classes correctly', () => {
      const result = cn('px-4', 'px-4')
      expect(result).toBe('px-4')
    })

    it('should handle responsive prefixes', () => {
      const result = cn('px-4 md:px-6', 'lg:px-8')
      expect(result).toBe('px-4 md:px-6 lg:px-8')
    })

    it('should handle arbitrary values', () => {
      const result = cn('px-[20px]', 'py-4')
      expect(result).toBe('px-[20px] py-4')
    })

    it('should handle important modifier', () => {
      const result = cn('!px-4', 'px-6')
      expect(result).toBe('!px-4 px-6')
    })
  })
})
