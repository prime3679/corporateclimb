import type { CSSProperties } from 'react'
import type { AnimState } from '@/types'
import PixelSprite from './PixelSprite'
import styles from './StagedSprite.module.css'

/**
 * A character sprite staged on a glowing type-colored ground ring with a
 * soft radial shadow — the cinematic anchor used on the arena, floor
 * intro, class select, and reward screens. The active fighter's ring
 * brightens; a waiting one dims.
 *
 * Sizing is CSS-driven: `size` is the default width (design px), and an
 * ancestor may override it responsively by setting `--staged-size` — the
 * battle arena does this inside `@container stage (min-width: 700px)` so
 * the same markup renders phone-sized combatants on the 472 canvas and
 * larger ones on the 840 desktop canvas. Ring and shadow follow the width.
 */
export default function StagedSprite({
  spriteId,
  size = 120,
  animState = 'idle',
  flip = false,
  ring = 'var(--cc-type-normal)',
  active = true,
  ringScale = 1,
}: {
  spriteId: string
  size?: number
  animState?: AnimState
  flip?: boolean
  /** Ground-ring color (the combatant's primary type). */
  ring?: string
  /** Brighten + pulse the ring when this combatant is acting. */
  active?: boolean
  /** Widen/narrow the ring relative to the sprite. */
  ringScale?: number
}) {
  const vars = {
    '--staged-size-default': `${size}px`,
    '--staged-ring-scale': ringScale,
    '--ring': ring,
  } as CSSProperties
  return (
    <div className={styles.stage} style={vars}>
      <div className={styles.shadow} aria-hidden />
      <div
        className={`${styles.ring} cc-ring ${active ? styles.active : styles.idle}`}
        aria-hidden
      />
      <div className={styles.sprite}>
        <PixelSprite spriteId={spriteId} size="100%" animState={animState} flip={flip} />
      </div>
    </div>
  )
}
