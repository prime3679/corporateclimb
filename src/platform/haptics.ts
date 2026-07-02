// ─── HAPTICS ─────────────────────────────────────────────────
// Web adapter over navigator.vibrate, silent when unsupported.
// iOS Safari has no vibration API — taps stay silent there until the
// Capacitor build swaps this adapter for @capacitor/haptics (the
// exported surface is the contract; see docs/PLATFORM.md).

type Impact = 'light' | 'medium' | 'heavy'

const IMPACT_MS: Record<Impact, number> = {
  light: 10,
  medium: 20,
  heavy: 35,
}

let _enabled = true

function vibrate(pattern: number | number[]) {
  if (!_enabled) return
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern)
  } catch {
    /* haptics are best-effort */
  }
}

export const Haptics = {
  get supported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator
  },

  get enabled(): boolean {
    return _enabled
  },

  setEnabled(enabled: boolean) {
    _enabled = enabled
    if (!enabled) {
      try {
        navigator.vibrate?.(0) // cancel anything in flight
      } catch {
        /* best-effort */
      }
    }
  },

  /** Subtle tick for UI taps and selections. */
  selection() {
    vibrate(8)
  },

  /** Combat beats: light for dealt hits, medium taken, heavy crit/faint. */
  impact(strength: Impact = 'light') {
    vibrate(IMPACT_MS[strength])
  },

  success() {
    vibrate([15, 40, 25])
  },

  warning() {
    vibrate([30, 50, 30])
  },
}
