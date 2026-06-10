#!/usr/bin/env python3
"""Import a generated character master into the game's sprite format.

Usage: python3 scripts/import_art.py <input.png> <output.webp>

Handles what image generators actually hand back:
- Baked-in checkerboard "transparency" or flat white backgrounds are
  removed with an edge-connected flood fill (tolerant of near-white),
  so whites INSIDE the character (shirts, papers, eyes) survive.
- Content is trimmed to its bounding box and fitted to the repo
  convention: 512x512 canvas, character filling the full height,
  centered horizontally (matches the existing cast's framing).
- Exported as WebP quality 82 with alpha, per the README pipeline.
"""

import sys
from collections import deque

from PIL import Image

NEAR_WHITE_MIN = 232  # all channels above this = background candidate
CANVAS = 512


def remove_background(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()

    def is_bg(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 0 and r >= NEAR_WHITE_MIN and g >= NEAR_WHITE_MIN and b >= NEAR_WHITE_MIN

    seen = bytearray(w * h)
    queue: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_bg(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_bg(x, y) and not seen[y * w + x]:
                seen[y * w + x] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        px[x, y] = (0, 0, 0, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and is_bg(nx, ny):
                seen[ny * w + nx] = 1
                queue.append((nx, ny))
    return im


def fit_to_canvas(im: Image.Image) -> Image.Image:
    bbox = im.split()[3].getbbox()
    if not bbox:
        raise SystemExit('image is fully transparent after background removal')
    content = im.crop(bbox)
    scale = CANVAS / content.height
    content = content.resize(
        (max(1, round(content.width * scale)), CANVAS), Image.LANCZOS
    )
    canvas = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(content, ((CANVAS - content.width) // 2, 0), content)
    return canvas


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(__doc__)
    src, dst = sys.argv[1], sys.argv[2]
    im = fit_to_canvas(remove_background(Image.open(src)))
    im.save(dst, 'WEBP', quality=82)
    print(f'{dst}: 512x512 webp written')


if __name__ == '__main__':
    main()
