import { describe, expect, it } from 'vitest'
import {
  FLOOR_IDS,
  elevatorArrivalForFloor,
  elevatorBoardingSpotsForFloor,
  glyphAt,
  inBounds,
  isSolid,
  isStubFloor,
  mapArtForFloor,
  spawnForFloor,
  type FloorId,
} from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function flood(floorId: FloorId, start: { x: number; y: number }): Set<string> {
  const seen = new Set<string>()
  const q = [start]
  while (q.length) {
    const cur = q.pop()!
    const key = `${cur.x},${cur.y}`
    if (seen.has(key)) continue
    if (!inBounds(cur.x, cur.y) || isSolid(cur.x, cur.y, floorId)) continue
    seen.add(key)
    q.push(
      { x: cur.x + 1, y: cur.y },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x, y: cur.y - 1 },
    )
  }
  return seen
}

describe('floors 3–5 stub drop-in', () => {
  it('registers floor_01 through floor_05 and keeps the same shaft', () => {
    expect(FLOOR_IDS).toEqual(['floor_01', 'floor_02', 'floor_03', 'floor_04', 'floor_05'])
    for (const id of FLOOR_IDS) {
      expect(elevatorArrivalForFloor(id)).toEqual({ x: 3, y: 2, facing: 's' })
      expect(glyphAt(2, 1, id)).toBe('E')
      expect(glyphAt(3, 1, id)).toBe('E')
      expect(glyphAt(4, 1, id)).toBe('R')
    }
  })

  it('is walkable from arrival to a boarding tile on floors 3–5', () => {
    for (const id of ['floor_03', 'floor_04', 'floor_05'] as const) {
      const art = mapArtForFloor(id)
      expect(art).toHaveLength(18)
      expect(art[0]).toHaveLength(24)
      const reach = flood(id, spawnForFloor(id))
      expect(reach.has('3,2')).toBe(true)
      expect(reach.size).toBeGreaterThan(40)
      const board = elevatorBoardingSpotsForFloor(id)[0]
      expect(reach.has(`${board.x},${board.y}`)).toBe(true)
      expect(isStubFloor(id)).toBe(false)
    }
  })

  it('lets a badged run ride 1 → 2 → 3 and walk Product', () => {
    let s: OfficeState = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
    s = {
      ...s,
      overlay: null,
      overlayQueue: [],
      keyItems: { key_access_badge: 1, key_employee_badge: 1 },
      player: { x: 3, y: 2, facing: 'n' },
    }
    for (const to of ['floor_02', 'floor_03'] as const) {
      s = dispatchOfficeAction(s, { type: 'RIDE_ELEVATOR', to }).state
      s = dispatchOfficeAction(s, { type: 'COMPLETE_ELEVATOR_RIDE' }).state
      s = { ...s, overlay: null, overlayQueue: [] }
    }
    expect(s.floorId).toBe('floor_03')
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'e' }).state
    expect(s.player.x).toBeGreaterThan(3)
    expect(s.overlay).toMatchObject({ kind: 'dialogue', nodeId: 'dlg_sloane_callout' })
    expect(isStubFloor(s.floorId)).toBe(false)
  })
})
