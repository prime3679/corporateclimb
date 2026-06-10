import type { AnimState } from '../types'
import { buildSpriteUrls } from '../sprites'

const SPRITE_URLS = buildSpriteUrls()

function useSpriteUrls(): Record<string, string> {
  return SPRITE_URLS
}

export { useSpriteUrls }

export default function PixelSprite({
  spriteId,
  size = 80,
  animState = 'idle',
  flip = false,
}: {
  spriteId: string
  size?: number
  animState?: AnimState
  flip?: boolean
}) {
  const sprites = useSpriteUrls()
  const url = sprites[spriteId]

  const animClass =
    animState === 'attacking'
      ? flip
        ? 'sprite-attack'
        : 'sprite-attack-left'
      : animState === 'hit'
        ? 'sprite-hit'
        : animState === 'faint'
          ? 'sprite-faint'
          : 'sprite-idle'

  return (
    <div
      className={animClass}
      style={{
        width: size,
        position: 'relative',
        overflow: 'visible',
        transform: flip ? 'scaleX(-1)' : 'none',
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{
            width: '100%',
            height: 'auto',
            imageRendering: 'auto',
            display: 'block',
            padding: '8% 2% 0 2%',
            objectFit: 'contain',
            // Uniform ink outline: ties the mixed-style character art into
            // the UI's chunky-outline language so the cast reads as one set.
            filter:
              'drop-shadow(1px 0 0 rgba(38,50,56,0.9)) drop-shadow(-1px 0 0 rgba(38,50,56,0.9)) drop-shadow(0 1px 0 rgba(38,50,56,0.9)) drop-shadow(0 -1px 0 rgba(38,50,56,0.9)) saturate(1.06)',
          }}
          draggable={false}
        />
      )}
    </div>
  )
}
