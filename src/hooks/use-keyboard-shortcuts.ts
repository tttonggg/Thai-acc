'use client'

import { useEffect, useCallback, useRef, useState } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description: string
  category?: string
  action: (event: KeyboardEvent) => void
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape key and certain shortcuts even in inputs
        if (event.key !== 'Escape' && event.key !== '?') {
          return
        }
      }

      for (const shortcut of shortcutsRef.current) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()
        const ctrlMatch = !!shortcut.ctrl === event.ctrlKey
        const shiftMatch = !!shortcut.shift === event.shiftKey
        const altMatch = !!shortcut.alt === event.altKey
        const metaMatch = !!shortcut.meta === event.metaKey

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          if (shortcut.preventDefault !== false) {
            event.preventDefault()
          }
          shortcut.action(event)
          break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}

// Vim-style navigation hook for lists and tables
export function useVimNavigation(itemCount: number, options?: {
  onSelect?: (index: number) => void
  onActivate?: (index: number) => void
  onEscape?: () => void
}) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Vim-style navigation
      switch (event.key) {
        case 'j':
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = Math.min(prev + 1, itemCount - 1)
            options?.onSelect?.(next)
            return next
          })
          break
        case 'k':
        case 'ArrowUp':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = Math.max(prev - 1, 0)
            options?.onSelect?.(next)
            return next
          })
          break
        case 'Enter':
          if (focusedIndex >= 0) {
            event.preventDefault()
            options?.onActivate?.(focusedIndex)
          }
          break
        case 'g':
          if (event.ctrlKey) {
            event.preventDefault()
            setFocusedIndex(0)
            options?.onSelect?.(0)
          }
          break
        case 'G':
          event.preventDefault()
          setFocusedIndex(itemCount - 1)
          options?.onSelect?.(itemCount - 1)
          break
        case 'Escape':
          event.preventDefault()
          setFocusedIndex(-1)
          options?.onEscape?.()
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [itemCount, focusedIndex, options])

  return { focusedIndex, setFocusedIndex, containerRef }
}

// Hook for search focus shortcut (/)
export function useSearchFocus(searchInputRef: React.RefObject<HTMLInputElement | null>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }

      if (event.key === '/') {
        event.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchInputRef])
}

// Hook for save shortcut (Ctrl+S)
export function useSaveShortcut(onSave: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === 's') {
        event.preventDefault()
        onSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onSave, enabled])
}

// Common shortcuts for the ERP
export const commonShortcuts = {
  newInvoice: { key: 'n', ctrl: true, description: 'สร้างใบกำกับภาษีใหม่' },
  save: { key: 's', ctrl: true, description: 'บันทึก (Ctrl+S)' },
  print: { key: 'p', ctrl: true, description: 'พิมพ์' },
  close: { key: 'Escape', description: 'ปิด/ยกเลิก' },
  search: { key: '/', description: 'ค้นหา (/)' },
  help: { key: '?', description: 'แสดงคีย์ลัด (?)' },
  nextItem: { key: 'j', description: 'เลือกรายการถัดไป (j)' },
  prevItem: { key: 'k', description: 'เลือกรายการก่อนหน้า (k)' },
  firstItem: { key: 'g', ctrl: true, description: 'ไปรายการแรก (Ctrl+G)' },
  lastItem: { key: 'G', description: 'ไปรายการสุดท้าย (G)' },
}

// Hook for help modal toggle
export function useHelpModal() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger when typing in an input (except Escape)
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        if (event.key === 'Escape' && isOpen) {
          setIsOpen(false)
        }
        return
      }

      if (event.key === '?') {
        event.preventDefault()
        setIsOpen(prev => !prev)
      } else if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  return { isOpen, setIsOpen }
}

// Hook for combining all ERP keyboard shortcuts
export function useERPKeyboardShortcuts(options: {
  onSave?: () => void
  onNew?: () => void
  onPrint?: () => void
  onClose?: () => void
  onSearch?: () => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  enableVim?: boolean
  itemCount?: number
  onItemSelect?: (index: number) => void
  onItemActivate?: (index: number) => void
}) {
  const {
    onSave,
    onNew,
    onPrint,
    onClose,
    onSearch,
    searchInputRef,
    enableVim,
    itemCount = 0,
    onItemSelect,
    onItemActivate,
  } = options

  // Use search focus hook
  useSearchFocus(searchInputRef || { current: null })

  // Use save shortcut
  useSaveShortcut(onSave || (() => {}), !!onSave)

  // Define all shortcuts
  const shortcuts: KeyboardShortcut[] = [
    ...(onNew ? [{
      key: 'n',
      ctrl: true,
      description: 'สร้างใหม่',
      category: 'ทั่วไป',
      action: onNew,
    }] : []),
    ...(onPrint ? [{
      key: 'p',
      ctrl: true,
      description: 'พิมพ์',
      category: 'ทั่วไป',
      action: onPrint,
    }] : []),
    ...(onClose ? [{
      key: 'Escape',
      description: 'ปิด/ยกเลิก',
      category: 'ทั่วไป',
      action: onClose,
    }] : []),
    ...(onSearch ? [{
      key: '/',
      description: 'ค้นหา',
      category: 'นำทาง',
      action: onSearch,
    }] : []),
  ]

  // Apply all shortcuts
  useKeyboardShortcuts(shortcuts)

  // Vim navigation - always call hook to maintain consistent order
  const vimNavResult = useVimNavigation(itemCount, {
    onSelect: onItemSelect,
    onActivate: onItemActivate,
  })
  const vimNav = enableVim ? vimNavResult : null

  // Help modal
  const { isOpen: isHelpOpen, setIsOpen: setIsHelpOpen } = useHelpModal()

  return {
    vimNavigation: vimNav,
    isHelpOpen,
    setIsHelpOpen,
    allShortcuts: [
      ...shortcuts,
      { key: '?', description: 'แสดงคีย์ลัด', category: 'ช่วยเหลือ', action: () => setIsHelpOpen(true) },
      ...(enableVim ? [
        { key: 'j', description: 'เลือกรายการถัดไป', category: 'นำทาง', action: () => {} },
        { key: 'k', description: 'เลือกรายการก่อนหน้า', category: 'นำทาง', action: () => {} },
      ] : []),
    ],
  }
}
