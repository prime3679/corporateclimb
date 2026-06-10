import { describe, it, expect, beforeEach } from 'vitest'
import {
  GameRng,
  applyEventChoice,
  applyPostBattlePerk,
  applyVictory,
  battleIntroLine,
  loadRun,
  newBattle,
  newDailyRun,
  newNgPlusRun,
  newRun,
  pickTwoEvents,
  resolveEnemy,
  resolveItemUse,
  resolvePlayerMove,
  saveRun,
  clearSave,
  type BattleEvent,
  type RunState,
  type TurnContext,
} from '../engine'
import { ENEMY_POOLS, HALLWAY_EVENTS, PLAYER_CLASSES, getEffectivePlayer } from '../data'
import { createSeededRandom } from '../daily'
import type { Rng } from '../battle'

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
  const battle = { ...newBattle(resolveEnemy(run, 1)), ...battleOverrides }
  return { run, battle, effectivePlayer: getEffectivePlayer(PM, 'pm', run.floor) }
}

const kinds = (events: BattleEvent[]) => events.map((e) => e.kind)
const logs = (events: BattleEvent[]) =>
  events.filter((e): e is BattleEvent & { kind: 'log'; text: string } => e.kind === 'log')

// ─── GameRng ─────────────────────────────────────────────────

describe('GameRng', () => {
  it('matches createSeededRandom for the same seed', () => {
    const legacy = createSeededRandom(20260610)
    const rng = new GameRng(20260610)
    for (let i = 0; i < 20; i++) expect(rng.next()).toBe(legacy())
  })

  it('resumes identically from a serialized state', () => {
    const a = new GameRng(42)
    a.next()
    a.next()
    const b = new GameRng(a.serialize())
    const a3 = a.next()
    expect(b.next()).toBe(a3)
  })
})

// ─── resolvePlayerMove ───────────────────────────────────────

describe('resolvePlayerMove', () => {
  // Move 2 (Ship MVP) has acc 90 and no status/heal — predictable rng use.
  const SHIP_MVP = 2

  it('resolves a full round: player hit, then enemy response, back to player', () => {
    // Padded enemy HP keeps the floor-0 enemy alive through the hit.
    const ctx = makeCtx({}, { enemyHp: 5000 })
    // acc pass, variance neutral, no crit; enemy: ai roll, acc pass, variance, no crit
    const result = resolvePlayerMove(ctx, SHIP_MVP, seq(0.1, 0.5, 0.99, 0.1, 0.1, 0.5, 0.99))

    const ks = kinds(result.events)
    expect(ks[0]).toBe('spend')
    expect(ks[1]).toBe('attack')
    expect(ks).toContain('hit')
    expect(result.battle.phase).toBe('player')

    // Both sides took damage, canonical state matches the last patches.
    const hits = result.events.filter((e) => e.kind === 'hit')
    expect(hits).toHaveLength(2)
    expect(hits[0]).toMatchObject({ target: 'enemy' })
    expect(hits[1]).toMatchObject({ target: 'player' })
    expect(result.battle.enemyHp).toBe(ctx.battle.enemyHp - hits[0].amount)
    expect(result.run.hp).toBe(ctx.run.hp - hits[1].amount)

    // Bookkeeping
    expect(result.run.stats.totalTurns).toBe(1)
    expect(result.run.stats.totalDamageDealt).toBe(hits[0].amount)
    expect(result.run.pp[SHIP_MVP]).toBe(ctx.run.pp[SHIP_MVP] - 1)

    const lines = logs(result.events)
    expect(lines[0].text).toMatch(/^Product Manager used Ship MVP! \d+ damage!/)
  })

  it('a missed move still lets the enemy act', () => {
    const ctx = makeCtx()
    // 0.95 * 100 = 95 ≥ 90 → miss
    const result = resolvePlayerMove(ctx, SHIP_MVP, seq(0.95, 0.5, 0.1, 0.5, 0.99))
    expect(result.events.some((e) => e.kind === 'miss' && e.target === 'enemy')).toBe(true)
    expect(logs(result.events)[0].text).toBe('Product Manager used Ship MVP! But it missed!')
    expect(result.battle.enemyHp).toBe(ctx.battle.enemyHp) // no damage dealt
    expect(result.events.filter((e) => e.kind === 'attack')).toHaveLength(2) // both sides acted
  })

  it('falls back to Struggle with recoil when all PP is depleted', () => {
    const ctx = makeCtx({ pp: [0, 0, 0, 0] })
    const result = resolvePlayerMove(ctx, 0, seq(0.1, 0.5, 0.99, 0.5, 0.1, 0.5, 0.99))
    expect(result.events.some((e) => e.kind === 'spend')).toBe(false) // no PP to spend
    const recoil = result.events.find((e) => e.kind === 'recoil')
    expect(recoil).toMatchObject({ amount: 5 })
    expect(logs(result.events)[0].text).toContain('used Struggle!')
    expect(logs(result.events)[0].text).toContain('Recoil: -5 HP!')
  })

  it('killing the enemy wins the battle without an enemy turn', () => {
    const ctx = makeCtx({}, { enemyHp: 1 })
    const result = resolvePlayerMove(ctx, SHIP_MVP, seq(0.1, 0.5, 0.99))
    expect(result.battle.phase).toBe('won')
    expect(result.battle.enemyHp).toBe(0)
    const ks = kinds(result.events)
    expect(ks[ks.length - 1]).toBe('faint')
    expect(result.events.filter((e) => e.kind === 'attack')).toHaveLength(1) // enemy never acted
  })

  it('burnout finishing the enemy still registers the win', () => {
    const ctx = makeCtx({}, { enemyStatuses: [{ id: 'burned_out', turnsLeft: 2 }] })
    // First, learn the damage this rng deals, then re-run with enemy HP set
    // so the hit leaves it alive and the 8 burn damage finishes it.
    const probe = resolvePlayerMove(ctx, SHIP_MVP, seq(0.1, 0.5, 0.99))
    const dmg = probe.events.find((e) => e.kind === 'hit')!.amount
    const ctx2 = makeCtx(
      {},
      { enemyHp: dmg + 4, enemyStatuses: [{ id: 'burned_out', turnsLeft: 2 }] },
    )
    const result = resolvePlayerMove(ctx2, SHIP_MVP, seq(0.1, 0.5, 0.99))
    expect(result.events.some((e) => e.kind === 'burn' && e.target === 'enemy')).toBe(true)
    expect(result.battle.phase).toBe('won')
    expect(result.battle.enemyHp).toBe(0)
  })

  it('the enemy killing the player loses the battle', () => {
    const ctx = makeCtx({ hp: 1 }, { enemyHp: 5000 })
    const result = resolvePlayerMove(ctx, SHIP_MVP, seq(0.1, 0.5, 0.99, 0.1, 0.1, 0.5, 0.99))
    expect(result.battle.phase).toBe('lost')
    expect(result.run.hp).toBe(0)
    const ks = kinds(result.events)
    expect(ks[ks.length - 1]).toBe('faint')
    expect(result.events.find((e) => e.kind === 'faint')).toMatchObject({ side: 'player' })
  })

  it('crossing the 50% threshold triggers phase 2 and skips the enemy turn', () => {
    const bossFloor = ENEMY_POOLS.findIndex((pool) => pool[0].phase2)
    expect(bossFloor).toBeGreaterThanOrEqual(0)
    const run = makeRun({ floor: bossFloor, hp: 300 })
    const enemy = resolveEnemy(run, 1)
    const effectivePlayer = getEffectivePlayer(PM, 'pm', bossFloor)
    // Probe the damage this rng deals, then set enemy HP so the hit lands
    // just inside the 50% phase-2 window without killing.
    const probe = resolvePlayerMove(
      { run, battle: { ...newBattle(enemy), enemyHp: 10_000 }, effectivePlayer },
      SHIP_MVP,
      seq(0.1, 0.5, 0.99),
    )
    const dmg = probe.events.find((e) => e.kind === 'hit')!.amount
    const battle = { ...newBattle(enemy), enemyHp: Math.floor(enemy.maxHp * 0.5) + dmg }
    const ctx: TurnContext = { run, battle, effectivePlayer }
    const result = resolvePlayerMove(ctx, SHIP_MVP, seq(0.1, 0.5, 0.99))

    expect(result.battle.enemyPhase).toBe(2)
    expect(result.battle.phase).toBe('player')
    expect(result.battle.enemyHp).toBe(resolveEnemy(run, 2).maxHp)
    expect(result.battle.enemyStatuses).toEqual([])
    expect(result.events.some((e) => e.kind === 'phase2')).toBe(true)
    expect(logs(result.events).some((l) => l.text === '⚠️ PHASE 2')).toBe(true)
    expect(result.events.filter((e) => e.kind === 'attack')).toHaveLength(1) // enemy turn skipped
  })

  it('is deterministic for the same rng state', () => {
    const a = resolvePlayerMove(makeCtx(), 0, new GameRng(123).next)
    const b = resolvePlayerMove(makeCtx(), 0, new GameRng(123).next)
    expect(a.events).toEqual(b.events)
    expect(a.run).toEqual(b.run)
    expect(a.battle).toEqual(b.battle)
  })
})

// ─── resolveItemUse ──────────────────────────────────────────

describe('resolveItemUse', () => {
  it('heals, consumes the item, and hands the enemy a turn', () => {
    const ctx = makeCtx({ hp: 30, inventory: ['espresso'] })
    const result = resolveItemUse(ctx, 0, seq(0.5, 0.1, 0.5, 0.99))

    expect(logs(result.events)[0].text).toBe('Used Espresso Shot! Restored 30 HP!')
    expect(result.run.inventory).toEqual([])
    expect(result.run.stats.itemsUsed).toBe(1)
    expect(result.run.stats.totalTurns).toBe(0) // items do not count as turns
    expect(result.events.some((e) => e.kind === 'attack' && e.side === 'enemy')).toBe(true)

    // 30 healed, then the enemy hit lands on top.
    const enemyHit = result.events.find(
      (e): e is Extract<BattleEvent, { kind: 'hit' }> => e.kind === 'hit' && e.target === 'player',
    )!
    expect(result.run.hp).toBe(60 - enemyHit.amount)
  })

  it('clamps healing at effective max HP', () => {
    const ctx = makeCtx({ hp: PM.maxHp - 5, inventory: ['espresso'] })
    const result = resolveItemUse(ctx, 0, seq(0.5, 0.1, 0.5, 0.99))
    expect(logs(result.events)[0].text).toBe('Used Espresso Shot! Restored 5 HP!')
  })
})

// ─── run lifecycle ───────────────────────────────────────────

describe('run lifecycle', () => {
  it('newDailyRun is fully determined by the date', () => {
    const date = new Date(2026, 5, 10)
    const a = newDailyRun(PM, date)
    const b = newDailyRun(PM, date)
    expect(a).toEqual(b)
    expect(a.mode.kind).toBe('daily')
    expect(a.ngPlus).toBe(1)
    expect(a.rngState).not.toBeNull()
  })

  it('newNgPlusRun keeps level and xp but resets the tower', () => {
    const run = makeRun({ level: 12, xp: 50, floor: 29, atkBuff: 30 })
    const ng = newNgPlusRun(run, PM)
    expect(ng.ngPlus).toBe(1)
    expect(ng.level).toBe(12)
    expect(ng.floor).toBe(0)
    expect(ng.atkBuff).toBe(0)
    expect(ng.hp).toBe(PM.maxHp)
  })

  it('applyVictory awards xp and levels up across the threshold', () => {
    const run = makeRun({ xp: 20, xpToNext: 30, level: 1, hp: 50 })
    const { run: after, xpGained, leveledUp } = applyVictory(run, PM.maxHp)
    expect(xpGained).toBe(15) // floor 0
    expect(leveledUp).toBe(true)
    expect(after.level).toBe(2)
    expect(after.xp).toBe(5)
    expect(after.xpToNext).toBe(55)
    expect(after.hp).toBe(70) // +20 level-up heal
  })

  it('applyPostBattlePerk heals only the PM', () => {
    expect(applyPostBattlePerk(makeRun({ hp: 50 }), PM.maxHp).hp).toBe(55)
    expect(applyPostBattlePerk(makeRun({ hp: 50, classId: 'eng' }), PM.maxHp).hp).toBe(50)
  })

  it('battleIntroLine quotes taunts and announces wild enemies', () => {
    const enemy = resolveEnemy(makeRun(), 1)
    const line = battleIntroLine(enemy)
    expect(line).toMatch(/appeared!|^"/)
  })
})

// ─── hallway events ──────────────────────────────────────────

describe('hallway events', () => {
  it('pickTwoEvents returns two distinct unused events', () => {
    const { options } = pickTwoEvents(makeRun(), seq(0.3, 0.7, 0.2, 0.9))
    expect(options[0].id).not.toBe(options[1].id)
  })

  it('resets the used pool when fewer than two remain', () => {
    const used = HALLWAY_EVENTS.slice(0, -1).map((e) => e.id)
    const { options, run } = pickTwoEvents(makeRun({ usedEvents: used }), seq(0.3, 0.7))
    expect(options[0].id).not.toBe(options[1].id)
    expect(run.usedEvents).toEqual([])
  })

  it('clamps event healing at effective max HP (no atk-buff inflation)', () => {
    const healing = HALLWAY_EVENTS.flatMap((e) =>
      e.choices.map((c, i) => ({ event: e, idx: i, hp: c.effect.hp ?? 0 })),
    ).find((c) => c.hp > 0)!
    const run = makeRun({ hp: PM.maxHp - 1, atkBuff: 50 })
    const { run: after } = applyEventChoice(run, PM, healing.event, healing.idx, seq(0.99))
    expect(after.hp).toBe(PM.maxHp)
  })

  it('announces the 30% item reward explicitly', () => {
    const event = HALLWAY_EVENTS[0]
    const won = applyEventChoice(makeRun(), PM, event, 0, seq(0.1, 0.5))
    expect(won.itemGained).not.toBeNull()
    expect(won.run.inventory).toContain(won.itemGained)

    const lost = applyEventChoice(makeRun(), PM, event, 0, seq(0.9))
    expect(lost.itemGained).toBeNull()
  })

  it('marks the event as used', () => {
    const event = HALLWAY_EVENTS[3]
    const { run } = applyEventChoice(makeRun(), PM, event, 0, seq(0.9))
    expect(run.usedEvents).toContain(event.id)
  })
})

// ─── save / load ─────────────────────────────────────────────

describe('versioned save', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('round-trips a v2 save', () => {
    const run = makeRun({ floor: 7, level: 9 })
    saveRun(run)
    expect(loadRun()).toEqual(run)
  })

  it('migrates a v1 flat save (the e2e fixture shape)', () => {
    localStorage.setItem(
      'corporate-climb-save',
      JSON.stringify({
        classId: 'pm',
        floor: 9,
        level: 25,
        xp: 0,
        xpToNext: 100000,
        playerHp: 140,
        playerPp: [40, 40, 40, 40],
        atkBuff: 220,
        defBuff: 80,
        usedEvents: [],
        inventory: [],
      }),
    )
    const run = loadRun()
    expect(run).not.toBeNull()
    expect(run!.floor).toBe(9)
    expect(run!.hp).toBe(140)
    expect(run!.atkBuff).toBe(220)
    expect(run!.mode.kind).toBe('normal')
    expect(run!.floorEnemyIds).toHaveLength(ENEMY_POOLS.length)
  })

  it('rejects unknown classes, out-of-range floors, and garbage', () => {
    localStorage.setItem('corporate-climb-save', JSON.stringify({ classId: 'ceo', floor: 1 }))
    expect(loadRun()).toBeNull()
    localStorage.setItem(
      'corporate-climb-save',
      JSON.stringify({ version: 2, run: { ...makeRun(), floor: 99 } }),
    )
    expect(loadRun()).toBeNull()
    localStorage.setItem('corporate-climb-save', 'not json')
    expect(loadRun()).toBeNull()
  })

  it('clearSave removes the run', () => {
    saveRun(makeRun())
    clearSave()
    expect(loadRun()).toBeNull()
  })
})
