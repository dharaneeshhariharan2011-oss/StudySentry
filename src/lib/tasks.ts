import type { Priority, Subject, Task, TaskFilter } from '../types'
import { addDaysISO, isoTimestampToDay, lastNDays, toISODay, todayISO } from './date'

/** Sort weight: high priority first. */
export const PRIORITY_WEIGHT: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
}

/**
 * Canonical ordering:
 *  1. Pending tasks before completed ones.
 *  2. Pending: priority (high → low), then due date (soonest first), then creation order.
 *  3. Completed: most recently finished first.
 */
export function compareTasks(a: Task, b: Task): number {
  if (a.completed !== b.completed) return a.completed ? 1 : -1

  if (a.completed && b.completed) {
    return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
  }

  const byPriority = PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]
  if (byPriority !== 0) return byPriority

  const byDue = a.dueDate.localeCompare(b.dueDate)
  if (byDue !== 0) return byDue

  return a.createdAt.localeCompare(b.createdAt)
}

export function sortTasks(tasks: readonly Task[]): Task[] {
  return [...tasks].sort(compareTasks)
}

export function filterTasks(tasks: readonly Task[], filter: TaskFilter): Task[] {
  switch (filter) {
    case 'all':
      return [...tasks]
    case 'pending':
      return tasks.filter((t) => !t.completed)
    case 'completed':
      return tasks.filter((t) => t.completed)
    default:
      return tasks.filter((t) => t.subject === (filter as Subject))
  }
}

export type TodayScope = 'due-now' | 'created-today' | 'empty'

export interface TodayProgress {
  /** How many tasks count toward "today's work". */
  total: number
  completed: number
  /** 0–100. 100 when there is nothing outstanding. */
  percent: number
  /** Which bucket of tasks defined the scope. */
  scope: TodayScope
  /** Minutes estimated for the still-pending tasks in scope. */
  minutesRemaining: number
}

/**
 * "Today's work" = every task due on or before today (overdue + due today) —
 * the stuff that needs your attention right now. If nothing qualifies, fall
 * back to tasks created today so brand-new users still get a progress meter.
 */
export function computeTodayProgress(
  tasks: readonly Task[],
  today: string = todayISO(),
): TodayProgress {
  let scope = tasks.filter((t) => t.dueDate <= today)
  let scopeKind: TodayScope = 'due-now'

  if (scope.length === 0) {
    scope = tasks.filter((t) => isoTimestampToDay(t.createdAt) === today)
    scopeKind = 'created-today'
  }

  if (scope.length === 0) {
    return { total: 0, completed: 0, percent: 100, scope: 'empty', minutesRemaining: 0 }
  }

  const completed = scope.filter((t) => t.completed).length
  const minutesRemaining = scope
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + Math.max(0, t.estimatedMinutes || 0), 0)
  const percent = Math.round((completed / scope.length) * 100)

  return { total: scope.length, completed, percent, scope: scopeKind, minutesRemaining }
}

/** Lists of completed task ids due today — used for the all-done celebration. */
export function isAllDailyWorkDone(
  tasks: readonly Task[],
  today: string = todayISO(),
): boolean {
  const p = computeTodayProgress(tasks, today)
  return p.total > 0 && p.completed === p.total
}

function normalizeDays(days: readonly string[]): string[] {
  return [...new Set(days.filter((d) => typeof d === 'string' && d.length === 10))].sort()
}

/**
 * Consecutive-day streak ending today. If nothing was logged yet today, the
 * streak is still alive as long as yesterday had activity (the day hasn't
 * failed yet) — it just doesn't grow until you log again.
 */
export function computeStreak(activityDays: readonly string[], today: string = todayISO()): number {
  const set = new Set(normalizeDays(activityDays))
  let cursor = today
  if (!set.has(cursor)) cursor = addDaysISO(cursor, -1)

  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor = addDaysISO(cursor, -1)
  }
  return streak
}

/** Longest consecutive-day run anywhere in the activity history. */
export function computeBestStreak(activityDays: readonly string[]): number {
  const days = normalizeDays(activityDays)
  if (days.length === 0) return 0

  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i += 1) {
    const prev = days[i - 1]
    const curr = days[i]
    // Compare via serial diff to be DST-safe.
    const gap = Math.round(
      (new Date(`${curr}T00:00:00`).getTime() - new Date(`${prev}T00:00:00`).getTime()) /
        86_400_000,
    )
    if (gap === 1) {
      run += 1
      if (run > best) best = run
    } else {
      run = 1
    }
  }
  return best
}

export interface DayActivity {
  iso: string
  count: number
}

/** Tasks completed per day for the last 7 days (oldest first). */
export function weeklyCompletion(
  tasks: readonly Task[],
  today: string = todayISO(),
): DayActivity[] {
  const days = lastNDays(7, today)
  const counts = new Map<string, number>(days.map((d) => [d, 0]))
  for (const task of tasks) {
    if (!task.completedAt) continue
    const day = isoTimestampToDay(task.completedAt)
    if (day && counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }
  return days.map((iso) => ({ iso, count: counts.get(iso) ?? 0 }))
}

export interface SubjectSummary {
  subject: Subject
  total: number
  completed: number
  minutes: number
}

/** Per-subject roll-up, only subjects that appear in the data. Sorted by total desc. */
export function subjectBreakdown(tasks: readonly Task[]): SubjectSummary[] {
  const map = new Map<Subject, SubjectSummary>()
  for (const task of tasks) {
    const entry =
      map.get(task.subject) ??
      { subject: task.subject, total: 0, completed: 0, minutes: 0 }
    entry.total += 1
    entry.minutes += Math.max(0, task.estimatedMinutes || 0)
    if (task.completed) entry.completed += 1
    map.set(task.subject, entry)
  }
  return [...map.values()].sort((a, b) => b.total - a.total)
}

/** Total focused minutes (estimated) across all completed tasks. */
export function completedMinutes(tasks: readonly Task[]): number {
  return tasks
    .filter((t) => t.completed)
    .reduce((sum, t) => sum + Math.max(0, t.estimatedMinutes || 0), 0)
}

/** How many tasks were completed today (local day). */
export function completedToday(tasks: readonly Task[], today: string = todayISO()): number {
  return tasks.filter(
    (t) => t.completedAt && isoTimestampToDay(t.completedAt) === today,
  ).length
}

/** Overdue & still pending. */
export function overdueCount(tasks: readonly Task[], today: string = todayISO()): number {
  return tasks.filter((t) => !t.completed && t.dueDate < today).length
}

/** Validate unknown persisted data before trusting it. */
export function isTaskArray(value: unknown): value is Task[] {
  if (!Array.isArray(value)) return false
  return value.every((t) => {
    if (typeof t !== 'object' || t === null) return false
    const task = t as Record<string, unknown>
    return (
      typeof task.id === 'string' &&
      typeof task.title === 'string' &&
      typeof task.subject === 'string' &&
      typeof task.priority === 'string' &&
      typeof task.dueDate === 'string' &&
      typeof task.estimatedMinutes === 'number' &&
      typeof task.completed === 'boolean' &&
      typeof task.createdAt === 'string'
    )
  })
}

/** Validate persisted activity-day arrays. */
export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

/** Unique id that works everywhere, including non-secure contexts. */
export function createTaskId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export { todayISO, toISODay }
