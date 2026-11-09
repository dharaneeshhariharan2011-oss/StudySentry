import { useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, CalendarClock, ListTodo, Plus } from 'lucide-react'
import Header from './components/Header'
import ProgressBar from './components/ProgressBar'
import FilterBar from './components/FilterBar'
import TaskList from './components/TaskList'
import TaskModal from './components/TaskModal'
import Analytics from './components/Analytics'
import InstallBanner from './components/InstallBanner'
import { useTasks } from './hooks/useTasks'
import { usePWAInstall } from './hooks/usePWAInstall'
import { useLocalStorage } from './hooks/useLocalStorage'
import { STORAGE_KEYS } from './lib/storage'
import { completedToday, filterTasks, overdueCount } from './lib/tasks'
import { todayISO } from './lib/date'
import type { NewTaskInput, Task, TaskFilter } from './types'

function greeting(now: Date = new Date()): string {
  const h = now.getHours()
  if (h < 5) return 'Late-night grind'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Late-night grind'
}

export default function App() {
  const {
    tasks,
    sortedTasks,
    pendingCount,
    streak,
    bestStreak,
    todayProgress,
    addTask,
    updateTask,
    toggleTask,
    deleteTask,
    clearCompleted,
    activityDays,
  } = useTasks()

  const [filter, setFilter] = useState<TaskFilter>('all')
  const [tab, setTab] = useState<'tasks' | 'insights'>('tasks')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const install = usePWAInstall()
  const [lastNagDay, setLastNagDay] = useLocalStorage<string | null>(STORAGE_KEYS.lastNagDay, null)
  const nagChecked = useRef(false)

  // "The Nag": on launch, if there's unfinished work or the calendar rolled
  // over to a new day, ask what's due. Runs exactly once per mount.
  useEffect(() => {
    if (nagChecked.current) return
    nagChecked.current = true
    const hasPending = tasks.some((t) => !t.completed)
    if (hasPending || lastNagDay !== todayISO()) {
      const timer = window.setTimeout(() => setModalOpen(true), 500)
      return () => window.clearTimeout(timer)
    }
    // Mount-only by design — we only nag once per app open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const closeModal = () => {
    setModalOpen(false)
    setEditingTask(null)
    setLastNagDay(todayISO())
  }

  const openLog = () => {
    setEditingTask(null)
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    setModalOpen(true)
  }

  const handleSubmit = (input: NewTaskInput) => {
    if (editingTask) updateTask(editingTask.id, input)
    else addTask(input)
  }

  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: pendingCount,
      completed: tasks.length - pendingCount,
    }),
    [tasks.length, pendingCount],
  )

  const visibleTasks = useMemo(() => filterTasks(sortedTasks, filter), [sortedTasks, filter])
  const overdue = useMemo(() => overdueCount(tasks), [tasks])
  const doneToday = useMemo(() => completedToday(tasks), [tasks])
  const allCaughtUp = tasks.length > 0 && pendingCount === 0

  const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="min-h-dvh bg-aurora font-sans text-slate-100 antialiased">
      <Header streak={streak} />

      <main className="mx-auto max-w-3xl px-4 pb-44 pt-4 sm:px-6 sm:pt-6">
        {/* Greeting row */}
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-400">
              {todayLabel}
            </p>
            <h1 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight text-slate-50 sm:text-3xl">
              {greeting()}
              <span className="text-brand-400">.</span>
            </h1>
          </div>
          {overdue > 0 && (
            <div
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-[11px] font-bold text-red-300"
              title="Tasks past their due date"
            >
              <CalendarClock size={13} />
              {overdue} overdue
            </div>
          )}
        </div>

        {/* Progress card */}
        <section
          aria-label="Today's progress"
          className="glass rounded-3xl p-4 shadow-card sm:p-5"
        >
          <ProgressBar
            percent={todayProgress.percent}
            completed={todayProgress.completed}
            total={todayProgress.total}
            minutesRemaining={todayProgress.minutesRemaining}
          />
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500">
            <span>
              <span className="font-bold text-slate-300 tabular-nums">{doneToday}</span> done today
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-bold text-slate-300 tabular-nums">{pendingCount}</span> pending overall
            </span>
            {allCaughtUp && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-brand-300">All daily work complete</span>
              </>
            )}
          </div>
        </section>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Sections"
          className="mt-4 grid grid-cols-2 gap-1 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-1"
        >
          {(
            [
              { id: 'tasks', label: 'Tasks', Icon: ListTodo },
              { id: 'insights', label: 'Insights', Icon: BarChart3 },
            ] as const
          ).map(({ id, label, Icon }) => {
            const active = tab === id
            return (
              <button
                key={id}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(id)}
                className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-brand-400/90 to-sky2-500/90 text-ink-900 shadow-glow-sm'
                    : 'text-slate-400 hover:text-slate-100'
                }`}
              >
                <Icon size={16} strokeWidth={2.4} />
                {label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {tab === 'tasks' ? (
          <div role="tabpanel" className="mt-3 flex flex-col gap-3">
            <FilterBar filter={filter} onChange={setFilter} counts={counts} />
            <TaskList
              tasks={visibleTasks}
              filter={filter}
              totalCommitted={allCaughtUp}
              onToggle={toggleTask}
              onEdit={openEdit}
              onDelete={deleteTask}
              onLogWork={openLog}
            />
          </div>
        ) : (
          <div role="tabpanel" className="mt-3">
            <Analytics
              tasks={tasks}
              activityDays={activityDays}
              streak={streak}
              bestStreak={bestStreak}
              onClearCompleted={clearCompleted}
            />
          </div>
        )}

        <p className="mt-8 text-center text-[10px] leading-relaxed text-slate-600">
          StudySentry keeps everything on this device — no account, no cloud, no fees.
          <br />
          Install it, log daily, keep the streak alive.
        </p>
      </main>

      {/* Floating add button */}
      <button
        onClick={openLog}
        aria-label="Log work"
        className="fixed right-4 z-30 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-sky2-500 text-ink-900 shadow-glow transition-all hover:scale-105 active:scale-95 sm:right-6"
        style={{ bottom: install.showPrompt ? '7.5rem' : 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <Plus size={26} strokeWidth={2.8} />
      </button>

      {/* Install banner (iOS instructions / Android prompt) */}
      {install.showPrompt && (
        <InstallBanner
          platform={install.platform}
          canPromptInstall={install.canPromptInstall}
          onInstall={() => void install.promptInstall()}
          onDismiss={install.dismiss}
        />
      )}

      {/* The Nag / quick add / edit */}
      <TaskModal
        open={modalOpen}
        onClose={closeModal}
        initialTask={editingTask}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
