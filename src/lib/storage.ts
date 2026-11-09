/**
 * Resilient localStorage wrapper.
 *
 * - Falls back to an in-memory store when localStorage is unavailable
 *   (private browsing, disabled cookies, SSR, or quota errors).
 * - Never throws on read/write; JSON corruption returns the fallback.
 * - All keys are namespaced under `studysentry.`.
 */

const MEMORY_FALLBACK = new Map<string, string>()

export const STORAGE_KEYS = {
  tasks: 'studysentry.tasks.v1',
  activity: 'studysentry.activity.v1',
  lastNagDay: 'studysentry.lastNagDay.v1',
  installDismissed: 'studysentry.installDismissed.v1',
} as const

function domStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null
    return window.localStorage
  } catch {
    // Accessing window.localStorage can itself throw (e.g. blocked cookies).
    return null
  }
}

function rawGet(key: string): string | null {
  const store = domStorage()
  if (store) {
    try {
      const value = store.getItem(key)
      if (value !== null) return value
    } catch {
      // fall through to memory
    }
  }
  return MEMORY_FALLBACK.get(key) ?? null
}

/** @returns true when the value reached durable DOM storage. */
function rawSet(key: string, value: string): boolean {
  const store = domStorage()
  if (store) {
    try {
      store.setItem(key, value)
      MEMORY_FALLBACK.delete(key) // DOM is source of truth now
      return true
    } catch {
      // Quota exceeded or blocked — persist in memory instead.
    }
  }
  MEMORY_FALLBACK.set(key, value)
  return false
}

function rawRemove(key: string): void {
  const store = domStorage()
  if (store) {
    try {
      store.removeItem(key)
    } catch {
      // ignore
    }
  }
  MEMORY_FALLBACK.delete(key)
}

export const storage = {
  get: rawGet,
  set: rawSet,
  remove: rawRemove,
}

/**
 * Load and JSON-parse a key. Returns `fallback` when missing, unparsable,
 * or rejected by `validate` (corrupt data never crashes the app).
 */
export function loadJSON<T>(
  key: string,
  fallback: T,
  validate?: (value: unknown) => value is T,
): T {
  const raw = rawGet(key)
  if (raw === null) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    if (validate && !validate(parsed)) {
      console.warn(`[storage] "${key}" failed validation; using fallback.`)
      return fallback
    }
    return parsed as T
  } catch (error) {
    console.warn(`[storage] "${key}" contained invalid JSON; using fallback.`, error)
    return fallback
  }
}

/** @returns true when written to durable storage, false when kept in memory only. */
export function saveJSON(key: string, value: unknown): boolean {
  try {
    return rawSet(key, JSON.stringify(value))
  } catch (error) {
    // Non-serializable values should never crash the app either.
    console.warn(`[storage] Could not serialize "${key}".`, error)
    return false
  }
}

/** Diagnostic helper: is durable DOM persistence available right now? */
export function isDurableStorageAvailable(): boolean {
  const store = domStorage()
  if (!store) return false
  try {
    const probe = 'studysentry.__probe__'
    store.setItem(probe, '1')
    store.removeItem(probe)
    return true
  } catch {
    return false
  }
}
