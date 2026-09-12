// Office funnel events derived from state transitions, so the reducer
// stays pure and no screen has to remember to call track() by hand.
import { track } from '@/analytics'
import type { OfficeState } from '@/engine/office'

export function trackOfficeTransition(prev: OfficeState, next: OfficeState) {
  if (prev === next) return
  const floor = next.floorId
  if (prev.screen !== 'battle' && next.screen === 'battle') {
    track('office_fight_start', { floor, encounter: next.encounter?.encounterId ?? null })
  }
  if (next.stats.battlesWon > prev.stats.battlesWon) {
    track('office_fight_won', { floor, encounter: prev.encounter?.encounterId ?? null })
  }
  if (next.stats.losses > prev.stats.losses) {
    track('office_fight_lost', { floor, encounter: prev.encounter?.encounterId ?? null })
  }
  const prevCel = prev.overlay?.kind === 'celebration' ? prev.overlay.screen : null
  const nextCel = next.overlay?.kind === 'celebration' ? next.overlay.screen : null
  if (nextCel && nextCel !== prevCel) {
    track('office_floor_cleared', { floor, screen: nextCel })
  }
}
