// ─── CAREER ARCHETYPE TRAJECTORY ─────────────────────────────
// Covers the pure scoring engine (engine/archetypes.ts) and the
// data-integrity contract that every perk carries valid identity
// tags. The trajectory read-out is derived from run.perks, so these
// tests pin its determinism and its tie-break order.

import { describe, it, expect } from 'vitest'
import {
  CAREER_ARCHETYPES,
  UNDEFINED_INTERN,
  getCareerArchetype,
  getCareerArchetypeFromPoints,
  tallyArchetypePoints,
} from '@/engine'
import { PERKS, ALL_PERK_IDS } from '@/data'
import type { ArchetypeTag, PerkId } from '@/types'

const VALID_TAGS: ArchetypeTag[] = ['politics', 'productivity', 'burnout', 'loyalty', 'sabotage']

describe('perk archetype tag data integrity', () => {
  it('every perk has at least one archetype tag', () => {
    for (const id of ALL_PERK_IDS) {
      const tags = PERKS[id].archetypeTags
      expect(Array.isArray(tags), `${id} missing archetypeTags`).toBe(true)
      expect(tags.length, `${id} has no archetype tags`).toBeGreaterThan(0)
    }
  })

  it('every archetype tag is one of the five valid tags', () => {
    for (const id of ALL_PERK_IDS) {
      for (const tag of PERKS[id].archetypeTags) {
        expect(VALID_TAGS, `${id} has invalid tag ${tag}`).toContain(tag)
      }
    }
  })

  it('every archetype references only valid dominant tags', () => {
    for (const arch of CAREER_ARCHETYPES) {
      expect(arch.dominantTags.length).toBeGreaterThan(0)
      for (const tag of arch.dominantTags) {
        expect(VALID_TAGS).toContain(tag)
      }
    }
  })
})

describe('getCareerArchetype', () => {
  it('returns Undefined Intern with no tagged picks', () => {
    expect(getCareerArchetype([])).toBe(UNDEFINED_INTERN)
  })

  it('returns Undefined Intern when ids carry no known tags', () => {
    // Unknown ids must not crash and must not falsely name an archetype.
    expect(getCareerArchetype(['not_a_real_perk' as PerkId])).toBe(UNDEFINED_INTERN)
  })

  it('resolves a single dominant tag to the expected archetype', () => {
    // Pure burnout points -> Burnout Prophet (sole [burnout] archetype).
    const arch = getCareerArchetypeFromPoints({ burnout: 3 })
    expect(arch.id).toBe('burnout_prophet')
  })

  it('sums points across an archetype dominant tags', () => {
    // politics + sabotage both feed Office Sociopath.
    const arch = getCareerArchetypeFromPoints({ politics: 2, sabotage: 2 })
    expect(arch.id).toBe('office_sociopath')
  })

  it('higher total score wins', () => {
    // loyalty(3)+productivity(1) -> Loyal Drone score 4 beats others.
    const arch = getCareerArchetypeFromPoints({ loyalty: 3, productivity: 1 })
    expect(arch.id).toBe('loyal_drone')
  })

  it('breaks ties by the primary (first) dominant tag count', () => {
    // Office Sociopath [politics, sabotage] and Visibility Goblin
    // [politics, productivity] both score 2 here (politics 1 + other 1),
    // tie on total. Primary tag is 'politics' for both -> falls through
    // to declaration order: Office Sociopath is declared first.
    const arch = getCareerArchetypeFromPoints({ politics: 1, sabotage: 1, productivity: 1 })
    expect(arch.id).toBe('office_sociopath')
  })

  it('is deterministic for the same input', () => {
    const points = { politics: 2, productivity: 1 }
    const a = getCareerArchetypeFromPoints(points)
    const b = getCareerArchetypeFromPoints(points)
    expect(a.id).toBe(b.id)
  })

  it('ignores unknown extra tag keys without crashing', () => {
    const arch = getCareerArchetypeFromPoints({
      burnout: 2,
      // @ts-expect-error intentionally invalid tag key
      nonsense: 99,
    })
    expect(arch.id).toBe('burnout_prophet')
  })
})

describe('tallyArchetypePoints', () => {
  it('counts tags across owned perks', () => {
    // Pick two perks and confirm their tags accumulate.
    const sample = ALL_PERK_IDS.slice(0, 2)
    const points = tallyArchetypePoints(sample)
    const total = Object.values(points).reduce((s, n) => s + (n ?? 0), 0)
    const expected = sample.reduce((s, id) => s + PERKS[id].archetypeTags.length, 0)
    expect(total).toBe(expected)
  })

  it('returns empty points for an empty run', () => {
    expect(tallyArchetypePoints([])).toEqual({})
  })
})
