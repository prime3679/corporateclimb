// ─── STOCK OPTION ECONOMY ───────────────────────────────────
// The payout math. Floor-scaled base, modifier multipliers, then flat
// bonuses (so Dividends pays the same on every floor).

import type { PerkId, RelicId } from '@/types'
import { collectMods } from './modifiers'

export function getVictoryPayout(
  floor: number,
  perks: PerkId[] = [],
  relics: RelicId[] = [],
): number {
  const base = 8 + floor * 3
  const { payoutMult, flatPayout } = collectMods(perks, relics)
  return Math.round(base * payoutMult) + flatPayout
}
