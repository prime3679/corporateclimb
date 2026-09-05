import type { ReceiptId, RewardId } from './ids'

export const FLOOR_LEDGER_MAX = 65

export const REWARD_OPTIONS: Record<RewardId, number> = {
  rwd_start_options: 10,
  rwd_asg_printer: 10,
  rwd_asg_meeting_prep: 6,
  rwd_enc_desk_challenger: 8,
  rwd_enc_meeting_prepper: 11,
  rwd_enc_supervisor_1on1: 20,
  rwd_promotion_f1: 0,
}

export const REWARD_XP: Partial<Record<RewardId, number>> = {
  rwd_enc_desk_challenger: 15,
  rwd_enc_meeting_prepper: 22,
  rwd_enc_supervisor_1on1: 30,
}

export interface ReceiptLine {
  text: string
}

export interface ReceiptDef {
  id: ReceiptId
  title: string
  rewardId?: RewardId
  lines: ReceiptLine[]
}

export const RECEIPTS: Record<ReceiptId, ReceiptDef> = {
  rcpt_signing_bonus: {
    id: 'rcpt_signing_bonus',
    title: 'SIGNING BONUS',
    rewardId: 'rwd_start_options',
    lines: [{ text: '+10 📈  Starting float' }],
  },
  rcpt_printer_online: {
    id: 'rcpt_printer_online',
    title: 'PRINTER — ONLINE',
    lines: [{ text: 'Offer Letter ×2  📄' }],
  },
  rcpt_ticket_closed: {
    id: 'rcpt_ticket_closed',
    title: 'TICKET #0001 CLOSED',
    rewardId: 'rwd_asg_printer',
    lines: [{ text: '+10 📈' }],
  },
  rcpt_desk_argument: {
    id: 'rcpt_desk_argument',
    title: 'DESK-PIT ARGUMENT — WON',
    rewardId: 'rwd_enc_desk_challenger',
    lines: [{ text: '+15 XP' }, { text: '+8 📈' }, { text: 'Offer eligible ✓' }],
  },
  rcpt_meeting_prepped: {
    id: 'rcpt_meeting_prepped',
    title: 'THE 10:30 — PREPPED',
    rewardId: 'rwd_asg_meeting_prep',
    lines: [{ text: '+6 📈' }],
  },
  rcpt_premeeting_spar: {
    id: 'rcpt_premeeting_spar',
    title: 'PRE-MEETING SPAR — WON',
    rewardId: 'rwd_enc_meeting_prepper',
    lines: [{ text: '+22 XP' }, { text: '+11 📈' }, { text: 'Offer eligible ✓' }],
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
  },
  rcpt_promotion_signing_bonus: {
    id: 'rcpt_promotion_signing_bonus',
    title: 'SIGNING BONUS',
    lines: [{ text: '+60 📈  Perk payout. Not a floor ledger row.' }],
  },
}

export const ENCOUNTER_RECEIPT: Record<
  'enc_desk_challenger' | 'enc_meeting_prepper' | 'enc_supervisor_1on1',
  ReceiptId
> = {
  enc_desk_challenger: 'rcpt_desk_argument',
  enc_meeting_prepper: 'rcpt_premeeting_spar',
  enc_supervisor_1on1: 'rcpt_one_on_one',
}

export function ledgerOptionsEarned(claimed: string[]): number {
  return claimed.reduce((sum, id) => {
    if (!id.startsWith('rwd_')) return sum
    return sum + (REWARD_OPTIONS[id as RewardId] ?? 0)
  }, 0)
}
