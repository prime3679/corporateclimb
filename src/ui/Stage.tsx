import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './Stage.module.css'

/** The game's fixed design width; every screen lays out at this width. */
export const DESIGN_WIDTH = 472

/** Reference design height — the height screens are composed against.
 *  The real stage height is fluid (see MIN/MAX below) so phones get a
 *  full-bleed canvas instead of a letterboxed 472×884 strip. */
export const DESIGN_HEIGHT = 884

const MAX_SCALE = 1.35

/** Fluid-height clamps, in design units. Screens are flex columns, so
 *  they stretch/compress across this range without per-screen work. */
export const MIN_DESIGN_HEIGHT = 760
export const MAX_DESIGN_HEIGHT = 1060

export interface StageLayout {
  /** Uniform scale applied to the design-space canvas. */
  scale: number
  /** Stage height in design units (width is always DESIGN_WIDTH). */
  height: number
}

/**
 * Width-fit scaling with fluid height: the canvas always spans the full
 * viewport width (up to MAX_SCALE), and the height flexes between the
 * design clamps to swallow what used to be letterbox. Viewports too
 * short for MIN_DESIGN_HEIGHT (landscape phones, squat desktop windows)
 * fall back to shrink-to-fit so nothing is ever cut off.
 */
export function computeStageLayout(availW: number, availH: number): StageLayout {
  if (!(availW > 0) || !(availH > 0)) return { scale: 1, height: DESIGN_HEIGHT }
  let scale = Math.min(availW / DESIGN_WIDTH, MAX_SCALE)
  let height = availH / scale
  if (height < MIN_DESIGN_HEIGHT) {
    scale = Math.min(availH / MIN_DESIGN_HEIGHT, availW / DESIGN_WIDTH, MAX_SCALE)
    height = MIN_DESIGN_HEIGHT
  } else if (height > MAX_DESIGN_HEIGHT) {
    height = MAX_DESIGN_HEIGHT
  }
  return { scale, height: Math.round(height) }
}

/**
 * Scales the fixed-width design space to fill the viewport. The backdrop
 * is measured directly (ResizeObserver) so safe-area padding and mobile
 * URL-bar collapse are absorbed automatically; `--stage-h` exposes the
 * current design height to any screen that wants it.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const [layout, setLayout] = useState<StageLayout>(() =>
    computeStageLayout(window.innerWidth, window.innerHeight),
  )

  useEffect(() => {
    const el = backdropRef.current
    if (!el) return
    const update = () =>
      setLayout(
        computeStageLayout(
          el.clientWidth || window.innerWidth,
          el.clientHeight || window.innerHeight,
        ),
      )
    update()
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(update)
      ro.observe(el)
      return () => ro.disconnect()
    }
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])

  return (
    <div ref={backdropRef} className={styles.backdrop}>
      <div
        className={styles.stage}
        data-testid="stage"
        style={
          {
            width: DESIGN_WIDTH,
            height: layout.height,
            transform: `scale(${layout.scale})`,
            '--stage-h': `${layout.height}px`,
          } as CSSProperties
        }
      >
        {children}
      </div>
    </div>
  )
}
