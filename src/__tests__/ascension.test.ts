// ─── THE RE-ORG (ascension) ─────────────────────────────────
// The effects fold, enemy scaling, engine knobs, smart AI behaviors,
// the v7 save migration, and ladder progress persistence.

import { beforeEach, describe, expect, it } from 'vitest'
import {
  ASCENSION_TIERS,
  MAX_ASCENSION,
  PLAYER_CLASSES,
  getAscensionTier,
  getClassAscension,
  getBestAscension,
  recordAscensionWin,
} from '@/data'
import {
  BASE_POOLS,
  applyPostBattlePerk,
  applyPromotionHeal,
  applyVictory,
  ascensionEffects,
  loadRun,
  newDailyRun,
  newNgPlusRun,
  newRun,
  resolveNgBaseEnemy,
  wellnessPrice,
  SAVE_KEY,
} from '@/engine'
import { chooseEnemyMoveSmart } from '@/battle'
import type { EnemyMove, StatusInstance } from '@/types'

const cls = PLAYER_CLASSES[0]

describe('ascension effects fold', () => {
  it('level 0 is a strict identity', () => {
    const eff = ascensionEffects(0)
    expect(eff.enemyHpMult).toBe(1)
    expect(eff.enemyAtkMult).toBe(1)
    expect(eff.eliteHpMult).toBe(1.35)
    expect(eff.eliteAtkMult).toBe(1.15)
    expect(eff.promotionHealFraction).toBe(1)
    expect(eff.levelUpHeal).toBe(20)
    expect(eff.payoutMult).toBe(1)
    expect(eff.itemDmgMult).toBe(1)
    expect(eff.smartAiTier).toBe(0)
    expect(eff.bossPhase2Threshold).toBe(0.5)
    expect(eff.bossDmgMult).toBe(1)
  })

  it('tiers stack cumulatively', () => {
    expect(ascensionEffects(1).enemyHpMult).toBeCloseTo(1.1)
    expect(ascensionEffects(3).smartAiTier).toBe(1)
    expect(ascensionEffects(7).smartAiTier).toBe(2)
    expect(ascensionEffects(4).promotionHealFraction).toBe(0.5)
    expect(ascensionEffects(5).eliteHpMult).toBe(1.5)
    expect(ascensionEffects(6).payoutMult).toBe(0.75)
    expect(ascensionEffects(9).bossPhase2Threshold).toBe(0.6)
    // Tier 10 compounds the tier-1/2 multipliers again.
    expect(ascensionEffects(10).enemyHpMult).toBeCloseTo(1.1 * 1.1)
    expect(ascensionEffects(10).itemDmgMult).toBe(0.5)
  })

  it('clamps above the cap and the table is well-formed', () => {
    expect(ascensionEffects(99)).toEqual(ascensionEffects(MAX_ASCENSION))
    expect(ASCENSION_TIERS).toHaveLength(MAX_ASCENSION)
    ASCENSION_TIERS.forEach((t, i) => {
      expect(t.level).toBe(i + 1)
      expect(t.name.length).toBeGreaterThan(0)
      expect(getAscensionTier(t.level)).toBe(t)
    })
    expect(getAscensionTier(0)).toBeNull()
  })
})

describe('ascension in the engine', () => {
  it('scales enemies up the ladder but not at level 0', () => {
    // Pin the variant roll (empty list falls back to the canonical
    // floor enemy) so all three runs resolve the same opponent.
    const at = (asc: number) => ({ ...newRun(cls, BASE_POOLS, asc), floorEnemyIds: [] })
    const base = resolveNgBaseEnemy(at(0))
    const r1 = resolveNgBaseEnemy(at(1))
    const r2 = resolveNgBaseEnemy(at(2))
    expect(r1.maxHp).toBe(Math.round(base.maxHp * 1.1))
    expect(r1.atk).toBe(base.atk)
    expect(r2.atk).toBe(Math.round(base.atk * 1.1))
  })

  it('halves the promotion heal under Hiring Freeze', () => {
    const hurt = { ...newRun(cls, BASE_POOLS, 0), hp: 10 }
    expect(applyPromotionHeal(hurt, 100).hp).toBe(100)
    const frozen = { ...newRun(cls, BASE_POOLS, 4), hp: 10 }
    expect(applyPromotionHeal(frozen, 100).hp).toBe(60)
    expect(applyPromotionHeal({ ...frozen, hp: 80 }, 100).hp).toBe(100)
  })

  it('cuts payouts and level-up heal on high tiers', () => {
    const base = { ...newRun(cls, BASE_POOLS, 0), xp: 0, xpToNext: 1, hp: 1 }
    const audit = { ...newRun(cls, BASE_POOLS, 8), xp: 0, xpToNext: 1, hp: 1 }
    const a = applyVictory(base, 200)
    const b = applyVictory(audit, 200)
    expect(b.optionsGained).toBe(Math.round(a.optionsGained * 0.75))
    expect(a.run.hp).toBe(1 + 20)
    expect(b.run.hp).toBe(1 + 10)
  })

  it('halves post-battle healing at tier 8 (PM perk)', () => {
    const pm = PLAYER_CLASSES.find((c) => c.id === 'pm')!
    const base = { ...newRun(pm, BASE_POOLS, 0), hp: 10 }
    const audit = { ...newRun(pm, BASE_POOLS, 8), hp: 10 }
    expect(applyPostBattlePerk(base, 100).hp).toBe(15)
    expect(applyPostBattlePerk(audit, 100).hp).toBe(13)
  })

  it('surcharges Wellness Day under Budget Scrutiny', () => {
    const base = newRun(cls, BASE_POOLS, 0)
    const audited = newRun(cls, BASE_POOLS, 6)
    expect(wellnessPrice(audited)).toBe(Math.round(wellnessPrice(base) * 1.5))
  })

  it('NG+ carries the tier, dailies pin it to 0', () => {
    const run = newRun(cls, BASE_POOLS, 5)
    expect(newNgPlusRun(run, cls).ascension).toBe(5)
    expect(newDailyRun(cls).ascension).toBe(0)
  })
})

describe('save v7 migration', () => {
  beforeEach(() => localStorage.clear())

  it('lifts a v6 save to ascension 0', () => {
    const { ascension: _drop, ...v6run } = newRun(cls)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 6, run: v6run }))
    const loaded = loadRun()
    expect(loaded).not.toBeNull()
    expect(loaded!.ascension).toBe(0)
  })

  it('rejects an out-of-range ascension', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({ version: 7, run: { ...newRun(cls), ascension: 99 } }),
    )
    expect(loadRun()).toBeNull()
  })

  it('round-trips a v7 save', () => {
    const run = newRun(cls, BASE_POOLS, 3)
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 7, run }))
    expect(loadRun()!.ascension).toBe(3)
  })
})

describe('smart enemy AI', () => {
  const noStatuses: StatusInstance[] = []
  const mkOpts = (over: Partial<Parameters<typeof chooseEnemyMoveSmart>[2]> = {}) => ({
    tier: 1 as 1 | 2,
    enemyHpPct: 1,
    enemyMissingHp: 0,
    playerHpPct: 1,
    playerStatuses: noStatuses,
    enemyStatuses: noStatuses,
    playerHp: 100,
    expectedDamage: (m: EnemyMove) => m.dmg,
    ...over,
  })

  const jab: EnemyMove = { name: 'Jab', dmg: 10, type: 'normal' }
  const nuke: EnemyMove = { name: 'Nuke', dmg: 40, type: 'normal' }
  const heal: EnemyMove = { name: 'Heal', dmg: 0, type: 'normal', heal: 30 }

  it('tier 1 weights moves by expected damage against the player', () => {
    // Type-awareness arrives through expectedDamage: make the jab
    // super-effective and the nuke resisted.
    const expectedDamage = (m: EnemyMove) => (m.name === 'Jab' ? m.dmg * 4 : m.dmg * 0.5)
    const picks = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const rngVal = i / 20
      picks.add(chooseEnemyMoveSmart(() => rngVal, [jab, nuke], mkOpts({ expectedDamage })).name)
    }
    // The boosted jab must be the majority pick (top-1 of the top-2 draw).
    let jabCount = 0
    for (let i = 0; i < 20; i++) {
      const rngVal = i / 20
      if (
        chooseEnemyMoveSmart(() => rngVal, [jab, nuke], mkOpts({ expectedDamage })).name === 'Jab'
      )
        jabCount++
    }
    expect(jabCount).toBeGreaterThan(10)
  })

  it('tier 2 takes a guaranteed kill', () => {
    const pick = chooseEnemyMoveSmart(
      () => 0.99,
      [jab, nuke],
      mkOpts({ tier: 2, playerHp: 12 }), // jab min roll 8.5 < 12, nuke min 34 >= 12
    )
    expect(pick.name).toBe('Nuke')
  })

  it('tier 2 heals only when hurt and not wasteful', () => {
    // Healthy: never heals.
    const healthy = chooseEnemyMoveSmart(
      () => 0.1,
      [jab, heal],
      mkOpts({ tier: 2, enemyHpPct: 0.9, enemyMissingHp: 10 }),
    )
    expect(healthy.name).not.toBe('Heal')
    // Hurt with room for the heal: takes it (rng under the 60% gate).
    const hurt = chooseEnemyMoveSmart(
      () => 0.1,
      [jab, heal],
      mkOpts({ tier: 2, enemyHpPct: 0.3, enemyMissingHp: 100 }),
    )
    expect(hurt.name).toBe('Heal')
  })

  it('tier 2 presses the biggest hit once the player is wounded', () => {
    // Reliable jab (35×100%) outscores the shaky nuke (40×80% = 32)
    // against a healthy player; the wounded-player boost flips it.
    const strongJab: EnemyMove = { name: 'Jab', dmg: 35, type: 'normal' }
    const shakyNuke: EnemyMove = { name: 'Nuke', dmg: 40, type: 'normal', acc: 80 }
    const fresh = chooseEnemyMoveSmart(() => 0.1, [strongJab, shakyNuke], mkOpts({ tier: 2 }))
    expect(fresh.name).toBe('Jab')
    const wounded = chooseEnemyMoveSmart(
      () => 0.1,
      [strongJab, shakyNuke],
      mkOpts({ tier: 2, playerHpPct: 0.3, playerHp: 100 }),
    )
    expect(wounded.name).toBe('Nuke')
  })
})

describe('ascension progress persistence', () => {
  beforeEach(() => localStorage.clear())

  it('starts locked and unlocks one tier per win', () => {
    expect(getClassAscension('pm')).toEqual({ unlocked: 0, best: -1 })
    recordAscensionWin('pm', 0)
    expect(getClassAscension('pm')).toEqual({ unlocked: 1, best: 0 })
    recordAscensionWin('pm', 1)
    expect(getClassAscension('pm')).toEqual({ unlocked: 2, best: 1 })
    // Re-winning a lower tier never regresses the ladder.
    recordAscensionWin('pm', 0)
    expect(getClassAscension('pm')).toEqual({ unlocked: 2, best: 1 })
  })

  it('caps at MAX_ASCENSION and tracks the global best', () => {
    recordAscensionWin('eng', MAX_ASCENSION)
    expect(getClassAscension('eng').unlocked).toBe(MAX_ASCENSION)
    expect(getBestAscension()).toBe(MAX_ASCENSION)
  })
})
