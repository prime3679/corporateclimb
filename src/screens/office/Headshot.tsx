import type { CSSProperties } from 'react'
import { getSpriteUrls } from '@/components/PixelSprite'
import { headshotFocal } from '@/sprites'
import styles from './Headshot.module.css'

export type HeadshotShape = 'circle' | 'badge'

export { ringColorFor } from './ringColor'

/**
 * A portrait cropped to the face — the office's badge photo. One focal
 * crop per sprite (see `sprites.ts`) so every chip, card and dialogue
 * surface shows the same face for the same person. Map tokens use
 * OverworldActor sheets and do not mount this component.
 */
export default function Headshot({
  spriteId,
  size = 40,
  ring = 'var(--cc-gold)',
  shape = 'circle',
  out = false,
  className,
  style,
}: {
  spriteId: string
  size?: number
  ring?: string
  shape?: HeadshotShape
  /** Fainted: desaturated portrait. */
  out?: boolean
  className?: string
  style?: CSSProperties
}) {
  const url = getSpriteUrls()[spriteId]
  const focal = headshotFocal(spriteId)
  const img = size * focal.zoom
  const classes = [styles.frame, styles[shape], out ? styles.out : '', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span
      className={classes}
      style={{ ...style, width: size, height: size, '--hs-ring': ring } as CSSProperties}
      aria-hidden
    >
      {url && (
        <img
          src={url}
          alt=""
          draggable={false}
          className={styles.img}
          style={{
            width: img,
            height: img,
            left: size / 2 - focal.x * img,
            top: size / 2 - focal.y * img,
          }}
        />
      )}
    </span>
  )
}
