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
 * headline. It lives outside `src/screens` on purpose. The install nudge
 * is pinned by name for the same reason, in reverse: it is run-end screen
 * chrome that lives under `src/components`, so the sweep misses it.
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
// The Daily roster's old selected card: a cream fill on a `2px 2px 0`
// box shadow. The night-glass cards lift with `0 Npx Mpx` blur, never an
// opaque offset, and paint no cream.
const CREAM = /#fff8e1/i
const HARD_OFFSET_BOX =
  /(box-shadow|boxShadow)\s*:[^;]*?(?:^|[\s,'"])-?[1-9]\d*px\s+-?[1-9]\d*px\s+0(px)?(?=[\s,;'"])/im
// The Office handout icon stacks translucent offsets to draw a sheaf of
// paper — a pixel glyph, not a card, so it sits beside DamageNumber.
// The Office HUD used to tint its glass with 10–22% gold, which rendered
// as a khaki block against the neutral Title glass. Gold now lives in the
// hairline stroke and a fading wash, never mixed into the fill.
const KHAKI = /color-mix\(in srgb, var\(--cc-(?:glass|fill-soft)\) \d+%, var\(--cc-gold\)/
const DRAWN_GLYPHS = [/\.handoutThick \{[^}]*\}/]
const chrome = (text: string) => DRAWN_GLYPHS.reduce((t, re) => t.replace(re, ''), text)

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

  it('has no cream fill or hard-offset box shadow left in src/screens', () => {
    const cream = FILES.filter((f) => CREAM.test(f.text)).map((f) => f.path)
    expect(cream).toEqual([])
    const offset = FILES.filter((f) => HARD_OFFSET_BOX.test(chrome(f.text))).map((f) => f.path)
    expect(offset).toEqual([])
  })

  it('paints no gold-tinted (khaki) glass in the Office plates', () => {
    const hits = FILES.filter(
      (f) => f.path.startsWith('src/screens/office/') && KHAKI.test(f.text),
    ).map((f) => f.path)
    expect(hits).toEqual([])
  })

  it('seats the F1 work ticket and the Class Select perk on the Title sign hairline', () => {
    const hud = FILES.find((f) => f.path.endsWith('OfficeScreen.module.css'))!
    const ticket = hud.text.match(/\.ticket \{[^}]*\}/)![0]
    expect(ticket).toContain('border-color: rgba(255, 211, 77, 0.45)')
    expect(ticket).toContain('border-left-color: var(--cc-gold)')
    const select = FILES.find((f) => f.path.endsWith('OfficeClassSelect.module.css'))!
    const perk = select.text.match(/\.perk \{[^}]*\}/)![0]
    expect(perk).toContain('border: 1px solid rgba(255, 211, 77, 0.45)')
  })

  it('ghosts NEW CAMPAIGN beside CONTINUE like the Title deck', () => {
    const css = FILES.find((f) => f.path.endsWith('OfficeStartScreen.module.css'))!
    const ghost = css.text.match(/\.actions \.newCampaign \{[^}]*\}/)![0]
    expect(ghost).toContain('background: rgba(255, 255, 255, 0.04)')
    expect(ghost).toContain('border-color: rgba(255, 255, 255, 0.3)')
    const tsx = FILES.find((f) => f.path.endsWith('OfficeStartScreen.tsx'))!
    expect(tsx.text).toContain('className={save ? styles.newCampaign : undefined}')
  })

  it('seats the Daily roster pick on the Career Select night-glass card', () => {
    const css = FILES.find((f) => f.path.endsWith('DailyPreScreen.module.css'))!
    const on = css.text.match(/\.classOn \{[^}]*\}/)![0]
    expect(on).toContain('border-color: rgba(255, 211, 77, 0.72)')
    expect(on).toContain('inset 0 0 18px rgba(255, 193, 7, 0.12)')
    expect(css.text).toMatch(/\.classOn \.classLabel \{[^}]*--cc-gold-bright/)
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

  it('seats the Daily score card on the Title sign night glass', () => {
    const css = FILES.find((f) => f.path.endsWith('DailyResultScreen.module.css'))!
    const card = css.text.match(/\.scoreCard \{[^}]*\}/)![0]
    expect(card).toContain('border: 1px solid rgba(255, 211, 77, 0.45)')
    expect(card).toContain('var(--cc-glass)')
    expect(card).not.toContain('rgba(0, 0, 0, 0.85)')
    expect(card).not.toContain('var(--amber-deep)')
    expect(card).not.toMatch(KHAKI)
    expect(card).not.toMatch(HARD_OFFSET_BOX)
    expect(css.text).toMatch(/:global\(\.reduce-motion\) \.scoreCard \{\s*animation: none;/)
  })

  it('seats the install nudge on the Title sign night glass', () => {
    const css = readFileSync(join(ROOT, 'src/components/InstallNudge.module.css'), 'utf8')
    const nudge = css.match(/\.nudge \{[^}]*\}/)![0]
    expect(nudge).toContain('border: 1px solid rgba(255, 211, 77, 0.45)')
    expect(nudge).toContain('var(--cc-glass)')
    expect(nudge).not.toMatch(KHAKI)
    expect(nudge).not.toMatch(HARD_OFFSET_BOX)
    const tsx = readFileSync(join(ROOT, 'src/components/InstallNudge.tsx'), 'utf8')
    expect(tsx).not.toContain('rgba(255,193,7')
    expect(tsx).not.toContain('style={{')
  })
})
