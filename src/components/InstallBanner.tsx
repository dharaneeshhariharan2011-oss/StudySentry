import { Download, Menu, Share, SquarePlus, X } from 'lucide-react'
import type { InstallPlatform } from '../hooks/usePWAInstall'

interface InstallBannerProps {
  platform: InstallPlatform
  canPromptInstall: boolean
  onInstall: () => void
  onDismiss: () => void
}

/**
 * Install coaching banner.
 * - iOS Safari: step-by-step Share → Add to Home Screen instructions.
 * - Chromium with a captured beforeinstallprompt: one-tap Install button.
 * - Android without the prompt: manual ⋮ menu instructions.
 */
export default function InstallBanner({
  platform,
  canPromptInstall,
  onInstall,
  onDismiss,
}: InstallBannerProps) {
  const isIOS = platform === 'ios-safari'

  return (
    <div
      role="complementary"
      aria-label="Install StudySentry"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto mx-auto flex max-w-xl animate-slideUp items-center gap-3 rounded-2xl border border-brand-400/25 bg-ink-850/95 p-3 shadow-card backdrop-blur-xl">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400/25 to-sky2-400/20 text-brand-300">
          {isIOS ? <Share size={20} /> : <Download size={20} />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-bold leading-tight text-slate-100">Install StudySentry</p>
          {isIOS ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] leading-snug text-slate-400">
              Tap the
              <Share size={12} className="inline shrink-0 text-sky2-400" aria-label="Share" />
              Share button, then
              <span className="inline-flex items-center gap-0.5 font-semibold text-slate-200">
                <SquarePlus size={12} className="inline" /> Add to Home Screen
              </span>
            </p>
          ) : canPromptInstall ? (
            <p className="mt-0.5 text-[11px] leading-snug text-slate-400">
              One tap and it lives on your home screen — fully offline.
            </p>
          ) : (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1 text-[11px] leading-snug text-slate-400">
              Open the browser menu
              <Menu size={12} className="inline shrink-0 text-slate-200" /> and choose
              <span className="font-semibold text-slate-200">“Add to Home screen”</span>
            </p>
          )}
        </div>

        {!isIOS && canPromptInstall && (
          <button
            onClick={onInstall}
            className="shrink-0 rounded-xl bg-gradient-to-r from-brand-400 to-sky2-500 px-3.5 py-2 text-xs font-bold text-ink-900 transition-all hover:brightness-110 active:scale-95"
          >
            Install
          </button>
        )}

        <button
          onClick={onDismiss}
          aria-label="Dismiss install banner"
          className="shrink-0 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
