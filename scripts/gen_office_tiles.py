#!/usr/bin/env python3
"""Floor 1 office tileset — hand-authored pixel art, one sheet.

Output: public/office/tiles.png (RGBA) plus src/screens/office/tileAtlas.ts,
the name → cell index the WorldMap sprite layer reads.

Every atlas cell is 32×48. The tile footprint is the bottom 32×32 (a floor
tile lives entirely there); props may overflow up to 16px upward so tall
furniture (cabinets, vending, elevator doors, plants) stands above the
person walking behind it. WorldMap draws props and actors row-sorted so the
overflow occludes correctly.

The art language matches scripts/gen_office_actors.py so the cast and the
rooms read as one world: light from the top-left, a lit / base / shadow ramp
per material, one plum ink for silhouettes, selective inner outlines, no
anti-aliasing, no gradients. Floors are mid-value so the ink-outlined actors
pop; walls show a dark cap (the top of the wall) over a warm plaster face
with a baseboard wherever floor lies south of them.

Multi-frame states are consecutive cells in one row (the CSS steps() through
`background-position-x`), so the emitter never wraps a frame group.

Usage:
    python3 scripts/gen_office_tiles.py            # write sheet + atlas
    python3 scripts/gen_office_tiles.py --preview  # also dump a 3× contact sheet to /tmp
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

CELL_W = 32
CELL_H = 48
G = 16  # footprint origin: y=G is the top of the 32×32 floor tile
COLS = 8

ROOT = Path(__file__).resolve().parents[1]
OUT_PNG = ROOT / 'public' / 'office' / 'tiles.png'
OUT_TS = ROOT / 'src' / 'screens' / 'office' / 'tileAtlas.ts'

RGBA = tuple[int, int, int, int]


def hexc(value: str, a: int = 255) -> RGBA:
    v = value.lstrip('#')
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16), a


def mix(a: RGBA, b: RGBA, t: float) -> RGBA:
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(4))  # type: ignore[return-value]


# ---------------------------------------------------------------------------
# Palette — shared ink with the actor sheets, then per-material ramps.
# ---------------------------------------------------------------------------

INK = hexc('#1b1726')
SHADOW = hexc('#100c1a', 96)  # ground shadow under props (alpha)
SHADOW_SOFT = hexc('#100c1a', 56)

# Walls
CAP = hexc('#2c3142')
CAP_LIT = hexc('#414a5e')
CAP_DARK = hexc('#1f2331')
FACE = hexc('#b3aa9c')
FACE_LIT = hexc('#c9c1b3')
FACE_DARK = hexc('#8f877a')
RAIL = hexc('#7f776b')
BASE = hexc('#4a4553')
BASE_LIT = hexc('#655f6e')

# Floors (base, light, dark) per zone
FLOORS = {
    'hall': (hexc('#565c6b'), hexc('#5f6675'), hexc('#4b515f')),
    'reception': (hexc('#7c5a3b'), hexc('#8d6845'), hexc('#684a30')),
    'desks': (hexc('#4b5a7a'), hexc('#54648a'), hexc('#41506d')),
    'break': (hexc('#3f6c63'), hexc('#4b7b71'), hexc('#355952')),
    'meeting': (hexc('#5a4772'), hexc('#664f81'), hexc('#4c3c61')),
    'elevator': (hexc('#8a8282'), hexc('#9a9292'), hexc('#746b6b')),
}

# Materials
WOOD = hexc('#8a5f3b')
WOOD_LIT = hexc('#a97a4c')
WOOD_DARK = hexc('#65452a')
LAM = hexc('#c6a06d')  # desk laminate top
LAM_LIT = hexc('#dcb883')
LAM_DARK = hexc('#a68352')
STEEL = hexc('#9ca7b6')
STEEL_LIT = hexc('#c2cbd6')
STEEL_DARK = hexc('#6b7686')
PLASTIC = hexc('#d4dbe3')
PLASTIC_LIT = hexc('#eef2f6')
PLASTIC_DARK = hexc('#a2acb9')
DARKPL = hexc('#2f3646')  # dark plastic (monitor bezel, machines)
DARKPL_LIT = hexc('#45506a')
DARKPL_DARK = hexc('#232838')
SCREEN = hexc('#0f1620')
SCREEN_GLOW = hexc('#4fb7e8')
SCREEN_GLOW_LIT = hexc('#9fe0ff')
SCREEN_DIM = hexc('#1d3550')
PAPER = hexc('#f2f4f6')
PAPER_LIT = hexc('#ffffff')
PAPER_DARK = hexc('#c5ccd6')
GOLD = hexc('#ffc107')
GOLD_LIT = hexc('#ffe082')
GOLD_DARK = hexc('#b8860b')
NAVY = hexc('#1e2a4a')
NAVY_LIT = hexc('#2c3d68')
RED = hexc('#ff5a5a')
RED_DARK = hexc('#b83a3a')
GREEN = hexc('#4ade80')
GREEN_DARK = hexc('#2d9c58')
FABRIC = hexc('#3d4a68')
FABRIC_LIT = hexc('#4f5f84')
FABRIC_DARK = hexc('#2c3650')
LEAF = hexc('#3f9160')
LEAF_LIT = hexc('#6cc084')
LEAF_DARK = hexc('#2b6a45')
POT = hexc('#a8663c')
POT_LIT = hexc('#c47e4c')
POT_DARK = hexc('#7d4a2a')
GLASS = hexc('#a8d8ff', 88)
GLASS_LIT = hexc('#e6f6ff', 150)
GLASS_EDGE = hexc('#8fc6f0', 220)
SKY = hexc('#1a2b55')
SKY_LOW = hexc('#3d3a6e')
SKY_GLOW = hexc('#6a4a7a')
CITY = hexc('#0f1830')
WINDOW_LIGHT = hexc('#ffd88a')
CORK = hexc('#b98a56')
CORK_DARK = hexc('#8f6a41')
WHITE_BOARD = hexc('#eef1f4')
MARKER_BLUE = hexc('#3b6fd8')
MARKER_RED = hexc('#d84a4a')
MARKER_GREEN = hexc('#2f9e62')
CHALK = hexc('#1d2229')
CHALK_LIT = hexc('#2b323b')
CAKE = hexc('#f6a9c4')
CAKE_LIT = hexc('#ffd3e2')
CAKE_DARK = hexc('#c9799a')
CREAM = hexc('#fff3e0')
MUG_A = hexc('#e05a5a')
MUG_B = hexc('#4f8fd8')
MUG_C = hexc('#f2c14e')
WATER = hexc('#5fc3f0')
WATER_LIT = hexc('#bdeaff')
WATER_DARK = hexc('#2f8ec2')
RUG_RED = (hexc('#7a2f33'), hexc('#9a4448'), hexc('#521e22'), hexc('#e0b060'))
RUG_GOLD = (hexc('#2c3a5c'), hexc('#3a4a72'), hexc('#1e2840'), hexc('#e0b060'))
RUG_NAVY = (hexc('#243452'), hexc('#2f4368'), hexc('#182338'), hexc('#c9a24a'))


# ---------------------------------------------------------------------------
# Cell canvas — footprint-relative coordinates (y in -16..31).
# ---------------------------------------------------------------------------


class Cell:
    def __init__(self) -> None:
        self.px: dict[tuple[int, int], RGBA] = {}

    def put(self, x: int, y: int, c: RGBA | None) -> None:
        if c is None:
            return
        yy = y + G
        if 0 <= x < CELL_W and 0 <= yy < CELL_H:
            self.px[(x, yy)] = c

    def get(self, x: int, y: int) -> RGBA | None:
        return self.px.get((x, y + G))

    def blend(self, x: int, y: int, c: RGBA) -> None:
        """Alpha-composite `c` over whatever is there (used for shadows / glass)."""
        yy = y + G
        if not (0 <= x < CELL_W and 0 <= yy < CELL_H):
            return
        under = self.px.get((x, yy))
        a = c[3] / 255
        if under is None:
            self.px[(x, yy)] = c
            return
        ua = under[3] / 255
        out_a = a + ua * (1 - a)
        if out_a <= 0:
            return
        out = tuple(
            int(round((c[i] * a + under[i] * ua * (1 - a)) / out_a)) for i in range(3)
        )
        self.px[(x, yy)] = (out[0], out[1], out[2], int(round(out_a * 255)))

    def rect(self, x: int, y: int, w: int, h: int, c: RGBA | None) -> None:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.put(xx, yy, c)

    def blend_rect(self, x: int, y: int, w: int, h: int, c: RGBA) -> None:
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.blend(xx, yy, c)

    def hline(self, x: int, y: int, w: int, c: RGBA) -> None:
        self.rect(x, y, w, 1, c)

    def vline(self, x: int, y: int, h: int, c: RGBA) -> None:
        self.rect(x, y, 1, h, c)

    def frame(self, x: int, y: int, w: int, h: int, c: RGBA) -> None:
        self.hline(x, y, w, c)
        self.hline(x, y + h - 1, w, c)
        self.vline(x, y, h, c)
        self.vline(x + w - 1, y, h, c)

    def box(
        self,
        x: int,
        y: int,
        w: int,
        h: int,
        base: RGBA,
        lit: RGBA,
        dark: RGBA,
        ink: bool = True,
    ) -> None:
        """A lit block: top + left edges lit, bottom + right in shadow, ink outline."""
        self.rect(x, y, w, h, base)
        self.hline(x, y, w, lit)
        self.vline(x, y, h, lit)
        self.hline(x, y + h - 1, w, dark)
        self.vline(x + w - 1, y, h, dark)
        if ink:
            self.frame(x - 1, y - 1, w + 2, h + 2, INK)

    def paste(
        self,
        tpl: list[str],
        x0: int,
        y0: int,
        pal: dict[str, RGBA],
        outline: bool = False,
    ) -> None:
        cells: set[tuple[int, int]] = set()
        for dy, ln in enumerate(tpl):
            for dx, ch in enumerate(ln):
                if ch == '.':
                    continue
                x, y = x0 + dx, y0 + dy
                cells.add((x, y))
                self.put(x, y, INK if ch == 'O' else pal[ch])
        if not outline:
            return
        for x, y in cells:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if (nx, ny) not in cells:
                    self.put(nx, ny, INK)

    def outline_mask(self, cells: set[tuple[int, int]]) -> None:
        for x, y in cells:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if (nx, ny) not in cells and self.get(nx, ny) is None:
                    self.put(nx, ny, INK)

    def ground_shadow(self, x: int, y: int, w: int, h: int = 4, soft: bool = True) -> None:
        """Stepped shadow pooled at the footprint bottom, offset right/down."""
        self.blend_rect(x + 1, y, w, h, SHADOW)
        if soft:
            self.blend_rect(x + 2, y + h, w, 1, SHADOW_SOFT)
            self.blend_rect(x + w + 1, y + 1, 1, h - 1, SHADOW_SOFT)

    def to_image(self) -> Image.Image:
        im = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
        for (x, y), c in self.px.items():
            im.putpixel((x, y), c)
        return im


def rows(block: str) -> list[str]:
    out = [ln.strip() for ln in block.strip('\n').splitlines()]
    return [ln for ln in out if ln]


# ---------------------------------------------------------------------------
# 3×5 pixel font for signage.
# ---------------------------------------------------------------------------

FONT = {
    'A': ['.#.', '#.#', '###', '#.#', '#.#'],
    'B': ['##.', '#.#', '##.', '#.#', '##.'],
    'C': ['.##', '#..', '#..', '#..', '.##'],
    'D': ['##.', '#.#', '#.#', '#.#', '##.'],
    'E': ['###', '#..', '##.', '#..', '###'],
    'F': ['###', '#..', '##.', '#..', '#..'],
    'G': ['.##', '#..', '#.#', '#.#', '.##'],
    'H': ['#.#', '#.#', '###', '#.#', '#.#'],
    'I': ['###', '.#.', '.#.', '.#.', '###'],
    'K': ['#.#', '#.#', '##.', '#.#', '#.#'],
    'L': ['#..', '#..', '#..', '#..', '###'],
    'M': ['#.#', '###', '###', '#.#', '#.#'],
    'N': ['##.', '#.#', '#.#', '#.#', '#.#'],
    'O': ['.#.', '#.#', '#.#', '#.#', '.#.'],
    'P': ['##.', '#.#', '##.', '#..', '#..'],
    'R': ['##.', '#.#', '##.', '#.#', '#.#'],
    'S': ['.##', '#..', '.#.', '..#', '##.'],
    'T': ['###', '.#.', '.#.', '.#.', '.#.'],
    'U': ['#.#', '#.#', '#.#', '#.#', '###'],
    'X': ['#.#', '#.#', '.#.', '#.#', '#.#'],
    '1': ['.#.', '##.', '.#.', '.#.', '###'],
    '2': ['##.', '..#', '.#.', '#..', '###'],
    ' ': ['...', '...', '...', '...', '...'],
}


def text(cell: Cell, s: str, x: int, y: int, c: RGBA) -> int:
    """Draw 3×5 caps; returns the width used."""
    cx = x
    for ch in s:
        glyph = FONT[ch]
        for dy, ln in enumerate(glyph):
            for dx, p in enumerate(ln):
                if p == '#':
                    cell.put(cx + dx, y + dy, c)
        cx += 4
    return cx - x - 1


# ---------------------------------------------------------------------------
# Atlas registry
# ---------------------------------------------------------------------------

ATLAS: list[tuple[str, Cell]] = []
NAMES: set[str] = set()


def register(name: str, cell: Cell) -> None:
    if name in NAMES:
        raise SystemExit(f'duplicate tile {name}')
    NAMES.add(name)
    ATLAS.append((name, cell))


def register_group(names: list[str], cells: list[Cell]) -> None:
    """Frame groups stay in one sheet row so CSS can step through them."""
    col = len(ATLAS) % COLS
    if col + len(names) > COLS:
        for _ in range(COLS - col):
            ATLAS.append(('', Cell()))
    for n, c in zip(names, cells):
        register(n, c)


# ---------------------------------------------------------------------------
# Floors
# ---------------------------------------------------------------------------


def floor_base(cell: Cell, base: RGBA) -> None:
    cell.rect(0, 0, 32, 32, base)


def floor_hall() -> Cell:
    base, lit, dark = FLOORS['hall']
    c = Cell()
    floor_base(c, base)
    # low-pile carpet: staggered fleck weave
    for y in range(32):
        for x in range(32):
            if (x + y * 2) % 8 == 0:
                c.put(x, y, lit)
            elif (x + y * 2 + 4) % 8 == 0 and y % 2 == 1:
                c.put(x, y, dark)
    return c


def floor_reception() -> Cell:
    base, lit, dark = FLOORS['reception']
    c = Cell()
    floor_base(c, base)
    # 8px planks, seams staggered by half a plank per row
    for row in range(4):
        y = row * 8
        c.hline(0, y, 32, dark)  # plank seam
        c.hline(0, y + 1, 32, lit)  # lit top edge of plank
        seam_x = (row * 16 + 8) % 32
        c.vline(seam_x, y, 8, dark)
        # grain
        gx = (row * 7 + 3) % 20
        c.hline(gx, y + 4, 6, dark)
        c.hline((gx + 14) % 26, y + 6, 4, dark)
    return c


def floor_desks() -> Cell:
    base, lit, dark = FLOORS['desks']
    c = Cell()
    floor_base(c, base)
    # 16px carpet tiles, quarter-turned so alternate squares hatch the other way
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            horizontal = (qx + qy) % 2 == 0
            for i in range(16):
                for j in range(16):
                    x, y = ox + i, oy + j
                    if horizontal:
                        if j % 4 == 1 and i % 2 == 0:
                            c.put(x, y, lit)
                        elif j % 4 == 3 and i % 2 == 1:
                            c.put(x, y, dark)
                    else:
                        if i % 4 == 1 and j % 2 == 0:
                            c.put(x, y, lit)
                        elif i % 4 == 3 and j % 2 == 1:
                            c.put(x, y, dark)
            c.hline(ox, oy, 16, dark)
            c.vline(ox, oy, 16, dark)
    return c


def floor_break() -> Cell:
    base, lit, dark = FLOORS['break']
    cream = hexc('#8fb3a3')
    c = Cell()
    floor_base(c, base)
    # 8px lino checker with a cream fleck on the light squares
    for qy in range(4):
        for qx in range(4):
            ox, oy = qx * 8, qy * 8
            light_sq = (qx + qy) % 2 == 0
            if light_sq:
                c.rect(ox, oy, 8, 8, lit)
                c.put(ox + 2, oy + 5, cream)
                c.put(ox + 5, oy + 2, cream)
            else:
                c.put(ox + 3, oy + 3, dark)
                c.put(ox + 6, oy + 6, dark)
    for i in range(0, 32, 8):
        c.hline(0, i, 32, dark)
        c.vline(i, 0, 32, dark)
    return c


def floor_meeting() -> Cell:
    base, lit, dark = FLOORS['meeting']
    c = Cell()
    floor_base(c, base)
    # plush carpet with a diamond motif on a 16px repeat
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16 + 8, qy * 16 + 8
            for d in range(4):
                c.put(ox - d, oy - 3 + d, lit)
                c.put(ox + d, oy - 3 + d, lit)
                c.put(ox - d, oy + 3 - d, dark)
                c.put(ox + d, oy + 3 - d, dark)
            c.put(ox, oy, lit)
    for y in range(32):
        for x in range(32):
            if (x * 3 + y * 5) % 11 == 0 and c.get(x, y) == base:
                c.put(x, y, dark)
    return c


def floor_elevator() -> Cell:
    base, lit, dark = FLOORS['elevator']
    grout = hexc('#5a5252')
    c = Cell()
    floor_base(c, base)
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            c.hline(ox, oy, 16, grout)
            c.vline(ox, oy, 16, grout)
            c.hline(ox + 1, oy + 1, 15, lit)
            c.vline(ox + 1, oy + 1, 15, lit)
            c.hline(ox + 1, oy + 15, 15, dark)
            c.vline(ox + 15, oy + 1, 15, dark)
            # speckle
            for k, (sx, sy) in enumerate(((4, 6), (9, 3), (12, 10), (6, 12), (11, 13))):
                c.put(ox + sx, oy + sy, dark if k % 2 else lit)
    return c


def rug_patch(colors: tuple[RGBA, RGBA, RGBA, RGBA], part: str) -> Cell:
    """Rug 9-patch. part is any combination of t/b/l/r (or 'c' for the field)."""
    base, lit, dark, trim = colors
    c = Cell()
    top = 't' in part
    bottom = 'b' in part
    left = 'l' in part
    right = 'r' in part
    c.rect(0, 0, 32, 32, base)
    # field: a woven diamond lattice on an 8px repeat (tiles across cells)
    for y in range(32):
        for x in range(32):
            if (x + y) % 8 == 0 or (x - y) % 8 == 0:
                c.put(x, y, lit)
            elif (x + y) % 8 == 4 and (x - y) % 8 == 4:
                c.put(x, y, dark)
    # border: dark band, gold trim line, dark hairline, then the field
    edges = ((top, 'h', 0), (bottom, 'h', 31), (left, 'v', 0), (right, 'v', 31))
    for on, axis, at in edges:
        if not on:
            continue
        for d, col in enumerate((dark, dark, trim, dark, base, lit, dark)):
            pos = at + d if at == 0 else at - d
            if axis == 'h':
                c.hline(0, pos, 32, col)
            else:
                c.vline(pos, 0, 32, col)
    # fringe on the top / bottom edges
    if top:
        for x in range(1, 32, 2):
            c.put(x, 0, trim)
    if bottom:
        for x in range(1, 32, 2):
            c.put(x, 31, trim)
    # corners: dark square so the trim lines terminate cleanly
    if top and left:
        c.rect(0, 0, 7, 7, dark)
        c.rect(2, 2, 3, 3, trim)
    if top and right:
        c.rect(25, 0, 7, 7, dark)
        c.rect(27, 2, 3, 3, trim)
    if bottom and left:
        c.rect(0, 25, 7, 7, dark)
        c.rect(2, 27, 3, 3, trim)
    if bottom and right:
        c.rect(25, 25, 7, 7, dark)
        c.rect(27, 27, 3, 3, trim)
    return c


# ---------------------------------------------------------------------------
# Walls. mask bits: N=1 E=2 S=4 W=8 → that neighbour is open (not wall).
# S open means the wall's front face is visible below the cap.
# ---------------------------------------------------------------------------

CAP_H = 10


def wall(mask: int) -> Cell:
    n, e, s, w = mask & 1, mask & 2, mask & 4, mask & 8
    c = Cell()
    c.rect(0, 0, 32, 32, CAP)
    if s:
        # face
        c.rect(0, CAP_H, 32, 32 - CAP_H, FACE)
        c.hline(0, CAP_H - 1, 32, INK)
        c.hline(0, CAP_H, 32, FACE_LIT)
        c.hline(0, CAP_H + 1, 32, FACE_LIT)
        c.hline(0, 22, 32, RAIL)  # chair rail
        c.rect(0, 23, 32, 5, FACE_DARK)
        for x in range(0, 32, 4):  # wainscot panelling
            c.vline(x, 23, 5, FACE)
        c.hline(0, 28, 32, INK)
        c.rect(0, 29, 32, 3, BASE)
        c.hline(0, 29, 32, BASE_LIT)
        if w:
            c.vline(0, CAP_H, 22, INK)
            c.vline(1, CAP_H + 1, 21, FACE_LIT)
        if e:
            c.vline(31, CAP_H, 22, INK)
            c.vline(30, CAP_H + 1, 21, FACE_DARK)
    # cap detailing
    c.hline(0, 0, 32, CAP_LIT if n else CAP)
    if n:
        c.hline(0, 1, 32, CAP_LIT)
    if w:
        c.vline(0, 0, CAP_H if s else 32, CAP_LIT)
        c.vline(1, 0, CAP_H if s else 32, CAP_LIT)
    if e:
        c.vline(31, 0, CAP_H if s else 32, CAP_DARK)
    if not s:
        c.hline(0, 31, 32, CAP_DARK)
    # subtle cap texture so long walls are not a flat slab
    for y in range(0, CAP_H if s else 32):
        for x in range(32):
            if (x + y * 3) % 13 == 0 and c.get(x, y) == CAP:
                c.put(x, y, CAP_DARK)
    return c


# ---------------------------------------------------------------------------
# Shade overlays (floor tiles next to walls) — stepped alpha, no blur.
# ---------------------------------------------------------------------------


def shade_w() -> Cell:
    c = Cell()
    for x, a in enumerate((72, 54, 38, 24, 12)):
        c.rect(x, 0, 1, 32, hexc('#0a0812', a))
    return c


def shade_n() -> Cell:
    """Floor directly south of a wall: the wall's drop shadow, stepped."""
    c = Cell()
    for y, a in enumerate((118, 98, 78, 60, 44, 30, 18, 8)):
        c.rect(0, y, 32, 1, hexc('#0a0812', a))
    return c


# ---------------------------------------------------------------------------
# Doorways — drawn over the floor. Walkable openings must read as open.
# ---------------------------------------------------------------------------

TRACK = hexc('#b9c3cf')
TRACK_DARK = hexc('#6f7a89')


def door_v(part: str) -> Cell:
    """Segment of a vertical glass partition, fully retracted ('top' | 'mid' | 'bot').

    A bright aluminium floor track runs down the wall axis; the glass leaves
    are stacked against the north and south jambs so the middle is plainly
    open floor."""
    c = Cell()
    c.vline(14, 0, 32, TRACK_DARK)
    c.rect(15, 0, 3, 32, TRACK)
    c.vline(15, 0, 32, STEEL_LIT)
    c.vline(18, 0, 32, TRACK_DARK)
    for y in range(2, 32, 6):
        c.put(16, y, TRACK_DARK)  # track screws
    if part in ('top', 'bot'):
        y0 = 0 if part == 'top' else 20
        # jamb post
        c.rect(13, y0, 7, 12, STEEL_DARK)
        c.rect(14, y0, 5, 12, STEEL)
        c.vline(14, y0, 12, STEEL_LIT)
        c.frame(12, y0 - 1, 9, 14, INK)
        # glass leaf folded flat against the post, sticking out east
        c.blend_rect(20, y0 + 1, 8, 10, GLASS)
        c.hline(20, y0 + 1, 8, GLASS_EDGE)
        c.hline(20, y0 + 10, 8, GLASS_EDGE)
        c.vline(27, y0 + 1, 10, GLASS_EDGE)
        c.frame(20, y0, 9, 12, INK)
        c.put(21, y0 + 2, GLASS_LIT)
        c.put(22, y0 + 2, GLASS_LIT)
        c.put(21, y0 + 3, GLASS_LIT)
        # handle
        c.vline(25, y0 + 4, 4, STEEL_DARK)
    return c


def door_h() -> Cell:
    """Single doorway in a horizontal wall: header at cap level, open below."""
    c = Cell()
    # header / lintel matching the cap band of the neighbouring wall
    c.rect(0, 0, 32, CAP_H, CAP)
    c.hline(0, 0, 32, CAP_LIT)
    c.hline(0, CAP_H - 1, 32, INK)
    c.rect(2, 2, 28, 6, STEEL_DARK)
    c.hline(2, 2, 28, STEEL)
    # green running-man style exit light in the header
    c.rect(13, 3, 6, 4, GREEN_DARK)
    c.rect(14, 4, 4, 2, GREEN)
    # jambs
    c.rect(0, CAP_H, 3, 22, FACE)
    c.vline(0, CAP_H, 22, FACE_LIT)
    c.vline(2, CAP_H, 22, INK)
    c.rect(29, CAP_H, 3, 22, FACE)
    c.vline(31, CAP_H, 22, FACE_DARK)
    c.vline(29, CAP_H, 22, INK)
    c.rect(0, 29, 3, 3, BASE)
    c.rect(29, 29, 3, 3, BASE)
    # threshold plate
    c.hline(3, 30, 26, TRACK)
    c.hline(3, 31, 26, TRACK_DARK)
    # open glass leaves folded back against each jamb
    for x0 in (3, 25):
        c.blend_rect(x0, CAP_H, 4, 19, GLASS)
        c.vline(x0 if x0 == 3 else x0 + 3, CAP_H, 19, GLASS_EDGE)
        c.hline(x0, CAP_H, 4, GLASS_EDGE)
        c.hline(x0, CAP_H + 18, 4, INK)
        c.put(x0 + 1, CAP_H + 2, GLASS_LIT)
        c.put(x0 + 1, CAP_H + 3, GLASS_LIT)
    return c


# ---------------------------------------------------------------------------
# Wall-face decor (32×32 overlays on face tiles).
# ---------------------------------------------------------------------------


def window(part: str) -> Cell:
    c = Cell()
    x0 = 3 if part == 'l' else 0
    x1 = 32 if part == 'l' else 29
    w = x1 - x0
    c.rect(x0, 11, w, 15, SKY)
    # dusk band + city
    c.rect(x0, 20, w, 3, SKY_LOW)
    c.rect(x0, 23, w, 3, CITY)
    c.hline(x0, 22, w, SKY_GLOW)
    for i in range(x0, x1):
        if (i * 7) % 5 == 0:
            c.vline(i, 20 + (i % 3), 1 + (i % 2), CITY)
        if (i * 11) % 7 == 0:
            c.put(i, 24, WINDOW_LIGHT)
    # blinds, half drawn
    for y in range(12, 17, 2):
        c.hline(x0, y, w, FACE_LIT)
        c.hline(x0, y + 1, w, FACE_DARK)
    # frame
    c.frame(x0 - 1, 10, w + 2, 17, INK)
    c.rect(x0 - 1, 27, w + 2, 2, FACE_LIT)  # sill
    c.hline(x0 - 1, 29, w + 2, FACE_DARK)
    if part == 'l':
        c.vline(x0 - 1, 10, 17, INK)
        c.vline(x0, 11, 15, FACE_LIT)
    else:
        c.vline(x1, 10, 17, INK)
        c.vline(x1 - 1, 11, 15, FACE_DARK)
    # remove the frame on the shared middle edge so both halves join
    if part == 'l':
        c.vline(31, 11, 15, SKY)
        c.rect(31, 20, 1, 3, SKY_LOW)
        c.rect(31, 23, 1, 3, CITY)
        c.put(31, 22, SKY_GLOW)
        for y in range(12, 17, 2):
            c.put(31, y, FACE_LIT)
            c.put(31, y + 1, FACE_DARK)
    else:
        c.vline(0, 11, 15, SKY)
        c.rect(0, 20, 1, 3, SKY_LOW)
        c.rect(0, 23, 1, 3, CITY)
        c.put(0, 22, SKY_GLOW)
        for y in range(12, 17, 2):
            c.put(0, y, FACE_LIT)
            c.put(0, y + 1, FACE_DARK)
    return c


def whiteboard(part: str) -> Cell:
    c = Cell()
    x0 = 2 if part == 'l' else 0
    x1 = 32 if part == 'l' else 30
    w = x1 - x0
    c.rect(x0, 11, w, 15, WHITE_BOARD)
    c.rect(x0, 26, w, 2, STEEL)  # marker tray
    c.hline(x0, 27, w, STEEL_DARK)
    if part == 'l':
        c.vline(x0, 11, 17, INK)
        c.hline(x0, 10, w, INK)
        c.hline(x0, 28, w, INK)
        # a chart going up (naturally)
        for i, h in enumerate((2, 3, 5, 4, 7)):
            c.rect(6 + i * 4, 24 - h, 3, h, MARKER_BLUE if i % 2 == 0 else MARKER_GREEN)
        c.hline(5, 24, 22, INK)
        c.vline(5, 13, 12, INK)
        c.hline(x0 + 3, 13, 9, MARKER_RED)
        c.put(4, 13, MARKER_RED)
        c.put(8, 14, MARKER_RED)
        c.put(9, 14, MARKER_RED)
    else:
        c.vline(x1 - 1, 11, 17, INK)
        c.hline(0, 10, w, INK)
        c.hline(0, 28, w, INK)
        # bullet list
        for i in range(4):
            y = 13 + i * 3
            c.put(3, y, MARKER_BLUE)
            c.hline(5, y, 10 + (i * 5) % 9, MARKER_BLUE if i != 2 else MARKER_RED)
        c.rect(20, 14, 7, 7, MARKER_RED)
        c.rect(21, 15, 5, 5, WHITE_BOARD)
        c.hline(22, 17, 3, MARKER_RED)
        # magnets
        c.put(24, 24, MARKER_GREEN)
        c.put(27, 24, MARKER_BLUE)
    return c


def pinboard() -> Cell:
    c = Cell()
    c.rect(5, 11, 22, 15, CORK)
    for y in range(11, 26):
        for x in range(5, 27):
            if (x * 3 + y * 5) % 7 == 0:
                c.put(x, y, CORK_DARK)
    c.frame(4, 10, 24, 17, WOOD_DARK)
    c.frame(3, 9, 26, 19, INK)
    # pinned notes
    c.rect(7, 13, 6, 6, PAPER)
    c.put(9, 13, MARKER_RED)
    c.rect(15, 12, 8, 5, hexc('#ffe27a'))
    c.hline(16, 14, 5, CORK_DARK)
    c.put(18, 12, MARKER_BLUE)
    c.rect(9, 20, 9, 4, hexc('#a8d8ff'))
    c.hline(10, 22, 6, hexc('#4b7fbf'))
    c.rect(20, 19, 5, 6, PAPER)
    c.put(22, 19, MARKER_GREEN)
    return c


def clock() -> Cell:
    c = Cell()
    tpl = rows(
        """
        ...OOOOO...
        ..OwwwwwO..
        .OwwwWwwwO.
        OwwwwWwwwwO
        OwwwwWwwwwO
        OwwWWWWwwwO
        OwwwwwwwwwO
        OwwwwwwwwwO
        .OwwwwwwwO.
        ..OwwwwwO..
        ...OOOOO...
        """
    )
    c.paste(tpl, 10, 11, {'w': PAPER, 'W': INK})
    c.put(15, 12, RED)
    c.put(15, 20, INK)
    c.put(11, 16, INK)
    c.put(19, 16, INK)
    return c


def logo(part: str) -> Cell:
    """Reception plaque, 3 tiles wide: rising-bars mark + 'CORPORATE CLIMB' in gold.

    The plaque is authored in 96px space; each cell draws it at its own offset
    (Cell.put clips), so the text runs seamlessly across the tile seams."""
    c = Cell()
    off = {'l': 0, 'm': -32, 'r': -64}[part]
    c.rect(0, 11, 32, 15, NAVY)
    c.hline(0, 11, 32, NAVY_LIT)
    c.hline(0, 10, 32, INK)
    c.hline(0, 26, 32, INK)
    c.hline(0, 27, 32, FACE_DARK)
    if part == 'l':
        c.vline(0, 10, 17, INK)
        c.vline(1, 11, 15, NAVY_LIT)
    if part == 'r':
        c.vline(31, 10, 17, INK)
        c.vline(30, 11, 15, hexc('#141c33'))
    # rising bar mark
    for i, h in enumerate((3, 5, 8, 11)):
        c.rect(off + 5 + i * 4, 23 - h, 3, h, GOLD if i < 3 else GOLD_LIT)
    c.hline(off + 4, 23, 17, GOLD_DARK)
    c.put(off + 21, 12, GOLD_LIT)
    c.put(off + 22, 13, GOLD_LIT)
    text(c, 'CORPORATE CLIMB', off + 26, 13, GOLD)
    c.hline(off + 26, 19, 59, GOLD_DARK)
    text(c, 'FLOOR 1', off + 62, 20, PAPER)
    return c


def menu_board(part: str) -> Cell:
    c = Cell()
    x0 = 2 if part == 'l' else 0
    x1 = 32 if part == 'l' else 30
    c.rect(x0, 11, x1 - x0, 15, CHALK)
    for y in range(11, 26):
        for x in range(x0, x1):
            if (x + y * 2) % 9 == 0:
                c.put(x, y, CHALK_LIT)
    c.hline(x0, 10, x1 - x0, WOOD_DARK)
    c.hline(x0, 26, x1 - x0, WOOD_DARK)
    c.hline(x0, 9, x1 - x0, INK)
    c.hline(x0, 27, x1 - x0, INK)
    if part == 'l':
        c.vline(x0, 9, 19, INK)
        c.vline(x0 + 1, 10, 17, WOOD_DARK)
        text(c, 'COFFEE', 6, 13, PAPER)
        c.hline(6, 19, 20, hexc('#f2c14e'))
        text(c, 'TEA', 6, 21, hexc('#8fd3a3'))
    else:
        c.vline(x1 - 1, 9, 19, INK)
        c.vline(x1 - 2, 10, 17, WOOD_DARK)
        # chalk mug doodle + "FREE"
        c.frame(3, 13, 8, 9, PAPER)
        c.rect(4, 14, 6, 7, CHALK)
        c.vline(11, 15, 4, PAPER)
        c.put(12, 16, PAPER)
        c.put(12, 17, PAPER)
        c.put(5, 11, PAPER)
        c.put(7, 11, PAPER)
        text(c, 'FREE', 14, 15, hexc('#ff9f9f'))
    return c


def shelf_mugs() -> Cell:
    c = Cell()
    c.rect(3, 19, 26, 2, WOOD)
    c.hline(3, 19, 26, WOOD_LIT)
    c.hline(3, 21, 26, INK)
    c.rect(4, 22, 2, 2, WOOD_DARK)
    c.rect(26, 22, 2, 2, WOOD_DARK)
    for i, col in enumerate((MUG_A, MUG_B, MUG_C, PAPER)):
        x = 5 + i * 6
        c.rect(x, 14, 4, 5, col)
        c.hline(x, 14, 4, mix(col, PAPER_LIT, 0.4))
        c.vline(x + 4, 15, 3, col)
        c.frame(x - 1, 13, 6, 7, INK)
        c.put(x + 4, 14, INK)
        c.put(x + 4, 18, INK)
        c.put(x + 5, 15, INK)
        c.put(x + 5, 16, INK)
        c.put(x + 5, 17, INK)
    return c


def poster() -> Cell:
    c = Cell()
    c.rect(8, 11, 16, 16, hexc('#243a63'))
    # mountain + flag
    for i in range(6):
        c.hline(15 - i, 18 + i, 1 + i * 2, hexc('#6d8bb8'))
    for i in range(3):
        c.hline(15 - i, 18 + i, 1 + i * 2, PAPER)
    c.vline(15, 14, 4, INK)
    c.rect(16, 14, 3, 2, GOLD)
    c.hline(10, 24, 12, GOLD_DARK)
    c.hline(11, 25, 10, GOLD)
    c.frame(7, 10, 18, 18, INK)
    return c


def extinguisher() -> Cell:
    c = Cell()
    c.rect(13, 13, 6, 12, RED)
    c.vline(13, 13, 12, hexc('#ff8a8a'))
    c.vline(18, 13, 12, RED_DARK)
    c.rect(14, 11, 4, 2, STEEL_DARK)
    c.rect(15, 9, 2, 2, STEEL)
    c.hline(17, 10, 3, STEEL_DARK)
    c.rect(14, 16, 4, 3, PAPER)
    c.frame(12, 12, 8, 14, INK)
    c.put(14, 10, INK)
    c.put(17, 9, INK)
    # wall bracket
    c.rect(11, 20, 10, 1, STEEL_DARK)
    return c


def vent() -> Cell:
    c = Cell()
    c.rect(8, 12, 16, 8, STEEL_DARK)
    for y in range(13, 20, 2):
        c.hline(9, y, 14, STEEL)
    c.frame(7, 11, 18, 10, INK)
    return c


def sign_room(label: str) -> Cell:
    c = Cell()
    w = len(label) * 4 + 3
    x0 = (32 - w) // 2
    c.rect(x0, 13, w, 9, DARKPL)
    c.hline(x0, 13, w, DARKPL_LIT)
    c.frame(x0 - 1, 12, w + 2, 11, INK)
    text(c, label, x0 + 2, 15, PAPER)
    return c


# ---------------------------------------------------------------------------
# Props
# ---------------------------------------------------------------------------


def monitor(c: Cell, x: int, y: int, frame: int, wide: bool = False) -> None:
    w = 14 if wide else 12
    c.rect(x, y, w, 9, DARKPL)
    c.hline(x, y, w, DARKPL_LIT)
    c.vline(x, y, 9, DARKPL_LIT)
    c.frame(x - 1, y - 1, w + 2, 11, INK)
    c.rect(x + 1, y + 1, w - 2, 6, SCREEN)
    # screen content: a doc with a blinking cursor / a chart
    c.hline(x + 2, y + 2, w - 6, SCREEN_GLOW)
    c.hline(x + 2, y + 4, w - 4, SCREEN_DIM)
    c.hline(x + 2, y + 5, w - 8, SCREEN_DIM)
    if frame == 0:
        c.put(x + w - 4, y + 5, SCREEN_GLOW_LIT)
    else:
        c.put(x + 3, y + 2, SCREEN_GLOW_LIT)
    # stand
    c.rect(x + w // 2 - 1, y + 9, 2, 2, DARKPL_DARK)
    c.rect(x + w // 2 - 3, y + 11, 6, 1, DARKPL)
    c.hline(x + w // 2 - 3, y + 12, 6, INK)


def keyboard(c: Cell, x: int, y: int) -> None:
    c.rect(x, y, 10, 3, PLASTIC)
    c.hline(x, y, 10, PLASTIC_LIT)
    c.hline(x, y + 2, 10, PLASTIC_DARK)
    for i in range(1, 10, 2):
        c.put(x + i, y + 1, PLASTIC_DARK)
    c.frame(x - 1, y - 1, 12, 5, INK)


def desk(part: str, frame: int) -> Cell:
    """Work desk. Footprint 32 wide; the top overflows 6px above the tile."""
    c = Cell()
    left_end = part == 'l'
    right_end = part == 'r'
    x0 = 2 if left_end else 0
    x1 = 30 if right_end else 32
    w = x1 - x0
    # ground shadow + legs
    c.ground_shadow(x0 + 1, 27, w - 3, 3)
    if left_end:
        c.rect(3, 22, 2, 8, WOOD_DARK)
    if right_end:
        c.rect(27, 22, 2, 8, WOOD_DARK)
    # modesty panel (front face)
    c.rect(x0, 16, w, 8, WOOD)
    c.hline(x0, 16, w, WOOD_LIT)
    c.rect(x0, 23, w, 2, WOOD_DARK)
    # top surface
    c.rect(x0, -6, w, 22, LAM)
    c.hline(x0, -6, w, LAM_LIT)
    c.hline(x0, -5, w, LAM_LIT)
    c.rect(x0, 13, w, 3, LAM_DARK)  # front edge of the top
    c.hline(x0, 15, w, INK)
    # top ink outline on open ends
    c.hline(x0, -7, w, INK)
    c.hline(x0, 25, w, INK)
    if left_end:
        c.vline(x0 - 1, -7, 33, INK)
        c.vline(x0, -6, 22, LAM_LIT)
    if right_end:
        c.vline(x1, -7, 33, INK)
        c.vline(x1 - 1, -6, 22, LAM_DARK)
    # desk kit varies by segment
    if part == 'l':
        monitor(c, 10, -4, frame)
        keyboard(c, 10, 9)
        c.rect(24, 6, 4, 3, PLASTIC)  # mouse
        c.frame(23, 5, 6, 5, INK)
    elif part == 'm':
        monitor(c, 9, -4, frame, wide=True)
        keyboard(c, 10, 9)
        c.rect(3, 2, 4, 6, MUG_B)  # mug
        c.hline(3, 2, 4, hexc('#8fb8ee'))
        c.frame(2, 1, 6, 8, INK)
        c.put(7, 3, INK)
        c.put(7, 6, INK)
    else:
        # paper stack + phone
        c.rect(6, -2, 12, 9, PAPER)
        c.hline(6, -2, 12, PAPER_LIT)
        c.vline(17, -2, 9, PAPER_DARK)
        c.frame(5, -3, 14, 11, INK)
        c.hline(8, 0, 8, PAPER_DARK)
        c.hline(8, 2, 6, PAPER_DARK)
        c.hline(8, 4, 7, PAPER_DARK)
        c.rect(21, -1, 6, 10, DARKPL)
        c.hline(21, -1, 6, DARKPL_LIT)
        c.frame(20, -2, 8, 12, INK)
        c.rect(22, 1, 4, 3, SCREEN_DIM)
        c.put(23, 6, RED)
        c.rect(6, 9, 7, 2, hexc('#f4d35e'))  # sticky note
        c.frame(5, 8, 9, 4, INK)
    return c


def reception_desk(part: str) -> Cell:
    """Tall reception counter, gold accent stripe, faces the lobby."""
    c = Cell()
    left_end = part == 'l'
    right_end = part == 'r'
    x0 = 1 if left_end else 0
    x1 = 31 if right_end else 32
    w = x1 - x0
    c.ground_shadow(x0 + 1, 28, w - 3, 3)
    # counter front (dark panel) with gold band
    c.rect(x0, 8, w, 20, NAVY)
    c.hline(x0, 8, w, NAVY_LIT)
    c.rect(x0, 26, w, 2, hexc('#141c33'))
    c.rect(x0, 13, w, 2, GOLD)
    c.hline(x0, 13, w, GOLD_LIT)
    c.hline(x0, 15, w, GOLD_DARK)
    # counter top (stone)
    top = hexc('#b8b0b8')
    top_lit = hexc('#d2cad2')
    top_dark = hexc('#8f878f')
    c.rect(x0, -8, w, 15, top)
    c.hline(x0, -8, w, top_lit)
    c.hline(x0, -7, w, top_lit)
    c.rect(x0, 5, w, 2, top_dark)
    c.hline(x0, 7, w, INK)
    c.hline(x0, -9, w, INK)
    c.hline(x0, 28, w, INK)
    if left_end:
        c.vline(x0 - 1, -9, 38, INK)
        c.vline(x0, -8, 15, top_lit)
    if right_end:
        c.vline(x1, -9, 38, INK)
        c.vline(x1 - 1, -8, 15, top_dark)
    if part == 'l':
        # visitor sign-in sheet + pen
        c.rect(8, -5, 14, 9, PAPER)
        c.hline(8, -5, 14, PAPER_LIT)
        c.frame(7, -6, 16, 11, INK)
        c.hline(10, -2, 10, PAPER_DARK)
        c.hline(10, 0, 8, PAPER_DARK)
        c.hline(10, 2, 9, PAPER_DARK)
        c.rect(24, -3, 2, 7, NAVY_LIT)
        c.put(24, 4, INK)
        c.put(25, 4, INK)
    elif part == 'm':
        monitor(c, 10, -7, 0)
        # name plate on the gold band
        c.rect(11, 18, 10, 4, PAPER)
        c.frame(10, 17, 12, 6, INK)
        c.hline(12, 19, 8, NAVY)
        c.hline(13, 20, 6, NAVY)
    else:
        # service bell + brochure stand
        c.rect(7, -2, 8, 3, GOLD)
        c.hline(7, -2, 8, GOLD_LIT)
        c.rect(8, -4, 6, 2, GOLD)
        c.rect(10, -6, 2, 2, GOLD_DARK)
        c.frame(6, -3, 10, 5, INK)
        c.hline(7, -5, 8, INK)
        c.put(9, -6, INK)
        c.put(12, -6, INK)
        c.put(10, -7, INK)
        c.put(11, -7, INK)
        c.rect(18, -6, 9, 10, STEEL_DARK)
        c.rect(19, -5, 7, 8, PAPER)
        c.rect(19, -5, 7, 2, MUG_B)
        c.hline(20, -1, 5, PAPER_DARK)
        c.hline(20, 1, 4, PAPER_DARK)
        c.frame(17, -7, 11, 12, INK)
    return c


def chair(facing: str) -> Cell:
    """Office chair. 'n' = back toward us (tucked at a desk), 's' = seat toward us."""
    c = Cell()
    c.ground_shadow(9, 27, 13, 3)
    if facing == 'n':
        # seat peeks out above; the back rest (closer to us) covers most of it
        c.rect(10, 9, 12, 8, FABRIC)
        c.hline(10, 9, 12, FABRIC_LIT)
        c.frame(9, 8, 14, 10, INK)
        # armrests
        c.rect(6, 13, 3, 7, DARKPL)
        c.rect(23, 13, 3, 7, DARKPL)
        c.frame(5, 12, 5, 9, INK)
        c.frame(22, 12, 5, 9, INK)
        # back rest with rounded top and a headrest band
        c.rect(9, 13, 14, 11, FABRIC)
        c.rect(10, 12, 12, 1, FABRIC)
        c.hline(10, 12, 12, FABRIC_LIT)
        c.hline(9, 13, 14, FABRIC_LIT)
        c.vline(9, 13, 11, FABRIC_LIT)
        c.rect(9, 22, 14, 2, FABRIC_DARK)
        c.vline(22, 13, 11, FABRIC_DARK)
        c.rect(11, 15, 10, 2, FABRIC_LIT)  # headrest band
        c.hline(11, 19, 10, FABRIC_DARK)  # lumbar stitch
        c.hline(10, 11, 12, INK)
        c.put(9, 12, INK)
        c.put(22, 12, INK)
        c.vline(8, 13, 11, INK)
        c.vline(23, 13, 11, INK)
        c.hline(9, 24, 14, INK)
        c.rect(15, 25, 2, 3, STEEL_DARK)
    else:
        # back rest behind, seat in front
        c.rect(8, 5, 16, 9, FABRIC)
        c.hline(8, 5, 16, FABRIC_LIT)
        c.vline(8, 5, 9, FABRIC_LIT)
        c.rect(8, 12, 16, 2, FABRIC_DARK)
        c.frame(7, 4, 18, 11, INK)
        c.hline(11, 8, 10, FABRIC_DARK)
        c.rect(10, 15, 12, 8, FABRIC)
        c.hline(10, 15, 12, FABRIC_LIT)
        c.vline(10, 15, 8, FABRIC_LIT)
        c.rect(10, 21, 12, 2, FABRIC_DARK)
        c.frame(9, 14, 14, 10, INK)
        c.rect(15, 24, 2, 3, STEEL_DARK)
        # armrests
        c.rect(6, 14, 3, 6, DARKPL)
        c.rect(23, 14, 3, 6, DARKPL)
        c.frame(5, 13, 5, 8, INK)
        c.frame(22, 13, 5, 8, INK)
    # star base
    c.rect(11, 27, 10, 2, STEEL_DARK)
    c.hline(11, 27, 10, STEEL)
    c.hline(9, 28, 3, STEEL_DARK)
    c.hline(20, 28, 3, STEEL_DARK)
    c.hline(10, 29, 12, INK)
    c.put(9, 29, INK)
    c.put(22, 29, INK)
    return c


def printer(state: str, frame: int = 0) -> Cell:
    c = Cell()
    c.ground_shadow(4, 27, 24, 3)
    # body
    c.box(5, 6, 22, 22, PLASTIC, PLASTIC_LIT, PLASTIC_DARK)
    c.rect(5, 18, 22, 2, PLASTIC_DARK)  # tray seam
    c.hline(5, 20, 22, INK)
    c.rect(7, 22, 18, 4, DARKPL)  # output slot
    c.hline(7, 22, 18, DARKPL_DARK)
    # top lid / scanner
    c.box(8, 0, 16, 5, PLASTIC_DARK, PLASTIC, DARKPL_LIT)
    c.rect(9, 1, 14, 1, PLASTIC_LIT)
    # control panel with screen
    c.rect(8, 9, 10, 6, DARKPL)
    c.frame(7, 8, 12, 8, INK)
    if state == 'error':
        c.rect(9, 10, 8, 4, RED_DARK)
        c.rect(10, 11, 6, 2, RED)
        c.put(12, 11, PAPER_LIT)
        c.put(13, 11, PAPER_LIT)
        c.put(12, 12, PAPER_LIT)
        c.put(13, 12, PAPER_LIT)
        # jam light on top
        c.rect(24, 8, 2, 2, RED)
        # a crumpled sheet stuck in the slot
        c.rect(12, 21, 8, 3, PAPER_DARK)
        c.put(14, 21, PAPER)
        c.put(17, 22, PAPER)
    else:
        c.rect(9, 10, 8, 4, GREEN_DARK)
        c.rect(10, 11, 6, 2, GREEN)
        c.hline(11, 11, 3, SCREEN)
        c.put(24, 8, GREEN)
        c.put(25, 8, GREEN)
    # buttons
    c.rect(20, 10, 4, 2, DARKPL_LIT)
    c.rect(20, 13, 4, 2, DARKPL_LIT)
    c.put(21, 10, PLASTIC_LIT)
    if state == 'printing':
        # pages fanning out of the slot, two frames
        if frame == 0:
            c.rect(9, 24, 14, 5, PAPER)
            c.hline(9, 24, 14, PAPER_LIT)
            c.frame(8, 23, 16, 7, INK)
            c.hline(11, 26, 9, PAPER_DARK)
            c.hline(11, 27, 6, PAPER_DARK)
        else:
            c.rect(10, 25, 14, 5, PAPER)
            c.hline(10, 25, 14, PAPER_LIT)
            c.frame(9, 24, 16, 7, INK)
            c.hline(12, 27, 9, PAPER_DARK)
            c.hline(12, 28, 5, PAPER_DARK)
            c.rect(9, 23, 12, 2, PAPER)
            c.hline(9, 22, 12, INK)
    elif state == 'working':
        c.rect(10, 25, 12, 3, PAPER)
        c.frame(9, 24, 14, 5, INK)
    return c


def cabinet(open_: bool) -> Cell:
    c = Cell()
    c.ground_shadow(4, 27, 24, 3)
    c.box(5, -10, 22, 38, STEEL, STEEL_LIT, STEEL_DARK)
    # plinth
    c.rect(5, 25, 22, 3, STEEL_DARK)
    if not open_:
        c.vline(16, -10, 35, INK)  # door split
        c.vline(15, -9, 33, STEEL_DARK)
        c.vline(17, -9, 33, STEEL_LIT)
        c.rect(13, 6, 2, 6, INK)  # handles
        c.rect(18, 6, 2, 6, INK)
        c.put(13, 7, STEEL_LIT)
        c.put(18, 7, STEEL_LIT)
        # label plate
        c.rect(8, -6, 6, 4, PAPER)
        c.hline(9, -4, 4, PAPER_DARK)
        c.frame(7, -7, 8, 6, INK)
    else:
        # dark interior, shelves, supplies; the right door swung open to the right
        c.rect(6, -9, 20, 34, DARKPL_DARK)
        for sy in (2, 13):
            c.rect(6, sy, 20, 2, STEEL_DARK)
            c.hline(6, sy, 20, STEEL)
        # shelf 1: toner boxes
        c.rect(8, -6, 6, 7, GOLD)
        c.hline(8, -6, 6, GOLD_LIT)
        c.frame(7, -7, 8, 9, INK)
        c.rect(16, -4, 7, 5, MUG_B)
        c.frame(15, -5, 9, 7, INK)
        c.hline(17, -2, 4, PAPER)
        # shelf 2: paper reams
        c.rect(8, 6, 8, 6, PAPER)
        c.hline(8, 6, 8, PAPER_LIT)
        c.frame(7, 5, 10, 8, INK)
        c.hline(9, 9, 5, PAPER_DARK)
        c.rect(18, 8, 6, 4, MUG_A)
        c.frame(17, 7, 8, 6, INK)
        # shelf 3: binders
        for i, col in enumerate((NAVY_LIT, GREEN_DARK, RED_DARK, NAVY_LIT)):
            c.rect(8 + i * 4, 17, 3, 7, col)
            c.put(9 + i * 4, 19, PAPER)
        c.frame(7, 16, 17, 9, INK)
        # open door leaf (right), seen edge-on, sticking out past the body
        c.rect(27, -10, 4, 38, STEEL)
        c.vline(27, -10, 38, STEEL_LIT)
        c.vline(30, -10, 38, STEEL_DARK)
        c.frame(26, -11, 6, 40, INK)
        c.rect(28, 6, 1, 6, INK)
    return c


def counter_base(c: Cell, part: str) -> None:
    left_end = part == 'machine'
    right_end = part == 'sink'
    x0 = 1 if left_end else 0
    x1 = 31 if right_end else 32
    w = x1 - x0
    c.ground_shadow(x0 + 1, 28, w - 3, 3)
    # cabinet front
    c.rect(x0, 10, w, 18, hexc('#5a6b7c'))
    c.hline(x0, 10, w, hexc('#75889a'))
    c.rect(x0, 26, w, 2, hexc('#3f4c5a'))
    # cabinet doors
    door_w = (w - 2) // 2
    for dx in (x0 + 1, x0 + 1 + door_w + 1):
        c.frame(dx, 12, door_w, 13, hexc('#465664'))
        c.put(dx + door_w - 2, 18, STEEL_LIT)
        c.put(dx + door_w - 2, 19, STEEL_LIT)
    # counter top (light stone)
    top = hexc('#d9d5cc')
    top_lit = hexc('#efece5')
    top_dark = hexc('#aaa59a')
    c.rect(x0, -2, w, 11, top)
    c.hline(x0, -2, w, top_lit)
    c.hline(x0, -1, w, top_lit)
    c.rect(x0, 7, w, 2, top_dark)
    c.hline(x0, 9, w, INK)
    c.hline(x0, -3, w, INK)
    c.hline(x0, 28, w, INK)
    if left_end:
        c.vline(x0 - 1, -3, 32, INK)
        c.vline(x0, -2, 11, top_lit)
    if right_end:
        c.vline(x1, -3, 32, INK)
        c.vline(x1 - 1, -2, 11, top_dark)


def counter_machine(steam: int) -> Cell:
    """Coffee machine end of the counter. steam: -1 idle, 0/1 steaming frames."""
    c = Cell()
    counter_base(c, 'machine')
    # espresso machine
    c.box(8, -12, 16, 14, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(9, -11, 14, 3, STEEL)
    c.hline(9, -11, 14, STEEL_LIT)
    c.rect(10, -6, 4, 2, RED)
    c.rect(16, -6, 4, 2, GREEN)
    c.rect(12, -2, 8, 4, DARKPL_DARK)  # spout housing
    c.rect(14, 1, 4, 1, STEEL)
    # cup on the drip tray
    c.rect(13, 3, 6, 4, PAPER)
    c.hline(13, 3, 6, PAPER_LIT)
    c.frame(12, 2, 8, 6, INK)
    c.put(19, 4, INK)
    c.put(20, 4, INK)
    c.put(20, 5, INK)
    if steam >= 0:
        steam_col = hexc('#eef3f8', 190)
        steam_dim = hexc('#eef3f8', 110)
        if steam == 0:
            c.blend(14, 0, steam_col)
            c.blend(14, -1, steam_dim)
            c.blend(17, 0, steam_dim)
            c.blend(17, -1, steam_col)
            c.blend(15, -14, steam_dim)
            c.blend(19, -15, steam_dim)
        else:
            c.blend(15, 0, steam_dim)
            c.blend(15, -1, steam_col)
            c.blend(18, 0, steam_col)
            c.blend(17, -1, steam_dim)
            c.blend(13, -14, steam_dim)
            c.blend(16, -16, steam_dim)
            c.blend(20, -14, steam_col)
    return c


def counter_cups() -> Cell:
    c = Cell()
    counter_base(c, 'cups')
    # stack of paper cups + a tray of pastries
    for i in range(3):
        x = 3 + i * 3
        c.rect(x, -1 - i, 3, 5, PAPER)
        c.hline(x, -1 - i, 3, PAPER_LIT)
    c.frame(2, -4, 12, 9, INK)
    c.rect(3, 4, 10, 1, PAPER_DARK)
    # pastry tray
    c.rect(16, -1, 13, 7, STEEL)
    c.hline(16, -1, 13, STEEL_LIT)
    c.frame(15, -2, 15, 9, INK)
    for i, (dx, col) in enumerate(((17, hexc('#c98a4b')), (21, hexc('#e0a862')), (25, hexc('#c98a4b')))):
        c.rect(dx, 1, 3, 3, col)
        c.put(dx + 1, 1, hexc('#f1c98f'))
    return c


def counter_sink() -> Cell:
    c = Cell()
    counter_base(c, 'sink')
    # basin
    c.rect(6, 0, 19, 8, STEEL_DARK)
    c.rect(7, 1, 17, 6, hexc('#7d8998'))
    c.hline(7, 1, 17, STEEL_DARK)
    c.frame(5, -1, 21, 10, INK)
    c.rect(14, 4, 3, 2, hexc('#4c5664'))  # drain
    # tap
    c.rect(15, -10, 2, 9, STEEL)
    c.vline(15, -10, 9, STEEL_LIT)
    c.rect(13, -10, 6, 2, STEEL)
    c.hline(13, -10, 6, STEEL_LIT)
    c.frame(14, -11, 4, 11, INK)
    c.frame(12, -11, 8, 4, INK)
    c.put(13, -8, STEEL)
    c.put(18, -8, STEEL)
    # dish soap
    c.rect(26, -3, 3, 7, GREEN)
    c.rect(27, -5, 1, 2, PAPER)
    c.frame(25, -4, 5, 9, INK)
    return c


def vending(frame: int) -> Cell:
    """frame: -1 idle, 0/1 lit frames."""
    c = Cell()
    lit = frame >= 0
    c.ground_shadow(5, 27, 22, 3)
    c.box(6, -14, 20, 42, DARKPL, DARKPL_LIT, DARKPL_DARK)
    # window
    win = hexc('#ffe9a8', 70) if lit else hexc('#a8d8ff', 44)
    c.rect(8, -11, 12, 24, hexc('#1a2233'))
    # product rows
    prods = [(RED, GREEN, GOLD), (MUG_B, GOLD, RED), (GREEN, RED, MUG_B), (GOLD, MUG_B, GREEN)]
    for r, cols in enumerate(prods):
        y = -9 + r * 6
        c.rect(8, y + 4, 12, 1, STEEL_DARK)  # shelf
        for i, col in enumerate(cols):
            x = 9 + i * 4
            c.rect(x, y, 3, 4, col)
            c.put(x, y, mix(col, PAPER_LIT, 0.5))
    c.blend_rect(8, -11, 12, 24, win)
    c.frame(7, -12, 14, 26, INK)
    if lit:
        c.put(9, -10, hexc('#fff6d5', 200))
        c.put(9, -9, hexc('#fff6d5', 160))
    # side panel: keypad, bill slot, coin return
    c.rect(22, -10, 3, 5, PLASTIC if not lit else GOLD_LIT)
    c.frame(21, -11, 5, 7, INK)
    for i in range(3):
        c.rect(22, -3 + i * 3, 3, 2, DARKPL_LIT)
        if lit and i == frame:
            c.rect(22, -3 + i * 3, 3, 2, GOLD)
    c.rect(22, 7, 3, 2, INK)
    # pickup flap
    c.rect(8, 16, 12, 7, hexc('#1a2233'))
    c.hline(8, 16, 12, DARKPL_LIT)
    c.frame(7, 15, 14, 9, INK)
    if lit:
        c.hline(9, 22, 10, hexc('#ffd88a'))
    # brand band
    c.rect(7, -13, 18, 2, RED_DARK if not lit else RED)
    return c


def break_table(part: str) -> Cell:
    c = Cell()
    left = part == 'l'
    x0 = 3 if left else 0
    x1 = 32 if left else 29
    w = x1 - x0
    c.ground_shadow(x0 + 2, 27, w - 4, 3)
    # round-ish laminate table: top with a lighter rim
    c.rect(x0, 2, w, 14, LAM)
    c.hline(x0, 2, w, LAM_LIT)
    c.hline(x0, 3, w, LAM_LIT)
    c.rect(x0, 13, w, 3, LAM_DARK)
    c.hline(x0, 1, w, INK)
    c.hline(x0, 16, w, INK)
    if left:
        c.vline(x0 - 1, 2, 15, INK)
        c.vline(x0, 3, 12, LAM_LIT)
        c.put(x0, 2, INK)
        c.put(x0, 15, INK)
    else:
        c.vline(x1, 2, 15, INK)
        c.vline(x1 - 1, 3, 12, LAM_DARK)
    # pedestal leg + foot
    c.rect(14, 17, 4, 9, STEEL_DARK)
    c.vline(14, 17, 9, STEEL)
    c.rect(10, 26, 12, 2, STEEL_DARK)
    c.hline(10, 26, 12, STEEL)
    c.frame(9, 25, 14, 4, INK)
    c.vline(13, 17, 9, INK)
    c.vline(18, 17, 9, INK)
    if left:
        # celebration cake with a candle
        c.rect(10, 5, 14, 8, CAKE)
        c.hline(10, 5, 14, CAKE_LIT)
        c.rect(10, 8, 14, 1, CREAM)
        c.rect(10, 12, 14, 1, CAKE_DARK)
        c.frame(9, 4, 16, 10, INK)
        for x in range(11, 24, 3):
            c.put(x, 6, CREAM)
        c.rect(16, 1, 2, 3, PAPER)
        c.put(16, 0, GOLD_LIT)
        c.put(17, 0, GOLD)
        c.put(16, -1, GOLD_LIT)
        c.frame(15, 0, 4, 5, INK)
        c.put(15, -1, INK)
        c.put(18, -1, INK)
        c.put(16, -2, INK)
        c.put(17, -2, INK)
        c.put(16, -1, GOLD_LIT)
        c.put(17, -1, GOLD)
    else:
        # two mugs and a napkin
        for x, col in ((6, MUG_A), (17, MUG_C)):
            c.rect(x, 6, 5, 5, col)
            c.hline(x, 6, 5, mix(col, PAPER_LIT, 0.45))
            c.frame(x - 1, 5, 7, 7, INK)
            c.vline(x + 6, 7, 3, INK)
            c.put(x + 5, 7, col)
            c.put(x + 5, 9, col)
        c.rect(10, 12, 6, 2, PAPER)
        c.frame(9, 11, 8, 4, INK)
    return c


def meeting_table(part: str, agenda: bool = False) -> Cell:
    """4×2 conference table — 9-patch parts tl/t/tr/bl/b/br."""
    c = Cell()
    top = 't' in part
    bottom = 'b' in part
    left = 'l' in part
    right = 'r' in part
    dark_top = hexc('#6d4a30')
    dark_top_lit = hexc('#8a6141')
    dark_top_dark = hexc('#4e341f')
    x0 = 3 if left else 0
    x1 = 29 if right else 32
    y0 = 3 if top else 0
    y1 = 24 if bottom else 32
    if bottom:
        c.ground_shadow(x0 + 1, 28, x1 - x0 - 2, 2)
        # apron / edge below the top
        c.rect(x0, 24, x1 - x0, 4, WOOD_DARK)
        c.hline(x0, 24, x1 - x0, WOOD)
        c.hline(x0, 28, x1 - x0, INK)
        # legs at the ends
        if left:
            c.rect(x0 + 1, 28, 3, 3, WOOD_DARK)
            c.frame(x0, 27, 5, 5, INK)
        if right:
            c.rect(x1 - 4, 28, 3, 3, WOOD_DARK)
            c.frame(x1 - 5, 27, 5, 5, INK)
    c.rect(x0, y0, x1 - x0, y1 - y0, dark_top)
    # wood grain
    for y in range(y0, y1):
        for x in range(x0, x1):
            if (x + y * 7) % 41 == 0:
                c.put(x, y, dark_top_dark)
                c.put(x + 1, y, dark_top_dark)
            elif (x * 3 + y * 5) % 53 == 0:
                c.put(x, y, dark_top_lit)
                c.put(x + 1, y, dark_top_lit)
    if top:
        c.hline(x0, y0, x1 - x0, dark_top_lit)
        c.hline(x0, y0 + 1, x1 - x0, dark_top_lit)
        c.hline(x0, y0 - 1, x1 - x0, INK)
    if bottom:
        c.hline(x0, y1 - 1, x1 - x0, dark_top_dark)
    if left:
        c.vline(x0, y0, y1 - y0, dark_top_lit)
        c.vline(x0 - 1, y0 - (1 if top else 0), y1 - y0 + (1 if top else 0), INK)
    if right:
        c.vline(x1 - 1, y0, y1 - y0, dark_top_dark)
        c.vline(x1, y0 - (1 if top else 0), y1 - y0 + (1 if top else 0), INK)
    # table dressing
    if part == 't':
        # speakerphone
        c.rect(12, 12, 8, 6, DARKPL)
        c.hline(12, 12, 8, DARKPL_LIT)
        c.frame(11, 11, 10, 8, INK)
        c.put(15, 14, GREEN)
        c.rect(8, 15, 3, 1, DARKPL)
        c.rect(21, 15, 3, 1, DARKPL)
    if part == 'tr':
        c.rect(8, 10, 12, 8, PAPER)
        c.hline(8, 10, 12, PAPER_LIT)
        c.frame(7, 9, 14, 10, INK)
        c.hline(10, 12, 8, PAPER_DARK)
        c.hline(10, 14, 6, PAPER_DARK)
    if part == 'b':
        # laptop
        c.rect(11, 6, 12, 8, PLASTIC_DARK)
        c.rect(12, 7, 10, 5, SCREEN)
        c.hline(13, 8, 5, SCREEN_GLOW)
        c.hline(13, 10, 7, SCREEN_DIM)
        c.frame(10, 5, 14, 10, INK)
        c.rect(11, 15, 12, 4, PLASTIC)
        c.hline(11, 15, 12, PLASTIC_LIT)
        c.frame(10, 14, 14, 6, INK)
        for i in range(12, 22, 2):
            c.put(i, 17, PLASTIC_DARK)
    if part == 'bl':
        # water glass + pitcher
        c.rect(12, 8, 8, 10, hexc('#c9e8ff', 160))
        c.frame(11, 7, 10, 12, INK)
        c.rect(13, 12, 6, 5, WATER)
        c.put(13, 9, PAPER_LIT)
        c.rect(22, 12, 4, 6, hexc('#c9e8ff', 160))
        c.frame(21, 11, 6, 8, INK)
        c.rect(23, 15, 2, 2, WATER)
    if agenda:
        c.rect(9, 8, 14, 17, PAPER)
        c.hline(9, 8, 14, PAPER_LIT)
        c.vline(22, 8, 17, PAPER_DARK)
        c.frame(8, 7, 16, 19, INK)
        c.hline(11, 11, 10, NAVY)
        c.hline(11, 14, 8, PAPER_DARK)
        c.hline(11, 16, 9, PAPER_DARK)
        c.hline(11, 18, 6, GOLD_DARK)
        c.hline(11, 20, 8, PAPER_DARK)
        c.hline(11, 22, 5, PAPER_DARK)
        # paperclip
        c.rect(19, 9, 2, 4, STEEL)
        c.put(19, 9, INK)
        c.put(20, 12, INK)
    return c


def handout_rack() -> Cell:
    c = Cell()
    c.ground_shadow(6, 27, 20, 3)
    c.box(7, -8, 18, 36, STEEL, STEEL_LIT, STEEL_DARK)
    # three angled pockets with handouts
    for i, col in enumerate((PAPER, hexc('#ffe27a'), hexc('#a8d8ff'))):
        y = -5 + i * 11
        c.rect(9, y, 14, 8, col)
        c.hline(9, y, 14, mix(col, PAPER_LIT, 0.5))
        c.rect(9, y + 6, 14, 2, STEEL_DARK)
        c.hline(9, y + 5, 14, INK)
        c.frame(8, y - 1, 16, 10, INK)
        c.hline(11, y + 2, 8 if i != 1 else 5, PAPER_DARK if i == 0 else INK)
        c.hline(11, y + 4, 6, PAPER_DARK if i == 0 else CORK_DARK)
    c.rect(7, 26, 18, 2, STEEL_DARK)
    return c


def water_cooler() -> Cell:
    c = Cell()
    c.ground_shadow(8, 27, 16, 3)
    # cabinet
    c.box(10, 6, 12, 22, PLASTIC, PLASTIC_LIT, PLASTIC_DARK)
    c.rect(12, 12, 8, 3, DARKPL)
    c.put(13, 13, MUG_B)
    c.put(18, 13, RED)
    c.rect(11, 20, 10, 4, PLASTIC_DARK)  # drip tray
    c.hline(11, 20, 10, INK)
    # cup dispenser tube
    c.rect(22, 6, 2, 12, PAPER)
    c.frame(21, 5, 4, 14, INK)
    # bottle
    c.rect(11, -8, 10, 14, WATER)
    c.rect(11, -8, 10, 14, WATER)
    c.vline(11, -8, 14, WATER_LIT)
    c.vline(12, -6, 10, WATER_LIT)
    c.vline(20, -8, 14, WATER_DARK)
    c.rect(11, -8, 10, 3, WATER_LIT)
    c.rect(13, -11, 6, 3, WATER)
    c.frame(10, -9, 12, 16, INK)
    c.frame(12, -12, 8, 4, INK)
    c.hline(13, -9, 6, WATER_DARK)
    c.rect(11, 4, 10, 2, WATER_DARK)
    return c


def plant(variant: int) -> Cell:
    c = Cell()
    c.ground_shadow(8, 27, 16, 3)
    pot_tpl = rows(
        """
        OOOOOOOOOOOOOO
        OLLLLLLLLLLLLO
        OPPPPPPPPPPPDO
        .OPPPPPPPPPDO.
        .OLPPPPPPPPDO.
        .OLPPPPPPPPDO.
        .OLPPPPPPPPDO.
        .OLPPPPPPPPDO.
        .ODDDDDDDDDDO.
        ..OOOOOOOOOO..
        """
    )
    c.paste(pot_tpl, 9, 19, {'P': POT, 'L': POT_LIT, 'D': POT_DARK})
    c.rect(11, 20, 10, 1, hexc('#3c2b1c'))  # soil line under the rim
    if variant == 0:
        leaves = rows(
            """
            .......lll........
            ....lllLLLLl......
            ..llLLLLLLLLLl....
            .lLLLLLlLLLLLLl...
            .LLLlLLLLLLDLLLl..
            lLLLLLLDLLLLLLLL..
            LLLLDLLLLLLDLLLLL.
            .LLLLLLDLLLLLLDLL.
            .DLLDLLLLLDLLLLLD.
            ..DLLLDLLLLLDLLD..
            ...DDLLLDLLLDDD...
            .....DDLLLDDD.....
            .......DLLD.......
            ........LD........
            """
        )
        c.paste(leaves, 7, 2, {'L': LEAF, 'l': LEAF_LIT, 'D': LEAF_DARK}, outline=True)
    else:
        # taller, spikier (a dracaena)
        leaves = rows(
            """
            .l.....l....l.
            .lL...lL...lL.
            ..LL..LL..LL..
            ..LL.lLL.lLL..
            ...LLLLLLLL...
            ..lLLLLLLLLl..
            .lLLLLLDLLLLl.
            .LLLDLLLLDLLL.
            ..DLLDLLDLLD..
            ...DDLDDLDD...
            .....DLLD.....
            ......LD......
            """
        )
        c.paste(leaves, 9, 2, {'L': LEAF, 'l': LEAF_LIT, 'D': LEAF_DARK}, outline=True)
    return c


def directory() -> Cell:
    c = Cell()
    c.ground_shadow(7, 27, 18, 3)
    # post + foot
    c.rect(14, 12, 4, 15, STEEL_DARK)
    c.vline(14, 12, 15, STEEL)
    c.rect(10, 26, 12, 2, STEEL_DARK)
    c.hline(10, 26, 12, STEEL)
    c.frame(9, 25, 14, 4, INK)
    c.vline(13, 12, 14, INK)
    c.vline(18, 12, 14, INK)
    # board
    c.box(3, -8, 26, 20, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(4, -7, 24, 3, GOLD)
    c.hline(4, -7, 24, GOLD_LIT)
    text(c, 'FLOOR 1', 3, -3, PAPER)
    for i in range(3):
        y = 3 + i * 3
        c.hline(5, y, 3, GOLD_DARK)
        c.hline(9, y, 10 + (i * 3) % 7, PLASTIC_DARK)
    return c


def elevator(side: str, open_: bool) -> Cell:
    """Two-tile elevator. Doors run 40px tall from the wall face down to the floor."""
    c = Cell()
    left = side == 'l'
    # brushed steel portal — outer edge on the open side of each half
    x0 = 2 if left else 0
    x1 = 30 if not left else 32
    c.rect(x0, -13, x1 - x0, 44, STEEL_DARK)
    if left:
        c.vline(x0, -13, 44, STEEL_LIT)
        c.vline(x0 - 1, -14, 46, INK)
        c.vline(x0 + 1, -13, 44, STEEL)
    else:
        c.vline(x1 - 1, -13, 44, DARKPL_DARK)
        c.vline(x1, -14, 46, INK)
    c.hline(x0, -13, x1 - x0, STEEL_LIT)
    c.hline(x0 - (1 if left else 0), -14, x1 - x0 + (1 if left else 0), INK)
    # floor indicator above the doors (a shared panel across both halves)
    c.rect(x0 + (10 if left else 0), -11, 22 - (10 if left else 12) + (0 if left else 10), 5, DARKPL_DARK)
    if left:
        c.rect(22, -10, 10, 3, SCREEN)
        c.put(24, -9, RED)
        c.hline(26, -10, 3, GREEN if open_ else GREEN_DARK)
    else:
        c.rect(0, -10, 10, 3, SCREEN)
        c.put(3, -10, GOLD_LIT)
        c.put(3, -9, GOLD_LIT)
        c.put(3, -8, GOLD_LIT)
        c.put(2, -9, GOLD_LIT)
        c.put(6, -9, GREEN if open_ else DARKPL)
    # cab opening
    dx0 = x0 + 4 if left else 0
    dx1 = 32 if left else x1 - 4
    c.rect(dx0, -5, dx1 - dx0, 33, hexc('#0d1018'))
    if open_:
        # lit cab interior: warm ceiling light, handrail, back wall
        c.rect(dx0, -5, dx1 - dx0, 33, hexc('#c8b28a'))
        c.rect(dx0, -5, dx1 - dx0, 2, hexc('#fff1c4'))
        c.rect(dx0, -3, dx1 - dx0, 14, hexc('#a89272'))
        c.rect(dx0, 11, dx1 - dx0, 2, STEEL)  # handrail
        c.rect(dx0, 20, dx1 - dx0, 8, hexc('#6e6259'))  # cab floor
        c.hline(dx0, 20, dx1 - dx0, hexc('#8a7c70'))
        # door leaf slid aside, mostly hidden in the pocket
        if left:
            c.rect(dx0, -5, 4, 33, STEEL)
            c.vline(dx0 + 3, -5, 33, INK)
            c.vline(dx0, -5, 33, STEEL_LIT)
        else:
            c.rect(dx1 - 4, -5, 4, 33, STEEL)
            c.vline(dx1 - 4, -5, 33, INK)
            c.vline(dx1 - 1, -5, 33, STEEL_DARK)
    else:
        # closed leaf: brushed steel with a vertical highlight, meeting seam at the tile edge
        c.rect(dx0, -5, dx1 - dx0, 33, STEEL)
        for x in range(dx0, dx1):
            if (x % 4) == 1:
                c.vline(x, -5, 33, STEEL_LIT)
            elif (x % 4) == 3:
                c.vline(x, -5, 33, STEEL_DARK)
        if left:
            c.vline(dx1 - 1, -5, 33, INK)
            c.vline(dx0, -5, 33, STEEL_LIT)
        else:
            c.vline(dx0, -5, 33, INK)
            c.vline(dx1 - 1, -5, 33, STEEL_DARK)
        # small window slit at eye height
        wx = dx1 - 6 if left else dx0 + 3
        c.rect(wx, 3, 3, 7, hexc('#0d1018'))
        c.frame(wx - 1, 2, 5, 9, INK)
    # sill / threshold
    c.rect(dx0, 28, dx1 - dx0, 3, STEEL_DARK)
    c.hline(dx0, 28, dx1 - dx0, STEEL_LIT)
    c.hline(dx0, 31, dx1 - dx0, INK)
    return c


def reader(color: str, frame: int) -> Cell:
    """Badge reader on a steel stanchion beside the elevator."""
    c = Cell()
    c.ground_shadow(9, 27, 14, 3)
    # stanchion
    c.rect(14, 8, 4, 19, STEEL)
    c.vline(14, 8, 19, STEEL_LIT)
    c.vline(17, 8, 19, STEEL_DARK)
    c.frame(13, 7, 6, 21, INK)
    c.rect(10, 27, 12, 2, STEEL_DARK)
    c.hline(10, 27, 12, STEEL)
    c.frame(9, 26, 14, 4, INK)
    # reader head (angled panel)
    c.box(9, -4, 14, 12, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(11, -2, 10, 4, SCREEN)
    led = RED if color == 'red' else GREEN
    led_dark = RED_DARK if color == 'red' else GREEN_DARK
    on = frame == 0
    c.rect(12, -1, 8, 2, led if on else led_dark)
    if on:
        c.put(13, -1, mix(led, PAPER_LIT, 0.5))
    # card outline glyph
    c.frame(12, 3, 8, 4, STEEL_DARK)
    c.put(13, 4, led if on else STEEL_DARK)
    # badge icon beam when green
    if color == 'green' and on:
        c.put(8, 0, hexc('#4ade80', 120))
        c.put(7, 1, hexc('#4ade80', 80))
    return c


def street_exit() -> Cell:
    """Double glass doors set into the south wall (cap tile). Seen from above."""
    c = Cell()
    c.rect(0, 0, 32, 32, CAP)
    c.hline(0, 0, 32, CAP_LIT)
    c.hline(0, 1, 32, CAP_LIT)
    # door frame recess
    c.rect(3, 3, 26, 29, hexc('#10141c'))
    c.rect(4, 4, 24, 27, DARKPL)
    # two glass leaves with the street outside: dark, a street lamp glow
    for lx in (5, 17):
        c.rect(lx, 6, 10, 23, hexc('#1a2340'))
        c.rect(lx, 6, 10, 6, hexc('#2a3560'))
        c.rect(lx, 19, 10, 10, hexc('#0f1524'))
        c.blend_rect(lx, 6, 10, 23, GLASS)
        c.put(lx + 1, 7, GLASS_LIT)
        c.put(lx + 1, 8, GLASS_LIT)
        c.put(lx + 2, 7, GLASS_LIT)
        c.frame(lx - 1, 5, 12, 25, INK)
    # push bars
    c.rect(6, 17, 8, 2, STEEL)
    c.rect(18, 17, 8, 2, STEEL)
    c.hline(6, 18, 8, STEEL_DARK)
    c.hline(18, 18, 8, STEEL_DARK)
    # street lamp glow through the left leaf
    c.put(9, 12, WINDOW_LIGHT)
    c.put(8, 13, hexc('#ffd88a', 130))
    c.put(10, 13, hexc('#ffd88a', 130))
    c.put(9, 14, hexc('#ffd88a', 120))
    # exit sign on the frame header
    c.rect(11, 1, 10, 4, GREEN_DARK)
    c.rect(12, 2, 8, 2, GREEN)
    c.frame(10, 0, 12, 6, INK)
    c.put(14, 2, GREEN_DARK)
    c.put(16, 2, GREEN_DARK)
    c.put(18, 2, GREEN_DARK)
    c.frame(3, 3, 26, 29, INK)
    return c


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------


def build_atlas() -> None:
    # floors
    register('floor_hall', floor_hall())
    register('floor_reception', floor_reception())
    register('floor_desks', floor_desks())
    register('floor_break', floor_break())
    register('floor_meeting', floor_meeting())
    register('floor_elevator', floor_elevator())
    for part in ('tl', 't', 'tr', 'bl', 'b', 'br'):
        register(f'rug_red_{part}', rug_patch(RUG_RED, part))
    for part in ('tl', 't', 'tr', 'bl', 'b', 'br'):
        register(f'rug_gold_{part}', rug_patch(RUG_GOLD, part))
    for part in ('tlr', 'lr', 'blr'):
        register(f'rug_navy_{part}', rug_patch(RUG_NAVY, part))
    # walls (16 masks)
    for mask in range(16):
        register(f'wall_{mask}', wall(mask))
    # shade
    register('shade_n', shade_n())
    register('shade_w', shade_w())
    # doors
    register('door_v_top', door_v('top'))
    register('door_v_mid', door_v('mid'))
    register('door_v_bot', door_v('bot'))
    register('door_h', door_h())
    # decor
    register('window_l', window('l'))
    register('window_r', window('r'))
    register('whiteboard_l', whiteboard('l'))
    register('whiteboard_r', whiteboard('r'))
    register('pinboard', pinboard())
    register('clock', clock())
    register('logo_l', logo('l'))
    register('logo_m', logo('m'))
    register('logo_r', logo('r'))
    register('menu_l', menu_board('l'))
    register('menu_r', menu_board('r'))
    register('shelf_mugs', shelf_mugs())
    register('poster', poster())
    register('extinguisher', extinguisher())
    register('vent', vent())
    register('sign_meeting', sign_room('MEETING'))
    register('sign_kitchen', sign_room('KITCHEN'))
    register('sign_exit', sign_room('EXIT'))
    # props
    register_group(['desk_l_0', 'desk_l_1'], [desk('l', 0), desk('l', 1)])
    register_group(['desk_m_0', 'desk_m_1'], [desk('m', 0), desk('m', 1)])
    register('desk_r', desk('r', 0))
    register('rdesk_l', reception_desk('l'))
    register('rdesk_m', reception_desk('m'))
    register('rdesk_r', reception_desk('r'))
    register('chair_n', chair('n'))
    register('chair_s', chair('s'))
    register('printer_error', printer('error'))
    register('printer_working', printer('working'))
    register_group(
        ['printer_printing_0', 'printer_printing_1'],
        [printer('printing', 0), printer('printing', 1)],
    )
    register('cabinet_closed', cabinet(False))
    register('cabinet_open', cabinet(True))
    register('counter_machine', counter_machine(-1))
    register_group(
        ['counter_steam_0', 'counter_steam_1'], [counter_machine(0), counter_machine(1)]
    )
    register('counter_cups', counter_cups())
    register('counter_sink', counter_sink())
    register('vending_idle', vending(-1))
    register_group(['vending_lit_0', 'vending_lit_1'], [vending(0), vending(1)])
    register('btable_l', break_table('l'))
    register('btable_r', break_table('r'))
    for part in ('tl', 't', 'tr', 'bl', 'b', 'br'):
        register(f'mtable_{part}', meeting_table(part))
    register('mtable_tl_agenda', meeting_table('tl', agenda=True))
    register('handout_rack', handout_rack())
    register('water_cooler', water_cooler())
    register('plant_a', plant(0))
    register('plant_b', plant(1))
    register('directory', directory())
    register('elev_l_closed', elevator('l', False))
    register('elev_r_closed', elevator('r', False))
    register('elev_l_open', elevator('l', True))
    register('elev_r_open', elevator('r', True))
    register_group(['reader_red_0', 'reader_red_1'], [reader('red', 0), reader('red', 1)])
    register_group(
        ['reader_green_0', 'reader_green_1'], [reader('green', 0), reader('green', 1)]
    )
    register('street_exit', street_exit())


def build_sheet() -> tuple[Image.Image, dict[str, tuple[int, int]]]:
    rows_needed = (len(ATLAS) + COLS - 1) // COLS
    sheet = Image.new('RGBA', (COLS * CELL_W, rows_needed * CELL_H), (0, 0, 0, 0))
    index: dict[str, tuple[int, int]] = {}
    for i, (name, cell) in enumerate(ATLAS):
        if not name:
            continue
        col, row = i % COLS, i // COLS
        sheet.paste(cell.to_image(), (col * CELL_W, row * CELL_H))
        index[name] = (col, row)
    return sheet, index


def emit_ts(index: dict[str, tuple[int, int]], sheet: Image.Image) -> str:
    lines = [
        '// Generated by scripts/gen_office_tiles.py — do not edit by hand.',
        '// Cell = 32×48; the tile footprint is the bottom 32×32, props overflow upward.',
        '',
        'export const TILE_SHEET_URL = \'/office/tiles.png\'',
        f'export const TILE_CELL_W = {CELL_W}',
        f'export const TILE_CELL_H = {CELL_H}',
        f'export const TILE_SHEET_W = {sheet.width}',
        f'export const TILE_SHEET_H = {sheet.height}',
        '',
        'export const TILE_ATLAS = {',
    ]
    for name, (col, row) in index.items():
        lines.append(f'  {name}: [{col}, {row}],')
    lines.append('} as const satisfies Record<string, readonly [number, number]>')
    lines.append('')
    lines.append('export type TileName = keyof typeof TILE_ATLAS')
    lines.append('')
    return '\n'.join(lines)


def main() -> None:
    build_atlas()
    sheet, index = build_sheet()
    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_PNG, optimize=True)
    OUT_TS.write_text(emit_ts(index, sheet))
    print(f'wrote {OUT_PNG.relative_to(ROOT)} ({sheet.width}×{sheet.height}, {len(index)} tiles)')
    print(f'wrote {OUT_TS.relative_to(ROOT)}')
    if '--preview' in sys.argv:
        bg = Image.new('RGBA', sheet.size, (70, 78, 92, 255))
        # checker so alpha reads
        for y in range(0, sheet.height, 8):
            for x in range(0, sheet.width, 8):
                if (x // 8 + y // 8) % 2:
                    for yy in range(y, min(y + 8, sheet.height)):
                        for xx in range(x, min(x + 8, sheet.width)):
                            bg.putpixel((xx, yy), (80, 88, 104, 255))
        bg.alpha_composite(sheet)
        big = bg.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST)
        big.save('/tmp/office_tiles_preview.png')
        print('wrote /tmp/office_tiles_preview.png')


if __name__ == '__main__':
    main()
