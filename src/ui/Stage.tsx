import { useEffect, useState, type ReactNode } from 'react'
import styles from './Stage.module.css'

/** The game's fixed design space; everything inside lays out at this size. */
export const DESIGN_WIDTH = 420
export const DESIGN_HEIGHT = 750

const MAX_SCALE = 1.6

/**
 * Scales the fixed design space to fit the viewport instead of
 * letterboxing a phone-shaped strip on black. Small screens shrink
 * to fit; large screens scale up (capped so the pixel art stays
 * crisp) over a themed backdrop.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const update = () =>
      setScale(
        Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT, MAX_SCALE),
      )
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  return (
    <div className={styles.backdrop}>
      <div
        className={styles.stage}
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}
