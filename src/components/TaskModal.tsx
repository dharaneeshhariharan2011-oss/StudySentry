import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Sparkles, X } from 'lucide-react'
import type { NewTaskInput, Priority, Subject, Task } from '../types'
import { PRIORITIES, SUBJECTS } from '../types'
import { SignalHigh, SignalLow, SignalMedium } from 'lucide-react'
import { todayISO } from '../lib/date'

const QUICK_MINUTES = [15, 30, 45, 60, 90]

const PRIORITY_META: Record<Priority, { label: string; active: string; Icon: typeof SignalHigh }> = {
  high: {
    label: 'High',
    active: 'bg-red-500/20 border-red-400/60 text-red-300 shadow-[0_0_14px_rgba(248,113,113,0.25)]',
    Icon: SignalHigh,
  },
  medium: {
    label: 'Medium',
    active:
      'bg-amber-400/15 border-amber-300/50 text-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.2)]',
    Icon: SignalMedium,
  },
  low: {
    label: 'Low',
    active: 'bg-emerald-400/15 border-emerald-300/50 text-emerald-300',
    Icon: SignalLow,
  },
}

export interface TaskModalProps {
  open: boolean
  onClose: () => void
  /** When provided the modal operates in "edit" mode. */
  initialTask?: Task | null
  onSubmit: (input: NewTaskInput) => void
}

/**
 * "The Nag" — a fast, keyboard-friendly capture sheet. Shown on launch (to ask
 * what work is due) and reused as the quick-add / edit form.
 */
export default function TaskModal({ open, onClose, initialTask, onSubmit }: TaskModalProps) {
  const editing = Boolean(initialTask)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState<Subject>('Math')
  const [minutes, setMinutes] = useState<number>(30)
  const [priority, setPriority] = useState<Priority>('medium')
  const [dueDate, setDueDate] = useState<string>(todayISO())
  const [touched, setTouched] = useState(false)

  const titleRef = useRef<HTMLInputElement>(null)

  // Reset / hydrate the form whenever the modal opens.
  useEffect(() => {
    if (!open) return
    if (initialTask) {
      setTitle(initialTask.title)
      setSubject(initialTask.subject)
      setMinutes(initialTask.estimatedMinutes)
      setPriority(initialTask.priority)
      setDueDate(initialTask.dueDate)
    } else {
      setTitle('')
      setSubject('Math')
      setMinutes(30)
      setPriority('medium')
      setDueDate(todayISO())
    }
    setTouched(false)
    const t = window.setTimeout(() => titleRef.current?.focus(), 60)
    return () => window.clearTimeout(t)
  }, [open, initialTask])

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  const trimmedTitle = title.trim()
  const titleValid = trimmedTitle.length > 0
  const minutesValid = Number.isFinite(minutes) && minutes >= 1 && minutes <= 24 * 60
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(dueDate)
  const canSubmit = titleValid && minutesValid && dateValid

  const handleSubmit = (event?: React.FormEvent) => {
    event?.preventDefault()
    setTouched(true)
    if (!canSubmit) return
    onSubmit({
      title: trimmedTitle,
      subject,
      estimatedMinutes: Math.round(minutes),
      priority,
      dueDate,
    })
    onClose()
  }

  const minutesValue = useMemo(() => (Number.isFinite(minutes) ? minutes : 0), [minutes])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center"
      role="presentation"
    >
      {/* Backdrop */}
      <button
        aria-label="Close dialog"
        className="absolute inset-0 animate-fadeIn cursor-default bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="relative z-10 mx-auto w-full max-w-lg animate-slideUp rounded-t-3xl border border-white/10 bg-ink-850/95 p-5 shadow-card backdrop-blur-xl sm:rounded-3xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400/25 to-sky2-400/20 text-brand-300">
              <Sparkles size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2
                id="task-modal-title"
                className="text-lg font-bold leading-snug tracking-tight text-slate-50"
              >
                {editing ? 'Edit task' : 'What work do you have to get done today?'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {editing
                  ? 'Update the details — future-you will thank you.'
                  : 'Log it now so it can’t sneak past your streak.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <label htmlFor="task-title" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Task
          </label>
          <input
            ref={titleRef}
            id="task-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Finish algebra worksheet 12"
            autoComplete="off"
            maxLength={140}
            className={`w-full rounded-xl border bg-white/5 px-3.5 py-3 text-[16px] text-slate-100 placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30 ${
              touched && !titleValid ? 'border-red-400/60' : 'border-white/10'
            }`}
          />
          {touched && !titleValid && (
            <p className="mt-1 text-xs text-red-400">Give the task a name so you know what to do.</p>
          )}

          {/* Subject + minutes row */}
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="task-subject" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Subject
              </label>
              <div className="relative">
                <select
                  id="task-subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as Subject)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[16px] text-slate-100 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
                >
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s} className="bg-ink-800 text-slate-100">
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="task-minutes" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Est. minutes
              </label>
              <input
                id="task-minutes"
                type="number"
                min={1}
                max={1440}
                inputMode="numeric"
                value={minutesValue}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[16px] text-slate-100 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
              />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {QUICK_MINUTES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setMinutes(q)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      minutesValue === q
                        ? 'border-brand-400/60 bg-brand-400/15 text-brand-300'
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {q}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority segmented control */}
          <fieldset className="mt-4">
            <legend className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Priority
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((p) => {
                const { label, active, Icon } = PRIORITY_META[p]
                const selected = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setPriority(p)}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-sm font-semibold transition-all ${
                      selected
                        ? active
                        : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={16} strokeWidth={2.4} />
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {/* Due date */}
          <div className="mt-4">
            <label htmlFor="task-due" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Due date
            </label>
            <input
              id="task-due"
              type="date"
              value={dueDate}
              min="2000-01-01"
              max="2100-12-31"
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-3 text-[16px] text-slate-100 focus:border-brand-400/60 focus:outline-none focus:ring-2 focus:ring-brand-400/30"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10 hover:text-slate-100"
            >
              {editing ? 'Cancel' : 'Not now'}
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-[1.4] rounded-xl bg-gradient-to-r from-brand-400 to-sky2-500 px-4 py-3 text-sm font-bold text-ink-900 shadow-glow-sm transition-all enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {editing ? 'Save changes' : 'Add task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
