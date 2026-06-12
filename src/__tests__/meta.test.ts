// ─── META-PROGRESSION ───────────────────────────────────────
// Achievement-gated unlocks: locked perks/relics stay out of the base
// pools, earned achievements add them to future runs' pools, dailies
// always use the base pools, and the v5 save migration fills pools
// from the player's current unlocks.

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  ALL_PERK_IDS,
  ALL_RELIC_IDS,
  BASE_PERK_POOL,
  BASE_RELIC_POOL,
  ENEMY_POOLS,
  PERKS,
  PLAYER_CLASSES,
  RELICS,
  unlockAchievement,
  unlockedPerkPool,
  unlockedRelicPool,
} from '@/data'
import {
  advanceFloor,
  awardEliteSpoils,
  clearSave,
  collectMods,
  getEffectivePlayer,
  getVictoryPayout,
  loadRun,
  newBattle,
  newDailyRun,
  newNgPlusRun,
  newRun,
  resolveEnemy,
  resolvePlayerMove,
  rollPerkOffer,
  rollRelicDrop,
  SAVE_KEY,
  saveRun,
  shopPrice,
  type RunState,
  type TurnContext,
} from '@/engine'
import { createSeededRandom } from '@/daily'
import type { Rng } from '@/battle'
import type { BattleEvent } from '@/engine'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

const seq = (...values: number[]): Rng => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    ...newRun(PM),
    floorEnemyIds: ENEMY_POOLS.map((pool) => pool[0].name),
    ...overrides,
  }
}

beforeEach(() => localStorage.clear())
afterEach(() => localStorage.clear())

describe('unlock pools', () => {
  it('base pools exclude all achievement-gated content', () => {
    for (const id of BASE_PERK_POOL) expect(PERKS[id].unlockedBy, id).toBeUndefined()
    for (const id of BASE_RELIC_POOL) expect(RELICS[id].unlockedBy, id).toBeUndefined()
    expect(BASE_PERK_POOL.length).toBeLessThan(ALL_PERK_IDS.length)
    expect(BASE_RELIC_POOL.length).toBeLessThan(ALL_RELIC_IDS.length)
  })

  it('earning the gating achievement adds the content to the pool', () => {
    expect(unlockedPerkPool(new Set())).toEqual(BASE_PERK_POOL)
    const withFirstClimb = unlockedPerkPool(new Set(['first_climb'] as const))
    expect(withFirstClimb).toContain('personal_brand')
    expect(withFirstClimb).not.toContain('golden_handcuffs')
    expect(unlockedRelicPool(new Set(['speed_runner'] as const))).toContain('campus_keycard')
  })

  it('offers never include locked content when drawing from the base pool', () => {
    for (let s = 0; s < 30; s++) {
      for (const id of rollPerkOffer([], createSeededRandom(s))) {
        expect(PERKS[id].unlockedBy, id).toBeUndefined()
      }
    }
  })

  it('relic drops respect the run pool', () => {
    const drop = rollRelicDrop([], createSeededRandom(1), ['ceo_signature'])
    expect(drop).toBe('ceo_signature')
  })

  it('a run frozen with an unlocked pool can offer the new perk', () => {
    const pool = unlockedPerkPool(new Set(['first_climb'] as const))
    const seen = new Set<string>()
    for (let s = 0; s < 60; s++) {
      const run = makeRun({ floor: 4, perkPool: pool })
      for (const id of advanceFloor(run, createSeededRandom(s)).pendingPerkOffer!) seen.add(id)
    }
    expect(seen.has('personal_brand')).toBe(true)
  })

  it('dailies always use the base pools, whatever the player unlocked', () => {
    unlockAchievement('first_climb')
    unlockAchievement('speed_runner')
    const daily = newDailyRun(PM, new Date('2026-06-12T12:00:00'))
    expect(daily.perkPool).toEqual(BASE_PERK_POOL)
    expect(daily.relicPool).toEqual(BASE_RELIC_POOL)
  })

  it('NG+ refreshes pools when provided', () => {
    const run = makeRun({ floor: 29 })
    const pools = {
      perkPool: unlockedPerkPool(new Set(['first_climb'] as const)),
      relicPool: BASE_RELIC_POOL,
    }
    expect(newNgPlusRun(run, PM, pools).perkPool).toContain('personal_brand')
  })
})

describe('unlockable content effects', () => {
  it('conditional damage multipliers are collected per situation', () => {
    const cuffs = collectMods(['golden_handcuffs'], [])
    expect(cuffs.lowHpDmgMult).toBe(1.25)
    expect(cuffs.bossDmgMult).toBe(1)
    const shark = collectMods(['killer_instinct'], [])
    expect(shark.bossDmgMult).toBe(1.2)
    expect(shark.lowHpDmgMult).toBe(1)
  })

  it('Golden Handcuffs boosts damage in battle below 30% HP', () => {
    const mk = (hp: number): TurnContext => {
      const run = makeRun({ perks: ['golden_handcuffs'], hp })
      return {
        run,
        battle: { ...newBattle(resolveEnemy(run, 1)), enemyHp: 500 },
        effectivePlayer: getEffectivePlayer(PM, 'pm', 0, run.perks),
      }
    }
    const rng = () => seq(0, 0.5, 0.99, 0.99, 0.5, 0.99, 0.99)
    const dmg = (ctx: TurnContext) =>
      resolvePlayerMove(ctx, 2, rng()).events.find(
        (e): e is BattleEvent & { kind: 'hit'; amount: number } => e.kind === 'hit',
      )!.amount
    expect(dmg(mk(20))).toBeGreaterThan(dmg(mk(100)))
  })

  it('Dividends adds a flat payout on top of multipliers', () => {
    const plain = getVictoryPayout(10)
    expect(getVictoryPayout(10, ['dividends'])).toBe(plain + PERKS.dividends.flatPayout!)
  })

  it('All-Campus Keycard discounts shop prices and stacks with perks', () => {
    expect(shopPrice(40, [], 0, ['campus_keycard'])).toBe(36)
    expect(shopPrice(40, ['employee_discount'], 0, ['campus_keycard'])).toBe(27)
  })

  it('elite spoils can drop unlocked relics from the run pool', () => {
    const run = makeRun({
      floor: 5,
      eliteFloor: true,
      relicPool: ['ceo_signature'],
    })
    const { relicGained } = awardEliteSpoils(run, createSeededRandom(1))
    expect(relicGained).toBe('ceo_signature')
  })
})

describe('save migration to v5', () => {
  beforeEach(() => clearSave())

  it('round-trips a v5 save with pools', () => {
    const run = makeRun({ floor: 6, perkPool: [...BASE_PERK_POOL, 'personal_brand'] })
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('migrates a v4 save: pools filled from current unlocks', () => {
    unlockAchievement('first_climb')
    const v4run = { ...makeRun({ floor: 8 }) } as Record<string, unknown>
    delete v4run.perkPool
    delete v4run.relicPool
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 4, run: v4run }))
    const run = loadRun()!
    expect(run.perkPool).toContain('personal_brand')
    expect(run.perkPool).not.toContain('golden_handcuffs')
    expect(run.relicPool).toEqual(BASE_RELIC_POOL)
  })

  it('rejects a save with unknown pool ids', () => {
    const run = makeRun({ perkPool: ['jetpack' as never] })
    saveRun(run)
    expect(loadRun()).toBeNull()
  })
})
