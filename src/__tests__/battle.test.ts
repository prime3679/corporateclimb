import { describe, it, expect } from 'vitest'
import {
  STRUGGLE_MOVE,
  calcDamage,
  chooseEnemyMove,
  getBurnDamage,
  getClassPerkMods,
  getStatusAtkMod,
  getStatusCritBonus,
  getStatusDefMod,
  type Rng,
} from '../battle'
import type { EnemyMove, StatusInstance } from '../types'

/** Rng stub that replays a fixed sequence (repeats the last value). */
const seq = (...values: number[]): Rng => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

const status = (id: StatusInstance['id']): StatusInstance => ({ id, turnsLeft: 2 })

// ─── calcDamage ──────────────────────────────────────────────
// Consumes two rng values per call: variance, then the crit check.

describe('calcDamage', () => {
  it('computes baseDmg * atk/def at neutral variance without a crit', () => {
    // variance = 0.85 + 0.5 * 0.3 = 1.0; crit check 0.99 ≥ 0.1 → no crit
    const [dmg, isCrit] = calcDamage(seq(0.5, 0.99), 100, 50, 20)
    expect(dmg).toBe(40) // 20 * (100/50) * 1.0
    expect(isCrit).toBe(false)
  })

  it('applies the 1.5x crit multiplier when the crit roll lands', () => {
    const [dmg, isCrit] = calcDamage(seq(0.5, 0.05), 100, 50, 20)
    expect(dmg).toBe(60) // 40 * 1.5
    expect(isCrit).toBe(true)
  })

  it('critBonus widens the crit window beyond the base 10%', () => {
    // 0.25 ≥ 0.1 (no crit normally) but < 0.1 + 0.2
    const [, noBonus] = calcDamage(seq(0.5, 0.25), 100, 50, 20)
    const [, withBonus] = calcDamage(seq(0.5, 0.25), 100, 50, 20, 0.2)
    expect(noBonus).toBe(false)
    expect(withBonus).toBe(true)
  })

  it('variance spans 0.85x to (just under) 1.15x', () => {
    const [min] = calcDamage(seq(0, 0.99), 100, 50, 20)
    const [max] = calcDamage(seq(0.9999, 0.99), 100, 50, 20)
    expect(min).toBe(34) // 40 * 0.85
    expect(max).toBe(46) // 40 * ~1.15
  })

  it('applies the type multiplier', () => {
    const [superEff] = calcDamage(seq(0.5, 0.99), 100, 50, 20, 0, 1.5)
    const [notEff] = calcDamage(seq(0.5, 0.99), 100, 50, 20, 0, 0.67)
    expect(superEff).toBe(60) // 40 * 1.5
    expect(notEff).toBe(27) // 40 * 0.67 = 26.8 → 27
  })

  it('never deals less than 1 damage', () => {
    const [dmg] = calcDamage(seq(0, 0.99), 1, 999, 1)
    expect(dmg).toBe(1)
  })

  it('floors atk and def stats at 1 so debuffs cannot go degenerate', () => {
    // Both floored to 1 → ratio 1 → dmg = baseDmg at neutral variance
    const [dmg] = calcDamage(seq(0.5, 0.99), -5, -10, 10)
    expect(dmg).toBe(10)
  })
})

// ─── Status modifiers ────────────────────────────────────────

describe('status modifiers', () => {
  it('motivated +4 ATK, micromanaged -4 ATK, and they cancel', () => {
    expect(getStatusAtkMod([status('motivated')])).toBe(4)
    expect(getStatusAtkMod([status('micromanaged')])).toBe(-4)
    expect(getStatusAtkMod([status('motivated'), status('micromanaged')])).toBe(0)
    expect(getStatusAtkMod([])).toBe(0)
  })

  it('caffeinated and demoralized each -3 DEF, stacking', () => {
    expect(getStatusDefMod([status('caffeinated')])).toBe(-3)
    expect(getStatusDefMod([status('demoralized')])).toBe(-3)
    expect(getStatusDefMod([status('caffeinated'), status('demoralized')])).toBe(-6)
  })

  it('focused grants +20% crit chance', () => {
    expect(getStatusCritBonus([status('focused')])).toBe(0.2)
    expect(getStatusCritBonus([status('motivated')])).toBe(0)
  })

  it('burned_out ticks 8 chip damage', () => {
    expect(getBurnDamage([status('burned_out')])).toBe(8)
    expect(getBurnDamage([])).toBe(0)
  })
})

// ─── Class perks ─────────────────────────────────────────────

describe('getClassPerkMods', () => {
  it('engineer gets +15% damage, designer +15% crit, others neither', () => {
    expect(getClassPerkMods('eng')).toEqual({ dmgMult: 1.15, critBonus: 0 })
    expect(getClassPerkMods('design')).toEqual({ dmgMult: 1, critBonus: 0.15 })
    expect(getClassPerkMods('pm')).toEqual({ dmgMult: 1, critBonus: 0 })
  })
})

// ─── chooseEnemyMove ─────────────────────────────────────────

describe('chooseEnemyMove', () => {
  const hit: EnemyMove = { name: 'Hit', dmg: 10 }
  const bigHit: EnemyMove = { name: 'Big Hit', dmg: 30 }
  const heal: EnemyMove = { name: 'Heal', dmg: 0, heal: 20 }
  const debuff: EnemyMove = {
    name: 'Debuff',
    dmg: 5,
    status: { id: 'demoralized', target: 'enemy' },
  }

  it('returns the only move without consuming rng', () => {
    const rng: Rng = () => {
      throw new Error('rng must not be called')
    }
    expect(chooseEnemyMove(rng, [hit], 1, 1, 0)).toBe(hit)
  })

  it('heals at low HP when the 70% roll succeeds', () => {
    expect(chooseEnemyMove(seq(0.5), [hit, heal], 0.3, 0.5, 0)).toBe(heal)
  })

  it('skips the heal when the roll fails, falling through to random', () => {
    // 0.8 ≥ 0.7 skips heal; 0.99 * 2 → index 1
    expect(chooseEnemyMove(seq(0.8, 0.99), [hit, heal], 0.3, 0.5, 1)).toBe(heal)
    expect(chooseEnemyMove(seq(0.8, 0), [hit, heal], 0.3, 0.5, 1)).toBe(hit)
  })

  it('opens with a debuff against a healthy, unafflicted player', () => {
    expect(chooseEnemyMove(seq(0.4), [hit, debuff], 1, 0.8, 0)).toBe(debuff)
  })

  it('does not debuff a player who already has a status', () => {
    // Debuff branch skipped entirely → single rng pick: 0 → index 0
    expect(chooseEnemyMove(seq(0), [hit, debuff], 1, 0.8, 1)).toBe(hit)
  })

  it('goes for the biggest hit when the player is nearly down', () => {
    const rng: Rng = () => {
      throw new Error('finisher must not consume rng')
    }
    expect(chooseEnemyMove(rng, [hit, bigHit], 1, 0.2, 1)).toBe(bigHit)
  })

  it('the heal check outranks the finisher', () => {
    expect(chooseEnemyMove(seq(0.1), [bigHit, heal], 0.2, 0.2, 1)).toBe(heal)
  })

  it('falls back to a uniform random pick', () => {
    expect(chooseEnemyMove(seq(0), [hit, bigHit, heal], 1, 0.5, 1)).toBe(hit)
    expect(chooseEnemyMove(seq(0.99), [hit, bigHit, heal], 1, 0.5, 1)).toBe(heal)
  })
})

// ─── Struggle ────────────────────────────────────────────────

describe('STRUGGLE_MOVE', () => {
  it('is a weak normal-type move with effectively infinite PP', () => {
    expect(STRUGGLE_MOVE.type).toBe('normal')
    expect(STRUGGLE_MOVE.dmg).toBe(5)
    expect(STRUGGLE_MOVE.pp).toBeGreaterThan(100)
  })
})
