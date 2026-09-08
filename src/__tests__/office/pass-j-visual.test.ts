import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { FLOOR_5_WALL_DECOR, FLOOR_2_WALL_DECOR } from '@/content/office'
import {
  TILE_ATLAS,
  TILE_CELL_H,
  TILE_PAD,
  TILE_STRIDE_X,
  TILE_STRIDE_Y,
} from '@/screens/office/tileAtlas'
import { PRESENTATION_SIGNOFF } from '@/screens/office/presentation'
import { headshotFocal, headshotPlacement } from '@/sprites'

/**
 * Pass J visual guards — the promoted Should residuals:
 *   1. F1–2 house Headshots framed like F3–5 (Kessler’s face was off the badge).
 *   2. Sloane’s OverworldActor matches her portrait (no tie).
 *   3. CALDWELL nameplate spans two cells and never slices a glyph at the
 *      boardroom camera edge.
 *   4. Holloway’s garbled folder text stays outside every Headshot crop.
 * Pixel checks decode the committed PNGs so a regenerated sheet that drifts
 * fails here, not in a playtest.
 */

const repoFile = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts))

type Rgba = readonly [number, number, number, number]

/** Minimal decoder for the 8-bit RGBA, non-interlaced PNGs the generators emit. */
function decodePng(buf: Buffer): { w: number; h: number; at: (x: number, y: number) => Rgba } {
  expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  expect(buf[24], 'bit depth').toBe(8)
  expect(buf[25], 'color type RGBA').toBe(6)
  expect(buf[28], 'non-interlaced').toBe(0)
  const idat: Buffer[] = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('latin1', off + 4, off + 8)
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const bpp = 4
  const stride = w * bpp
  const px = Buffer.alloc(stride * h)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const out = Buffer.alloc(stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? out[i - bpp] : 0
      const b = prev[i]
      const c = i >= bpp ? prev[i - bpp] : 0
      let v = line[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const p = a + b - c
        const pa = Math.abs(p - a)
        const pb = Math.abs(p - b)
        const pc = Math.abs(p - c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[i] = v & 0xff
    }
    out.copy(px, y * stride)
    prev = out
  }
  return {
    w,
    h,
    at: (x, y) => {
      const i = y * stride + x * bpp
      return [px[i], px[i + 1], px[i + 2], px[i + 3]]
    },
  }
}

const same = (a: Rgba, b: Rgba) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
const INK: Rgba = [27, 23, 38, 255]
const STEEL: Rgba = [156, 167, 182, 255]

/** Sheet-pixel origin of an atlas cell (skips the 1px extruded border). */
function cellOrigin(name: keyof typeof TILE_ATLAS) {
  const [col, row] = TILE_ATLAS[name]
  return { x: col * TILE_STRIDE_X + TILE_PAD, y: row * TILE_STRIDE_Y + TILE_PAD }
}

describe('Pass J — F1–2 house Headshots framed like F3–5', () => {
  it('pins Kessler on the right third of vp.webp where his face actually is', () => {
    // The vp plate stands its figure at x≈0.66–0.72; the house x=0.5 pin
    // framed empty background with his ear on the rim.
    const vp = headshotFocal('vp')
    expect(vp.x).toBeGreaterThanOrEqual(0.66)
    expect(vp.x).toBeLessThanOrEqual(0.72)
    expect(vp).toEqual({ x: 0.685, y: 0.105, zoom: 3.25 })
    // Zoom stays in the house band so the badge does not read tighter than
    // the rest of the F1–2 row.
    expect(vp.zoom).toBeGreaterThanOrEqual(3.05)
    expect(vp.zoom).toBeLessThanOrEqual(3.4)
  })

  it('centres Renata on her eyes, not the handset', () => {
    const renata = headshotFocal('recruiter')
    expect(renata).toEqual({ x: 0.47, y: 0.12, zoom: 3.2 })
  })

  it('keeps every house crop inside the plate at badge sizes', () => {
    for (const id of ['recruiter', 'overachiever', 'scrum', 'manager', 'intern', 'boss', 'vp']) {
      const f = headshotFocal(id)
      for (const size of [40, 44, 48, 64]) {
        const p = headshotPlacement(size, f)
        // The plate overhangs left, right and bottom; only the top may show
        // badge background (that is the headroom above the hair).
        expect(p.left, `${id} left @${size}`).toBeLessThanOrEqual(0)
        expect(p.left + p.width, `${id} right @${size}`).toBeGreaterThanOrEqual(size)
        expect(p.top + p.height, `${id} bottom @${size}`).toBeGreaterThanOrEqual(size)
      }
    }
  })

  it('leaves Holloway’s folder text out of every Headshot crop', () => {
    // manager.webp prints garbled type on the folder at y≈0.32–0.39 of the
    // plate. The badge crop is proportional, so the bottom edge of the
    // frame maps to the same plate fraction at every size — it must stay
    // above the folder. Battle shows the full plate (Classic-shared art) and
    // is out of scope for this guard.
    const f = headshotFocal('manager')
    const bottomFraction = f.y + 0.5 / f.zoom
    expect(bottomFraction).toBeLessThan(0.31)
  })
})

describe('Pass J — Sloane OverworldActor matches her portrait', () => {
  it('has no tie on the south idle frame', () => {
    const sheet = decodePng(repoFile('public', 'office', 'actors', 'sloane.png'))
    expect([sheet.w, sheet.h]).toEqual([128, 160])
    const tieBlue: Rgba = [0x3a, 0x6a, 0x8a, 255]
    const tieShadow: Rgba = [0x2a, 0x4a, 0x62, 255]
    const shirt: Rgba = [0xf4, 0xef, 0xe4, 255]
    let shirtPx = 0
    // Torso centre column of frame (0,0): where the 2px tie used to hang.
    for (let y = 16; y <= 23; y++) {
      for (let x = 13; x <= 18; x++) {
        const c = sheet.at(x, y)
        expect(same(c, tieBlue), `tie pixel at ${x},${y}`).toBe(false)
        expect(same(c, tieShadow), `tie shadow at ${x},${y}`).toBe(false)
        if (same(c, shirt)) shirtPx++
      }
    }
    expect(shirtPx).toBeGreaterThan(8)
  })

  it('still carries the clipboard, so the blue was the tie and not the prop', () => {
    const src = readFileSync(join(process.cwd(), 'scripts', 'gen_office_actors.py'), 'utf8')
    const block = src.slice(src.indexOf('# --- Sloane'), src.indexOf('# --- Nico'))
    expect(block).toContain("'z': '#3a6a8a'")
    expect(block).toContain('no tie')
  })
})

describe('Pass J — CALDWELL nameplate spans two cells', () => {
  it('replaces the single cell with an l/r pair hung at (15,9)–(16,9)', () => {
    expect('nameplate_caldwell' in TILE_ATLAS).toBe(false)
    expect(TILE_ATLAS.nameplate_caldwell_l).toBeDefined()
    expect(TILE_ATLAS.nameplate_caldwell_r).toBeDefined()
    expect(FLOOR_5_WALL_DECOR['15,9']).toBe('nameplate_caldwell_l')
    expect(FLOOR_5_WALL_DECOR['16,9']).toBe('nameplate_caldwell_r')
    expect(Object.values(FLOOR_5_WALL_DECOR)).not.toContain('nameplate_caldwell')
  })

  it('hangs the plate from the left cell edge and ends the letters early in the right cell', () => {
    const sheet = decodePng(repoFile('public', 'office', 'tiles.png'))
    const l = cellOrigin('nameplate_caldwell_l')
    const r = cellOrigin('nameplate_caldwell_r')
    const G = TILE_CELL_H - 32 // footprint origin inside the 48px cell
    // Ink frame on the left cell's first column, steel right behind it.
    for (let y = 12; y <= 22; y++)
      expect(same(sheet.at(l.x, l.y + G + y), INK), `frame y${y}`).toBe(true)
    expect(same(sheet.at(l.x + 1, l.y + G + 17), STEEL)).toBe(true)
    // Right cell: the plate closes by x=6, glyph ink stops by x=2, and the
    // rest of the cell is empty. The right edge therefore sits at world
    // x = 16·32 + 6 = 518 ≤ the 13.6-tile viewport edge from (9, y) facing
    // east (80 + 436), so the whole name reads one tile sooner than before.
    let inkRight = -1
    for (let y = 12; y <= 22; y++) {
      for (let x = 0; x < 32; x++) {
        const c = sheet.at(r.x + x, r.y + G + y)
        if (x > 6) expect(c[3], `right cell ${x},${y} transparent`).toBe(0)
        if (same(c, INK) && y >= 15 && y <= 19 && x < 6) inkRight = Math.max(inkRight, x)
      }
    }
    expect(inkRight).toBeGreaterThanOrEqual(0)
    expect(inkRight).toBeLessThanOrEqual(2)
    // Left cell: the 'C' starts after a real margin (x ≥ 3), unlike the old
    // single cell where the letters touched the frame.
    for (let y = 15; y <= 19; y++) {
      for (let x = 1; x <= 3; x++) {
        expect(same(sheet.at(l.x + x, l.y + G + y), INK), `margin ${x},${y}`).toBe(false)
      }
    }
  })
})

describe('Pass J — Floor 1–2 atlas stays put', () => {
  it('keeps F1 / F2 cell indices bit-identical while F5 appends', () => {
    expect(TILE_ATLAS.floor_hall).toEqual([0, 0])
    expect(TILE_ATLAS.street_exit).toEqual([5, 13])
    expect(TILE_ATLAS.btable_f2_r).toEqual([6, 20])
    expect(TILE_ATLAS.floor_war).toEqual([7, 20])
    expect(TILE_ATLAS.nameplate_kessler).toEqual([3, 17])
    expect(FLOOR_2_WALL_DECOR['4,9']).toBe('nameplate_kessler')
  })

  it('gives KESSLER a complete ink frame inside its cell', () => {
    const sheet = decodePng(repoFile('public', 'office', 'tiles.png'))
    const k = cellOrigin('nameplate_kessler')
    const G = TILE_CELL_H - 32
    for (let y = 12; y <= 22; y++) {
      expect(same(sheet.at(k.x, k.y + G + y), INK), `left frame y${y}`).toBe(true)
      expect(same(sheet.at(k.x + 31, k.y + G + y), INK), `right frame y${y}`).toBe(true)
    }
  })

  it('records the pass in the presentation sign-off', () => {
    expect(PRESENTATION_SIGNOFF.section19.some((row) => row.includes('Pass J'))).toBe(true)
  })
})
