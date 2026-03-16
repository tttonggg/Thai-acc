/**
 * Next.js Instrumentation
 * Initializes monitoring and observability tools
 */

import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Initialize Sentry for error tracking
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      
      // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      // Profiles sample rate
      profilesSampleRate: 0.1,
      
      // Replay session sample rate
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      
      // integrations
      integrations: [
        Sentry.httpIntegration({
          breadcrumbs: true,
        }),
      ],
      
      // Before send hook to filter sensitive data
      beforeSend(event) {
        // Remove sensitive information from events
        if (event.request) {
          delete event.request.cookies;
          delete event.request.headers?.cookie;
          delete event.request.headers?.authorization;
        }
        return event;
      },
      
      // Ignore specific errors
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'Failed to fetch',
      ],
    });
  }

  // Initialize OpenTelemetry if configured
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    
    const sdk = new NodeSDK({
      traceExporter: new OTLPTraceExporter(),
      instrumentations: [getNodeAutoInstrumentations()],
    });
    
    sdk.start();
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      sdk.shutdown()
        .then(() => console.log('OpenTelemetry SDK terminated'))
        .catch((error) => console.error('Error terminating OpenTelemetry SDK:', error))
        .finally(() => process.exit(0));
    });
  }
}
