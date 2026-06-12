import type { MysteryOutcome } from '../types'

// ─── MYSTERY FLOORS ─────────────────────────────────────────
// The third elevator is a seeded gamble. Outcomes are weighted so the
// expected value is a mild positive — worth taking, never free.
export const MYSTERY_OUTCOMES: {
  outcome: MysteryOutcome
  weight: number
  banner: string
  desc: string
}[] = [
  {
    outcome: 'windfall',
    weight: 30,
    banner: '💰 WINDFALL',
    desc: 'Accounting made an error in your favor. Double payout!',
  },
  {
    outcome: 'slacker',
    weight: 25,
    banner: '😴 SLACKER',
    desc: 'They are phoning it in today. Weakened enemy.',
  },
  {
    outcome: 'ambush',
    weight: 30,
    banner: '⚠️ AMBUSH',
    desc: 'You walked into the elite’s office. No bonus. Good luck.',
  },
  {
    outcome: 'jackpot',
    weight: 15,
    banner: '🎰 JACKPOT',
    desc: 'The corner-office raffle! Win for a Status Symbol.',
  },
]

export function getMysteryInfo(outcome: MysteryOutcome) {
  return MYSTERY_OUTCOMES.find((o) => o.outcome === outcome)!
}

// ─── STOCK OPTIONS (currency) ───────────────────────────────
// Earned on every battle win, scaled by floor; spent at the shop.
export const CURRENCY_NAME = 'Stock Options'
export const CURRENCY_ICON = '📈'
