import {
  FLOOR_2_LEDGER_MAX,
  FLOOR_3_LEDGER_MAX,
  FLOOR_4_LEDGER_MAX,
  FLOOR_5_LEDGER_MAX,
  FLOOR_LEDGER_MAX,
  FLOOR_REWARD_IDS,
  RECEIPTS,
  REWARD_OPTIONS,
  elevatorRowFor,
  floorNumber,
  ledgerOptionsEarned,
  type AssignmentId,
  type FloorId,
  type RewardId,
} from '@/content/office'
import { inParty, isHired, type OfficeState } from './state'

export type CelebrationScreen =
  | 'screen_preview_complete'
  | 'screen_floor2_complete'
  | 'screen_floor3_complete'
  | 'screen_floor4_complete'
  | 'screen_floor5_complete'

export const CELEBRATION_COUNT_MS = 1100

const FLOOR_ASSIGNMENTS: Record<FloorId, readonly AssignmentId[]> = {
  floor_01: ['asg_printer', 'asg_meeting_prep'],
  floor_02: ['asg_transfer', 'asg_audit'],
  floor_03: ['asg_roadmap'],
  floor_04: ['asg_leavebehind'],
  floor_05: ['asg_board_packet'],
}

const LEDGER_MAX: Record<FloorId, number> = {
  floor_01: FLOOR_LEDGER_MAX,
  floor_02: FLOOR_2_LEDGER_MAX,
  floor_03: FLOOR_3_LEDGER_MAX,
  floor_04: FLOOR_4_LEDGER_MAX,
  floor_05: FLOOR_5_LEDGER_MAX,
}

export function celebrationFloor(screen: CelebrationScreen): FloorId {
  if (screen === 'screen_preview_complete') return 'floor_01'
  if (screen === 'screen_floor2_complete') return 'floor_02'
  if (screen === 'screen_floor3_complete') return 'floor_03'
  if (screen === 'screen_floor4_complete') return 'floor_04'
  return 'floor_05'
}

function hired(
  state: OfficeState,
  id: 'cw_desk_challenger' | 'cw_meeting_prepper' | 'cw_help_desk_intern',
) {
  return inParty(state, id) || isHired(state, id)
}

export function celebrationCopy(
  state: OfficeState,
  screen: CelebrationScreen,
): { title: string; body: string; dim: string } {
  if (screen === 'screen_preview_complete') {
    const gavin = hired(state, 'cw_desk_challenger')
    const priya = hired(state, 'cw_meeting_prepper')
    const hire = priya ? 'hired two people' : gavin ? 'hired a critic' : 'hired nobody'
    return {
      title: 'FLOOR 1 CLEARED',
      body: `You fixed a printer, ${hire}, survived a one-on-one, and got laminated. That's a career.`,
      dim: 'Floor 2 is Operations. The elevator goes both ways.',
    }
  }
  if (screen === 'screen_floor2_complete') {
    const audit = state.assignments.asg_audit === 'complete' ? 'got audited' : 'dodged an audit'
    const teddy = hired(state, 'cw_help_desk_intern') ? 'hired the intern' : 'passed compliance'
    return {
      title: 'FLOOR 2 CLEARED',
      body: `You took a photo with your eyes closed, ${audit}, ${teddy}, and were made permanent. That's tenure.`,
      dim: 'Floor 3 is Product. The elevator still goes down.',
    }
  }
  if (screen === 'screen_floor3_complete') {
    return {
      title: 'FLOOR 3 CLEARED',
      body: "You pulled a Q4 card, got it initialled, and sat through prioritization. That's a roadmap.",
      dim: 'Floor 4 is Sales. The elevator still goes up.',
    }
  }
  if (screen === 'screen_floor4_complete') {
    return {
      title: 'FLOOR 4 CLEARED',
      body: "You walked a leave-behind across the floor and closed. That's pipeline.",
      dim: 'Floor 5 is Exec. The elevator still goes up.',
    }
  }
  return {
    title: 'THE CLIMB',
    body: 'Caldwell nods once. The nod is the offer. There is no letter. There is no Floor 6.',
    dim: 'The elevator still goes down. That is the whole building.',
  }
}

/** Live-region line — titles, never raw `screen_*` ids. */
export function celebrationLive(state: OfficeState, screen: CelebrationScreen): string {
  const copy = celebrationCopy(state, screen)
  return `${copy.title}. ${copy.body}`
}

/** Eyebrow over the celebration title — department, not a screen id. */
export function celebrationKicker(screen: CelebrationScreen): string {
  const dept = elevatorRowFor(celebrationFloor(screen)).name
  return screen === 'screen_floor5_complete' ? `${dept} · THE BUILDING` : `${dept} · CLEARED`
}

export function celebrationStats(state: OfficeState, screen: CelebrationScreen) {
  const floorId = celebrationFloor(screen)
  const ids = FLOOR_ASSIGNMENTS[floorId]
  const assignmentsDone = ids.filter((id) => state.assignments[id] === 'complete').length
  const ledger = celebrationLedger(state, screen)
  return {
    floorId,
    assignmentsDone,
    assignmentsTotal: ids.length,
    battlesWon: state.stats.battlesWon,
    losses: state.stats.losses,
    switches: state.stats.switches,
    options: ledger.earned,
    ledgerMax: ledger.max,
    ledgerComplete: ledger.complete,
    timeMs: state.stats.msOnFloor,
  }
}

export interface CelebrationLedgerRow {
  id: RewardId
  title: string
  options: number
  claimed: boolean
}

export interface CelebrationLedger {
  rows: CelebrationLedgerRow[]
  earned: number
  max: number
  complete: boolean
}

function receiptTitleFor(id: RewardId): string {
  const receipt = Object.values(RECEIPTS).find((row) => row.rewardId === id)
  return receipt?.title ?? id
}

/** Claimed vs missed `rwd_*` rows for one floor. Promotion 0-Option rows stay off the plate. */
export function celebrationLedger(
  state: OfficeState,
  screen: CelebrationScreen,
): CelebrationLedger {
  const floorId = celebrationFloor(screen)
  const rows = FLOOR_REWARD_IDS[floorId]
    .filter((id) => (REWARD_OPTIONS[id] ?? 0) > 0)
    .map((id) => ({
      id,
      title: receiptTitleFor(id),
      options: REWARD_OPTIONS[id],
      claimed: state.rewardsClaimed.includes(id),
    }))
  const earned = ledgerOptionsEarned(state.rewardsClaimed, floorId)
  const max = LEDGER_MAX[floorId]
  return { rows, earned, max, complete: earned === max }
}

export interface CelebrationButton {
  id: string
  label: string
  variant: 'primary' | 'secondary'
}

/** [Back] [Floor N] [Title] — Floor N is the next (or down) ride; Back stays here. */
export function celebrationButtons(screen: CelebrationScreen): CelebrationButton[] {
  const n = floorNumber(celebrationFloor(screen))
  if (screen === 'screen_preview_complete') {
    return [
      { id: 'floor_02', label: 'Floor 2', variant: 'primary' },
      { id: 'floor_01', label: 'Back to Floor 1', variant: 'secondary' },
      { id: 'title', label: 'Title', variant: 'secondary' },
    ]
  }
  if (screen === 'screen_floor5_complete') {
    return [
      { id: 'stay', label: 'Back to Floor 5', variant: 'secondary' },
      { id: 'floor_01', label: 'Floor 1', variant: 'primary' },
      { id: 'title', label: 'Title', variant: 'secondary' },
    ]
  }
  const next = n + 1
  return [
    { id: 'stay', label: `Back to Floor ${n}`, variant: 'secondary' },
    { id: `floor_0${next}`, label: `Floor ${next}`, variant: 'primary' },
    { id: 'title', label: 'Title', variant: 'secondary' },
  ]
}
