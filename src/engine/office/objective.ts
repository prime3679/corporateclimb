import { isStubFloor, ZONE_LABEL, floorNumber, type FloorId, type ZoneId } from '@/content/office'
import { directorGateOpen, keyCount, supervisorGateOpen, type OfficeSave } from './state'

export interface OfficeObjective {
  text: string
  zone: ZoneId
  pin: { x: number; y: number }
  /** When set, the HUD dest chip reads `→ FLOOR N` instead of the zone name. */
  destFloor?: FloorId
}

/** Landing accent for cross-floor dest chips (floor-2 §10.1). */
export const LANDING_DEST_ACCENT = '#e0844d'

/** Elevator doors are the same tiles on every floor; the pin for a cross-floor target sits on them. */
const ELEVATOR_PIN = { x: 3, y: 1 }

/** Soft-skip: a floor the player already stepped onto (or started) stays the dest. */
function floorStarted(state: OfficeSave, floor: 'floor_03' | 'floor_04' | 'floor_05'): boolean {
  if (floor === 'floor_05') {
    return (
      state.flags.includes('flag_visited_f5') ||
      state.assignments.asg_board_packet !== 'not_started'
    )
  }
  if (floor === 'floor_04') {
    return (
      state.flags.includes('flag_visited_f4') || state.assignments.asg_leavebehind !== 'not_started'
    )
  }
  return state.flags.includes('flag_visited_f3') || state.assignments.asg_roadmap !== 'not_started'
}

function awayZone(state: OfficeSave): ZoneId {
  return state.floorId === 'floor_01' ? 'zone_elevator' : 'zone_landing'
}

function pinHere(
  state: OfficeSave,
  onFloor: boolean,
  zone: ZoneId,
  pin: { x: number; y: number },
  away: string,
  here: string,
  destFloor: FloorId,
): OfficeObjective {
  return onFloor
    ? { text: here, zone, pin }
    : { text: away, zone: awayZone(state), pin: ELEVATOR_PIN, destFloor }
}

/**
 * Floor 5 → 4 → 3 → 2 → 1 (docs/rpg/floor-3-5-engine-hooks.md §5). First match wins.
 */
function floor5Objective(state: OfficeSave): OfficeObjective | null {
  const asg = state.assignments.asg_board_packet
  const on = state.floorId === 'floor_05'
  const here = (zone: ZoneId, pin: { x: number; y: number }, away: string, local: string) =>
    pinHere(state, on, zone, pin, away, local, 'floor_05')

  if (state.flags.includes('flag_floor5_complete')) {
    return on
      ? { text: 'The elevator still goes down', zone: 'zone_landing', pin: ELEVATOR_PIN }
      : null
  }
  if (asg === 'accepted') {
    return here(
      'zone_ante',
      { x: 17, y: 4 },
      'Take the board packet (Floor 5)',
      'Take the board packet',
    )
  }
  if (asg === 'packet_held') {
    return here(
      'zone_ante',
      { x: 10, y: 3 },
      'File the packet with Marlowe (Floor 5)',
      'File the packet with Marlowe',
    )
  }
  if (asg === 'complete' && state.encounters.enc_ceo_review !== 'won') {
    return here('zone_board', { x: 18, y: 11 }, 'See Caldwell (Floor 5)', 'See Caldwell')
  }
  if (asg === 'not_started' && on) {
    return { text: 'Talk to Marlowe', zone: 'zone_ante', pin: { x: 10, y: 3 } }
  }
  if (keyCount(state, 'key_client_badge') > 0 || floorStarted(state, 'floor_05')) {
    return on
      ? { text: 'Talk to Marlowe', zone: 'zone_ante', pin: { x: 10, y: 3 } }
      : {
          text: 'Take the elevator to Floor 5',
          zone: awayZone(state),
          pin: ELEVATOR_PIN,
          destFloor: 'floor_05',
        }
  }
  return null
}

function floor4Objective(state: OfficeSave): OfficeObjective | null {
  const asg = state.assignments.asg_leavebehind
  const on = state.floorId === 'floor_04'
  const here = (zone: ZoneId, pin: { x: number; y: number }, away: string, local: string) =>
    pinHere(state, on, zone, pin, away, local, 'floor_04')

  if (asg === 'accepted') {
    return here(
      'zone_pipeline',
      { x: 13, y: 1 },
      'Pull the leave-behind (Floor 4)',
      'Pull the leave-behind',
    )
  }
  if (asg === 'deck_held') {
    return here(
      'zone_client',
      { x: 19, y: 3 },
      'Walk it over to Reyes (Floor 4)',
      'Walk it over to Reyes',
    )
  }
  if (asg === 'delivered') {
    return here(
      'zone_pipeline',
      { x: 10, y: 3 },
      'Report back to Harper (Floor 4)',
      'Report back to Harper',
    )
  }
  if (asg === 'complete' && state.encounters.enc_vp_sales !== 'won') {
    return here('zone_sales', { x: 17, y: 11 }, 'See Ashford (Floor 4)', 'See Ashford')
  }
  if (keyCount(state, 'key_client_badge') > 0 && !state.flags.includes('flag_floor5_complete')) {
    return on
      ? {
          text: 'Take the elevator',
          zone: 'zone_landing',
          pin: ELEVATOR_PIN,
          destFloor: 'floor_05',
        }
      : {
          text: 'Take the elevator to Floor 5',
          zone: awayZone(state),
          pin: ELEVATOR_PIN,
          destFloor: 'floor_05',
        }
  }
  if (asg === 'not_started' && on) {
    return { text: 'Talk to Harper', zone: 'zone_pipeline', pin: { x: 10, y: 3 } }
  }
  if (
    (keyCount(state, 'key_product_badge') > 0 || floorStarted(state, 'floor_04')) &&
    asg === 'not_started'
  ) {
    return on
      ? { text: 'Talk to Harper', zone: 'zone_pipeline', pin: { x: 10, y: 3 } }
      : {
          text: 'Take the elevator to Floor 4',
          zone: awayZone(state),
          pin: ELEVATOR_PIN,
          destFloor: 'floor_04',
        }
  }
  return null
}

function floor3Objective(state: OfficeSave): OfficeObjective | null {
  const asg = state.assignments.asg_roadmap
  const on = state.floorId === 'floor_03'
  const here = (zone: ZoneId, pin: { x: number; y: number }, away: string, local: string) =>
    pinHere(state, on, zone, pin, away, local, 'floor_03')

  if (asg === 'accepted') {
    return here('zone_war', { x: 13, y: 1 }, 'Pull the Q4 card (Floor 3)', 'Pull the Q4 card')
  }
  if (asg === 'card_held') {
    return here(
      'zone_intake',
      { x: 19, y: 4 },
      "Get Nico's initials (Floor 3)",
      "Get Nico's initials",
    )
  }
  if (asg === 'initialled') {
    return here(
      'zone_war',
      { x: 10, y: 3 },
      'Report back to Sloane (Floor 3)',
      'Report back to Sloane',
    )
  }
  if (asg === 'complete' && state.encounters.enc_vp_product !== 'won') {
    return here('zone_product', { x: 17, y: 11 }, 'See Quincy (Floor 3)', 'See Quincy')
  }
  if (
    keyCount(state, 'key_product_badge') > 0 &&
    state.assignments.asg_leavebehind === 'not_started'
  ) {
    return on
      ? {
          text: 'Take the elevator',
          zone: 'zone_landing',
          pin: ELEVATOR_PIN,
          destFloor: 'floor_04',
        }
      : {
          text: 'Take the elevator to Floor 4',
          zone: awayZone(state),
          pin: ELEVATOR_PIN,
          destFloor: 'floor_04',
        }
  }
  if (asg === 'not_started' && on) {
    return { text: 'Talk to Sloane', zone: 'zone_war', pin: { x: 10, y: 3 } }
  }
  if (keyCount(state, 'key_employee_badge') > 0 && asg === 'not_started') {
    return on
      ? { text: 'Talk to Sloane', zone: 'zone_war', pin: { x: 10, y: 3 } }
      : {
          text: 'Take the elevator to Floor 3',
          zone: awayZone(state),
          pin: ELEVATOR_PIN,
          destFloor: 'floor_03',
        }
  }
  return null
}

/**
 * Floor 2 objectives (docs/rpg/floor-2-design.md §4). First match wins.
 */
function floor2Objective(state: OfficeSave): OfficeObjective | null {
  const transfer = state.assignments.asg_transfer
  const onFloor2 = state.floorId === 'floor_02'
  const pinOn2 = (zone: ZoneId, pin: { x: number; y: number }, away: string, here: string) =>
    onFloor2
      ? { text: here, zone, pin }
      : {
          text: away,
          zone: 'zone_elevator' as ZoneId,
          pin: ELEVATOR_PIN,
          destFloor: 'floor_02' as const,
        }

  if (transfer === 'accepted') {
    return pinOn2('zone_it', { x: 12, y: 1 }, 'Take a badge photo (Floor 2)', 'Take a badge photo')
  }
  if (transfer === 'photo_taken') {
    return onFloor2
      ? {
          text: "Get Holloway's signature (Floor 1)",
          zone: 'zone_landing',
          pin: ELEVATOR_PIN,
          destFloor: 'floor_01',
        }
      : { text: "Get Holloway's signature", zone: 'zone_elevator', pin: { x: 6, y: 3 } }
  }
  if (transfer === 'signed') {
    return pinOn2(
      'zone_people',
      { x: 18, y: 3 },
      'File the packet at People Ops (Floor 2)',
      'File the packet at People Ops',
    )
  }
  if (transfer === 'filed') {
    return pinOn2(
      'zone_it',
      { x: 9, y: 3 },
      'Report back to Teddy (Floor 2)',
      'Report back to Teddy',
    )
  }
  if (transfer === 'complete' && state.encounters.enc_help_desk_intern !== 'won') {
    return pinOn2(
      'zone_it',
      { x: 9, y: 3 },
      'Report back to Teddy (Floor 2)',
      'Report back to Teddy',
    )
  }
  if (directorGateOpen(state)) {
    return pinOn2('zone_director', { x: 3, y: 9 }, 'See Kessler (Floor 2)', 'See Kessler')
  }
  if (
    state.encounters.enc_director_review === 'won' &&
    keyCount(state, 'key_employee_badge') === 0
  ) {
    return pinOn2('zone_it', { x: 11, y: 2 }, 'Print your badge (Floor 2)', 'Print your badge')
  }
  if (keyCount(state, 'key_employee_badge') > 0 && !state.flags.includes('flag_floor2_complete')) {
    return onFloor2
      ? {
          text: 'Take the elevator',
          zone: 'zone_landing',
          pin: ELEVATOR_PIN,
          destFloor: 'floor_03',
        }
      : {
          text: 'Take the elevator to Floor 3',
          zone: 'zone_elevator',
          pin: ELEVATOR_PIN,
          destFloor: 'floor_03',
        }
  }
  if (transfer === 'not_started' && onFloor2) {
    return { text: 'Talk to Teddy', zone: 'zone_it', pin: { x: 9, y: 3 } }
  }
  if (onFloor2 && state.flags.includes('flag_visited_f2') && transfer === 'not_started') {
    return { text: 'Talk to Teddy', zone: 'zone_it', pin: { x: 9, y: 3 } }
  }
  return null
}

export function currentObjective(state: OfficeSave): OfficeObjective {
  if (isStubFloor(state.floorId)) {
    return { text: 'Look around', zone: 'zone_landing', pin: ELEVATOR_PIN }
  }
  // Honor the floor you're standing on so a skip to 4/5 doesn't yank the pin back.
  if (state.floorId === 'floor_05') {
    const here = floor5Objective(state)
    if (here) return here
  }
  if (state.floorId === 'floor_04') {
    const here = floor4Objective(state)
    if (here) return here
  }
  if (state.floorId === 'floor_03') {
    const here = floor3Objective(state)
    if (here) return here
  }
  const floor5 = floor5Objective(state)
  if (floor5) return floor5
  const floor4 = floor4Objective(state)
  if (floor4) return floor4
  const floor3 = floor3Objective(state)
  if (floor3) return floor3
  const floor2 = floor2Objective(state)
  if (floor2) return floor2
  if (state.flags.includes('flag_preview_complete')) {
    return {
      text: 'Take the elevator to Floor 2',
      zone: 'zone_elevator',
      pin: ELEVATOR_PIN,
      destFloor: state.floorId === 'floor_02' ? undefined : 'floor_02',
    }
  }
  if (keyCount(state, 'key_access_badge') > 0) {
    return {
      text: 'Take the elevator to Floor 2',
      zone: 'zone_elevator',
      pin: { x: 3, y: 1 },
      destFloor: state.floorId === 'floor_02' ? undefined : 'floor_02',
    }
  }
  if (state.encounters.enc_supervisor_1on1 === 'won') {
    return {
      text: 'Take the elevator to Floor 2',
      zone: 'zone_elevator',
      pin: { x: 3, y: 1 },
      destFloor: state.floorId === 'floor_02' ? undefined : 'floor_02',
    }
  }
  if (supervisorGateOpen(state)) {
    return { text: 'See Holloway', zone: 'zone_elevator', pin: { x: 10, y: 3 } }
  }
  if (state.assignments.asg_printer === 'complete') {
    return { text: 'Talk to Gavin', zone: 'zone_desks', pin: { x: 6, y: 10 } }
  }
  if (state.assignments.asg_printer === 'installed') {
    return { text: 'Report back to Renata', zone: 'zone_reception', pin: { x: 8, y: 14 } }
  }
  if (state.assignments.asg_printer === 'toner_collected') {
    return { text: 'Install the toner', zone: 'zone_desks', pin: { x: 9, y: 7 } }
  }
  if (state.assignments.asg_printer === 'accepted') {
    return { text: 'Get toner from the supply cabinet', zone: 'zone_break', pin: { x: 15, y: 8 } }
  }
  if (state.flags.includes('flag_greeted')) {
    return { text: 'Talk to Renata', zone: 'zone_reception', pin: { x: 8, y: 14 } }
  }
  return { text: 'Look around', zone: 'zone_reception', pin: { x: 8, y: 14 } }
}

export function destChip(
  state: OfficeSave,
  obj: OfficeObjective = currentObjective(state),
): { label: string; accent: string | null; live: string } {
  const dest = obj.destFloor
  if (dest && dest !== state.floorId) {
    const n = floorNumber(dest)
    const glyph = n > floorNumber(state.floorId) ? '▲' : '▼'
    return {
      label: `${glyph} → FLOOR ${n}`,
      accent: LANDING_DEST_ACCENT,
      live: `Objective: ${obj.text}. Floor ${n}. Take the elevator.`,
    }
  }
  return {
    label: `→ ${ZONE_LABEL[obj.zone]}`,
    accent: null,
    live: `Objective: ${obj.text}. ${ZONE_LABEL[obj.zone]}.`,
  }
}

export function objectiveLabel(state: OfficeSave): string {
  const obj = currentObjective(state)
  return `${obj.text} ${destChip(state, obj).label}`
}
