import { describe, expect, it } from 'vitest'
import {
  FLOOR_3_ZONE_FLOOR,
  FLOOR_4_ZONE_FLOOR,
  FLOOR_5_ZONE_FLOOR,
  FLOOR_ART_BY_ID,
  FLOOR_DIRECTORY_TEXT,
  FLOOR_IDS,
  FLOOR_INTERACT_SPOTS,
  POI_INSPECT,
  STUB_ART,
  STUB_DIRECTORY_TEXT,
  elevatorArrivalForFloor,
  elevatorBoardingSpotsForFloor,
  glyphAt,
  inBounds,
  isSolid,
  mapArtForFloor,
  spawnForFloor,
  type FloorId,
} from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'
import { doorSprite } from '@/screens/office/tiles'

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

describe('office shaft + department floors', () => {
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
    }
  })

  it('keeps live maps off the leftover stub art and directory copy', () => {
    for (const id of FLOOR_IDS) {
      expect(FLOOR_ART_BY_ID[id]).not.toEqual(STUB_ART)
      expect(FLOOR_DIRECTORY_TEXT[id]).not.toEqual(STUB_DIRECTORY_TEXT)
      expect(FLOOR_DIRECTORY_TEXT[id].join(' ')).not.toMatch(/Unmapped floor|Fable fills/)
      const placed = FLOOR_INTERACT_SPOTS[id].map((s) =>
        s.target.kind === 'poi' ? s.target.id : '',
      )
      expect(placed).not.toContain('poi_directory_sign_stub')
    }
    expect(POI_INSPECT.poi_directory_sign_stub).toMatch(/Unmapped floor/)
  })

  it('gives Product / Sales / Exec distinct floors vs each other and the F1 hall', () => {
    expect(FLOOR_3_ZONE_FLOOR.zone_product).toBe('floor_product')
    expect(FLOOR_4_ZONE_FLOOR.zone_sales).toBe('floor_sales')
    expect(FLOOR_5_ZONE_FLOOR.zone_board).toBe('floor_board')
    expect(FLOOR_3_ZONE_FLOOR.zone_hall_f3).toBe('floor_hall_f3')
    expect(FLOOR_4_ZONE_FLOOR.zone_hall_f4).toBe('floor_hall_f4')
    expect(FLOOR_5_ZONE_FLOOR.zone_hall_f5).toBe('floor_hall_f5')
    expect(FLOOR_5_ZONE_FLOOR.zone_ante).toBe('floor_ante')
    const cells = [
      FLOOR_3_ZONE_FLOOR.zone_product,
      FLOOR_4_ZONE_FLOOR.zone_sales,
      FLOOR_5_ZONE_FLOOR.zone_board,
      FLOOR_3_ZONE_FLOOR.zone_hall_f3,
      FLOOR_4_ZONE_FLOOR.zone_hall_f4,
      FLOOR_5_ZONE_FLOOR.zone_hall_f5,
      'floor_hall',
    ]
    expect(new Set(cells).size).toBe(cells.length)
  })

  it('reads (6,3) / (14,3) glass as walkable openings', () => {
    const openings: Array<{ id: FloorId; x: number; y: number }> = [
      { id: 'floor_02', x: 6, y: 3 },
      { id: 'floor_02', x: 14, y: 3 },
      { id: 'floor_03', x: 6, y: 3 },
      { id: 'floor_03', x: 14, y: 3 },
      { id: 'floor_04', x: 6, y: 3 },
      { id: 'floor_04', x: 14, y: 3 },
      { id: 'floor_05', x: 6, y: 3 },
    ]
    for (const { id, x, y } of openings) {
      expect(glyphAt(x, y, id), `${id} (${x},${y})`).toBe('D')
      expect(isSolid(x, y, id), `${id} (${x},${y}) solid`).toBe(false)
      expect(doorSprite(x, y, id), `${id} (${x},${y})`).toBe('door_v_single')
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
  })
})
