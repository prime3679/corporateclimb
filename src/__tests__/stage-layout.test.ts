import { describe, expect, it } from 'vitest'
import {
  COMPACT_DESIGN_HEIGHT,
  DESIGN_WIDTH,
  DESKTOP_DESIGN_WIDTH,
  DESKTOP_MAX_SCALE,
  DESKTOP_MIN_WIDTH,
  MAX_DESIGN_HEIGHT,
  MIN_DESIGN_HEIGHT,
  THEATER_MIN_GUTTER,
  computeStageLayout,
} from '@/ui/Stage'

describe('computeStageLayout', () => {
  it('fills a modern phone with no letterbox', () => {
    const { scale, width, height, frame, shell } = computeStageLayout(390, 844)
    expect(shell).toBe('phone')
    expect(width).toBe(DESIGN_WIDTH)
    expect(scale).toBeCloseTo(390 / DESIGN_WIDTH, 4)
    // The scaled stage spans the full viewport height (±1px rounding).
    expect(Math.abs(height * scale - 844)).toBeLessThan(1)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('edge')
  })

  it('keeps the e2e viewport inside the fluid clamps', () => {
    const { scale, width, height, frame, shell } = computeStageLayout(440, 760)
    expect(shell).toBe('phone')
    expect(width).toBe(DESIGN_WIDTH)
    expect(scale).toBeCloseTo(440 / DESIGN_WIDTH, 4)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('edge')
  })

  it('gives a 1080p desktop the wide canvas at the height-bound scale', () => {
    const { scale, width, height, frame, shell } = computeStageLayout(1920, 1080)
    expect(shell).toBe('desktop')
    expect(width).toBe(DESKTOP_DESIGN_WIDTH)
    // 1080 / 760 — the min design height still binds before the 2× cap.
    expect(scale).toBeCloseTo(1080 / MIN_DESIGN_HEIGHT, 4)
    expect(height).toBe(MIN_DESIGN_HEIGHT)
    expect(Math.abs(height * scale - 1080)).toBeLessThan(1)
    // The canvas now covers ~62% of the monitor width (was ~35% at 472).
    const onScreen = width * scale
    expect(onScreen).toBeGreaterThan(1180)
    expect(onScreen).toBeLessThan(1210)
    // …and still leaves room for both theater wings.
    expect((1920 - onScreen) / 2).toBeGreaterThanOrEqual(THEATER_MIN_GUTTER)
    expect(frame).toBe('theater')
  })

  it('keeps a 1440×900 laptop height-bound, wide, and framed', () => {
    const { scale, width, height, frame, shell } = computeStageLayout(1440, 900)
    expect(shell).toBe('desktop')
    expect(width).toBe(DESKTOP_DESIGN_WIDTH)
    expect(scale).toBeCloseTo(900 / MIN_DESIGN_HEIGHT, 4)
    expect(height).toBe(MIN_DESIGN_HEIGHT)
    expect((1440 - width * scale) / 2).toBeGreaterThanOrEqual(THEATER_MIN_GUTTER)
    expect(frame).toBe('theater')
  })

  it('caps tall desktop viewports at the integer desktop scale', () => {
    const { scale, width, height, frame } = computeStageLayout(3840, 2160)
    expect(width).toBe(DESKTOP_DESIGN_WIDTH)
    expect(scale).toBe(DESKTOP_MAX_SCALE)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('theater')
  })

  it('keeps the 1.35 cap and phone width below desktop widths so tablet portrait is unchanged', () => {
    const { scale, width, height, frame, shell } = computeStageLayout(820, 1180)
    expect(shell).toBe('phone')
    expect(width).toBe(DESIGN_WIDTH)
    expect(scale).toBe(1.35)
    expect(Math.round(1180 / 1.35)).toBe(height)
    expect(frame).toBe('edge')
    // One pixel narrower than desktop still gets the phone canvas…
    expect(computeStageLayout(DESKTOP_MIN_WIDTH - 1, 1600).width).toBe(DESIGN_WIDTH)
    // …and the first desktop-class width swaps to the wide one.
    const wide = computeStageLayout(DESKTOP_MIN_WIDTH, 1600)
    expect(wide.shell).toBe('desktop')
    expect(wide.width).toBe(DESKTOP_DESIGN_WIDTH)
    expect(wide.scale).toBeCloseTo(DESKTOP_MIN_WIDTH / DESKTOP_DESIGN_WIDTH, 4)
  })

  it('holds the whole Office floor on the desktop canvas', () => {
    // 24 tiles × 32px, plus the overworld screen (12px) and map region (6px)
    // padding either side — WorldMap.module.css widens `.map` to 768px.
    expect(DESKTOP_DESIGN_WIDTH).toBeGreaterThanOrEqual(24 * 32 + 2 * (12 + 6))
  })

  it('only frames the theater when both gutters have room for the wings', () => {
    // 1024×2000: the wide canvas is width-fit, leaving no gutter — no wings.
    expect(computeStageLayout(1024, 2000).frame).toBe('edge')
    // A squat 900×700 window is a phone-width canvas height-bound to ~0.92×,
    // leaving ~232px either side.
    const squat = computeStageLayout(900, 700)
    expect(squat.width).toBe(DESIGN_WIDTH)
    expect((900 - DESIGN_WIDTH * squat.scale) / 2).toBeGreaterThanOrEqual(THEATER_MIN_GUTTER)
    expect(squat.frame).toBe('theater')
  })

  it('shrinks to fit short viewports instead of cutting content off', () => {
    const { scale, height } = computeStageLayout(844, 390)
    expect(height).toBe(MIN_DESIGN_HEIGHT)
    expect(scale).toBeCloseTo(390 / MIN_DESIGN_HEIGHT, 4)
    // The whole design height stays visible.
    expect(height * scale).toBeLessThanOrEqual(390 + 1)
  })

  it('clamps ultra-tall aspect ratios to the max design height', () => {
    const { height } = computeStageLayout(320, 1200)
    expect(height).toBe(MAX_DESIGN_HEIGHT)
  })

  it('never produces an out-of-range layout across a viewport sweep', () => {
    for (let w = 280; w <= 2600; w += 97) {
      for (let h = 320; h <= 1600; h += 89) {
        const { scale, width, height, frame, shell } = computeStageLayout(w, h)
        const desktop = w >= DESKTOP_MIN_WIDTH
        expect(shell).toBe(desktop ? 'desktop' : 'phone')
        expect(width).toBe(desktop ? DESKTOP_DESIGN_WIDTH : DESIGN_WIDTH)
        expect(scale).toBeGreaterThan(0)
        expect(scale).toBeLessThanOrEqual(desktop ? DESKTOP_MAX_SCALE : 1.35)
        expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
        expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
        // The scaled stage never overflows the viewport in either axis.
        expect(width * scale).toBeLessThanOrEqual(w + 1)
        expect(height * scale).toBeLessThanOrEqual(h + 1)
        // Theater chrome only when the wings actually have room.
        const gutter = (w - width * scale) / 2
        expect(frame).toBe(gutter >= THEATER_MIN_GUTTER ? 'theater' : 'edge')
      }
    }
  })

  it('falls back to the reference layout on degenerate input', () => {
    expect(computeStageLayout(0, 0)).toEqual({
      scale: 1,
      width: 472,
      height: 884,
      frame: 'edge',
      shell: 'phone',
    })
  })

  it('lands the 440×760 playtest viewport in the compact chrome band', () => {
    const { height } = computeStageLayout(440, 760)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(COMPACT_DESIGN_HEIGHT)
    expect(COMPACT_DESIGN_HEIGHT).toBeLessThan(884)
  })
})
