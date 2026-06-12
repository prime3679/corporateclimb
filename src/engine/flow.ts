// ─── BETWEEN-FLOOR FLOW ─────────────────────────────────────
// The single router for the interstitial sequence after a victory:
//
//   promotion → shop → act transition → hallway events → elevator →
//   floor intro
//
// Each stop is entered only when the run calls for it. The UI used to
// hand-order this in four separate handlers (victory continue, perk
// pick, shop leave, save resume) and they drifted; now every handler
// asks `nextStop` the same question: "given the run and what this
// sequence has already shown, where next?"
//
// Two facts are presentation-session state, not run state, so the
// caller supplies them: whether an act transition is still owed
// (`actPending` — cosmetic, intentionally not persisted) and whether
// the hallway events for this floor entry have already been played
// (`eventsDone` — event offers are rolled at show time and likewise
// not persisted; a reload resumes at the elevator, the long-standing
// behavior).

import type { RunState } from './state'
import { eliteAvailable } from './run'

export type FlowStop =
  | 'promotion'
  | 'shop'
  | 'actTransition'
  | 'routeChoice'
  | 'elevator'
  | 'floorIntro'

export interface FlowContext {
  /** An act transition has been queued and not yet shown. */
  actPending: boolean
  /** The hallway event for this floor entry has been resolved. */
  eventsDone: boolean
}

/** Hallway events run unless a daily modifier disables them. */
export function eventsEnabled(run: RunState): boolean {
  return run.mode.kind !== 'daily' || run.mode.modifier.eventsEnabled
}

/** The elevator is offered until a pick is committed for this floor. */
export function elevatorPending(run: RunState): boolean {
  return eliteAvailable(run.floor) && !run.eliteFloor && run.mystery === null
}

/** Where the between-floor sequence goes next. */
export function nextStop(run: RunState, ctx: FlowContext): FlowStop {
  if (run.pendingPerkOffer) return 'promotion'
  if (run.shopStock) return 'shop'
  if (ctx.actPending) return 'actTransition'
  if (!ctx.eventsDone && eventsEnabled(run)) return 'routeChoice'
  if (elevatorPending(run)) return 'elevator'
  return 'floorIntro'
}
