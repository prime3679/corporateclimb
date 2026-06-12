// ─── RUN LIFECYCLE ───────────────────────────────────────────
// Creating runs (normal / daily / NG+), between-floor progression,
// hallway events, and victory bookkeeping — all pure functions over
// RunState. The hallway-event item reward is returned explicitly so
// the UI can announce it (it used to be granted silently).

import type { ClassId, Enemy, HallwayEvent, ItemId, PerkId, PlayerClass, RelicId } from '@/types'
import {
  ALL_ITEM_IDS,
  BASE_PERK_POOL,
  BASE_RELIC_POOL,
  CLASS_STARTING_ITEMS,
  ELITE_PAYOUT_MULT,
  HALLWAY_EVENTS,
  PERKS,
  PLAYER_CLASSES,
  RELICS,
  RELIC_DUPLICATE_OPTIONS,
  STATUS_DEFS,
  getPromotion,
  getVictoryPayout,
  rollFloorEnemies,
  rollMysteryOutcome,
  rollPerkOffer,
  rollRelicDrop,
} from '@/data'
import {
  createSeededRandom,
  getDailyFloorMap,
  getDailyModifier,
  getDailySeed,
  rollDailyEnemies,
} from '@/daily'
import type { DailyModifierContext } from '@/types'
import type { Rng } from './rng'
import { MAX_INVENTORY, type BattleState, type RunState } from './state'
import { isShopFloor, rollShopStock } from './shop'

export { MAX_INVENTORY }

const FRESH_PROGRESS = {
  floor: 0,
  level: 1,
  xp: 0,
  xpToNext: 30,
  atkBuff: 0,
  defBuff: 0,
  usedEvents: [] as string[],
  stats: { totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0 },
  stockOptions: 0,
  perks: [] as PerkId[],
  pendingPerkOffer: null,
  shopStock: null,
  relics: [] as RelicId[],
  eliteFloor: false,
  mystery: null,
}

/** Unlock-dependent offer/drop pools, frozen onto the run at start. */
export interface RunPools {
  perkPool: PerkId[]
  relicPool: RelicId[]
}

export const BASE_POOLS: RunPools = { perkPool: BASE_PERK_POOL, relicPool: BASE_RELIC_POOL }

function startingInventory(classId: string): ItemId[] {
  // classId is a plain string in RunState (it round-trips through saves).
  const item = CLASS_STARTING_ITEMS[classId as ClassId] as ItemId | undefined
  return item ? [item] : []
}

/** A fresh normal run for the chosen class. */
export function newRun(cls: PlayerClass, pools: RunPools = BASE_POOLS): RunState {
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
    perkPool: pools.perkPool,
    relicPool: pools.relicPool,
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
    // Dailies always draw from the base pools so everyone's offers and
    // drops are identical regardless of personal unlocks.
    perkPool: BASE_PERK_POOL,
    relicPool: BASE_RELIC_POOL,
  }
}

/** New Game+: keep level/xp, reset progress through the tower. */
export function newNgPlusRun(run: RunState, cls: PlayerClass, pools?: RunPools): RunState {
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
    stockOptions: 0,
    perks: [],
    pendingPerkOffer: null,
    shopStock: null,
    relics: [],
    eliteFloor: false,
    mystery: null,
    // Refresh pools: the win that led here may have unlocked content.
    perkPool: pools?.perkPool ?? run.perkPool,
    relicPool: pools?.relicPool ?? run.relicPool,
  }
}

export function newBattle(enemy: Enemy, perks: PerkId[] = []): BattleState {
  const opening = perks
    .map((id) => PERKS[id]?.startBattleStatus)
    .filter((s): s is NonNullable<typeof s> => !!s)
    .map((id) => ({ id, turnsLeft: STATUS_DEFS[id].duration }))
  return {
    enemyHp: enemy.maxHp,
    enemyPhase: 1,
    playerStatuses: opening,
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

  const itemChance = run.perks.reduce((c, id) => Math.max(c, PERKS[id]?.eventItemChance ?? 0), 0.3)
  if (inventory.length < MAX_INVENTORY && rng() < itemChance) {
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

/** XP + Stock Option payout and level-up after a battle win. */
export function applyVictory(
  run: RunState,
  effectiveMaxHp: number,
): { run: RunState; xpGained: number; leveledUp: boolean; optionsGained: number } {
  const xpGained = 15 + run.floor * 7
  const bonusMult = run.eliteFloor || run.mystery === 'windfall' ? ELITE_PAYOUT_MULT : 1
  const optionsGained = getVictoryPayout(run.floor, run.perks, run.relics) * bonusMult
  const newXp = run.xp + xpGained
  const stockOptions = run.stockOptions + optionsGained
  const leveledUp = newXp >= run.xpToNext
  if (!leveledUp) {
    return { run: { ...run, xp: newXp, stockOptions }, xpGained, leveledUp, optionsGained }
  }
  return {
    run: {
      ...run,
      level: run.level + 1,
      xp: newXp - run.xpToNext,
      xpToNext: run.xpToNext + 25,
      hp: Math.min(effectiveMaxHp, run.hp + 20),
      stockOptions,
    },
    xpGained,
    leveledUp,
    optionsGained,
  }
}

/** Post-battle healing: PM class perk (5 HP), Self Care, relic thrones. */
export function applyPostBattlePerk(run: RunState, effectiveMaxHp: number): RunState {
  let heal = run.classId === 'pm' ? 5 : 0
  for (const id of run.perks) heal += PERKS[id]?.postBattleHeal ?? 0
  for (const id of run.relics) heal += RELICS[id]?.postBattleHeal ?? 0
  if (heal === 0) return run
  return { ...run, hp: Math.min(effectiveMaxHp, run.hp + heal) }
}

/**
 * Beating an elite floor drops a Status Symbol the run doesn't own
 * yet — or a consolation payout once the trophy cabinet is full.
 */
export function awardEliteSpoils(
  run: RunState,
  rng: Rng,
): { run: RunState; relicGained: RelicId | null; bonusOptions: number } {
  const dropsRelic = run.eliteFloor || run.mystery === 'jackpot'
  if (!dropsRelic) return { run, relicGained: null, bonusOptions: 0 }
  const relicGained = rollRelicDrop(run.relics, rng, run.relicPool)
  if (relicGained) {
    return { run: { ...run, relics: [...run.relics, relicGained] }, relicGained, bonusOptions: 0 }
  }
  return {
    run: { ...run, stockOptions: run.stockOptions + RELIC_DUPLICATE_OPTIONS },
    relicGained: null,
    bonusOptions: RELIC_DUPLICATE_OPTIONS,
  }
}

// ─── THE ELEVATOR BANK ──────────────────────────────────────
// Before each non-boss floor the player picks an elevator: the
// standard floor, or the Executive Track — an elite version of the
// enemy for double payout and a Status Symbol.

/**
 * The Executive Track opens after the first promotion (a perk-less
 * rookie has no answer to an elite) and skips the boss floors at the
 * top of each act.
 */
export function eliteAvailable(floor: number): boolean {
  return floor >= 5 && floor % 10 < 8
}

/** Commit the elevator pick for the upcoming floor. */
export function chooseElevator(run: RunState, elite: boolean): RunState {
  if (elite && !eliteAvailable(run.floor)) return run
  if (run.eliteFloor === elite && run.mystery === null) return run
  return { ...run, eliteFloor: elite, mystery: null }
}

/**
 * Ride the unmarked third elevator: a seeded gamble. The outcome is
 * rolled now (and revealed at the floor intro) so a reload can't
 * re-roll it.
 */
export function chooseMysteryFloor(run: RunState, rng: Rng): RunState {
  if (!eliteAvailable(run.floor)) return run
  const outcome = rollMysteryOutcome(rng)
  return { ...run, mystery: outcome, eliteFloor: false }
}

// ─── FLOOR ADVANCEMENT ──────────────────────────────────────
// Moving to the next floor may queue a promotion perk choice and/or
// open the shop. Both are rolled here, through the injected rng, and
// stored on the run — so a reload mid-choice resumes instead of
// silently skipping the reward.

/** Whether moving prevFloor → nextFloor crosses a promotion tier. */
export function promotionBetween(classId: string, prevFloor: number, nextFloor: number): boolean {
  const prev = getPromotion(classId, prevFloor)
  const next = getPromotion(classId, nextFloor)
  return !!(prev && next && prev.title !== next.title)
}

/** Advance to the next floor, rolling any perk offer / shop stock. */
export function advanceFloor(run: RunState, rng: Rng): RunState {
  const prevFloor = run.floor
  const nextFloor = prevFloor + 1
  const mode = run.mode.kind
  const promoted = promotionBetween(run.classId, prevFloor, nextFloor)
  const itemsEnabled = run.mode.kind !== 'daily' || run.mode.modifier.itemsEnabled
  const shop = isShopFloor(nextFloor, mode) && itemsEnabled
  return {
    ...run,
    floor: nextFloor,
    pendingPerkOffer: promoted ? rollPerkOffer(run.perks, rng, run.perkPool) : run.pendingPerkOffer,
    shopStock: shop ? rollShopStock(rng) : null,
    // The elevator pick for the new floor hasn't happened yet.
    eliteFloor: false,
    mystery: null,
  }
}

/** Resolve a pending promotion offer; no-op if the pick isn't offered. */
export function choosePerk(run: RunState, perkId: PerkId): RunState {
  if (!run.pendingPerkOffer?.includes(perkId)) return run
  return {
    ...run,
    perks: [...run.perks, perkId],
    pendingPerkOffer: null,
    stockOptions: run.stockOptions + (PERKS[perkId]?.instantOptions ?? 0),
  }
}
