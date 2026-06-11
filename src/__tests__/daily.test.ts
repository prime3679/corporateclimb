import { describe, it, expect, beforeEach } from 'vitest'
import {
  createSeededRandom,
  getDailySeed,
  getDailyModifier,
  DAILY_MODIFIERS,
  getDailyFloorMap,
  calculateDailyScore,
  DAILY_FLOOR_COUNT,
  saveDailyResult,
  getDailyResult,
  hasPlayedToday,
  getDailyStreak,
  getRecentDailyHistory,
  buildShareGrid,
  getDailyDayNumber,
} from '@/daily'

describe('createSeededRandom', () => {
  it('produces deterministic sequence from same seed', () => {
    const rng1 = createSeededRandom(12345)
    const rng2 = createSeededRandom(12345)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).toEqual(seq2)
  })

  it('produces different sequences from different seeds', () => {
    const rng1 = createSeededRandom(12345)
    const rng2 = createSeededRandom(54321)
    const seq1 = Array.from({ length: 10 }, () => rng1())
    const seq2 = Array.from({ length: 10 }, () => rng2())
    expect(seq1).not.toEqual(seq2)
  })

  it('returns values between 0 and 1', () => {
    const rng = createSeededRandom(99999)
    for (let i = 0; i < 100; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('getDailySeed', () => {
  it('returns same seed for same date', () => {
    const s1 = getDailySeed(new Date('2026-03-16'))
    const s2 = getDailySeed(new Date('2026-03-16'))
    expect(s1).toBe(s2)
  })

  it('returns different seed for different dates', () => {
    const s1 = getDailySeed(new Date('2026-03-16'))
    const s2 = getDailySeed(new Date('2026-03-17'))
    expect(s1).not.toBe(s2)
  })
})

describe('getDailyModifier', () => {
  it('returns same modifier for same seed', () => {
    const m1 = getDailyModifier(20260316)
    const m2 = getDailyModifier(20260316)
    expect(m1.id).toBe(m2.id)
  })

  it('returns a valid modifier', () => {
    const m = getDailyModifier(20260316)
    expect(DAILY_MODIFIERS.find((mod) => mod.id === m.id)).toBeDefined()
  })
})

describe('getDailyFloorMap', () => {
  it('returns exactly DAILY_FLOOR_COUNT floors', () => {
    const floors = getDailyFloorMap(20260316)
    expect(floors.length).toBe(DAILY_FLOOR_COUNT)
  })

  it('returns same mapping for same seed', () => {
    const f1 = getDailyFloorMap(20260316)
    const f2 = getDailyFloorMap(20260316)
    expect(f1).toEqual(f2)
  })

  it('picks from harder pools (floor index >= 4)', () => {
    const floors = getDailyFloorMap(20260316)
    floors.forEach((f) => {
      expect(f).toBeGreaterThanOrEqual(4)
    })
  })
})

describe('calculateDailyScore', () => {
  it('rewards winning', () => {
    const won = calculateDailyScore({
      floorsCleared: 15,
      totalTurns: 40,
      totalDamageDealt: 2000,
      hpRemaining: 50,
      won: true,
    })
    const lost = calculateDailyScore({
      floorsCleared: 10,
      totalTurns: 40,
      totalDamageDealt: 2000,
      hpRemaining: 0,
      won: false,
    })
    expect(won).toBeGreaterThan(lost)
  })

  it('penalizes slow play', () => {
    const fast = calculateDailyScore({
      floorsCleared: 15,
      totalTurns: 30,
      totalDamageDealt: 2000,
      hpRemaining: 50,
      won: true,
    })
    const slow = calculateDailyScore({
      floorsCleared: 15,
      totalTurns: 80,
      totalDamageDealt: 2000,
      hpRemaining: 50,
      won: true,
    })
    expect(fast).toBeGreaterThan(slow)
  })
})

describe('daily result persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('saves and retrieves a daily result', () => {
    const result = {
      seed: 20260316,
      classId: 'pm',
      score: 3500,
      floorsCleared: 15,
      totalTurns: 35,
      totalDamageDealt: 2500,
      hpRemaining: 40,
      won: true,
      modifierId: 'crunch_time',
    }
    saveDailyResult(result)
    const loaded = getDailyResult(20260316)
    expect(loaded).toEqual(result)
  })

  it('hasPlayedToday returns false when no result', () => {
    expect(hasPlayedToday()).toBe(false)
  })

  it("hasPlayedToday returns true after saving today's result", () => {
    const seed = getDailySeed()
    saveDailyResult({
      seed,
      classId: 'pm',
      score: 1000,
      floorsCleared: 5,
      totalTurns: 20,
      totalDamageDealt: 800,
      hpRemaining: 0,
      won: false,
      modifierId: 'all_hands',
    })
    expect(hasPlayedToday()).toBe(true)
  })
})

describe('daily streaks and history', () => {
  beforeEach(() => localStorage.clear())

  const stub = (seed: number) =>
    saveDailyResult({
      seed,
      classId: 'pm',
      score: 100,
      floorsCleared: 3,
      totalTurns: 10,
      totalDamageDealt: 100,
      hpRemaining: 1,
      won: false,
      modifierId: 'all_hands',
    })

  it('returns zero streak with no results', () => {
    expect(getDailyStreak(new Date(2026, 5, 11))).toEqual({ current: 0, best: 0 })
  })

  it('counts a streak ending today', () => {
    stub(20260609)
    stub(20260610)
    stub(20260611)
    expect(getDailyStreak(new Date(2026, 5, 11))).toEqual({ current: 3, best: 3 })
  })

  it("keeps the streak alive before today's attempt", () => {
    stub(20260609)
    stub(20260610)
    expect(getDailyStreak(new Date(2026, 5, 11))).toEqual({ current: 2, best: 2 })
  })

  it('a gap breaks the current streak but best remembers', () => {
    stub(20260601)
    stub(20260602)
    stub(20260603)
    stub(20260611)
    expect(getDailyStreak(new Date(2026, 5, 11))).toEqual({ current: 1, best: 3 })
  })

  it('streak counts across a month boundary', () => {
    stub(20260531)
    stub(20260601)
    expect(getDailyStreak(new Date(2026, 5, 1))).toEqual({ current: 2, best: 2 })
  })

  it('recent history returns one slot per day, oldest first', () => {
    stub(20260610)
    const h = getRecentDailyHistory(3, new Date(2026, 5, 11))
    expect(h.map((x) => x.seed)).toEqual([20260609, 20260610, 20260611])
    expect(h.map((x) => !!x.result)).toEqual([false, true, false])
  })
})

describe('share grid', () => {
  it('renders a loss as greens, one red, then black', () => {
    expect(buildShareGrid(7, false)).toBe('🟩🟩🟩🟩🟩\n🟩🟩🟥⬛⬛\n⬛⬛⬛⬛⬛')
  })

  it('renders a full clear as all green', () => {
    expect(buildShareGrid(15, true)).toBe('🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩\n🟩🟩🟩🟩🟩')
  })

  it('renders an instant loss with a leading red square', () => {
    expect(buildShareGrid(0, false)).toBe('🟥⬛⬛⬛⬛\n⬛⬛⬛⬛⬛\n⬛⬛⬛⬛⬛')
  })

  it('day number is derived from the seed date', () => {
    expect(getDailyDayNumber(20260317)).toBe(1)
    expect(getDailyDayNumber(20260318)).toBe(2)
  })
})
