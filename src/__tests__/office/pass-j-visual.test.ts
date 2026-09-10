import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { FLOOR_5_WALL_DECOR, FLOOR_2_WALL_DECOR, SPEAKER_SPRITE } from '@/content/office'
import {
  TILE_ATLAS,
  TILE_CELL_H,
  TILE_PAD,
  TILE_STRIDE_X,
  TILE_STRIDE_Y,
} from '@/screens/office/tileAtlas'
import { PRESENTATION_SIGNOFF } from '@/screens/office/presentation'
import { DEFAULT_HEADSHOT_FOCAL, headshotFocal, headshotPlacement } from '@/sprites'

/**
 * Pass J visual guards — the promoted Should residuals:
 *   1. F1–2 house plates recast to the F3–5 bar: Office-only 512s keyed by
 *      speaker (`renata` … `kessler`), Classic enemy files bit-identical, and
 *      the house focals pinned into the named-plate band. (The earlier Pass J
 *      crop nudges on `vp` / `recruiter` are superseded — those keys are
 *      Classic-only now.)
 *   2. Sloane’s OverworldActor matches her portrait (no tie).
 *   3. CALDWELL nameplate spans two cells and never slices a glyph at the
 *      boardroom camera edge.
 *   4. F2 HELP DESK sign stacks its two words in one cell with a complete
 *      frame (it was a 35px plate in a 32px cell), and the seven-glyph room
 *      signs get the frame column they hung past the left edge.
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
const PAPER: Rgba = [242, 244, 246, 255]

/** Sheet-pixel origin of an atlas cell (skips the 1px extruded border). */
function cellOrigin(name: keyof typeof TILE_ATLAS) {
  const [col, row] = TILE_ATLAS[name]
  return { x: col * TILE_STRIDE_X + TILE_PAD, y: row * TILE_STRIDE_Y + TILE_PAD }
}

const HOUSE = ['renata', 'gavin', 'priya', 'holloway', 'teddy', 'whitlock', 'kessler'] as const
const NAMED = [
  'sloane',
  'nico',
  'quincy',
  'harper',
  'reyes',
  'ashford',
  'marlowe',
  'caldwell',
] as const

/** The Classic enemy plates Office used to borrow for F1–2. Classic still
 *  renders them; the recast must leave every byte alone. */
const CLASSIC_PLATES: Record<string, string> = {
  recruiter: '20a9fc76f1abeb4abd88dcac00cd88a91f5acf673a221ebf047ec49b24eedf85',
  overachiever: '82d2fedc6854c836c9956b9e3205b3b7cbe7a41efbcc7d1b3f4fce9d61c11716',
  scrum: 'beb31d3c33d392b9ed068e9c24ccbeddc22fb627b35bcd941ec886ac7e45a847',
  manager: 'b686cd60689d99e4d62ad74f69ca916b5d995cb418ee6f3012c68aa84ce7d00c',
  intern: '15910acc492aebcc34c4064f50ea014485f2c39fea00f22e57ff256a475b18a8',
  boss: '90c5ed9c410129e7346508d43e816c300bddc3197a9ef38e0a4d6a0e3b40199d',
  vp: 'e9f0fc37a27ac578e631b57aacf63ba17faeeb622e09fa22138033890567eb49',
}

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex')

/** Minimal RIFF/VP8X reader: canvas size + alpha flag of a WebP. */
function webpInfo(buf: Buffer): { w: number; h: number; alpha: boolean } {
  expect(buf.toString('latin1', 0, 4)).toBe('RIFF')
  expect(buf.toString('latin1', 8, 12)).toBe('WEBP')
  expect(buf.toString('latin1', 12, 16), 'extended WebP (VP8X)').toBe('VP8X')
  const flags = buf[20]
  const w = 1 + buf.readUIntLE(24, 3)
  const h = 1 + buf.readUIntLE(27, 3)
  return { w, h, alpha: (flags & 0x10) !== 0 }
}

describe('Pass J — F1–2 house plates recast to the F3–5 bar', () => {
  it('keys every house speaker onto its own Office-only 512 plate', () => {
    for (const id of HOUSE) {
      expect(SPEAKER_SPRITE[id]).toBe(id)
      const buf = repoFile('src', 'assets', 'characters', 'npcs', `${id}.webp`)
      const info = webpInfo(buf)
      expect(info, id).toEqual({ w: 512, h: 512, alpha: true })
      expect(Object.values(CLASSIC_PLATES), `${id} is a Classic file`).not.toContain(sha256(buf))
    }
  })

  it('leaves the Classic enemy plates bit-identical', () => {
    for (const [id, hash] of Object.entries(CLASSIC_PLATES)) {
      const buf = repoFile('src', 'assets', 'characters', 'npcs', `${id}.webp`)
      expect(sha256(buf), id).toBe(hash)
    }
  })

  it('pins the house focals into the named-plate band (eyes upper third, zoom 3.1–3.4)', () => {
    const namedZoom = NAMED.map((id) => headshotFocal(id).zoom)
    const namedY = NAMED.map((id) => headshotFocal(id).y)
    for (const id of HOUSE) {
      const f = headshotFocal(id)
      expect(f, id).not.toEqual(DEFAULT_HEADSHOT_FOCAL)
      // Every recast figure stands centred on its plate — no more right-third
      // Kessler or handset-heavy Renata pins.
      expect(f.x, `${id} x`).toBeGreaterThanOrEqual(0.44)
      expect(f.x, `${id} x`).toBeLessThanOrEqual(0.52)
      expect(f.zoom, `${id} zoom`).toBeGreaterThanOrEqual(Math.min(...namedZoom))
      expect(f.zoom, `${id} zoom`).toBeLessThanOrEqual(Math.max(...namedZoom))
      // Eye line lands in the upper third of the badge at every size.
      expect(f.y, `${id} y`).toBeGreaterThanOrEqual(Math.min(...namedY))
      expect(f.y, `${id} y`).toBeLessThanOrEqual(0.14)
    }
    expect(headshotFocal('renata')).toEqual({ x: 0.49, y: 0.14, zoom: 3.15 })
    expect(headshotFocal('kessler')).toEqual({ x: 0.495, y: 0.118, zoom: 3.35 })
  })

  it('keeps every house crop inside the plate at badge sizes', () => {
    for (const id of HOUSE) {
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

  it('ships the plate pipeline with a brief per speaker and the walk-sheet carriers', () => {
    const src = readFileSync(join(process.cwd(), 'scripts', 'gen_office_plates.py'), 'utf8')
    for (const id of HOUSE) {
      expect(src, id).toMatch(new RegExp(`'${id}': \\('${id.toUpperCase()}', '\\w+'\\)`))
      // One CHARACTER entry and one POSE entry per speaker.
      expect(src.match(new RegExp(`'${id}': \\(\\n`, 'g'))?.length, `${id} brief`).toBe(2)
    }
    for (const cmd of ['brief', 'import', 'check']) expect(src).toContain(`'${cmd}'`)
    expect(src).toContain("actor.pal['H']")
    // Pose-energy pass: the shared pose contract keeps props under the
    // shoulder line so nothing lands on the Headshot rim.
    expect(src).toContain('POSE_ANCHOR')
    expect(src).toContain('BELOW the shoulder line')
    expect(PRESENTATION_SIGNOFF.section19.some((row) => row.includes('Pass J house plates'))).toBe(
      true,
    )
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

describe('Pass J — F2 HELP DESK sign frames inside one cell', () => {
  const G = TILE_CELL_H - 32
  // Stacked plaque geometry from `sign_stacked('HELP', 'DESK')`: frame x 5–25,
  // y 9–26; HELP on rows 12–16, DESK on rows 19–23.
  const FRAME = { x0: 5, x1: 25, y0: 9, y1: 26 }
  const LINES = [
    [12, 16],
    [19, 23],
  ] as const

  it('keeps the single cell at its index, hung at (7,0) — no two-cell pair', () => {
    expect(TILE_ATLAS.sign_helpdesk).toEqual([7, 16])
    expect(FLOOR_2_WALL_DECOR['7,0']).toBe('sign_helpdesk')
    expect('sign_helpdesk_l' in TILE_ATLAS).toBe(false)
    expect('sign_helpdesk_r' in TILE_ATLAS).toBe(false)
  })

  it('stacks HELP / DESK with a complete ink frame and clear wall on every side', () => {
    const sheet = decodePng(repoFile('public', 'office', 'tiles.png'))
    const s = cellOrigin('sign_helpdesk')
    const at = (x: number, y: number) => sheet.at(s.x + x, s.y + G + y)
    for (let x = FRAME.x0; x <= FRAME.x1; x++) {
      expect(same(at(x, FRAME.y0), INK), `top frame x${x}`).toBe(true)
      expect(same(at(x, FRAME.y1), INK), `bottom frame x${x}`).toBe(true)
    }
    for (let y = FRAME.y0; y <= FRAME.y1; y++) {
      expect(same(at(FRAME.x0, y), INK), `left frame y${y}`).toBe(true)
      expect(same(at(FRAME.x1, y), INK), `right frame y${y}`).toBe(true)
    }
    // The old plate ran off both cell edges; the plaque now never touches one.
    for (let y = -G; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const outside = x < FRAME.x0 || x > FRAME.x1 || y < FRAME.y0 || y > FRAME.y1
        if (outside) expect(at(x, y)[3], `transparent at ${x},${y}`).toBe(0)
      }
    }
  })

  it('prints both words in paper caps, one per line, inside the margins', () => {
    const sheet = decodePng(repoFile('public', 'office', 'tiles.png'))
    const s = cellOrigin('sign_helpdesk')
    const paperRow = (y: number) => {
      let n = 0
      for (let x = 0; x < 32; x++) if (same(sheet.at(s.x + x, s.y + G + y), PAPER)) n++
      return n
    }
    for (const [top, bottom] of LINES) {
      for (let y = top; y <= bottom; y++) expect(paperRow(y), `glyph row y${y}`).toBeGreaterThan(0)
    }
    // Margins above, between and below the two lines carry no glyph pixels.
    for (const y of [10, 11, 17, 18, 24, 25]) expect(paperRow(y), `margin y${y}`).toBe(0)
    // Letters never touch the frame: one clear column each side of the 15px word.
    for (let y = FRAME.y0; y <= FRAME.y1; y++) {
      for (const x of [FRAME.x0 + 1, FRAME.x1 - 1]) {
        expect(same(sheet.at(s.x + x, s.y + G + y), PAPER), `frame margin ${x},${y}`).toBe(false)
      }
    }
  })

  it('frames the seven-glyph room signs that used to hang past the left edge', () => {
    const sheet = decodePng(repoFile('public', 'office', 'tiles.png'))
    for (const name of ['sign_finance', 'sign_meeting', 'sign_kitchen'] as const) {
      const o = cellOrigin(name)
      for (let y = 12; y <= 22; y++) {
        expect(same(sheet.at(o.x, o.y + G + y), INK), `${name} left frame y${y}`).toBe(true)
        expect(same(sheet.at(o.x + 30, o.y + G + y), INK), `${name} right frame y${y}`).toBe(true)
        expect(sheet.at(o.x + 31, o.y + G + y)[3], `${name} clear column y${y}`).toBe(0)
      }
    }
    // Six-glyph plates keep their two-pixel margins and original footprint.
    const p = cellOrigin('sign_people')
    for (let y = 12; y <= 22; y++) {
      expect(same(sheet.at(p.x + 1, p.y + G + y), INK), `PEOPLE left frame y${y}`).toBe(true)
      expect(same(sheet.at(p.x + 29, p.y + G + y), INK), `PEOPLE right frame y${y}`).toBe(true)
    }
  })

  it('refuses one-line labels the cell cannot frame, in the generator itself', () => {
    const src = readFileSync(join(process.cwd(), 'scripts', 'gen_office_tiles.py'), 'utf8')
    expect(src).toContain("register('sign_helpdesk', sign_stacked('HELP', 'DESK'))")
    expect(src).not.toContain("sign_room('HELPDESK')")
    expect(src).toMatch(/if w \+ 2 > CELL_W:\n\s+raise SystemExit\(/)
    // Every one-line sign the atlas registers fits: ≤ 7 glyphs.
    for (const m of src.matchAll(/sign_room\('([A-Z ]+)'\)/g)) {
      expect(m[1].length, `sign_room(${m[1]})`).toBeLessThanOrEqual(7)
    }
  })
})
