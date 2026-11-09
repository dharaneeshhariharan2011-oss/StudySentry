/** Local calendar-day helpers. All "day" values are YYYY-MM-DD strings in local time. */

export function toISODay(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayISO(now: Date = new Date()): string {
  return toISODay(now)
}

const ISO_DAY_RE = /^\d{4}-\d{2}-\d{2}$/

export function isISODay(s: unknown): s is string {
  if (typeof s !== 'string' || !ISO_DAY_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00`)
  return !Number.isNaN(d.getTime()) && toISODay(d) === s
}

export function parseISODay(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function addDaysISO(iso: string, days: number): string {
  const d = parseISODay(iso)
  d.setDate(d.getDate() + days)
  return toISODay(d)
}

const MS_PER_DAY = 86_400_000

/** Whole days from `fromISO` to `toISO` (positive when toISO is later). */
export function diffDays(toISO: string, fromISO: string): number {
  return Math.round((parseISODay(toISO).getTime() - parseISODay(fromISO).getTime()) / MS_PER_DAY)
}

export type DueTone = 'overdue' | 'today' | 'tomorrow' | 'future'

export interface DueLabel {
  label: string
  tone: DueTone
}

export function formatDueLabel(dueISO: string, today: string = todayISO()): DueLabel {
  const delta = diffDays(dueISO, today)
  if (delta < 0) {
    const overdueDays = -delta
    return {
      label: overdueDays === 1 ? 'Overdue · 1 day' : `Overdue · ${overdueDays} days`,
      tone: 'overdue',
    }
  }
  if (delta === 0) return { label: 'Due today', tone: 'today' }
  if (delta === 1) return { label: 'Due tomorrow', tone: 'tomorrow' }
  const formatted = parseISODay(dueISO).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return { label: `Due ${formatted}`, tone: 'future' }
}

/** The last 7 calendar days ending on `today`, oldest first. */
export function lastNDays(n: number, today: string = todayISO()): string[] {
  const days: string[] = []
  for (let i = n - 1; i >= 0; i -= 1) days.push(addDaysISO(today, -i))
  return days
}

export function weekdayShort(iso: string): string {
  return parseISODay(iso).toLocaleDateString('en-US', { weekday: 'short' })
}

export function monthDayShort(iso: string): string {
  return parseISODay(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Convert an ISO timestamp to its local YYYY-MM-DD day. */
export function isoTimestampToDay(isoTimestamp: string): string | null {
  const d = new Date(isoTimestamp)
  if (Number.isNaN(d.getTime())) return null
  return toISODay(d)
}
