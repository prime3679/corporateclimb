import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import styles from './Stage.module.css'

/** The game's fixed design width; every screen lays out at this width. */
export const DESIGN_WIDTH = 472

/** Reference design height — the height screens are composed against.
 *  The real stage height is fluid (see MIN/MAX below) so phones get a
 *  full-bleed canvas instead of a letterboxed 472×884 strip. */
export const DESIGN_HEIGHT = 884

/** Scale cap on phone- and tablet-width viewports. Phones never reach it
 *  (width-fit binds first below 637px), so it only shapes tablet portrait. */
const MAX_SCALE = 1.35

/** Desktop-class viewports (≥ DESKTOP_MIN_WIDTH) may scale to 2× — an
 *  integer, so the pixel art stays crisp. In practice the height clamp binds
 *  first on 16:9 monitors: 1080p lands at 1080/760 ≈ 1.42, 1440p at ≈ 1.89;
 *  only viewports ≥ 1520px tall reach the cap. Filling more of a landscape
 *  monitor than that needs a wider design width, not a bigger cap. */
export const DESKTOP_MAX_SCALE = 2
export const DESKTOP_MIN_WIDTH = 1024

/** Free backdrop on each side of the stage (real px) before the theater
 *  wings — wordmark spine and keyboard legend — have room to render. */
export const THEATER_MIN_GUTTER = 200

/** Fluid-height clamps, in design units. Screens are flex columns, so
 *  they stretch/compress across this range without per-screen work. */
export const MIN_DESIGN_HEIGHT = 760
export const MAX_DESIGN_HEIGHT = 1060

/** Design-height at or below this gets compact Office chrome (HUD, start
 *  card, celebration). Matches `@container stage (max-height: 820px)`.
 *  The 440×760 playtest viewport lands at ~815. */
export const COMPACT_DESIGN_HEIGHT = 820

/** `edge`: the stage meets (or nearly meets) the viewport sides — phones,
 *  tablets, narrow windows. `theater`: wide desktop, with framed wings. */
export type StageFrame = 'edge' | 'theater'

export interface StageLayout {
  /** Uniform scale applied to the design-space canvas. */
  scale: number
  /** Stage height in design units (width is always DESIGN_WIDTH). */
  height: number
  /** Which backdrop chrome the layout has room for. */
  frame: StageFrame
}

/**
 * Width-fit scaling with fluid height: the canvas always spans the full
 * viewport width (up to the scale cap), and the height flexes between the
 * design clamps to swallow what used to be letterbox. Viewports too
 * short for MIN_DESIGN_HEIGHT (landscape phones, squat desktop windows)
 * fall back to shrink-to-fit so nothing is ever cut off.
 */
export function computeStageLayout(availW: number, availH: number): StageLayout {
  if (!(availW > 0) || !(availH > 0)) return { scale: 1, height: DESIGN_HEIGHT, frame: 'edge' }
  const maxScale = availW >= DESKTOP_MIN_WIDTH ? DESKTOP_MAX_SCALE : MAX_SCALE
  let scale = Math.min(availW / DESIGN_WIDTH, maxScale)
  let height = availH / scale
  if (height < MIN_DESIGN_HEIGHT) {
    scale = Math.min(availH / MIN_DESIGN_HEIGHT, availW / DESIGN_WIDTH, maxScale)
    height = MIN_DESIGN_HEIGHT
  } else if (height > MAX_DESIGN_HEIGHT) {
    height = MAX_DESIGN_HEIGHT
  }
  const gutter = (availW - DESIGN_WIDTH * scale) / 2
  return {
    scale,
    height: Math.round(height),
    frame: gutter >= THEATER_MIN_GUTTER ? 'theater' : 'edge',
  }
}

/** Every binding here is a real handler somewhere in the game — Office
 *  overworld (move / interact / team), BattleScreen (1–4, Tab), and the
 *  Escape handlers on overlays, class select and battle. Nothing listed
 *  is aspirational. */
const KEY_LEGEND: ReadonlyArray<{ label: string; keys: readonly string[] }> = [
  { label: 'Move', keys: ['WASD', '↑↓←→'] },
  { label: 'Interact', keys: ['E'] },
  { label: 'Team', keys: ['P'] },
  { label: 'Attack', keys: ['1', '2', '3', '4'] },
  { label: 'Switch', keys: ['Tab'] },
  { label: 'Back', keys: ['Esc'] },
]

/** Desktop-only frame chrome in the gutters either side of the stage:
 *  a wordmark spine on the left, the keyboard legend on the right. Purely
 *  decorative — inert to pointer and assistive tech. */
function TheaterWings() {
  return (
    <div className={styles.theater} aria-hidden="true">
      <div className={`${styles.wing} ${styles.wingLeft}`}>
        <div className={styles.spine}>
          <span className={styles.spineMark}>Corporate Climb</span>
          <span className={styles.spineRule} />
          <span className={styles.spineSub}>A satirical turn-based RPG</span>
        </div>
      </div>
      <div className={`${styles.wing} ${styles.wingRight}`}>
        <div className={styles.legend}>
          <span className={styles.legendTitle}>Keyboard</span>
          {KEY_LEGEND.map((row) => (
            <div key={row.label} className={styles.legendRow}>
              <span className={styles.legendLabel}>{row.label}</span>
              <span className={styles.legendKeys}>
                {row.keys.map((k) => (
                  <kbd key={k} className={styles.kbd}>
                    {k}
                  </kbd>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Scales the fixed-width design space to fill the viewport. The backdrop
 * is measured directly (ResizeObserver) so safe-area padding and mobile
 * URL-bar collapse are absorbed automatically; `--stage-h` exposes the
 * current design height to any screen that wants it, `--stage-w` the
 * scaled on-screen width the theater wings lay out against.
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
    <div
      ref={backdropRef}
      className={styles.backdrop}
      data-stage-frame={layout.frame}
      style={{ '--stage-w': `${DESIGN_WIDTH * layout.scale}px` } as CSSProperties}
    >
      {layout.frame === 'theater' && <TheaterWings />}
      <div
        className={styles.stage}
        data-testid="stage"
        data-stage-density={layout.height <= COMPACT_DESIGN_HEIGHT ? 'compact' : 'roomy'}
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
