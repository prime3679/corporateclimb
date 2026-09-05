#!/usr/bin/env python3
"""Floor 1 overworld walk-cycle sheets — hand-authored pixel art.

Each sheet is 128x160 RGBA: 4 columns x 4 rows, frame 32x40.
Columns: idle, stepL, idle, stepR. Rows: s, w, e, n (matches
OverworldActor.module.css). W is the mirror of E.

Every actor is drawn from the same chibi rig so the cast reads as one
world: 13px head, 10px torso, 9px legs, feet on y=33, ~8px of head
overflowing the tile above (the CSS positions the cell at tile_y - 8).
Light comes from the top-left; every material has a lit / base / shadow
ramp; a single plum ink outlines the silhouette and separates head,
arms and props from the torso (selective outlines, Gen-4 style).

The art is authored as ASCII pixel templates below. Keys:

    .  transparent          O  ink outline
    k  skin   K skin shadow l  skin light
    H  hair   h hair light  G  hair dark
    e  eye    m mouth       w  eye white
    J  jacket j shadow      i  jacket light
    S  shirt  s shirt shadow
    T  accent (tie / lanyard) t accent shadow
    P  pants  p pants shadow
    B  shoe   d shoe dark   b sole / shoe light
    X  prop   x prop shadow y prop light  z prop screen
    1-6 per-character extras (pins, stickies, patchwork)

Usage:
    python3 scripts/gen_office_actors.py            # write sheets
    python3 scripts/gen_office_actors.py --preview  # also dump a 4x contact sheet to /tmp
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

FRAME_W = 32
FRAME_H = 40
COLS = 4
ROWS = 4
SHEET_W = FRAME_W * COLS
SHEET_H = FRAME_H * ROWS
FACINGS = ('s', 'w', 'e', 'n')
FRAMES = ('idle', 'stepL', 'idle', 'stepR')

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / 'public' / 'office' / 'actors'

RGBA = tuple[int, int, int, int]
INK: RGBA = (27, 23, 38, 255)


def hexc(value: str) -> RGBA:
    v = value.lstrip('#')
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16), 255


def rows(block: str) -> list[str]:
    """Strip indentation / blank lines from a template literal."""
    out = [ln.strip() for ln in block.strip('\n').splitlines()]
    return [ln for ln in out if ln]


def mirror(block: list[str]) -> list[str]:
    return [ln[::-1] for ln in block]


class Frame:
    """One 32x40 cell. Layers are pasted in order; `outline=True` inks the
    4-neighbour border of the layer over anything already drawn."""

    def __init__(self) -> None:
        self.px: dict[tuple[int, int], RGBA] = {}

    def paste(
        self,
        tpl: list[str],
        x0: int,
        y0: int,
        pal: dict[str, RGBA],
        outline: bool = True,
    ) -> None:
        cells: set[tuple[int, int]] = set()
        for dy, ln in enumerate(tpl):
            for dx, ch in enumerate(ln):
                if ch == '.':
                    continue
                x, y = x0 + dx, y0 + dy
                if not (0 <= x < FRAME_W and 0 <= y < FRAME_H):
                    continue
                cells.add((x, y))
                self.px[(x, y)] = INK if ch == 'O' else pal[ch]
        if not outline:
            return
        for x, y in cells:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if (nx, ny) in cells:
                    continue
                if 0 <= nx < FRAME_W and 0 <= ny < FRAME_H:
                    self.px[(nx, ny)] = INK

    def to_image(self) -> Image.Image:
        im = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        pix = im.load()
        for (x, y), c in self.px.items():
            pix[x, y] = c
        return im


# ---------------------------------------------------------------------------
# Shared rig — legs and arms. Origins are frame coordinates of the template's
# top-left. Step frames drop the hips by one pixel (body bob).
# ---------------------------------------------------------------------------

LEGS_S = {
    'idle': (
        (11, 25),
        rows(
            """
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            BBBBdBBBBd
            bbbbbbbbbb
            """
        ),
    ),
    'stepL': (
        (11, 26),
        rows(
            """
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            BBBBdPPPp.
            bbbbbPPPp.
            .....PPPp.
            .....BBBBd
            .....bbbbb
            """
        ),
    ),
    'stepR': (
        (11, 26),
        rows(
            """
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpPPPp.
            .PPPpBBBBd
            .PPPpbbbbb
            .PPPp.....
            BBBBd.....
            bbbbb.....
            """
        ),
    ),
}

# Wide-leg trousers (lead_design) — flare out toward the cuff.
LEGS_S_WIDE = {
    'idle': (
        (10, 25),
        rows(
            """
            ..PPPpPPPp..
            ..PPPpPPPp..
            ..PPPpPPPp..
            .PPPPpPPPPp.
            .PPPPpPPPPp.
            PPPPPpPPPPPp
            PPPPPpPPPPPp
            .BBBBd.BBBBd
            .bbbbb.bbbbb
            """
        ),
    ),
    'stepL': (
        (10, 26),
        rows(
            """
            ..PPPpPPPp..
            ..PPPpPPPp..
            .PPPPpPPPPp.
            .BBBBdPPPPp.
            .bbbbbPPPPPp
            ......PPPPPp
            ......BBBBd.
            ......bbbbb.
            """
        ),
    ),
    'stepR': (
        (10, 26),
        rows(
            """
            ..PPPpPPPp..
            ..PPPpPPPp..
            .PPPPpPPPPp.
            .PPPPpBBBBd.
            PPPPPpbbbbb.
            PPPPPp......
            .BBBBd......
            .bbbbb......
            """
        ),
    ),
}

LEGS_E = {
    'idle': (
        (12, 25),
        rows(
            """
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .BBBBBBd
            .bbbbbbb
            """
        ),
    ),
    # Contact pose: near leg forward, far leg trailing (shadow tone).
    'stepL': (
        (10, 26),
        rows(
            """
            ....PPPPpp..
            ...pPPPPpp..
            ..pppPPPpp..
            ..pp..PPPp..
            .ppp...PPPp.
            .ppp...PPPp.
            BBBd...BBBBd
            bbbb...bbbbb
            """
        ),
    ),
    'stepR': (
        (10, 26),
        rows(
            """
            ....PPPPpp..
            ...PPPPppp..
            ..PPPPpppp..
            ..PPP..ppp..
            .PPPp...ppp.
            .PPPp...ppp.
            BBBBd...BBBd
            bbbbb...bbbb
            """
        ),
    ),
}

LEGS_E_WIDE = {
    'idle': (
        (12, 25),
        rows(
            """
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            .PPPPpp.
            PPPPPppp
            PPPPPppp
            PPPPPppp
            .BBBBBBd
            .bbbbbbb
            """
        ),
    ),
    'stepL': (
        (10, 26),
        rows(
            """
            ....PPPPpp..
            ...pPPPPpp..
            ..pppPPPpp..
            ..ppp.PPPPp.
            .pppp..PPPPp
            .pppp..PPPPp
            BBBd...BBBBd
            bbbb...bbbbb
            """
        ),
    ),
    'stepR': (
        (10, 26),
        rows(
            """
            ....PPPPpp..
            ...PPPPppp..
            ..PPPPpppp..
            .PPPPp.pppp.
            PPPPPp..pppp
            PPPPPp..pppp
            BBBBd...BBBd
            bbbbb...bbbb
            """
        ),
    ),
}

# Arms are 2px sleeves ending in a hand. Front/back: hang beside the torso.
ARM_S = rows(
    """
    Jj
    Jj
    Jj
    Jj
    Jj
    Jj
    kK
    """
)
ARM_S_CUFF = rows(
    """
    Jj
    Jj
    Jj
    Jj
    Jj
    Ss
    kK
    """
)
# Side view: the near arm hangs over the torso's centre line.
ARM_E = rows(
    """
    Jj
    Jj
    Jj
    Jj
    Jj
    Jj
    kK
    """
)
ARM_E_CUFF = rows(
    """
    Jj
    Jj
    Jj
    Jj
    Jj
    Ss
    kK
    """
)


# ---------------------------------------------------------------------------
# Cast. Each actor: palette, three head templates (s / e / n) with anchors,
# three torso templates, optional props per facing, leg variant, quirks.
# ---------------------------------------------------------------------------

BASE_PALETTE = {
    'w': '#fff6ee',
    'm': '#a35a48',
}


def palette(spec: dict[str, str]) -> dict[str, RGBA]:
    merged = dict(BASE_PALETTE)
    merged.update(spec)
    return {k: hexc(v) for k, v in merged.items()}


Prop = tuple[str, tuple[int, int], list[str]]  # ('under' | 'hand', anchor, template)


class Actor:
    def __init__(
        self,
        name: str,
        colors: dict[str, str],
        head: dict[str, tuple[tuple[int, int], list[str]]],
        torso: dict[str, tuple[tuple[int, int], list[str]]],
        props: dict[str, list[Prop]] | None = None,
        wide_legs: bool = False,
        cuffs: bool = True,
        slouch: int = 0,
        arm_shift: dict[str, int] | None = None,
    ) -> None:
        self.name = name
        self.pal = palette(colors)
        self.head = head
        self.torso = torso
        self.props = props or {}
        self.wide_legs = wide_legs
        self.cuffs = cuffs
        self.slouch = slouch
        # Per-facing extra x offset for the near arm (side views) so the
        # arm sits on the torso's centre for narrower / wider builds.
        self.arm_shift = arm_shift or {}


# --- Gavin — Senior Associate, slicked hair, navy suit, gold pin, papers ----

GAVIN = Actor(
    'gavin',
    {
        'k': '#e8b896',
        'K': '#c48a64',
        'l': '#f4cdae',
        'H': '#1c1c26',
        'h': '#3c3e52',
        'G': '#0e0e14',
        'e': '#1a1210',
        'J': '#294a80',
        'j': '#1d3560',
        'i': '#37609f',
        'S': '#f4f4f0',
        's': '#c9cbd0',
        'T': '#152040',
        't': '#0e1630',
        'P': '#24407a',
        'p': '#192e58',
        'B': '#15151c',
        'd': '#0c0c10',
        'b': '#2a2a34',
        'X': '#f4f1ea',
        'x': '#cfc9bc',
        'y': '#ffffff',
        'z': '#8b8b96',
        '1': '#eab308',
        '2': '#cbd5e1',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HhhhHHHHHH..
                .HhhHHHHHHHHG.
                .HHHHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HHkkkkkkkkGG.
                .HkkkkkkkkkkG.
                ..kkGkkkkGkk..
                ..kkekkkkekk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..KkkkkkmkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HHhhhHHHHH..
                .HHHhhHHHHHHH.
                .HHHHHHHHHHHH.
                .HHHHHHHHHHHH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                .GHHHHKkkkGkk.
                ..GHHHKkkkekk.
                ..GHHHKkkkekkk
                ..GGHKKkkkkkK.
                ...KKkkkkkkK..
                ....KkkkkkK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HhhhHHHHHH..
                .HhhHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                ..HHHHHHHGGG..
                ..HHHHHHHGGG..
                ..HHHHHHGGGG..
                ..HGGGGGGGGG..
                ...KKkkkkKK...
                ...KkkkkkkK...
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                JJ1SSTTSJj
                JJJSSTTSJj
                JJJJSTTJJj
                JJJJJTTJJj
                JJJJJttJJj
                JJJJJtJJJj
                JJJJjOjJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                iJJJJSSj
                JJJJJSTj
                JJJJJSTj
                JJJJJJTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iiJJJJJJJj
                iJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Paper stack tucked under the left arm (viewer's right).
        's': [('under', (22, 20), rows("""
            XXXX
            XzzX
            XzzX
            XzzX
            xxxx
            """))],
        'e': [('under', (13, 21), rows("""
            XXXXXXX
            XzzzzzX
            xxxxxxx
            """))],
        'n': [('under', (6, 20), rows("""
            XXXX
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

# --- Holloway — interim team lead, tired, gray suit, blue tie, coffee -------

HOLLOWAY = Actor(
    'holloway',
    {
        'k': '#e0b090',
        'K': '#b88464',
        'l': '#ecc4a6',
        'H': '#5a4030',
        'h': '#7a5a44',
        'G': '#3c2a20',
        'e': '#241812',
        'J': '#5d616c',
        'j': '#464a54',
        'i': '#737884',
        'S': '#b8d4e8',
        's': '#8fb0c8',
        'T': '#2f6fe0',
        't': '#1f4fb0',
        'P': '#4f535d',
        'p': '#3b3e47',
        'B': '#4a3220',
        'd': '#33220f',
        'b': '#5e4530',
        'X': '#f5f5f5',
        'x': '#c8c8cc',
        'y': '#d4d4d8',
        'z': '#6b4a2e',
        '1': '#d9c9a2',
        '2': '#f4f1ea',
        '3': '#a8956e',
    },
    head={
        's': (
            (9, 3),
            rows(
                """
                ...HHHHhH.....
                .HHHHhhHHHHH..
                .HHHhHHHHHHHG.
                HHHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHkkkkkkkkHG.
                .HHkkkkkkkkHG.
                ..kkkkkkkkkk..
                ..kkekkkkekk..
                ..kkekkkkekk..
                ..kkKkkkkKkK..
                ..KkkkkkkkkK..
                ...KkkmmkkK...
                """
            ),
        ),
        'e': (
            (9, 3),
            rows(
                """
                ....HHHHhH....
                ..HHHHhhHHHH..
                .HHHHhHHHHHHH.
                .HHHHHHHHHHHHH
                .GHHHHHHHHHHH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                .GHHHHKkkkkkk.
                ..GHHHKkkkekk.
                ..GHHHKkkkekkk
                ..GGHKKkkkKkK.
                ...KKkkkkkkK..
                ....KkkkkmK...
                """
            ),
        ),
        'n': (
            (9, 3),
            rows(
                """
                ...HHHHhH.....
                .HHHHhhHHHHH..
                .HHHhHHHHHHHG.
                HHHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                ..HHHHHHHGGG..
                ..HHHHHHHGGG..
                ..HHHHHHGGGG..
                ..HHGGGGGGGG..
                ...KKkkkkKK...
                ...KkkkkkkK...
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 16),
            rows(
                """
                ...KKKK...
                JJSSSSSSJj
                JJJSSTTSJj
                JJJSSTTSJj
                JJJJSTTJJj
                JJJJJTTJJj
                JJJJJttJJj
                JJJJJtJJJj
                JJJJjOjJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 16),
            rows(
                """
                ..KKKK..
                JJJJJSSj
                JJJJJSTj
                JJJJJSTj
                JJJJJJTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 16),
            rows(
                """
                ...KKKK...
                JJJJJJJJJj
                iJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Binder under the left arm; white mug in the right hand.
        's': [
            ('under', (22, 19), rows("""
                1111
                1221
                1221
                1111
                1111
                3333
                """)),
            ('hand', (6, 21), rows("""
                XXX.
                XXXy
                XXXy
                xxx.
                """)),
        ],
        'e': [
            ('under', (13, 21), rows("""
                1111111
                1221111
                3333333
                """)),
            ('hand', (17, 21), rows("""
                .XXX
                yXXX
                yXXX
                .xxx
                """)),
        ],
        'n': [
            ('under', (6, 19), rows("""
                1111
                1111
                1111
                1111
                1111
                3333
                """)),
            ('hand', (22, 21), rows("""
                .XXX
                yXXX
                yXXX
                .xxx
                """)),
        ],
    },
    slouch=1,
)

# --- Priya — Ops, spiky hair, brown blazer, sticky-note badges, cards -------

PRIYA = Actor(
    'priya',
    {
        'k': '#ecc0a0',
        'K': '#c89070',
        'l': '#f6d4b8',
        'H': '#6b4423',
        'h': '#8f6236',
        'G': '#4a2e18',
        'e': '#2a1a12',
        'J': '#7a4a2a',
        'j': '#5c3820',
        'i': '#946040',
        'S': '#93c5e8',
        's': '#6ea3c8',
        'T': '#3b3b44',
        't': '#2a2a30',
        'P': '#4a4a52',
        'p': '#36363d',
        'B': '#5c3a1e',
        'd': '#3f2712',
        'b': '#6e4a2c',
        'X': '#f5d76e',
        'x': '#d4b040',
        'y': '#fff0a8',
        'z': '#b58e2a',
        '1': '#f97316',
        '2': '#2563eb',
        '3': '#22c55e',
    },
    head={
        's': (
            (9, 1),
            rows(
                """
                ..H..hH..H....
                .HHHhHHHHHHH..
                .HhhHHHHHHHHG.
                HHhHHHHHHHHHGG
                HHHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHkkkkkkkkGG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkekkkkekk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..KkkkkkkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 1),
            rows(
                """
                ...H.hH.H.....
                ..HHHhHHHHH...
                .HHhhHHHHHHHH.
                HHhHHHHHHHHHHH
                HHHHHHHHHHHHH.
                .GHHHHHHHHHHH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                .GHHHHKkkkkkk.
                ..GHHHKkkkekk.
                ..GHHHKkkkekkk
                ..GGHKKkkkkkK.
                ...KKkkkkkkK..
                ....KkkkkkK...
                """
            ),
        ),
        'n': (
            (9, 1),
            rows(
                """
                ..H..hH..H....
                .HHHhHHHHHHH..
                .HhhHHHHHHHHG.
                HHhHHHHHHHHHGG
                HHHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                ..HHHHHHHGGG..
                ..HHHHHHHGGG..
                ..HHHHHHGGGG..
                ..HGGGGGGGGG..
                ...KKkkkkKK...
                ...KkkkkkkK...
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                J1JSSSSJJj
                JJJSSSSJJj
                J2JJSSJJJj
                JJJJSSJJJj
                J3JJSSJJJj
                JJJJSSJJJj
                JJJJjjJJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                iJJJJSSj
                JJJJJSSj
                JJJJJ1Sj
                JJJJJJSj
                JJJJJ2Sj
                JJJJJJSj
                JJJJJ3Sj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iiJJJJJJJj
                iJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Fan of index cards in the right hand (viewer's left).
        's': [('hand', (5, 19), rows("""
            ..yX.
            .yXXX
            yXXXx
            XXXxx
            .Xxx.
            """))],
        'e': [('hand', (17, 19), rows("""
            ..yX.
            .yXXX
            yXXXx
            XXXxx
            .Xxx.
            """))],
        'n': [('hand', (22, 19), rows("""
            .Xy..
            XXXy.
            xXXXy
            xxXXX
            .xxX.
            """))],
    },
)

# --- Renata — front desk, wavy hair, navy blazer, phone in hand -------------

RENATA = Actor(
    'renata',
    {
        'k': '#e8b896',
        'K': '#c48a64',
        'l': '#f4cdae',
        'H': '#6b4423',
        'h': '#8f6236',
        'G': '#4a2e18',
        'e': '#3a2418',
        'J': '#1e3a5f',
        'j': '#15283f',
        'i': '#2c5282',
        'S': '#93c5e8',
        's': '#6ea3c8',
        'T': '#f5f5f5',
        't': '#c9cbd0',
        'P': '#c4b28a',
        'p': '#9a8762',
        'B': '#5c3a1e',
        'd': '#3f2712',
        'b': '#6e4a2c',
        'X': '#3a3d4c',
        'x': '#24262f',
        'y': '#575b6e',
        'z': '#8fd0ff',
    },
    head={
        's': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHhhhHHHH...
                ..HHHhhHHHHHHG..
                .HHHhHHHHHHHHHG.
                .HHHHHHHHHHHHHG.
                .HHHkkkkkkkkHHG.
                .HHHkkkkkkkkHHG.
                .HHkkkkkkkkkkHG.
                .HHkkekkkkekkHG.
                .HHkkekkkkekkHG.
                .HHkkkkkkkkkKHG.
                .HHKkkkkkkkkKHG.
                .HH.KkkkkkkK.HG.
                .HH..........HG.
                """
            ),
        ),
        'e': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHHhhhHHH...
                ..HHHHHhhHHHHH..
                .HHHHHHHHHHHHHH.
                .HHHHHHHHHHHHHH.
                .HHHHHHHHkkkkkH.
                .GHHHHHHkkkkkkH.
                .GHHHHHKkkkkkkH.
                .GHHHHHKkkkekk..
                .GGHHHHKkkkekkk.
                .GGHHHKKkkkkkK..
                .GGGHHHKkkkkkK..
                .GGGGHH.KkkkK...
                ..GGGGG.........
                """
            ),
        ),
        'n': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHhhhHHHH...
                ..HHHhhHHHHHHG..
                .HHHhHHHHHHHHHG.
                .HHHHHHHHHHHHHG.
                .HHHHHHHHHHHGGG.
                .HHHHHHHHHHHGGG.
                .HHHHHHHHHHGGGG.
                .HHHHHHHHHHGGGG.
                .HHHHHHHHHGGGGG.
                .HHHHHHHHHGGGGG.
                .HHHHHHHHGGGGGG.
                .HHH.HHHHGGG.HG.
                .HH..........HG.
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                JJJSSSSJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJjjJJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                iJJJJSSj
                JJJJJSSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iiJJJJJJJj
                iJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Phone in the right hand (viewer's left), screen lit.
        's': [('hand', (6, 20), rows("""
            XXX
            XzX
            XzX
            XzX
            xxx
            """))],
        'e': [('hand', (17, 20), rows("""
            XXX
            XzX
            XzX
            XzX
            xxx
            """))],
        'n': [('hand', (23, 20), rows("""
            XX
            XX
            XX
            XX
            xx
            """))],
    },
    arm_shift={'e': 0},
)

# --- Lead: Eng — hoodie, lanyard, khakis, sneakers, laptop under arm --------

LEAD_ENG = Actor(
    'lead_eng',
    {
        'k': '#e8b896',
        'K': '#c48a64',
        'l': '#f4cdae',
        'H': '#1a1a22',
        'h': '#3a3a48',
        'G': '#0e0e12',
        'e': '#2a1a12',
        'J': '#363f57',
        'j': '#262d40',
        'i': '#48536e',
        'S': '#8a9099',
        's': '#6b7079',
        'T': '#3b82f6',
        't': '#2563eb',
        'P': '#c4b28a',
        'p': '#9a8762',
        'B': '#2a2a30',
        'd': '#1a1a1e',
        'b': '#f2f2f2',
        'X': '#9aa3ad',
        'x': '#6f7883',
        'y': '#c9d0d8',
        'z': '#3a4048',
        '1': '#e8eaed',
        '2': '#3b82f6',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ...HH.HHHH.H..
                ..HHHhhHHHHHH.
                .HHHhhHHHHHHHG
                .HHHHHHHHHHHGG
                .HHHHHHHHHHHG.
                .HHkkkkkkkHHG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkekkkkekk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..KkkkkkkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ...HH.HHHH.H..
                ..HHHhhHHHHHH.
                .HHHHhHHHHHHHH
                .HHHHHHHHHHHHH
                .HHHHHHHHHHHH.
                .GHHHHHHHkkkk.
                .GHHHHHkkkkkk.
                .GHHHHKkkkkkk.
                ..GHHHKkkkekk.
                ..GHHHKkkkekkk
                ..GGHKKkkkkkK.
                ...KKkkkkkkK..
                ....KkkkkkK...
                """
            ),
        ),
        # Hood bunched at the nape.
        'n': (
            (9, 2),
            rows(
                """
                ...HH.HHHH.H..
                ..HHHhhHHHHHH.
                .HHHhhHHHHHHHG
                .HHHHHHHHHHHGG
                .HHHHHHHHHHHG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                ..HHHHHHHGGG..
                ..HHHHHHHGGG..
                .iJJJJJJJJJj..
                iJJJJJJJJJJJj.
                iJJJJJJJJJJJj.
                JJJJJJJJJJJJj.
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                JJJTSSTJJj
                JJJTSSTJJj
                JJJSTTSJJj
                JJJS11SJJj
                JJJS11SJJj
                JJJSSSSJJj
                JJJSSSSJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                iJJJJSSj
                JJJJJSTj
                JJJJJSTj
                JJJJJSSj
                JJJJJSSj
                JJJJJSSj
                JJJJJSSj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iiJJJJJJJj
                iJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Closed laptop tucked under the left arm (viewer's right).
        's': [('under', (22, 19), rows("""
            yXXX
            XXXX
            zzzz
            XXXX
            XXXX
            xxxx
            """))],
        'e': [('under', (13, 21), rows("""
            yXXXXXX
            XzzzzzX
            xxxxxxx
            """))],
        'n': [('under', (6, 19), rows("""
            yXXX
            XXXX
            zzzz
            XXXX
            XXXX
            xxxx
            """))],
    },
    cuffs=False,
)

# --- Lead: Design — patchwork blazer, hair clip, wide terracotta trousers ---

LEAD_DESIGN = Actor(
    'lead_design',
    {
        'k': '#f0c4a8',
        'K': '#d49a78',
        'l': '#f8d8c2',
        'H': '#5a3a24',
        'h': '#7a5234',
        'G': '#3e2816',
        'e': '#2d6a3e',
        'J': '#3b82f6',
        'j': '#2563eb',
        'i': '#60a5fa',
        'S': '#f7f7f4',
        's': '#d0d0cc',
        'T': '#dc2626',
        't': '#b91c1c',
        'P': '#c96a3a',
        'p': '#a04e28',
        'B': '#4a2c18',
        'd': '#33200f',
        'b': '#5e3a22',
        'X': '#2a2e36',
        'x': '#1a1d24',
        'y': '#4a505c',
        'z': '#cfd6e0',
        '1': '#f59e0b',
        '2': '#dc2626',
        '3': '#facc15',
        '4': '#a855f7',
        '5': '#22c55e',
        '6': '#b45309',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HHhhHHHHHH..
                .HHhhHHHHHHHG.
                .HHhHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HTkkkkkkkHGG.
                .HTkkkkkkkkHG.
                .HkkkkkkkkkkG.
                ..kkekkkkekk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..KkkkkkkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HHHhhHHHHH..
                .HHHhhHHHHHHH.
                .HHhHHHHHHHHHH
                .HHHHHHHHHHHH.
                .GHHHHHHHkkkH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                ..GHHTKkkkekk.
                ..GHHTKkkkekkk
                ..GGHKKkkkkkK.
                ...KKkkkkkkK..
                ....KkkkkkK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ....HHHHHH....
                ..HHhhHHHHHH..
                .HHhhHHHHHHHG.
                .HHhHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                ..HHHHHHHGGG..
                ..HHHHHHGGGG..
                ..HHHHGGGGGG..
                ...KKkkkkKK...
                ...KkkkkkkK...
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                1JSSSSSS4j
                11JSSSSJ44
                33JJSSJJ55
                33JJSSJJ55
                J2JJSSJJ1j
                22JJSSJ11j
                JJ44SSJ3Jj
                J44JSSJ33j
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                1J44JSSj
                11J4JSSj
                33J22JSj
                33J22JSj
                J55JJJSj
                J55J1JSj
                4JJ11JSj
                44J3JJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                11JJJJ44Jj
                11J33J44Jj
                JJJ33JJ55j
                22JJJJJ55j
                22JJ11JJJj
                JJ4J11J3Jj
                J44JJJ33Jj
                J44J55JJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Tablet under the right arm (viewer's left); face-on from the side.
        's': [('under', (6, 18), rows("""
            yXXX
            yXXX
            yXXX
            yXXX
            yXXX
            yXXX
            xxxx
            """))],
        'e': [('under', (13, 20), rows("""
            XXXXXXX
            XzzzzzX
            XzzzzzX
            xxxxxxx
            """))],
        'n': [('under', (22, 18), rows("""
            XXXy
            XXXy
            XXXy
            XXXy
            XXXy
            XXXy
            xxxx
            """))],
    },
    wide_legs=True,
)

# --- Lead: PM — black bob, teal blazer, black trousers, tablet + pen --------

LEAD_PM = Actor(
    'lead_pm',
    {
        'k': '#c9956c',
        'K': '#a87450',
        'l': '#d9ac86',
        'H': '#1e1a1e',
        'h': '#3e3440',
        'G': '#100c10',
        'e': '#2a1a12',
        'J': '#2a8a7a',
        'j': '#1f6a5e',
        'i': '#38a494',
        'S': '#f5f5f5',
        's': '#cfd2d4',
        'T': '#c4a574',
        't': '#a08553',
        'P': '#2a2a30',
        'p': '#1e1e24',
        'B': '#1a1a1e',
        'd': '#0e0e10',
        'b': '#2c2c32',
        'X': '#3a3f48',
        'x': '#262a30',
        'y': '#5a606c',
        'z': '#dfe6ee',
    },
    head={
        's': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHhhhHHHH...
                ..HHHhhHHHHHHG..
                ..HHhHHHHHHHHG..
                ..HHHHHHHHHHGG..
                ..HHkkkkkkkkHG..
                ..HHkkkkkkkkHG..
                ..HHkkkkkkkkHG..
                ..HHkkekkkkekHG.
                ..HHkkekkkkekHG.
                ..HHkkkkkkkkKHG.
                ..HHKkkkkkkkKHG.
                ..HH.KkkkkkK.HG.
                """
            ),
        ),
        'e': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHHhhhHHH...
                ..HHHHHhhHHHHH..
                ..HHHHHHHHHHHHH.
                ..HHHHHHHHHHHHH.
                ..HHHHHHHHkkkkH.
                ..GHHHHHHkkkkkk.
                ..GHHHHHKkkkkkk.
                ..GHHHHHKkkkekk.
                ..GGHHHHKkkkekkk
                ..GGHHHKKkkkkkK.
                ..GGGHHHKkkkkkK.
                ..GGGGHH.KkkkK..
                """
            ),
        ),
        'n': (
            (8, 2),
            rows(
                """
                .....HHHHHh.....
                ...HHHhhhHHHH...
                ..HHHhhHHHHHHG..
                ..HHhHHHHHHHHG..
                ..HHHHHHHHHHGG..
                ..HHHHHHHHHHGG..
                ..HHHHHHHHHGGG..
                ..HHHHHHHHHGGG..
                ..HHHHHHHHGGGGG.
                ..HHHHHHHHGGGGG.
                ..HHHHHHHGGGGGG.
                ..HHHHHHHGGGGGG.
                ..HH.GGGGGGG.GG.
                """
            ),
        ),
    },
    torso={
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                JJJSSSSJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJJSSJJJj
                JJJTTTTJJj
                JJJJjjJJJj
                jjjjjjjjjj
                """
            ),
        ),
        'e': (
            (12, 15),
            rows(
                """
                ..KKKK..
                iJJJJSSj
                JJJJJSSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJSj
                JJJJJJSj
                JJJJJTTj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iiJJJJJJJj
                iJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                JJJJJjJJJj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Tablet under the left arm (viewer's right).
        's': [('under', (22, 18), rows("""
            XXXy
            XXXy
            XXXy
            XXXy
            XXXy
            XXXy
            xxxx
            """))],
        'e': [('under', (13, 20), rows("""
            XXXXXXX
            XzzzzzX
            XzzzzzX
            xxxxxxx
            """))],
        'n': [('under', (6, 18), rows("""
            yXXX
            yXXX
            yXXX
            yXXX
            yXXX
            yXXX
            xxxx
            """))],
    },
)

CAST: list[Actor] = [LEAD_ENG, LEAD_DESIGN, LEAD_PM, RENATA, GAVIN, PRIYA, HOLLOWAY]


# ---------------------------------------------------------------------------
# Composition
# ---------------------------------------------------------------------------


def compose(actor: Actor, facing: str, frame: str) -> Frame:
    """Draw one cell. `facing` is 's', 'e' or 'n' (w is mirrored from e)."""
    fr = Frame()
    p = actor.pal
    step = frame != 'idle'
    bob = 1 if step else 0  # hips drop one pixel in the contact poses
    slouch = actor.slouch

    if facing == 'e':
        legs = LEGS_E_WIDE if actor.wide_legs else LEGS_E
    else:
        legs = LEGS_S_WIDE if actor.wide_legs else LEGS_S
    (lx, ly), leg_tpl = legs[frame]

    head_xy, head_tpl = actor.head[facing]
    torso_xy, torso_tpl = actor.torso[facing]
    props = actor.props.get(facing, [])

    def paste_props(layer: str, dx: int) -> None:
        for kind, (px, py), tpl in props:
            if kind == layer:
                fr.paste(tpl, px + dx, py + bob, p)

    arm_tpl_s = ARM_S_CUFF if actor.cuffs else ARM_S
    arm_tpl_e = ARM_E_CUFF if actor.cuffs else ARM_E

    # Arm swing: the arm opposite the lifted leg comes forward (up).
    if frame == 'stepL':
        swing_l, swing_r = 1, -1
    elif frame == 'stepR':
        swing_l, swing_r = -1, 1
    else:
        swing_l = swing_r = 0

    if facing in ('s', 'n'):
        if facing == 'n':
            swing_l, swing_r = swing_r, swing_l
        fr.paste(leg_tpl, lx, ly, p)
        fr.paste(torso_tpl, torso_xy[0], torso_xy[1] + bob, p)
        paste_props('under', 0)
        # Arms hang beside the torso; the shirt cuff peeks below the sleeve.
        fr.paste(arm_tpl_s, 9, 17 + bob + swing_l + slouch, p)
        fr.paste(arm_tpl_s, 21, 17 + bob + swing_r + slouch, p)
        paste_props('hand', 0)
        fr.paste(head_tpl, head_xy[0], head_xy[1] + bob, p)
        return fr

    # Side view: far arm peeks behind the torso, then legs/torso, then the
    # near arm over the torso's centre line, prop, head.
    far_x = 12 - swing_r
    fr.paste([ln.replace('J', 'j').replace('k', 'K') for ln in arm_tpl_e], far_x, 17 + bob + slouch, p)
    fr.paste(leg_tpl, lx, ly, p)
    fr.paste(torso_tpl, torso_xy[0], torso_xy[1] + bob, p)
    paste_props('under', 0)
    near_x = 15 + swing_l + actor.arm_shift.get('e', 0)
    fr.paste(arm_tpl_e, near_x, 17 + bob + slouch, p)
    paste_props('hand', swing_l)
    fr.paste(head_tpl, head_xy[0], head_xy[1] + bob, p)
    return fr


def build_sheet(actor: Actor) -> Image.Image:
    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))
    for row, facing in enumerate(FACINGS):
        for col, frame in enumerate(FRAMES):
            src = 'e' if facing == 'w' else facing
            im = compose(actor, src, frame).to_image()
            if facing == 'w':
                im = im.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.paste(im, (col * FRAME_W, row * FRAME_H), im)
    return sheet


def contact_sheet(sheets: dict[str, Image.Image], scale: int = 4) -> Image.Image:
    gap = 8
    w = sum(s.width for s in sheets.values()) + gap * (len(sheets) + 1)
    h = max(s.height for s in sheets.values()) + gap * 2
    bg = Image.new('RGBA', (w, h), (26, 34, 46, 255))
    x = gap
    for im in sheets.values():
        bg.paste(im, (x, gap), im)
        x += im.width + gap
    return bg.resize((bg.width * scale, bg.height * scale), Image.NEAREST)


def main(argv: list[str]) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    sheets: dict[str, Image.Image] = {}
    for actor in CAST:
        sheet = build_sheet(actor)
        if sheet.size != (SHEET_W, SHEET_H) or sheet.mode != 'RGBA':
            raise SystemExit(f'{actor.name}: expected {SHEET_W}x{SHEET_H} RGBA, got {sheet.size} {sheet.mode}')
        path = OUT_DIR / f'{actor.name}.png'
        sheet.save(path, 'PNG', optimize=True)
        sheets[actor.name] = sheet
        print(f'{path.relative_to(ROOT)}: {SHEET_W}x{SHEET_H} RGBA')
    if '--preview' in argv:
        out = Path('/tmp/office-actors-preview.png')
        contact_sheet(sheets).save(out)
        print(f'preview: {out}')


if __name__ == '__main__':
    main(sys.argv[1:])
