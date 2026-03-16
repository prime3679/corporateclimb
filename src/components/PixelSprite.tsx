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
        width: size,
        position: "relative",
        overflow: "visible",
        transform: flip ? "scaleX(-1)" : "none",
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          style={{
            width: "100%",
            height: "auto",
            imageRendering: "auto",
            display: "block",
            padding: "8% 2% 0 2%",
            objectFit: "contain",
          }}
          draggable={false}
        />
      )}
    </div>
  );
}
