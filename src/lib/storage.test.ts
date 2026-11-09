import { describe, expect, it } from 'vitest'
import { isDurableStorageAvailable, loadJSON, saveJSON, STORAGE_KEYS, storage } from './storage'

describe('storage get/set roundtrip', () => {
  it('persists strings', () => {
    expect(storage.set('studysentry.test', 'hello')).toBe(true)
    expect(storage.get('studysentry.test')).toBe('hello')
  })

  it('returns null for missing keys', () => {
    expect(storage.get('studysentry.definitely-missing')).toBeNull()
  })

  it('removes keys', () => {
    storage.set('studysentry.test-remove', 'x')
    storage.remove('studysentry.test-remove')
    expect(storage.get('studysentry.test-remove')).toBeNull()
  })
})

describe('saveJSON / loadJSON', () => {
  it('roundtrips objects and arrays', () => {
    const tasks = [{ id: '1', title: 'Read chapter 4' }]
    expect(saveJSON(STORAGE_KEYS.tasks, tasks)).toBe(true)
    expect(loadJSON(STORAGE_KEYS.tasks, [])).toEqual(tasks)
  })

  it('returns the fallback for missing keys', () => {
    expect(loadJSON('studysentry.missing', { ok: true })).toEqual({ ok: true })
  })

  it('returns the fallback for corrupt JSON instead of throwing', () => {
    window.localStorage.setItem('studysentry.corrupt', '{not json!!')
    expect(loadJSON('studysentry.corrupt', 'fallback')).toBe('fallback')
  })

  it('returns the fallback when validation rejects the payload', () => {
    window.localStorage.setItem('studysentry.invalid', JSON.stringify({ unexpected: true }))
    const isArray = (v: unknown): v is unknown[] => Array.isArray(v)
    expect(loadJSON('studysentry.invalid', ['safe'], isArray)).toEqual(['safe'])
  })

  it('falls back to in-memory storage when durable writes fail (quota/private mode)', () => {
    const setSpy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      })
    const getSpy = vi
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new DOMException('blocked', 'SecurityError')
      })

    expect(saveJSON('studysentry.memory-only', { persisted: true })).toBe(false)
    expect(loadJSON('studysentry.memory-only', null)).toEqual({ persisted: true })

    setSpy.mockRestore()
    getSpy.mockRestore()
  })

  it('never throws even for non-serializable values', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(() => saveJSON('studysentry.circular', circular)).not.toThrow()
    expect(saveJSON('studysentry.circular', circular)).toBe(false)
  })
})

describe('isDurableStorageAvailable', () => {
  it('reports true in a normal environment', () => {
    expect(isDurableStorageAvailable()).toBe(true)
  })
})
