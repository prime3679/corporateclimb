import type { AnimState } from "../types";
import { buildSpriteUrls } from "../sprites";

const SPRITE_URLS = buildSpriteUrls();

function useSpriteUrls(): Record<string, string> {
  return SPRITE_URLS;
}

export { useSpriteUrls };

export default function PixelSprite({
  spriteId,
  size = 80,
  animState = "idle",
  flip = false,
}: {
  spriteId: string;
  size?: number;
  animState?: AnimState;
  flip?: boolean;
}) {
  const sprites = useSpriteUrls();
  const url = sprites[spriteId];

  const animClass =
    animState === "attacking" ? "sprite-attack" :
    animState === "hit" ? "sprite-hit" :
    animState === "faint" ? "sprite-faint" :
    "sprite-idle";

  return (
    <div
      className={animClass}
      style={{
        height: size,
        width: size * 0.8,
        position: "relative",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "auto",
            display: "block",
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
