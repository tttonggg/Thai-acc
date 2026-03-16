# ============================================
# Sentry Server Configuration
# ============================================

import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV,
  
  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  
  // Debug mode
  debug: process.env.NODE_ENV === 'development',
  
  // Performance monitoring - lower sample rate on server
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // Server-side integrations
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
  ],
  
  // Before send hook
  beforeSend(event) {
    // Filter sensitive data from server events
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.cookie;
      delete event.request.headers?.authorization;
    }
    
    return event;
  },
});
