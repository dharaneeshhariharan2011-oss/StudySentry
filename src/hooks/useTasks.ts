import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import type { NewTaskInput, Task } from '../types'
import { loadJSON, saveJSON, STORAGE_KEYS } from '../lib/storage'
import {
  computeBestStreak,
  computeStreak,
  computeTodayProgress,
  createTaskId,
  isStringArray,
  isTaskArray,
  sortTasks,
} from '../lib/tasks'
import { todayISO } from '../lib/date'

export interface UseTasksResult {
  tasks: Task[]
  /** Canonical order: pending first (priority → due date), then completed. */
  sortedTasks: Task[]
  pendingCount: number
  addTask: (input: NewTaskInput) => Task
  updateTask: (id: string, patch: Partial<NewTaskInput>) => void
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  clearCompleted: () => void
  /** Days with a streak-worthy action (log or completion), YYYY-MM-DD. */
  activityDays: string[]
  streak: number
  bestStreak: number
  todayProgress: ReturnType<typeof computeTodayProgress>
}

function fireCelebration(): void {
  try {
    confetti({ particleCount: 130, spread: 80, origin: { y: 0.62 }, disableForReducedMotion: true })
    window.setTimeout(() => {
      confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, disableForReducedMotion: true })
      confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, disableForReducedMotion: true })
    }, 220)
  } catch (error) {
    // Confetti is decorative — never let it break a toggle.
    console.warn('[useTasks] confetti failed', error)
  }
}

/**
 * Central task store. Persists to localStorage on every change,
 * keeps an activity log for streaks, and fires a confetti celebration
 * the moment every task in today's scope is completed.
 */
export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>(() =>
    loadJSON<Task[]>(STORAGE_KEYS.tasks, [], isTaskArray),
  )
  const [activityDays, setActivityDays] = useState<string[]>(() =>
    loadJSON<string[]>(STORAGE_KEYS.activity, [], isStringArray),
  )

  // Mirror of tasks for synchronous reads inside callbacks.
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
    saveJSON(STORAGE_KEYS.tasks, tasks)
  }, [tasks])

  useEffect(() => {
    saveJSON(STORAGE_KEYS.activity, activityDays)
  }, [activityDays])

  const recordActivity = useCallback(() => {
    const today = todayISO()
    setActivityDays((days) => (days.includes(today) ? days : [...days, today]))
  }, [])

  const addTask = useCallback(
    (input: NewTaskInput): Task => {
      const task: Task = {
        ...input,
        id: createTaskId(),
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
      }
      setTasks((prev) => [task, ...prev])
      recordActivity()
      return task
    },
    [recordActivity],
  )

  const updateTask = useCallback((id: string, patch: Partial<NewTaskInput>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }, [])

  const toggleTask = useCallback(
    (id: string) => {
      const prev = tasksRef.current
      const target = prev.find((t) => t.id === id)
      if (!target) return

      const completing = !target.completed
      const now = new Date().toISOString()
      const next = prev.map((t) =>
        t.id === id ? { ...t, completed: completing, completedAt: completing ? now : null } : t,
      )
      tasksRef.current = next
      setTasks(next)

      if (completing) {
        recordActivity()
        const before = computeTodayProgress(prev)
        const after = computeTodayProgress(next)
        const justFinished =
          after.total > 0 && after.completed === after.total && before.completed < before.total
        if (justFinished) fireCelebration()
      }
    },
    [recordActivity],
  )

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearCompleted = useCallback(() => {
    setTasks((prev) => prev.filter((t) => !t.completed))
  }, [])

  const today = todayISO()
  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])
  const pendingCount = useMemo(() => tasks.filter((t) => !t.completed).length, [tasks])
  const streak = useMemo(() => computeStreak(activityDays, today), [activityDays, today])
  const bestStreak = useMemo(() => computeBestStreak(activityDays), [activityDays])
  const todayProgress = useMemo(() => computeTodayProgress(tasks, today), [tasks, today])

  return {
    tasks,
    sortedTasks,
    pendingCount,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    activityDays,
    streak,
    bestStreak,
    todayProgress,
  }
}
