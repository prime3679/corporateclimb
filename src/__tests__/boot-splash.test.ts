import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { BOOT_COLOR } from '@/platform/native'

/**
 * Boot color chain + native splash guards.
 *
 * A cold native launch walks LaunchScreen storyboard → SplashScreen plugin →
 * WKWebView background → html/body/#root → .boot-splash → Stage. Every link
 * must be frame black (`--cc-bg`), or the launch shows a color step. The
 * Capacitor CLI loads capacitor.config.ts outside Vite, so the value is
 * mirrored as literals rather than imported; this file is what keeps the
 * mirrors honest. The splash PNG is decoded so a regenerated asset that
 * drifts (wrong size, hero outside the aspect-fill crop, background off)
 * fails here instead of on a Simulator.
 */

const repoFile = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts))
const repoText = (...parts: string[]) => repoFile(...parts).toString('utf8')

const HEX = /#[0-9a-f]{6}\b/gi
const LEGACY_SHADES = ['#0f172a', '#263238']

describe('boot color chain', () => {
  it('is the frame black token', () => {
    expect(BOOT_COLOR).toBe('#06080c')
    expect(repoText('src/ui/tokens.css')).toMatch(new RegExp(`--cc-bg:\\s*${BOOT_COLOR};`))
  })

  it('capacitor.config.ts routes every color through the boot color', () => {
    const src = repoText('capacitor.config.ts')
    expect(src).toContain(`const BOOT_COLOR = '${BOOT_COLOR}'`)
    const hexes = src.match(HEX) ?? []
    expect(hexes.every((h) => h.toLowerCase() === BOOT_COLOR)).toBe(true)
    // Overlay bar + no UIKit inset: the CSS safe-area padding is the only inset.
    expect(src).toMatch(/overlaysWebView:\s*true/)
    expect(src).toMatch(/contentInset:\s*'never'/)
  })

  it('index.html paints the void, theme-color, and boot splash in the boot color', () => {
    const html = repoText('index.html')
    expect(html).toContain(`<meta name="theme-color" content="${BOOT_COLOR}" />`)
    const rootRule = html.match(/html,\s*body,\s*#root\s*\{[^}]*\}/)?.[0]
    expect(rootRule).toBeDefined()
    expect(rootRule).toContain(`background: ${BOOT_COLOR};`)
    const splashRule = html.match(/\.boot-splash\s*\{[^}]*\}/)?.[0]
    expect(splashRule).toBeDefined()
    expect(splashRule).toContain(`background: ${BOOT_COLOR};`)
    for (const shade of LEGACY_SHADES) expect(html.toLowerCase()).not.toContain(shade)
  })

  it('the PWA manifest agrees', () => {
    const manifest = JSON.parse(repoText('public/manifest.webmanifest')) as {
      background_color: string
      theme_color: string
    }
    expect(manifest.background_color).toBe(BOOT_COLOR)
    expect(manifest.theme_color).toBe(BOOT_COLOR)
  })

  it('the splash generator mirrors the boot color', () => {
    expect(repoText('scripts/gen-splash.mjs')).toContain(`const BOOT_COLOR = '${BOOT_COLOR}'`)
  })
})

type Rgb = readonly [number, number, number]

/** Minimal decoder for 8-bit RGB / RGBA non-interlaced PNGs (what Chromium writes). */
function decodePng(buf: Buffer): { w: number; h: number; at: (x: number, y: number) => Rgb } {
  expect(buf.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))).toBe(true)
  const w = buf.readUInt32BE(16)
  const h = buf.readUInt32BE(20)
  expect(buf[24], 'bit depth').toBe(8)
  const colorType = buf[25]
  expect([2, 6], 'RGB or RGBA').toContain(colorType)
  expect(buf[28], 'non-interlaced').toBe(0)
  const bpp = colorType === 6 ? 4 : 3
  const idat: Buffer[] = []
  let off = 8
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('latin1', off + 4, off + 8)
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len))
    off += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = w * bpp
  const px = Buffer.alloc(stride * h)
  let prev = Buffer.alloc(stride)
  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1))
    const out = px.subarray(y * stride, (y + 1) * stride)
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
    prev = out
  }
  return {
    w,
    h,
    at: (x, y) => {
      const i = y * stride + x * bpp
      return [px[i], px[i + 1], px[i + 2]]
    },
  }
}

const hexToRgb = (hex: string): Rgb => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
]
const near = (a: Rgb, b: Rgb, tol = 2) => a.every((v, i) => Math.abs(v - b[i]) <= tol)

describe('resources/splash.png', () => {
  const png = decodePng(repoFile('resources', 'splash.png'))
  const CANVAS = 2732
  const bg = hexToRgb(BOOT_COLOR)

  it('is the 2732² square Capacitor’s Splash.imageset expects', () => {
    expect(png.w).toBe(CANVAS)
    expect(png.h).toBe(CANVAS)
  })

  it('is frame black to every edge (the crop can start anywhere)', () => {
    const edge = CANVAS - 1
    for (const [x, y] of [
      [0, 0],
      [edge, 0],
      [0, edge],
      [edge, edge],
      [CANVAS >> 1, 0],
      [CANVAS >> 1, edge],
      [0, CANVAS >> 1],
      [edge, CANVAS >> 1],
    ] as const) {
      expect(png.at(x, y), `(${x},${y})`).toEqual(bg)
    }
  })

  it('keeps the whole hero inside the narrowest portrait crop and shows gold + wordmark', () => {
    // 16 Pro Max (1320×2868) shows the narrowest band: 1320 / (2868/2732) ≈ 1257 px.
    const SAFE_HALF = 1257 / 2
    let minX = CANVAS
    let maxX = 0
    let minY = CANVAS
    let maxY = 0
    let gold = 0
    let text = 0
    const GOLD = hexToRgb('#ffc107')
    const TEXT = hexToRgb('#f2f6fa')
    for (let y = 0; y < CANVAS; y += 2) {
      for (let x = 0; x < CANVAS; x += 2) {
        const p = png.at(x, y)
        if (near(p, bg, 6)) continue
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
        if (near(p, GOLD, 4)) gold++
        if (near(p, TEXT, 4)) text++
      }
    }
    const mid = CANVAS / 2
    expect(minX).toBeGreaterThan(mid - SAFE_HALF)
    expect(maxX).toBeLessThan(mid + SAFE_HALF)
    // Hero sits on the canvas center: the storyboard centers the image on the
    // screen, so an off-center hero would drift against .boot-splash.
    expect(Math.abs((minX + maxX) / 2 - mid)).toBeLessThanOrEqual(3)
    expect(Math.abs((minY + maxY) / 2 - mid)).toBeLessThanOrEqual(3)
    // A ladder + one line of tracked caps, not an empty solid or a poster.
    expect(maxY - minY).toBeGreaterThan(300)
    expect(maxY - minY).toBeLessThan(500)
    expect(gold).toBeGreaterThan(2000)
    expect(text).toBeGreaterThan(2000)
  })
})
