import { useMemo, useState } from 'react'
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Download,
  Flame,
  ListChecks,
  Trash2,
  Trophy,
} from 'lucide-react'
import type { Task } from '../types'
import {
  completedMinutes,
  subjectBreakdown,
  weeklyCompletion,
} from '../lib/tasks'
import { monthDayShort, todayISO, weekdayShort } from '../lib/date'
import { SUBJECT_STYLE } from '../lib/look'
import StreakCounter from './StreakCounter'

interface AnalyticsProps {
  tasks: Task[]
  activityDays: string[]
  streak: number
  bestStreak: number
  onClearCompleted: () => void
}

/**
 * Insights tab: streaks, weekly momentum, subject breakdown, data export.
 */
export default function Analytics({
  tasks,
  activityDays,
  streak,
  bestStreak,
  onClearCompleted,
}: AnalyticsProps) {
  const [confirmClear, setConfirmClear] = useState(false)

  const weekly = useMemo(() => weeklyCompletion(tasks, todayISO()), [tasks])
  const maxWeekly = Math.max(1, ...weekly.map((d) => d.count))
  const totalCompleted = useMemo(() => tasks.filter((t) => t.completed).length, [tasks])
  const minutes = useMemo(() => completedMinutes(tasks), [tasks])
  const bySubject = useMemo(() => subjectBreakdown(tasks), [tasks])

  const exportData = () => {
    const payload = {
      app: 'StudySentry',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      activityDays,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'studysentry-export.json'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex animate-fadeIn flex-col gap-4">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="glass rounded-2xl p-3.5 text-center">
          <ListChecks size={18} className="mx-auto text-brand-300" />
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-50">{totalCompleted}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Completed</p>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center">
          <Clock3 size={18} className="mx-auto text-sky2-400" />
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-50">{minutes}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Min focused</p>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center">
          <Flame size={18} className="mx-auto text-orange-400" />
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-50">{streak}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Day streak</p>
        </div>
        <div className="glass rounded-2xl p-3.5 text-center">
          <Trophy size={18} className="mx-auto text-amber-300" />
          <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-slate-50">{bestStreak}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Best streak</p>
        </div>
      </div>

      {/* Streak hero */}
      <StreakCounter streak={streak} bestStreak={bestStreak} variant="card" />

      {/* Weekly momentum */}
      <div className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-300">
            <BarChart3 size={14} className="text-brand-300" /> This week
          </h3>
          <span className="text-[10px] font-medium text-slate-500">tasks completed / day</span>
        </div>
        <div className="flex h-36 items-end justify-between gap-1.5">
          {weekly.map(({ iso, count }) => {
            const heightPct = Math.max(3, Math.round((count / maxWeekly) * 100))
            const isToday = iso === todayISO()
            return (
              <div
                key={iso}
                className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                title={`${monthDayShort(iso)}: ${count} completed`}
              >
                <span className="text-[10px] font-bold tabular-nums text-slate-400">
                  {count > 0 ? count : ''}
                </span>
                <div
                  className={`w-full max-w-[44px] rounded-t-md transition-all duration-500 ${
                    count > 0
                      ? 'bg-gradient-to-t from-brand-500 to-sky2-400'
                      : 'bg-white/[0.06]'
                  } ${isToday ? 'ring-1 ring-brand-300/60' : ''}`}
                  style={{ height: `${heightPct}%` }}
                />
                <span
                  className={`text-[9px] font-semibold uppercase tracking-wide ${
                    isToday ? 'text-brand-300' : 'text-slate-500'
                  }`}
                >
                  {weekdayShort(iso)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Subject breakdown */}
      {bySubject.length > 0 && (
        <div className="glass rounded-2xl p-4">
          <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-300">
            <CheckCircle2 size={14} className="text-brand-300" /> By subject
          </h3>
          <ul className="flex flex-col gap-2.5">
            {bySubject.map(({ subject, total, completed, minutes: mins }) => {
              const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
              const style = SUBJECT_STYLE[subject]
              return (
                <li key={subject} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 truncate text-xs font-semibold text-slate-300">
                    {subject}
                  </span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r transition-all duration-500 ${style.bar}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-[10.5px] font-medium tabular-nums text-slate-500">
                    {completed}/{total} · {mins}m
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Data actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <button
          onClick={exportData}
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-slate-400 transition-colors hover:text-slate-100"
        >
          <Download size={13} /> Export data (JSON)
        </button>
        {totalCompleted > 0 && (
          <button
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true)
                return
              }
              onClearCompleted()
              setConfirmClear(false)
            }}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-semibold transition-all ${
              confirmClear
                ? 'border-red-400/50 bg-red-500/15 text-red-300'
                : 'border-white/10 bg-white/5 text-slate-400 hover:text-red-300'
            }`}
          >
            <Trash2 size={13} />
            {confirmClear ? `Confirm: clear ${totalCompleted} completed` : 'Clear completed'}
          </button>
        )}
      </div>

      <p className="px-1 text-center text-[10px] leading-relaxed text-slate-600">
        Your data never leaves this device — StudySentry stores everything locally. Export a backup
        anytime.
      </p>
    </div>
  )
}
