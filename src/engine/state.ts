// ─── CANONICAL GAME STATE ────────────────────────────────────
// The single source of truth for a run. Everything the old component
// held in ~35 useState hooks (plus the gsRef mirror) lives here as one
// serializable tree. Daily mode is a config on the same pipeline, not
// a parallel set of booleans and refs.

import type { DailyModifierContext, ItemId, StatusInstance } from '../types'

export type RunMode =
  | { kind: 'normal' }
  | {
      kind: 'daily'
      seed: number
      modifierId: string
      modifier: DailyModifierContext
      floorMap: number[]
    }

export interface RunStats {
  totalTurns: number
  totalDamageDealt: number
  itemsUsed: number
}

export interface RunState {
  mode: RunMode
  classId: string
  floor: number
  level: number
  xp: number
  xpToNext: number
  hp: number
  pp: number[]
  atkBuff: number
  defBuff: number
  inventory: ItemId[]
  /** Enemy variant rolled per floor, by enemy name. */
  floorEnemyIds: string[]
  ngPlus: number
  stats: RunStats
  usedEvents: string[]
  /** Seeded rng state for daily runs; null = Math.random. */
  rngState: number | null
}

export type BattlePhase = 'player' | 'won' | 'lost'

export interface BattleState {
  enemyHp: number
  enemyPhase: 1 | 2
  playerStatuses: StatusInstance[]
  enemyStatuses: StatusInstance[]
  phase: BattlePhase
}

export function dailyCtx(run: RunState): DailyModifierContext | null {
  return run.mode.kind === 'daily' ? run.mode.modifier : null
}
