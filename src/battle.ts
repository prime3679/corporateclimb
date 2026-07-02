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
 * Smart enemy move selection, used on Re-Org tiers 3+ ("Smarter
 * Managers"). Kept strictly separate from chooseEnemyMove so the base
 * game and seeded dailies keep their exact rng draw order.
 *
 * Tier 1 — type-aware: moves are scored by expected damage against
 * the player's types (dmg × type multiplier × accuracy) and the pick
 * comes from the top two scores (one rng draw keeps it non-robotic).
 *
 * Tier 2 — ruthless: adds a guaranteed-lethal check (take the kill
 * when even a minimum roll ends the player), disciplined healing
 * (only under 50% HP, only when little is wasted), no re-applying an
 * already-active status, and pressing the biggest hit once the player
 * is under 40% HP.
 */
export function chooseEnemyMoveSmart(
  rng: Rng,
  moves: EnemyMove[],
  opts: {
    tier: 1 | 2
    enemyHpPct: number
    enemyMissingHp: number
    playerHpPct: number
    playerStatuses: StatusInstance[]
    enemyStatuses: StatusInstance[]
    /** Mean damage estimate for a move against the current player. */
    expectedDamage: (m: EnemyMove) => number
    /** Absolute player HP, for the lethal check. */
    playerHp: number
  },
): EnemyMove {
  if (moves.length <= 1) return moves[0]

  if (opts.tier >= 2) {
    // Take a guaranteed kill: minimum damage roll (0.85×) still lands it.
    const lethal = moves
      .filter((m) => m.dmg > 0 && opts.expectedDamage(m) * 0.85 >= opts.playerHp)
      .sort((a, b) => (b.acc ?? 100) - (a.acc ?? 100))[0]
    if (lethal) return lethal

    // Heal only when meaningfully hurt and the heal isn't mostly
    // wasted — and never so often that healing starves the offense
    // (a chain-healing enemy makes fights long but SAFE, which reads
    // as easier, not harder).
    const healMove = moves.find((m) => m.heal && m.heal > 0)
    if (
      healMove &&
      opts.enemyHpPct < 0.4 &&
      opts.enemyMissingHp >= (healMove.heal ?? 0) * 0.8 &&
      rng() < 0.5
    ) {
      return healMove
    }
  }

  const activeOnPlayer = new Set(opts.playerStatuses.map((s) => s.id))
  const activeOnEnemy = new Set(opts.enemyStatuses.map((s) => s.id))
  const biggest = Math.max(...moves.map((m) => m.dmg))

  const scored = moves
    .map((m) => {
      let score = opts.expectedDamage(m) * ((m.acc ?? 100) / 100)
      // A status the target already carries adds nothing.
      if (m.status) {
        const active = m.status.target === 'enemy' ? activeOnPlayer : activeOnEnemy
        if (active.has(m.status.id)) score *= 0.5
        else score += 6 // fresh status pressure has value beyond damage
      }
      // Pure heals: tier 2 heals only through the disciplined gate
      // above (scoring them too would double the heal frequency);
      // tier 1 scores them by need.
      if (m.heal && m.dmg === 0) {
        score = opts.tier >= 2 ? 0 : opts.enemyHpPct < 0.5 ? opts.enemyMissingHp * 0.5 : 0
      }
      // Kill pressure: press the biggest hit once the player is wounded.
      if (opts.tier >= 2 && m.dmg === biggest && m.dmg > 0 && opts.playerHpPct < 0.4) {
        score *= 1.25
      }
      return { m, score }
    })
    .sort((a, b) => b.score - a.score)

  // One draw picks between the top two, favoring the best.
  if (scored.length >= 2 && scored[1].score > 0) {
    return rng() < 0.72 ? scored[0].m : scored[1].m
  }
  return scored[0].m
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
