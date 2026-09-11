import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { collectPrecacheEntries } from '../../scripts/sw-precache-plugin'
import { decodePng, hexToRgb, near } from './helpers/png'

/**
 * What a cold stranger sees before the game: the tab favicon and the link
 * preview (Open Graph / Twitter card).
 *
 * Favicon: the gold ladder on the slate plate — the same mark as icon-512 /
 * apple-touch-icon — never the indigo SaaS ladder that shipped before. It is
 * a real file so unfurl bots can fetch it, with the PNG icon as fallback.
 *
 * Share card + copy: Office-first. The five-floor campaign (reception → the
 * board, one badge swipe) is the pitch; the Classic 30-floor tower is the
 * second line. The card is rendered by scripts/gen-og.mjs on the night-lobby
 * palette; this file keeps the generator, the PNG, and index.html's meta
 * tags agreeing so a regenerated card or a copy edit cannot drift back to
 * "Thirty floors. Three acts." or to a generic purple.
 *
 * Absolute og:image URLs and theme-color are pinned by app-name.test.ts and
 * boot-splash.test.ts (the wiring lane, #125), not here.
 */

const repoFile = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts))
const repoText = (...parts: string[]) => repoFile(...parts).toString('utf8')

const HEX = /#[0-9a-f]{6}\b/gi
const GOLD = '#ffc107'
const GOLD_BRIGHT = '#ffd54f'
const ICON_PLATE = '#263238'
/** The indigo the old inline favicon shipped (bare, so `%23`-encoded data URIs match too). */
const LEGACY_INDIGO = ['4f46e5', '818cf8']

const CLASSIC_FIRST = /thirty floors|three acts/i
const FLOOR_SIX = /floor 6|six floors|floors 1[–-]6/i
/** The live Title copy (#123): one-sentence tagline; "five floors" lives in the eyebrow. */
const TITLE_TAGLINE = 'Reception to the board. One badge swipe from glory.'
const TITLE_EYEBROW = 'CAMPAIGN · FLOORS 1–5'

const html = repoText('index.html')
const meta = (sel: string) =>
  html.match(new RegExp(`<meta\\s+(?:property|name)="${sel}"\\s+content="([^"]*)"`))?.[1]

describe('favicon', () => {
  const svg = repoText('public/favicon.svg')

  it('index.html links the SVG file with the PNG icon as fallback, not a data URI', () => {
    expect(html).toContain('<link rel="icon" type="image/svg+xml" href="/favicon.svg" />')
    expect(html).toContain(
      '<link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />',
    )
    expect(html).not.toMatch(/rel="icon"[^>]*href="data:/)
  })

  it('is the gold ladder on the icon-512 slate plate and nothing else', () => {
    const colors = new Set((svg.match(HEX) ?? []).map((h) => h.toLowerCase()))
    expect([...colors].sort()).toEqual([ICON_PLATE, GOLD, GOLD_BRIGHT].sort())
    // Two rails, three rungs, one plate — the icon-512 geometry.
    expect(svg.match(/<rect/g)).toHaveLength(6)
  })

  it('matches the pixels the PWA / home-screen icons ship', () => {
    for (const file of ['icon-512.png', 'apple-touch-icon.png', 'icon-maskable-512.png']) {
      const png = decodePng(repoFile('public', file))
      const s = png.w / 32
      // Plate between the rails above the first rung; left rail; a rung.
      expect(png.at(Math.round(16 * s), Math.round(6 * s)), `${file} plate`).toEqual(
        hexToRgb(ICON_PLATE),
      )
      expect(png.at(Math.round(9.75 * s), Math.round(6 * s)), `${file} rail`).toEqual(
        hexToRgb(GOLD),
      )
      expect(png.at(Math.round(16 * s), Math.round(16 * s)), `${file} rung`).toEqual(
        hexToRgb(GOLD_BRIGHT),
      )
    }
  })

  it('no public surface carries the legacy indigo', () => {
    for (const file of ['index.html', 'public/favicon.svg', 'public/manifest.webmanifest']) {
      const text = repoText(file).toLowerCase()
      for (const shade of LEGACY_INDIGO) expect(text, file).not.toContain(shade)
    }
  })

  it('is precached with the other icons', () => {
    const dir = mkdtempSync(join(tmpdir(), 'cc-precache-'))
    for (const f of ['favicon.svg', 'icon-192.png', 'apple-touch-icon.png', 'og.png']) {
      writeFileSync(join(dir, f), '')
    }
    const entries = collectPrecacheEntries(dir)
    expect(entries).toContain('/favicon.svg')
    expect(entries).toContain('/icon-192.png')
    // The 1280×720 card is for crawlers, not the offline shell.
    expect(entries).not.toContain('/og.png')
  })
})

describe('share copy is Office-first', () => {
  const generator = repoText('scripts/gen-og.mjs')

  it('the Title tagline and campaign eyebrow are the source of truth', () => {
    const title = repoText('src/screens/TitleScreen.tsx')
    expect(title).toContain(TITLE_TAGLINE)
    expect(title).toContain(TITLE_EYEBROW)
  })

  it('index.html descriptions pitch the five-floor campaign, not the Classic tower', () => {
    for (const sel of ['description', 'og:description', 'twitter:description']) {
      const copy = meta(sel)
      expect(copy, sel).toBeDefined()
      expect(copy, sel).toMatch(/reception to the board/i)
      expect(copy, sel).toMatch(/five floors/i)
      expect(copy, sel).toMatch(/badge swipe/i)
      expect(copy, sel).not.toMatch(CLASSIC_FIRST)
      expect(copy, sel).not.toMatch(FLOOR_SIX)
    }
    expect(meta('og:image:alt')).toMatch(/five floors/i)
    expect(html).not.toMatch(CLASSIC_FIRST)
  })

  it('the manifest description agrees', () => {
    const manifest = JSON.parse(repoText('public/manifest.webmanifest')) as { description: string }
    expect(manifest.description).toMatch(/five floors/i)
    expect(manifest.description).not.toMatch(CLASSIC_FIRST)
  })

  it('the card generator carries the Title tagline + eyebrow verbatim and keeps Classic second', () => {
    expect(generator.match(/TAGLINE = '([^']*)'/)?.[1]).toBe(TITLE_TAGLINE)
    expect(generator.match(/EYEBROW = '([^']*)'/)?.[1]).toBe(TITLE_EYEBROW)
    expect(generator).toMatch(/CLASSIC_LINE = '[^']*Classic 30-floor[^']*'/)
    expect(generator).not.toMatch(CLASSIC_FIRST)
    expect(generator).not.toMatch(FLOOR_SIX)
    for (const shade of LEGACY_INDIGO) expect(generator.toLowerCase()).not.toContain(shade)
  })
})

describe('public/og.png', () => {
  const png = decodePng(repoFile('public', 'og.png'))

  it('is the 1280×720 card the meta tags declare', () => {
    expect(png.w).toBe(1280)
    expect(png.h).toBe(720)
    expect(meta('og:image:width')).toBe('1280')
    expect(meta('og:image:height')).toBe('720')
    expect(meta('og:image')).toMatch(/^(https:\/\/[^/"]+)?\/og\.png$/)
    expect(meta('twitter:image')).toMatch(/^(https:\/\/[^/"]+)?\/og\.png$/)
  })

  it('sits on the night-lobby midtones, not the old cold navy', () => {
    // Points outside every light pool: top-right corner on the gradient's
    // first stop, left edge just under the wordmark near the 56% stop.
    expect(png.at(1277, 2)).toEqual(hexToRgb('#1a1e28'))
    expect(near(png.at(2, 380), hexToRgb('#161a24'), 3)).toBe(true)
    // The #dd72c1d card's void.
    expect(near(png.at(1277, 2), hexToRgb('#070d17'), 6)).toBe(false)
  })

  it('carries the gold ladder mark, gold copy and paper wordmark', () => {
    // App-icon mark at right: 88px, top: 84px, 84px square (gen-og.mjs .mark).
    const mark = { x: 1280 - 88 - 84, y: 84, s: 84 / 32 }
    expect(png.at(mark.x + Math.round(4 * mark.s), mark.y + Math.round(6 * mark.s))).toEqual(
      hexToRgb(ICON_PLATE),
    )
    expect(
      png.at(mark.x + Math.round(9.75 * mark.s), mark.y + Math.round(13 * mark.s)),
      'rail',
    ).toEqual(hexToRgb(GOLD))
    expect(
      png.at(mark.x + Math.round(16 * mark.s), mark.y + Math.round(16 * mark.s)),
      'rung',
    ).toEqual(hexToRgb(GOLD_BRIGHT))

    let gold = 0
    let paper = 0
    let indigo = 0
    const paperRgb = hexToRgb('#ffffff')
    const indigoRgb = hexToRgb(`#${LEGACY_INDIGO[0]}`)
    // The tagline, CTA and mark span the #ffc107 → #ffe082 brushed-gold band.
    const isGold = ([r, g, b]: readonly number[]) =>
      r >= 0xf0 && g >= 0xb0 && g <= 0xe8 && b <= 0x90
    for (let y = 0; y < png.h; y += 2) {
      for (let x = 0; x < png.w; x += 2) {
        const p = png.at(x, y)
        if (isGold(p)) gold++
        if (near(p, paperRgb, 8)) paper++
        if (near(p, indigoRgb, 24)) indigo++
      }
    }
    expect(gold).toBeGreaterThan(3000)
    expect(paper).toBeGreaterThan(3000)
    expect(indigo).toBe(0)
  })
})
