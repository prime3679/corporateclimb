import { COWORKER_NAME } from './encounters'
import type { CoworkerId, FloorId, KeyItemId } from './ids'

export interface ElevatorFloorRow {
  id: FloorId
  number: 1 | 2 | 3 | 4 | 5
  name: string
  requires: KeyItemId | null
}

/**
 * Cab panel rows (design §8.2, extended to Adrian's 5-floor lock).
 * Highest floor first so the panel reads like a real elevator.
 */
export const ELEVATOR_FLOORS: readonly ElevatorFloorRow[] = [
  { id: 'floor_05', number: 5, name: 'FLOOR 5', requires: 'key_employee_badge' },
  { id: 'floor_04', number: 4, name: 'FLOOR 4', requires: 'key_employee_badge' },
  { id: 'floor_03', number: 3, name: 'FLOOR 3', requires: 'key_employee_badge' },
  { id: 'floor_02', number: 2, name: 'OPERATIONS', requires: 'key_access_badge' },
  { id: 'floor_01', number: 1, name: 'YOUR TEAM', requires: null },
]

export const COWORKER_DESK: Record<CoworkerId, { floorId: FloorId; pronoun: 'his' | 'her' }> = {
  cw_desk_challenger: { floorId: 'floor_01', pronoun: 'his' },
  cw_meeting_prepper: { floorId: 'floor_01', pronoun: 'her' },
  cw_help_desk_intern: { floorId: 'floor_02', pronoun: 'his' },
}

export function elevatorRowFor(floorId: FloorId): ElevatorFloorRow {
  return (
    ELEVATOR_FLOORS.find((row) => row.id === floorId) ?? ELEVATOR_FLOORS[ELEVATOR_FLOORS.length - 1]
  )
}

export function canRideTo(to: FloorId, keyItems: Record<string, number>): boolean {
  const row = elevatorRowFor(to)
  if (!row.requires) return true
  return (keyItems[row.requires] ?? 0) > 0
}

export function canOpenElevatorPanel(floorId: FloorId, keyItems: Record<string, number>): boolean {
  if (floorId === 'floor_01') return (keyItems.key_access_badge ?? 0) > 0
  return true
}

export function floorNumber(floorId: FloorId): 1 | 2 | 3 | 4 | 5 {
  return elevatorRowFor(floorId).number
}

export function deskRosterLine(
  hired: readonly CoworkerId[],
  party: ReadonlyArray<{ def: { kind: string; id?: CoworkerId } }>,
  floorId: FloorId,
): string {
  const names = hired
    .filter((id) => COWORKER_DESK[id].floorId === floorId)
    .filter((id) => !party.some((m) => m.def.kind === 'coworker' && m.def.id === id))
    .map((id) => COWORKER_NAME[id])
  return names.join(' · ')
}
