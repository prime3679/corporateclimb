// ─── ANALYTICS ───────────────────────────────────────────────
// Player signal. Dependency-free PostHog capture over fetch, in the
// style of api/daily-leaderboard.js (no SDK, nothing to precache, no
// bundle growth). Silent no-op unless VITE_POSTHOG_KEY is set at build
// time, so dev servers, e2e runs and forks never phone home.
//
// What we want to learn, and the event that answers it:
//   Does anyone arrive?           title_view
//   Which mode do they pick?      mode_start   { mode: office | classic | daily }
//   Did a real play start?        climb_start  { mode }  — not a title bounce
//   Do they reach a fight?        office_fight_start / office_fight_won / office_fight_lost
//   Which floor did they clear?   floor_clear  { floor }  (Office celebration)
//   Where do they stop?           run_end { result: win | loss, screen, mode }
//   Did a daily finish?           daily_complete { result }
//   Did they tap the tip?         tip_click
//   Do they share or install?     share { result }, install { outcome }
//   Does it crash?                error { message, where }
//
// Privacy posture: anonymous id only (random, stored locally), no names,
// no IP-based geo beyond what PostHog does server-side, honours Do Not
// Track and the Global Privacy Control signal. Never fires in the native
// shell until the store-build privacy copy exists (docs/PLATFORM.md).

import { isNative } from './platform/native'

export type RunEndResult = 'win' | 'loss'

export type SessionExtras = {
  result?: RunEndResult
}

export type AnalyticsEvent =
  | 'title_view'
  | 'mode_start'
  | 'screen_view'
  | 'climb_start'
  | 'office_fight_start'
  | 'office_fight_won'
  | 'office_fight_lost'
  | 'floor_clear'
  | 'run_end'
  | 'daily_complete'
  | 'tip_click'
  | 'share'
  | 'install'
  | 'error'

/** Menu / interstitial screens — bouncing these is not a climb. */
const MENU_SCREENS = new Set([
  'title',
  'officeClassSelect',
  'officeStart',
  'classSelect',
  'dailyPre',
  'codex',
])

/** First screen of an actual run. Continue-from-title lands here too. */
const PLAY_ENTRY_SCREENS = new Set([
  'office',
  'floorIntro',
  'battle',
  'hallwayEvent',
  'routeChoice',
  'elevator',
  'treasure',
  'promotion',
  'shop',
  'actTransition',
])

const END_SCREENS = new Set(['win', 'gameOver', 'dailyResult'])

function climbMode(prev: string, next: string): 'office' | 'classic' | 'daily' {
  if (next === 'office' || prev === 'officeClassSelect' || prev === 'officeStart') return 'office'
  if (prev === 'dailyPre' || prev === 'dailyResult') return 'daily'
  return 'classic'
}

function runEndResult(next: string, extras: SessionExtras): RunEndResult | undefined {
  if (extras.result) return extras.result
  if (next === 'win') return 'win'
  if (next === 'gameOver') return 'loss'
  return undefined
}

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
export function trackScreenChange(prev: string, next: string, extras: SessionExtras = {}) {
  if (prev === next) return
  track('screen_view', { screen: next, from: prev })
  if (next === 'officeClassSelect' || next === 'officeStart')
    track('mode_start', { mode: 'office' })
  else if (next === 'classSelect') track('mode_start', { mode: 'classic' })
  else if (next === 'dailyPre') track('mode_start', { mode: 'daily' })

  // Real play, not a title / settings / class-select bounce.
  if ((MENU_SCREENS.has(prev) || END_SCREENS.has(prev)) && PLAY_ENTRY_SCREENS.has(next)) {
    track('climb_start', { mode: climbMode(prev, next) })
  }

  if (next === 'gameOver' || next === 'win' || next === 'dailyResult') {
    const result = runEndResult(next, extras)
    track('run_end', {
      screen: next,
      mode: next === 'dailyResult' ? 'daily' : 'classic',
      result,
    })
    if (next === 'dailyResult') track('daily_complete', result ? { result } : {})
  }
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
  if (!import.meta.env.PROD || isNative() || dntOff() || enabledOverride === false) return
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
