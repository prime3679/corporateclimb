// ─── RUN LIFECYCLE ───────────────────────────────────────────
// Creating runs (normal / daily / NG+), between-floor progression,
// hallway events, and victory bookkeeping — all pure functions over
// RunState. The hallway-event item reward is returned explicitly so
// the UI can announce it (it used to be granted silently).

import type { Enemy, HallwayEvent, ItemId, PlayerClass } from '../types'
import {
  ALL_ITEM_IDS,
  CLASS_STARTING_ITEMS,
  HALLWAY_EVENTS,
  PLAYER_CLASSES,
  rollFloorEnemies,
} from '../data'
import {
  createSeededRandom,
  getDailyFloorMap,
  getDailyModifier,
  getDailySeed,
  rollDailyEnemies,
} from '../daily'
import type { DailyModifierContext } from '../types'
import type { Rng } from './rng'
import type { BattleState, RunState } from './state'

export const MAX_INVENTORY = 4

const FRESH_PROGRESS = {
  floor: 0,
  level: 1,
  xp: 0,
  xpToNext: 30,
  atkBuff: 0,
  defBuff: 0,
  usedEvents: [] as string[],
  stats: { totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0 },
}

function startingInventory(classId: string): ItemId[] {
  const item = CLASS_STARTING_ITEMS[classId]
  return item ? [item] : []
}

/** A fresh normal run for the chosen class. */
export function newRun(cls: PlayerClass): RunState {
  return {
    mode: { kind: 'normal' },
    classId: cls.id,
    ...FRESH_PROGRESS,
    hp: cls.maxHp,
    pp: cls.moves.map((m) => m.pp),
    inventory: startingInventory(cls.id),
    floorEnemyIds: rollFloorEnemies(),
    ngPlus: 0,
    rngState: null,
  }
}

/**
 * Today's daily run. The seed determines the modifier, the floor
 * gauntlet, the enemy variants, the in-run rng — and under the Reorg
 * modifier, the class itself.
 */
export function newDailyRun(chosenClass: PlayerClass, date: Date = new Date()): RunState {
  const seed = getDailySeed(date)
  const modifier = getDailyModifier(seed)
  const floorMap = getDailyFloorMap(seed)
  const floorEnemyIds = rollDailyEnemies(seed, floorMap)

  const ctx: DailyModifierContext = {
    enemyAtkMult: 1,
    enemyHpMult: 1,
    enemyDefMult: 1,
    playerDefMult: 1,
    itemsEnabled: true,
    eventsEnabled: true,
    ppMult: 1,
    assignedClassId: undefined,
  }
  modifier.apply(ctx)

  const cls =
    modifier.id === 'reorg'
      ? PLAYER_CLASSES[Math.floor(createSeededRandom(seed + 99)() * PLAYER_CLASSES.length)]
      : chosenClass

  return {
    mode: { kind: 'daily', seed, modifierId: modifier.id, modifier: ctx, floorMap },
    classId: cls.id,
    ...FRESH_PROGRESS,
    hp: cls.maxHp,
    pp: cls.moves.map((m) => Math.floor(m.pp * ctx.ppMult)),
    inventory: ctx.itemsEnabled ? startingInventory(cls.id) : [],
    floorEnemyIds,
    ngPlus: 1, // dailies run at NG+1 difficulty
    rngState: (seed + 10) | 0,
  }
}

/** New Game+: keep level/xp, reset progress through the tower. */
export function newNgPlusRun(run: RunState, cls: PlayerClass): RunState {
  return {
    ...run,
    mode: { kind: 'normal' },
    floor: 0,
    hp: cls.maxHp,
    pp: cls.moves.map((m) => m.pp),
    atkBuff: 0,
    defBuff: 0,
    inventory: startingInventory(cls.id),
    floorEnemyIds: rollFloorEnemies(),
    ngPlus: run.ngPlus + 1,
    stats: { totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0 },
    usedEvents: [],
    rngState: null,
  }
}

export function newBattle(enemy: Enemy): BattleState {
  return {
    enemyHp: enemy.maxHp,
    enemyPhase: 1,
    playerStatuses: [],
    enemyStatuses: [],
    phase: 'player',
  }
}

/**
 * Two distinct hallway events the player hasn't seen this cycle,
 * picked with an unbiased Fisher-Yates shuffle. When fewer than two
 * remain the used-set resets (reflected in the returned run).
 */
export function pickTwoEvents(
  run: RunState,
  rng: Rng,
): { options: [HallwayEvent, HallwayEvent]; run: RunState } {
  let used = run.usedEvents
  let available = HALLWAY_EVENTS.filter((e) => !used.includes(e.id))
  if (available.length < 2) {
    used = []
    available = [...HALLWAY_EVENTS]
  } else {
    available = [...available]
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[available[i], available[j]] = [available[j], available[i]]
  }
  return {
    options: [available[0], available[1]],
    run: used === run.usedEvents ? run : { ...run, usedEvents: used },
  }
}

/**
 * Apply a hallway-event choice. Healing is clamped to the effective
 * max HP (the old code let ATK buffs inflate the cap). Returns the
 * bonus item if the 30% reward roll landed, so the UI can announce it.
 */
export function applyEventChoice(
  run: RunState,
  effectivePlayer: PlayerClass,
  event: HallwayEvent,
  choiceIdx: number,
  rng: Rng,
): { run: RunState; itemGained: ItemId | null } {
  const eff = event.choices[choiceIdx].effect
  let { hp, atkBuff, defBuff } = run
  let pp = run.pp
  let inventory = run.inventory
  let itemGained: ItemId | null = null

  if (eff.hp) hp = Math.max(1, Math.min(effectivePlayer.maxHp, hp + eff.hp))
  if (eff.atk) atkBuff += eff.atk
  if (eff.def) defBuff += eff.def
  if (eff.ppRestore) {
    pp = pp.map((v, i) => Math.min(effectivePlayer.moves[i].pp, v + eff.ppRestore!))
  }

  if (inventory.length < MAX_INVENTORY && rng() < 0.3) {
    itemGained = ALL_ITEM_IDS[Math.floor(rng() * ALL_ITEM_IDS.length)]
    inventory = [...inventory, itemGained]
  }

  return {
    run: {
      ...run,
      hp,
      pp,
      atkBuff,
      defBuff,
      inventory,
      usedEvents: [...run.usedEvents, event.id],
    },
    itemGained,
  }
}

/** XP award and level-up after a battle win. */
export function applyVictory(
  run: RunState,
  effectiveMaxHp: number,
): { run: RunState; xpGained: number; leveledUp: boolean } {
  const xpGained = 15 + run.floor * 7
  const newXp = run.xp + xpGained
  const leveledUp = newXp >= run.xpToNext
  if (!leveledUp) {
    return { run: { ...run, xp: newXp }, xpGained, leveledUp }
  }
  return {
    run: {
      ...run,
      level: run.level + 1,
      xp: newXp - run.xpToNext,
      xpToNext: run.xpToNext + 25,
      hp: Math.min(effectiveMaxHp, run.hp + 20),
    },
    xpGained,
    leveledUp,
  }
}

/** PM class perk: heal 5 HP after each battle. */
export function applyPostBattlePerk(run: RunState, effectiveMaxHp: number): RunState {
  if (run.classId !== 'pm') return run
  return { ...run, hp: Math.min(effectiveMaxHp, run.hp + 5) }
}
