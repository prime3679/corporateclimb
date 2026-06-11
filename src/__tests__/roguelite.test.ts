// ─── ROGUELITE DEPTH: PERKS, STOCK OPTIONS, SHOP ────────────
// Engine-level tests for the promotion perk choices, the Stock Option
// economy, the mid-act shop, the new offensive items, and the v2→v3
// save migration.

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SAVE_KEY,
  SHOP_STOCK_SIZE,
  WELLNESS_DAY,
  advanceFloor,
  applyEventChoice,
  applyPostBattlePerk,
  applyVictory,
  awardEliteSpoils,
  buyShopItem,
  buyWellnessDay,
  chooseElevator,
  choosePerk,
  clearSave,
  eliteAvailable,
  leaveShop,
  loadRun,
  newBattle,
  newDailyRun,
  newNgPlusRun,
  newRun,
  resolveEnemy,
  resolveItemUse,
  resolvePlayerMove,
  rollShopStock,
  saveRun,
  shopPrice,
  type BattleEvent,
  type RunState,
  type TurnContext,
} from '@/engine'
import {
  ALL_PERK_IDS,
  ALL_RELIC_IDS,
  ENEMY_POOLS,
  HALLWAY_EVENTS,
  ITEMS,
  PERKS,
  PLAYER_CLASSES,
  RELICS,
  RELIC_DUPLICATE_OPTIONS,
  getEffectivePlayer,
  getVictoryPayout,
  groupPerks,
  rollPerkOffer,
} from '@/data'
import { createSeededRandom } from '@/daily'
import type { Rng } from '@/battle'
import type { PerkId, RelicId } from '@/types'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

/** Rng stub replaying a fixed sequence (repeats the last value). */
const seq = (...values: number[]): Rng => {
  let i = 0
  return () => values[Math.min(i++, values.length - 1)]
}

/** A run pinned to the first variant of every floor pool. */
function makeRun(overrides: Partial<RunState> = {}): RunState {
  return {
    ...newRun(PM),
    floorEnemyIds: ENEMY_POOLS.map((pool) => pool[0].name),
    ...overrides,
  }
}

function makeCtx(runOverrides: Partial<RunState> = {}, battleOverrides = {}): TurnContext {
  const run = makeRun(runOverrides)
  const battle = { ...newBattle(resolveEnemy(run, 1), run.perks), ...battleOverrides }
  return { run, battle, effectivePlayer: getEffectivePlayer(PM, 'pm', run.floor, run.perks) }
}

const logs = (events: BattleEvent[]) =>
  events.filter((e): e is BattleEvent & { kind: 'log'; text: string } => e.kind === 'log')

// ─── Perk offers ─────────────────────────────────────────────

describe('rollPerkOffer', () => {
  it('offers one stat package, one passive, one economy perk', () => {
    const offer = rollPerkOffer([], createSeededRandom(1))
    expect(offer).toHaveLength(3)
    expect(PERKS[offer[0]].kind).toBe('stat')
    expect(PERKS[offer[1]].kind).toBe('passive')
    expect(PERKS[offer[2]].kind).toBe('economy')
  })

  it('never offers an owned one-time perk again', () => {
    const uniques = ALL_PERK_IDS.filter((id) => !PERKS[id].repeatable)
    for (let s = 0; s < 20; s++) {
      const offer = rollPerkOffer(uniques, createSeededRandom(s))
      for (const id of offer) expect(PERKS[id].repeatable, id).toBe(true)
    }
  })

  it('still offers stat packages already owned (they stack)', () => {
    const owned: PerkId[] = ['gym_membership', 'gym_membership']
    const seen = new Set<PerkId>()
    for (let s = 0; s < 40; s++) seen.add(rollPerkOffer(owned, createSeededRandom(s))[0])
    expect(seen.has('gym_membership')).toBe(true)
  })

  it('is deterministic for a given rng', () => {
    expect(rollPerkOffer([], createSeededRandom(7))).toEqual(
      rollPerkOffer([], createSeededRandom(7)),
    )
  })
})

describe('groupPerks', () => {
  it('groups stacked picks with counts, preserving first-pick order', () => {
    const grouped = groupPerks([
      'negotiator',
      'gym_membership',
      'gym_membership',
      'perfectionist',
      'gym_membership',
    ])
    expect(grouped.map((g) => [g.perk.id, g.count])).toEqual([
      ['negotiator', 1],
      ['gym_membership', 3],
      ['perfectionist', 1],
    ])
  })

  it('skips unknown ids from stale saves and handles empty lists', () => {
    expect(groupPerks([])).toEqual([])
    expect(groupPerks(['hoverboard' as PerkId, 'self_care'])).toHaveLength(1)
  })
})

describe('choosePerk', () => {
  it('adds the perk and clears the pending offer', () => {
    const run = makeRun({ pendingPerkOffer: ['gym_membership', 'perfectionist', 'negotiator'] })
    const next = choosePerk(run, 'perfectionist')
    expect(next.perks).toEqual(['perfectionist'])
    expect(next.pendingPerkOffer).toBeNull()
  })

  it('ignores a perk that was not offered', () => {
    const run = makeRun({ pendingPerkOffer: ['gym_membership', 'perfectionist', 'negotiator'] })
    expect(choosePerk(run, 'self_care')).toBe(run)
  })

  it('Signing Bonus pays out immediately', () => {
    const run = makeRun({
      pendingPerkOffer: ['gym_membership', 'perfectionist', 'signing_bonus'],
      stockOptions: 10,
    })
    const next = choosePerk(run, 'signing_bonus')
    expect(next.stockOptions).toBe(10 + PERKS.signing_bonus.instantOptions!)
  })
})

// ─── Floor advancement ───────────────────────────────────────

describe('advanceFloor', () => {
  it('queues a perk offer when crossing a promotion tier', () => {
    const run = advanceFloor(makeRun({ floor: 4 }), createSeededRandom(1))
    expect(run.floor).toBe(5)
    expect(run.pendingPerkOffer).toHaveLength(3)
  })

  it('does not queue an offer on a plain floor', () => {
    const run = advanceFloor(makeRun({ floor: 2 }), createSeededRandom(1))
    expect(run.pendingPerkOffer).toBeNull()
  })

  it('opens the shop at the mid-act stops (5, 15, 25)', () => {
    for (const prev of [4, 14, 24]) {
      const run = advanceFloor(makeRun({ floor: prev }), createSeededRandom(1))
      expect(run.shopStock, `after floor ${prev}`).toHaveLength(SHOP_STOCK_SIZE)
    }
    const run = advanceFloor(makeRun({ floor: 9 }), createSeededRandom(1))
    expect(run.shopStock).toBeNull()
  })

  it('daily runs get seeded perk offers and shops too', () => {
    const date = new Date('2026-06-11T12:00:00')
    const base = { ...newDailyRun(PM, date), floor: 4 }
    const a = advanceFloor(base, createSeededRandom(5))
    const b = advanceFloor(base, createSeededRandom(5))
    expect(a.pendingPerkOffer).toEqual(b.pendingPerkOffer)
    if (a.mode.kind === 'daily' && a.mode.modifier.itemsEnabled) {
      expect(a.shopStock).toEqual(b.shopStock)
      expect(a.shopStock).toHaveLength(SHOP_STOCK_SIZE)
    }
  })

  it('skips the shop when a daily modifier disables items', () => {
    const run = newDailyRun(PM, new Date('2026-06-11T12:00:00'))
    if (run.mode.kind !== 'daily') throw new Error('expected daily mode')
    const noItems = {
      ...run,
      floor: 4,
      mode: { ...run.mode, modifier: { ...run.mode.modifier, itemsEnabled: false } },
    }
    expect(advanceFloor(noItems, createSeededRandom(1)).shopStock).toBeNull()
  })
})

// ─── Economy ─────────────────────────────────────────────────

describe('stock options economy', () => {
  it('victory pays out, scaled by floor', () => {
    const r0 = applyVictory(makeRun({ floor: 0 }), PM.maxHp)
    const r9 = applyVictory(makeRun({ floor: 9 }), PM.maxHp)
    expect(r0.optionsGained).toBe(getVictoryPayout(0))
    expect(r9.optionsGained).toBe(getVictoryPayout(9))
    expect(r9.optionsGained).toBeGreaterThan(r0.optionsGained)
    expect(r9.run.stockOptions).toBe(r9.optionsGained)
  })

  it('Negotiator boosts payouts by 30%', () => {
    const plain = applyVictory(makeRun({ floor: 10 }), PM.maxHp).optionsGained
    const boosted = applyVictory(makeRun({ floor: 10, perks: ['negotiator'] }), PM.maxHp)
    expect(boosted.optionsGained).toBe(Math.round(plain * 1.3))
  })

  it('Headhunter doubles the hallway item-reward chance', () => {
    const event = HALLWAY_EVENTS[0]
    // A roll of 0.45 misses the base 30% chance but hits the 60% one.
    const base = applyEventChoice(makeRun(), PM, event, 0, seq(0.45, 0))
    expect(base.itemGained).toBeNull()
    const hunter = applyEventChoice(makeRun({ perks: ['headhunter'] }), PM, event, 0, seq(0.45, 0))
    expect(hunter.itemGained).not.toBeNull()
  })
})

// ─── Shop ────────────────────────────────────────────────────

describe('shop', () => {
  it('rolls distinct items', () => {
    const stock = rollShopStock(createSeededRandom(3))
    expect(new Set(stock).size).toBe(SHOP_STOCK_SIZE)
  })

  it('buying deducts the price and adds the item', () => {
    const run = makeRun({ shopStock: ['espresso', 'pto_day', 'pip_notice'], stockOptions: 100 })
    const next = buyShopItem(run, 1)
    expect(next.inventory).toContain('pto_day')
    expect(next.stockOptions).toBe(100 - ITEMS.pto_day.price)
    expect(next.shopStock).toEqual(['espresso', 'pip_notice'])
  })

  it('refuses an unaffordable buy or a full inventory', () => {
    const poor = makeRun({ shopStock: ['pto_day'], stockOptions: 1 })
    expect(buyShopItem(poor, 0)).toBe(poor)
    const full = makeRun({
      shopStock: ['pto_day'],
      stockOptions: 999,
      inventory: ['espresso', 'espresso', 'espresso', 'espresso'],
    })
    expect(buyShopItem(full, 0)).toBe(full)
  })

  it('Employee Discount cuts prices 25%', () => {
    expect(shopPrice(40, ['employee_discount'])).toBe(30)
    expect(shopPrice(40, [])).toBe(40)
  })

  it('prices inflate with the act: ×1 / ×2 / ×3', () => {
    expect(shopPrice(20, [], 5)).toBe(20) // act 1
    expect(shopPrice(20, [], 15)).toBe(40) // act 2
    expect(shopPrice(20, [], 25)).toBe(60) // act 3
    // Discount applies on top of inflation.
    expect(shopPrice(20, ['employee_discount'], 15)).toBe(30)
  })

  it('act inflation flows through purchases', () => {
    const run = makeRun({ floor: 15, shopStock: ['pto_day'], stockOptions: 100 })
    const next = buyShopItem(run, 0)
    expect(next.stockOptions).toBe(100 - ITEMS.pto_day.price * 2)
    const healed = buyWellnessDay(makeRun({ floor: 25, hp: 10, stockOptions: 100 }), PM.maxHp)
    expect(healed.stockOptions).toBe(100 - WELLNESS_DAY.price * 3)
  })

  it('Wellness Day heals half of max HP, clamped, and costs its price', () => {
    const run = makeRun({ hp: 10, stockOptions: 100 })
    const next = buyWellnessDay(run, PM.maxHp)
    expect(next.hp).toBe(Math.min(PM.maxHp, 10 + Math.round(PM.maxHp * 0.5)))
    expect(next.stockOptions).toBe(100 - WELLNESS_DAY.price)
    // No-op at full HP.
    const fullHp = makeRun({ hp: PM.maxHp, stockOptions: 100 })
    expect(buyWellnessDay(fullHp, PM.maxHp)).toBe(fullHp)
  })

  it('leaving clears the stock', () => {
    expect(leaveShop(makeRun({ shopStock: ['espresso'] })).shopStock).toBeNull()
  })
})

// ─── Perks in combat ─────────────────────────────────────────

describe('perks in combat', () => {
  it('Morning Person starts battles Motivated', () => {
    const battle = newBattle(resolveEnemy(makeRun(), 1), ['morning_person'])
    expect(battle.playerStatuses.some((s) => s.id === 'motivated')).toBe(true)
    expect(newBattle(resolveEnemy(makeRun(), 1)).playerStatuses).toEqual([])
  })

  it('Overtime Grind multiplies outgoing damage', () => {
    // Same rng sequence: variance roll 0.5 → ~1.0x, no crit, hit lands.
    const rng = () => seq(0, 0.5, 0.99, 0.99, 0.5, 0.99, 0.99)
    const plain = resolvePlayerMove(makeCtx(), 2, rng())
    const perked = resolvePlayerMove(makeCtx({ perks: ['overtime_grind'] }), 2, rng())
    const dmg = (r: { events: BattleEvent[] }) =>
      r.events.find((e): e is BattleEvent & { kind: 'hit'; amount: number } => e.kind === 'hit')!
        .amount
    expect(dmg(perked)).toBeGreaterThan(dmg(plain))
  })

  it('Networking Guru heals a fraction of damage dealt', () => {
    const ctx = makeCtx({ perks: ['networking_guru'], hp: 50 })
    const result = resolvePlayerMove(ctx, 2, seq(0, 0.5, 0.99, 0.99, 0.5, 0.99, 0.99))
    const heal = result.events.find((e) => e.kind === 'heal' && e.target === 'player')
    expect(heal).toBeDefined()
    expect(logs(result.events).some((l) => l.text.includes('Drained'))).toBe(true)
  })

  it('Self Care stacks with the PM post-battle heal', () => {
    const run = makeRun({ hp: 50, perks: ['self_care'] })
    const next = applyPostBattlePerk(run, PM.maxHp)
    expect(next.hp).toBe(50 + 5 + PERKS.self_care.postBattleHeal!)
  })
})

// ─── Offensive items ─────────────────────────────────────────

describe('offensive items', () => {
  it('Reply-All Grenade damages the enemy', () => {
    const ctx = makeCtx({ inventory: ['reply_all_grenade'] }, { enemyHp: 200 })
    const result = resolveItemUse(ctx, 0, seq(0.99, 0.5, 0.5, 0.99, 0.99))
    const hit = result.events.find(
      (e): e is BattleEvent & { kind: 'hit'; amount: number; target: string } => e.kind === 'hit',
    )!
    expect(hit.target).toBe('enemy')
    expect(hit.amount).toBe(ITEMS.reply_all_grenade.effect.dmgEnemy)
    expect(result.battle.enemyHp).toBeLessThan(200)
  })

  it('an offensive item can win the battle outright', () => {
    const ctx = makeCtx({ inventory: ['forward_to_legal'] }, { enemyHp: 30 })
    const result = resolveItemUse(ctx, 0, seq(0.99))
    expect(result.battle.phase).toBe('won')
    expect(result.events.some((e) => e.kind === 'faint' && e.side === 'enemy')).toBe(true)
  })

  it('PIP Notice inflicts Micromanaged on the enemy', () => {
    const ctx = makeCtx({ inventory: ['pip_notice'] }, { enemyHp: 200 })
    const result = resolveItemUse(ctx, 0, seq(0, 0.99, 0.5, 0.5, 0.99, 0.99))
    expect(result.battle.enemyStatuses.some((s) => s.id === 'micromanaged')).toBe(true)
  })

  it('an offensive item can trigger a boss phase-2', () => {
    // Floor 9 (act-1 boss) has a phase 2; drop it to just above half HP.
    const run = makeRun({ floor: 9, inventory: ['forward_to_legal'] })
    const boss = resolveEnemy(run, 1)
    expect(boss.phase2).toBeDefined()
    const battle = { ...newBattle(boss), enemyHp: Math.floor(boss.maxHp * 0.5) + 10 }
    const ctx: TurnContext = {
      run,
      battle,
      effectivePlayer: getEffectivePlayer(PM, 'pm', 9),
    }
    const result = resolveItemUse(ctx, 0, seq(0.99))
    expect(result.battle.enemyPhase).toBe(2)
    expect(result.events.some((e) => e.kind === 'phase2')).toBe(true)
  })
})

// ─── Run lifecycle ───────────────────────────────────────────

describe('run lifecycle with perks', () => {
  it('new runs start with no perks, no options, nothing pending', () => {
    const run = newRun(PM)
    expect(run.perks).toEqual([])
    expect(run.stockOptions).toBe(0)
    expect(run.pendingPerkOffer).toBeNull()
    expect(run.shopStock).toBeNull()
  })

  it('NG+ resets perks and options', () => {
    const run = makeRun({ perks: ['negotiator'], stockOptions: 500, floor: 29 })
    const ng = newNgPlusRun(run, PM)
    expect(ng.perks).toEqual([])
    expect(ng.stockOptions).toBe(0)
  })
})

// ─── Save migration ──────────────────────────────────────────

describe('save migration to v3', () => {
  beforeEach(() => {
    clearSave()
  })

  it('round-trips a v3 save', () => {
    const run = makeRun({ floor: 6, perks: ['negotiator'], stockOptions: 42 })
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('migrates a v2 save: grandfathers stat packages and payouts', () => {
    const v2run = { ...makeRun({ floor: 12 }) } as Record<string, unknown>
    delete v2run.stockOptions
    delete v2run.perks
    delete v2run.pendingPerkOffer
    delete v2run.shopStock
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 2, run: v2run }))
    const run = loadRun()!
    // Promotions passed at floors 5 and 10 → two balanced packages.
    expect(run.perks).toEqual(['balanced_package', 'balanced_package'])
    let expected = 0
    for (let f = 0; f < 12; f++) expected += getVictoryPayout(f)
    expect(run.stockOptions).toBe(expected)
    expect(run.pendingPerkOffer).toBeNull()
    expect(run.shopStock).toBeNull()
  })

  it('migrates a v1 save through the same path', () => {
    localStorage.setItem(
      SAVE_KEY,
      JSON.stringify({
        classId: 'pm',
        floor: 7,
        level: 5,
        xp: 10,
        xpToNext: 100,
        playerHp: 80,
        playerPp: [10, 10, 10, 10],
        atkBuff: 0,
        defBuff: 0,
        usedEvents: [],
        inventory: [],
      }),
    )
    const run = loadRun()!
    expect(run.perks).toEqual(['balanced_package'])
    expect(run.stockOptions).toBeGreaterThan(0)
  })

  it('rejects a save with unknown perk ids', () => {
    const run = makeRun({ perks: ['hoverboard' as PerkId] })
    saveRun(run)
    expect(loadRun()).toBeNull()
  })
})

// ─── Elite floors & Status Symbols ───────────────────────────

describe('the elevator bank', () => {
  it('opens after the first promotion and skips boss floors', () => {
    expect(eliteAvailable(0)).toBe(false)
    expect(eliteAvailable(4)).toBe(false)
    expect(eliteAvailable(5)).toBe(true)
    expect(eliteAvailable(7)).toBe(true)
    expect(eliteAvailable(8)).toBe(false)
    expect(eliteAvailable(9)).toBe(false)
    expect(eliteAvailable(10)).toBe(true)
    expect(eliteAvailable(25)).toBe(true)
    expect(eliteAvailable(28)).toBe(false)
  })

  it('chooseElevator commits the pick only where elites are allowed', () => {
    const run = makeRun({ floor: 5 })
    expect(chooseElevator(run, true).eliteFloor).toBe(true)
    const early = makeRun({ floor: 2 })
    expect(chooseElevator(early, true)).toBe(early)
  })

  it('advanceFloor clears the elite flag for the next pick', () => {
    const run = makeRun({ floor: 5, eliteFloor: true })
    expect(advanceFloor(run, createSeededRandom(1)).eliteFloor).toBe(false)
  })

  it('elite floors fight a scaled-up, renamed enemy', () => {
    const base = resolveEnemy(makeRun({ floor: 5 }), 1)
    const elite = resolveEnemy(makeRun({ floor: 5, eliteFloor: true }), 1)
    expect(elite.name).toBe(`Elite ${base.name}`)
    expect(elite.maxHp).toBeGreaterThan(base.maxHp)
    expect(elite.atk).toBeGreaterThan(base.atk)
  })

  it('elite victories pay double', () => {
    const std = applyVictory(makeRun({ floor: 5 }), PM.maxHp).optionsGained
    const elite = applyVictory(makeRun({ floor: 5, eliteFloor: true }), PM.maxHp).optionsGained
    expect(elite).toBe(std * 2)
  })
})

describe('status symbols', () => {
  it('elite spoils drop a relic the run does not own', () => {
    const run = makeRun({ floor: 5, eliteFloor: true, relics: ['golden_stapler'] })
    const { run: next, relicGained } = awardEliteSpoils(run, createSeededRandom(1))
    expect(relicGained).not.toBeNull()
    expect(relicGained).not.toBe('golden_stapler')
    expect(next.relics).toContain(relicGained)
  })

  it('a full trophy cabinet pays options instead', () => {
    const run = makeRun({ floor: 5, eliteFloor: true, relics: [...ALL_RELIC_IDS] })
    const { run: next, relicGained, bonusOptions } = awardEliteSpoils(run, createSeededRandom(1))
    expect(relicGained).toBeNull()
    expect(bonusOptions).toBe(RELIC_DUPLICATE_OPTIONS)
    expect(next.stockOptions).toBe(run.stockOptions + RELIC_DUPLICATE_OPTIONS)
  })

  it('non-elite victories yield no spoils', () => {
    const run = makeRun({ floor: 5 })
    expect(awardEliteSpoils(run, createSeededRandom(1)).run).toBe(run)
  })

  it('relic stat boosts apply to the effective player', () => {
    const effective = getEffectivePlayer(PM, 'pm', 5, [], ['corner_office_key', 'mahogany_desk'])
    const key = RELICS.corner_office_key.statBoost!
    const desk = RELICS.mahogany_desk.statBoost!
    expect(effective.maxHp).toBe(PM.maxHp + key.maxHp! + desk.maxHp!)
    expect(effective.atk).toBe(PM.atk + desk.atk!)
    expect(effective.def).toBe(PM.def + desk.def!)
  })

  it('Golden Stapler multiplies outgoing damage', () => {
    const rng = () => seq(0, 0.5, 0.99, 0.99, 0.5, 0.99, 0.99)
    const plain = resolvePlayerMove(makeCtx(), 2, rng())
    const stapled = resolvePlayerMove(makeCtx({ relics: ['golden_stapler'] }), 2, rng())
    const dmg = (r: { events: BattleEvent[] }) =>
      r.events.find((e): e is BattleEvent & { kind: 'hit'; amount: number } => e.kind === 'hit')!
        .amount
    expect(dmg(stapled)).toBeGreaterThan(dmg(plain))
  })

  it('Stress Ball halves burnout chip damage', () => {
    const burned = { playerStatuses: [{ id: 'burned_out' as const, turnsLeft: 3 }], enemyHp: 500 }
    const burnAmount = (r: { events: BattleEvent[] }) =>
      r.events.find(
        (e): e is BattleEvent & { kind: 'burn'; amount: number; target: string } =>
          e.kind === 'burn' && e.target === 'player',
      )!.amount
    const plain = resolvePlayerMove(makeCtx({}, burned), 2, seq(0, 0.5, 0.99, 0.99, 0.5, 0.99))
    const guarded = resolvePlayerMove(
      makeCtx({ relics: ['stress_ball'] }, burned),
      2,
      seq(0, 0.5, 0.99, 0.99, 0.5, 0.99),
    )
    expect(burnAmount(plain)).toBe(8)
    expect(burnAmount(guarded)).toBe(4)
  })
})

describe('save migration to v4', () => {
  beforeEach(() => {
    clearSave()
  })

  it('round-trips a v4 save with relics and an elite pick', () => {
    const run = makeRun({ floor: 6, relics: ['lucky_tie'], eliteFloor: true })
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('migrates a v3 save: empty cabinet, elevator re-offered', () => {
    const v3run = { ...makeRun({ floor: 12 }) } as Record<string, unknown>
    delete v3run.relics
    delete v3run.eliteFloor
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 3, run: v3run }))
    const run = loadRun()!
    expect(run.relics).toEqual([])
    expect(run.eliteFloor).toBe(false)
    expect(run.floor).toBe(12)
  })

  it('rejects a save with unknown relic ids', () => {
    const run = makeRun({ relics: ['segway' as RelicId] })
    saveRun(run)
    expect(loadRun()).toBeNull()
  })
})
