import type { ClassId, ItemDef, ItemId } from '../types'

// ─── ITEMS ───────────────────────────────────────────────────
export const ITEMS: Record<ItemId, ItemDef> = {
  espresso: {
    id: 'espresso',
    name: 'Espresso Shot',
    emoji: '\u2615',
    desc: 'Instant energy. Restores 30 HP.',
    price: 14,
    effect: { hp: 30 },
  },
  linkedin_endorsement: {
    id: 'linkedin_endorsement',
    name: 'LinkedIn Endorsement',
    emoji: '\uD83D\uDC4D',
    desc: 'Someone endorsed you for "Leadership". +3 ATK this battle.',
    price: 18,
    effect: { atk: 3 },
  },
  mentors_advice: {
    id: 'mentors_advice',
    name: "Mentor's Advice",
    emoji: '\uD83E\uDDD1\u200D\uD83C\uDFEB',
    desc: '"Play to your strengths." Grants Focused status.',
    price: 16,
    effect: { status: { id: 'focused', target: 'self' } },
  },
  networking_card: {
    id: 'networking_card',
    name: 'Networking Card',
    emoji: '\uD83D\uDCBC',
    desc: 'A powerful connection. +3 DEF this battle.',
    price: 18,
    effect: { def: 3 },
  },
  pto_day: {
    id: 'pto_day',
    name: 'PTO Day',
    emoji: '\uD83C\uDFD6\uFE0F',
    desc: 'Take a mental health day. Restores 50 HP.',
    price: 24,
    effect: { hp: 50 },
  },
  side_hustle: {
    id: 'side_hustle',
    name: 'Side Hustle',
    emoji: '\uD83D\uDCB0',
    desc: 'Extra income = extra confidence. Restores all PP.',
    price: 28,
    effect: { ppRestore: 99 },
  },
  standing_desk: {
    id: 'standing_desk',
    name: 'Standing Desk',
    emoji: '\uD83E\uDE91',
    desc: 'Power posture. +4 DEF and restores 15 HP.',
    price: 22,
    effect: { def: 4, hp: 15 },
  },
  noise_cancelling: {
    id: 'noise_cancelling',
    name: 'Noise-Cancelling',
    emoji: '\uD83C\uDFA7',
    desc: 'Block out the chaos. Grants Focused status.',
    price: 16,
    effect: { status: { id: 'focused', target: 'self' } },
  },
  reply_all_grenade: {
    id: 'reply_all_grenade',
    name: 'Reply-All Grenade',
    emoji: '📧',
    desc: '"Per my last email." Deals 35 damage.',
    price: 20,
    effect: { dmgEnemy: 35 },
  },
  pip_notice: {
    id: 'pip_notice',
    name: 'PIP Notice',
    emoji: '📋',
    desc: 'A performance improvement plan. Enemy is Micromanaged (ATK down).',
    price: 18,
    effect: { enemyStatus: { id: 'micromanaged' } },
  },
  pager_duty: {
    id: 'pager_duty',
    name: 'Pager Duty',
    emoji: '🚨',
    desc: 'Put them on call. Enemy is Burned Out (damage each turn).',
    price: 20,
    effect: { enemyStatus: { id: 'burned_out' } },
  },
  reorg_memo: {
    id: 'reorg_memo',
    name: 'Reorg Memo',
    emoji: '📄',
    desc: '"Your role is impacted." Deals 20 damage and Demoralizes (DEF down).',
    price: 26,
    effect: { dmgEnemy: 20, enemyStatus: { id: 'demoralized' } },
  },
  forward_to_legal: {
    id: 'forward_to_legal',
    name: 'Forward to Legal',
    emoji: '⚖️',
    desc: 'The nuclear option. Deals 50 damage.',
    price: 38,
    effect: { dmgEnemy: 50 },
  },
}

export const ALL_ITEM_IDS: ItemId[] = Object.keys(ITEMS) as ItemId[]

// Starting item per class
export const CLASS_STARTING_ITEMS: Record<ClassId, ItemId> = {
  pm: 'networking_card',
  eng: 'espresso',
  design: 'mentors_advice',
}
