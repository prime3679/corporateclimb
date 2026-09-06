import { COWORKER_NAME } from './encounters'
import type { CoworkerId, FlagId, FloorId, KeyItemId, PoiId } from './ids'

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
/** The Office campaign is five floors. Combat chrome must not show Classic's 30. */
export const OFFICE_FLOOR_COUNT = 5

/** Cab ride beats. Presentation owns the timers; the reducer completes on the last beat. */
export const ELEVATOR_RIDE = {
  openMs: 240,
  closeMs: 480,
  travelMs: 920,
  arriveMs: 380,
  fadeMs: 420,
} as const

export function elevatorRideTotalMs(): number {
  return (
    ELEVATOR_RIDE.openMs +
    ELEVATOR_RIDE.closeMs +
    ELEVATOR_RIDE.travelMs +
    ELEVATOR_RIDE.arriveMs +
    ELEVATOR_RIDE.fadeMs
  )
}

export function elevatorRidePlan(from: FloorId, to: FloorId) {
  const fromNumber = floorNumber(from)
  const toNumber = floorNumber(to)
  return {
    fromNumber,
    toNumber,
    destName: elevatorRowFor(to).name,
    up: toNumber >= fromNumber,
    steps: Math.abs(toNumber - fromNumber),
  }
}

/** When the cab display should flip to each floor on the way. */
export function elevatorRideTicks(
  from: FloorId,
  to: FloorId,
): ReadonlyArray<{ at: number; floor: 1 | 2 | 3 | 4 | 5 }> {
  const plan = elevatorRidePlan(from, to)
  if (plan.steps === 0) return []
  const dir = plan.up ? 1 : -1
  return Array.from({ length: plan.steps }, (_, i) => {
    const step = i + 1
    return {
      at:
        ELEVATOR_RIDE.openMs +
        ELEVATOR_RIDE.closeMs +
        Math.round((ELEVATOR_RIDE.travelMs * step) / plan.steps),
      floor: (plan.fromNumber + dir * step) as 1 | 2 | 3 | 4 | 5,
    }
  })
}

export const ELEVATOR_FLOORS: readonly ElevatorFloorRow[] = [
  { id: 'floor_05', number: 5, name: 'EXEC', requires: 'key_employee_badge' },
  { id: 'floor_04', number: 4, name: 'SALES', requires: 'key_employee_badge' },
  { id: 'floor_03', number: 3, name: 'PRODUCT', requires: 'key_employee_badge' },
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

export interface ElevatorDenyLine {
  flag: FlagId
  poiId: PoiId
}

/**
 * Locked 3–5 rows share the employee-badge deny. The panel does not yet
 * tighten 4/5 to product/client, so per-floor "Sales/Exec above your grade"
 * lines were a lie.
 */
const EMPLOYEE_DENY: ElevatorDenyLine = {
  flag: 'flag_reader_denied_f2',
  poiId: 'poi_elevator_door_f2',
}

const ELEVATOR_DENY: Partial<Record<FloorId, ElevatorDenyLine>> = {
  floor_03: EMPLOYEE_DENY,
  floor_04: EMPLOYEE_DENY,
  floor_05: EMPLOYEE_DENY,
}

export function elevatorDenyFor(to: FloorId): ElevatorDenyLine | null {
  return ELEVATOR_DENY[to] ?? null
}

export function canOpenElevatorPanel(floorId: FloorId, keyItems: Record<string, number>): boolean {
  if (floorId === 'floor_01') return (keyItems.key_access_badge ?? 0) > 0
  return true
}

export function floorNumber(floorId: FloorId): 1 | 2 | 3 | 4 | 5 {
  return elevatorRowFor(floorId).number
}

/** Battle HUD: `FLOOR 3/5`, never Classic `FLOOR 7/30` from encounter rank. */
export function officeBattleChrome(floorId: FloorId): { floor: 1 | 2 | 3 | 4 | 5; floorTotal: 5 } {
  return { floor: floorNumber(floorId), floorTotal: OFFICE_FLOOR_COUNT }
}

/** Overworld objective eyebrow — always `Floor N · of 5`, matching the first-run coach. */
export function hudFloorEyebrow(floorId: FloorId): string {
  return `Floor ${floorNumber(floorId)} · of ${OFFICE_FLOOR_COUNT}`
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
