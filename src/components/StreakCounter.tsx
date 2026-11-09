import { Flame, Trophy } from 'lucide-react'

interface StreakCounterProps {
  streak: number
  bestStreak?: number
  variant?: 'chip' | 'card'
}

/**
 * Daily streak display. `chip` for the header, `card` for the insights tab.
 */
export default function StreakCounter({ streak, bestStreak, variant = 'chip' }: StreakCounterProps) {
  const active = streak > 0

  if (variant === 'chip') {
    return (
      <div
        title={active ? `${streak}-day streak — keep it alive!` : 'Log or finish a task to start a streak'}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-bold transition-colors ${
          active
            ? 'border-orange-400/40 bg-orange-500/10 text-orange-300'
            : 'border-white/10 bg-white/5 text-slate-500'
        }`}
        aria-label={`Current streak: ${streak} day${streak === 1 ? '' : 's'}`}
      >
        <Flame
          size={16}
          strokeWidth={2.4}
          className={active ? 'animate-flamePulse fill-orange-400/40 text-orange-400' : ''}
        />
        <span className="tabular-nums">{streak}</span>
        <span className="hidden text-[11px] font-semibold uppercase tracking-wide opacity-80 sm:inline">
          day{streak === 1 ? '' : 's'}
        </span>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Current streak
          </p>
          <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-50">
            {streak}
            <span className="ml-1.5 text-base font-semibold text-slate-400">
              day{streak === 1 ? '' : 's'}
            </span>
          </p>
          {typeof bestStreak === 'number' && (
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <Trophy size={12} className="text-amber-300" /> Best:{' '}
              <span className="font-semibold text-slate-300">{bestStreak} days</span>
            </p>
          )}
        </div>
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
            active ? 'bg-orange-500/15' : 'bg-white/5'
          }`}
        >
          <Flame
            size={34}
            strokeWidth={2}
            className={
              active ? 'animate-flamePulse fill-orange-400/30 text-orange-400' : 'text-slate-600'
            }
          />
        </div>
      </div>
    </div>
  )
}
