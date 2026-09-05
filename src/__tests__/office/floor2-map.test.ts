import { describe, expect, it } from 'vitest'
import { FLOOR_ART, POST_CELEBRATION, glyphAt, type Facing } from '@/content/office'
import {
  FLOOR_2_ARRIVAL,
  FLOOR_2_ART,
  FLOOR_2_DEFEAT_RESPAWN,
  FLOOR_2_DIRECTOR_DOOR,
  FLOOR_2_DOOR_CELLS,
  FLOOR_2_DOOR_STEP_BACK,
  FLOOR_2_DOOR_STEP_IN,
  FLOOR_2_INTERACT_SPOTS,
  FLOOR_2_NPC_GLYPH,
  FLOOR_2_NPC_SIGHT,
  FLOOR_2_NPC_TILE,
  FLOOR_2_POI_GLYPHS,
  FLOOR_2_PROP_CELLS,
  FLOOR_2_RUGS,
  FLOOR_2_SOLID_GLYPHS,
  FLOOR_2_WALL_DECOR,
  FLOOR_2_ZONE_FLOOR,
  FLOOR_2_ZONE_LABEL,
  floor2GlyphAt,
  floor2IsSolid,
  floor2ZoneAt,
  type Floor2NpcId,
  type Floor2ZoneId,
} from '@/content/office/floor2'
import { TILE_ATLAS, type TileName } from '@/screens/office/tileAtlas'

const W = 24
const H = 18

const DELTA: Record<Facing, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
}

function walkable(x: number, y: number) {
  return x > 0 && y > 0 && x < W - 1 && y < H - 1 && !floor2IsSolid(x, y)
}

/** Every tile reachable on foot from the arrival tile. */
function reachable(): Set<string> {
  const seen = new Set<string>()
  const queue = [[FLOOR_2_ARRIVAL.x, FLOOR_2_ARRIVAL.y]]
  while (queue.length) {
    const [x, y] = queue.shift()!
    const key = `${x},${y}`
    if (seen.has(key) || !walkable(x, y)) continue
    seen.add(key)
    for (const d of Object.values(DELTA)) queue.push([x + d.x, y + d.y])
  }
  return seen
}

function inAtlas(name: string) {
  expect(TILE_ATLAS[name as TileName], `atlas cell ${name}`).toBeDefined()
}

describe('Floor 2 map — frame and glyphs', () => {
  it('is 24×18 with a solid border, like Floor 1', () => {
    expect(FLOOR_2_ART).toHaveLength(H)
    for (const row of FLOOR_2_ART) expect(row).toHaveLength(W)
    for (let x = 0; x < W; x++) {
      expect(floor2GlyphAt(x, 0)).toBe('#')
      expect(floor2GlyphAt(x, H - 1)).toBe('#')
    }
    for (let y = 0; y < H; y++) {
      expect(floor2GlyphAt(0, y)).toBe('#')
      expect(floor2GlyphAt(W - 1, y)).toBe('#')
    }
  })

  it('uses only glyphs the legend knows (floor, door, arrival, or a solid)', () => {
    const known = new Set([...FLOOR_2_SOLID_GLYPHS, '.', 'D', '@'])
    for (const row of FLOOR_2_ART) for (const g of row) expect(known, g).toContain(g)
    const arrivals = FLOOR_2_ART.join('').split('@').length - 1
    expect(arrivals).toBe(1)
    expect(FLOOR_2_ART[FLOOR_2_ARRIVAL.y][FLOOR_2_ARRIVAL.x]).toBe('@')
  })

  it('shares the elevator shaft with Floor 1 and arrives where Floor 1 returns', () => {
    for (const [x, y] of [
      [2, 1],
      [3, 1],
      [4, 1],
    ]) {
      expect(floor2GlyphAt(x, y)).toBe(glyphAt(x, y))
    }
    expect(FLOOR_ART[1].slice(1, 5)).toBe('.EER')
    expect(FLOOR_2_ARRIVAL).toEqual(POST_CELEBRATION)
  })
})

describe('Floor 2 map — reachability', () => {
  const seen = reachable()

  it('reaches every walkable tile from the elevator without a locked door', () => {
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        if (walkable(x, y)) expect(seen.has(`${x},${y}`), `(${x},${y})`).toBe(true)
      }
    }
  })

  it('places the respawn and the door step-in/step-back on reachable floor', () => {
    for (const p of [FLOOR_2_DEFEAT_RESPAWN, FLOOR_2_DOOR_STEP_IN, FLOOR_2_DOOR_STEP_BACK]) {
      expect(seen.has(`${p.x},${p.y}`), `${p.x},${p.y}`).toBe(true)
    }
    // The respawn faces the coffee counter, like Floor 1's (19,8).
    expect(floor2GlyphAt(FLOOR_2_DEFEAT_RESPAWN.x, FLOOR_2_DEFEAT_RESPAWN.y - 1)).toBe('K')
    // The director's door is a horizontal-wall doorway between the hall and the office.
    expect(floor2GlyphAt(FLOOR_2_DIRECTOR_DOOR.x, FLOOR_2_DIRECTOR_DOOR.y)).toBe('D')
    expect(FLOOR_2_DOOR_STEP_BACK.y).toBe(FLOOR_2_DIRECTOR_DOOR.y - 1)
    expect(FLOOR_2_DOOR_STEP_IN.y).toBe(FLOOR_2_DIRECTOR_DOOR.y + 1)
  })

  it('every doorway is a D with walls on two opposite sides and floor on the other two', () => {
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (floor2GlyphAt(x, y) !== 'D') continue
        const n = floor2GlyphAt(x, y - 1) === '#'
        const s = floor2GlyphAt(x, y + 1) === '#'
        const e = floor2GlyphAt(x + 1, y) === '#'
        const w = floor2GlyphAt(x - 1, y) === '#'
        expect((n && s && !e && !w) || (e && w && !n && !s), `door (${x},${y})`).toBe(true)
        const cell = FLOOR_2_DOOR_CELLS[`${x},${y}`]
        expect(cell, `door cell (${x},${y})`).toBe(n && s ? 'door_v_single' : 'door_h')
        inAtlas(cell)
      }
    }
    expect(Object.keys(FLOOR_2_DOOR_CELLS)).toHaveLength(8)
  })
})

describe('Floor 2 map — people and props', () => {
  const seen = reachable()

  it('stands every NPC on their glyph, facing the way the sightline runs', () => {
    for (const [id, tile] of Object.entries(FLOOR_2_NPC_TILE) as [
      Floor2NpcId,
      { x: number; y: number; facing: Facing },
    ][]) {
      expect(floor2GlyphAt(tile.x, tile.y)).toBe(FLOOR_2_NPC_GLYPH[id])
      const sight = FLOOR_2_NPC_SIGHT[id]
      expect(sight.length).toBeLessThanOrEqual(3)
      sight.forEach((t, i) => {
        expect(t).toEqual({
          x: tile.x + DELTA[tile.facing].x * (i + 1),
          y: tile.y + DELTA[tile.facing].y * (i + 1),
        })
        expect(seen.has(`${t.x},${t.y}`), `${id} sightline ${t.x},${t.y}`).toBe(true)
      })
    }
    // Each NPC glyph appears exactly once.
    const all = FLOOR_2_ART.join('')
    for (const g of Object.values(FLOOR_2_NPC_GLYPH)) {
      expect(all.split(g).length - 1, g).toBe(1)
    }
  })

  it('every interaction spot is reachable floor facing the tile it names', () => {
    for (const spot of FLOOR_2_INTERACT_SPOTS) {
      expect(seen.has(`${spot.x},${spot.y}`), `${spot.target.id} @ ${spot.x},${spot.y}`).toBe(true)
      const ahead = { x: spot.x + DELTA[spot.facing].x, y: spot.y + DELTA[spot.facing].y }
      const g = floor2GlyphAt(ahead.x, ahead.y)
      if (spot.target.kind === 'npc') {
        expect(g, `${spot.target.id} from ${spot.x},${spot.y}`).toBe(
          FLOOR_2_NPC_GLYPH[spot.target.id],
        )
      } else {
        expect(FLOOR_2_POI_GLYPHS[spot.target.id], spot.target.id).toContain(g)
      }
      expect(spot.target.label.length).toBeGreaterThan(0)
    }
  })

  it('gives every NPC and every listed POI at least one interaction spot', () => {
    const targets = new Set(FLOOR_2_INTERACT_SPOTS.map((s) => s.target.id))
    for (const id of Object.keys(FLOOR_2_NPC_TILE)) expect(targets).toContain(id)
    for (const id of Object.keys(FLOOR_2_POI_GLYPHS)) {
      // The director's door is a step-on trigger, not a faced prompt.
      if (id === 'poi_director_door') continue
      expect(targets, id).toContain(id)
    }
  })

  it('has art for every prop glyph on the map', () => {
    const glyphs = new Set(
      FLOOR_2_ART.join('')
        .replace(/[#.D@]/g, '')
        .split(''),
    )
    for (const g of glyphs) {
      if (/[567]/.test(g)) continue
      expect(FLOOR_2_PROP_CELLS[g], `prop glyph ${g}`).toBeDefined()
      for (const name of FLOOR_2_PROP_CELLS[g]) inAtlas(name)
    }
  })
})

describe('Floor 2 map — zones, floors, rugs and decor', () => {
  it('names and tints every zone and gives it a floor cell', () => {
    for (const zone of Object.keys(FLOOR_2_ZONE_LABEL) as Floor2ZoneId[]) {
      expect(FLOOR_2_ZONE_LABEL[zone].length).toBeGreaterThan(0)
      inAtlas(FLOOR_2_ZONE_FLOOR[zone])
    }
    // Landing reuses the Floor 1 elevator stone so the shaft reads as one place.
    expect(FLOOR_2_ZONE_FLOOR.zone_landing).toBe('floor_elevator')
    expect(FLOOR_2_ZONE_FLOOR.zone_hall_f2).toBe('floor_hall')
  })

  it('assigns rooms to room zones and connectors to the hall', () => {
    expect(floor2ZoneAt(FLOOR_2_ARRIVAL.x, FLOOR_2_ARRIVAL.y)).toBe('zone_landing')
    expect(floor2ZoneAt(9, 3)).toBe('zone_it')
    expect(floor2ZoneAt(18, 4)).toBe('zone_people')
    expect(floor2ZoneAt(3, 13)).toBe('zone_director')
    expect(floor2ZoneAt(11, 11)).toBe('zone_facilities')
    expect(floor2ZoneAt(19, 12)).toBe('zone_finance')
    expect(floor2ZoneAt(12, 7)).toBe('zone_hall_f2')
    for (const key of Object.keys(FLOOR_2_DOOR_CELLS)) {
      const [x, y] = key.split(',').map(Number)
      expect(floor2ZoneAt(x, y), `door ${key}`).toBe('zone_hall_f2')
    }
  })

  it('lays rugs only on floor and hangs decor only on visible wall faces', () => {
    for (const r of FLOOR_2_RUGS) {
      for (let y = r.y0; y <= r.y1; y++) {
        for (let x = r.x0; x <= r.x1; x++) {
          expect(floor2GlyphAt(x, y) === '#', `rug on wall ${x},${y}`).toBe(false)
        }
      }
    }
    for (const [key, name] of Object.entries(FLOOR_2_WALL_DECOR)) {
      const [x, y] = key.split(',').map(Number)
      expect(floor2GlyphAt(x, y), `decor ${key} on a wall`).toBe('#')
      expect(floor2GlyphAt(x, y + 1) !== '#', `decor ${key} faces open floor`).toBe(true)
      inAtlas(name)
    }
    // Rug 9-patch parts the Floor 2 layout needs beyond Floor 1's set.
    for (const name of [
      'rug_gold_l',
      'rug_gold_r',
      'rug_gold_c',
      'rug_navy_tbl',
      'rug_navy_tb',
      'rug_navy_tbr',
    ]) {
      inAtlas(name)
    }
  })
})
