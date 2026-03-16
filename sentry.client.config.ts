# ============================================
# Sentry Client Configuration
# ============================================

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Enable debug mode in development
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Session replay configuration
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here
      maskAllText: true,
      blockAllMedia: true,
    }),
    Sentry.feedbackIntegration({
      // Additional SDK configuration goes in here
      colorScheme: 'system',
    }),
  ],
  
  // Before send hook to filter sensitive data
  beforeSend(event) {
    // Filter out PII
    if (event.user) {
      delete event.user.email;
      delete event.user.ip_address;
    }
    
    // Filter out specific errors
    if (event.exception?.values?.[0]?.type === 'ChunkLoadError') {
      return null;
    }
    
    return event;
  },
  
  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    /^Non-Error promise rejection captured with value: Object Not Found Matching Id/,
    /^Non-Error promise rejection captured with value: Not Allowed/,
    // Network errors
    'Network Error',
    'Failed to fetch',
    'AbortError',
  ],
  
  // Deny URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
});
