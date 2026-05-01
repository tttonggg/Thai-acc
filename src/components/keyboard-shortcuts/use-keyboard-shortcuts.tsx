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
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        // Allow Escape key even in inputs
        if (event.key !== 'Escape') {
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

// Common shortcuts for the ERP
export const commonShortcuts = {
  newInvoice: { key: 'n', ctrl: true, description: 'สร้างใบกำกับภาษีใหม่' },
  save: { key: 's', ctrl: true, description: 'บันทึก' },
  print: { key: 'p', ctrl: true, description: 'พิมพ์' },
  close: { key: 'Escape', description: 'ปิด/ยกเลิก' },
  search: { key: 'k', ctrl: true, description: 'ค้นหา' },
  help: { key: '?', description: 'แสดงคีย์ลัด' },
}

// Hook for arrow key navigation in tables
export function useTableNavigation(itemCount: number, options?: {
  onSelect?: (index: number) => void
  onActivate?: (index: number) => void
}) {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setFocusedIndex(prev => {
            const next = Math.min(prev + 1, itemCount - 1)
            options?.onSelect?.(next)
            return next
          })
          break
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
        case 'Home':
          event.preventDefault()
          setFocusedIndex(0)
          options?.onSelect?.(0)
          break
        case 'End':
          event.preventDefault()
          setFocusedIndex(itemCount - 1)
          options?.onSelect?.(itemCount - 1)
          break
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    return () => container.removeEventListener('keydown', handleKeyDown)
  }, [itemCount, focusedIndex, options])

  return { focusedIndex, setFocusedIndex, containerRef }
}

export function KeyboardShortcutsHelp({
  isOpen,
  onClose,
  shortcuts,
}: {
  isOpen: boolean
  onClose: () => void
  shortcuts: KeyboardShortcut[]
}) {
  if (!isOpen) return null

  // Group shortcuts by category
  const grouped = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'ทั่วไป'
    if (!acc[category]) acc[category] = []
    acc[category].push(shortcut)
    return acc
  }, {} as Record<string, KeyboardShortcut[]>)

  const formatKey = (shortcut: KeyboardShortcut) => {
    const keys: string[] = []
    if (shortcut.ctrl) keys.push('Ctrl')
    if (shortcut.alt) keys.push('Alt')
    if (shortcut.shift) keys.push('Shift')
    if (shortcut.meta) keys.push('⌘')
    keys.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key)
    return keys.join(' + ')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">คีย์ลัดแป้นพิมพ์</h2>
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {items.map((shortcut, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono border">
                        {formatKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            >
              ปิด (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
