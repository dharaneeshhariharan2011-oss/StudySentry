import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import confetti from 'canvas-confetti'
import { useTasks } from './useTasks'
import { STORAGE_KEYS } from '../lib/storage'
import { todayISO } from '../lib/date'

vi.mock('canvas-confetti', () => ({ default: vi.fn() }))

const confettiMock = vi.mocked(confetti)

const newTask = () => ({
  title: 'Algebra worksheet',
  subject: 'Math' as const,
  estimatedMinutes: 30,
  priority: 'high' as const,
  dueDate: todayISO(),
})

describe('useTasks', () => {
  beforeEach(() => {
    confettiMock.mockClear()
  })

  it('starts empty with a clean slate', () => {
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toEqual([])
    expect(result.current.pendingCount).toBe(0)
    expect(result.current.streak).toBe(0)
    expect(result.current.todayProgress.percent).toBe(100)
  })

  it('adds a task, persists it, and logs activity for the streak', () => {
    const { result } = renderHook(() => useTasks())

    act(() => {
      result.current.addTask(newTask())
    })

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('Algebra worksheet')
    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.pendingCount).toBe(1)
    // Activity recorded → today counts toward the streak.
    expect(result.current.activityDays).toContain(todayISO())
    expect(result.current.streak).toBe(1)

    // Written to localStorage.
    const raw = window.localStorage.getItem(STORAGE_KEYS.tasks)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)).toHaveLength(1)
  })

  it('hydrates from localStorage on remount (persistence across sessions)', () => {
    const first = renderHook(() => useTasks())
    act(() => {
      first.result.current.addTask(newTask())
    })
    first.unmount()

    const second = renderHook(() => useTasks())
    expect(second.result.current.tasks).toHaveLength(1)
    expect(second.result.current.tasks[0].title).toBe('Algebra worksheet')
  })

  it('toggles a task complete with a completion timestamp', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    const id = result.current.tasks[0].id

    act(() => {
      result.current.toggleTask(id)
    })

    expect(result.current.tasks[0].completed).toBe(true)
    expect(result.current.tasks[0].completedAt).not.toBeNull()

    act(() => {
      result.current.toggleTask(id)
    })
    expect(result.current.tasks[0].completed).toBe(false)
    expect(result.current.tasks[0].completedAt).toBeNull()
  })

  it('fires confetti exactly once when the last daily task is completed', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    const id = result.current.tasks[0].id

    act(() => {
      result.current.toggleTask(id)
    })

    expect(confettiMock).toHaveBeenCalledTimes(1)
  })

  it('does not confetti when a task is un-completed after celebration', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    const id = result.current.tasks[0].id
    act(() => {
      result.current.toggleTask(id)
    })
    act(() => {
      result.current.toggleTask(id) // back to pending
    })
    expect(confettiMock).toHaveBeenCalledTimes(1)
  })

  it('updates a task in place', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    const id = result.current.tasks[0].id

    act(() => {
      result.current.updateTask(id, { title: 'Finish biology lab report', subject: 'Science' })
    })

    expect(result.current.tasks[0].title).toBe('Finish biology lab report')
    expect(result.current.tasks[0].subject).toBe('Science')
  })

  it('deletes a task', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    const id = result.current.tasks[0].id
    act(() => {
      result.current.deleteTask(id)
    })
    expect(result.current.tasks).toHaveLength(0)
  })

  it('clearCompleted removes finished tasks and keeps pending ones', () => {
    const { result } = renderHook(() => useTasks())
    act(() => {
      result.current.addTask(newTask())
    })
    act(() => {
      result.current.addTask({ ...newTask(), title: 'History essay' })
    })
    const firstId = result.current.tasks.find((t) => t.title === 'Algebra worksheet')!.id
    act(() => {
      result.current.toggleTask(firstId)
    })
    act(() => {
      result.current.clearCompleted()
    })
    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].title).toBe('History essay')
  })

  it('recovers gracefully when localStorage holds garbage', () => {
    window.localStorage.setItem(STORAGE_KEYS.tasks, '{{{{not json')
    const { result } = renderHook(() => useTasks())
    expect(result.current.tasks).toEqual([])
  })
})
