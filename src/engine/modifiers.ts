// ─── UNIFIED MODIFIER COLLECTION ────────────────────────────
// Perks (chosen at promotions) and Status Symbols (dropped by elites)
// share one effect vocabulary. This is the single code path that
// folds both into the numbers the rest of the engine consumes. The
// fold reads every effect field from every source uniformly, so a
// field added to either def type is picked up without touching this
// module.

import type { PerkDef, PerkId, RelicDef, RelicId, StatusId } from '@/types'
import { EVENT_ITEM_BASE_CHANCE, PERKS, RELICS } from '@/data'

/** Any owned thing that modifies the run (perk or relic). */
type ModSource = Partial<Omit<PerkDef, 'id'> & Omit<RelicDef, 'id'>>

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
  /** Hallway-event bonus item chance (highest override wins). */
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
    eventItemChance: EVENT_ITEM_BASE_CHANCE,
    startBattleStatuses: [],
  }

  const sources: (ModSource | undefined)[] = [
    ...perks.map((id) => PERKS[id]),
    ...relics.map((id) => RELICS[id]),
  ]
  for (const s of sources) {
    if (!s) continue
    if (s.statBoost) {
      mods.statBoost.maxHp += s.statBoost.maxHp ?? 0
      mods.statBoost.atk += s.statBoost.atk ?? 0
      mods.statBoost.def += s.statBoost.def ?? 0
    }
    if (s.dmgMult) mods.dmgMult *= s.dmgMult
    if (s.lowHpDmgMult) mods.lowHpDmgMult *= s.lowHpDmgMult
    if (s.bossDmgMult) mods.bossDmgMult *= s.bossDmgMult
    if (s.critBonus) mods.critBonus += s.critBonus
    if (s.lifesteal) mods.lifesteal += s.lifesteal
    if (s.postBattleHeal) mods.postBattleHeal += s.postBattleHeal
    if (s.payoutMult) mods.payoutMult *= s.payoutMult
    if (s.flatPayout) mods.flatPayout += s.flatPayout
    if (s.priceMult) mods.priceMult *= s.priceMult
    if (s.burnGuard) mods.burnGuard = true
    if (s.eventItemChance) {
      mods.eventItemChance = Math.max(mods.eventItemChance, s.eventItemChance)
    }
    if (s.startBattleStatus) mods.startBattleStatuses.push(s.startBattleStatus)
  }

  return mods
}
