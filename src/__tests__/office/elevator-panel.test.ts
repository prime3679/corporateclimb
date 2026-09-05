import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import {
  canRideTo,
  ELEVATOR_FLOORS,
  elevatorArrivalForFloor,
  elevatorDenyFor,
  isKnownFloorId,
  POI_INSPECT,
  type FloorId,
} from '@/content/office'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

function at(state: OfficeState, x: number, y: number): OfficeState {
  return { ...state, overlay: null, overlayQueue: [], player: { x, y, facing: 'n' } }
}

function ride(state: OfficeState, to: FloorId): OfficeState {
  let next = dispatchOfficeAction(at(state, 3, 2), { type: 'INTERACT' }).state
  next = dispatchOfficeAction(next, { type: 'RIDE_ELEVATOR', to }).state
  next = dispatchOfficeAction(next, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
  if (next.overlay?.kind === 'celebration') {
    next = dispatchOfficeAction(next, { type: 'CHOOSE', choice: 'stay' }).state
  }
  return next
}

describe('elevator panel (floors 1–5)', () => {
  it('lists five floors and gates 2 / 3+ on the two badges', () => {
    expect(ELEVATOR_FLOORS.map((r) => r.id)).toEqual([
      'floor_05',
      'floor_04',
      'floor_03',
      'floor_02',
      'floor_01',
    ])
    expect(canRideTo('floor_01', {})).toBe(true)
    expect(canRideTo('floor_02', {})).toBe(false)
    expect(canRideTo('floor_02', { key_access_badge: 1 })).toBe(true)
    expect(canRideTo('floor_03', { key_access_badge: 1 })).toBe(false)
    expect(canRideTo('floor_05', { key_employee_badge: 1 })).toBe(true)
  })

  it('opens the panel instead of a 1⇄2 toggle, and the current floor is inert', () => {
    const badged = { ...start(), keyItems: { key_access_badge: 1 } }
    let s = dispatchOfficeAction(at(badged, 3, 2), { type: 'INTERACT' }).state
    expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_01' }).state
    expect(s.screen).toBe('overworld')
    expect(s.floorId).toBe('floor_01')
    expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
  })

  it('maps each locked 3+ row to its inspect and deny flag', () => {
    expect(elevatorDenyFor('floor_03')).toEqual({
      flag: 'flag_reader_denied_f2',
      poiId: 'poi_elevator_door_f2',
    })
    expect(elevatorDenyFor('floor_04')).toEqual({
      flag: 'flag_reader_denied_f3',
      poiId: 'poi_elevator_door_f3',
    })
    expect(elevatorDenyFor('floor_05')).toEqual({
      flag: 'flag_reader_denied_f4',
      poiId: 'poi_elevator_door_f4',
    })
    expect(elevatorDenyFor('floor_02')).toBeNull()
    expect(POI_INSPECT.poi_elevator_door_f2).toContain('Floor 3')
    expect(POI_INSPECT.poi_elevator_door_f3).toContain('Sales')
    expect(POI_INSPECT.poi_elevator_door_f4).toContain('Exec')
    expect(POI_INSPECT.poi_elevator_door_f5).toContain('no 6')
  })

  it('plays each locked 3+ row’s inspect once and keeps the panel open', () => {
    const badged = { ...start(), keyItems: { key_access_badge: 1 } }
    let s = dispatchOfficeAction(at(badged, 3, 2), { type: 'INTERACT' }).state
    const rows: { to: FloorId; flag: string; inspect: string }[] = [
      { to: 'floor_03', flag: 'flag_reader_denied_f2', inspect: POI_INSPECT.poi_elevator_door_f2 },
      { to: 'floor_04', flag: 'flag_reader_denied_f3', inspect: POI_INSPECT.poi_elevator_door_f3 },
      { to: 'floor_05', flag: 'flag_reader_denied_f4', inspect: POI_INSPECT.poi_elevator_door_f4 },
    ]
    for (const row of rows) {
      s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: row.to }).state
      expect(s.flags).toContain(row.flag)
      expect(s.overlay).toMatchObject({
        kind: 'dialogue',
        nodeId: `inspect:${row.inspect}`,
      })
      expect(s.floorId).toBe('floor_01')
      s = dispatchOfficeAction(s, { type: 'ADVANCE' }).state
      expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
    }
    for (const row of rows) {
      s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: row.to }).state
      expect(s.overlay).toMatchObject({ kind: 'elevator_panel' })
      expect(s.floorId).toBe('floor_01')
    }
  })

  it('uses destination copy when the panel is opened on Floor 2', () => {
    let s: OfficeState = { ...start(), keyItems: { key_access_badge: 1 } }
    s = ride(s, 'floor_02')
    s = dispatchOfficeAction(at(s, 3, 2), { type: 'INTERACT' }).state
    s = dispatchOfficeAction(s, { type: 'CHOOSE', choice: 'floor_04' }).state
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_elevator_door_f3}`,
    })
    expect(s.flags).toContain('flag_reader_denied_f3')
    expect(s.flags).not.toContain('flag_reader_denied_f2')
    expect(s.floorId).toBe('floor_02')
  })

  it('rides 1 → 2 → 3 and arrives on the shared shaft tile', () => {
    let s: OfficeState = { ...start(), keyItems: { key_access_badge: 1, key_employee_badge: 1 } }
    s = ride(s, 'floor_02')
    expect(s.floorId).toBe('floor_02')
    expect(s.player).toEqual(elevatorArrivalForFloor('floor_02'))
    expect(s.flags).toContain('flag_preview_complete')

    s = ride(s, 'floor_03')
    expect(s.floorId).toBe('floor_03')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
    expect(s.flags).toContain('flag_floor2_complete')
    expect(s.stats.rides).toBe(2)

    s = dispatchOfficeAction(
      { ...s, overlay: null, overlayQueue: [] },
      { type: 'MOVE', dir: 's' },
    ).state
    expect(s.player).toEqual({ x: 3, y: 3, facing: 's' })
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_sloane_callout' })
    expect(s.flags).toContain('flag_visited_f3')

    s = ride(s, 'floor_01')
    expect(s.floorId).toBe('floor_01')
    expect(s.player).toEqual({ x: 3, y: 2, facing: 's' })
  })

  it('accepts every FloorId the panel lists', () => {
    for (const row of ELEVATOR_FLOORS) expect(isKnownFloorId(row.id)).toBe(true)
  })
})
