// ─── UNIFIED MODIFIER COLLECTION ────────────────────────────
// Perks (chosen at promotions) and Status Symbols (dropped by elites)
// share one effect vocabulary. This is the single code path that
// folds both into the numbers the rest of the engine consumes —
// replacing the five parallel reducers that used to live across
// data.ts, turn.ts, run.ts, and shop.ts.

import type { PerkId, RelicId, StatusId } from '@/types'
import { PERKS, RELICS } from '@/data'

export interface Mods {
  /** Additive stat bonuses (stat packages, relic furniture). */
  statBoost: { maxHp: number; atk: number; def: number }
  /** Multiplier on outgoing player damage. */
  dmgMult: number
  /** Extra damage multiplier while below 30% HP. */
  lowHpDmgMult: number
  /** Extra damage multiplier on boss floors. */
  bossDmgMult: number
  /** Additional crit chance, 0-1. */
  critBonus: number
  /** Fraction of damage dealt healed back. */
  lifesteal: number
  /** HP healed after each battle win. */
  postBattleHeal: number
  /** Multiplier on Stock Option payouts. */
  payoutMult: number
  /** Flat Stock Options added to every victory payout. */
  flatPayout: number
  /** Multiplier on shop prices. */
  priceMult: number
  /** Burnout chip damage to the player is halved. */
  burnGuard: boolean
  /** Hallway-event bonus item chance (base 0.3, perk overrides win). */
  eventItemChance: number
  /** Statuses granted at the start of every battle. */
  startBattleStatuses: StatusId[]
}

/** Every owned perk and relic folded into one modifier set. */
export function collectMods(perks: PerkId[], relics: RelicId[]): Mods {
  const mods: Mods = {
    statBoost: { maxHp: 0, atk: 0, def: 0 },
    dmgMult: 1,
    lowHpDmgMult: 1,
    bossDmgMult: 1,
    critBonus: 0,
    lifesteal: 0,
    postBattleHeal: 0,
    payoutMult: 1,
    flatPayout: 0,
    priceMult: 1,
    burnGuard: false,
    eventItemChance: 0.3,
    startBattleStatuses: [],
  }

  for (const id of perks) {
    const p = PERKS[id]
    if (!p) continue
    if (p.statBoost) {
      mods.statBoost.maxHp += p.statBoost.maxHp ?? 0
      mods.statBoost.atk += p.statBoost.atk ?? 0
      mods.statBoost.def += p.statBoost.def ?? 0
    }
    if (p.dmgMult) mods.dmgMult *= p.dmgMult
    if (p.lowHpDmgMult) mods.lowHpDmgMult *= p.lowHpDmgMult
    if (p.bossDmgMult) mods.bossDmgMult *= p.bossDmgMult
    if (p.critBonus) mods.critBonus += p.critBonus
    if (p.lifesteal) mods.lifesteal += p.lifesteal
    if (p.postBattleHeal) mods.postBattleHeal += p.postBattleHeal
    if (p.payoutMult) mods.payoutMult *= p.payoutMult
    if (p.flatPayout) mods.flatPayout += p.flatPayout
    if (p.priceMult) mods.priceMult *= p.priceMult
    if (p.eventItemChance) {
      mods.eventItemChance = Math.max(mods.eventItemChance, p.eventItemChance)
    }
    if (p.startBattleStatus) mods.startBattleStatuses.push(p.startBattleStatus)
  }

  for (const id of relics) {
    const r = RELICS[id]
    if (!r) continue
    if (r.statBoost) {
      mods.statBoost.maxHp += r.statBoost.maxHp ?? 0
      mods.statBoost.atk += r.statBoost.atk ?? 0
      mods.statBoost.def += r.statBoost.def ?? 0
    }
    if (r.dmgMult) mods.dmgMult *= r.dmgMult
    if (r.critBonus) mods.critBonus += r.critBonus
    if (r.postBattleHeal) mods.postBattleHeal += r.postBattleHeal
    if (r.payoutMult) mods.payoutMult *= r.payoutMult
    if (r.priceMult) mods.priceMult *= r.priceMult
    if (r.burnGuard) mods.burnGuard = true
  }

  return mods
}
