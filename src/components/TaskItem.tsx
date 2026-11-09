import { useEffect, useState } from 'react'
import {
  CalendarClock,
  Check,
  Clock3,
  Pencil,
  SignalHigh,
  SignalLow,
  SignalMedium,
  Trash2,
} from 'lucide-react'
import type { Priority, Task } from '../types'
import { formatDueLabel } from '../lib/date'
import { SUBJECT_STYLE } from '../lib/look'

const PRIORITY_META: Record<Priority, { label: string; className: string; Icon: typeof SignalHigh }> = {
  high: {
    label: 'High',
    className: 'border-red-400/30 bg-red-400/10 text-red-300',
    Icon: SignalHigh,
  },
  medium: {
    label: 'Medium',
    className: 'border-amber-300/30 bg-amber-300/10 text-amber-300',
    Icon: SignalMedium,
  },
  low: {
    label: 'Low',
    className: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-300',
    Icon: SignalLow,
  },
}

const DUE_TONE: Record<string, string> = {
  overdue: 'border-red-400/40 bg-red-500/15 text-red-300',
  today: 'border-brand-400/40 bg-brand-400/10 text-brand-300',
  tomorrow: 'border-sky2-400/30 bg-sky2-400/10 text-sky2-400',
  future: 'border-white/10 bg-white/5 text-slate-400',
}

interface TaskItemProps {
  task: Task
  onToggle: (id: string) => void
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Auto-cancel the two-step delete after 2.6s.
  useEffect(() => {
    if (!confirmDelete) return
    const t = window.setTimeout(() => setConfirmDelete(false), 2600)
    return () => window.clearTimeout(t)
  }, [confirmDelete])

  const due = formatDueLabel(task.dueDate)
  const subjectStyle = SUBJECT_STYLE[task.subject]
  const priorityMeta = PRIORITY_META[task.priority]
  const PriorityIcon = priorityMeta.Icon
  const dueTone = task.completed ? DUE_TONE.future : DUE_TONE[due.tone]

  return (
    <li
      className={`group relative overflow-hidden rounded-2xl border p-3 transition-all duration-200 sm:p-3.5 ${
        task.completed
          ? 'border-white/[0.06] bg-white/[0.02]'
          : 'border-white/[0.08] bg-white/[0.045] hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Animated checkbox */}
        <button
          role="checkbox"
          aria-checked={task.completed}
          aria-label={task.completed ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
          onClick={() => onToggle(task.id)}
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all duration-200 active:scale-90 ${
            task.completed
              ? 'border-transparent bg-gradient-to-br from-brand-400 to-sky2-500 shadow-glow-sm'
              : 'border-slate-600 bg-transparent hover:border-brand-400/70'
          }`}
        >
          {task.completed && <Check size={18} strokeWidth={3.2} className="animate-pop text-ink-900" />}
        </button>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-[15px] font-semibold leading-snug transition-colors duration-300 ${
              task.completed ? 'text-slate-500 line-through decoration-brand-400/50 decoration-2' : 'text-slate-100'
            }`}
          >
            {task.title}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {/* Subject */}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${subjectStyle.chip}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${subjectStyle.dot}`} />
              {task.subject}
            </span>

            {/* Priority */}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${priorityMeta.className}`}>
              <PriorityIcon size={11} strokeWidth={2.6} />
              {priorityMeta.label}
            </span>

            {/* Due */}
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${dueTone}`}>
              <CalendarClock size={11} strokeWidth={2.4} />
              {due.label}
            </span>

            {/* Estimate */}
            <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10.5px] font-semibold text-slate-400">
              <Clock3 size={11} strokeWidth={2.4} />
              {task.estimatedMinutes}m
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 flex-col gap-1 sm:flex-row sm:gap-1.5">
          <button
            onClick={() => onEdit(task)}
            aria-label={`Edit "${task.title}"`}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => (confirmDelete ? onDelete(task.id) : setConfirmDelete(true))}
            aria-label={confirmDelete ? `Confirm delete "${task.title}"` : `Delete "${task.title}"`}
            className={`rounded-lg p-2 transition-all ${
              confirmDelete
                ? 'bg-red-500/15 text-red-400 ring-1 ring-red-400/40 hover:bg-red-500/25'
                : 'text-slate-500 hover:bg-white/5 hover:text-red-300'
            }`}
          >
            {confirmDelete ? (
              <span className="text-[10px] font-bold uppercase tracking-wide">Sure?</span>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>
    </li>
  )
}
