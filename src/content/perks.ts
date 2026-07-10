import type { AchievementId, PerkDef, PerkId } from '../types'

// ─── PERKS ──────────────────────────────────────────────────
// The pick-1-of-3 promotion pool. Every offer is one stat package
// (repeatable, stacks), one passive, and one economy perk — so a
// promotion is always a choice between raw stats, build identity, and
// money. Magnitudes are tuned so a stat package roughly matches the
// fixed boost a promotion used to grant.
export const PERKS: Record<PerkId, PerkDef> = {
  // Stat packages
  gym_membership: {
    id: 'gym_membership',
    name: 'Gym Membership',
    desc: '+22 max HP. You actually go.',
    icon: '🏋️',
    kind: 'stat',
    choiceTags: ['SAFE', 'DEFENSE'],
    buildHint: 'Best when you need a bigger HP buffer before bosses.',
    archetypeTags: ['productivity'],
    repeatable: true,
    statBoost: { maxHp: 22 },
  },
  assertiveness_training: {
    id: 'assertiveness_training',
    name: 'Assertiveness Training',
    desc: '+3 ATK. You say "no" in meetings now.',
    icon: '🗣️',
    kind: 'stat',
    choiceTags: ['GREEDY'],
    buildHint: 'Best when you want fights to end before they get messy.',
    archetypeTags: ['politics'],
    repeatable: true,
    statBoost: { atk: 3 },
  },
  executive_presence: {
    id: 'executive_presence',
    name: 'Executive Presence',
    desc: '+2 DEF, +10 max HP. Unbothered. Moisturized.',
    icon: '🤵',
    kind: 'stat',
    choiceTags: ['SAFE', 'DEFENSE'],
    buildHint: 'Best for steady climbs where chip damage is piling up.',
    archetypeTags: ['politics'],
    repeatable: true,
    statBoost: { def: 2, maxHp: 10 },
  },
  balanced_package: {
    id: 'balanced_package',
    name: 'Total Comp Package',
    desc: '+12 max HP, +2 ATK, +1 DEF. A bit of everything.',
    icon: '📦',
    kind: 'stat',
    choiceTags: ['SAFE'],
    buildHint: 'Best when your build has no obvious weakness yet.',
    archetypeTags: ['loyalty'],
    repeatable: true,
    statBoost: { maxHp: 12, atk: 2, def: 1 },
  },
  // Passives
  overtime_grind: {
    id: 'overtime_grind',
    name: 'Overtime Grind',
    desc: '+12% damage on all moves. Sleep is for Q3.',
    icon: '🌙',
    kind: 'passive',
    choiceTags: ['GREEDY', 'COMBO'],
    buildHint: 'Best for aggressive builds that already survive comfortably.',
    archetypeTags: ['burnout', 'productivity'],
    dmgMult: 1.12,
  },
  perfectionist: {
    id: 'perfectionist',
    name: 'Perfectionist',
    desc: '+12% crit chance. Every detail audited.',
    icon: '🔍',
    kind: 'passive',
    choiceTags: ['GREEDY', 'COMBO'],
    buildHint: 'Best with high-power moves and damage multipliers.',
    archetypeTags: ['productivity', 'burnout'],
    critBonus: 0.12,
  },
  networking_guru: {
    id: 'networking_guru',
    name: 'Networking Guru',
    desc: 'Heal 15% of the damage you deal. Every win is a connection.',
    icon: '🤝',
    kind: 'passive',
    choiceTags: ['SAFE', 'COMBO'],
    buildHint: 'Best when you can hit hard and want sustain without items.',
    archetypeTags: ['politics'],
    lifesteal: 0.15,
  },
  morning_person: {
    id: 'morning_person',
    name: 'Morning Person',
    desc: 'Start every battle Motivated (ATK up). Disgusting, honestly.',
    icon: '🌅',
    kind: 'passive',
    choiceTags: ['COMBO'],
    buildHint: 'Best when early battle momentum matters more than defense.',
    archetypeTags: ['productivity'],
    startBattleStatus: 'motivated',
  },
  self_care: {
    id: 'self_care',
    name: 'Self Care',
    desc: 'Heal 12 HP after every battle. Boundaries!',
    icon: '🧘',
    kind: 'passive',
    choiceTags: ['SAFE', 'DEFENSE'],
    buildHint: 'Best for long climbs when item luck is unreliable.',
    archetypeTags: ['burnout'],
    postBattleHeal: 12,
  },
  // Economy
  negotiator: {
    id: 'negotiator',
    name: 'Negotiator',
    desc: '+30% Stock Option payouts. You asked for more. They said yes.',
    icon: '📈',
    kind: 'economy',
    choiceTags: ['GREEDY', 'ECONOMY'],
    buildHint: 'Best early if you plan to snowball through shop buys.',
    archetypeTags: ['politics'],
    payoutMult: 1.3,
  },
  employee_discount: {
    id: 'employee_discount',
    name: 'Employee Discount',
    desc: 'Shop prices -25%. Perks of knowing the vendor.',
    icon: '🏷️',
    kind: 'economy',
    choiceTags: ['SAFE', 'ECONOMY'],
    buildHint: 'Best when shops are coming and your item plan matters.',
    archetypeTags: ['loyalty'],
    priceMult: 0.75,
  },
  headhunter: {
    id: 'headhunter',
    name: 'Headhunter Contact',
    desc: 'Hallway events drop bonus items twice as often.',
    icon: '📞',
    kind: 'economy',
    choiceTags: ['GREEDY', 'ECONOMY'],
    buildHint: 'Best if you take hallway routes and want more item spikes.',
    archetypeTags: ['sabotage', 'politics'],
    eventItemChance: 0.6,
  },
  signing_bonus: {
    id: 'signing_bonus',
    name: 'Signing Bonus',
    desc: '+60 Stock Options, right now.',
    icon: '💵',
    kind: 'economy',
    choiceTags: ['SAFE', 'ECONOMY'],
    buildHint: 'Best when you need buying power immediately, not later.',
    archetypeTags: ['loyalty'],
    instantOptions: 60,
  },
  // Unlockable — earned achievements add these to future offer pools.
  personal_brand: {
    id: 'personal_brand',
    name: 'Personal Brand',
    desc: '+15 max HP, +2 ATK. You ARE the deliverable.',
    icon: '✨',
    kind: 'stat',
    choiceTags: ['SAFE', 'GREEDY'],
    buildHint: 'Best when you want stats that help every fight.',
    archetypeTags: ['politics'],
    repeatable: true,
    unlockedBy: 'first_climb',
    statBoost: { maxHp: 15, atk: 2 },
  },
  golden_handcuffs: {
    id: 'golden_handcuffs',
    name: 'Golden Handcuffs',
    desc: '+25% damage while below 30% HP. Can’t leave. Won’t lose.',
    icon: '⛓️',
    kind: 'passive',
    choiceTags: ['GREEDY', 'COMBO'],
    buildHint: 'Best for risky low-HP builds that convert danger into damage.',
    archetypeTags: ['loyalty', 'burnout'],
    unlockedBy: 'glass_cannon',
    lowHpDmgMult: 1.25,
  },
  killer_instinct: {
    id: 'killer_instinct',
    name: 'Killer Instinct',
    desc: '+20% damage on boss floors. You live for review season.',
    icon: '🦈',
    kind: 'passive',
    choiceTags: ['BOSS KILLER', 'GREEDY'],
    buildHint: 'Best when boss floors are the run-ending threat.',
    archetypeTags: ['sabotage'],
    unlockedBy: 'damage_dealer',
    bossDmgMult: 1.2,
  },
  dividends: {
    id: 'dividends',
    name: 'Dividends',
    desc: '+5 Stock Options on every payout. Money makes money.',
    icon: '🪙',
    kind: 'economy',
    choiceTags: ['ECONOMY', 'COMBO'],
    buildHint: 'Best early when repeated payouts can compound.',
    archetypeTags: ['loyalty'],
    unlockedBy: 'diamond_hands',
    flatPayout: 5,
  },
}

export const ALL_PERK_IDS = Object.keys(PERKS) as PerkId[]

// ─── META-PROGRESSION POOLS ─────────────────────────────────
// Content marked `unlockedBy` is gated behind achievements. Normal
// runs draw from the player's unlocked pool (frozen onto the run at
// start); dailies always use the base pool so share grids stay fair.

export const BASE_PERK_POOL: PerkId[] = ALL_PERK_IDS.filter((id) => !PERKS[id].unlockedBy)

export function unlockedPerkPool(unlocked: Set<AchievementId>): PerkId[] {
  return ALL_PERK_IDS.filter((id) => {
    const gate = PERKS[id].unlockedBy
    return !gate || unlocked.has(gate)
  })
}

/** Owned perks grouped for display, in first-pick order, with stack counts. */
export function groupPerks(perks: PerkId[]): { perk: PerkDef; count: number }[] {
  const grouped: { perk: PerkDef; count: number }[] = []
  for (const id of perks) {
    const def = PERKS[id]
    if (!def) continue
    const existing = grouped.find((g) => g.perk.id === id)
    if (existing) existing.count++
    else grouped.push({ perk: def, count: 1 })
  }
  return grouped
}
