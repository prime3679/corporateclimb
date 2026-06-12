// ─── DAILY LEADERBOARD CLIENT ───────────────────────────────
// Sanitization, plausibility bounds (the client mirror of the API's
// validation), opt-in handle persistence, and graceful degradation
// when the API is missing.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  MAX_DAILY_SCORE,
  fetchDailyLeaderboard,
  getHandle,
  hasSubmitted,
  isPlausibleSubmission,
  sanitizeHandle,
  setHandle,
  submitDailyScore,
} from '@/leaderboard'

const ENTRY = {
  seed: 20260612,
  name: 'Climber',
  classId: 'pm',
  floorsCleared: 12,
  won: false,
  score: 2500,
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('sanitizeHandle', () => {
  it('strips markup and emoji, trims, and caps length', () => {
    expect(sanitizeHandle('<script>alert(1)</script>')).toBe('scriptalert1')
    expect(sanitizeHandle('  Big Boss 🚀  ')).toBe('Big Boss')
    expect(sanitizeHandle('a'.repeat(40))).toHaveLength(12)
    expect(sanitizeHandle('!!!')).toBe('')
  })
})

describe('isPlausibleSubmission', () => {
  it('accepts a sane entry', () => {
    expect(isPlausibleSubmission(ENTRY)).toBe(true)
  })

  it.each([
    { patch: { score: MAX_DAILY_SCORE + 1 }, why: 'score above ceiling' },
    { patch: { score: -5 }, why: 'negative score' },
    { patch: { score: 12.5 }, why: 'fractional score' },
    { patch: { floorsCleared: 16 }, why: 'too many floors' },
    { patch: { classId: 'ceo' }, why: 'unknown class' },
    { patch: { name: '🤖🤖' }, why: 'name sanitizes to empty' },
    { patch: { seed: 999 }, why: 'implausible seed' },
  ])('rejects $why', ({ patch }) => {
    expect(isPlausibleSubmission({ ...ENTRY, ...patch })).toBe(false)
  })
})

describe('handle persistence', () => {
  it('stores a sanitized handle and survives garbage', () => {
    setHandle('  CEO <b>Material</b> ')
    expect(getHandle()).toBe('CEO bMateria')
    setHandle('💥💥')
    expect(getHandle()).toBe('CEO bMateria') // garbage doesn't overwrite
  })
})

describe('network behavior', () => {
  it('submit marks the seed as submitted on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }))
    expect(hasSubmitted(ENTRY.seed)).toBe(false)
    expect(await submitDailyScore(ENTRY)).toBe(true)
    expect(hasSubmitted(ENTRY.seed)).toBe(true)
  })

  it('submit never throws when the API is down', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await submitDailyScore(ENTRY)).toBe(false)
    expect(hasSubmitted(ENTRY.seed)).toBe(false)
  })

  it('rejects implausible entries before any network call', async () => {
    const spy = vi.fn()
    vi.stubGlobal('fetch', spy)
    expect(await submitDailyScore({ ...ENTRY, score: 999999 })).toBe(false)
    expect(spy).not.toHaveBeenCalled()
  })

  it('fetch returns entries on success and null on failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ entries: [{ ...ENTRY, name: 'Rival' }] }),
      }),
    )
    const entries = await fetchDailyLeaderboard(ENTRY.seed)
    expect(entries).toHaveLength(1)
    expect(entries![0].name).toBe('Rival')

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    expect(await fetchDailyLeaderboard(ENTRY.seed)).toBeNull()

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    expect(await fetchDailyLeaderboard(ENTRY.seed)).toBeNull()
  })
})
