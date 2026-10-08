import { createLogger } from './logger';

const log = createLogger('storage');

/**
 * Read JSON from localStorage without ever throwing.
 * Missing, unparsable or wrongly-shaped data falls back to `fallback` and logs why,
 * so one corrupted entry can't crash the app on every load.
 */
export function loadJson<T>(
  key: string,
  fallback: T,
  isValid: (value: unknown) => boolean = () => true
): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch (err) {
    log.warn(`localStorage unavailable; using defaults for "${key}"`, err);
    return fallback;
  }
  if (raw === null) return fallback;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (isValid(parsed)) return parsed as T;
    log.warn(`Saved "${key}" has an unexpected shape; using defaults`, { sample: raw.slice(0, 200) });
  } catch (err) {
    log.warn(`Saved "${key}" is not valid JSON; using defaults`, { sample: raw.slice(0, 200), err });
  }
  return fallback;
}

/** Write JSON to localStorage; failures (quota, private mode) are logged, never thrown. */
export function saveJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    log.warn(`Could not save "${key}" (storage full or blocked)`, err);
  }
}

// --- Shape checks for the data this app persists --------------------------------------

const CRITERIA = ['cost', 'quality', 'delivery', 'reliability', 'sustainability'];

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const hasCriteria = (v: unknown): boolean =>
  isObj(v) && CRITERIA.every((k) => typeof v[k] === 'number' && Number.isFinite(v[k] as number));

export const isWeights = (v: unknown): boolean => hasCriteria(v);

export const isVendorList = (v: unknown): boolean =>
  Array.isArray(v) &&
  v.every((x) => isObj(x) && typeof x.id === 'string' && typeof x.name === 'string' && hasCriteria(x.criteria));

export const isSnapshotList = (v: unknown): boolean =>
  Array.isArray(v) && v.every((x) => isObj(x) && typeof x.id === 'string' && hasCriteria(x.weights));

export const isOneOf =
  <T extends string>(allowed: readonly T[]) =>
  (v: unknown): v is T =>
    typeof v === 'string' && (allowed as readonly string[]).includes(v);
