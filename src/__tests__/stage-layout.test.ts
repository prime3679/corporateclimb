import { describe, expect, it } from 'vitest'
import { DESIGN_WIDTH, MAX_DESIGN_HEIGHT, MIN_DESIGN_HEIGHT, computeStageLayout } from '@/ui/Stage'

describe('computeStageLayout', () => {
  it('fills a modern phone with no letterbox', () => {
    const { scale, height } = computeStageLayout(390, 844)
    expect(scale).toBeCloseTo(390 / DESIGN_WIDTH, 4)
    // The scaled stage spans the full viewport height (±1px rounding).
    expect(Math.abs(height * scale - 844)).toBeLessThan(1)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
  })

  it('keeps the e2e viewport inside the fluid clamps', () => {
    const { scale, height } = computeStageLayout(440, 760)
    expect(scale).toBeCloseTo(440 / DESIGN_WIDTH, 4)
    expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
    expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
  })

  it('caps the scale on large desktops', () => {
    const { scale, height } = computeStageLayout(1920, 1080)
    expect(scale).toBe(1.35)
    expect(Math.abs(height * scale - 1080)).toBeLessThan(1.35)
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
        const { scale, height } = computeStageLayout(w, h)
        expect(scale).toBeGreaterThan(0)
        expect(scale).toBeLessThanOrEqual(1.35)
        expect(height).toBeGreaterThanOrEqual(MIN_DESIGN_HEIGHT)
        expect(height).toBeLessThanOrEqual(MAX_DESIGN_HEIGHT)
        // The scaled stage never overflows the viewport width.
        expect(DESIGN_WIDTH * scale).toBeLessThanOrEqual(w + 1)
      }
    }
  })

  it('falls back to the reference layout on degenerate input', () => {
    expect(computeStageLayout(0, 0)).toEqual({ scale: 1, height: 884 })
  })
})
