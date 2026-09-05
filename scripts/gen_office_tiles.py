#!/usr/bin/env python3
"""Office tileset (Floors 1–5) — hand-authored pixel art, one sheet.

Output: public/office/tiles.png (RGBA) plus src/screens/office/tileAtlas.ts,
the name → cell index the WorldMap sprite layer reads. Floor 2 cells
(docs/rpg/floor-2-design.md) are appended after every Floor 1 cell so the
Floor 1 indices never move.

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

Every cell is stored with a 1px extruded border (edge pixels duplicated
outward, 34×50 stride). WorldMap draws each sprite one pixel larger than its
cell so neighbours overlap by an identical pixel: under the Stage's fractional
scale, separately rasterised spans otherwise meet in anti-aliased hairline
seams that let the floor bleed through.

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
PAD = 1  # extruded border so adjacent sprites can overlap by one identical pixel
STRIDE_X = CELL_W + 2 * PAD
STRIDE_Y = CELL_H + 2 * PAD
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
    # Floor 2 signage additions
    'J': ['###', '..#', '..#', '#.#', '.#.'],
    'Q': ['.#.', '#.#', '#.#', '##.', '..#'],
    'V': ['#.#', '#.#', '#.#', '#.#', '.#.'],
    'W': ['#.#', '#.#', '###', '###', '#.#'],
    'Y': ['#.#', '#.#', '.#.', '.#.', '.#.'],
    'Z': ['###', '..#', '.#.', '#..', '###'],
    '0': ['###', '#.#', '#.#', '#.#', '###'],
    '3': ['###', '..#', '.##', '..#', '###'],
    '4': ['#.#', '#.#', '###', '..#', '..#'],
    '5': ['###', '#..', '###', '..#', '###'],
    '6': ['###', '#..', '###', '#.#', '###'],
    '7': ['###', '..#', '.#.', '.#.', '.#.'],
    '8': ['###', '#.#', '###', '#.#', '###'],
    '9': ['###', '#.#', '###', '..#', '###'],
    '-': ['...', '...', '###', '...', '...'],
    ':': ['...', '.#.', '...', '.#.', '...'],
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
    dark_top = hexc('#7b5236')
    dark_top_lit = hexc('#986b48')
    dark_top_dark = hexc('#583823')
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
            if (x + y * 7) % 61 == 0:
                c.hline(x, y, 3, dark_top_dark)
            elif (x * 3 + y * 5) % 67 == 0:
                c.hline(x, y, 2, dark_top_lit)
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
        # horizontal brushed band at hand height
        c.hline(dx0, 9, dx1 - dx0, STEEL_DARK)
        c.hline(dx0, 10, dx1 - dx0, STEEL_LIT)
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


# ===========================================================================
# Floor 2 — OPERATIONS. Same art language, appended after every Floor 1 cell
# so the Floor 1 atlas indices never move (docs/rpg/floor-2-design.md §1).
# ===========================================================================

FLOORS_F2 = {
    'it': (hexc('#4a5668'), hexc('#56637a'), hexc('#3e485a')),
    'people': (hexc('#6e4a5a'), hexc('#7d5868'), hexc('#5c3c4a')),
    'director': (hexc('#3c3a48'), hexc('#464455'), hexc('#302e3a')),
    'facilities': (hexc('#4d6a6e'), hexc('#59797d'), hexc('#3f585c')),
    'finance': (hexc('#3f5e4a'), hexc('#4a6d56'), hexc('#34503e')),
}

WALNUT = hexc('#5e3f2a')
WALNUT_LIT = hexc('#7a553a')
WALNUT_DARK = hexc('#3d2818')
LEATHER = hexc('#2f4a3a')
LEATHER_LIT = hexc('#3c5c49')
BRASS = hexc('#c9a24a')
BRASS_LIT = hexc('#e6c56a')
BRASS_DARK = hexc('#8f6f2a')
OAK = hexc('#c99a5f')
OAK_LIT = hexc('#e0b87a')
OAK_DARK = hexc('#9c7444')
MUSTARD = hexc('#c29a3a')
MUSTARD_LIT = hexc('#dbb556')
MUSTARD_DARK = hexc('#8f6e24')
SAFETY = hexc('#f2c230')
SAFETY_DARK = hexc('#b98c14')
AMBER = hexc('#ffb020')
CURTAIN = hexc('#7a2f33')
CURTAIN_LIT = hexc('#9a4448')
CURTAIN_DARK = hexc('#521e22')
PINK_BOX = hexc('#f2a7c3')
PINK_BOX_LIT = hexc('#ffd0e0')
PINK_BOX_DARK = hexc('#c47a98')
DONUT = hexc('#d9a066')
DONUT_ICING = hexc('#f4d35e')
BLUE_FLECK = hexc('#5b7fb0')


# --- Floor 2 floors ---------------------------------------------------------


def floor_it() -> Cell:
    """Anti-static tile: 16px squares, lit grout, a blue conductive fleck."""
    base, lit, dark = FLOORS_F2['it']
    c = Cell()
    floor_base(c, base)
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            c.hline(ox, oy, 16, dark)
            c.vline(ox, oy, 16, dark)
            c.hline(ox + 1, oy + 1, 15, lit)
            c.vline(ox + 1, oy + 1, 15, lit)
            for k, (sx, sy) in enumerate(((5, 9), (11, 4), (9, 12), (13, 8))):
                c.put(ox + sx, oy + sy, BLUE_FLECK if k % 2 == 0 else dark)
    return c


def floor_people() -> Cell:
    """Rose carpet, 8px herringbone."""
    base, lit, dark = FLOORS_F2['people']
    c = Cell()
    floor_base(c, base)
    for y in range(32):
        for x in range(32):
            band = (x // 8 + y // 8) % 2
            if band == 0 and (x + y) % 4 == 0:
                c.put(x, y, lit)
            elif band == 1 and (x - y) % 4 == 0:
                c.put(x, y, lit)
            elif (x * 5 + y * 3) % 17 == 0:
                c.put(x, y, dark)
    return c


def floor_director() -> Cell:
    """Charcoal plush with a diagonal weave — the expensive carpet."""
    base, lit, dark = FLOORS_F2['director']
    c = Cell()
    floor_base(c, base)
    for y in range(32):
        for x in range(32):
            if (x + y) % 6 == 0:
                c.put(x, y, lit)
            elif (x + y) % 6 == 3 and x % 2 == 0:
                c.put(x, y, dark)
    return c


def floor_facilities() -> Cell:
    """Sealed concrete: 16px pour joints and a speckle."""
    base, lit, dark = FLOORS_F2['facilities']
    joint = hexc('#37494d')
    c = Cell()
    floor_base(c, base)
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            c.hline(ox, oy, 16, joint)
            c.vline(ox, oy, 16, joint)
            c.hline(ox + 1, oy + 1, 15, lit)
            for k, (sx, sy) in enumerate(((3, 5), (8, 3), (13, 9), (6, 12), (11, 14), (14, 4))):
                c.put(ox + sx, oy + sy, dark if k % 2 else lit)
    return c


def floor_finance() -> Cell:
    """Green carpet tiles, 8px, alternating pile direction."""
    base, lit, dark = FLOORS_F2['finance']
    c = Cell()
    floor_base(c, base)
    for qy in range(4):
        for qx in range(4):
            ox, oy = qx * 8, qy * 8
            horizontal = (qx + qy) % 2 == 0
            for i in range(8):
                for j in range(8):
                    x, y = ox + i, oy + j
                    if horizontal and j % 4 == 1 and i % 2 == 0:
                        c.put(x, y, lit)
                    elif not horizontal and i % 4 == 1 and j % 2 == 0:
                        c.put(x, y, lit)
            c.hline(ox, oy, 8, dark)
            c.vline(ox, oy, 8, dark)
    return c


# --- Floor 2 doorway ---------------------------------------------------------


def door_v_single() -> Cell:
    """A one-tile opening in a vertical wall: both jamb posts, leaves folded."""
    c = Cell()
    c.vline(14, 0, 32, TRACK_DARK)
    c.rect(15, 0, 3, 32, TRACK)
    c.vline(15, 0, 32, STEEL_LIT)
    c.vline(18, 0, 32, TRACK_DARK)
    for y in range(2, 32, 6):
        c.put(16, y, TRACK_DARK)
    for y0 in (0, 24):
        c.rect(13, y0, 7, 8, STEEL_DARK)
        c.rect(14, y0, 5, 8, STEEL)
        c.vline(14, y0, 8, STEEL_LIT)
        c.frame(12, y0 - 1, 9, 10, INK)
        c.blend_rect(20, y0 + 1, 7, 6, GLASS)
        c.hline(20, y0 + 1, 7, GLASS_EDGE)
        c.hline(20, y0 + 6, 7, GLASS_EDGE)
        c.vline(26, y0 + 1, 6, GLASS_EDGE)
        c.frame(20, y0, 8, 8, INK)
        c.put(21, y0 + 2, GLASS_LIT)
        c.put(22, y0 + 2, GLASS_LIT)
    return c


# --- Floor 2 wall decor -----------------------------------------------------


def plaque_ops(part: str) -> Cell:
    """Landing/hall plaque, 3 tiles wide: rising-bars mark + OPERATIONS / FLOOR 2."""
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
    for i, h in enumerate((3, 5, 8, 11)):
        c.rect(off + 5 + i * 4, 23 - h, 3, h, GOLD if i < 3 else GOLD_LIT)
    c.hline(off + 4, 23, 17, GOLD_DARK)
    c.put(off + 21, 12, GOLD_LIT)
    c.put(off + 22, 13, GOLD_LIT)
    text(c, 'OPERATIONS', off + 26, 13, GOLD)
    c.hline(off + 26, 19, 59, GOLD_DARK)
    text(c, 'FLOOR 2', off + 62, 20, PAPER)
    return c


def ticket_board(part: str) -> Cell:
    """Help-desk kanban: three columns of coloured tickets, mostly in TODO."""
    c = Cell()
    x0 = 2 if part == 'l' else 0
    x1 = 32 if part == 'l' else 30
    c.rect(x0, 10, x1 - x0, 17, DARKPL)
    c.hline(x0, 10, x1 - x0, DARKPL_LIT)
    c.hline(x0, 9, x1 - x0, INK)
    c.hline(x0, 27, x1 - x0, INK)
    if part == 'l':
        c.vline(x0, 9, 19, INK)
        text(c, 'OPEN', 3, 12, PAPER)
        tickets = ((5, 18, hexc('#f4d35e')), (9, 18, hexc('#ff9f9f')), (13, 18, hexc('#f4d35e')),
                   (5, 22, hexc('#a8d8ff')), (9, 22, hexc('#f4d35e')), (13, 22, hexc('#ff9f9f')),
                   (21, 18, hexc('#a8d8ff')), (25, 18, hexc('#f4d35e')), (21, 22, hexc('#ff9f9f')))
        c.vline(19, 11, 15, DARKPL_LIT)
    else:
        c.vline(x1 - 1, 9, 19, INK)
        text(c, 'DONE', 4, 12, hexc('#8fd3a3'))
        tickets = ((5, 18, hexc('#8fd3a3')),)
        c.vline(21, 11, 15, DARKPL_LIT)
        # a sad empty column with a single sticky note
        c.rect(23, 17, 5, 4, PAPER)
        c.hline(24, 19, 3, PAPER_DARK)
    for x, y, col in tickets:
        c.rect(x, y, 3, 3, col)
        c.put(x + 1, y + 1, mix(col, INK, 0.5))
    return c


def org_chart(part: str) -> Cell:
    """Two-tile org chart: one gold box at the top, a lot of grey boxes below."""
    c = Cell()
    x0 = 2 if part == 'l' else 0
    x1 = 32 if part == 'l' else 30
    c.rect(x0, 10, x1 - x0, 17, PAPER)
    c.hline(x0, 9, x1 - x0, INK)
    c.hline(x0, 27, x1 - x0, INK)
    c.hline(x0, 26, x1 - x0, PAPER_DARK)
    if part == 'l':
        c.vline(x0, 9, 19, INK)
        c.rect(26, 11, 8, 3, GOLD)  # runs onto the right half
        c.frame(25, 10, 10, 5, INK)
        c.vline(29, 15, 2, INK)
        c.hline(8, 16, 24, INK)
        for bx in (8, 16, 24):
            c.vline(bx, 17, 2, INK)
            c.rect(bx - 2, 19, 5, 3, PLASTIC_DARK)
            c.frame(bx - 3, 18, 7, 5, INK)
            c.hline(bx - 1, 20, 3, PAPER)
        c.vline(8, 23, 1, INK)
        c.rect(6, 24, 5, 2, PLASTIC_DARK)
    else:
        c.vline(x1 - 1, 9, 19, INK)
        c.rect(0, 11, 2, 3, GOLD)
        c.hline(0, 10, 3, INK)
        c.hline(0, 14, 3, INK)
        c.vline(2, 10, 5, INK)
        c.hline(0, 16, 22, INK)
        for bx in (4, 12, 20):
            c.vline(bx, 17, 2, INK)
            c.rect(bx - 2, 19, 5, 3, PLASTIC_DARK)
            c.frame(bx - 3, 18, 7, 5, INK)
            c.hline(bx - 1, 20, 3, PAPER)
        # a box that has been crossed out in red
        c.hline(18, 19, 5, MARKER_RED)
        c.hline(18, 21, 5, MARKER_RED)
    return c


def incident_board(part: str) -> Cell:
    """DAYS SINCE REORG — the counter reads 0, freshly reset."""
    c = Cell()
    x0 = 2 if part == 'l' else 0
    x1 = 32 if part == 'l' else 30
    c.rect(x0, 10, x1 - x0, 16, SAFETY)
    c.hline(x0, 10, x1 - x0, mix(SAFETY, PAPER_LIT, 0.4))
    c.hline(x0, 9, x1 - x0, INK)
    c.hline(x0, 26, x1 - x0, INK)
    c.hline(x0, 25, x1 - x0, SAFETY_DARK)
    if part == 'l':
        c.vline(x0, 9, 18, INK)
        text(c, 'DAYS', 5, 12, INK)
        text(c, 'SINCE', 5, 18, INK)
    else:
        c.vline(x1 - 1, 9, 18, INK)
        text(c, 'REORG', 4, 12, INK)
        # counter window
        c.rect(9, 18, 12, 7, PAPER)
        c.frame(8, 17, 14, 9, INK)
        text(c, '0', 14, 19, RED_DARK)
        c.put(11, 20, PAPER_DARK)
        c.put(19, 20, PAPER_DARK)
    return c


def compliance_poster() -> Cell:
    c = Cell()
    c.rect(8, 11, 16, 16, hexc('#1e3a4a'))
    # shield with a check
    c.rect(12, 14, 8, 7, PAPER)
    c.rect(13, 21, 6, 2, PAPER)
    c.rect(14, 23, 4, 1, PAPER)
    c.put(15, 24, PAPER)
    c.put(16, 24, PAPER)
    c.put(14, 18, MARKER_GREEN)
    c.put(15, 19, MARKER_GREEN)
    c.put(16, 18, MARKER_GREEN)
    c.put(17, 17, MARKER_GREEN)
    c.put(18, 16, MARKER_GREEN)
    c.hline(10, 12, 12, GOLD)
    c.frame(7, 10, 18, 18, INK)
    return c


def breaker_panel() -> Cell:
    """Sits high on the wall so the cabinet below never overlaps it."""
    c = Cell()
    c.box(9, 9, 14, 11, STEEL, STEEL_LIT, STEEL_DARK)
    for row in range(3):
        y = 11 + row * 3
        for col in range(3):
            x = 11 + col * 4
            on = (row + col) % 3 != 1
            c.rect(x, y, 2, 2, DARKPL if on else RED_DARK)
    c.rect(11, 17, 10, 2, SAFETY)
    c.put(13, 17, INK)
    c.put(16, 18, INK)
    return c


def calendar() -> Cell:
    c = Cell()
    c.rect(9, 10, 14, 17, PAPER)
    c.rect(9, 10, 14, 4, RED_DARK)
    c.hline(9, 10, 14, RED)
    c.frame(8, 9, 16, 19, INK)
    for row in range(4):
        for col in range(5):
            x, y = 10 + col * 3, 15 + row * 3
            c.put(x, y, PAPER_DARK)
            c.put(x + 1, y, PAPER_DARK)
    # the review date, circled
    c.frame(15, 20, 4, 3, MARKER_RED)
    c.put(11, 9, STEEL_DARK)  # hanging pin
    return c


def server_status() -> Cell:
    """Wall monitor with a green uptime chart and one red bar."""
    c = Cell()
    c.rect(7, 11, 18, 12, DARKPL)
    c.frame(6, 10, 20, 14, INK)
    c.rect(8, 12, 16, 10, SCREEN)
    for i, h in enumerate((3, 4, 4, 5, 2, 5, 6, 6)):
        col = MARKER_RED if i == 4 else GREEN
        c.rect(9 + i * 2, 21 - h, 1, h, col)
    c.hline(9, 13, 6, SCREEN_GLOW)
    c.rect(14, 24, 4, 2, DARKPL_DARK)
    return c


def nameplate_tight(label: str) -> Cell:
    """Full-width steel plaque for longer names (ASHFORD, CALDWELL)."""
    c = Cell()
    c.rect(1, 13, 30, 9, STEEL)
    c.hline(1, 13, 30, STEEL_LIT)
    c.hline(1, 21, 30, STEEL_DARK)
    c.frame(0, 12, 32, 11, INK)
    tw = len(label) * 4 - 1
    text(c, label, max(1, (32 - tw) // 2), 15, INK)
    return c


def nameplate(label: str) -> Cell:
    """Brushed-steel door plaque with an engraved name."""
    c = Cell()
    w = len(label) * 4 + 5
    x0 = (32 - w) // 2
    c.rect(x0, 13, w, 9, STEEL)
    c.hline(x0, 13, w, STEEL_LIT)
    c.hline(x0, 21, w, STEEL_DARK)
    c.frame(x0 - 1, 12, w + 2, 11, INK)
    text(c, label, x0 + 3, 15, INK)
    c.put(x0 + 1, 17, STEEL_DARK)
    c.put(x0 + w - 2, 17, STEEL_DARK)
    return c


# --- Floor 2 props ----------------------------------------------------------


def directory_f2() -> Cell:
    c = Cell()
    c.ground_shadow(7, 27, 18, 3)
    c.rect(14, 12, 4, 15, STEEL_DARK)
    c.vline(14, 12, 15, STEEL)
    c.rect(10, 26, 12, 2, STEEL_DARK)
    c.hline(10, 26, 12, STEEL)
    c.frame(9, 25, 14, 4, INK)
    c.vline(13, 12, 14, INK)
    c.vline(18, 12, 14, INK)
    c.box(3, -8, 26, 20, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(4, -7, 24, 3, GOLD)
    c.hline(4, -7, 24, GOLD_LIT)
    text(c, 'FLOOR 2', 3, -3, PAPER)
    for i in range(3):
        y = 3 + i * 3
        c.hline(5, y, 3, GOLD_DARK)
        c.hline(9, y, 12 - (i * 4) % 7, PLASTIC_DARK)
    return c


def server_rack(frame: int) -> Cell:
    """42U cabinet; LED columns alternate between frames."""
    c = Cell()
    c.ground_shadow(5, 27, 22, 3)
    c.box(6, -14, 20, 42, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(6, 25, 20, 3, DARKPL_DARK)  # plinth
    for u in range(8):
        y = -12 + u * 4
        c.rect(8, y, 16, 3, hexc('#1d2230'))
        c.hline(8, y, 16, DARKPL_LIT)
        # handles and a vent slot
        c.rect(9, y + 1, 4, 1, STEEL_DARK)
        c.rect(19, y + 1, 4, 1, STEEL_DARK)
        # LEDs
        lit = (u + frame) % 2 == 0
        c.put(15, y + 1, GREEN if lit else GREEN_DARK)
        c.put(17, y + 1, AMBER if (u % 3 == 1 and not lit) else DARKPL_LIT)
    # cable bundle down the right side
    c.vline(24, -12, 32, hexc('#2f6fe0'))
    c.vline(23, -6, 26, hexc('#e05a5a'))
    # bottom grille
    for y in range(21, 25, 2):
        c.hline(9, y, 14, STEEL_DARK)
    return c


def photo_booth(state: str, frame: int = 0) -> Cell:
    """Badge photo booth: navy cabinet, PHOTO sign, curtain; flash frames."""
    c = Cell()
    c.ground_shadow(5, 27, 22, 3)
    c.box(6, -15, 20, 43, NAVY, NAVY_LIT, hexc('#141c33'))
    # sign
    c.rect(7, -14, 18, 7, DARKPL)
    c.hline(7, -14, 18, DARKPL_LIT)
    c.frame(6, -15, 20, 9, INK)
    text(c, 'PHOTO', 7, -13, GOLD if state == 'idle' else PAPER_LIT)
    # camera window
    flashing = state == 'flash'
    if flashing:
        bright = frame == 0
        c.rect(9, -4, 14, 8, PAPER_LIT if bright else hexc('#dbe6f2'))
        c.rect(10, -3, 12, 6, PAPER_LIT if bright else PAPER)
    else:
        c.rect(9, -4, 14, 8, SCREEN)
        c.rect(10, -3, 12, 6, hexc('#12233a'))
        c.rect(15, -1, 2, 2, SCREEN_GLOW)
        c.put(15, -1, SCREEN_GLOW_LIT)
    c.frame(8, -5, 16, 10, INK)
    # curtain
    for x in range(8, 24):
        col = CURTAIN_LIT if x % 4 == 0 else CURTAIN_DARK if x % 4 == 2 else CURTAIN
        c.vline(x, 7, 18, col)
    c.hline(8, 7, 16, INK)
    c.rect(7, 6, 18, 1, STEEL)
    c.hline(8, 24, 16, CURTAIN_DARK)
    c.frame(7, 6, 18, 20, INK)
    # stool leg peeking under the curtain
    c.rect(15, 25, 2, 3, STEEL_DARK)
    if flashing and frame == 0:
        # light spill onto the floor
        c.blend_rect(6, 26, 20, 3, hexc('#ffffff', 70))
    return c


def badge_printer(state: str, frame: int = 0) -> Cell:
    """Card printer on a steel stand. idle / printing (2 frames) / done."""
    c = Cell()
    c.ground_shadow(6, 27, 20, 3)
    # stand
    c.rect(8, 14, 16, 14, STEEL)
    c.hline(8, 14, 16, STEEL_LIT)
    c.vline(8, 14, 14, STEEL_LIT)
    c.vline(23, 14, 14, STEEL_DARK)
    c.rect(8, 25, 16, 3, STEEL_DARK)
    c.frame(7, 13, 18, 16, INK)
    c.rect(10, 17, 12, 6, DARKPL_DARK)  # open shelf with card stock
    c.rect(11, 18, 8, 4, PAPER)
    c.hline(11, 18, 8, PAPER_LIT)
    c.hline(12, 20, 5, PAPER_DARK)
    # printer body
    c.box(7, 1, 18, 11, PLASTIC, PLASTIC_LIT, PLASTIC_DARK)
    c.box(9, -3, 14, 4, PLASTIC_DARK, PLASTIC, DARKPL_LIT)  # hopper lid
    # screen + led
    c.rect(9, 3, 8, 4, DARKPL)
    c.frame(8, 2, 10, 6, INK)
    if state == 'idle':
        c.rect(10, 4, 6, 2, SCREEN_DIM)
        c.put(11, 4, SCREEN_GLOW)
        c.put(20, 3, AMBER)
    elif state == 'printing':
        c.rect(10, 4, 6, 2, SCREEN_GLOW)
        c.put(20, 3, GREEN if frame == 0 else GREEN_DARK)
    else:
        c.rect(10, 4, 6, 2, GREEN_DARK)
        c.hline(11, 4, 3, GREEN)
        c.put(20, 3, GREEN)
    c.rect(19, 6, 4, 2, DARKPL_LIT)
    # card slot
    c.rect(9, 9, 14, 2, DARKPL)
    c.hline(9, 9, 14, DARKPL_DARK)
    if state == 'printing':
        drop = 0 if frame == 0 else 3
        c.rect(12, 8 + drop, 8, 4, PAPER)
        c.hline(12, 8 + drop, 8, PAPER_LIT)
        c.rect(13, 9 + drop, 2, 2, GOLD)
        c.frame(11, 7 + drop, 10, 6, INK)
    elif state == 'done':
        # the badge, face up in the tray
        c.rect(12, 12, 8, 5, PAPER)
        c.hline(12, 12, 8, PAPER_LIT)
        c.rect(13, 13, 2, 3, hexc('#e8b896'))
        c.hline(16, 13, 3, NAVY)
        c.hline(16, 15, 2, PAPER_DARK)
        c.frame(11, 11, 10, 7, INK)
    return c


def filing_cabinet(open_: bool) -> Cell:
    c = Cell()
    c.ground_shadow(6, 27, 20, 3)
    c.box(7, -8, 18, 36, STEEL, STEEL_LIT, STEEL_DARK)
    c.rect(7, 25, 18, 3, STEEL_DARK)
    for d in range(3):
        y = -6 + d * 11
        if open_ and d == 1:
            # drawer pulled out: dark interior, folder tabs
            c.rect(8, y, 16, 9, DARKPL_DARK)
            for i, col in enumerate((MUG_A, MUG_C, MUG_B, GREEN)):
                c.rect(9 + i * 4, y + 1, 3, 6, PAPER)
                c.rect(9 + i * 4, y + 1, 3, 1, col)
            c.rect(6, y + 7, 20, 4, STEEL)
            c.hline(6, y + 7, 20, STEEL_LIT)
            c.frame(5, y + 6, 22, 6, INK)
            c.rect(13, y + 8, 6, 1, INK)
            continue
        c.hline(8, y, 16, STEEL_LIT)
        c.hline(8, y + 9, 16, STEEL_DARK)
        c.hline(7, y + 10, 18, INK)
        c.rect(13, y + 3, 6, 2, INK)  # handle
        c.put(14, y + 3, STEEL_LIT)
        c.rect(9, y + 2, 3, 3, PAPER)  # label
        c.put(10, y + 3, PAPER_DARK)
    return c


def sofa(part: str) -> Cell:
    """Two-wide People Ops sofa, mustard fabric."""
    c = Cell()
    left = part == 'l'
    x0 = 3 if left else 0
    x1 = 32 if left else 29
    w = x1 - x0
    c.ground_shadow(x0 + 1, 27, w - 2, 3)
    # back rest
    c.rect(x0, 4, w, 10, MUSTARD)
    c.hline(x0, 4, w, MUSTARD_LIT)
    c.rect(x0, 12, w, 2, MUSTARD_DARK)
    c.hline(x0, 3, w, INK)
    # seat cushion
    c.rect(x0, 14, w, 8, MUSTARD_LIT)
    c.hline(x0, 14, w, mix(MUSTARD_LIT, PAPER_LIT, 0.3))
    c.rect(x0, 20, w, 2, MUSTARD)
    c.hline(x0, 13, w, MUSTARD_DARK)
    # front skirt
    c.rect(x0, 22, w, 4, MUSTARD_DARK)
    c.hline(x0, 26, w, INK)
    # cushion seam
    seam = 16 if left else 15
    c.vline(seam, 14, 8, MUSTARD_DARK)
    # arm rest on the outer end
    if left:
        c.rect(x0, 8, 5, 18, MUSTARD)
        c.vline(x0, 8, 18, MUSTARD_LIT)
        c.hline(x0, 8, 5, MUSTARD_LIT)
        c.vline(x0 + 4, 9, 17, MUSTARD_DARK)
        c.vline(x0 - 1, 7, 20, INK)
        c.hline(x0, 7, 5, INK)
    else:
        c.rect(x1 - 5, 8, 5, 18, MUSTARD)
        c.hline(x1 - 5, 8, 5, MUSTARD_LIT)
        c.vline(x1 - 1, 9, 17, MUSTARD_DARK)
        c.vline(x1, 7, 20, INK)
        c.hline(x1 - 5, 7, 5, INK)
    # feet
    c.rect(x0 + 2, 26, 2, 2, WALNUT_DARK)
    c.rect(x1 - 4, 26, 2, 2, WALNUT_DARK)
    return c


def people_counter(part: str) -> Cell:
    """Self-service People Ops counter: oak front, white top; the tray is the m part."""
    c = Cell()
    left_end = part == 'l'
    right_end = part == 'r'
    x0 = 1 if left_end else 0
    x1 = 31 if right_end else 32
    w = x1 - x0
    c.ground_shadow(x0 + 1, 28, w - 3, 3)
    c.rect(x0, 8, w, 20, OAK)
    c.hline(x0, 8, w, OAK_LIT)
    c.rect(x0, 26, w, 2, OAK_DARK)
    for x in range(x0 + 2, x1 - 1, 6):  # slat panelling
        c.vline(x, 10, 15, OAK_DARK)
    top = hexc('#eceae2')
    top_lit = hexc('#fbfaf6')
    top_dark = hexc('#b9b6aa')
    c.rect(x0, -6, w, 13, top)
    c.hline(x0, -6, w, top_lit)
    c.hline(x0, -5, w, top_lit)
    c.rect(x0, 5, w, 2, top_dark)
    c.hline(x0, 7, w, INK)
    c.hline(x0, -7, w, INK)
    c.hline(x0, 28, w, INK)
    if left_end:
        c.vline(x0 - 1, -7, 36, INK)
        c.vline(x0, -6, 13, top_lit)
    if right_end:
        c.vline(x1, -7, 36, INK)
        c.vline(x1 - 1, -6, 13, top_dark)
    if part == 'l':
        # TAKE A NUMBER dispenser with a red ticket
        c.box(8, -4, 12, 8, RED_DARK, RED, hexc('#7a2424'))
        c.rect(10, -2, 8, 3, PAPER)
        c.hline(11, -1, 5, PAPER_DARK)
        c.rect(13, 4, 3, 2, PAPER)
        c.put(14, 4, RED)
        c.rect(22, -3, 6, 7, PAPER)
        c.frame(21, -4, 8, 9, INK)
        c.hline(23, -1, 3, PAPER_DARK)
        c.hline(23, 1, 4, PAPER_DARK)
    elif part == 'm':
        # in-tray with a stack of packets, a sign that says IN, and a face drawn on the tray
        c.rect(7, -4, 16, 9, DARKPL)
        c.hline(7, -4, 16, DARKPL_LIT)
        c.frame(6, -5, 18, 11, INK)
        c.rect(9, -3, 12, 6, PAPER)
        c.hline(9, -3, 12, PAPER_LIT)
        c.hline(10, -1, 9, PAPER_DARK)
        c.hline(10, 1, 6, PAPER_DARK)
        c.rect(11, 2, 8, 3, hexc('#ffe27a'))  # a sticky note with two eyes and a mouth
        c.put(12, 3, INK)
        c.put(14, 3, INK)
        c.hline(13, 4, 3, INK)
        text(c, 'IN', 25, -3, INK)
    else:
        # succulent + tissue box
        c.rect(6, -2, 7, 6, PAPER)
        c.hline(6, -2, 7, PAPER_LIT)
        c.rect(8, -1, 3, 1, hexc('#a8d8ff'))
        c.frame(5, -3, 9, 8, INK)
        pot = rows(
            """
            ..lLl..
            .lLLLl.
            lLLDLLl
            .OOOOO.
            .PPPDP.
            .PPPDP.
            ..OOO..
            """
        )
        c.paste(pot, 17, -5, {'L': LEAF, 'l': LEAF_LIT, 'D': LEAF_DARK, 'P': POT, 'O': INK}, outline=False)
    return c


def exec_desk(part: str) -> Cell:
    """Director's walnut desk with a leather inlay; lamp + nameplate on l, monitor on r."""
    c = Cell()
    left_end = part == 'l'
    x0 = 2 if left_end else 0
    x1 = 30 if not left_end else 32
    w = x1 - x0
    c.ground_shadow(x0 + 1, 27, w - 3, 3)
    # pedestal + modesty panel
    c.rect(x0, 15, w, 10, WALNUT)
    c.hline(x0, 15, w, WALNUT_LIT)
    c.rect(x0, 23, w, 2, WALNUT_DARK)
    for x in range(x0 + 3, x1 - 2, 8):
        c.frame(x, 17, 5, 5, WALNUT_DARK)
    # top with leather inlay
    c.rect(x0, -8, w, 24, WALNUT)
    c.hline(x0, -8, w, WALNUT_LIT)
    c.hline(x0, -7, w, WALNUT_LIT)
    c.rect(x0, 12, w, 3, WALNUT_DARK)
    c.hline(x0, 14, w, INK)
    c.hline(x0, -9, w, INK)
    c.hline(x0, 25, w, INK)
    inlay_x0 = x0 + 3 if left_end else x0
    inlay_x1 = x1 if left_end else x1 - 3
    c.rect(inlay_x0, -5, inlay_x1 - inlay_x0, 14, LEATHER)
    c.hline(inlay_x0, -5, inlay_x1 - inlay_x0, LEATHER_LIT)
    if left_end:
        c.vline(x0 - 1, -9, 35, INK)
        c.vline(x0, -8, 24, WALNUT_LIT)
        c.vline(inlay_x0 - 1, -5, 14, BRASS_DARK)
        # brass lamp
        c.rect(7, -14, 8, 4, BRASS)
        c.hline(7, -14, 8, BRASS_LIT)
        c.rect(8, -10, 6, 1, BRASS_DARK)
        c.frame(6, -15, 10, 6, INK)
        c.rect(10, -9, 2, 7, BRASS_DARK)
        c.rect(8, -2, 6, 2, BRASS)
        c.frame(7, -3, 8, 4, INK)
        c.blend_rect(7, -9, 8, 5, hexc('#ffe9a8', 60))
        # nameplate
        c.rect(18, 7, 12, 4, BRASS)
        c.hline(18, 7, 12, BRASS_LIT)
        c.frame(17, 6, 14, 6, INK)
        c.hline(20, 9, 8, INK)
    else:
        c.vline(x1, -9, 35, INK)
        c.vline(x1 - 1, -8, 24, WALNUT_DARK)
        c.vline(inlay_x1, -5, 14, BRASS_DARK)
        monitor(c, 8, -6, 0, wide=True)
        # pen cup
        c.rect(24, 3, 4, 5, DARKPL)
        c.frame(23, 2, 6, 7, INK)
        c.put(25, 1, MUG_B)
        c.put(26, 1, MUG_A)
        c.put(25, 0, INK)
        c.put(26, 0, INK)
    return c


def locker() -> Cell:
    c = Cell()
    c.ground_shadow(8, 27, 16, 3)
    body = hexc('#5b6f8c')
    body_lit = hexc('#7288a8')
    body_dark = hexc('#41526a')
    c.box(9, -12, 14, 40, body, body_lit, body_dark)
    c.rect(9, 25, 14, 3, body_dark)
    # door split into two compartments
    c.hline(9, 6, 14, INK)
    c.hline(9, 7, 14, body_lit)
    for y0 in (-10, 9):
        for y in range(y0, y0 + 5, 2):
            c.hline(12, y, 8, body_dark)  # vents
        c.rect(19, y0 + 9, 2, 4, INK)  # handle
        c.put(19, y0 + 10, STEEL_LIT)
    # padlock on the lower door
    c.rect(18, 18, 4, 3, BRASS)
    c.frame(18, 16, 4, 2, BRASS_DARK)
    c.put(19, 19, INK)
    return c


def janitor_cart() -> Cell:
    c = Cell()
    c.ground_shadow(6, 27, 20, 3)
    # bucket body
    c.box(8, 10, 16, 14, SAFETY, mix(SAFETY, PAPER_LIT, 0.3), SAFETY_DARK)
    c.rect(8, 21, 16, 3, SAFETY_DARK)
    c.hline(9, 12, 14, SAFETY_DARK)
    # water
    c.rect(10, 11, 12, 2, WATER_DARK)
    c.hline(10, 11, 12, WATER)
    # wringer
    c.rect(20, 5, 6, 6, STEEL)
    c.frame(19, 4, 8, 8, INK)
    c.rect(21, 6, 4, 4, STEEL_DARK)
    # mop handle + head
    c.rect(12, -14, 2, 26, WOOD)
    c.vline(12, -14, 26, WOOD_LIT)
    c.frame(11, -15, 4, 28, INK)
    for i, dx in enumerate((-4, -2, 0, 2, 4, 6)):
        c.vline(12 + dx, 6 + (i % 2), 4, PAPER_DARK if i % 2 else PAPER)
    c.rect(8, 5, 10, 2, STEEL_DARK)
    c.hline(7, 6, 12, INK)
    # trash bag hooked on the side
    c.rect(4, 12, 5, 9, DARKPL)
    c.hline(4, 12, 5, DARKPL_LIT)
    c.frame(3, 11, 7, 11, INK)
    # casters
    c.rect(9, 26, 3, 2, DARKPL)
    c.rect(20, 26, 3, 2, DARKPL)
    return c


def safe() -> Cell:
    c = Cell()
    c.ground_shadow(6, 27, 20, 3)
    body = hexc('#3a3f4b')
    body_lit = hexc('#535a69')
    body_dark = hexc('#262a33')
    c.box(7, -6, 18, 34, body, body_lit, body_dark)
    c.rect(7, 25, 18, 3, body_dark)
    c.frame(9, -4, 14, 26, body_dark)  # door recess
    # dial
    c.rect(13, 3, 6, 6, STEEL)
    c.frame(12, 2, 8, 8, INK)
    c.put(15, 4, INK)
    c.put(15, 5, STEEL_DARK)
    # handle
    c.rect(20, 5, 2, 8, STEEL_DARK)
    c.vline(20, 5, 8, STEEL_LIT)
    c.frame(19, 4, 4, 10, INK)
    # sticky note with the combination on the door
    c.rect(11, 14, 8, 5, hexc('#ffe27a'))
    c.hline(12, 16, 5, INK)
    c.frame(10, 13, 10, 7, INK)
    # hinges
    c.rect(8, -3, 1, 4, STEEL_LIT)
    c.rect(8, 12, 1, 4, STEEL_LIT)
    return c


def shredder(state: str, frame: int = 0) -> Cell:
    """Cross-cut shredder. idle / shredding (2 frames: a sheet feeding in, strips falling)."""
    c = Cell()
    c.ground_shadow(7, 27, 18, 3)
    # bin
    c.box(8, 6, 16, 22, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(8, 25, 16, 3, DARKPL_DARK)
    # clear window with strips
    c.rect(10, 12, 12, 11, hexc('#1a2233'))
    for i in range(6):
        x = 11 + i * 2
        h = 5 + (i * 3) % 4 if state != 'idle' else 3 + (i * 2) % 3
        c.vline(x, 23 - h, h, PAPER if i % 2 == 0 else PAPER_DARK)
    c.blend_rect(10, 12, 12, 11, GLASS)
    c.frame(9, 11, 14, 13, INK)
    # head unit
    c.box(6, 0, 20, 6, PLASTIC_DARK, PLASTIC, DARKPL_LIT)
    c.rect(9, 1, 14, 2, DARKPL)  # slot
    c.put(23, 3, GREEN if state == 'shredding' else AMBER)
    if state == 'shredding':
        # sheet going in
        drop = 0 if frame == 0 else 2
        c.rect(11, -8 + drop, 10, 8 - drop, PAPER)
        c.hline(11, -8 + drop, 10, PAPER_LIT)
        c.hline(13, -6 + drop, 6, PAPER_DARK)
        c.hline(13, -4 + drop, 4, PAPER_DARK)
        c.frame(10, -9 + drop, 12, 9 - drop, INK)
        # strips dropping inside the window
        for i in range(3):
            c.put(12 + i * 3, 13 + frame + i, PAPER)
    return c


def break_table_f2(part: str) -> Cell:
    """Facilities table: donut box on l, an OUT OF ORDER sign and a mug on r."""
    c = Cell()
    left = part == 'l'
    x0 = 3 if left else 0
    x1 = 32 if left else 29
    w = x1 - x0
    c.ground_shadow(x0 + 2, 27, w - 4, 3)
    c.rect(x0, 2, w, 14, PLASTIC)
    c.hline(x0, 2, w, PLASTIC_LIT)
    c.hline(x0, 3, w, PLASTIC_LIT)
    c.rect(x0, 13, w, 3, PLASTIC_DARK)
    c.hline(x0, 1, w, INK)
    c.hline(x0, 16, w, INK)
    if left:
        c.vline(x0 - 1, 2, 15, INK)
        c.vline(x0, 3, 12, PLASTIC_LIT)
    else:
        c.vline(x1, 2, 15, INK)
        c.vline(x1 - 1, 3, 12, PLASTIC_DARK)
    c.rect(14, 17, 4, 9, STEEL_DARK)
    c.vline(14, 17, 9, STEEL)
    c.rect(10, 26, 12, 2, STEEL_DARK)
    c.hline(10, 26, 12, STEEL)
    c.frame(9, 25, 14, 4, INK)
    c.vline(13, 17, 9, INK)
    c.vline(18, 17, 9, INK)
    if left:
        # open donut box: lid up, three donuts, one missing
        c.rect(9, -4, 16, 8, PINK_BOX)
        c.hline(9, -4, 16, PINK_BOX_LIT)
        c.frame(8, -5, 18, 10, INK)
        c.rect(9, 5, 16, 8, PINK_BOX_DARK)
        c.frame(8, 4, 18, 10, INK)
        for i, dx in enumerate((10, 15, 20)):
            if i == 2:
                continue
            c.rect(dx, 6, 4, 4, DONUT)
            c.hline(dx, 6, 4, DONUT_ICING)
            c.put(dx + 1, 8, PINK_BOX_DARK)
        c.rect(20, 7, 3, 2, PAPER_DARK)  # the napkin where the third one was
    else:
        c.rect(6, 6, 5, 5, MUG_B)
        c.hline(6, 6, 5, mix(MUG_B, PAPER_LIT, 0.45))
        c.frame(5, 5, 7, 7, INK)
        c.vline(12, 7, 3, INK)
        c.put(11, 7, MUG_B)
        c.put(11, 9, MUG_B)
        # folded sign
        c.rect(15, 5, 10, 7, PAPER)
        c.hline(15, 5, 10, PAPER_LIT)
        c.frame(14, 4, 12, 9, INK)
        c.hline(17, 7, 6, RED_DARK)
        c.hline(17, 9, 4, PAPER_DARK)
    return c


def build_floor2() -> None:
    register('floor_it', floor_it())
    register('floor_people', floor_people())
    register('floor_director', floor_director())
    register('floor_facilities', floor_facilities())
    register('floor_finance', floor_finance())
    for part in ('l', 'r', 'c'):
        register(f'rug_gold_{part}', rug_patch(RUG_GOLD, part))
    for part in ('tbl', 'tb', 'tbr'):
        register(f'rug_navy_{part}', rug_patch(RUG_NAVY, part))
    register('door_v_single', door_v_single())
    register('plaque_ops_l', plaque_ops('l'))
    register('plaque_ops_m', plaque_ops('m'))
    register('plaque_ops_r', plaque_ops('r'))
    register('ticketboard_l', ticket_board('l'))
    register('ticketboard_r', ticket_board('r'))
    register('orgchart_l', org_chart('l'))
    register('orgchart_r', org_chart('r'))
    register('incident_l', incident_board('l'))
    register('incident_r', incident_board('r'))
    register('compliance_poster', compliance_poster())
    register('breaker_panel', breaker_panel())
    register('calendar', calendar())
    register('server_status', server_status())
    register('sign_helpdesk', sign_room('HELPDESK'))
    register('sign_people', sign_room('PEOPLE'))
    register('sign_finance', sign_room('FINANCE'))
    register('sign_pantry', sign_room('PANTRY'))
    register('nameplate_kessler', nameplate('KESSLER'))
    register('directory_f2', directory_f2())
    register_group(['server_rack_0', 'server_rack_1'], [server_rack(0), server_rack(1)])
    register('photo_booth_idle', photo_booth('idle'))
    register_group(
        ['photo_booth_flash_0', 'photo_booth_flash_1'],
        [photo_booth('flash', 0), photo_booth('flash', 1)],
    )
    register('badge_printer_idle', badge_printer('idle'))
    register_group(
        ['badge_printer_printing_0', 'badge_printer_printing_1'],
        [badge_printer('printing', 0), badge_printer('printing', 1)],
    )
    register('badge_printer_done', badge_printer('done'))
    register('filing_closed', filing_cabinet(False))
    register('filing_open', filing_cabinet(True))
    register('sofa_l', sofa('l'))
    register('sofa_r', sofa('r'))
    register('pcounter_l', people_counter('l'))
    register('pcounter_m', people_counter('m'))
    register('pcounter_r', people_counter('r'))
    register('exec_desk_l', exec_desk('l'))
    register('exec_desk_r', exec_desk('r'))
    register('locker', locker())
    register('janitor_cart', janitor_cart())
    register('safe', safe())
    register('shredder_idle', shredder('idle'))
    register_group(
        ['shredder_shredding_0', 'shredder_shredding_1'],
        [shredder('shredding', 0), shredder('shredding', 1)],
    )
    register('btable_f2_l', break_table_f2('l'))
    register('btable_f2_r', break_table_f2('r'))


# ===========================================================================
# Floors 3–5 — Product / Sales / Exec. Appended after every Floor 1+2 cell
# so those indices never move (docs/rpg/floor-3-5-design.md §7).
# ===========================================================================

FLOORS_F35 = {
    'war': (hexc('#6a4a32'), hexc('#7d5a3e'), hexc('#563a28')),
    'intake': (hexc('#5a4a6e'), hexc('#6a5a80'), hexc('#4a3c5c')),
    'product': (hexc('#3a4a68'), hexc('#46587a'), hexc('#2e3c56')),
    'pipeline': (hexc('#6a3a32'), hexc('#7d4a3e'), hexc('#562e28')),
    'client': (hexc('#6a5a3a'), hexc('#7d6c48'), hexc('#56482e')),
    'board': (hexc('#2a2438'), hexc('#3a3450'), hexc('#1c1828')),
}

CORK_F3 = hexc('#c4a06a')
CORK_F3_LIT = hexc('#e0c08a')
CORK_F3_DARK = hexc('#8a6a40')
STICKY_Y = hexc('#f4d35e')
STICKY_P = hexc('#f2a7c3')
STICKY_B = hexc('#8ec5f0')
STICKY_G = hexc('#8fd3a3')
PLUM = hexc('#6a3a78')
PLUM_LIT = hexc('#8a5a98')
WINE = hexc('#6a2a38')
WINE_LIT = hexc('#8a3a4a')


def floor_war() -> Cell:
    """Warm cork tile, 16px, ochre flecks like fallen stickies."""
    base, lit, dark = FLOORS_F35['war']
    c = Cell()
    floor_base(c, base)
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            c.hline(ox, oy, 16, dark)
            c.vline(ox, oy, 16, dark)
            c.hline(ox + 1, oy + 1, 15, lit)
            for k, (sx, sy) in enumerate(((4, 6), (11, 3), (8, 12), (13, 9))):
                c.put(ox + sx, oy + sy, STICKY_Y if k % 2 == 0 else dark)
    return c


def floor_intake() -> Cell:
    """Lilac carpet, 8px herringbone."""
    base, lit, dark = FLOORS_F35['intake']
    c = Cell()
    floor_base(c, base)
    for y in range(32):
        for x in range(32):
            band = (x // 8 + y // 8) % 2
            if band == 0 and (x + y) % 4 == 0:
                c.put(x, y, lit)
            elif band == 1 and (x - y) % 4 == 0:
                c.put(x, y, lit)
            elif (x * 5 + y * 3) % 17 == 0:
                c.put(x, y, dark)
    return c


def floor_product() -> Cell:
    """Slate-blue carpet tiles, 8px, alternating pile."""
    base, lit, dark = FLOORS_F35['product']
    c = Cell()
    floor_base(c, base)
    for qy in range(4):
        for qx in range(4):
            ox, oy = qx * 8, qy * 8
            horizontal = (qx + qy) % 2 == 0
            for i in range(8):
                for j in range(8):
                    x, y = ox + i, oy + j
                    if horizontal and j % 4 == 1 and i % 2 == 0:
                        c.put(x, y, lit)
                    elif not horizontal and i % 4 == 1 and j % 2 == 0:
                        c.put(x, y, lit)
            c.hline(ox, oy, 8, dark)
            c.vline(ox, oy, 8, dark)
    return c


def floor_pipeline() -> Cell:
    """Terracotta tile, 16px, warm grout."""
    base, lit, dark = FLOORS_F35['pipeline']
    c = Cell()
    floor_base(c, base)
    for qy in range(2):
        for qx in range(2):
            ox, oy = qx * 16, qy * 16
            c.hline(ox, oy, 16, dark)
            c.vline(ox, oy, 16, dark)
            c.hline(ox + 1, oy + 1, 15, lit)
            c.put(ox + 6, oy + 8, GOLD_DARK)
            c.put(ox + 12, oy + 4, dark)
    return c


def floor_client() -> Cell:
    """Sand herringbone — the client-facing carpet."""
    base, lit, dark = FLOORS_F35['client']
    c = Cell()
    floor_base(c, base)
    for y in range(32):
        for x in range(32):
            if (x + y) % 6 == 0:
                c.put(x, y, lit)
            elif (x + y) % 6 == 3 and x % 2 == 0:
                c.put(x, y, dark)
    return c


def floor_board() -> Cell:
    """Near-black plush with a gold fleck — the boardroom."""
    base, lit, dark = FLOORS_F35['board']
    c = Cell()
    floor_base(c, base)
    for y in range(32):
        for x in range(32):
            if (x + y) % 7 == 0:
                c.put(x, y, lit)
            elif (x * 3 + y * 5) % 23 == 0:
                c.put(x, y, GOLD_DARK)
            elif (x + y) % 7 == 3 and x % 2 == 0:
                c.put(x, y, dark)
    return c


def plaque_dept(part: str, title: str, floor_n: str, accent: RGBA) -> Cell:
    """3-tile hall plaque: rising bars + TITLE / FLOOR n."""
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
    for i, h in enumerate((3, 5, 8, 11)):
        c.rect(off + 5 + i * 4, 23 - h, 3, h, accent if i < 3 else mix(accent, PAPER_LIT, 0.4))
    c.hline(off + 4, 23, 17, mix(accent, INK, 0.4))
    text(c, title, off + 26, 13, accent)
    c.hline(off + 26, 19, max(24, len(title) * 4), mix(accent, INK, 0.5))
    text(c, f'FLOOR {floor_n}', off + 26, 20, PAPER)
    return c


def directory_floor(n: str, bar: RGBA) -> Cell:
    c = Cell()
    c.ground_shadow(7, 27, 18, 3)
    c.rect(14, 12, 4, 15, STEEL_DARK)
    c.vline(14, 12, 15, STEEL)
    c.rect(10, 26, 12, 2, STEEL_DARK)
    c.hline(10, 26, 12, STEEL)
    c.frame(9, 25, 14, 4, INK)
    c.vline(13, 12, 14, INK)
    c.vline(18, 12, 14, INK)
    c.box(3, -8, 26, 20, DARKPL, DARKPL_LIT, DARKPL_DARK)
    c.rect(4, -7, 24, 3, bar)
    c.hline(4, -7, 24, mix(bar, PAPER_LIT, 0.4))
    text(c, f'FLOOR {n}', 3, -3, PAPER)
    for i in range(3):
        y = 3 + i * 3
        c.hline(5, y, 3, mix(bar, INK, 0.4))
        c.hline(9, y, 12 - (i * 4) % 7, PLASTIC_DARK)
    return c


def roadmap_wall() -> Cell:
    """Cork war-room wall: NOW / LATER columns, one yellow card peeling."""
    c = Cell()
    c.ground_shadow(4, 27, 24, 3)
    c.box(5, -12, 22, 40, CORK_F3, CORK_F3_LIT, CORK_F3_DARK)
    c.rect(6, -11, 20, 5, DARKPL)
    c.hline(6, -11, 20, DARKPL_LIT)
    text(c, 'Q4', 12, -10, GOLD)
    text(c, 'NOW', 7, -4, PAPER)
    text(c, 'LATER', 16, -4, PAPER_DARK)
    c.vline(15, -4, 28, CORK_F3_DARK)
    # later column — a novel of cards
    for i, col in enumerate((STICKY_B, STICKY_P, STICKY_G, STICKY_B, STICKY_P, STICKY_Y)):
        c.rect(17, 2 + i * 4, 8, 3, col)
        c.hline(17, 2 + i * 4, 8, mix(col, PAPER_LIT, 0.35))
        c.frame(16, 1 + i * 4, 10, 5, INK)
    # now column — empty except one peeling yellow
    c.rect(7, 8, 7, 5, STICKY_Y)
    c.hline(7, 8, 7, mix(STICKY_Y, PAPER_LIT, 0.4))
    c.frame(6, 7, 9, 7, INK)
    c.put(13, 9, STICKY_Y)  # dog-ear
    return c


def intake_board() -> Cell:
    """Research intake: lilac frame, stickies coded by how tired Nico is."""
    c = Cell()
    c.ground_shadow(5, 27, 22, 3)
    c.box(6, -10, 20, 38, PLUM, PLUM_LIT, hexc('#4a2860'))
    c.rect(7, -9, 18, 5, DARKPL)
    text(c, 'INTAKE', 8, -8, PAPER)
    tickets = (
        (8, 0, STICKY_Y),
        (14, 0, STICKY_P),
        (20, 0, STICKY_B),
        (8, 6, STICKY_G),
        (14, 6, STICKY_Y),
        (8, 12, STICKY_P),
        (14, 12, STICKY_B),
        (20, 12, STICKY_Y),
        (8, 18, STICKY_G),
    )
    for x, y, col in tickets:
        c.rect(x, y, 5, 4, col)
        c.hline(x, y, 5, mix(col, PAPER_LIT, 0.35))
        c.frame(x - 1, y - 1, 7, 6, INK)
    return c


def pipeline_board() -> Cell:
    """Sales pipeline: everything Closing, nothing Closed."""
    c = Cell()
    c.ground_shadow(5, 27, 22, 3)
    c.box(6, -10, 20, 38, WINE, WINE_LIT, hexc('#4a1e28'))
    c.rect(7, -9, 18, 5, DARKPL)
    text(c, 'PIPE', 10, -8, GOLD)
    # three columns
    for i, label_x in enumerate((7, 13, 19)):
        c.vline(label_x + 5, -2, 28, hexc('#4a1e28'))
    c.rect(8, 0, 4, 3, STICKY_Y)
    c.rect(8, 5, 4, 3, STICKY_Y)
    c.rect(8, 10, 4, 3, STICKY_P)
    c.rect(14, 0, 4, 3, STICKY_Y)
    c.rect(14, 5, 4, 3, STICKY_Y)
    c.rect(14, 10, 4, 3, STICKY_Y)
    c.rect(14, 15, 4, 3, STICKY_P)
    # closed column: empty except a sad sticky
    c.rect(20, 20, 4, 3, STICKY_G)
    for x, y in ((8, 0), (8, 5), (8, 10), (14, 0), (14, 5), (14, 10), (14, 15), (20, 20)):
        c.frame(x - 1, y - 1, 6, 5, INK)
    return c


def sideboard() -> Cell:
    """Walnut exec sideboard; gold-clipped board packet on top."""
    c = Cell()
    c.ground_shadow(3, 27, 26, 3)
    c.box(4, 8, 24, 20, WALNUT, WALNUT_LIT, WALNUT_DARK)
    c.rect(5, 10, 10, 8, WALNUT_DARK)
    c.rect(17, 10, 10, 8, WALNUT_DARK)
    c.frame(4, 9, 12, 10, INK)
    c.frame(16, 9, 12, 10, INK)
    c.put(9, 14, BRASS)
    c.put(21, 14, BRASS)
    # packet
    c.rect(10, -2, 12, 10, PAPER)
    c.hline(10, -2, 12, PAPER_LIT)
    c.frame(9, -3, 14, 12, INK)
    c.rect(14, -3, 4, 3, GOLD)
    c.hline(11, 2, 10, PAPER_DARK)
    c.hline(11, 4, 8, PAPER_DARK)
    return c


def build_floor35() -> None:
    register('floor_war', floor_war())
    register('floor_intake', floor_intake())
    register('floor_product', floor_product())
    register('floor_pipeline', floor_pipeline())
    register('floor_client', floor_client())
    register('floor_board', floor_board())
    for part in ('l', 'm', 'r'):
        register(f'plaque_product_{part}', plaque_dept(part, 'PRODUCT', '3', GOLD))
        register(f'plaque_sales_{part}', plaque_dept(part, 'SALES', '4', hexc('#e08a4a')))
        register(f'plaque_exec_{part}', plaque_dept(part, 'EXEC', '5', hexc('#e0d0a0')))
    register('sign_war', sign_room('WAR'))
    register('sign_intake', sign_room('INTAKE'))
    register('sign_pipeline', sign_room('PIPE'))
    register('sign_client', sign_room('CLIENT'))
    register('sign_board', sign_room('BOARD'))
    register('nameplate_quincy', nameplate('QUINCY'))
    register('nameplate_ashford', nameplate_tight('ASHFORD'))
    register('nameplate_caldwell', nameplate_tight('CALDWELL'))
    register('directory_f3', directory_floor('3', hexc('#c47a3a')))
    register('directory_f4', directory_floor('4', hexc('#d45a3a')))
    register('directory_f5', directory_floor('5', hexc('#e0d0a0')))
    register('roadmap_wall', roadmap_wall())
    register('intake_board', intake_board())
    register('pipeline_board', pipeline_board())
    register('sideboard', sideboard())


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
    # Floor 2 cells are appended so every Floor 1 index above stays put.
    build_floor2()
    # Floors 3–5 append after Floor 2 so 1 and 2 never move.
    build_floor35()


def extrude(im: Image.Image) -> Image.Image:
    """Pad a cell by PAD, replicating its edge pixels outward."""
    out = Image.new('RGBA', (STRIDE_X, STRIDE_Y), (0, 0, 0, 0))
    out.paste(im, (PAD, PAD))
    w, h = im.size
    left = im.crop((0, 0, 1, h))
    right = im.crop((w - 1, 0, w, h))
    top = im.crop((0, 0, w, 1))
    bottom = im.crop((0, h - 1, w, h))
    for i in range(PAD):
        out.paste(left, (i, PAD))
        out.paste(right, (PAD + w + i, PAD))
        out.paste(top, (PAD, i))
        out.paste(bottom, (PAD, PAD + h + i))
    for (cx, cy), (px, py) in (
        ((0, 0), (0, 0)),
        ((w - 1, 0), (PAD + w, 0)),
        ((0, h - 1), (0, PAD + h)),
        ((w - 1, h - 1), (PAD + w, PAD + h)),
    ):
        out.putpixel((px, py), im.getpixel((cx, cy)))
    return out


def build_sheet() -> tuple[Image.Image, dict[str, tuple[int, int]]]:
    rows_needed = (len(ATLAS) + COLS - 1) // COLS
    sheet = Image.new('RGBA', (COLS * STRIDE_X, rows_needed * STRIDE_Y), (0, 0, 0, 0))
    index: dict[str, tuple[int, int]] = {}
    for i, (name, cell) in enumerate(ATLAS):
        if not name:
            continue
        col, row = i % COLS, i // COLS
        sheet.paste(extrude(cell.to_image()), (col * STRIDE_X, row * STRIDE_Y))
        index[name] = (col, row)
    return sheet, index


def emit_ts(index: dict[str, tuple[int, int]], sheet: Image.Image) -> str:
    lines = [
        '// Generated by scripts/gen_office_tiles.py — do not edit by hand.',
        '// Cell = 32×48 art in a 34×50 slot (1px extruded border); the tile footprint',
        '// is the bottom 32×32 of the art, props overflow the 16px above it.',
        '',
        'export const TILE_SHEET_URL = \'/office/tiles.png\'',
        f'export const TILE_CELL_W = {CELL_W}',
        f'export const TILE_CELL_H = {CELL_H}',
        f'export const TILE_PAD = {PAD}',
        f'export const TILE_STRIDE_X = {STRIDE_X}',
        f'export const TILE_STRIDE_Y = {STRIDE_Y}',
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
