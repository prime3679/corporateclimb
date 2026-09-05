import type { CSSProperties } from 'react'
import { TILE_SIZE, type Facing } from '@/content/office'
import { getSpriteUrls } from '@/components/PixelSprite'
import styles from './OverworldActor.module.css'

interface OverworldActorProps {
  spriteId: string
  ring: string
  facing: Facing
  x: number
  y: number
  phase: number
  player?: boolean
  label: string
}

export default function OverworldActor({
  spriteId,
  ring,
  facing,
  x,
  y,
  phase,
  player = false,
  label,
}: OverworldActorProps) {
  const url = getSpriteUrls()[spriteId]
  return (
    <div
      className={[
        styles.actor,
        styles[`face_${facing}`],
        phase % 2 === 0 ? styles.phaseA : styles.phaseB,
        player ? styles.actorPlayer : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          '--actor-ring': ring,
        } as CSSProperties
      }
      aria-label={label}
      role="img"
    >
      <span className={styles.shadow} aria-hidden />
      <span className={styles.base} aria-hidden />
      {player && <span className={styles.playerAura} aria-hidden />}
      <span className={styles.spriteWrap} aria-hidden>
        {url ? <img src={url} alt="" draggable={false} className={styles.sprite} /> : null}
      </span>
      <span className={styles.facingPip} aria-hidden />
    </div>
  )
}
