// ─── ASCENSION EFFECTS FOLD ─────────────────────────────────
// Folds the Re-Org tier table (src/content/ascension.ts) into the one
// effects object the engine consumes — the same shape of single code
// path as collectMods. Level 0 must be a strict identity: every
// default below matches the constant the engine used before the
// ladder existed, which is what keeps the base balance snapshot
// bit-identical.

import { ASCENSION_TIERS, MAX_ASCENSION } from '@/data'

export interface AscensionEffects {
  enemyHpMult: number
  enemyAtkMult: number
  enemyDmgMult: number
  /** Elite ("Executive Track") multipliers, overriding the base 1.35/1.15. */
  eliteHpMult: number
  eliteAtkMult: number
  /** Fraction of effective max HP a promotion restores (1 = full heal). */
  promotionHealFraction: number
  /** Flat HP restored on level-up. */
  levelUpHeal: number
  postBattleHealMult: number
  payoutMult: number
  wellnessPriceMult: number
  /** Multiplier on offensive-item damage. */
  itemDmgMult: number
  /** 0 = legacy random-leaning AI; 1..2 = chooseEnemyMoveSmart tiers. */
  smartAiTier: 0 | 1 | 2
  /** Boss HP fraction that triggers the phase-2 transform. */
  bossPhase2Threshold: number
  /** Multiplier on enemy damage on boss floors. */
  bossDmgMult: number
}

const IDENTITY: AscensionEffects = {
  enemyHpMult: 1,
  enemyAtkMult: 1,
  enemyDmgMult: 1,
  eliteHpMult: 1.35,
  eliteAtkMult: 1.15,
  promotionHealFraction: 1,
  levelUpHeal: 20,
  postBattleHealMult: 1,
  payoutMult: 1,
  wellnessPriceMult: 1,
  itemDmgMult: 1,
  smartAiTier: 0,
  bossPhase2Threshold: 0.5,
  bossDmgMult: 1,
}

/** Cumulative effects of Re-Org tiers 1..level. */
export function ascensionEffects(level: number): AscensionEffects {
  const eff = { ...IDENTITY }
  if (level <= 0) return eff
  const capped = Math.min(level, MAX_ASCENSION)
  for (const tier of ASCENSION_TIERS) {
    if (tier.level > capped) break
    const e = tier.effect
    if (e.enemyHpMult) eff.enemyHpMult *= e.enemyHpMult
    if (e.enemyAtkMult) eff.enemyAtkMult *= e.enemyAtkMult
    if (e.enemyDmgMult) eff.enemyDmgMult *= e.enemyDmgMult
    if (e.postBattleHealMult) eff.postBattleHealMult *= e.postBattleHealMult
    if (e.payoutMult) eff.payoutMult *= e.payoutMult
    if (e.wellnessPriceMult) eff.wellnessPriceMult *= e.wellnessPriceMult
    if (e.itemDmgMult) eff.itemDmgMult *= e.itemDmgMult
    if (e.bossDmgMult) eff.bossDmgMult *= e.bossDmgMult
    if (e.eliteHpMult !== undefined) eff.eliteHpMult = e.eliteHpMult
    if (e.eliteAtkMult !== undefined) eff.eliteAtkMult = e.eliteAtkMult
    if (e.promotionHealFraction !== undefined) eff.promotionHealFraction = e.promotionHealFraction
    if (e.levelUpHeal !== undefined) eff.levelUpHeal = e.levelUpHeal
    if (e.bossPhase2Threshold !== undefined) eff.bossPhase2Threshold = e.bossPhase2Threshold
    if (e.smartAiTier !== undefined && e.smartAiTier > eff.smartAiTier)
      eff.smartAiTier = e.smartAiTier
  }
  return eff
}
