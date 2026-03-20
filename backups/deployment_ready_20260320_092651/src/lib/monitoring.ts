# ============================================
# Monitoring & Observability Integration
# Sentry, Datadog, and Custom Metrics
# ============================================

import * as Sentry from '@sentry/nextjs';

// ============================================
// Sentry Configuration
// ============================================
export function initSentry() {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION,
      
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Session Replay
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      
      // Error filtering
      beforeSend(event) {
        // Filter out specific errors
        if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
          return null;
        }
        return event;
      },
      
      // Integrations
      integrations: [
        Sentry.httpIntegration(),
      ],
    });
  }
}

// ============================================
// Custom Error Logging
// ============================================
export function logError(error: Error, context?: Record<string, any>) {
  console.error('[ERROR]', error.message, context);
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  
  // Send to custom logging endpoint if configured
  if (process.env.LOG_ENDPOINT) {
    fetch(process.env.LOG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        level: 'error',
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }
}

export function logWarning(message: string, context?: Record<string, any>) {
  console.warn('[WARNING]', message, context);
  
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: context,
    });
  }
}

export function logInfo(message: string, context?: Record<string, any>) {
  if (process.env.LOG_LEVEL === 'info' || process.env.LOG_LEVEL === 'debug') {
    console.info('[INFO]', message, context);
  }
}

// ============================================
// Performance Monitoring
// ============================================
export function startTransaction(name: string, op: string) {
  if (process.env.SENTRY_DSN) {
    return Sentry.startSpan({ name, op }, () => {});
  }
  return null;
}

export function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  
  return fn().finally(() => {
    const duration = performance.now() - start;
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    // Send to metrics endpoint
    if (process.env.METRICS_ENDPOINT) {
      fetch(process.env.METRICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          duration,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {});
    }
  });
}

// ============================================
// Health Check
// ============================================
export async function checkHealth(): Promise<{
  status: 'healthy' | 'unhealthy';
  checks: Record<string, boolean>;
}> {
  const checks: Record<string, boolean> = {
    database: false,
    redis: false,
    memory: false,
  };
  
  // Check memory usage
  const memUsage = process.memoryUsage();
  checks.memory = memUsage.heapUsed / memUsage.heapTotal < 0.9;
  
  // Database check would be implemented here
  // checks.database = await checkDatabase();
  
  // Redis check would be implemented here
  // checks.redis = await checkRedis();
  
  const allHealthy = Object.values(checks).every(Boolean);
  
  return {
    status: allHealthy ? 'healthy' : 'unhealthy',
    checks,
  };
}

// ============================================
// Business Metrics
// ============================================
export function trackBusinessEvent(
  eventName: string,
  properties?: Record<string, any>
) {
  // Send to analytics/metrics service
  if (process.env.ANALYTICS_ENDPOINT) {
    fetch(process.env.ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: eventName,
        properties,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }
}

// Track invoice creation
export function trackInvoiceCreated(amount: number, currency: string) {
  trackBusinessEvent('invoice_created', { amount, currency });
}

// Track user login
export function trackUserLogin(userId: string, method: string) {
  trackBusinessEvent('user_login', { userId, method });
}
