import { describe, expect, it } from 'vitest'
import {
  addDaysISO,
  diffDays,
  formatDueLabel,
  isISODay,
  isoTimestampToDay,
  lastNDays,
  parseISODay,
  toISODay,
} from './date'

describe('toISODay / parseISODay roundtrip', () => {
  it('formats a local date as YYYY-MM-DD with zero padding', () => {
    expect(toISODay(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(toISODay(new Date(2026, 10, 9))).toBe('2026-11-09')
  })

  it('parses back to the same local calendar day', () => {
    const iso = '2026-11-09'
    expect(toISODay(parseISODay(iso))).toBe(iso)
  })
})

describe('isISODay', () => {
  it('accepts real calendar days', () => {
    expect(isISODay('2026-11-09')).toBe(true)
    expect(isISODay('2024-02-29')).toBe(true) // leap day
  })

  it('rejects impossible dates', () => {
    expect(isISODay('2024-02-30')).toBe(false) // rolls over → rejected
    expect(isISODay('2024-13-01')).toBe(false)
    expect(isISODay('2023-02-29')).toBe(false) // not a leap year
  })

  it('rejects malformed input', () => {
    expect(isISODay('2026-1-9')).toBe(false)
    expect(isISODay('not-a-date')).toBe(false)
    expect(isISODay('')).toBe(false)
    expect(isISODay(42)).toBe(false)
    expect(isISODay(null)).toBe(false)
    expect(isISODay(undefined)).toBe(false)
  })
})

describe('addDaysISO', () => {
  it('adds and subtracts days across month boundaries', () => {
    expect(addDaysISO('2026-11-09', 1)).toBe('2026-11-10')
    expect(addDaysISO('2026-11-09', -9)).toBe('2026-10-31')
    expect(addDaysISO('2026-12-31', 1)).toBe('2027-01-01')
  })
})

describe('diffDays', () => {
  it('computes whole-day differences', () => {
    expect(diffDays('2026-11-09', '2026-11-09')).toBe(0)
    expect(diffDays('2026-11-10', '2026-11-09')).toBe(1)
    expect(diffDays('2026-11-08', '2026-11-09')).toBe(-1)
    expect(diffDays('2026-12-01', '2026-11-01')).toBe(30)
  })
})

describe('formatDueLabel', () => {
  const today = '2026-11-09'

  it('flags days in the past as overdue', () => {
    expect(formatDueLabel('2026-11-08', today)).toEqual({ label: 'Overdue · 1 day', tone: 'overdue' })
    expect(formatDueLabel('2026-11-01', today)).toEqual({ label: 'Overdue · 8 days', tone: 'overdue' })
  })

  it('flags today and tomorrow specially', () => {
    expect(formatDueLabel('2026-11-09', today)).toEqual({ label: 'Due today', tone: 'today' })
    expect(formatDueLabel('2026-11-10', today)).toEqual({ label: 'Due tomorrow', tone: 'tomorrow' })
  })

  it('formats further-out dates with month and day', () => {
    const { label, tone } = formatDueLabel('2026-11-21', today)
    expect(tone).toBe('future')
    expect(label).toContain('Nov')
    expect(label).toContain('21')
  })
})

describe('lastNDays', () => {
  it('returns the last 7 days oldest-first ending today', () => {
    const days = lastNDays(7, '2026-11-09')
    expect(days).toHaveLength(7)
    expect(days[0]).toBe('2026-11-03')
    expect(days[6]).toBe('2026-11-09')
  })

  it('handles month boundaries', () => {
    const days = lastNDays(3, '2026-11-01')
    expect(days).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
  })
})

describe('isoTimestampToDay', () => {
  it('converts an ISO timestamp to its local calendar day', () => {
    const local = new Date(2026, 10, 9, 15, 30)
    expect(isoTimestampToDay(local.toISOString())).toBe('2026-11-09')
  })

  it('returns null for garbage input', () => {
    expect(isoTimestampToDay('not-a-timestamp')).toBeNull()
  })
})
