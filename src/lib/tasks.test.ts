import { describe, expect, it } from 'vitest'
import type { Task } from '../types'
import {
  completedMinutes,
  completedToday,
  computeBestStreak,
  computeStreak,
  computeTodayProgress,
  filterTasks,
  isTaskArray,
  overdueCount,
  sortTasks,
  subjectBreakdown,
  weeklyCompletion,
} from './tasks'
import { todayISO } from './date'

const TODAY = todayISO()

let counter = 0
function makeTask(overrides: Partial<Task> = {}): Task {
  counter += 1
  return {
    id: `task-${counter}`,
    title: `Task ${counter}`,
    subject: 'Math',
    estimatedMinutes: 30,
    priority: 'medium',
    dueDate: TODAY,
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
    ...overrides,
  }
}

describe('sortTasks', () => {
  it('orders by priority first: high → medium → low', () => {
    const low = makeTask({ priority: 'low' })
    const high = makeTask({ priority: 'high' })
    const medium = makeTask({ priority: 'medium' })
    const sorted = sortTasks([low, medium, high])
    expect(sorted.map((t) => t.priority)).toEqual(['high', 'medium', 'low'])
  })

  it('breaks priority ties by due date (soonest first)', () => {
    const later = makeTask({ priority: 'high', dueDate: '2026-12-20' })
    const sooner = makeTask({ priority: 'high', dueDate: '2026-11-20' })
    const sorted = sortTasks([later, sooner])
    expect(sorted[0].dueDate).toBe('2026-11-20')
  })

  it('places completed tasks last, most recently completed first', () => {
    const doneOlder = makeTask({ completed: true, completedAt: '2026-11-08T10:00:00.000Z' })
    const doneNewer = makeTask({ completed: true, completedAt: '2026-11-09T10:00:00.000Z' })
    const pending = makeTask()
    const sorted = sortTasks([doneOlder, pending, doneNewer])
    expect(sorted.map((t) => t.id)).toEqual([pending.id, doneNewer.id, doneOlder.id])
  })

  it('does not mutate the input array', () => {
    const a = makeTask({ priority: 'low' })
    const b = makeTask({ priority: 'high' })
    const input = [a, b]
    sortTasks(input)
    expect(input[0].priority).toBe('low')
  })
})

describe('filterTasks', () => {
  const pendingMath = makeTask({ subject: 'Math' })
  const doneMath = makeTask({ subject: 'Math', completed: true, completedAt: new Date().toISOString() })
  const pendingHistory = makeTask({ subject: 'History' })
  const all = [pendingMath, doneMath, pendingHistory]

  it('splits pending and completed', () => {
    expect(filterTasks(all, 'pending').map((t) => t.id)).toEqual([pendingMath.id, pendingHistory.id])
    expect(filterTasks(all, 'completed').map((t) => t.id)).toEqual([doneMath.id])
  })

  it('filters by subject', () => {
    expect(filterTasks(all, 'Math')).toHaveLength(2)
    expect(filterTasks(all, 'History')).toEqual([pendingHistory])
    expect(filterTasks(all, 'English')).toHaveLength(0)
  })

  it('returns everything for "all"', () => {
    expect(filterTasks(all, 'all')).toHaveLength(3)
  })
})

describe('computeTodayProgress', () => {
  it('scores tasks due on or before today', () => {
    const tasks = [
      makeTask({ dueDate: '2020-01-01' }), // overdue — counts toward today
      makeTask({ dueDate: TODAY, completed: true, completedAt: new Date().toISOString() }),
      makeTask({ dueDate: '2999-01-01' }), // future — ignored
    ]
    const p = computeTodayProgress(tasks, TODAY)
    expect(p.total).toBe(2)
    expect(p.completed).toBe(1)
    expect(p.percent).toBe(50)
    expect(p.scope).toBe('due-now')
  })

  it('sums remaining minutes only for pending tasks in scope', () => {
    const tasks = [
      makeTask({ estimatedMinutes: 45 }),
      makeTask({ estimatedMinutes: 20, completed: true, completedAt: new Date().toISOString() }),
      makeTask({ estimatedMinutes: 15 }),
    ]
    const p = computeTodayProgress(tasks, TODAY)
    expect(p.minutesRemaining).toBe(60)
  })

  it('falls back to tasks created today when nothing is due yet', () => {
    const tasks = [makeTask({ dueDate: '2999-01-01', estimatedMinutes: 25 })]
    const p = computeTodayProgress(tasks, TODAY)
    expect(p.scope).toBe('created-today')
    expect(p.total).toBe(1)
    expect(p.percent).toBe(0)
  })

  it('reports a clean 100% when there is genuinely no work', () => {
    const p = computeTodayProgress([], TODAY)
    expect(p).toEqual({ total: 0, completed: 0, percent: 100, scope: 'empty', minutesRemaining: 0 })
  })

  it('rounds percentages to whole numbers', () => {
    const tasks = [makeTask(), makeTask(), makeTask()]
    tasks[0].completed = true
    const p = computeTodayProgress(tasks, TODAY)
    expect(p.percent).toBe(33)
  })
})

describe('computeStreak', () => {
  it('is 0 with no activity', () => {
    expect(computeStreak([], TODAY)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    const days = [
      addDays(TODAY, -3),
      addDays(TODAY, -2),
      addDays(TODAY, -1),
      TODAY,
    ]
    expect(computeStreak(days, TODAY)).toBe(4)
  })

  it('keeps the streak alive when today has no activity yet but yesterday does', () => {
    const days = [addDays(TODAY, -2), addDays(TODAY, -1)]
    expect(computeStreak(days, TODAY)).toBe(2)
  })

  it('breaks when there is a gap', () => {
    const days = [addDays(TODAY, -4), addDays(TODAY, -2), addDays(TODAY, -1)]
    expect(computeStreak(days, TODAY)).toBe(2)
  })

  it('is 0 when the last activity was before yesterday', () => {
    const days = [addDays(TODAY, -3), addDays(TODAY, -2)]
    expect(computeStreak(days, TODAY)).toBe(0)
  })

  it('ignores duplicates', () => {
    const days = [addDays(TODAY, -1), addDays(TODAY, -1), TODAY]
    expect(computeStreak(days, TODAY)).toBe(2)
  })
})

describe('computeBestStreak', () => {
  it('finds the longest run anywhere in history', () => {
    const days = [
      '2026-10-01', '2026-10-02',
      '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08',
      '2026-10-20',
    ]
    expect(computeBestStreak(days)).toBe(4)
  })

  it('handles empty history', () => {
    expect(computeBestStreak([])).toBe(0)
  })

  it('a single day is a streak of 1', () => {
    expect(computeBestStreak(['2026-11-09'])).toBe(1)
  })
})

describe('weeklyCompletion', () => {
  it('buckets completions into the last 7 days', () => {
    const now = new Date()
    const taskDoneToday = makeTask({ completed: true, completedAt: now.toISOString() })
    const weekly = weeklyCompletion([taskDoneToday], TODAY)
    expect(weekly).toHaveLength(7)
    expect(weekly[6].count).toBe(1)
    expect(weekly.slice(0, 6).every((d) => d.count === 0)).toBe(true)
  })

  it('ignores completions from before the window', () => {
    const old = makeTask({ completed: true, completedAt: '2001-05-05T10:00:00.000Z' })
    const weekly = weeklyCompletion([old], TODAY)
    expect(weekly.reduce((sum, d) => sum + d.count, 0)).toBe(0)
  })
})

describe('derived helpers', () => {
  it('completedMinutes sums estimates of finished tasks only', () => {
    const tasks = [
      makeTask({ estimatedMinutes: 40, completed: true, completedAt: new Date().toISOString() }),
      makeTask({ estimatedMinutes: 25 }),
    ]
    expect(completedMinutes(tasks)).toBe(40)
  })

  it('completedToday counts tasks finished on the given day', () => {
    const tasks = [
      makeTask({ completed: true, completedAt: new Date().toISOString() }),
      makeTask({ completed: true, completedAt: '2001-05-05T10:00:00.000Z' }),
    ]
    expect(completedToday(tasks, TODAY)).toBe(1)
  })

  it('overdueCount counts pending tasks past their due date', () => {
    const tasks = [
      makeTask({ dueDate: '2020-01-01' }),
      makeTask({ dueDate: '2020-01-02', completed: true, completedAt: new Date().toISOString() }),
      makeTask({ dueDate: '2999-01-01' }),
    ]
    expect(overdueCount(tasks, TODAY)).toBe(1)
  })

  it('subjectBreakdown rolls up totals per subject', () => {
    const tasks = [
      makeTask({ subject: 'Math', estimatedMinutes: 30 }),
      makeTask({ subject: 'Math', estimatedMinutes: 20, completed: true, completedAt: new Date().toISOString() }),
      makeTask({ subject: 'English', estimatedMinutes: 10 }),
    ]
    const breakdown = subjectBreakdown(tasks)
    const math = breakdown.find((b) => b.subject === 'Math')
    expect(math).toEqual({ subject: 'Math', total: 2, completed: 1, minutes: 50 })
  })
})

describe('isTaskArray', () => {
  it('accepts well-formed tasks', () => {
    expect(isTaskArray([makeTask()])).toBe(true)
    expect(isTaskArray([])).toBe(true)
  })

  it('rejects junk', () => {
    expect(isTaskArray('nope')).toBe(false)
    expect(isTaskArray([{ id: 123 }])).toBe(false)
    expect(isTaskArray([null])).toBe(false)
    expect(isTaskArray([makeTask({ title: 5 as unknown as string })])).toBe(false)
  })
})

function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
