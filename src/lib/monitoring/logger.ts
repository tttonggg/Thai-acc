/**
 * Structured Logging Utility
 * Uses Pino for high-performance logging
 */

import pino from 'pino';
import { randomUUID } from 'crypto';

// Log level from environment or default
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const LOG_FORMAT = process.env.LOG_FORMAT || 'json';

// Create base logger configuration
const loggerConfig: pino.LoggerOptions = {
  level: LOG_LEVEL,
  base: {
    pid: process.pid,
    env: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
};

// Pretty print for development
if (LOG_FORMAT === 'pretty' || process.env.NODE_ENV === 'development') {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  };
}

// Create the logger
const baseLogger = pino(loggerConfig);

/**
 * Create a child logger with context
 */
export function createLogger(context: Record<string, unknown> = {}) {
  const correlationId = context.correlationId || randomUUID();

  return baseLogger.child({
    correlationId,
    ...context,
  });
}

/**
 * Get request logger with correlation ID
 */
export function getRequestLogger(req: {
  headers: { [key: string]: string | string[] | undefined };
}) {
  const correlationId =
    req.headers['x-correlation-id'] || req.headers['x-request-id'] || randomUUID();

  return createLogger({ correlationId });
}

// Export the base logger
export const logger = baseLogger;

// Export logging utilities
export const log = {
  info: (msg: string, obj?: Record<string, unknown>) => baseLogger.info(obj, msg),
  error: (msg: string, error?: Error | Record<string, unknown>, obj?: Record<string, unknown>) => {
    if (error instanceof Error) {
      baseLogger.error({ ...obj, error: error.message, stack: error.stack }, msg);
    } else {
      baseLogger.error({ ...obj, ...error }, msg);
    }
  },
  warn: (msg: string, obj?: Record<string, unknown>) => baseLogger.warn(obj, msg),
  debug: (msg: string, obj?: Record<string, unknown>) => baseLogger.debug(obj, msg),
  trace: (msg: string, obj?: Record<string, unknown>) => baseLogger.trace(obj, msg),
};

// Request/Response logging helper
export function logRequest(
  req: { method: string; url: string; headers: Record<string, unknown> },
  res: { statusCode: number; getHeaders: () => Record<string, unknown> },
  startTime: number,
  logger: pino.Logger
) {
  const duration = Date.now() - startTime;

  logger.info(
    {
      type: 'request',
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      referer: req.headers.referer,
    },
    'Request completed'
  );
}
