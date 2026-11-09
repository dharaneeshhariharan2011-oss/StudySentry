import type { Subject } from '../types'

/**
 * Static Tailwind class maps per subject — literal strings so the JIT keeps them.
 */
export const SUBJECT_STYLE: Record<
  Subject,
  { chip: string; dot: string; bar: string }
> = {
  Math: {
    chip: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
    dot: 'bg-sky-400',
    bar: 'from-sky-400 to-cyan-400',
  },
  Science: {
    chip: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300',
    dot: 'bg-emerald-400',
    bar: 'from-emerald-400 to-teal-400',
  },
  History: {
    chip: 'border-amber-400/30 bg-amber-400/10 text-amber-300',
    dot: 'bg-amber-400',
    bar: 'from-amber-400 to-orange-400',
  },
  English: {
    chip: 'border-violet-400/30 bg-violet-400/10 text-violet-300',
    dot: 'bg-violet-400',
    bar: 'from-violet-400 to-fuchsia-400',
  },
  Elective: {
    chip: 'border-pink-400/30 bg-pink-400/10 text-pink-300',
    dot: 'bg-pink-400',
    bar: 'from-pink-400 to-rose-400',
  },
  Other: {
    chip: 'border-slate-400/30 bg-slate-400/10 text-slate-300',
    dot: 'bg-slate-400',
    bar: 'from-slate-400 to-slate-500',
  },
}
