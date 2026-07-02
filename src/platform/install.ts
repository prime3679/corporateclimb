// ─── INSTALL / STANDALONE ────────────────────────────────────
// Captures Chromium's beforeinstallprompt so the game can offer
// installation at a moment of its choosing, and detects when it is
// already running as an installed app (standalone display mode).

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferredPrompt: BeforeInstallPromptEvent | null = null
let registered = false

/** Must run before the browser fires the event — call from main.tsx. */
export function registerInstallCapture() {
  if (registered || typeof window === 'undefined') return
  registered = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as BeforeInstallPromptEvent
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
  })
}

/** True when the browser has offered installability and we hold the prompt. */
export function canInstall(): boolean {
  return deferredPrompt !== null
}

export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const evt = deferredPrompt
  if (!evt) return 'unavailable'
  deferredPrompt = null // Chromium only allows one prompt() per event
  try {
    await evt.prompt()
    return (await evt.userChoice).outcome
  } catch {
    return 'unavailable'
  }
}

/** Running as an installed app (home-screen launch)? */
export function isStandalone(): boolean {
  try {
    if (typeof window === 'undefined') return false
    if (window.matchMedia?.('(display-mode: standalone)').matches) return true
    return (navigator as { standalone?: boolean }).standalone === true
  } catch {
    return false
  }
}

/** iOS Safari never fires beforeinstallprompt — install is manual there. */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return (
    /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1)
  )
}
