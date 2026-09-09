#!/usr/bin/env node
/**
 * Native splash art for the Capacitor shell — resources/splash.png (2732×2732).
 *
 * Run: node scripts/gen-splash.mjs [--preview <dir>]
 *
 * Capacitor's iOS template shows one square image (Splash.imageset, 1x/2x/3x
 * all 2732×2732) through a `scaleAspectFill` image view: the square is scaled
 * until it covers the screen and the overflow is cropped. This script renders
 * the `.boot-splash` from index.html — same ladder rects, same tracking, same
 * frame black — at that canvas size, so the plugin's 200 ms fade lands on
 * identical art and a cold launch reads as one continuous moment.
 *
 * Sizing. A 2732 canvas covers a 2556 px-tall @3x iPhone (15/16 class) at
 * 2556/2732 = 0.9356; the boot splash draws the ladder at 76 CSS px = 228
 * device px, so it is 228 / 0.9356 ≈ 244 canvas px here (K = 3.2066 canvas px
 * per CSS px). Other phones land within ±10 % of the HTML size. Everything
 * stays inside the CENTER SAFE band — the widest crop any portrait iPhone
 * makes is 1290 / (2796 / 2732) ≈ 1260 canvas px wide — so nothing is ever
 * cut, whatever the aspect.
 *
 * Wordmark face: Space Grotesk 700, the game's body face and what the React
 * preloader shows next (index.html itself falls back to system-ui before the
 * bundle's fonts arrive). Embedded from @fontsource so the render never
 * depends on system fonts. Rendering uses Playwright's Chromium (the same
 * browser CI installs for the smoke suite): `npx playwright install chromium`.
 *
 * `--preview <dir>` also writes device-cropped previews (what the storyboard
 * actually shows on an iPhone SE / 15 Pro / 16 Pro Max) for review without
 * a Mac. Previews are evidence, not assets — keep them out of the repo.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

/** Frame black — BOOT_COLOR in src/platform/native.ts. */
const BOOT_COLOR = '#06080c'
const TEXT = '#f2f6fa'
const GOLD = '#ffc107'
const GOLD_BRIGHT = '#ffd54f'

const CANVAS = 2732
/** Canvas px per CSS px on a 2556-tall @3x iPhone (see header). */
const K = 3 * (CANVAS / 2556)
const LADDER = Math.round(76 * K) // 244
const GAP = Math.round(20 * K) // 64
const FONT = Math.round(19 * K) // 61

const args = process.argv.slice(2)
const previewIdx = args.indexOf('--preview')
const previewDir = previewIdx >= 0 ? resolve(args[previewIdx + 1] ?? 'artifacts/splash') : null

function fontDataUri() {
  const pkg = dirname(require.resolve('@fontsource/space-grotesk/package.json'))
  const woff2 = readFileSync(join(pkg, 'files', 'space-grotesk-latin-700-normal.woff2'))
  return `data:font/woff2;base64,${woff2.toString('base64')}`
}

/** Same ladder as index.html's .boot-splash, same viewBox and rects. */
const LADDER_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect x="6" y="2" width="4" height="28" rx="1" fill="${GOLD}" />
  <rect x="22" y="2" width="4" height="28" rx="1" fill="${GOLD}" />
  <rect x="6" y="8" width="20" height="3" rx="1" fill="${GOLD_BRIGHT}" />
  <rect x="6" y="16" width="20" height="3" rx="1" fill="${GOLD_BRIGHT}" />
  <rect x="6" y="24" width="20" height="3" rx="1" fill="${GOLD_BRIGHT}" />
</svg>`

function page() {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  @font-face {
    font-family: 'Space Grotesk';
    font-weight: 700;
    font-style: normal;
    src: url(${fontDataUri()}) format('woff2');
  }
  html, body { margin: 0; width: ${CANVAS}px; height: ${CANVAS}px; overflow: hidden; }
  body {
    background: ${BOOT_COLOR};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${GAP}px;
    -webkit-font-smoothing: antialiased;
  }
  svg { width: ${LADDER}px; height: ${LADDER}px; display: block; }
  .wordmark {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: ${FONT}px;
    line-height: 1;
    letter-spacing: 0.3em;
    text-indent: 0.3em; /* recenters the tracked-out caps, as in index.html */
    color: ${TEXT};
    white-space: nowrap;
  }
</style></head>
<body>${LADDER_SVG}<div class="wordmark">CORPORATE CLIMB</div></body></html>`
}

/** Portrait iPhones the aspect-fill crop is worth eyeballing on. */
const PREVIEW_DEVICES = [
  { name: 'iphone-se', w: 750, h: 1334 },
  { name: 'iphone-15-pro', w: 1179, h: 2556 },
  { name: 'iphone-16-pro-max', w: 1320, h: 2868 },
]

async function main() {
  // Unhinted outlines: CoreText does not hint, so this is the wordmark the
  // device draws, not a FreeType-snapped variant of it.
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] })
  try {
    const ctx = await browser.newContext({
      viewport: { width: CANVAS, height: CANVAS },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const tab = await ctx.newPage()
    await tab.setContent(page(), { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    const loaded = await tab.evaluate(() => document.fonts.check("700 61px 'Space Grotesk'"))
    if (!loaded) throw new Error('Space Grotesk 700 did not load — wordmark would fall back')

    mkdirSync(join(ROOT, 'resources'), { recursive: true })
    const out = join(ROOT, 'resources', 'splash.png')
    await tab.screenshot({ path: out, type: 'png', omitBackground: false })
    console.log(`wrote ${out} (${CANVAS}×${CANVAS}, ladder ${LADDER}px, wordmark ${FONT}px)`)

    if (previewDir) {
      mkdirSync(previewDir, { recursive: true })
      for (const d of PREVIEW_DEVICES) {
        // scaleAspectFill: scale the square to cover, crop the overflow evenly.
        const s = Math.max(d.w / CANVAS, d.h / CANVAS)
        const crop = { w: Math.round(d.w / s), h: Math.round(d.h / s) }
        const clip = {
          x: Math.round((CANVAS - crop.w) / 2),
          y: Math.round((CANVAS - crop.h) / 2),
          width: crop.w,
          height: crop.h,
        }
        const file = join(previewDir, `splash-${d.name}.png`)
        await tab.screenshot({ path: file, type: 'png', clip })
        writeFileSync(
          join(previewDir, `splash-${d.name}.txt`),
          `${d.name}: ${d.w}×${d.h} device px shows canvas ${crop.w}×${crop.h} at ${s.toFixed(4)}×\n`,
        )
        console.log(`preview ${file} (crop ${crop.w}×${crop.h} @ ${s.toFixed(4)})`)
      }
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
