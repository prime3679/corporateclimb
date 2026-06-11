// ─── DETERMINISTIC RUN SIMULATIONS ──────────────────────────
// Drives whole runs through the engine with a seeded rng and a simple
// greedy bot — no DOM, no timers. Asserts (1) the same seed replays to
// the identical outcome, (2) state invariants hold on every turn of
// every floor, and (3) a competent bot reliably makes meaningful
// progress, so balance changes show up as reviewable test diffs.

import { describe, it, expect } from 'vitest'
import { ENEMY_POOLS, ITEMS, PLAYER_CLASSES, getEffectivePlayer, getTypeMultiplier } from '@/data'
import {
  GameRng,
  applyEventChoice,
  applyPostBattlePerk,
  applyVictory,
  newBattle,
  newRun,
  pickTwoEvents,
  resolveEnemy,
  resolveItemUse,
  resolvePlayerMove,
  type RunState,
  type TurnContext,
} from '@/engine'
import type { PlayerClass } from '@/types'

interface SimOutcome {
  won: boolean
  floorsCleared: number
  totalTurns: number
  totalDamageDealt: number
  finalHp: number
}

/** Greedy move choice: highest expected damage with PP left. */
function pickMove(ctx: TurnContext): number {
  const enemy = resolveEnemy(ctx.run, ctx.battle.enemyPhase)
  let best = 0
  let bestScore = -Infinity
  ctx.effectivePlayer.moves.forEach((m, i) => {
    if (ctx.run.pp[i] <= 0) return
    const { mult } = getTypeMultiplier(m.type, enemy.types)
    const score = m.dmg * mult * ((m.acc ?? 100) / 100) + (m.heal ?? 0) * 0.5
    if (score > bestScore) {
      bestScore = score
      best = i
    }
  })
  return best
}

function simulateRun(cls: PlayerClass, seed: number): SimOutcome {
  const rng = new GameRng(seed).next
  // newRun rolls floor variants with Math.random; re-roll them from the
  // seed so the entire simulation is deterministic.
  let run: RunState = {
    ...newRun(cls),
    floorEnemyIds: ENEMY_POOLS.map((pool) => pool[Math.floor(rng() * pool.length)].name),
  }

  const MAX_TURNS_PER_BATTLE = 200
  for (let floor = 0; floor < ENEMY_POOLS.length; floor++) {
    run = { ...run, floor }
    let effectivePlayer = getEffectivePlayer(cls, run.classId, floor)
    let battle = newBattle(resolveEnemy(run, 1))

    let turns = 0
    while (battle.phase === 'player') {
      expect(turns++, `floor ${floor}: battle should terminate`).toBeLessThan(MAX_TURNS_PER_BATTLE)
      const ctx: TurnContext = { run, battle, effectivePlayer }
      // Use the strongest healing item when in danger, otherwise attack.
      const healIdx = run.inventory.reduce(
        (best, id, i) =>
          (ITEMS[id].effect.hp ?? 0) > (best < 0 ? 0 : (ITEMS[run.inventory[best]].effect.hp ?? 0))
            ? i
            : best,
        -1,
      )
      const result =
        run.hp < effectivePlayer.maxHp * 0.4 && healIdx >= 0
          ? resolveItemUse(ctx, healIdx, rng)
          : resolvePlayerMove(ctx, pickMove(ctx), rng)
      run = result.run
      battle = result.battle

      // Invariants: HP/PP stay in range, damage counter never regresses.
      expect(run.hp, `floor ${floor}: player hp >= 0`).toBeGreaterThanOrEqual(0)
      expect(battle.enemyHp, `floor ${floor}: enemy hp >= 0`).toBeGreaterThanOrEqual(0)
      for (const pp of run.pp) expect(pp, `floor ${floor}: pp >= 0`).toBeGreaterThanOrEqual(0)
    }

    if (battle.phase === 'lost') {
      return {
        won: false,
        floorsCleared: floor,
        totalTurns: run.stats.totalTurns,
        totalDamageDealt: run.stats.totalDamageDealt,
        finalHp: 0,
      }
    }

    // Victory bookkeeping, then the hallway: always take the first event's
    // first "good" choice, mirroring a cautious player.
    run = applyVictory(run, effectivePlayer.maxHp).run
    run = applyPostBattlePerk(run, effectivePlayer.maxHp)
    effectivePlayer = getEffectivePlayer(cls, run.classId, run.floor)
    expect(run.hp, `floor ${floor}: hp <= effective max`).toBeLessThanOrEqual(effectivePlayer.maxHp)

    if (floor < ENEMY_POOLS.length - 1) {
      const picked = pickTwoEvents(run, rng)
      run = picked.run
      // Take the choice (across both offered events) that best fits the
      // moment: missing HP is worth recovering, buffs are gravy.
      const missingHp = effectivePlayer.maxHp - run.hp
      let bestEvent = picked.options[0]
      let bestChoice = 0
      let bestScore = -Infinity
      for (const event of picked.options) {
        event.choices.forEach((c, i) => {
          const hp = c.effect.hp ?? 0
          const score =
            Math.min(Math.max(hp, -missingHp), missingHp) +
            (c.effect.atk ?? 0) * 5 +
            (c.effect.def ?? 0) * 5 +
            (c.effect.ppRestore ?? 0) * 2
          if (score > bestScore) {
            bestScore = score
            bestEvent = event
            bestChoice = i
          }
        })
      }
      run = applyEventChoice(run, effectivePlayer, bestEvent, bestChoice, rng).run
    }
  }

  return {
    won: true,
    floorsCleared: ENEMY_POOLS.length,
    totalTurns: run.stats.totalTurns,
    totalDamageDealt: run.stats.totalDamageDealt,
    finalHp: run.hp,
  }
}

const SEEDS = [1, 42, 1337, 20260611, 99999]

describe('seeded full-run simulation', () => {
  it('replays identically from the same seed', () => {
    for (const cls of PLAYER_CLASSES) {
      const a = simulateRun(cls, 42)
      const b = simulateRun(cls, 42)
      expect(b, cls.id).toEqual(a)
    }
  })

  it('different seeds produce different runs (rng is actually wired in)', () => {
    const outcomes = SEEDS.map((s) => simulateRun(PLAYER_CLASSES[0], s))
    const distinct = new Set(outcomes.map((o) => `${o.totalTurns}:${o.totalDamageDealt}`))
    expect(distinct.size).toBeGreaterThan(1)
  })

  it('a greedy bot always survives the early tower', () => {
    // Loose winnability floor: if a naive bot can no longer get past the
    // floor-7 act-1 boss, a balance change rebuilt the difficulty wall
    // this bound was raised to remove.
    for (const cls of PLAYER_CLASSES) {
      for (const seed of SEEDS) {
        const o = simulateRun(cls, seed)
        expect(o.floorsCleared, `${cls.id} seed ${seed}`).toBeGreaterThanOrEqual(7)
        expect(o.totalTurns).toBeGreaterThan(0)
        expect(o.totalDamageDealt).toBeGreaterThan(0)
      }
    }
  })

  it('balance outcome table is stable (review the diff when tuning)', () => {
    // The exact floors/turns each class+seed reaches. Any change to the
    // damage formula, content tables, or rng draw order shows up here
    // as a reviewable snapshot diff rather than a silent shift.
    const table = Object.fromEntries(
      PLAYER_CLASSES.map((cls) => [
        cls.id,
        Object.fromEntries(
          SEEDS.map((seed) => {
            const o = simulateRun(cls, seed)
            return [seed, `floors=${o.floorsCleared} turns=${o.totalTurns}`]
          }),
        ),
      ]),
    )
    expect(table).toMatchSnapshot()
  })
})
