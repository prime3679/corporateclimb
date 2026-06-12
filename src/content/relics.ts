import type { AchievementId, RelicDef, RelicId } from '../types'

// ─── STATUS SYMBOLS (relics) ────────────────────────────────
// Dropped by elite floors. Permanent for the run, owned once each.
export const RELICS: Record<RelicId, RelicDef> = {
  golden_stapler: {
    id: 'golden_stapler',
    name: 'Golden Stapler',
    desc: '+10% damage. It’s gold. Nobody touches it.',
    icon: '📎',
    dmgMult: 1.1,
  },
  corner_office_key: {
    id: 'corner_office_key',
    name: 'Corner Office Key',
    desc: '+18 max HP. Two windows. TWO.',
    icon: '🗝️',
    statBoost: { maxHp: 18 },
  },
  executive_parking: {
    id: 'executive_parking',
    name: 'Executive Parking Spot',
    desc: '+2 DEF. Park closer, arrive fresher.',
    icon: '🅿️',
    statBoost: { def: 2 },
  },
  platinum_card: {
    id: 'platinum_card',
    name: 'Platinum Corporate Card',
    desc: '+20% Stock Option payouts. Expense everything.',
    icon: '💳',
    payoutMult: 1.2,
  },
  ergonomic_throne: {
    id: 'ergonomic_throne',
    name: 'Ergonomic Throne',
    desc: 'Heal 8 HP after every battle. Lumbar support of kings.',
    icon: '🪑',
    postBattleHeal: 8,
  },
  lucky_tie: {
    id: 'lucky_tie',
    name: 'Lucky Tie',
    desc: '+8% crit chance. Worn at every closed deal since 2019.',
    icon: '👔',
    critBonus: 0.08,
  },
  stress_ball: {
    id: 'stress_ball',
    name: 'Stress Ball',
    desc: 'Burnout damage to you is halved. Squeeze responsibly.',
    icon: '🟡',
    burnGuard: true,
  },
  mahogany_desk: {
    id: 'mahogany_desk',
    name: 'Mahogany Desk',
    desc: '+10 max HP, +1 ATK, +1 DEF. Gravitas, in furniture form.',
    icon: '🪵',
    statBoost: { maxHp: 10, atk: 1, def: 1 },
  },
  // Unlockable — earned achievements add these to future drop pools.
  ceo_signature: {
    id: 'ceo_signature',
    name: 'CEO’s Signature',
    desc: '+15% payouts, +5 max HP. Framed. Possibly forged.',
    icon: '🖋️',
    unlockedBy: 'ng_plus_1',
    payoutMult: 1.15,
    statBoost: { maxHp: 5 },
  },
  campus_keycard: {
    id: 'campus_keycard',
    name: 'All-Campus Keycard',
    desc: 'Shop prices -10%. Every door. Every vending machine.',
    icon: '🪪',
    unlockedBy: 'speed_runner',
    priceMult: 0.9,
  },
  trophy_shelf: {
    id: 'trophy_shelf',
    name: 'Trophy Shelf',
    desc: '+10 max HP, +5% crit. Visible in every video call.',
    icon: '🏆',
    unlockedBy: 'triple_threat',
    statBoost: { maxHp: 10 },
    critBonus: 0.05,
  },
}

export const ALL_RELIC_IDS = Object.keys(RELICS) as RelicId[]

/** When every relic is owned, elites pay this instead. */
export const RELIC_DUPLICATE_OPTIONS = 40

export const BASE_RELIC_POOL: RelicId[] = ALL_RELIC_IDS.filter((id) => !RELICS[id].unlockedBy)

export function unlockedRelicPool(unlocked: Set<AchievementId>): RelicId[] {
  return ALL_RELIC_IDS.filter((id) => {
    const gate = RELICS[id].unlockedBy
    return !gate || unlocked.has(gate)
  })
}

// ─── ELITE FLOORS ───────────────────────────────────────────
// The Executive Track: a meaner take on the floor's enemy in exchange
// for double payout and a Status Symbol.
export const ELITE_PAYOUT_MULT = 2
