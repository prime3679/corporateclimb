import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Pass J ultra — the arcade orange costume.
 *
 * Title / Shop / Promotion / Daily lift gold display type with a 1px dark
 * hairline (`0 1px 0 rgba(5,7,13,.6)`). The Interlude screens and their
 * Classic cousins used to wear a hard 2px offset in burnt orange
 * (`#E65100`, `rgba(122,55,15,…)`), which read as arcade chrome against
 * the night-lobby glass. This suite keeps the sweep from regressing: no
 * offset-colour text shadows anywhere under `src/screens`.
 *
 * The one hard offset that stays is `components/DamageNumber.tsx` — a
 * battle VFX outline that has to survive on top of sprite art, not a
 * headline. It lives outside `src/screens` on purpose.
 */

const ROOT = process.cwd()
const SCREENS = join(ROOT, 'src/screens')

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (/\.(tsx?|css)$/.test(name)) out.push(p)
  }
  return out
}

const FILES = walk(SCREENS).map((p) => ({
  path: relative(ROOT, p),
  text: readFileSync(p, 'utf8'),
}))

const ORANGE = /#e65100|122,\s*55,\s*15/i
// `text-shadow: 2px 2px 0 <colour>` and friends — any opaque offset shadow
// on display type. The hairline is `0 1px 0 …` and never matches.
const HARD_OFFSET = /(text-shadow|textShadow)[^;\n]*-?[1-9]\d*px\s+-?[1-9]\d*px\s+0(px)?\b/i
const HAIRLINE = /0 1px 0 rgba\(5,\s*7,\s*13,\s*0?\.6\)/

describe('Pass J ultra — arcade orange sweep', () => {
  it('walks the Classic screens', () => {
    expect(FILES.length).toBeGreaterThan(10)
  })

  it('has no burnt-orange hard shadow left in src/screens', () => {
    const hits = FILES.filter((f) => ORANGE.test(f.text)).map((f) => f.path)
    expect(hits).toEqual([])
  })

  it('has no offset-colour text shadow costume left in src/screens', () => {
    const hits = FILES.flatMap((f) =>
      f.text
        .split('\n')
        .map((line, i) => (HARD_OFFSET.test(line) ? `${f.path}:${i + 1}` : null))
        .filter((x): x is string => x !== null),
    )
    expect(hits).toEqual([])
  })

  it('lifts the shared Interlude header with the Title hairline', () => {
    const css = FILES.find((f) => f.path.endsWith('InterludeScreen.module.css'))!
    const header = css.text.match(/\.header \{[^}]*\}/)![0]
    expect(header).toMatch(HAIRLINE)
    expect(header).toContain('color: var(--gold-bright)')
  })

  it('lets the act subtitle and game-over headline inherit the hairline', () => {
    const act = FILES.find((f) => f.path.endsWith('ActTransitionScreen.tsx'))!
    expect(act.text).not.toContain('subtitleShadow')
    const over = FILES.find((f) => f.path.endsWith('GameOverScreen.tsx'))!
    expect(over.text).not.toMatch(/textShadow:\s*'2px/)
  })

  it('gives the remaining Classic cousins the same hairline', () => {
    for (const name of [
      'HallwayEventScreen.tsx',
      'BattleVictoryScreen.tsx',
      'ClassSelect.tsx',
      'FloorIntro.tsx',
    ]) {
      const f = FILES.find((x) => x.path.endsWith(name))!
      expect(f.text, name).toMatch(HAIRLINE)
    }
  })
})
