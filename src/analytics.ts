// ─── ANALYTICS ───────────────────────────────────────────────
// Player signal. Dependency-free PostHog capture over fetch, in the
// style of api/daily-leaderboard.js (no SDK, nothing to precache, no
// bundle growth). Silent no-op unless VITE_POSTHOG_KEY is set at build
// time, so dev servers, e2e runs and forks never phone home.
//
// What we want to learn, and the event that answers it:
//   Does anyone arrive?           title_view
//   Which mode do they pick?      mode_start   { mode: office | classic | daily }
//   Do they reach a fight?        office_fight_start / office_fight_won / office_fight_lost
//   Where do they stop?           office_floor_cleared { floor }, run_end { screen }
//   Do they share or install?     share { result }, install { outcome }
//   Does it crash?                error { message, where }
//
// Privacy posture: anonymous id only (random, stored locally), no names,
// no IP-based geo beyond what PostHog does server-side, honours Do Not
// Track and the Global Privacy Control signal. Never fires in the native
// shell until the store-build privacy copy exists (docs/PLATFORM.md).

import { isNative } from './platform/native'

export type AnalyticsEvent =
  | 'title_view'
  | 'mode_start'
  | 'screen_view'
  | 'office_fight_start'
  | 'office_fight_won'
  | 'office_fight_lost'
  | 'office_floor_cleared'
  | 'run_end'
  | 'share'
  | 'install'
  | 'error'

type Props = Record<string, string | number | boolean | null | undefined>

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const HOST = (
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'
).replace(/\/$/, '')
const ID_STORAGE_KEY = 'corporate-climb-anon-id'

let enabledOverride: boolean | null = null
let cachedId: string | null = null

/** Tests and the Settings privacy toggle can force analytics on/off. */
export function setAnalyticsEnabled(on: boolean | null) {
  enabledOverride = on
}

function dntOff(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return navigator.doNotTrack === '1' || nav.globalPrivacyControl === true
}

export function analyticsEnabled(): boolean {
  if (enabledOverride !== null) return enabledOverride
  if (!KEY) return false
  if (isNative()) return false
  return !dntOff()
}

function anonId(): string {
  if (cachedId) return cachedId
  let id: string | null = null
  try {
    id = localStorage.getItem(ID_STORAGE_KEY)
  } catch {
    /* private browsing: fall through to a session-only id */
  }
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    try {
      localStorage.setItem(ID_STORAGE_KEY, id)
    } catch {
      /* fine — the id lives for this session only */
    }
  }
  cachedId = id
  return id
}

function baseProps(): Props {
  if (typeof window === 'undefined') return {}
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  return {
    $current_url: window.location.href,
    $screen_width: window.innerWidth,
    $screen_height: window.innerHeight,
    standalone,
    build: (import.meta.env.VITE_BUILD_SHA as string | undefined) ?? 'dev',
  }
}

/**
 * Fire-and-forget capture. Never throws, never awaits — a lost event is
 * cheaper than a stalled frame. `keepalive` lets run_end / share events
 * survive a tab close.
 */
export function track(event: AnalyticsEvent, props: Props = {}) {
  if (!analyticsEnabled()) return
  try {
    const body = JSON.stringify({
      api_key: KEY,
      event,
      distinct_id: anonId(),
      timestamp: new Date().toISOString(),
      properties: { ...baseProps(), ...props },
    })
    void fetch(`${HOST}/i/v0/e/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {})
  } catch {
    /* analytics is best-effort */
  }
}

/** Map a screen transition to the coarse funnel events we care about. */
export function trackScreenChange(prev: string, next: string) {
  if (prev === next) return
  track('screen_view', { screen: next, from: prev })
  if (next === 'officeClassSelect' || next === 'officeStart')
    track('mode_start', { mode: 'office' })
  else if (next === 'classSelect') track('mode_start', { mode: 'classic' })
  else if (next === 'dailyPre') track('mode_start', { mode: 'daily' })
  else if (next === 'gameOver' || next === 'win' || next === 'dailyResult')
    track('run_end', { screen: next, mode: next === 'dailyResult' ? 'daily' : 'classic' })
}

/** Global crash + rejection capture. Call once at boot. */
export function registerErrorCapture() {
  if (typeof window === 'undefined') return
  window.addEventListener('error', (e) => {
    track('error', {
      where: 'window',
      message: String(e.message ?? '').slice(0, 300),
      source: `${e.filename ?? ''}:${e.lineno ?? 0}`,
    })
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = (e as PromiseRejectionEvent).reason as { message?: string } | string | undefined
    const message = typeof reason === 'string' ? reason : (reason?.message ?? 'unhandled rejection')
    track('error', { where: 'promise', message: String(message).slice(0, 300) })
  })
}

/**
 * Vercel Web Analytics — the plain-HTML integration (no npm package, so
 * the lockfile stays untouched). Loads only in production web builds; the
 * dashboard toggle in Vercel → Project → Analytics must be on for the
 * script to exist. Harmless 404 otherwise.
 */
export function injectVercelAnalytics() {
  if (typeof document === 'undefined') return
  if (!import.meta.env.PROD || isNative() || dntOff()) return
  const w = window as Window & { va?: (...args: unknown[]) => void; vaq?: unknown[] }
  w.va =
    w.va ||
    function (...args: unknown[]) {
      ;(w.vaq = w.vaq || []).push(args)
    }
  const s = document.createElement('script')
  s.defer = true
  s.src = '/_vercel/insights/script.js'
  document.head.appendChild(s)
}
