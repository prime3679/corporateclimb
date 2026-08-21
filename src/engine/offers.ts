// ─── SEEDED OFFERS & DROPS ──────────────────────────────────
// Every random reward roll: the promotion's pick-1-of-3, elite relic
// drops, the mystery elevator's gamble, and the Supply Closet cache.
// All draw through the injected rng so dailies stay deterministic, and
// all draw from the run's frozen pools so meta-progression unlocks apply.

import type { ItemId, MysteryOutcome, PerkDef, PerkId, RelicId } from '@/types'
import {
  ALL_ITEM_IDS,
  BASE_PERK_POOL,
  BASE_RELIC_POOL,
  MYSTERY_OUTCOMES,
  PERKS,
  TREASURE_LOOT_CHOICES,
} from '@/data'
import type { Rng } from './rng'

/**
 * Roll a promotion's pick-1-of-3 offer: [stat, passive, economy].
 * Owned one-time perks are excluded; if a category is exhausted it
 * falls back to a stat package (always repeatable).
 */
export function rollPerkOffer(
  owned: PerkId[],
  rng: Rng,
  offerPool: PerkId[] = BASE_PERK_POOL,
): PerkId[] {
  const pickFrom = (kind: PerkDef['kind']): PerkId | undefined => {
    const pool = offerPool.filter((id) => {
      const p = PERKS[id]
      return p.kind === kind && (p.repeatable || !owned.includes(id))
    })
    return pool[Math.floor(rng() * pool.length)]
  }
  const stat = pickFrom('stat')!
  const fallback = (): PerkId => {
    let alt = pickFrom('stat')!
    // Avoid duplicating the stat slot when possible.
    for (let i = 0; i < 4 && alt === stat; i++) alt = pickFrom('stat')!
    return alt
  }
  return [stat, pickFrom('passive') ?? fallback(), pickFrom('economy') ?? fallback()]
}

/** A random relic the run doesn't own yet, or null when complete. */
export function rollRelicDrop(
  owned: RelicId[],
  rng: Rng,
  dropPool: RelicId[] = BASE_RELIC_POOL,
): RelicId | null {
  const pool = dropPool.filter((id) => !owned.includes(id))
  if (pool.length === 0) return null
  return pool[Math.floor(rng() * pool.length)]
}

/** Roll a supply cache: distinct items, uniform across the table. */
export function rollTreasureLoot(rng: Rng, count = TREASURE_LOOT_CHOICES): ItemId[] {
  const pool = [...ALL_ITEM_IDS]
  const loot: ItemId[] = []
  while (loot.length < count && pool.length > 0) {
    loot.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }
  return loot
}

/** Roll a mystery outcome from the weighted table. */
export function rollMysteryOutcome(rng: Rng): MysteryOutcome {
  const total = MYSTERY_OUTCOMES.reduce((s, o) => s + o.weight, 0)
  let roll = rng() * total
  for (const o of MYSTERY_OUTCOMES) {
    roll -= o.weight
    if (roll < 0) return o.outcome
  }
  return MYSTERY_OUTCOMES[MYSTERY_OUTCOMES.length - 1].outcome
}
