// ─── BATTLE EVENTS ───────────────────────────────────────────
// A resolved turn is an ordered list of these. The engine produces
// them synchronously; the UI sequencer plays them back with timing,
// animation, and sound — and can fast-forward by applying the patches
// without the delays. Each event optionally carries a view patch so
// HP bars / badges / phase change exactly when the matching beat plays.

import type { StatusInstance } from '../types'

export type Side = 'player' | 'enemy'

export interface ViewPatch {
  playerHp?: number
  enemyHp?: number
  playerStatuses?: StatusInstance[]
  enemyStatuses?: StatusInstance[]
  enemyPhase?: 1 | 2
}

export type Effectiveness = 'super' | 'weak' | null

export type BattleEventKind =
  /** Actor lunges; swing sfx. */
  | { kind: 'attack'; side: Side; moveType: string }
  /** Attack missed; MISS popup on target. */
  | { kind: 'miss'; target: Side }
  /** Damage lands: hit anim + shake + popup + impact sfx. */
  | { kind: 'hit'; target: Side; amount: number; crit: boolean; eff: Effectiveness }
  /** Healing popup + sfx. */
  | { kind: 'heal'; target: Side; amount: number }
  /** Struggle recoil chip on the player. */
  | { kind: 'recoil'; amount: number }
  /** End-of-turn burnout chip damage. */
  | { kind: 'burn'; target: Side; amount: number }
  /** A status landed (badge update is in the patch). */
  | { kind: 'status'; target: Side; statusName: string }
  /** Status durations ticked down (patch only, no presentation). */
  | { kind: 'tick' }
  /** PP spent / inventory changed (patch only, no presentation). */
  | { kind: 'spend' }
  /** Item used: heal sfx. */
  | { kind: 'item'; itemName: string }
  /** Boss phase 2: shake + boss intro sfx; patch swaps the enemy. */
  | { kind: 'phase2' }
  /** Faint animation + sfx. */
  | { kind: 'faint'; side: Side }
  /** A battle log line. */
  | { kind: 'log'; text: string }
  /** An explicit dramatic beat with no other presentation. */
  | { kind: 'pause'; ms: number }

export type BattleEvent = BattleEventKind & { patch?: ViewPatch }
