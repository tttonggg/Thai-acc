// Simple event bus for cross-component communication
type EventCallback = (...args: any[]) => void

class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
    return () => this.off(event, callback)
  }

  off(event: string, callback: EventCallback) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) callbacks.splice(index, 1)
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(cb => {
        try {
          cb(...args)
        } catch (err) {
          console.error('[EventBus] Listener error:', err)
        }
      })
    }
  }
}

export const eventBus = new EventBus()

// Event names
export const EVENTS = {
  INVOICE_CREATED: 'invoice:created',
  INVOICE_UPDATED: 'invoice:updated',
  INVOICE_DELETED: 'invoice:deleted',
  INVOICE_VIEW_DETAIL: 'invoice:view-detail',
  RECEIPT_CREATED: 'receipt:created',
  RECEIPT_UPDATED: 'receipt:updated',
  RECEIPT_DELETED: 'receipt:deleted',
  VENDOR_UPDATED: 'vendor:updated',
  CUSTOMER_UPDATED: 'customer:updated',
} as const
