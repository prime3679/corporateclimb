// ─── SCREEN WAKE LOCK ────────────────────────────────────────
// Keeps the display awake during battle. Everything is best-effort:
// the API is absent on older browsers and the OS may refuse or revoke
// the lock (low battery, backgrounding) at any time. lifecycle.ts
// re-acquires when the tab becomes visible again.

let sentinel: WakeLockSentinel | null = null
let wanted = false

export const WakeLock = {
  get supported(): boolean {
    return typeof navigator !== 'undefined' && 'wakeLock' in navigator
  },

  async acquire() {
    wanted = true
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
    if (wanted && !sentinel) await WakeLock.acquire()
  },
}
