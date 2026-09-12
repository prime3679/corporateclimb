import { OFFICE_PROMOTION_TIERS } from '@/content/office/promotions'
import type { OfficeSave } from './state'

export function officePromotionTiers(state: OfficeSave) {
  // Most recently granted, rather than highest floor: a migrated save can
  // recover a missed earlier promotion after already earning a later one.
  const milestone = state.rewardsClaimed.reduce((last, id) => {
    const match = /^rwd_promotion_f([1-5])$/.exec(id)
    return match ? Number(match[1]) : last
  }, 1)
  return {
    oldTier: OFFICE_PROMOTION_TIERS[milestone - 1],
    newTier: OFFICE_PROMOTION_TIERS[milestone],
  }
}
