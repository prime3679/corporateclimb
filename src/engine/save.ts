// ─── VERSIONED SAVE ──────────────────────────────────────────
// v6 adds the mystery-floor outcome.
// v5 added the meta-progression pools (perkPool/relicPool, frozen at
// run start from the player's achievement unlocks).
// v4 added the branching-tower fields (relics, elite floor flag).
// v3 added the roguelite-depth fields (stock options, perks, pending
// perk offer, shop stock); v2 serialized the whole RunState under a
// version tag; v1 was the old flat 17-field shape (still produced by
// the e2e fixtures). All older shapes are migrated on load.

import type { ClassId, PerkId, SaveData } from '@/types'
import {
  ENEMY_POOLS,
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

export const SAVE_KEY = 'corporate-climb-save'

interface SaveFileV5 {
  version: 5
  run: Omit<RunState, 'mystery'>
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

function isValidRun(run: RunState): boolean {
  if (!PLAYER_CLASSES.find((c) => c.id === run.classId)) return false
  if (run.floor < 0 || run.floor >= ENEMY_POOLS.length) return false
  if (!Array.isArray(run.perks) || run.perks.some((id) => !PERKS[id])) return false
  if (!Array.isArray(run.relics) || run.relics.some((id) => !RELICS[id])) return false
  if (!Array.isArray(run.perkPool) || run.perkPool.some((id) => !PERKS[id])) return false
  if (!Array.isArray(run.relicPool) || run.relicPool.some((id) => !RELICS[id])) return false
  return true
}

/** v5 → v6: a saved floor simply isn't a mystery. */
function migrateToV6(run: SaveFileV5['run']): RunState {
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
const MIGRATIONS = [migrateToV3, migrateToV4, migrateToV5, migrateToV6] as const

export const SAVE_VERSION = MIGRATIONS.length + 2

function migrateFrom(version: number, run: unknown): RunState {
  let r = run
  for (let v = version; v < SAVE_VERSION; v++) r = MIGRATIONS[v - 2](r as never)
  return r as RunState
}

export function saveRun(run: RunState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: SAVE_VERSION, run }))
  } catch {
    /* storage unavailable */
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
