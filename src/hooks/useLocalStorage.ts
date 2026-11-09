import { useCallback, useEffect, useState } from 'react'
import { loadJSON, saveJSON, storage } from '../lib/storage'

/**
 * useState backed by localStorage. Reads lazily on mount (survives private-mode
 * via the in-memory fallback), persists on every change, and syncs across tabs.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T,
) {
  const [value, setValue] = useState<T>(() => loadJSON(key, initialValue, validate))

  useEffect(() => {
    saveJSON(key, value)
  }, [key, value])

  // Cross-tab synchronisation.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== key) return
      if (event.newValue === null) {
        setValue(initialValue)
        return
      }
      try {
        const parsed: unknown = JSON.parse(event.newValue)
        if (validate && !validate(parsed)) return
        setValue(parsed as T)
      } catch {
        // Malformed payload from another tab — ignore.
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const reset = useCallback(() => {
    storage.remove(key)
    setValue(initialValue)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return [value, setValue, reset] as const
}
