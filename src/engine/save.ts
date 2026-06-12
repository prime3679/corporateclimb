// ─── VERSIONED SAVE ──────────────────────────────────────────
// v4 adds the branching-tower fields (relics, elite floor flag).
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
  getVictoryPayout,
  rollFloorEnemies,
} from '@/data'
import type { RunState } from './state'

export const SAVE_KEY = 'corporate-climb-save'

interface SaveFileV4 {
  version: 4
  run: RunState
}

interface SaveFileV3 {
  version: 3
  run: Omit<RunState, 'relics' | 'eliteFloor'>
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
  return true
}

/** v3 → v4: no relics yet, and a saved floor always re-picks its elevator. */
function migrateToV4(run: SaveFileV3['run']): RunState {
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

export function saveRun(run: RunState) {
  try {
    const file: SaveFileV4 = { version: 4, run }
    localStorage.setItem(SAVE_KEY, JSON.stringify(file))
  } catch {
    /* storage unavailable */
  }
}

/** Load and validate a saved run; accepts v4 or migrates v3/v2/v1. */
export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveFileV4 | SaveFileV3 | SaveFileV2 | SaveData
    let run: RunState
    if ('version' in parsed && parsed.version === 4) {
      // Daily runs are never persisted; a daily-mode save is stale.
      if (parsed.run.mode.kind !== 'normal') return null
      run = parsed.run
    } else if ('version' in parsed && parsed.version === 3) {
      if (parsed.run.mode.kind !== 'normal') return null
      run = migrateToV4(parsed.run)
    } else if ('version' in parsed && parsed.version === 2) {
      if (parsed.run.mode.kind !== 'normal') return null
      run = migrateToV4(migrateToV3(parsed.run))
    } else if ('classId' in parsed) {
      run = migrateToV4(migrateToV3(migrateV1(parsed as SaveData)))
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
