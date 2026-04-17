// ============================================
// Scheduler Initialization
// เริ่มต้น scheduler เมื่อแอป start
// ============================================

import { startScheduler, getSchedulerStatus } from './scheduler'

// Flag to ensure we only initialize once
let initialized = false

/**
 * Initialize the scheduler
 * Call this function when the app starts
 */
export function initializeScheduler(): void {
  if (initialized) {
    console.log('[SchedulerInit] Already initialized')
    return
  }

  initialized = true

  // Start the scheduler
  startScheduler()

  const status = getSchedulerStatus()
  console.log(`[SchedulerInit] Initialized - running: ${status.isRunning}, check interval: ${status.checkIntervalMinutes} minutes`)

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('[SchedulerInit] SIGTERM received, cleaning up...')
    const { stopScheduler } = require('./scheduler')
    stopScheduler()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('[SchedulerInit] SIGINT received, cleaning up...')
    const { stopScheduler } = require('./scheduler')
    stopScheduler()
    process.exit(0)
  })
}

// Auto-initialize in non-test environments
if (process.env.NODE_ENV !== 'test') {
  initializeScheduler()
}

export { getSchedulerStatus }