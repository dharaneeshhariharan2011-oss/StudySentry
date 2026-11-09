import { CheckCircle2, ChevronDown, Circle, Layers } from 'lucide-react'
import type { TaskFilter } from '../types'
import { SUBJECTS } from '../types'

interface FilterBarProps {
  filter: TaskFilter
  onChange: (filter: TaskFilter) => void
  counts: { all: number; pending: number; completed: number }
}

const BASE_CHIPS: Array<{ id: TaskFilter; label: string; Icon: typeof Circle }> = [
  { id: 'all', label: 'All', Icon: Layers },
  { id: 'pending', label: 'Pending', Icon: Circle },
  { id: 'completed', label: 'Completed', Icon: CheckCircle2 },
]

/**
 * Sticky-friendly filter row: All / Pending / Completed chips + subject select.
 */
export default function FilterBar({ filter, onChange, counts }: FilterBarProps) {
  const countFor = (id: TaskFilter): number | null => {
    if (id === 'all') return counts.all
    if (id === 'pending') return counts.pending
    if (id === 'completed') return counts.completed
    return null
  }

  const subjectValue = SUBJECTS.includes(filter as (typeof SUBJECTS)[number]) ? filter : ''

  return (
    <div className="flex items-center gap-2">
      <div
        className="no-scrollbar -mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 py-0.5"
        role="group"
        aria-label="Filter tasks"
      >
        {BASE_CHIPS.map(({ id, label, Icon }) => {
          const active = filter === id
          const count = countFor(id)
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-pressed={active}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition-all ${
                active
                  ? 'border-brand-400/50 bg-brand-400/15 text-brand-300 shadow-glow-sm'
                  : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={13} strokeWidth={2.5} />
              {label}
              {count !== null && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold tabular-nums leading-none ${
                    active ? 'bg-brand-400/25 text-brand-200' : 'bg-white/10 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Subject filter */}
      <div className="relative shrink-0">
        <label htmlFor="subject-filter" className="sr-only">
          Filter by subject
        </label>
        <select
          id="subject-filter"
          value={subjectValue}
          onChange={(e) => onChange((e.target.value || 'all') as TaskFilter)}
          className={`appearance-none rounded-full border py-2 pl-3.5 pr-8 text-xs font-bold outline-none transition-all focus:ring-2 focus:ring-brand-400/40 ${
            subjectValue
              ? 'border-brand-400/50 bg-brand-400/15 text-brand-300'
              : 'border-white/10 bg-white/5 text-slate-400'
          }`}
          aria-label="Filter by subject"
        >
          <option value="" className="bg-ink-800 text-slate-100">
            Subject
          </option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s} className="bg-ink-800 text-slate-100">
              {s}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500"
        />
      </div>
    </div>
  )
}
