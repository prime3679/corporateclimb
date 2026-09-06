import { describe, expect, it } from 'vitest'
import { POST_CELEBRATION, glyphAt, type Facing, type FloorId } from '@/content/office'
import {
  FLOOR_3_ARRIVAL,
  FLOOR_3_ART,
  FLOOR_3_DEFEAT_RESPAWN,
  FLOOR_3_DOOR_CELLS,
  FLOOR_3_INTERACT_SPOTS,
  FLOOR_3_NPC_GLYPH,
  FLOOR_3_NPC_SIGHT,
  FLOOR_3_NPC_TILE,
  FLOOR_3_POI_GLYPHS,
  FLOOR_3_PROP_CELLS,
  FLOOR_3_RUGS,
  FLOOR_3_SOLID_GLYPHS,
  FLOOR_3_WALL_DECOR,
  FLOOR_3_ZONE_ACCENT,
  FLOOR_3_ZONE_FLOOR,
  FLOOR_3_ZONE_LABEL,
  floor3GlyphAt,
  floor3IsSolid,
  floor3ZoneAt,
} from '@/content/office/floor3'
import {
  FLOOR_4_ARRIVAL,
  FLOOR_4_ART,
  FLOOR_4_DEFEAT_RESPAWN,
  FLOOR_4_DOOR_CELLS,
  FLOOR_4_INTERACT_SPOTS,
  FLOOR_4_NPC_GLYPH,
  FLOOR_4_NPC_SIGHT,
  FLOOR_4_NPC_TILE,
  FLOOR_4_POI_GLYPHS,
  FLOOR_4_PROP_CELLS,
  FLOOR_4_RUGS,
  FLOOR_4_SOLID_GLYPHS,
  FLOOR_4_WALL_DECOR,
  FLOOR_4_ZONE_ACCENT,
  FLOOR_4_ZONE_FLOOR,
  FLOOR_4_ZONE_LABEL,
  floor4GlyphAt,
  floor4IsSolid,
  floor4ZoneAt,
} from '@/content/office/floor4'
import {
  FLOOR_5_ARRIVAL,
  FLOOR_5_ART,
  FLOOR_5_DEFEAT_RESPAWN,
  FLOOR_5_DOOR_CELLS,
  FLOOR_5_INTERACT_SPOTS,
  FLOOR_5_NPC_GLYPH,
  FLOOR_5_NPC_SIGHT,
  FLOOR_5_NPC_TILE,
  FLOOR_5_POI_GLYPHS,
  FLOOR_5_PROP_CELLS,
  FLOOR_5_RUGS,
  FLOOR_5_SOLID_GLYPHS,
  FLOOR_5_WALL_DECOR,
  FLOOR_5_ZONE_ACCENT,
  FLOOR_5_ZONE_FLOOR,
  FLOOR_5_ZONE_LABEL,
  floor5GlyphAt,
  floor5IsSolid,
  floor5ZoneAt,
} from '@/content/office/floor5'
import { TILE_ATLAS, type TileName } from '@/screens/office/tileAtlas'
import { floorCells, propCells, type TileStates } from '@/screens/office/tiles'

const W = 24
const H = 18

const DELTA: Record<Facing, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
}

function inAtlas(name: string) {
  expect(TILE_ATLAS[name as TileName], `atlas cell ${name}`).toBeDefined()
}

type FloorPack = {
  id: FloorId
  art: readonly string[]
  arrival: { x: number; y: number; facing: Facing }
  respawn: { x: number; y: number; facing: Facing }
  solid: Set<string>
  glyphAt: (x: number, y: number) => string
  isSolid: (x: number, y: number) => boolean
  npcGlyph: Record<string, string>
  npcTile: Record<string, { x: number; y: number; facing: Facing }>
  npcSight: Record<string, { x: number; y: number }[]>
  spots: { x: number; y: number; facing: Facing; target: { kind: string; id: string } }[]
  poiGlyphs: Record<string, string>
  propCells: Record<string, string[]>
  doorCells: Record<string, string>
  rugs: { x0: number; y0: number; x1: number; y1: number }[]
  decor: Record<string, string>
  zoneFloor: Record<string, string>
  zoneLabel: Record<string, string>
  landingFloor: string
}

const FLOORS: FloorPack[] = [
  {
    id: 'floor_03',
    art: FLOOR_3_ART,
    arrival: FLOOR_3_ARRIVAL,
    respawn: FLOOR_3_DEFEAT_RESPAWN,
    solid: FLOOR_3_SOLID_GLYPHS,
    glyphAt: floor3GlyphAt,
    isSolid: floor3IsSolid,
    npcGlyph: FLOOR_3_NPC_GLYPH,
    npcTile: FLOOR_3_NPC_TILE,
    npcSight: FLOOR_3_NPC_SIGHT,
    spots: FLOOR_3_INTERACT_SPOTS,
    poiGlyphs: FLOOR_3_POI_GLYPHS,
    propCells: FLOOR_3_PROP_CELLS,
    doorCells: FLOOR_3_DOOR_CELLS,
    rugs: FLOOR_3_RUGS,
    decor: FLOOR_3_WALL_DECOR,
    zoneFloor: FLOOR_3_ZONE_FLOOR,
    zoneLabel: FLOOR_3_ZONE_LABEL,
    landingFloor: 'floor_elevator',
  },
  {
    id: 'floor_04',
    art: FLOOR_4_ART,
    arrival: FLOOR_4_ARRIVAL,
    respawn: FLOOR_4_DEFEAT_RESPAWN,
    solid: FLOOR_4_SOLID_GLYPHS,
    glyphAt: floor4GlyphAt,
    isSolid: floor4IsSolid,
    npcGlyph: FLOOR_4_NPC_GLYPH,
    npcTile: FLOOR_4_NPC_TILE,
    npcSight: FLOOR_4_NPC_SIGHT,
    spots: FLOOR_4_INTERACT_SPOTS,
    poiGlyphs: FLOOR_4_POI_GLYPHS,
    propCells: FLOOR_4_PROP_CELLS,
    doorCells: FLOOR_4_DOOR_CELLS,
    rugs: FLOOR_4_RUGS,
    decor: FLOOR_4_WALL_DECOR,
    zoneFloor: FLOOR_4_ZONE_FLOOR,
    zoneLabel: FLOOR_4_ZONE_LABEL,
    landingFloor: 'floor_elevator',
  },
  {
    id: 'floor_05',
    art: FLOOR_5_ART,
    arrival: FLOOR_5_ARRIVAL,
    respawn: FLOOR_5_DEFEAT_RESPAWN,
    solid: FLOOR_5_SOLID_GLYPHS,
    glyphAt: floor5GlyphAt,
    isSolid: floor5IsSolid,
    npcGlyph: FLOOR_5_NPC_GLYPH,
    npcTile: FLOOR_5_NPC_TILE,
    npcSight: FLOOR_5_NPC_SIGHT,
    spots: FLOOR_5_INTERACT_SPOTS,
    poiGlyphs: FLOOR_5_POI_GLYPHS,
    propCells: FLOOR_5_PROP_CELLS,
    doorCells: FLOOR_5_DOOR_CELLS,
    rugs: FLOOR_5_RUGS,
    decor: FLOOR_5_WALL_DECOR,
    zoneFloor: FLOOR_5_ZONE_FLOOR,
    zoneLabel: FLOOR_5_ZONE_LABEL,
    landingFloor: 'floor_elevator',
  },
]

function walkable(pack: FloorPack, x: number, y: number) {
  return x > 0 && y > 0 && x < W - 1 && y < H - 1 && !pack.isSolid(x, y)
}

function reachable(pack: FloorPack): Set<string> {
  const seen = new Set<string>()
  const queue = [[pack.arrival.x, pack.arrival.y]]
  while (queue.length) {
    const [x, y] = queue.shift()!
    const key = `${x},${y}`
    if (seen.has(key) || !walkable(pack, x, y)) continue
    seen.add(key)
    for (const d of Object.values(DELTA)) queue.push([x + d.x, y + d.y])
  }
  return seen
}

for (const pack of FLOORS) {
  describe(`${pack.id} map — frame and glyphs`, () => {
    it('is 24×18 with a solid border, like Floor 1', () => {
      expect(pack.art).toHaveLength(H)
      for (const row of pack.art) expect(row).toHaveLength(W)
      for (let x = 0; x < W; x++) {
        expect(pack.glyphAt(x, 0)).toBe('#')
        expect(pack.glyphAt(x, H - 1)).toBe('#')
      }
      for (let y = 0; y < H; y++) {
        expect(pack.glyphAt(0, y)).toBe('#')
        expect(pack.glyphAt(W - 1, y)).toBe('#')
      }
    })

    it('uses only glyphs the legend knows', () => {
      const known = new Set([...pack.solid, '.', 'D', '@'])
      for (const row of pack.art) for (const g of row) expect(known, g).toContain(g)
      expect(pack.art.join('').split('@').length - 1).toBe(1)
      expect(pack.art[pack.arrival.y][pack.arrival.x]).toBe('@')
    })

    it('shares the elevator shaft with Floor 1 and arrives at the same tile', () => {
      for (const [x, y] of [
        [2, 1],
        [3, 1],
        [4, 1],
      ]) {
        expect(pack.glyphAt(x, y)).toBe(glyphAt(x, y))
      }
      expect(pack.arrival).toEqual(POST_CELEBRATION)
    })
  })

  describe(`${pack.id} map — reachability`, () => {
    const seen = reachable(pack)

    it('reaches every walkable tile from the elevator', () => {
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          if (walkable(pack, x, y)) expect(seen.has(`${x},${y}`), `(${x},${y})`).toBe(true)
        }
      }
    })

    it('places the respawn on reachable floor facing the coffee machine', () => {
      expect(seen.has(`${pack.respawn.x},${pack.respawn.y}`)).toBe(true)
      expect(pack.glyphAt(pack.respawn.x, pack.respawn.y - 1)).toBe('K')
    })

    it('every doorway is a D with walls on two opposite sides', () => {
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (pack.glyphAt(x, y) !== 'D') continue
          const n = pack.glyphAt(x, y - 1) === '#'
          const s = pack.glyphAt(x, y + 1) === '#'
          const e = pack.glyphAt(x + 1, y) === '#'
          const w = pack.glyphAt(x - 1, y) === '#'
          expect((n && s && !e && !w) || (e && w && !n && !s), `door (${x},${y})`).toBe(true)
          const cell = pack.doorCells[`${x},${y}`]
          expect(cell, `door cell (${x},${y})`).toBe(n && s ? 'door_v_single' : 'door_h')
          inAtlas(cell)
        }
      }
    })
  })

  describe(`${pack.id} map — people and props`, () => {
    const seen = reachable(pack)

    it('stands every NPC on their glyph, facing the way the sightline runs', () => {
      for (const [id, tile] of Object.entries(pack.npcTile)) {
        expect(pack.glyphAt(tile.x, tile.y)).toBe(pack.npcGlyph[id])
        const sight = pack.npcSight[id]
        expect(sight.length).toBeLessThanOrEqual(3)
        sight.forEach((t, i) => {
          expect(t).toEqual({
            x: tile.x + DELTA[tile.facing].x * (i + 1),
            y: tile.y + DELTA[tile.facing].y * (i + 1),
          })
          expect(seen.has(`${t.x},${t.y}`), `${id} sightline ${t.x},${t.y}`).toBe(true)
        })
      }
      const all = pack.art.join('')
      for (const g of Object.values(pack.npcGlyph)) {
        expect(all.split(g).length - 1, g).toBe(1)
      }
    })

    it('every interaction spot is reachable floor facing the tile it names', () => {
      for (const spot of pack.spots) {
        expect(seen.has(`${spot.x},${spot.y}`), `${spot.target.id} @ ${spot.x},${spot.y}`).toBe(
          true,
        )
        const ahead = { x: spot.x + DELTA[spot.facing].x, y: spot.y + DELTA[spot.facing].y }
        const g = pack.glyphAt(ahead.x, ahead.y)
        if (spot.target.kind === 'npc') {
          expect(g, `${spot.target.id} from ${spot.x},${spot.y}`).toBe(
            pack.npcGlyph[spot.target.id],
          )
        } else {
          expect(pack.poiGlyphs[spot.target.id], spot.target.id).toContain(g)
        }
      }
    })

    it('gives every NPC and listed POI at least one interaction spot', () => {
      const targets = new Set(pack.spots.map((s) => s.target.id))
      for (const id of Object.keys(pack.npcTile)) expect(targets).toContain(id)
      for (const id of Object.keys(pack.poiGlyphs)) expect(targets, id).toContain(id)
    })

    it('has art for every prop glyph on the map', () => {
      const npcSet = new Set(Object.values(pack.npcGlyph))
      const glyphs = new Set(
        pack.art
          .join('')
          .replace(/[#.D@]/g, '')
          .split(''),
      )
      for (const g of glyphs) {
        if (npcSet.has(g)) continue
        expect(pack.propCells[g], `prop glyph ${g}`).toBeDefined()
        for (const name of pack.propCells[g]) inAtlas(name)
      }
    })
  })

  describe(`${pack.id} map — zones, rugs and decor`, () => {
    it('names every zone and gives it a floor cell', () => {
      for (const zone of Object.keys(pack.zoneLabel)) {
        expect(pack.zoneLabel[zone].length).toBeGreaterThan(0)
        inAtlas(pack.zoneFloor[zone])
      }
      expect(pack.zoneFloor.zone_landing).toBe(pack.landingFloor)
    })

    it('lays rugs only on non-walls and hangs decor on visible wall faces', () => {
      for (const r of pack.rugs) {
        for (let y = r.y0; y <= r.y1; y++) {
          for (let x = r.x0; x <= r.x1; x++) {
            expect(pack.glyphAt(x, y) === '#', `rug on wall ${x},${y}`).toBe(false)
          }
        }
      }
      for (const [key, name] of Object.entries(pack.decor)) {
        const [x, y] = key.split(',').map(Number)
        expect(pack.glyphAt(x, y), `decor ${key} on a wall`).toBe('#')
        expect(pack.glyphAt(x, y + 1) !== '#', `decor ${key} faces open floor`).toBe(true)
        inAtlas(name)
      }
    })
  })
}

describe('Floors 3–5 — shared plate', () => {
  it('keeps take-five on the same tiles so the machine is always the machine', () => {
    expect(floor3GlyphAt(4, 11)).toBe('K')
    expect(floor4GlyphAt(4, 11)).toBe('K')
    expect(floor5GlyphAt(4, 11)).toBe('K')
    expect(floor3ZoneAt(3, 2)).toBe('zone_landing')
    expect(floor4ZoneAt(3, 2)).toBe('zone_landing')
    expect(floor5ZoneAt(3, 2)).toBe('zone_landing')
  })

  it('paints Product / Sales / Exec halls from distinct department floors', () => {
    expect(FLOOR_3_ZONE_FLOOR.zone_hall_f3).toBe('floor_product')
    expect(FLOOR_4_ZONE_FLOOR.zone_hall_f4).toBe('floor_pipeline')
    expect(FLOOR_5_ZONE_FLOOR.zone_hall_f5).toBe('floor_director')
    expect(
      new Set([
        FLOOR_3_ZONE_FLOOR.zone_hall_f3,
        FLOOR_4_ZONE_FLOOR.zone_hall_f4,
        FLOOR_5_ZONE_FLOOR.zone_hall_f5,
      ]).size,
    ).toBe(3)
    expect(FLOOR_3_ZONE_ACCENT.zone_hall_f3).not.toBe(FLOOR_4_ZONE_ACCENT.zone_hall_f4)
    expect(FLOOR_4_ZONE_ACCENT.zone_hall_f4).not.toBe(FLOOR_5_ZONE_ACCENT.zone_hall_f5)
    expect(FLOOR_3_ZONE_ACCENT.zone_hall_f3).not.toBe('#8b98a8')
    expect(FLOOR_4_ZONE_ACCENT.zone_hall_f4).not.toBe('#8b98a8')
    expect(FLOOR_5_ZONE_ACCENT.zone_hall_f5).not.toBe('#8b98a8')
    const hallRug = (rugs: typeof FLOOR_3_RUGS) => rugs.find((r) => r.x0 === 1 && r.x1 === 21)
    expect(hallRug(FLOOR_3_RUGS)).toMatchObject({ y0: 8, y1: 8, kind: 'navy' })
    expect(hallRug(FLOOR_4_RUGS)).toMatchObject({ y0: 7, y1: 8, kind: 'gold' })
    expect(hallRug(FLOOR_5_RUGS)).toMatchObject({ y0: 7, y1: 8, kind: 'red' })
  })
})

const IDLE: TileStates = {
  printer: 'error',
  cabinetOpen: false,
  counterSteaming: false,
  vendingLit: false,
  readerGreen: false,
  elevatorOpen: false,
}

describe('Floors 3–5 — renderer atlas coverage', () => {
  for (const id of ['floor_03', 'floor_04', 'floor_05'] as const) {
    it(`paints ${id} from atlas cells only`, () => {
      for (const cell of floorCells(id)) {
        expect(cell.layers.length).toBeGreaterThan(0)
        for (const sprite of cell.layers) inAtlas(sprite.name)
      }
      for (const cell of propCells(IDLE, id)) inAtlas(cell.sprite.name)
    })
  }
})
