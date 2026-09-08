// ─── HAPTICS ─────────────────────────────────────────────────
// Web adapter over navigator.vibrate, silent when unsupported.
// Native shell swaps to @capacitor/haptics; the exported surface is
// the contract (see docs/PLATFORM.md).

import { Haptics as CapHaptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './native'

type Impact = 'light' | 'medium' | 'heavy'

const IMPACT_MS: Record<Impact, number> = {
  light: 10,
  medium: 20,
  heavy: 35,
}

const IMPACT_STYLE: Record<Impact, ImpactStyle> = {
  light: ImpactStyle.Light,
  medium: ImpactStyle.Medium,
  heavy: ImpactStyle.Heavy,
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

function nativeCall(run: () => Promise<void>) {
  if (!_enabled) return
  void run().catch(() => {
    /* haptics are best-effort */
  })
}

export const Haptics = {
  get supported(): boolean {
    if (isNative()) return true
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
    if (isNative()) {
      nativeCall(() => CapHaptics.selectionChanged())
      return
    }
    vibrate(8)
  },

  /** Combat beats: light for dealt hits, medium taken, heavy crit/faint. */
  impact(strength: Impact = 'light') {
    if (isNative()) {
      nativeCall(() => CapHaptics.impact({ style: IMPACT_STYLE[strength] }))
      return
    }
    vibrate(IMPACT_MS[strength])
  },

  success() {
    if (isNative()) {
      nativeCall(() => CapHaptics.notification({ type: NotificationType.Success }))
      return
    }
    vibrate([15, 40, 25])
  },

  warning() {
    if (isNative()) {
      nativeCall(() => CapHaptics.notification({ type: NotificationType.Warning }))
      return
    }
    vibrate([30, 50, 30])
  },
}
