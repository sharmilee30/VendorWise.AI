/**
 * Minimal leveled logger.
 *
 * - Set LOG_LEVEL=debug|info|warn|error (default: info). Use `debug` when troubleshooting.
 * - Every line is `timestamp LEVEL [scope] message {meta}`; request-scoped lines carry a request id.
 * - Anything that looks like a Google API key, or equals the configured GEMINI_API_KEY, is redacted
 *   before it reaches the console, so logs are safe to paste into a bug report.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<Level, number> = { debug: 0, info: 1, warn: 2, error: 3 };

function currentLevel(): Level {
  const raw = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return raw in ORDER ? (raw as Level) : 'info';
}

export function redact(text: string): string {
  let out = text.replace(/AIza[0-9A-Za-z_-]{20,}/g, '[REDACTED_KEY]');
  const key = process.env.GEMINI_API_KEY?.trim();
  if (key && key.length >= 8) {
    out = out.split(key).join('[REDACTED_KEY]');
  }
  return out;
}

/** Reduce an unknown thrown value to a small, log-safe object (no stack of secrets, no giant SDK dumps). */
export function describeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    const e = err as Error & { status?: number; code?: string | number };
    return {
      name: e.name,
      message: redact(e.message).slice(0, 500),
      ...(e.status !== undefined && { status: e.status }),
      ...(e.code !== undefined && { code: e.code }),
    };
  }
  return { message: redact(String(err)).slice(0, 500) };
}

function write(level: Level, scope: string, message: string, meta?: Record<string, unknown>) {
  if (ORDER[level] < ORDER[currentLevel()]) return;
  const metaText = meta && Object.keys(meta).length ? ' ' + JSON.stringify(meta) : '';
  const line = redact(
    `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} [${scope}] ${message}${metaText}`
  );
  (level === 'error' ? console.error : level === 'warn' ? console.warn : console.log)(line);
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(suffix: string): Logger;
}

export function createLogger(scope: string): Logger {
  return {
    debug: (m, meta) => write('debug', scope, m, meta),
    info: (m, meta) => write('info', scope, m, meta),
    warn: (m, meta) => write('warn', scope, m, meta),
    error: (m, meta) => write('error', scope, m, meta),
    child: (suffix) => createLogger(`${scope}:${suffix}`),
  };
}
