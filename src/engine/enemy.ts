// ─── ENEMY RESOLUTION ────────────────────────────────────────
// The single pipeline that turns (run, phase) into the Enemy actually
// being fought: variant pool → NG+ scaling → daily multipliers →
// phase-2 overlay. The old code derived this in render and then
// re-derived it by hand inside doPlayerMove; this is now the only copy.

import type { Enemy } from '@/types'
import { ENEMIES, getFloorEnemy } from '@/data'
import { ascensionEffects } from './ascension'
import {
  scaleEnemyForAscension,
  scaleEnemyForElite,
  scaleEnemyForNgPlus,
  scaleEnemyForSlacker,
} from './scaling'
import type { RunState } from './state'

/** Daily runs remap logical floor (0-14) onto the harder enemy pools. */
export function actualFloorIndex(run: RunState): number {
  if (run.mode.kind === 'daily') return run.mode.floorMap[run.floor] ?? run.floor
  return run.floor
}

/**
 * Variant + NG+ + elite scaling, before daily multipliers. The phase-2
 * HP threshold is measured against this enemy's maxHp (matching the
 * original behavior: daily HP multipliers stretch the bar but do not
 * move the phase-2 trigger point).
 */
export function resolveNgBaseEnemy(run: RunState): Enemy {
  const floorIdx = actualFloorIndex(run)
  const variant =
    run.floorEnemyIds.length > 0
      ? getFloorEnemy(floorIdx, run.floorEnemyIds[run.floor])
      : ENEMIES[floorIdx] || ENEMIES[0]
  const asc = ascensionEffects(run.ascension)
  const reorged = scaleEnemyForAscension(variant, {
    hp: asc.enemyHpMult,
    atk: asc.enemyAtkMult,
    dmg: asc.enemyDmgMult,
  })
  const scaled = scaleEnemyForNgPlus(reorged, run.ngPlus)
  if (run.eliteFloor || run.mystery === 'ambush')
    return scaleEnemyForElite(scaled, { hp: asc.eliteHpMult, atk: asc.eliteAtkMult })
  if (run.mystery === 'slacker') return scaleEnemyForSlacker(scaled)
  return scaled
}

/** Fully resolved enemy for the given phase. */
export function resolveEnemy(run: RunState, phase: 1 | 2): Enemy {
  const ngBase = resolveNgBaseEnemy(run)

  const daily =
    run.mode.kind === 'daily'
      ? {
          ...ngBase,
          maxHp: Math.round(ngBase.maxHp * run.mode.modifier.enemyHpMult),
          atk: Math.round(ngBase.atk * run.mode.modifier.enemyAtkMult),
          def: Math.round(ngBase.def * run.mode.modifier.enemyDefMult),
        }
      : ngBase

  if (phase === 2 && daily.phase2) return applyPhase2(daily)
  return daily
}

/** Project an enemy (Classic or office encounter) onto its phase-2 kit. */
export function applyPhase2(enemy: Enemy): Enemy {
  if (!enemy.phase2) return enemy
  return {
    ...enemy,
    name: enemy.phase2.name ?? enemy.name,
    emoji: enemy.phase2.emoji ?? enemy.emoji,
    maxHp: enemy.phase2.maxHp,
    atk: enemy.phase2.atk ?? enemy.atk,
    def: enemy.phase2.def ?? enemy.def,
    types: enemy.phase2.types ?? enemy.types,
    moves: enemy.phase2.moves,
    taunt: enemy.phase2.taunt,
  }
}

/** The battle-opening log line. */
export function battleIntroLine(enemy: Enemy): string {
  if (enemy.taunt) return `"${enemy.taunt}"`
  return enemy.name.startsWith('The ')
    ? `${enemy.name} appeared!`
    : `A wild ${enemy.name} appeared!`
}
