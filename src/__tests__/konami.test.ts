import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  KONAMI_SEQUENCE,
  SIGN_TAPS_REQUIRED,
  advanceKonami,
  hasGoldenBadge,
  markGoldenBadgeFound,
} from '@/konami'

const runSequence = (keys: readonly string[], start = 0) =>
  keys.reduce((progress, key) => advanceKonami(progress, key), start)

describe('konami sequence tracker', () => {
  it('completes on the exact classic input', () => {
    expect(runSequence(KONAMI_SEQUENCE)).toBe(KONAMI_SEQUENCE.length)
  })

  it('matches letters case-insensitively (caps lock happens)', () => {
    const shouty = KONAMI_SEQUENCE.map((k) => (k.length === 1 ? k.toUpperCase() : k))
    expect(runSequence(shouty)).toBe(KONAMI_SEQUENCE.length)
  })

  it('survives an over-eager extra ArrowUp mid-prefix', () => {
    // ↑↑↑↓↓←→←→BA — the third ↑ must keep two matched, not reset to one.
    const keys = ['ArrowUp', ...KONAMI_SEQUENCE]
    expect(runSequence(keys)).toBe(KONAMI_SEQUENCE.length)
  })

  it('resets on a stray key, but a fresh ArrowUp restarts the attempt', () => {
    let progress = runSequence(['ArrowUp', 'ArrowUp', 'ArrowDown'])
    expect(progress).toBe(3)
    progress = advanceKonami(progress, 'Enter')
    expect(progress).toBe(0)
    expect(advanceKonami(progress, 'ArrowUp')).toBe(1)
  })

  it('a mismatched ArrowUp late in the sequence starts a new attempt', () => {
    const progress = runSequence(['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowUp'])
    expect(progress).toBe(1)
  })

  it('treats out-of-range progress as a fresh start', () => {
    expect(advanceKonami(KONAMI_SEQUENCE.length, 'ArrowUp')).toBe(1)
    expect(advanceKonami(-4, 'ArrowUp')).toBe(1)
  })

  it('keeps the touch fallback within a casual tapping burst', () => {
    expect(SIGN_TAPS_REQUIRED).toBeGreaterThan(2) // no accidental unlocks
    expect(SIGN_TAPS_REQUIRED).toBeLessThanOrEqual(10)
  })
})

describe('golden badge persistence', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips through storage', () => {
    expect(hasGoldenBadge()).toBe(false)
    markGoldenBadgeFound()
    expect(hasGoldenBadge()).toBe(true)
  })

  it('never throws when storage is unavailable', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('private browsing')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('private browsing')
    })
    try {
      expect(hasGoldenBadge()).toBe(false)
      expect(() => markGoldenBadgeFound()).not.toThrow()
    } finally {
      getItem.mockRestore()
      setItem.mockRestore()
    }
  })
})
