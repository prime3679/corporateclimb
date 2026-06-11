// ─── ENEMY RESOLUTION ────────────────────────────────────────
// The single pipeline that turns (run, phase) into the Enemy actually
// being fought: variant pool → NG+ scaling → daily multipliers →
// phase-2 overlay. The old code derived this in render and then
// re-derived it by hand inside doPlayerMove; this is now the only copy.

import type { Enemy } from '@/types'
import { ENEMIES, getFloorEnemy, scaleEnemyForNgPlus } from '@/data'
import type { RunState } from './state'

/** Daily runs remap logical floor (0-14) onto the harder enemy pools. */
export function actualFloorIndex(run: RunState): number {
  if (run.mode.kind === 'daily') return run.mode.floorMap[run.floor] ?? run.floor
  return run.floor
}

/**
 * Variant + NG+ scaling, before daily multipliers. The phase-2 HP
 * threshold is measured against this enemy's maxHp (matching the
 * original behavior: daily HP multipliers stretch the bar but do not
 * move the phase-2 trigger point).
 */
export function resolveNgBaseEnemy(run: RunState): Enemy {
  const floorIdx = actualFloorIndex(run)
  const variant =
    run.floorEnemyIds.length > 0
      ? getFloorEnemy(floorIdx, run.floorEnemyIds[run.floor])
      : ENEMIES[floorIdx] || ENEMIES[0]
  return scaleEnemyForNgPlus(variant, run.ngPlus)
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

  if (phase === 2 && daily.phase2) {
    return {
      ...daily,
      name: daily.phase2.name ?? daily.name,
      emoji: daily.phase2.emoji ?? daily.emoji,
      maxHp: daily.phase2.maxHp,
      atk: daily.phase2.atk ?? daily.atk,
      def: daily.phase2.def ?? daily.def,
      types: daily.phase2.types ?? daily.types,
      moves: daily.phase2.moves,
    }
  }
  return daily
}

/** The battle-opening log line. */
export function battleIntroLine(enemy: Enemy): string {
  if (enemy.taunt) return `"${enemy.taunt}"`
  return enemy.name.startsWith('The ')
    ? `${enemy.name} appeared!`
    : `A wild ${enemy.name} appeared!`
}
