// ─── VERSIONED SAVE ──────────────────────────────────────────
// v2 serializes the whole RunState under a version tag. v1 saves (the
// old flat 17-field shape, still produced by older clients and the e2e
// fixtures) are migrated on load instead of being enumerated by hand
// all over the component.

import type { SaveData } from '../types'
import { ENEMY_POOLS, PLAYER_CLASSES, rollFloorEnemies } from '../data'
import type { RunState } from './state'

export const SAVE_KEY = 'corporate-climb-save'

interface SaveFileV2 {
  version: 2
  run: RunState
}

function isValidRun(run: RunState): boolean {
  if (!PLAYER_CLASSES.find((c) => c.id === run.classId)) return false
  if (run.floor < 0 || run.floor >= ENEMY_POOLS.length) return false
  return true
}

function migrateV1(data: SaveData): RunState {
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
    const file: SaveFileV2 = { version: 2, run }
    localStorage.setItem(SAVE_KEY, JSON.stringify(file))
  } catch {
    /* storage unavailable */
  }
}

/** Load and validate a saved run; accepts v2 or migrates v1. */
export function loadRun(): RunState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as SaveFileV2 | SaveData
    let run: RunState
    if ('version' in parsed && parsed.version === 2) {
      // Daily runs are never persisted; a daily-mode save is stale.
      if (parsed.run.mode.kind !== 'normal') return null
      run = parsed.run
    } else if ('classId' in parsed) {
      run = migrateV1(parsed as SaveData)
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
