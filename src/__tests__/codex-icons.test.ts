import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ALL_PERK_IDS, ALL_RELIC_IDS, PERKS, RELICS } from '@/data'
import CodexScreen from '@/screens/CodexScreen'
import { PixelIcon, hasPixelIcon } from '@/ui'
import {
  ICON_ATLAS,
  ICON_CELL,
  ICON_PAD,
  ICON_SHEET_H,
  ICON_SHEET_W,
  ICON_STRIDE,
} from '@/ui/iconAtlas'

/**
 * The Codex icon family (`scripts/gen_office_icons.py` → `public/office/icons.png`
 * + `src/ui/iconAtlas.ts`): one hand-authored pixel glyph per perk and Status
 * Symbol plus the shared `locked` padlock. These guards decode the committed
 * sheet so a regenerated PNG that drifts from the atlas, leaks into a
 * neighbour's cell, or picks up anti-aliasing fails here rather than in a
 * playtest — and the Codex must draw the family, not the content emoji.
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

const INK: Rgba = [27, 23, 38, 255]
const same = (a: Rgba, b: Rgba) => a.every((v, i) => v === b[i])

const sheet = decodePng(repoFile('public', 'office', 'icons.png'))
const names = Object.keys(ICON_ATLAS) as (keyof typeof ICON_ATLAS)[]

describe('Codex icon atlas', () => {
  it('has one cell per perk, per Status Symbol, and the locked padlock', () => {
    for (const id of ALL_PERK_IDS) expect(hasPixelIcon(id), id).toBe(true)
    for (const id of ALL_RELIC_IDS) expect(hasPixelIcon(id), id).toBe(true)
    expect(hasPixelIcon('locked')).toBe(true)
    expect(names).toHaveLength(ALL_PERK_IDS.length + ALL_RELIC_IDS.length + 1)
  })

  it('matches the committed sheet dimensions and keeps every cell inside it', () => {
    expect(ICON_STRIDE).toBe(ICON_CELL + 2 * ICON_PAD)
    expect([sheet.w, sheet.h]).toEqual([ICON_SHEET_W, ICON_SHEET_H])
    for (const name of names) {
      const [col, row] = ICON_ATLAS[name]
      expect((col + 1) * ICON_STRIDE, name).toBeLessThanOrEqual(sheet.w)
      expect((row + 1) * ICON_STRIDE, name).toBeLessThanOrEqual(sheet.h)
    }
  })

  it('draws every glyph with a plum ink outline, no anti-aliasing, and a clear gutter', () => {
    for (const name of names) {
      const [col, row] = ICON_ATLAS[name]
      const x0 = col * ICON_STRIDE
      const y0 = row * ICON_STRIDE
      let body = 0
      let ink = 0
      for (let y = 0; y < ICON_STRIDE; y++) {
        for (let x = 0; x < ICON_STRIDE; x++) {
          const px = sheet.at(x0 + x, y0 + y)
          const gutter =
            x < ICON_PAD ||
            y < ICON_PAD ||
            x >= ICON_STRIDE - ICON_PAD ||
            y >= ICON_STRIDE - ICON_PAD
          if (gutter) {
            expect(px[3], `${name} gutter (${x},${y})`).toBe(0)
            continue
          }
          expect([0, 255], `${name} alpha (${x},${y})`).toContain(px[3])
          if (px[3] === 0) continue
          body++
          if (same(px, INK)) ink++
        }
      }
      expect(body, `${name} body`).toBeGreaterThan(24)
      expect(ink, `${name} ink outline`).toBeGreaterThan(12)
    }
  })
})

describe('PixelIcon', () => {
  it('positions the atlas cell through custom properties at an integer scale', () => {
    const [col, row] = ICON_ATLAS.executive_presence
    const html = renderToStaticMarkup(createElement(PixelIcon, { name: 'executive_presence' }))
    expect(html).toContain('data-icon="executive_presence"')
    expect(html).toContain('aria-hidden="true"')
    expect(html).toContain(`--pi-size:${ICON_CELL * 2}px`)
    expect(html).toContain(`--pi-x:${-(ICON_PAD + col * ICON_STRIDE) * 2}px`)
    expect(html).toContain(`--pi-y:${-(ICON_PAD + row * ICON_STRIDE) * 2}px`)
    expect(html).toContain('--pi-url:url(/office/icons.png)')
  })
})

describe('CodexScreen', () => {
  it('renders perks and Status Symbols from the icon family, never their emoji', () => {
    const html = renderToStaticMarkup(createElement(CodexScreen, { onBack: () => {} }))
    const dataIcons = [...html.matchAll(/data-icon="([a-z_]+)"/g)].map((m) => m[1])
    // Base-pool entries show their own glyph; gated ones the shared padlock.
    for (const id of ALL_PERK_IDS) {
      expect(dataIcons, id).toContain(PERKS[id].unlockedBy ? 'locked' : id)
    }
    for (const id of ALL_RELIC_IDS) {
      expect(dataIcons, id).toContain(RELICS[id].unlockedBy ? 'locked' : id)
    }
    expect(dataIcons.filter((n) => n !== 'locked').length).toBe(
      ALL_PERK_IDS.filter((id) => !PERKS[id].unlockedBy).length +
        ALL_RELIC_IDS.filter((id) => !RELICS[id].unlockedBy).length,
    )
    // The costume-display face that used to front Executive Presence is gone.
    expect(html).not.toContain(PERKS.executive_presence.icon)
  })
})
