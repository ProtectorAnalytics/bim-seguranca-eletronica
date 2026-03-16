/**
 * Production-safe logger.
 * In development: logs everything to console.
 * In production: suppresses debug/log, keeps warn/error.
 * Ready for Sentry integration (TODO: add DSN).
 */
const isDev = import.meta.env.DEV;

const logger = {
  debug: (...args) => { if (isDev) console.debug('[BIM]', ...args); },
  log:   (...args) => { if (isDev) console.log('[BIM]', ...args); },
  info:  (...args) => { if (isDev) console.info('[BIM]', ...args); },
  warn:  (...args) => { console.warn('[BIM]', ...args); },
  error: (...args) => {
    console.error('[BIM]', ...args);
    // TODO: Sentry.captureException(args[0] instanceof Error ? args[0] : new Error(String(args[0])));
  },
};

export default logger;
