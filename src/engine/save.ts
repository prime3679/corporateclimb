// ─── VERSIONED SAVE ──────────────────────────────────────────
// v8 adds the Supply Closet treasure fields (raid flag + pending cache).
// v7 added the Re-Org ascension level.
// v6 added the mystery-floor outcome.
// v5 added the meta-progression pools (perkPool/relicPool, frozen at
// run start from the player's achievement unlocks).
// v4 added the branching-tower fields (relics, elite floor flag).
// v3 added the roguelite-depth fields (stock options, perks, pending
// perk offer, shop stock); v2 serialized the whole RunState under a
// version tag; v1 was the old flat 17-field shape (still produced by
// the e2e fixtures). All older shapes are migrated on load.
// Office uses a separate slot and migration in office/save.ts. Office v3
// preserves unfinished reward/dialogue chains and recovers missed v1/v2 promotions;
// it does not change the Classic v8 format or daily determinism.

import type { ClassId, PerkId, SaveData } from '@/types'
import {
  ENEMY_POOLS,
  ITEMS,
  MAX_ASCENSION,
  PERKS,
  PLAYER_CLASSES,
  PROMOTION_TRACKS,
  RELICS,
  getUnlockedAchievements,
  rollFloorEnemies,
  unlockedPerkPool,
  unlockedRelicPool,
} from '@/data'
import { getVictoryPayout } from './economy'
import type { RunState } from './state'
import { isCount, isRecord, isStringList, owns } from './validation'

export const SAVE_KEY = 'corporate-climb-save'

interface SaveFileV7 {
  version: 7
  run: Omit<RunState, 'treasureFloor' | 'treasureLoot'>
}

interface SaveFileV6 {
  version: 6
  run: Omit<SaveFileV7['run'], 'ascension'>
}

interface SaveFileV5 {
  version: 5
  run: Omit<SaveFileV6['run'], 'mystery'>
}

interface SaveFileV4 {
  version: 4
  run: Omit<SaveFileV5['run'], 'perkPool' | 'relicPool'>
}

interface SaveFileV3 {
  version: 3
  run: Omit<SaveFileV4['run'], 'relics' | 'eliteFloor'>
}

interface SaveFileV2 {
  version: 2
  run: Omit<SaveFileV3['run'], 'stockOptions' | 'perks' | 'pendingPerkOffer' | 'shopStock'>
}

export function isValidRun(value: unknown): value is RunState {
  if (!isRecord(value)) return false
  const run = value as unknown as RunState
  if (!isRecord(run.mode) || run.mode.kind !== 'normal') return false
  if (
    !['level', 'xp', 'xpToNext', 'hp', 'stockOptions', 'ngPlus'].every((key) => isCount(value[key]))
  )
    return false
  if (!Number.isInteger(run.level) || run.level < 1 || run.xpToNext <= 0) return false
  if (!Number.isFinite(run.atkBuff) || !Number.isFinite(run.defBuff)) return false
  if (!Array.isArray(run.pp) || run.pp.length !== 4 || !run.pp.every(isCount)) return false
  if (
    !isRecord(value.stats) ||
    ![value.stats.totalTurns, value.stats.totalDamageDealt, value.stats.itemsUsed].every(isCount)
  )
    return false
  if (!isStringList(run.usedEvents) || !isStringList(run.floorEnemyIds)) return false
  if (
    !isStringList(run.inventory) ||
    run.inventory.length > 4 ||
    !run.inventory.every((id) => owns(ITEMS, id))
  )
    return false
  if (
    run.pendingPerkOffer !== null &&
    (!isStringList(run.pendingPerkOffer) ||
      run.pendingPerkOffer.length < 1 ||
      !run.pendingPerkOffer.every((id) => owns(PERKS, id)))
  )
    return false
  if (
    run.shopStock !== null &&
    (!isStringList(run.shopStock) || !run.shopStock.every((id) => owns(ITEMS, id)))
  )
    return false
  if (typeof run.eliteFloor !== 'boolean' || typeof run.treasureFloor !== 'boolean') return false
  if (run.mystery !== null && !['windfall', 'slacker', 'ambush', 'jackpot'].includes(run.mystery))
    return false
  if (!PLAYER_CLASSES.find((c) => c.id === run.classId)) return false
  if (!Number.isInteger(run.floor) || run.floor < 0 || run.floor >= ENEMY_POOLS.length) return false
  if (!isStringList(run.perks) || run.perks.some((id) => !owns(PERKS, id))) return false
  if (!isStringList(run.relics) || run.relics.some((id) => !owns(RELICS, id))) return false
  if (!isStringList(run.perkPool) || run.perkPool.some((id) => !owns(PERKS, id))) return false
  if (!isStringList(run.relicPool) || run.relicPool.some((id) => !owns(RELICS, id))) return false
  if (!Number.isInteger(run.ascension) || run.ascension < 0 || run.ascension > MAX_ASCENSION)
    return false
  if (
    run.treasureLoot !== null &&
    (!Array.isArray(run.treasureLoot) || run.treasureLoot.some((id) => !ITEMS[id]))
  )
    return false
  return true
}

/** v7 → v8: no raid in progress, no cache pending. */
function migrateToV8(run: SaveFileV7['run']): RunState {
  return { ...run, treasureFloor: false, treasureLoot: null }
}

/** v6 → v7: pre-ladder saves are base-difficulty runs. */
function migrateToV7(run: SaveFileV6['run']): SaveFileV7['run'] {
  return { ...run, ascension: 0 }
}

/** v5 → v6: a saved floor simply isn't a mystery. */
function migrateToV6(run: SaveFileV5['run']): SaveFileV6['run'] {
  return { ...run, mystery: null }
}

/** v4 → v5: pools reflect whatever the player has unlocked by now. */
function migrateToV5(run: SaveFileV4['run']): SaveFileV5['run'] {
  const unlocked = getUnlockedAchievements()
  return { ...run, perkPool: unlockedPerkPool(unlocked), relicPool: unlockedRelicPool(unlocked) }
}

/** v3 → v4: no relics yet, and a saved floor always re-picks its elevator. */
function migrateToV4(run: SaveFileV3['run']): SaveFileV4['run'] {
  return { ...run, relics: [], eliteFloor: false }
}

/**
 * Grandfather a pre-perk run: each promotion already passed grants the
 * balanced stat package (≈ the fixed boost it used to give), and the
 * Stock Options the floors already cleared would have paid out.
 */
function migrateToV3(run: SaveFileV2['run']): SaveFileV3['run'] {
  const track = PROMOTION_TRACKS[run.classId as ClassId] ?? []
  const promotionsPassed = track.filter((t) => t.floor > 0 && run.floor >= t.floor).length
  let stockOptions = 0
  for (let f = 0; f < run.floor; f++) stockOptions += getVictoryPayout(f)
  return {
    ...run,
    stockOptions,
    perks: Array<PerkId>(promotionsPassed).fill('balanced_package'),
    pendingPerkOffer: null,
    shopStock: null,
  }
}

function migrateV1(data: SaveData): SaveFileV2['run'] {
  return {
    mode: { kind: 'normal' },
    classId: data.classId,
    floor: data.floor,
    level: data.level,
    xp: data.xp,
    xpToNext: data.xpToNext,
    hp: data.playerHp,
    pp: data.playerPp,
    atkBuff: data.atkBuff,
    defBuff: data.defBuff,
    inventory: data.inventory || [],
    floorEnemyIds: data.floorEnemyIds || rollFloorEnemies(),
    ngPlus: data.ngPlus || 0,
    stats: {
      totalTurns: data.totalTurns || 0,
      totalDamageDealt: data.totalDamageDealt || 0,
      itemsUsed: data.itemsUsed || 0,
    },
    usedEvents: data.usedEvents || [],
    rngState: null,
  }
}

/**
 * The migration pipeline: MIGRATIONS[i] lifts a (i+2)-shaped run one
 * version up. SAVE_VERSION is derived from the table, so registering
 * a migration and bumping the version are physically one edit — a
 * forgotten entry cannot silently wipe saves.
 */
const MIGRATIONS = [
  migrateToV3,
  migrateToV4,
  migrateToV5,
  migrateToV6,
  migrateToV7,
  migrateToV8,
] as const

export const SAVE_VERSION = MIGRATIONS.length + 2

function migrateFrom(version: number, run: unknown): RunState {
  let r = run
  for (let v = version; v < SAVE_VERSION; v++) r = MIGRATIONS[v - 2](r as never)
  return r as RunState
}

export function saveRun(run: RunState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, run }))
    return true
  } catch {
    return false
  }
}

/** Load and validate a saved run, migrating any older shape. */
export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { version: number; run: SaveFileV2['run'] } | SaveData
    let run: RunState
    if ('version' in parsed) {
      if (!Number.isInteger(parsed.version)) return null
      if (parsed.version < 2 || parsed.version > SAVE_VERSION) return null
      // Daily runs are never persisted; a daily-mode save is stale.
      if (parsed.run.mode.kind !== 'normal') return null
      run = migrateFrom(parsed.version, parsed.run)
    } else if ('classId' in parsed) {
      run = migrateFrom(2, migrateV1(parsed))
    } else {
      return null
    }
    return isValidRun(run) ? run : null
  } catch {
    return null
  }
}

export function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY)
  } catch {
    /* storage unavailable */
  }
}
