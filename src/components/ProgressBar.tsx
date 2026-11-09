interface ProgressBarProps {
  /** 0–100 */
  percent: number
  completed: number
  total: number
  minutesRemaining: number
}

/**
 * Accessible, animated progress bar for "today's work".
 */
export default function ProgressBar({ percent, completed, total, minutesRemaining }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, percent))
  const empty = total === 0
  const done = !empty && completed === total
  const headline = empty ? 'All clear' : done ? 'Crushed it' : `${clamped}%`
  const barWidth = empty ? 0 : done ? 100 : clamped

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Today's focus
          </p>
          <p className="mt-0.5 text-2xl font-extrabold leading-none tabular-nums text-slate-50">
            {headline}
            {!done && !empty && (
              <span className="ml-2 align-middle text-xs font-semibold text-slate-500">
                {completed}/{total} done
              </span>
            )}
          </p>
        </div>
        {minutesRemaining > 0 && (
          <p className="text-right text-[11px] font-medium leading-tight text-slate-400">
            ≈ {minutesRemaining} min
            <br />
            estimated left
          </p>
        )}
      </div>

      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Percentage of today's work completed"
        className="h-3.5 w-full overflow-hidden rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/10"
      >
        <div
          className="relative h-full rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-sky2-400 transition-[width] duration-700 ease-out"
          style={{ width: `${barWidth}%` }}
        >
          {clamped > 8 && (
            <div className="shimmer absolute inset-0 animate-shimmer rounded-full" aria-hidden="true" />
          )}
        </div>
      </div>
    </div>
  )
}
