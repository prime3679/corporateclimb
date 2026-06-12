// ─── EFFECTIVE PLAYER ───────────────────────────────────────
// Base class + promotion move upgrades + every owned modifier's stat
// boosts, resolved into the PlayerClass the battle actually uses.

import type { PerkId, PlayerClass, RelicId } from '@/types'
import { getPromotionTrack } from '@/data'
import { collectMods } from './modifiers'

export function getEffectivePlayer(
  base: PlayerClass,
  classId: string,
  currentFloor: number,
  perks: PerkId[] = [],
  relics: RelicId[] = [],
): PlayerClass {
  const track = getPromotionTrack(classId)
  const moves = [...base.moves]
  for (const tier of track) {
    if (currentFloor < tier.floor) break
    if (tier.moveUpgrades) {
      for (const up of tier.moveUpgrades) {
        const idx = moves.findIndex((m) => m.name === up.fromName)
        if (idx >= 0) moves[idx] = up.to
      }
    }
  }
  const { statBoost } = collectMods(perks, relics)
  return {
    ...base,
    maxHp: base.maxHp + statBoost.maxHp,
    atk: base.atk + statBoost.atk,
    def: base.def + statBoost.def,
    moves,
  }
}
