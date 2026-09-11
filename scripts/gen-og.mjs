#!/usr/bin/env node
/**
 * Link-preview card — public/og.png (1280×720).
 *
 * Run: node scripts/gen-og.mjs [--preview <dir>]
 *
 * This is what a cold stranger sees before they see the game: the Open Graph
 * / Twitter card that Slack, iMessage, X and Discord unfurl from
 * corpclimber.com. It is composed from the assets the game already ships —
 * the night-lobby Title palette (`TitleScreen.module.css`), the three lead
 * plates (`src/assets/characters`), the gold ladder mark (`public/icon-512.png`
 * geometry) and the game's two faces (Anton display, Space Grotesk body,
 * embedded from @fontsource) — so the card can never drift into a generic
 * stock-illustration look, and so the copy is regenerable rather than
 * baked into a one-off PNG.
 *
 * Copy is Office-first: the five-floor campaign is the pitch, the Classic
 * 30-floor tower is the second line. `TAGLINE` mirrors the live Title
 * tagline; `src/__tests__/public-share.test.ts` keeps this file, the
 * rendered PNG and the meta tags in index.html in agreement.
 *
 * Rendering uses Playwright's Chromium (the same browser CI installs for
 * the smoke suite): `npx playwright install chromium`.
 *
 * `--preview <dir>` also writes a Slack-sized 2× crop for eyeballing. Previews
 * are evidence, not assets — keep them out of the repo.
 */

import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

export const WIDTH = 1280
export const HEIGHT = 720

/** Night lobby (TitleScreen.module.css `.screen`): stays dark, lifts midtones. */
const LOBBY_TOP = '#1a1e28'
const LOBBY_MID = '#161a24'
const LOBBY_BOTTOM = '#12141a'
const LOBBY_GLASS = 'rgba(30, 38, 54, 0.9)'
const LOBBY_LINE = 'rgba(255, 255, 255, 0.14)'

/** Brand — tokens.css. */
const GOLD = '#ffc107'
const GOLD_BRIGHT = '#ffd54f'
const TEXT = '#f2f6fa'
const TEXT_2 = '#cdd6e2'
const INK = '#1b1726'
/** icon-512 plate — the favicon / app icon slate. */
const ICON_PLATE = '#263238'

/** Copy. KICKER and the wordmark are the Title's; TAGLINE is the Title tagline verbatim. */
export const KICKER = 'Q4 LADDER SIMULATION'
export const TAGLINE = ['RECEPTION TO THE BOARD. FIVE FLOORS.', 'ONE BADGE SWIPE FROM GLORY.']
export const SUBLINE = 'Pick a role, work the floor, out-battle every manager.'
export const CLASSIC_LINE = 'Plus the Classic 30-floor tower.'
export const CTA = 'PLAY FREE IN BROWSER'

/**
 * The Title cast, same order and lead (`CAST` in TitleScreen.tsx); rail
 * colors are TYPE_COLORS[types[0]] for the non-leads, gold for the lead.
 * Paths mirror sprites.ts.
 */
const CAST = [
  { file: 'npcs/product_manager.webp', role: 'PRODUCT', rail: '#E53935' },
  { file: 'player/eng.webp', role: 'ENGINEER', rail: GOLD, lead: true },
  { file: 'player/design.webp', role: 'DESIGN', rail: '#1565C0' },
]

const args = process.argv.slice(2)
const previewIdx = args.indexOf('--preview')
const previewDir = previewIdx >= 0 ? resolve(args[previewIdx + 1] ?? 'artifacts/og') : null

function fontFace(family, pkg, file, weight) {
  const dir = dirname(require.resolve(`${pkg}/package.json`))
  const woff2 = readFileSync(join(dir, 'files', file))
  return `@font-face {
    font-family: '${family}';
    font-weight: ${weight};
    font-style: normal;
    src: url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2');
  }`
}

function spriteUri(file) {
  const bytes = readFileSync(join(ROOT, 'src', 'assets', 'characters', file))
  return `data:image/webp;base64,${bytes.toString('base64')}`
}

/** The favicon / icon-512 ladder: slate plate, gold rails, bright rungs. */
const LADDER_MARK = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="7" fill="${ICON_PLATE}" />
  <rect x="8" y="4" width="3.5" height="24" rx="1.2" fill="${GOLD}" />
  <rect x="20.5" y="4" width="3.5" height="24" rx="1.2" fill="${GOLD}" />
  <rect x="8" y="8.5" width="15.5" height="2.5" rx="1.2" fill="${GOLD_BRIGHT}" />
  <rect x="8" y="14.75" width="15.5" height="2.5" rx="1.2" fill="${GOLD_BRIGHT}" />
  <rect x="8" y="21" width="15.5" height="2.5" rx="1.2" fill="${GOLD_BRIGHT}" />
</svg>`

export function page() {
  const plates = CAST.map(
    (c) => `
    <figure class="plate${c.lead ? ' lead' : ''}" style="--rail: ${c.rail}">
      <div class="art"><img src="${spriteUri(c.file)}" alt="" /></div>
      <figcaption>${c.role}</figcaption>
    </figure>`,
  ).join('')

  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  ${fontFace('Anton', '@fontsource/anton', 'anton-latin-400-normal.woff2', 400)}
  ${fontFace('Space Grotesk', '@fontsource/space-grotesk', 'space-grotesk-latin-500-normal.woff2', 500)}
  ${fontFace('Space Grotesk', '@fontsource/space-grotesk', 'space-grotesk-latin-700-normal.woff2', 700)}

  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${WIDTH}px; height: ${HEIGHT}px; overflow: hidden; }
  body {
    position: relative;
    color: ${TEXT};
    background: linear-gradient(180deg, ${LOBBY_TOP} 0%, ${LOBBY_MID} 56%, ${LOBBY_BOTTOM} 100%);
    font-family: 'Space Grotesk', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  /* Field: warm pool behind the cast, faint top wash under the wordmark. */
  .field {
    position: absolute; inset: 0;
    background:
      radial-gradient(34% 40% at 76% 56%, rgba(255, 193, 7, 0.09), transparent 100%),
      radial-gradient(60% 40% at 26% 0%, rgba(255, 255, 255, 0.04), transparent 100%);
  }
  /* Footer skyline: a handful of towers one value above the field, no
     window grid — at unfurl size a dot grid reads as a barcode. */
  .skyline {
    position: absolute; left: 0; right: 0; bottom: 0; height: 88px;
    background:
      linear-gradient(180deg, transparent 0, rgba(0, 0, 0, 0.3) 100%),
      linear-gradient(#1c2130, #1c2130) 40px 30px / 120px 100% no-repeat,
      linear-gradient(#1a1f2c, #1a1f2c) 190px 12px / 70px 100% no-repeat,
      linear-gradient(#1e2432, #1e2432) 300px 44px / 160px 100% no-repeat,
      linear-gradient(#1a1f2c, #1a1f2c) 520px 22px / 90px 100% no-repeat,
      linear-gradient(#1c2130, #1c2130) 660px 50px / 200px 100% no-repeat,
      linear-gradient(#1e2432, #1e2432) 900px 18px / 80px 100% no-repeat,
      linear-gradient(#1a1f2c, #1a1f2c) 1020px 38px / 140px 100% no-repeat,
      linear-gradient(#1c2130, #1c2130) 1200px 8px / 60px 100% no-repeat;
  }

  .copy {
    position: absolute; left: 80px; top: 96px; width: 620px;
    display: flex; flex-direction: column; align-items: flex-start;
  }
  .kicker {
    display: flex; align-items: center; gap: 14px;
    font-weight: 700; font-size: 19px; letter-spacing: 0.22em;
    color: rgba(255, 193, 7, 0.78);
  }
  .kicker::before, .kicker::after { content: ''; width: 36px; height: 1px; background: rgba(255, 193, 7, 0.35); }
  .wordmark {
    margin-top: 18px;
    font-family: 'Anton', system-ui, sans-serif;
    font-weight: 400;
    font-size: 132px;
    line-height: 0.92;
    letter-spacing: 0.02em;
    background: linear-gradient(180deg, #ffffff 0%, #eef2f7 55%, #cfd8e4 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.7)) drop-shadow(0 10px 22px rgba(0, 0, 0, 0.4));
  }
  .tagline {
    margin-top: 26px;
    font-weight: 700; font-size: 24px; line-height: 1.45; letter-spacing: 0.12em;
    color: ${GOLD_BRIGHT};
  }
  .subline {
    margin-top: 14px;
    font-weight: 500; font-size: 22px; line-height: 1.35;
    color: ${TEXT_2};
  }
  .classic {
    margin-top: 4px;
    font-weight: 500; font-size: 18px; line-height: 1.35;
    color: rgba(205, 214, 226, 0.62);
  }
  .cta {
    margin-top: 34px;
    display: inline-flex; align-items: center; gap: 14px;
    padding: 0 30px; height: 62px;
    font-weight: 700; font-size: 22px; letter-spacing: 0.1em;
    color: ${INK};
    background: linear-gradient(180deg, #ffe082 0%, ${GOLD_BRIGHT} 55%, ${GOLD} 100%);
    border-radius: 10px;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.55), 0 8px 18px rgba(0, 0, 0, 0.45);
  }
  .cta svg { width: 30px; height: 30px; }

  /* Cast: three glass badge plates, heads rising past the rail (Title .plate). */
  .cast {
    --plate: 150px; --gap: 28px;
    position: absolute; right: 88px; top: 304px;
    display: flex; gap: var(--gap); align-items: flex-end;
  }
  .plate {
    position: relative; width: var(--plate); height: var(--plate);
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    background: ${LOBBY_GLASS};
    border: 1px solid ${LOBBY_LINE};
    border-radius: 14px;
    box-shadow: 0 18px 36px rgba(0, 0, 0, 0.45);
  }
  .plate::before {
    content: ''; position: absolute; left: 14px; right: 14px; top: -1px; height: 3px;
    border-radius: 0 0 3px 3px; background: var(--rail);
  }
  .plate.lead { border-color: rgba(255, 193, 7, 0.9); box-shadow: inset 0 0 0 1px rgba(255, 193, 7, 0.9), 0 18px 36px rgba(0, 0, 0, 0.45); }
  .art {
    position: absolute; left: 0; right: 0; bottom: 34px;
    height: calc(var(--plate) * 1.34);
    display: flex; align-items: flex-end; justify-content: center;
  }
  .art img { height: 100%; width: auto; image-rendering: auto; filter: drop-shadow(0 6px 10px rgba(0, 0, 0, 0.5)); }
  .art::before {
    content: ''; position: absolute; left: 22%; right: 22%; bottom: -6px; height: 14px;
    border-radius: 50%; background: rgba(255, 193, 7, 0.16); filter: blur(4px);
  }
  figcaption {
    position: relative; margin-bottom: 9px;
    font-weight: 700; font-size: 13px; letter-spacing: 0.22em;
    color: rgba(242, 246, 250, 0.82);
  }
  .plate.lead figcaption { color: ${GOLD_BRIGHT}; }
  .floorline {
    position: absolute; right: 68px; top: 468px; width: 546px; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 213, 79, 0.3) 18%, rgba(255, 213, 79, 0.3) 82%, transparent);
  }
  .floorline::after {
    content: ''; position: absolute; left: 10%; right: 10%; top: 1px; height: 28px;
    background: linear-gradient(180deg, rgba(255, 193, 7, 0.07), transparent);
  }

  /* The app icon, so the card and the tab / home screen read as one mark. */
  .mark { position: absolute; right: 88px; top: 84px; width: 84px; height: 84px; filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.5)); }
  .mark svg { width: 100%; height: 100%; display: block; }
  .floors {
    position: absolute; right: 196px; top: 118px;
    display: flex; align-items: center; gap: 14px;
    font-weight: 700; font-size: 17px; letter-spacing: 0.22em;
    color: rgba(255, 193, 7, 0.78);
  }
  .floors::before { content: ''; width: 36px; height: 1px; background: rgba(255, 193, 7, 0.35); }
</style></head>
<body>
  <div class="field"></div>
  <div class="skyline"></div>

  <div class="copy">
    <div class="kicker">${KICKER}</div>
    <div class="wordmark">CORPORATE<br>CLIMB</div>
    <div class="tagline">${TAGLINE[0]}<br>${TAGLINE[1]}</div>
    <div class="subline">${SUBLINE}</div>
    <div class="classic">${CLASSIC_LINE}</div>
    <div class="cta"><svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M10 6v20l16-10z" fill="${INK}"/></svg>${CTA}</div>
  </div>

  <div class="floors">CAMPAIGN · FLOORS 1–5</div>
  <div class="mark">${LADDER_MARK}</div>

  <div class="floorline"></div>
  <div class="cast">${plates}</div>
</body></html>`
}

async function main() {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none'] })
  try {
    const ctx = await browser.newContext({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    })
    const tab = await ctx.newPage()
    await tab.setContent(page(), { waitUntil: 'load' })
    await tab.evaluate(() => document.fonts.ready)
    for (const probe of [
      "400 132px 'Anton'",
      "700 24px 'Space Grotesk'",
      "500 22px 'Space Grotesk'",
    ]) {
      const loaded = await tab.evaluate((p) => document.fonts.check(p), probe)
      if (!loaded) throw new Error(`${probe} did not load — the card would fall back`)
    }
    await tab.evaluate(() => Promise.all([...document.images].map((img) => img.decode())))

    const out = join(ROOT, 'public', 'og.png')
    await tab.screenshot({ path: out, type: 'png', omitBackground: false })
    console.log(`wrote ${out} (${WIDTH}×${HEIGHT})`)

    if (previewDir) {
      mkdirSync(previewDir, { recursive: true })
      // Slack / iMessage show the card around 360–520 px wide; a half-size
      // render is the honest read of whether the tagline survives.
      const small = await browser.newContext({
        viewport: { width: WIDTH, height: HEIGHT },
        deviceScaleFactor: 0.4,
      })
      const smallTab = await small.newPage()
      await smallTab.setContent(page(), { waitUntil: 'load' })
      await smallTab.evaluate(() => document.fonts.ready)
      await smallTab.evaluate(() => Promise.all([...document.images].map((img) => img.decode())))
      const file = join(previewDir, 'og-unfurl-512.png')
      await smallTab.screenshot({ path: file, type: 'png' })
      console.log(`preview ${file} (${Math.round(WIDTH * 0.4)}×${Math.round(HEIGHT * 0.4)})`)
      await small.close()
    }
  } finally {
    await browser.close()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
