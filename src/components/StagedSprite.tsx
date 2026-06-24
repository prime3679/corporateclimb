import type { AnimState } from '@/types'
import PixelSprite from './PixelSprite'
import styles from './StagedSprite.module.css'

/**
 * A character sprite staged on a glowing type-colored ground ring with a
 * soft radial shadow — the cinematic anchor used on the arena, floor
 * intro, class select, and reward screens. The active fighter's ring
 * brightens; a waiting one dims.
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
  const ringW = size * 0.82 * ringScale
  return (
    <div className={styles.stage} style={{ width: size }}>
      <div
        className={styles.shadow}
        style={{ width: ringW * 1.15, height: ringW * 0.3 }}
        aria-hidden
      />
      <div
        className={`${styles.ring} cc-ring ${active ? styles.active : styles.idle}`}
        style={{ width: ringW, height: ringW * 0.34, '--ring': ring } as React.CSSProperties}
        aria-hidden
      />
      <div className={styles.sprite}>
        <PixelSprite spriteId={spriteId} size={size} animState={animState} flip={flip} />
      </div>
    </div>
  )
}
