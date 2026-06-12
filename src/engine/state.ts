// ─── CANONICAL GAME STATE ────────────────────────────────────
// The single source of truth for a run. Everything the old component
// held in ~35 useState hooks (plus the gsRef mirror) lives here as one
// serializable tree. Daily mode is a config on the same pipeline, not
// a parallel set of booleans and refs.

import type { DailyModifierContext, ItemId, PerkId, RelicId, StatusInstance } from '@/types'

export const MAX_INVENTORY = 4

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
  /** Stock Options balance (the run currency). */
  stockOptions: number
  /** Perks picked at promotions (stat packages may repeat). */
  perks: PerkId[]
  /** Unresolved pick-1-of-3 promotion offer; non-null = choice pending. */
  pendingPerkOffer: PerkId[] | null
  /** Shop stock for the current stop; non-null = the shop is open. */
  shopStock: ItemId[] | null
  /** Status Symbols collected from elite floors (each owned once). */
  relics: RelicId[]
  /** The current floor is the elite "Executive Track" version. */
  eliteFloor: boolean
  /** Perk ids this run can offer (unlocks frozen at run start). */
  perkPool: PerkId[]
  /** Relic ids this run can drop (unlocks frozen at run start). */
  relicPool: RelicId[]
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
