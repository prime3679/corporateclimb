import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MAP_HEIGHT, MAP_WIDTH, glyphAt, isSolid } from '@/content/office'
import {
  TILE_ATLAS,
  TILE_CELL_H,
  TILE_CELL_W,
  TILE_PAD,
  TILE_SHEET_H,
  TILE_SHEET_URL,
  TILE_SHEET_W,
  TILE_STRIDE_X,
  TILE_STRIDE_Y,
  type TileName,
} from '@/screens/office/tileAtlas'
import {
  atlasOffset,
  doorSprite,
  floorCells,
  floorSprites,
  propCells,
  propSprite,
  wallMask,
  type Sprite,
  type TileStates,
} from '@/screens/office/tiles'

function pngSize(buf: Buffer) {
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), colorType: buf[25] }
}

const BASE: TileStates = {
  printer: 'error',
  cabinetOpen: false,
  counterSteaming: false,
  vendingLit: false,
  readerGreen: false,
  elevatorOpen: false,
}

const STATE_VARIANTS: TileStates[] = [
  BASE,
  { ...BASE, printer: 'working' },
  { ...BASE, printer: 'printing', cabinetOpen: true },
  { ...BASE, counterSteaming: true, vendingLit: true },
  { ...BASE, readerGreen: true, elevatorOpen: true },
]

function expectInAtlas(sprite: Sprite) {
  expect(TILE_ATLAS[sprite.name], sprite.name).toBeDefined()
  const [col, row] = TILE_ATLAS[sprite.name]
  expect(col * TILE_STRIDE_X).toBeLessThan(TILE_SHEET_W)
  expect(row * TILE_STRIDE_Y).toBeLessThan(TILE_SHEET_H)
  if (sprite.frames && sprite.frames > 1) {
    // CSS steps through neighbouring cells, so every frame must sit on the same row.
    for (let f = 1; f < sprite.frames; f++) {
      const next = (Object.keys(TILE_ATLAS) as TileName[]).find((n) => {
        const [c, r] = TILE_ATLAS[n]
        return r === row && c === col + f
      })
      expect(next, `${sprite.name} frame ${f}`).toBeTruthy()
      expect(next).toMatch(/_\d+$/)
    }
    expect(sprite.periodMs).toBeGreaterThan(0)
  }
}

describe('office tileset sheet', () => {
  it('ships an RGBA sheet whose size matches the generated atlas', () => {
    const buf = readFileSync(resolve(process.cwd(), 'public', TILE_SHEET_URL.replace(/^\//, '')))
    expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
    const { w, h, colorType } = pngSize(buf)
    expect(w).toBe(TILE_SHEET_W)
    expect(h).toBe(TILE_SHEET_H)
    expect(colorType).toBe(6)
    expect(TILE_STRIDE_X).toBe(TILE_CELL_W + 2 * TILE_PAD)
    expect(TILE_STRIDE_Y).toBe(TILE_CELL_H + 2 * TILE_PAD)
    for (const [col, row] of Object.values(TILE_ATLAS)) {
      expect((col + 1) * TILE_STRIDE_X).toBeLessThanOrEqual(w)
      expect((row + 1) * TILE_STRIDE_Y).toBeLessThanOrEqual(h)
    }
  })

  it('reports background offsets that skip the extruded border of each slot', () => {
    for (const name of Object.keys(TILE_ATLAS) as TileName[]) {
      const { bx, by } = atlasOffset(name)
      expect(bx).toBeLessThan(0)
      expect(by).toBeLessThan(0)
      expect((-bx - TILE_PAD) % TILE_STRIDE_X).toBe(0)
      expect((-by - TILE_PAD) % TILE_STRIDE_Y).toBe(0)
    }
  })
})

describe('floor pass', () => {
  it('covers every tile with at least a floor or wall sprite from the atlas', () => {
    const cells = floorCells()
    expect(cells).toHaveLength(MAP_WIDTH * MAP_HEIGHT)
    for (const cell of cells) {
      expect(cell.layers.length).toBeGreaterThan(0)
      for (const sprite of cell.layers) expectInAtlas(sprite)
      const g = glyphAt(cell.x, cell.y)
      if (g === '#' || g === 'X') expect(cell.layers[0].name).toMatch(/^wall_\d+$/)
      else expect(cell.layers[0].name).toMatch(/^(floor|rug)_/)
    }
  })

  it('autotiles walls from their open neighbours', () => {
    expect(wallMask(0, 0)).toBe(0) // map corner: nothing open around it
    expect(wallMask(1, 0) & 4).toBe(4) // north border shows a face toward the lobby
    expect(wallMask(10, 7) & 4).toBe(4) // stub above the desks doorway shows a face
    expect(wallMask(10, 11) & 4).toBe(0) // stub below it is cap-only
    expect(floorSprites(12, 17).map((s) => s.name)).toEqual(['wall_1', 'street_exit'])
  })

  it('keeps every walkable doorway drawn as open floor with a frame', () => {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (glyphAt(x, y) !== 'D') continue
        const names = floorSprites(x, y).map((s) => s.name)
        expect(names[0], `${x},${y}`).toMatch(/^floor_/)
        expect(names[names.length - 1], `${x},${y}`).toMatch(/^door_/)
        expect(isSolid(x, y)).toBe(false)
      }
    }
    // the stacked openings in the x=10 / x=14 walls read as one retracted partition
    expect(doorSprite(10, 8)).toBe('door_v_top')
    expect(doorSprite(10, 9)).toBe('door_v_mid')
    expect(doorSprite(10, 10)).toBe('door_v_bot')
    expect(doorSprite(14, 8)).toBe('door_v_top')
    expect(doorSprite(14, 10)).toBe('door_v_bot')
    // the single door between desks and reception sits in a horizontal wall
    expect(doorSprite(5, 12)).toBe('door_h')
  })

  it('shades floor south and east of walls', () => {
    expect(floorSprites(1, 1).map((s) => s.name)).toContain('shade_n')
    expect(floorSprites(1, 1).map((s) => s.name)).toContain('shade_w')
    expect(floorSprites(5, 3).map((s) => s.name)).not.toContain('shade_n')
  })
})

describe('prop pass', () => {
  it('gives every solid non-wall glyph a prop and no walkable tile one', () => {
    for (const states of STATE_VARIANTS) {
      for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
          const g = glyphAt(x, y)
          const sprite = propSprite(x, y, states)
          const isFurniture = isSolid(x, y) && g !== '#' && g !== 'X' && !/[1-4]/.test(g)
          if (isFurniture) {
            expect(sprite, `${g} at ${x},${y}`).not.toBeNull()
            expectInAtlas(sprite!)
          } else {
            expect(sprite, `${g} at ${x},${y}`).toBeNull()
          }
        }
      }
    }
  })

  it('switches the stateful POIs the engine already exposes', () => {
    const at = (x: number, y: number, s: TileStates) => propSprite(x, y, s)!.name
    expect(at(9, 7, BASE)).toBe('printer_error')
    expect(at(9, 7, { ...BASE, printer: 'working' })).toBe('printer_working')
    expect(at(9, 7, { ...BASE, printer: 'printing' })).toBe('printer_printing_0')
    expect(at(15, 7, BASE)).toBe('cabinet_closed')
    expect(at(15, 7, { ...BASE, cabinetOpen: true })).toBe('cabinet_open')
    expect(at(18, 7, BASE)).toBe('counter_machine')
    expect(at(18, 7, { ...BASE, counterSteaming: true })).toBe('counter_steam_0')
    expect(at(22, 9, BASE)).toBe('vending_idle')
    expect(at(22, 9, { ...BASE, vendingLit: true })).toBe('vending_lit_0')
    expect(at(4, 1, BASE)).toBe('reader_red_0')
    expect(at(4, 1, { ...BASE, readerGreen: true })).toBe('reader_green_0')
    expect(at(2, 1, BASE)).toBe('elev_l_closed')
    expect(at(3, 1, { ...BASE, elevatorOpen: true })).toBe('elev_r_open')
  })

  it('autotiles multi-tile furniture from its neighbours', () => {
    expect(propSprite(7, 15, BASE)!.name).toBe('rdesk_l')
    expect(propSprite(8, 15, BASE)!.name).toBe('rdesk_m')
    expect(propSprite(9, 15, BASE)!.name).toBe('rdesk_r')
    expect(propSprite(2, 8, BASE)!.name).toBe('desk_l_0')
    expect(propSprite(4, 8, BASE)!.name).toBe('desk_r')
    expect(propSprite(17, 2, BASE)!.name).toBe('mtable_tl_agenda')
    expect(propSprite(20, 3, BASE)!.name).toBe('mtable_br')
    expect(propSprite(18, 3, BASE)!.name).toBe('mtable_b')
    expect(propSprite(2, 9, BASE)!.name).toBe('chair_n') // tucked under a desk
    expect(propSprite(2, 16, BASE)!.name).toBe('chair_s') // lobby seating
    expect(propSprite(16, 11, BASE)!.name).toBe('btable_l')
    expect(propSprite(17, 11, BASE)!.name).toBe('btable_r')
  })

  it('lists every prop once with its footprint tile', () => {
    const cells = propCells(BASE)
    expect(cells.length).toBeGreaterThan(40)
    expect(new Set(cells.map((c) => `${c.x},${c.y}`)).size).toBe(cells.length)
  })
})

describe('Pass E contrast + glass openings', () => {
  it('paints F2–5 (6,3) glass as floor plus door_v_single, never a wall', () => {
    for (const id of ['floor_02', 'floor_03', 'floor_04', 'floor_05'] as const) {
      if (id === 'floor_05') {
        const names = floorSprites(6, 3, id).map((s) => s.name)
        expect(names[0]).toMatch(/^floor_/)
        expect(names).toContain('door_v_single')
        expect(names[0]).not.toMatch(/^wall_/)
        continue
      }
      for (const x of [6, 14]) {
        const names = floorSprites(x, 3, id).map((s) => s.name)
        expect(names[0], `${id} (${x},3)`).toMatch(/^floor_/)
        expect(names, `${id} (${x},3)`).toContain('door_v_single')
        expect(names[0], `${id} (${x},3)`).not.toMatch(/^wall_/)
      }
    }
  })

  it('registers distinct Product / Sales / Exec / hall cells', () => {
    for (const name of [
      'floor_product',
      'floor_sales',
      'floor_board',
      'floor_ante',
      'floor_hall_f3',
      'floor_hall_f4',
      'floor_hall_f5',
      'floor_hall',
    ] as const) {
      expect(TILE_ATLAS[name], name).toBeDefined()
    }
    const keys = [
      TILE_ATLAS.floor_product,
      TILE_ATLAS.floor_sales,
      TILE_ATLAS.floor_board,
      TILE_ATLAS.floor_hall,
      TILE_ATLAS.floor_hall_f3,
      TILE_ATLAS.floor_hall_f4,
      TILE_ATLAS.floor_hall_f5,
    ].map(([c, r]) => `${c},${r}`)
    expect(new Set(keys).size).toBe(keys.length)
  })
})
