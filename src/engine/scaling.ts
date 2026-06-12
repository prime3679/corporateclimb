// ─── ENEMY SCALING ──────────────────────────────────────────
// The pure stat transforms applied on top of a floor's content-table
// enemy: NG+ levels, the elite "Executive Track", and the mystery
// "Slacker" outcome. Content stays in data.ts; the math lives here.

import type { Enemy } from '@/types'

/** Scale an enemy's stats for NG+ (30% per NG+ level). */
export function scaleEnemyForNgPlus(e: Enemy, ngLevel: number): Enemy {
  if (ngLevel <= 0) return e
  const mult = 1 + ngLevel * 0.3
  const dmgMult = 1 + ngLevel * 0.15
  return {
    ...e,
    maxHp: Math.round(e.maxHp * mult),
    atk: Math.round(e.atk * mult),
    def: Math.round(e.def * mult),
    moves: e.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
    phase2: e.phase2
      ? {
          ...e.phase2,
          maxHp: Math.round(e.phase2.maxHp * mult),
          atk: e.phase2.atk ? Math.round(e.phase2.atk * mult) : undefined,
          def: e.phase2.def ? Math.round(e.phase2.def * mult) : undefined,
          moves: e.phase2.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
        }
      : undefined,
  }
}

/** The Executive Track: a meaner take on the floor's enemy. */
export function scaleEnemyForElite(e: Enemy): Enemy {
  const hpMult = 1.35
  const atkMult = 1.15
  const defMult = 1.1
  const dmgMult = 1.08
  return {
    ...e,
    name: `Elite ${e.name}`,
    title: `ELITE ${e.title}`,
    maxHp: Math.round(e.maxHp * hpMult),
    atk: Math.round(e.atk * atkMult),
    def: Math.round(e.def * defMult),
    moves: e.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
    phase2: e.phase2
      ? {
          ...e.phase2,
          maxHp: Math.round(e.phase2.maxHp * hpMult),
          atk: e.phase2.atk ? Math.round(e.phase2.atk * atkMult) : undefined,
          def: e.phase2.def ? Math.round(e.phase2.def * defMult) : undefined,
          moves: e.phase2.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * dmgMult) })),
        }
      : undefined,
  }
}

/** Slacker floors: the enemy would rather be anywhere else. */
export function scaleEnemyForSlacker(e: Enemy): Enemy {
  const mult = 0.75
  return {
    ...e,
    name: `Slacking ${e.name}`,
    maxHp: Math.round(e.maxHp * mult),
    atk: Math.round(e.atk * 0.85),
    moves: e.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * 0.9) })),
    phase2: e.phase2
      ? {
          ...e.phase2,
          maxHp: Math.round(e.phase2.maxHp * mult),
          atk: e.phase2.atk ? Math.round(e.phase2.atk * 0.85) : undefined,
          moves: e.phase2.moves.map((m) => ({ ...m, dmg: Math.round(m.dmg * 0.9) })),
        }
      : undefined,
  }
}
