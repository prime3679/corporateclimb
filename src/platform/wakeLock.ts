// ─── SCREEN WAKE LOCK ────────────────────────────────────────
// Keeps the display awake during battle. Everything is best-effort:
// the API is absent on older browsers and the OS may refuse or revoke
// the lock (low battery, backgrounding) at any time. lifecycle.ts
// re-acquires when the tab / app becomes visible again.

import { KeepAwake } from '@capacitor-community/keep-awake'
import { isNative } from './native'

let sentinel: WakeLockSentinel | null = null
let wanted = false
let nativeHeld = false

export const WakeLock = {
  get supported(): boolean {
    if (isNative()) return true
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator
  },

  async acquire() {
    wanted = true
    if (isNative()) {
      if (nativeHeld) return
      try {
        await KeepAwake.keepAwake()
        nativeHeld = true
      } catch {
        nativeHeld = false
      }
      return
    }
    if (!WakeLock.supported || sentinel) return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      sentinel.addEventListener('release', () => {
        sentinel = null
      })
    } catch {
      sentinel = null
    }
  },

  async release() {
    wanted = false
    if (isNative()) {
      nativeHeld = false
      try {
        await KeepAwake.allowSleep()
      } catch {
        /* already released */
      }
      return
    }
    const s = sentinel
    sentinel = null
    try {
      await s?.release()
    } catch {
      /* already released */
    }
  },

  /** Re-take a still-wanted lock (the OS drops it on backgrounding). */
  async reacquire() {
    if (!wanted) return
    if (isNative()) {
      if (!nativeHeld) await WakeLock.acquire()
      return
    }
    if (!sentinel) await WakeLock.acquire()
  },
}
