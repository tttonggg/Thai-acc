// ============================================
// Scheduler for Recurring Document Processing
// ใช้ setInterval เพื่อตรวจสอบเอกสารที่ถึงกำหนดทุกชั่วโมง
//
// หมายเหตุ: ใช้งานได้ใน single-instance เท่านั้น
// สำหรับ multi-instance ควรใช้ BullMQ + Redis
// ============================================

import { processRecurringDocuments, getDueDocuments } from './recurring-document-service'

// Scheduler state
let schedulerInterval: NodeJS.Timeout | null = null
let isProcessing = false
let lastCheckAt: Date | null = null
let processedSinceLastCheck = 0

// Configuration
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour in milliseconds
const CHECK_INTERVAL_MINUTES = 60

/**
 * Check and process due recurring documents
 */
async function checkAndProcess(): Promise<void> {
  if (isProcessing) {
    console.log('[Scheduler] Previous processing still in progress, skipping...')
    return
  }

  isProcessing = true
  lastCheckAt = new Date()

  try {
    console.log('[Scheduler] Checking for due recurring documents...')

    const dueDocuments = await getDueDocuments()
    processedSinceLastCheck = dueDocuments.length

    if (dueDocuments.length === 0) {
      console.log('[Scheduler] No documents due for processing')
      return
    }

    console.log(`[Scheduler] Found ${dueDocuments.length} document(s) due for processing`)

    const result = await processRecurringDocuments()

    console.log(
      `[Scheduler] Processing complete: ${result.succeeded} succeeded, ${result.failed} failed`
    )

    if (result.results.length > 0) {
      for (const r of result.results) {
        if (r.error) {
          console.log(`[Scheduler] Document ${r.id} failed: ${r.error}`)
        } else {
          console.log(`[Scheduler] Document ${r.id} created document ${r.documentId}`)
        }
      }
    }
  } catch (error: any) {
    console.error('[Scheduler] Error during processing:', error.message)
  } finally {
    isProcessing = false
  }
}

/**
 * Start the scheduler
 */
export function startScheduler(): void {
  if (schedulerInterval !== null) {
    console.log('[Scheduler] Already running')
    return
  }

  console.log(`[Scheduler] Starting... checking every ${CHECK_INTERVAL_MINUTES} minutes`)

  // Run immediately on start
  checkAndProcess()

  // Then run every hour
  schedulerInterval = setInterval(checkAndProcess, CHECK_INTERVAL_MS)

  console.log('[Scheduler] Started successfully')
}

/**
 * Stop the scheduler
 */
export function stopScheduler(): void {
  if (schedulerInterval === null) {
    console.log('[Scheduler] Not running')
    return
  }

  clearInterval(schedulerInterval)
  schedulerInterval = null
  console.log('[Scheduler] Stopped')
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus(): {
  isRunning: boolean
  lastCheckAt: Date | null
  processedSinceLastCheck: number
  isProcessing: boolean
  checkIntervalMinutes: number
} {
  return {
    isRunning: schedulerInterval !== null,
    lastCheckAt,
    processedSinceLastCheck,
    isProcessing,
    checkIntervalMinutes: CHECK_INTERVAL_MINUTES,
  }
}

/**
 * Trigger a manual check (for testing or admin purposes)
 */
export async function triggerManualCheck(): Promise<{
  dueCount: number
  result: { processed: number; succeeded: number; failed: number }
}> {
  const dueDocuments = await getDueDocuments()

  if (isProcessing) {
    throw new Error('Processing already in progress')
  }

  isProcessing = true

  try {
    const result = await processRecurringDocuments()
    lastCheckAt = new Date()
    processedSinceLastCheck = result.processed

    return {
      dueCount: dueDocuments.length,
      result,
    }
  } finally {
    isProcessing = false
  }
}