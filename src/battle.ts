// ─── BATTLE LOGIC ────────────────────────────────────────────
// Pure combat math and enemy AI, extracted from the game component
// so it can be unit-tested and tuned without touching React state.
// All randomness comes in through an injected rng so daily-challenge
// seeded runs stay deterministic.

import type { Move, EnemyMove, StatusInstance } from './types'

export type Rng = () => number

// Fallback move when every PP pool is empty. Recoil is applied by the
// caller (it costs the player HP, which is component state).
export const STRUGGLE_MOVE: Move = {
  name: 'Struggle',
  dmg: 5,
  type: 'normal',
  desc: 'Desperation. Hurts you too.',
  pp: 999,
}

/** Flat ATK modifier contributed by active statuses. */
export function getStatusAtkMod(statuses: StatusInstance[]): number {
  let mod = 0
  for (const s of statuses) {
    if (s.id === 'motivated') mod += 4
    if (s.id === 'micromanaged') mod -= 4
  }
  return mod
}

/** Flat DEF modifier contributed by active statuses. */
export function getStatusDefMod(statuses: StatusInstance[]): number {
  let mod = 0
  for (const s of statuses) {
    if (s.id === 'caffeinated') mod -= 3
    if (s.id === 'demoralized') mod -= 3
  }
  return mod
}

/** Additional crit chance (0-1) contributed by active statuses. */
export function getStatusCritBonus(statuses: StatusInstance[]): number {
  return statuses.some((s) => s.id === 'focused') ? 0.2 : 0
}

/** End-of-turn chip damage from burnout, 0 when not burned out. */
export function getBurnDamage(statuses: StatusInstance[]): number {
  return statuses.some((s) => s.id === 'burned_out') ? 8 : 0
}

/** Class perks applied to outgoing player damage. */
export function getClassPerkMods(classId: string): { dmgMult: number; critBonus: number } {
  return {
    dmgMult: classId === 'eng' ? 1.15 : 1, // Engineer: +15% damage
    critBonus: classId === 'design' ? 0.15 : 0, // Designer: +15% crit chance
  }
}

/**
 * Core damage roll. Consumes two rng values: variance (0.85-1.15) and
 * the crit check (base 10% + critBonus, crits deal 1.5x). Damage never
 * drops below 1, and atk/def are floored at 1 so the ratio stays sane.
 */
export function calcDamage(
  rng: Rng,
  atkStat: number,
  defStat: number,
  baseDmg: number,
  critBonus: number = 0,
  typeMult: number = 1,
): [number, boolean] {
  const variance = 0.85 + rng() * 0.3
  const isCrit = rng() < 0.1 + critBonus
  const crit = isCrit ? 1.5 : 1
  return [
    Math.max(
      1,
      Math.round(
        baseDmg * (Math.max(1, atkStat) / Math.max(1, defStat)) * variance * crit * typeMult,
      ),
    ),
    isCrit,
  ]
}

/**
 * Enemy move selection policy, in priority order:
 * 1. Below 35% HP: 70% chance to pick a healing move if one exists.
 * 2. Player healthy (>60%) and unafflicted: 50% chance to open with a debuff.
 * 3. Player nearly down (<25%): go for the kill with the biggest hit.
 * 4. Otherwise: uniform random.
 */
export function chooseEnemyMove(
  rng: Rng,
  moves: EnemyMove[],
  enemyHpPct: number,
  playerHpPct: number,
  playerStatusCount: number,
): EnemyMove {
  if (moves.length <= 1) return moves[0]

  if (enemyHpPct < 0.35) {
    const healMove = moves.find((m) => m.heal && m.heal > 0)
    if (healMove && rng() < 0.7) return healMove
  }

  if (playerHpPct > 0.6 && playerStatusCount === 0) {
    const debuffMove = moves.find((m) => m.status?.target === 'enemy')
    if (debuffMove && rng() < 0.5) return debuffMove
  }

  if (playerHpPct < 0.25) {
    return moves.reduce((a, b) => (b.dmg > a.dmg ? b : a))
  }

  return moves[Math.floor(rng() * moves.length)]
}
