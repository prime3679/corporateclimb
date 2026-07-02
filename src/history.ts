// ─── RUN HISTORY & LIFETIME STATS ────────────────────────────
// Every finished run (win or loss, normal or daily) is recorded to a
// capped ring buffer plus a running lifetime aggregate. Storage access
// is try/catch throughout (private browsing must never crash the
// game); a corrupt blob degrades to "no history".

import type { PerkId, RelicId } from '@/types'
import type { RunState } from '@/engine'

export const HISTORY_KEY = 'corporate-climb-run-history'
export const LIFETIME_KEY = 'corporate-climb-lifetime'

/** Newest-first ring buffer cap. */
export const HISTORY_CAP = 50

export interface RunRecord {
  endedAt: number
  classId: string
  mode: 'normal' | 'daily'
  won: boolean
  /** 1-based floor the run ended on (total floors for a win). */
  floorReached: number
  ngPlus: number
  ascension: number
  totalTurns: number
  totalDamageDealt: number
  itemsUsed: number
  perks: PerkId[]
  relics: RelicId[]
  stockOptions: number
  /** Enemy that ended a lost run. */
  defeatedBy?: string
}

export interface LifetimeStats {
  runs: number
  wins: number
  bestFloor: number
  totalTurns: number
  totalDamageDealt: number
  itemsUsed: number
  runsByClass: Record<string, number>
  winsByClass: Record<string, number>
}

export const EMPTY_LIFETIME: LifetimeStats = {
  runs: 0,
  wins: 0,
  bestFloor: 0,
  totalTurns: 0,
  totalDamageDealt: 0,
  itemsUsed: 0,
  runsByClass: {},
  winsByClass: {},
}

export function getRunHistory(): RunRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as RunRecord[]) : []
  } catch {
    return []
  }
}

export function getLifetimeStats(): LifetimeStats {
  try {
    const raw = localStorage.getItem(LIFETIME_KEY)
    if (!raw) return { ...EMPTY_LIFETIME }
    const parsed = JSON.parse(raw) as Partial<LifetimeStats>
    return {
      runs: Number(parsed.runs) || 0,
      wins: Number(parsed.wins) || 0,
      bestFloor: Number(parsed.bestFloor) || 0,
      totalTurns: Number(parsed.totalTurns) || 0,
      totalDamageDealt: Number(parsed.totalDamageDealt) || 0,
      itemsUsed: Number(parsed.itemsUsed) || 0,
      runsByClass:
        parsed.runsByClass && typeof parsed.runsByClass === 'object' ? parsed.runsByClass : {},
      winsByClass:
        parsed.winsByClass && typeof parsed.winsByClass === 'object' ? parsed.winsByClass : {},
    }
  } catch {
    return { ...EMPTY_LIFETIME }
  }
}

/** Pure fold, exported for tests. */
export function addToLifetime(stats: LifetimeStats, record: RunRecord): LifetimeStats {
  return {
    runs: stats.runs + 1,
    wins: stats.wins + (record.won ? 1 : 0),
    bestFloor: Math.max(stats.bestFloor, record.floorReached),
    totalTurns: stats.totalTurns + record.totalTurns,
    totalDamageDealt: stats.totalDamageDealt + record.totalDamageDealt,
    itemsUsed: stats.itemsUsed + record.itemsUsed,
    runsByClass: {
      ...stats.runsByClass,
      [record.classId]: (stats.runsByClass[record.classId] ?? 0) + 1,
    },
    winsByClass: record.won
      ? { ...stats.winsByClass, [record.classId]: (stats.winsByClass[record.classId] ?? 0) + 1 }
      : stats.winsByClass,
  }
}

/**
 * Record a finished run into the history buffer and lifetime
 * aggregate. Returns the record (also when storage is unavailable, so
 * the run-end screens can still display it).
 */
export function recordRunEnd(
  run: RunState,
  outcome: { won: boolean; floorReached: number; defeatedBy?: string },
): RunRecord {
  const record: RunRecord = {
    endedAt: Date.now(),
    classId: run.classId,
    mode: run.mode.kind,
    won: outcome.won,
    floorReached: outcome.floorReached,
    ngPlus: run.ngPlus,
    ascension: (run as { ascension?: number }).ascension ?? 0,
    totalTurns: run.stats.totalTurns,
    totalDamageDealt: run.stats.totalDamageDealt,
    itemsUsed: run.stats.itemsUsed,
    perks: run.perks,
    relics: run.relics,
    stockOptions: run.stockOptions,
    ...(outcome.defeatedBy ? { defeatedBy: outcome.defeatedBy } : {}),
  }
  try {
    const history = [record, ...getRunHistory()].slice(0, HISTORY_CAP)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    /* storage unavailable */
  }
  try {
    localStorage.setItem(LIFETIME_KEY, JSON.stringify(addToLifetime(getLifetimeStats(), record)))
  } catch {
    /* storage unavailable */
  }
  return record
}
