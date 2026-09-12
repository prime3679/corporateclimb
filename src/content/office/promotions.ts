import type { PromotionTier } from '@/types'

/** The Office has its own milestones; Classic career titles stay separate. */
export const OFFICE_PROMOTION_TIERS: readonly PromotionTier[] = [
  { floor: 0, title: 'New Hire' },
  { floor: 1, title: 'Cleared Probation' },
  { floor: 2, title: 'Operations Approved' },
  { floor: 3, title: 'Product Approved' },
  { floor: 4, title: 'Client Ready' },
  { floor: 5, title: 'Board Approved' },
]
