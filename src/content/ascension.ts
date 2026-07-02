// ─── THE RE-ORG (ascension ladder) ──────────────────────────
// Post-win stacking difficulty tiers, named as escalating corporate
// dysfunction. Playing at Re-Org level N applies the effects of every
// tier 1..N cumulatively (the fold lives in src/engine/ascension.ts —
// this module is the content table only). Winning at level N unlocks
// N+1 for that class; dailies always run at level 0 so share grids
// stay comparable.

export const MAX_ASCENSION = 10

export interface AscensionTierEffect {
  /** Multipliers stack across tiers. */
  enemyHpMult?: number
  enemyAtkMult?: number
  enemyDmgMult?: number
  postBattleHealMult?: number
  payoutMult?: number
  wellnessPriceMult?: number
  itemDmgMult?: number
  bossDmgMult?: number
  /** Overrides replace the previous value. */
  eliteHpMult?: number
  eliteAtkMult?: number
  promotionHealFraction?: number
  levelUpHeal?: number
  bossPhase2Threshold?: number
  smartAiTier?: 1 | 2
}

export interface AscensionTierDef {
  level: number
  name: string
  desc: string
  icon: string
  effect: AscensionTierEffect
}

export const ASCENSION_TIERS: AscensionTierDef[] = [
  {
    level: 1,
    name: 'Higher Expectations',
    desc: 'Enemies have 10% more HP.',
    icon: '📊',
    effect: { enemyHpMult: 1.1 },
  },
  {
    level: 2,
    name: 'Aggressive Targets',
    desc: 'Enemies hit harder: +10% ATK, +5% move damage.',
    icon: '🎯',
    effect: { enemyAtkMult: 1.1, enemyDmgMult: 1.05 },
  },
  {
    level: 3,
    name: 'Smarter Managers',
    desc: 'Enemies exploit your type weaknesses.',
    icon: '🧠',
    effect: { smartAiTier: 1 },
  },
  {
    level: 4,
    name: 'Hiring Freeze',
    desc: 'Promotions heal 50% of max HP instead of all of it.',
    icon: '🧊',
    effect: { promotionHealFraction: 0.5 },
  },
  {
    level: 5,
    name: 'Executive Coaching',
    desc: 'Elites are meaner: ×1.5 HP, ×1.25 ATK.',
    icon: '🏋️',
    effect: { eliteHpMult: 1.5, eliteAtkMult: 1.25 },
  },
  {
    level: 6,
    name: 'Budget Scrutiny',
    desc: 'Payouts cut 25%; Wellness Day costs 50% more.',
    icon: '🔍',
    effect: { payoutMult: 0.75, wellnessPriceMult: 1.5 },
  },
  {
    level: 7,
    name: 'Ruthless Prioritization',
    desc: 'Enemies go for the kill and heal with discipline.',
    icon: '🗡️',
    effect: { smartAiTier: 2 },
  },
  {
    level: 8,
    name: 'Always On',
    desc: 'Level-ups heal 10 HP; post-battle healing halved.',
    icon: '📱',
    effect: { levelUpHeal: 10, postBattleHealMult: 0.5 },
  },
  {
    level: 9,
    name: 'Founder Mode',
    desc: 'Bosses enter phase 2 at 60% HP and deal +15% damage.',
    icon: '👁️',
    effect: { bossPhase2Threshold: 0.6, bossDmgMult: 1.15 },
  },
  {
    level: 10,
    name: 'The Endless Re-Org',
    desc: 'Enemies +10% HP/ATK again; offensive items deal half damage.',
    icon: '🌀',
    effect: { enemyHpMult: 1.1, enemyAtkMult: 1.1, itemDmgMult: 0.5 },
  },
]

/** Tier def for a level, or null below level 1 / above the cap. */
export function getAscensionTier(level: number): AscensionTierDef | null {
  return ASCENSION_TIERS.find((t) => t.level === level) ?? null
}
