// ─── ENEMY SCALING ──────────────────────────────────────────
// The pure stat transforms applied on top of a floor's content-table
// enemy: NG+ levels, the elite "Executive Track", and the mystery
// "Slacker" outcome. One parameterized transform; the variants are
// just multiplier sets and a rename.

import type { Enemy } from '@/types'

interface EnemyMults {
  hp: number
  atk: number
  /** DEF multiplier; slackers leave DEF untouched. */
  def?: number
  dmg: number
  rename?: (name: string) => string
  retitle?: (title: string) => string
}

function scaleEnemy(e: Enemy, m: EnemyMults): Enemy {
  return {
    ...e,
    name: m.rename ? m.rename(e.name) : e.name,
    title: m.retitle ? m.retitle(e.title) : e.title,
    maxHp: Math.round(e.maxHp * m.hp),
    atk: Math.round(e.atk * m.atk),
    def: m.def !== undefined ? Math.round(e.def * m.def) : e.def,
    moves: e.moves.map((mv) => ({ ...mv, dmg: Math.round(mv.dmg * m.dmg) })),
    phase2: e.phase2
      ? {
          ...e.phase2,
          maxHp: Math.round(e.phase2.maxHp * m.hp),
          atk: e.phase2.atk ? Math.round(e.phase2.atk * m.atk) : undefined,
          def:
            m.def !== undefined && e.phase2.def ? Math.round(e.phase2.def * m.def) : e.phase2.def,
          moves: e.phase2.moves.map((mv) => ({ ...mv, dmg: Math.round(mv.dmg * m.dmg) })),
        }
      : undefined,
  }
}

/** Scale an enemy's stats for NG+ (30% per NG+ level). */
export function scaleEnemyForNgPlus(e: Enemy, ngLevel: number): Enemy {
  if (ngLevel <= 0) return e
  const mult = 1 + ngLevel * 0.3
  return scaleEnemy(e, { hp: mult, atk: mult, def: mult, dmg: 1 + ngLevel * 0.15 })
}

/** The Executive Track: a meaner take on the floor's enemy. */
export function scaleEnemyForElite(e: Enemy): Enemy {
  return scaleEnemy(e, {
    hp: 1.35,
    atk: 1.15,
    def: 1.1,
    dmg: 1.08,
    rename: (n) => `Elite ${n}`,
    retitle: (t) => `ELITE ${t}`,
  })
}

/** Slacker floors: the enemy would rather be anywhere else. */
export function scaleEnemyForSlacker(e: Enemy): Enemy {
  return scaleEnemy(e, { hp: 0.75, atk: 0.85, dmg: 0.9, rename: (n) => `Slacking ${n}` })
}
