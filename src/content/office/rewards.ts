import type { EncounterId, FloorId, ReceiptId, RewardId } from './ids'

export const FLOOR_LEDGER_MAX = 65
export const FLOOR_2_LEDGER_MAX = 90
export const FLOOR_3_LEDGER_MAX = 54
export const FLOOR_4_LEDGER_MAX = 64
export const FLOOR_5_LEDGER_MAX = 78

export const REWARD_OPTIONS: Record<RewardId, number> = {
  rwd_start_options: 10,
  rwd_asg_printer: 10,
  rwd_asg_meeting_prep: 6,
  rwd_enc_desk_challenger: 8,
  rwd_enc_meeting_prepper: 11,
  rwd_enc_supervisor_1on1: 20,
  rwd_promotion_f1: 0,
  // Floor 2 (docs/rpg/floor-2-design.md §7.1)
  rwd_asg_transfer: 12,
  rwd_enc_help_desk_intern: 15,
  rwd_asg_audit: 10,
  rwd_enc_auditor: 21,
  rwd_enc_director_review: 32,
  rwd_promotion_f2: 0,
  // Floors 3–5 (docs/rpg/floor-3-5-design.md §5)
  rwd_asg_roadmap: 14,
  rwd_enc_vp_product: 40,
  rwd_promotion_f3: 0,
  rwd_asg_leavebehind: 16,
  rwd_enc_vp_sales: 48,
  rwd_promotion_f4: 0,
  rwd_asg_board_packet: 18,
  rwd_enc_ceo_review: 60,
  rwd_promotion_f5: 0,
}

export const REWARD_XP: Partial<Record<RewardId, number>> = {
  rwd_enc_desk_challenger: 15,
  rwd_enc_meeting_prepper: 22,
  rwd_enc_supervisor_1on1: 30,
  rwd_enc_help_desk_intern: 36,
  rwd_enc_auditor: 43,
  rwd_enc_director_review: 55,
  rwd_enc_vp_product: 57,
  rwd_enc_vp_sales: 64,
  rwd_enc_ceo_review: 80,
}

export interface ReceiptLine {
  text: string
}

export interface ReceiptDef {
  id: ReceiptId
  title: string
  rewardId?: RewardId
  lines: ReceiptLine[]
  /** One satire line printed under the rows (design §10.6). */
  footer: string
}

export const RECEIPTS: Record<ReceiptId, ReceiptDef> = {
  rcpt_signing_bonus: {
    id: 'rcpt_signing_bonus',
    title: 'SIGNING BONUS',
    rewardId: 'rwd_start_options',
    lines: [{ text: '+10 📈  Starting float' }],
    footer: 'Vests immediately. Suspicious.',
  },
  rcpt_printer_online: {
    id: 'rcpt_printer_online',
    title: 'PRINTER — ONLINE',
    lines: [{ text: 'Offer Letter ×2  📄' }],
    footer: 'Two letters. Zero names. Infinite potential.',
  },
  rcpt_ticket_closed: {
    id: 'rcpt_ticket_closed',
    title: 'TICKET #0001 CLOSED',
    rewardId: 'rwd_asg_printer',
    lines: [{ text: '+10 📈' }],
    footer: 'Filed under: things that beep.',
  },
  rcpt_desk_argument: {
    id: 'rcpt_desk_argument',
    title: 'DESK-PIT ARGUMENT — WON',
    rewardId: 'rwd_enc_desk_challenger',
    lines: [{ text: '+15 XP' }, { text: '+8 📈' }, { text: 'Offer eligible ✓' }],
    footer: 'Coffee refill: his problem now.',
  },
  rcpt_meeting_prepped: {
    id: 'rcpt_meeting_prepped',
    title: 'THE 10:30 — PREPPED',
    rewardId: 'rwd_asg_meeting_prep',
    lines: [{ text: '+6 📈' }],
    footer: "Nobody will read it. It's still right.",
  },
  rcpt_premeeting_spar: {
    id: 'rcpt_premeeting_spar',
    title: 'PRE-MEETING SPAR — WON',
    rewardId: 'rwd_enc_meeting_prepper',
    lines: [{ text: '+22 XP' }, { text: '+11 📈' }, { text: 'Offer eligible ✓' }],
    footer: "She'll be calm. Nobody will know why.",
  },
  rcpt_one_on_one: {
    id: 'rcpt_one_on_one',
    title: 'ONE-ON-ONE — SURVIVED',
    rewardId: 'rwd_enc_supervisor_1on1',
    lines: [
      { text: '+30 XP' },
      { text: '+20 📈' },
      { text: 'Access Badge 🪪' },
      { text: 'Promotion →' },
    ],
    footer: 'Laminated. Finally.',
  },
  rcpt_promotion_signing_bonus: {
    id: 'rcpt_promotion_signing_bonus',
    title: 'SIGNING BONUS',
    lines: [{ text: '+60 📈  Perk payout. Not a floor ledger row.' }],
    footer: 'HR calls it a development plan.',
  },
  // ── Floor 2 ──
  rcpt_transfer_filed: {
    id: 'rcpt_transfer_filed',
    title: 'TRANSFER PACKET — FILED',
    rewardId: 'rwd_asg_transfer',
    lines: [{ text: '+12 📈' }, { text: 'Offer Letter ×1  📄' }],
    footer: 'Stapled to everything. Even this.',
  },
  rcpt_compliance: {
    id: 'rcpt_compliance',
    title: 'COMPLIANCE — PASSED',
    rewardId: 'rwd_enc_help_desk_intern',
    lines: [{ text: '+36 XP' }, { text: '+15 📈' }, { text: 'Offer eligible ✓' }],
    footer: 'Module 1 of 1. Certificate pending forever.',
  },
  rcpt_audit_reconciled: {
    id: 'rcpt_audit_reconciled',
    title: 'AUDIT — RECONCILED',
    rewardId: 'rwd_asg_audit',
    lines: [{ text: '+10 📈' }],
    footer: "Reimbursed from his own wallet. Don't ask.",
  },
  rcpt_the_audit: {
    id: 'rcpt_the_audit',
    title: 'THE AUDIT — CLOSED',
    rewardId: 'rwd_enc_auditor',
    lines: [{ text: '+43 XP' }, { text: '+21 📈' }],
    footer: 'Initialled in pencil. Framed anyway.',
  },
  rcpt_operations_review: {
    id: 'rcpt_operations_review',
    title: 'OPERATIONS REVIEW — PASSED',
    rewardId: 'rwd_enc_director_review',
    lines: [
      { text: '+55 XP' },
      { text: '+32 📈' },
      { text: 'Transfer approved ✓' },
      { text: 'Promotion →' },
    ],
    footer: 'Aligned. Whatever that costs.',
  },
  rcpt_employee_badge: {
    id: 'rcpt_employee_badge',
    title: 'EMPLOYEE BADGE — ISSUED',
    lines: [{ text: 'Employee Badge 🪪' }],
    footer: 'Eyes closed. Permanent.',
  },
  rcpt_roadmap_initialled: {
    id: 'rcpt_roadmap_initialled',
    title: 'ROADMAP — INITIALLED',
    rewardId: 'rwd_asg_roadmap',
    lines: [{ text: '+14 📈' }],
    footer: 'In pencil. Ink is a commitment.',
  },
  rcpt_prioritization: {
    id: 'rcpt_prioritization',
    title: 'PRIORITIZATION — NOW',
    rewardId: 'rwd_enc_vp_product',
    lines: [
      { text: '+57 XP' },
      { text: '+40 📈' },
      { text: 'Product Badge 🪪' },
      { text: 'Promotion →' },
    ],
    footer: 'The column had been empty since April.',
  },
  rcpt_product_badge: {
    id: 'rcpt_product_badge',
    title: 'PRODUCT BADGE — ISSUED',
    lines: [{ text: 'Product Badge 🪪' }],
    footer: 'Sequenced. Laminated. Still Later on Fridays.',
  },
  rcpt_leavebehind_delivered: {
    id: 'rcpt_leavebehind_delivered',
    title: 'LEAVE-BEHIND — DELIVERED',
    rewardId: 'rwd_asg_leavebehind',
    lines: [{ text: '+16 📈' }],
    footer: 'The client has not seen it. That is why it works.',
  },
  rcpt_the_close: {
    id: 'rcpt_the_close',
    title: 'THE CLOSE — CLOSED',
    rewardId: 'rwd_enc_vp_sales',
    lines: [
      { text: '+64 XP' },
      { text: '+48 📈' },
      { text: 'Client Badge 🪪' },
      { text: 'Promotion →' },
    ],
    footer: 'The flute was empty the whole time.',
  },
  rcpt_client_badge: {
    id: 'rcpt_client_badge',
    title: 'CLIENT BADGE — ISSUED',
    lines: [{ text: 'Client Badge 🪪' }],
    footer: 'This quarter. Laminated. Already last quarter upstairs.',
  },
  rcpt_board_packet_filed: {
    id: 'rcpt_board_packet_filed',
    title: 'BOARD PACKET — FILED',
    rewardId: 'rwd_asg_board_packet',
    lines: [{ text: '+18 📈' }],
    footer: 'The book does not come back out.',
  },
  rcpt_the_review: {
    id: 'rcpt_the_review',
    title: 'THE REVIEW — NODDED',
    rewardId: 'rwd_enc_ceo_review',
    lines: [{ text: '+80 XP' }, { text: '+60 📈' }, { text: 'The nod ✓' }, { text: 'Promotion →' }],
    footer: 'There is no letter. There is no Floor 6.',
  },
  rcpt_the_climb: {
    id: 'rcpt_the_climb',
    title: 'THE CLIMB — COMPLETE',
    lines: [{ text: 'Five floors. One nod.' }],
    footer: 'The elevator still goes down.',
  },
}

export const ENCOUNTER_RECEIPT: Record<EncounterId, ReceiptId> = {
  enc_desk_challenger: 'rcpt_desk_argument',
  enc_meeting_prepper: 'rcpt_premeeting_spar',
  enc_supervisor_1on1: 'rcpt_one_on_one',
  enc_help_desk_intern: 'rcpt_compliance',
  enc_auditor: 'rcpt_the_audit',
  enc_director_review: 'rcpt_operations_review',
  enc_vp_product: 'rcpt_prioritization',
  enc_vp_sales: 'rcpt_the_close',
  enc_ceo_review: 'rcpt_the_review',
}

export const FLOOR_REWARD_IDS: Record<FloorId, readonly RewardId[]> = {
  floor_01: [
    'rwd_start_options',
    'rwd_asg_printer',
    'rwd_asg_meeting_prep',
    'rwd_enc_desk_challenger',
    'rwd_enc_meeting_prepper',
    'rwd_enc_supervisor_1on1',
    'rwd_promotion_f1',
  ],
  floor_02: [
    'rwd_asg_transfer',
    'rwd_enc_help_desk_intern',
    'rwd_asg_audit',
    'rwd_enc_auditor',
    'rwd_enc_director_review',
    'rwd_promotion_f2',
  ],
  floor_03: ['rwd_asg_roadmap', 'rwd_enc_vp_product', 'rwd_promotion_f3'],
  floor_04: ['rwd_asg_leavebehind', 'rwd_enc_vp_sales', 'rwd_promotion_f4'],
  floor_05: ['rwd_asg_board_packet', 'rwd_enc_ceo_review', 'rwd_promotion_f5'],
}

/** Options earned from claimed `rwd_*` rows; pass a floor to read one floor's ledger only. */
export function ledgerOptionsEarned(claimed: string[], floorId?: FloorId): number {
  const allowed = floorId ? new Set<string>(FLOOR_REWARD_IDS[floorId]) : null
  return claimed.reduce((sum, id) => {
    if (!id.startsWith('rwd_')) return sum
    if (allowed && !allowed.has(id)) return sum
    return sum + (REWARD_OPTIONS[id as RewardId] ?? 0)
  }, 0)
}
