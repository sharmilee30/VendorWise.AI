/**
 * Browser-side logger.
 *
 * - warn/error always print.
 * - debug/info print only in debug mode: automatically in `npm run dev`, or in any build by
 *   opening the app with `?debug` once, or running `localStorage.vendorwise_debug = '1'`
 *   in the console (remove the key / use `?nodebug` to turn it off).
 * - Output is prefixed `[VendorWise:scope]` so it is easy to filter in DevTools.
 */

const DEBUG_KEY = 'vendorwise_debug';

function detectDebug(): boolean {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('nodebug')) {
      localStorage.removeItem(DEBUG_KEY);
      return false;
    }
    if (params.has('debug')) localStorage.setItem(DEBUG_KEY, '1');
    return import.meta.env?.DEV || localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return Boolean(import.meta.env?.DEV);
  }
}

export const debugEnabled = detectDebug();

export interface ClientLogger {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
}

export function createLogger(scope: string): ClientLogger {
  const prefix = `[VendorWise:${scope}]`;
  const emit =
    (fn: (...args: unknown[]) => void, always: boolean) =>
    (message: string, data?: unknown) => {
      if (!always && !debugEnabled) return;
      if (data === undefined) fn(prefix, message);
      else fn(prefix, message, data);
    };
  return {
    debug: emit(console.debug, false),
    info: emit(console.info, false),
    warn: emit(console.warn, true),
    error: emit(console.error, true),
  };
}

/** Log errors that escape React (event handlers, timers, rejected promises). */
export function installGlobalErrorLogging(): void {
  const log = createLogger('global');
  window.addEventListener('error', (e) => {
    log.error('Uncaught error', { message: e.message, source: `${e.filename}:${e.lineno}:${e.colno}`, error: e.error });
  });
  window.addEventListener('unhandledrejection', (e) => {
    log.error('Unhandled promise rejection', e.reason);
  });
  if (debugEnabled) log.info('Debug logging is ON (use ?nodebug to turn off)');
}
