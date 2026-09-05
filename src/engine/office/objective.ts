import { isStubFloor, ZONE_LABEL, type ZoneId } from '@/content/office'
import { directorGateOpen, keyCount, supervisorGateOpen, type OfficeSave } from './state'

export interface OfficeObjective {
  text: string
  zone: ZoneId
  pin: { x: number; y: number }
}

/** Elevator doors are the same tiles on every floor; the pin for a cross-floor target sits on them. */
const ELEVATOR_PIN = { x: 3, y: 1 }

/**
 * Floor 2 objectives (docs/rpg/floor-2-design.md §4). First match wins.
 */
function floor2Objective(state: OfficeSave): OfficeObjective | null {
  const transfer = state.assignments.asg_transfer
  const onFloor2 = state.floorId === 'floor_02'
  const pinHere = (zone: ZoneId, pin: { x: number; y: number }, away: string, here: string) =>
    onFloor2
      ? { text: here, zone, pin }
      : { text: away, zone: 'zone_elevator' as ZoneId, pin: ELEVATOR_PIN }

  if (transfer === 'accepted') {
    return pinHere('zone_it', { x: 12, y: 1 }, 'Take a badge photo (Floor 2)', 'Take a badge photo')
  }
  if (transfer === 'photo_taken') {
    return onFloor2
      ? { text: "Get Holloway's signature (Floor 1)", zone: 'zone_landing', pin: ELEVATOR_PIN }
      : { text: "Get Holloway's signature", zone: 'zone_elevator', pin: { x: 6, y: 3 } }
  }
  if (transfer === 'signed') {
    return pinHere(
      'zone_people',
      { x: 18, y: 3 },
      'File the packet at People Ops (Floor 2)',
      'File the packet at People Ops',
    )
  }
  if (transfer === 'filed') {
    return pinHere(
      'zone_it',
      { x: 9, y: 3 },
      'Report back to Teddy (Floor 2)',
      'Report back to Teddy',
    )
  }
  if (transfer === 'complete' && state.encounters.enc_help_desk_intern !== 'won') {
    return pinHere(
      'zone_it',
      { x: 9, y: 3 },
      'Report back to Teddy (Floor 2)',
      'Report back to Teddy',
    )
  }
  if (directorGateOpen(state)) {
    return pinHere('zone_director', { x: 3, y: 9 }, 'See Kessler (Floor 2)', 'See Kessler')
  }
  if (
    state.encounters.enc_director_review === 'won' &&
    keyCount(state, 'key_employee_badge') === 0
  ) {
    return pinHere('zone_it', { x: 11, y: 2 }, 'Print your badge (Floor 2)', 'Print your badge')
  }
  if (keyCount(state, 'key_employee_badge') > 0 && !state.flags.includes('flag_floor2_complete')) {
    return onFloor2
      ? { text: 'Take the elevator', zone: 'zone_landing', pin: ELEVATOR_PIN }
      : { text: 'Take the elevator to Floor 3', zone: 'zone_elevator', pin: ELEVATOR_PIN }
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
  const floor2 = floor2Objective(state)
  if (floor2) return floor2
  if (state.flags.includes('flag_preview_complete')) {
    return { text: 'Take the elevator to Floor 2', zone: 'zone_elevator', pin: ELEVATOR_PIN }
  }
  if (keyCount(state, 'key_access_badge') > 0) {
    return { text: 'Take the elevator to Floor 2', zone: 'zone_elevator', pin: { x: 3, y: 1 } }
  }
  if (state.encounters.enc_supervisor_1on1 === 'won') {
    return { text: 'Take the elevator to Floor 2', zone: 'zone_elevator', pin: { x: 3, y: 1 } }
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

export function objectiveLabel(state: OfficeSave): string {
  const obj = currentObjective(state)
  return `${obj.text} → ${ZONE_LABEL[obj.zone]}`
}
