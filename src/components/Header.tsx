import { ShieldCheck } from 'lucide-react'
import StreakCounter from './StreakCounter'

interface HeaderProps {
  streak: number
}

export default function Header({ streak }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-ink-900/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-sky2-500 shadow-glow-sm">
            <ShieldCheck size={20} strokeWidth={2.2} className="text-ink-900" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-extrabold tracking-tight text-slate-50 sm:text-base">
              Study<span className="text-gradient">Sentry</span>
            </p>
            <p className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 sm:block">
              No excuses. Just done.
            </p>
          </div>
        </div>
        <StreakCounter streak={streak} variant="chip" />
      </div>
    </header>
  )
}
