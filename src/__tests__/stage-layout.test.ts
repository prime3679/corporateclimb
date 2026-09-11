import { describe, expect, it } from 'vitest'
import {
  COMPACT_DESIGN_HEIGHT,
  DESIGN_WIDTH,
  DESKTOP_MAX_SCALE,
  DESKTOP_MIN_WIDTH,
  MAX_DESIGN_HEIGHT,
  MIN_DESIGN_HEIGHT,
  THEATER_MIN_GUTTER,
  computeStageLayout,
} from '@/ui/Stage'

describe('computeStageLayout', () => {
  it('fills a modern phone with no letterbox', () => {
    const { scale, height, frame } = computeStageLayout(390, 844)
    expect(scale).toBeCloseTo(390 / DESIGN_WIDTH, 4)
    // The scaled stage spans the full viewport height (±1px rounding).
    expect(Math.abs(height * scale - 844)).toBeLessThan(1)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('edge')
  })

  it('keeps the e2e viewport inside the fluid clamps', () => {
    const { scale, height, frame } = computeStageLayout(440, 760)
    expect(scale).toBeCloseTo(440 / DESIGN_WIDTH, 4)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('edge')
  })

  it('lets a 1080p desktop grow past the old 1.35 cap, bounded by the height clamp', () => {
    const { scale, height, frame } = computeStageLayout(1920, 1080)
    // 1080 / 760 — the min design height binds long before the 2× cap.
    expect(scale).toBeCloseTo(1080 / MIN_DESIGN_HEIGHT, 4)
    expect(scale).toBeGreaterThan(1.35)
    expect(height).toBe(MIN_DESIGN_HEIGHT)
    expect(Math.abs(height * scale - 1080)).toBeLessThan(1)
    expect(frame).toBe('theater')
  })

  it('keeps a 1440×900 laptop on the same height-bound scale as before', () => {
    const { scale, height, frame } = computeStageLayout(1440, 900)
    expect(scale).toBeCloseTo(900 / MIN_DESIGN_HEIGHT, 4)
    expect(height).toBe(MIN_DESIGN_HEIGHT)
    expect(frame).toBe('theater')
  })

  it('caps tall desktop viewports at the integer desktop scale', () => {
    const { scale, height, frame } = computeStageLayout(3840, 2160)
    expect(scale).toBe(DESKTOP_MAX_SCALE)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
    expect(frame).toBe('theater')
  })

  it('keeps the 1.35 cap below desktop widths so tablet portrait is unchanged', () => {
    const { scale, height, frame } = computeStageLayout(820, 1180)
    expect(scale).toBe(1.35)
    expect(Math.round(1180 / 1.35)).toBe(height)
    expect(frame).toBe('edge')
    // The first desktop-class width does get the raised cap.
    const wide = computeStageLayout(DESKTOP_MIN_WIDTH, 1600)
    expect(wide.scale).toBeGreaterThan(1.35)
  })

  it('only frames the theater when both gutters have room for the wings', () => {
    // 1024×2000: width-fit at the 2× cap leaves 40px gutters — no wings.
    expect(computeStageLayout(1024, 2000).frame).toBe('edge')
    // A squat 900×700 window is height-bound to ~0.92×, leaving ~232px.
    const squat = computeStageLayout(900, 700)
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
        const { scale, height, frame } = computeStageLayout(w, h)
        expect(scale).toBeGreaterThan(0)
        expect(scale).toBeLessThanOrEqual(w >= DESKTOP_MIN_WIDTH ? DESKTOP_MAX_SCALE : 1.35)
        expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
        expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
        // The scaled stage never overflows the viewport width.
        expect(DESIGN_WIDTH * scale).toBeLessThanOrEqual(w + 1)
        // Theater chrome only when the wings actually have room.
        const gutter = (w - DESIGN_WIDTH * scale) / 2
        expect(frame).toBe(gutter >= THEATER_MIN_GUTTER ? 'theater' : 'edge')
      }
    }
  })

  it('falls back to the reference layout on degenerate input', () => {
    expect(computeStageLayout(0, 0)).toEqual({ scale: 1, height: 884, frame: 'edge' })
  })

  it('lands the 440×760 playtest viewport in the compact chrome band', () => {
    const { height } = computeStageLayout(440, 760)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(COMPACT_DESIGN_HEIGHT)
    expect(COMPACT_DESIGN_HEIGHT).toBeLessThan(884)
  })
})
