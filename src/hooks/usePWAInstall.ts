import { useCallback, useEffect, useMemo, useState } from 'react'
import type { BeforeInstallPromptEvent } from '../types'
import { STORAGE_KEYS } from '../lib/storage'
import { useLocalStorage } from './useLocalStorage'

export type InstallPlatform = 'ios-safari' | 'android-chromium' | 'chromium-desktop' | 'other'

export interface UsePWAInstallResult {
  /** iOS Safari / Android Chrome / etc. */
  platform: InstallPlatform
  /** Running as an installed PWA right now. */
  isStandalone: boolean
  /** A Chromium `beforeinstallprompt` event is captured and ready. */
  canPromptInstall: boolean
  /** Show the install banner/button (not installed, not dismissed, installable or iOS). */
  showPrompt: boolean
  /** Fire the native install prompt. Resolves to true when accepted. */
  promptInstall: () => Promise<boolean>
  /** Permanently hide the install UI for this device. */
  dismiss: () => void
  /** Bring the install UI back (e.g. from settings). */
  undismiss: () => void
}

function detectPlatform(ua: string): InstallPlatform {
  const s = ua.toLowerCase()
  const isIOS =
    /iphone|ipad|ipod/.test(s) || (/macintosh/.test(s) && navigatorMaxTouchPoints() > 1)
  if (isIOS) return 'ios-safari'
  if (/android/.test(s)) return 'android-chromium'
  if (/chrome|chromium|edg|samsungbrowser/.test(s)) return 'chromium-desktop'
  return 'other'
}

function navigatorMaxTouchPoints(): number {
  return typeof navigator !== 'undefined' ? navigator.maxTouchPoints ?? 0 : 0
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const byMedia = window.matchMedia?.('(display-mode: standalone)')?.matches ?? false
  // iOS Safari exposes navigator.standalone (non-standard).
  const byIOS = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return byMedia || byIOS
}

/**
 * Tracks PWA installability: captures `beforeinstallprompt` on Chromium,
 * detects iOS Safari (which has no prompt API and needs manual instructions),
 * and remembers whether the user dismissed the install UI.
 */
export function usePWAInstall(): UsePWAInstallResult {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState<boolean>(() => detectStandalone())
  const [dismissed, setDismissed] = useLocalStorage<boolean>(STORAGE_KEYS.installDismissed, false)

  const platform = useMemo(
    () => detectPlatform(typeof navigator !== 'undefined' ? navigator.userAgent : ''),
    [],
  )

  useEffect(() => {
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }
    const onAppInstalled = () => {
      setDeferredPrompt(null)
      setIsStandalone(true)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.addEventListener('appinstalled', onAppInstalled)

    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onModeChange = () => setIsStandalone(detectStandalone())
    mq?.addEventListener?.('change', onModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
      window.removeEventListener('appinstalled', onAppInstalled)
      mq?.removeEventListener?.('change', onModeChange)
    }
  }, [])

  const canPromptInstall = deferredPrompt !== null && !isStandalone
  const showPrompt =
    !isStandalone && !dismissed && (canPromptInstall || platform === 'ios-safari')

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (choice.outcome === 'accepted') setIsStandalone(true)
      return choice.outcome === 'accepted'
    } catch (error) {
      console.warn('[usePWAInstall] prompt() failed', error)
      setDeferredPrompt(null)
      return false
    }
  }, [deferredPrompt])

  const dismiss = useCallback(() => setDismissed(true), [setDismissed])
  const undismiss = useCallback(() => setDismissed(false), [setDismissed])

  return {
    platform,
    isStandalone,
    canPromptInstall,
    showPrompt,
    promptInstall,
    dismiss,
    undismiss,
  }
}
