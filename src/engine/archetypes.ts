// ─── CAREER ARCHETYPES ──────────────────────────────────────
// The "trajectory" read-out. A run's accumulated perk picks each
// carry identity tags (see PerkDef.archetypeTags). We tally those
// tags and name the dominant career archetype back to the player.
// This is a pure, derived read of run.perks — it adds no mutable
// state and needs no save migration.
import type { ArchetypeTag, PerkId } from '../types'
import { PERKS } from '../content/perks'

export interface CareerArchetype {
  id: string
  name: string
  /** Ordered: index 0 is the primary tag used in tie-breaks. */
  dominantTags: ArchetypeTag[]
  description: string
}

/** Neutral state shown before any tagged perk is picked. */
export const UNDEFINED_INTERN: CareerArchetype = {
  id: 'undefined_intern',
  name: 'Undefined Intern',
  dominantTags: [],
  description: 'Your corporate soul is still technically recoverable.',
}

// Declaration order is the final, deterministic tie-break.
export const CAREER_ARCHETYPES: readonly CareerArchetype[] = [
  {
    id: 'office_sociopath',
    name: 'Office Sociopath',
    dominantTags: ['politics', 'sabotage'],
    description: 'You climb by turning every relationship into leverage.',
  },
  {
    id: 'productivity_martyr',
    name: 'Productivity Martyr',
    dominantTags: ['productivity', 'burnout'],
    description: 'You have confused self-destruction with dedication.',
  },
  {
    id: 'loyal_drone',
    name: 'Loyal Drone',
    dominantTags: ['loyalty', 'productivity'],
    description: 'Management loves you because you never ask why.',
  },
  {
    id: 'visibility_goblin',
    name: 'Visibility Goblin',
    dominantTags: ['politics', 'productivity'],
    description: 'You do not do the most work. You do the most perceived work.',
  },
  {
    id: 'burnout_prophet',
    name: 'Burnout Prophet',
    dominantTags: ['burnout'],
    description: 'You have seen the abyss, and the abyss scheduled a follow-up meeting.',
  },
  {
    id: 'quiet_saboteur',
    name: 'Quiet Saboteur',
    dominantTags: ['sabotage', 'loyalty'],
    description: 'You make problems disappear. Sometimes the problem is a coworker.',
  },
]

export type ArchetypePoints = Partial<Record<ArchetypeTag, number>>

/** Tally archetype tags across a run's owned perks. Unknown ids skipped. */
export function tallyArchetypePoints(perkIds: readonly PerkId[]): ArchetypePoints {
  const points: ArchetypePoints = {}
  for (const id of perkIds) {
    const tags = PERKS[id]?.archetypeTags
    if (!tags) continue
    for (const tag of tags) {
      points[tag] = (points[tag] ?? 0) + 1
    }
  }
  return points
}

function score(arch: CareerArchetype, points: ArchetypePoints): number {
  return arch.dominantTags.reduce((sum, tag) => sum + (points[tag] ?? 0), 0)
}

/**
 * Resolve the dominant career archetype from accumulated tag points.
 * Tie-break order: (1) higher total score, (2) higher count in the
 * archetype's primary (first) dominant tag, (3) static declaration
 * order. Returns Undefined Intern when no tagged perks are present.
 * Robust to unknown/extra tag keys (they simply never match).
 */
export function getCareerArchetypeFromPoints(points: ArchetypePoints): CareerArchetype {
  const hasAnyKnown = CAREER_ARCHETYPES.some((a) => score(a, points) > 0)
  if (!hasAnyKnown) return UNDEFINED_INTERN

  let best = CAREER_ARCHETYPES[0]
  let bestScore = score(best, points)
  let bestPrimary = points[best.dominantTags[0]] ?? 0

  for (let i = 1; i < CAREER_ARCHETYPES.length; i++) {
    const arch = CAREER_ARCHETYPES[i]
    const s = score(arch, points)
    const primary = points[arch.dominantTags[0]] ?? 0
    if (s > bestScore || (s === bestScore && primary > bestPrimary)) {
      best = arch
      bestScore = s
      bestPrimary = primary
    }
  }
  return best
}

/** Convenience: derive the career archetype directly from owned perks. */
export function getCareerArchetype(perkIds: readonly PerkId[]): CareerArchetype {
  return getCareerArchetypeFromPoints(tallyArchetypePoints(perkIds))
}
