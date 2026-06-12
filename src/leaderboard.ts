// ─── DAILY LEADERBOARD CLIENT ───────────────────────────────
// Talks to /api/daily-leaderboard (a Vercel function backed by
// Upstash/Vercel KV). Everything degrades gracefully: when the API is
// absent (local dev) or unconfigured, fetches return null and the UI
// simply hides the leaderboard. Entering a handle is the opt-in for
// submitting scores.

export interface LeaderboardEntry {
  name: string
  classId: string
  floorsCleared: number
  won: boolean
  score: number
}

/** Generous theoretical ceiling for a 15-floor daily score. */
export const MAX_DAILY_SCORE = 8000
export const MAX_HANDLE_LENGTH = 12

const HANDLE_KEY = 'corporate-climb-handle'
const SUBMITTED_KEY = 'corporate-climb-lb-submitted'
const API = '/api/daily-leaderboard'
const TIMEOUT_MS = 4000

/** Display handles: letters, digits, space, _ and -, max 12 chars. */
export function sanitizeHandle(raw: string): string {
  return raw
    .replace(/[^a-zA-Z0-9 _-]/g, '')
    .trim()
    .slice(0, MAX_HANDLE_LENGTH)
}

/** Client-side mirror of the server's submission validation. */
export function isPlausibleSubmission(entry: LeaderboardEntry & { seed: number }): boolean {
  return (
    Number.isInteger(entry.seed) &&
    entry.seed > 20200101 &&
    sanitizeHandle(entry.name).length > 0 &&
    ['pm', 'eng', 'design'].includes(entry.classId) &&
    Number.isInteger(entry.floorsCleared) &&
    entry.floorsCleared >= 0 &&
    entry.floorsCleared <= 15 &&
    Number.isInteger(entry.score) &&
    entry.score >= 0 &&
    entry.score <= MAX_DAILY_SCORE
  )
}

export function getHandle(): string | null {
  try {
    const h = localStorage.getItem(HANDLE_KEY)
    return h ? sanitizeHandle(h) || null : null
  } catch {
    return null
  }
}

export function setHandle(name: string) {
  try {
    const clean = sanitizeHandle(name)
    if (clean) localStorage.setItem(HANDLE_KEY, clean)
  } catch {
    /* storage unavailable */
  }
}

export function hasSubmitted(seed: number): boolean {
  try {
    return localStorage.getItem(SUBMITTED_KEY) === String(seed)
  } catch {
    return false
  }
}

function markSubmitted(seed: number) {
  try {
    localStorage.setItem(SUBMITTED_KEY, String(seed))
  } catch {
    /* storage unavailable */
  }
}

function withTimeout(): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  return { signal: ctrl.signal, cancel: () => clearTimeout(id) }
}

/** Best-effort submit; resolves true when the server accepted it. */
export async function submitDailyScore(
  entry: LeaderboardEntry & { seed: number },
): Promise<boolean> {
  if (!isPlausibleSubmission(entry)) return false
  const t = withTimeout()
  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...entry, name: sanitizeHandle(entry.name) }),
      signal: t.signal,
    })
    if (res.ok) markSubmitted(entry.seed)
    return res.ok
  } catch {
    return false
  } finally {
    t.cancel()
  }
}

/** Top entries for a seed, or null when the API is unavailable. */
export async function fetchDailyLeaderboard(seed: number): Promise<LeaderboardEntry[] | null> {
  const t = withTimeout()
  try {
    const res = await fetch(`${API}?seed=${seed}`, { signal: t.signal })
    if (!res.ok) return null
    const data = (await res.json()) as { entries?: LeaderboardEntry[] }
    return Array.isArray(data.entries) ? data.entries : null
  } catch {
    return null
  } finally {
    t.cancel()
  }
}
