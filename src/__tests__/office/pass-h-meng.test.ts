import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import {
  celebrationCopy,
  celebrationKicker,
  dispatchOfficeAction,
  newOfficeCampaign,
  type OfficeState,
} from '@/engine/office'
import {
  CELEBRATION_TITLE_MAX_CHARS,
  OFFICE_COMPACT_STAGE_H,
  OFFICE_START_TITLE,
  PRESENTATION_SIGNOFF,
  celebrationTitleLengths,
  officeStageCompact,
  playtestStageIsCompact,
} from '@/screens/office/presentation'
import { DEFAULT_HEADSHOT_FOCAL, headshotFocal, headshotPlacement } from '@/sprites'
import { COMPACT_DESIGN_HEIGHT, MIN_DESIGN_HEIGHT, computeStageLayout } from '@/ui/Stage'

// vitest/jsdom rewrites import.meta.url; read from the repo root.
const repo = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8')

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

describe('Pass H — Sloane Headshot crop', () => {
  it('drops Sloane’s pin toward the hairline so the face does not sit high', () => {
    const sloane = headshotFocal('sloane')
    const house = headshotFocal('product_manager')
    expect(sloane.y).toBeLessThan(DEFAULT_HEADSHOT_FOCAL.y)
    expect(sloane.y).toBeLessThanOrEqual(house.y)
    expect(sloane.y).toBeGreaterThanOrEqual(0.1)
    expect(sloane.zoom).toBeGreaterThan(DEFAULT_HEADSHOT_FOCAL.zoom)
    expect(sloane.x).toBeGreaterThanOrEqual(0.46)
    expect(sloane.x).toBeLessThanOrEqual(0.5)
    expect(sloane).toEqual({ x: 0.48, y: 0.105, zoom: 3.38 })
  })

  it('places the 40/48/64 badge crops with more headroom than the old pin', () => {
    const sloane = headshotFocal('sloane')
    const old = { x: 0.47, y: 0.12, zoom: 3.2 }
    for (const size of [40, 48, 64] as const) {
      const next = headshotPlacement(size, sloane)
      const prev = headshotPlacement(size, old)
      expect(next.top, `size ${size}`).toBeGreaterThan(prev.top)
      expect(next.width).toBe(size * sloane.zoom)
    }
  })

  it('keeps Headshot placement on the shared helper, not inline math', () => {
    const src = repo('src/screens/office/Headshot.tsx')
    expect(src).toContain('headshotPlacement')
    expect(src).not.toMatch(/size \* focal\.zoom/)
  })
})

describe('Pass H — short-stage chrome', () => {
  it('treats the 440×760 playtest viewport as compact', () => {
    expect(OFFICE_COMPACT_STAGE_H).toBe(COMPACT_DESIGN_HEIGHT)
    expect(COMPACT_DESIGN_HEIGHT).toBe(820)
    expect(playtestStageIsCompact()).toBe(true)
    expect(officeStageCompact(computeStageLayout(440, 760).height)).toBe(true)
    expect(officeStageCompact(MIN_DESIGN_HEIGHT)).toBe(true)
    expect(officeStageCompact(884)).toBe(false)
  })

  it('marks the Stage compact via data-stage-density for CSS and tests', () => {
    const src = repo('src/ui/Stage.tsx')
    expect(src).toContain(
      "data-stage-density={layout.height <= COMPACT_DESIGN_HEIGHT ? 'compact' : 'roomy'}",
    )
    const css = repo('src/ui/Stage.module.css')
    expect(css).toContain('container-name: stage')
  })
})

describe('Pass H — celebration / title readability', () => {
  it('keeps every celebration title at or under the compact line budget', () => {
    const titles = celebrationTitleLengths(start())
    expect(titles.map((row) => row.title)).toEqual([
      'FLOOR 1 CLEARED',
      'FLOOR 2 CLEARED',
      'FLOOR 3 CLEARED',
      'FLOOR 4 CLEARED',
      'THE CLIMB',
    ])
    for (const row of titles) {
      expect(row.title.length, row.title).toBeLessThanOrEqual(CELEBRATION_TITLE_MAX_CHARS)
      expect(row.title).not.toContain('screen_')
      expect(row.title).not.toMatch(/floor 6/i)
    }
    expect(celebrationCopy(start(), 'screen_floor5_complete').body).toContain('no Floor 6')
    expect(celebrationKicker('screen_floor5_complete')).toBe('EXEC · THE BUILDING')
  })

  it('names the Office start card THE OFFICE', () => {
    expect(OFFICE_START_TITLE).toBe('THE OFFICE')
    expect(OFFICE_START_TITLE.length).toBeLessThanOrEqual(CELEBRATION_TITLE_MAX_CHARS)
  })
})

describe('Pass H — §12 / §13 / §19 presentation evidence', () => {
  it('records the shipped surfaces so the roadmap tick is not a vibe', () => {
    expect(PRESENTATION_SIGNOFF.section12.length).toBeGreaterThanOrEqual(3)
    expect(PRESENTATION_SIGNOFF.section13.length).toBeGreaterThanOrEqual(3)
    expect(PRESENTATION_SIGNOFF.section19.length).toBeGreaterThanOrEqual(5)
    const index = repo('index.html')
    expect(index).toContain('viewport-fit=cover')
    expect(index).toContain('env(safe-area-inset-top)')
    const tokens = repo('src/ui/tokens.css')
    expect(tokens).toContain('--tap-min: 54px')
    expect(tokens).toContain('--text-floor: 10px')
    expect(repo('src/screens/office/useOfficeFeedback.ts')).toContain('§12 feedback matrix')
  })
})
