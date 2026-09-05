#!/usr/bin/env python3
"""Office overworld walk-cycle sheets (Floors 1–5 cast) — hand-authored pixel art.

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


def hairline_shadow(head: list[str]) -> list[str]:
    """Skin directly under the fringe takes the hair's shadow."""
    out = []
    for r, ln in enumerate(head):
        if r == 0:
            out.append(ln)
            continue
        above = head[r - 1]
        chars = list(ln)
        for c, ch in enumerate(chars):
            if ch == 'k' and c < len(above) and above[c] in 'HhG':
                chars[c] = 'K'
        out.append(''.join(chars))
    return out


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

# ===========================================================================
# Floor 2 cast (docs/rpg/floor-2-design.md §2). Same rig, same ink.
# ===========================================================================

# --- Teddy — rotational intern, messy hair, navy blazer, tan chinos, backpack, coffee

TEDDY = Actor(
    'teddy',
    {
        'k': '#efc3a0',
        'K': '#c99270',
        'l': '#f8d6bc',
        'H': '#6b4a2e',
        'h': '#8c6640',
        'G': '#4a321e',
        'e': '#2a1a12',
        'J': '#2b3a5c',
        'j': '#1f2b45',
        'i': '#3a4d78',
        'S': '#cfe0f2',
        's': '#a9bfd8',
        'T': '#c43c3c',
        't': '#8f2a2a',
        'P': '#c9b08a',
        'p': '#a68d68',
        'B': '#5a3a22',
        'd': '#3f2712',
        'b': '#6e4a2c',
        'X': '#f4f1ea',
        'x': '#cfc9bc',
        'y': '#ffffff',
        'z': '#6b4a2e',
        '1': '#5c4a3a',
        '2': '#7a6452',
        '3': '#3e3128',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ..H.HHHH.H....
                .HHHhhHHHHHh..
                HHhhHHHHHHHHG.
                .HHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHkkkkkkkkHG.
                .HkkkkkkkkkGG.
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
                ...H.HHHH.H...
                ..HHhhhHHHHHH.
                .HHHhhHHHHHHHH
                .HHHHHHHHHHHH.
                .GHHHHHHHHHHH.
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
                ..H.HHHH.H....
                .HHHhhHHHHHh..
                HHhhHHHHHHHHG.
                .HHHHHHHHHHHGG
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
        # backpack straps ('1') run down the open blazer
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                i1SSSSSS1j
                J1SSTTSS1j
                J1JSTTSJ1j
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJ1SSj
                JJJJ1STj
                JJJJ1STj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
                JJJJJJJj
                JJJJJJJj
                jjjjjjjj
                """
            ),
        ),
        # the backpack covers his back
        'n': (
            (11, 15),
            rows(
                """
                ...KKKK...
                ii1111111j
                i12222211j
                J12222211j
                J12222211j
                J12222211j
                J12222211j
                J13333311j
                JJ111111Jj
                jjjjjjjjjj
                """
            ),
        ),
    },
    props={
        # Paper coffee cup with a lid, right hand (viewer's left).
        's': [('hand', (6, 21), rows("""
            yXXX
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'e': [('hand', (17, 21), rows("""
            XXXy
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'n': [('hand', (22, 21), rows("""
            XXXy
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
    },
)

# --- Kessler — Director of Operations, blond slicked back, navy suit, dark folder

KESSLER = Actor(
    'kessler',
    {
        'k': '#e8b896',
        'K': '#c48a64',
        'l': '#f4cdae',
        'H': '#d9b45a',
        'h': '#f0d27a',
        'G': '#a8863a',
        'e': '#1a2a40',
        'J': '#1f2a44',
        'j': '#161d30',
        'i': '#2c3a5e',
        'S': '#f4f4f0',
        's': '#c9cbd0',
        'T': '#7a8aa6',
        't': '#5a6880',
        'P': '#1f2a44',
        'p': '#161d30',
        'B': '#15151c',
        'd': '#0c0c10',
        'b': '#2a2a34',
        'X': '#2f3646',
        'x': '#232838',
        'y': '#45506a',
        'z': '#c9a24a',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ...HHHHHHh....
                .HHHHHHHHHHh..
                .HhHHHHHHHHHG.
                .HHHHHHHHHHHG.
                .HHkkkkkkkHGG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkGkkkkGkk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..kkkkkkkkkK..
                ..KkkkkmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ....HHHHHh....
                ..HHHHHHHHHH..
                .HHHHHHHHHHHH.
                .HHHHHHHHHHHH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                .GHHHHKkkkkkk.
                .GHHHHKkkkGkk.
                ..GHHHKkkkekk.
                ..GHHHKkkkkkkk
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
                ...HHHHHHh....
                .HHHHHHHHHHh..
                .HhHHHHHHHHHG.
                .HHHHHHHHHHHG.
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
        # pocket square on the breast, tie, no pin
        's': (
            (11, 15),
            rows(
                """
                ...KKKK...
                iJSSSSSSJj
                JJJSSTTSJj
                JSJSSTTSJj
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
        # Slim dark folder with a brass clasp under the left arm.
        's': [('under', (22, 20), rows("""
            XXXX
            XzyX
            XyyX
            XyyX
            xxxx
            """))],
        'e': [('under', (13, 21), rows("""
            XXXXXXX
            XyyyyzX
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

# --- Whitlock — external auditor, swept white hair, black suit, red tie, green ledger

WHITLOCK = Actor(
    'whitlock',
    {
        'k': '#e6b48e',
        'K': '#bf8a66',
        'l': '#f0c8a8',
        'H': '#e9e9ee',
        'h': '#ffffff',
        'G': '#b4b4c2',
        'e': '#1a1414',
        'J': '#202028',
        'j': '#14141a',
        'i': '#30303c',
        'S': '#f4f4f0',
        's': '#c9cbd0',
        'T': '#b8322e',
        't': '#7f1f1c',
        'P': '#202028',
        'p': '#14141a',
        'B': '#101014',
        'd': '#080809',
        'b': '#24242c',
        'X': '#2f6b4a',
        'x': '#1f4a33',
        'y': '#3f8a5f',
        'z': '#c9a24a',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ..HHHHHHHHh...
                .HhHHHHHHHHHH.
                HHhHHHHHHHHHHG
                HHHHHHHHHHHHGG
                .HHkkkkkkkkHG.
                .HHkkkkkkkkHG.
                ..kkkkkkkkkk..
                ..kkGkkkkGkk..
                ..kKekkkkeKk..
                ..kkkkkkkkkK..
                ..KkKkkkkKkK..
                ..KkkkmmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ...HHHHHHHh...
                ..HHHHHHHHHHH.
                .HHHHHHHHHHHHH
                .HHHHHHHHHHHHH
                .GHHHHHHHkkkk.
                .GHHHHHHkkkkk.
                .GHHHHHKkkkkk.
                .GHHHHHKkkGkk.
                ..GHHHHKkkekk.
                ..GHHHKKkkkkkk
                ..GGHKKkkKkkK.
                ...KKkkkkkkK..
                ....KkkkkmK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ..HHHHHHHHh...
                .HhHHHHHHHHHH.
                HHhHHHHHHHHHHG
                HHHHHHHHHHHHGG
                .HHHHHHHHHHHG.
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
            (12, 15),
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
            (11, 15),
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
        # Green ledger with a gold clasp under the left arm.
        's': [('under', (22, 19), rows("""
            XXXX
            XzzX
            XyyX
            XyyX
            XyyX
            xxxx
            """))],
        'e': [('under', (13, 21), rows("""
            XXXXXXX
            XzzyyyX
            xxxxxxx
            """))],
        'n': [('under', (6, 19), rows("""
            XXXX
            XXXX
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

# ===========================================================================
# Floors 3–5 cast (docs/rpg/floor-3-5-design.md §7). Same rig, same ink.
# ===========================================================================

# --- Sloane — Staff PM, copper undercut, saffron cardigan, clipboard

SLOANE = Actor(
    'sloane',
    {
        'k': '#d4a07a',
        'K': '#b07c58',
        'l': '#e8bc9a',
        'H': '#c45a28',
        'h': '#e07840',
        'G': '#8a3a18',
        'e': '#2a1a12',
        'J': '#d4a04a',
        'j': '#a87a32',
        'i': '#e8bc62',
        'S': '#f4efe4',
        's': '#d0c8b8',
        'T': '#3a6a8a',
        't': '#2a4a62',
        'P': '#3a3a48',
        'p': '#282834',
        'B': '#1a1a22',
        'd': '#0e0e14',
        'b': '#2c2c36',
        'X': '#d8c8a0',
        'x': '#b0a078',
        'y': '#f4efe4',
        'z': '#3a6a8a',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ....HHHHHh....
                ..HHHhhhHHHh..
                .HHhhHHHHHHHG.
                .HHHHHHHHHHHG.
                .HHkkkkkkkHGG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkGkkkkGkk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..kkkkkkkkkK..
                ..KkkkkmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHhhhHHHH.
                ..HHHhhHHHHHHH
                ..HHHHHHHHHHHH
                ..GHHHHHHkkkkk
                ..GHHHHHkkkkkk
                ..GHHHHkkkGkk.
                ..GHHHHkkkekk.
                ...GHHHkkkekkk
                ...GHHKkkkkkK.
                ....KKkkkkkK..
                ....KkkkkmkK..
                .....KkkkkK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ....HHHHHh....
                ..HHHhhhHHHh..
                .HHhhHHHHHHHG.
                .HHHHHHHHHHHGG
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
                iSSSSSSSSj
                JSSSTTSSSj
                JJSSTTSJJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJSSSj
                JJJJSSTj
                JJJJSSTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
        's': [('hand', (5, 20), rows("""
            yXXX
            XzzX
            XzzX
            XXXX
            .xx.
            """))],
        'e': [('hand', (17, 20), rows("""
            XXXy
            XzzX
            XzzX
            XXXX
            .xx.
            """))],
        'n': [('hand', (22, 20), rows("""
            XXXX
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

# --- Nico — Research, dark curls, glasses, olive chore coat, headphones

NICO = Actor(
    'nico',
    {
        'k': '#c9956c',
        'K': '#a87450',
        'l': '#d9ac86',
        'H': '#2a2018',
        'h': '#4a3a2c',
        'G': '#16100c',
        'e': '#1a1410',
        'J': '#5a6a3a',
        'j': '#3e4a28',
        'i': '#7a8a52',
        'S': '#e8e0d0',
        's': '#c0b8a8',
        'T': '#3a3a40',
        't': '#242428',
        'P': '#3a3a40',
        'p': '#242428',
        'B': '#1a1a1e',
        'd': '#0e0e10',
        'b': '#2c2c32',
        'X': '#2a2a30',
        'x': '#18181c',
        'y': '#5a5a64',
        'z': '#f4d35e',
        '1': '#3a3a40',
    },
    head={
        's': (
            (8, 2),
            rows(
                """
                ..H.HHHH.H....
                .HHHhhHHHHHh..
                HHhhHHHHHHHHG.
                .HHHHHHHHHHHGG
                .HHkkkkkkkkHG.
                .HkkkkkkkkkGG.
                ..kk1kkkk1kk..
                ..kkGkkkkGkk..
                ..kkekkkkekk..
                ..k1kkkkkk1K..
                ..kkkkkkkkkK..
                ..KkkkkmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (8, 2),
            rows(
                """
                ...H.HHHH.H...
                ..HHhhhHHHHHH.
                .HHHhhHHHHHHHH
                .HHHHHHHHHHHH.
                .GHHHHHHkkkkk.
                .GHHHHHkkkkkk.
                .GHHHH1kkkGkk.
                .GHHHHKkkkekk.
                ..GHHHKkkkekkk
                ..GHH1KkkkkkK.
                ..GGHKkkkkkkK.
                ...KKkkkkmkK..
                ....KkkkkkK...
                """
            ),
        ),
        'n': (
            (8, 2),
            rows(
                """
                ..H.HHHH.H....
                .HHHhhHHHHHh..
                HHhhHHHHHHHHG.
                .HHHHHHHHHHHGG
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HH1HHHHH1GGG.
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
                iSSSSSSSSj
                JSSSSSSSSj
                JJSSSSSSJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
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
                iJJJSSSj
                JJJJSSSj
                JJJJSSSj
                JJJJJJJj
                JJJJJJJj
                JJJJJJJj
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
        # Headphones around the neck + a sticky pad
        's': [('under', (10, 14), rows("""
            XXXXXXXXXXX
            X.........X
            """))],
        'e': [('hand', (17, 21), rows("""
            XXX
            XzX
            xxx
            """))],
        'n': [('under', (10, 14), rows("""
            XXXXXXXXXXX
            X.........X
            """))],
    },
)

# --- Quincy — VP Product, silver fade, plum blazer, turtleneck, tube

QUINCY = Actor(
    'quincy',
    {
        'k': '#e0b090',
        'K': '#bc8a68',
        'l': '#f0c8a8',
        'H': '#c8c8d0',
        'h': '#e8e8ee',
        'G': '#8a8a96',
        'e': '#1a2030',
        'J': '#5a2a68',
        'j': '#3e1c4a',
        'i': '#7a3a88',
        'S': '#2a2430',
        's': '#1c1820',
        'T': '#2a2430',
        't': '#1c1820',
        'P': '#2a2438',
        'p': '#1c1828',
        'B': '#141418',
        'd': '#0a0a0c',
        'b': '#282830',
        'X': '#c4a06a',
        'x': '#8a6a40',
        'y': '#e0c08a',
        'z': '#f4d35e',
    },
    head={
        's': (
            (9, 3),
            rows(
                """
                ...HHHHHh....
                .HHHHHHHHHh..
                .HhHHHHHHHHG.
                .HHkkkkkkkHG.
                .Hkkkkkkkkkk.
                ..kkkkkkkkkk.
                ..kkGkkkkGkk.
                ..kkekkkkekk.
                ..kkkkkkkkkK.
                ..KkkkkmkkkK.
                ...KkkkkkkK..
                """
            ),
        ),
        'e': (
            (9, 3),
            rows(
                """
                ....HHHHHh...
                ..HHHHHHHHHH.
                .HHHHHHHHHHHH
                .GHHHHHHkkkkk
                .GHHHHHkkkkkk
                .GHHHHkkkGkk.
                .GHHHHkkkekk.
                ..GHHHkkkekkk
                ..GHHKkkkkkK.
                ...KKkkkkmkK.
                ....KkkkkkK..
                """
            ),
        ),
        'n': (
            (9, 3),
            rows(
                """
                ...HHHHHh....
                .HHHHHHHHHh..
                .HHHHHHHHHHG.
                .HHHHHHHHHHG.
                .HHHHHHHHHGG.
                .HHHHHHHHGGG.
                ..HHHHHHHGGG.
                ..HHHHHHGGGG.
                ..HGGGGGGGGG.
                ...KKkkkkKK..
                ...KkkkkkkK..
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
                iSSTTTTTSj
                JSSTTTTTSj
                JJSSTTTSJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJTTTj
                JJJJTTTj
                JJJJTTTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
        's': [('hand', (5, 18), rows("""
            yX
            XX
            XX
            XX
            XX
            XX
            xx
            """))],
        'e': [('hand', (18, 18), rows("""
            Xy
            XX
            XX
            XX
            XX
            XX
            xx
            """))],
        'n': [('hand', (23, 18), rows("""
            XX
            XX
            XX
            XX
            XX
            XX
            xx
            """))],
    },
)

# --- Harper — AE, blonde ponytail, magenta blazer, phone

HARPER = Actor(
    'harper',
    {
        'k': '#efc3a0',
        'K': '#c99270',
        'l': '#f8d6bc',
        'H': '#e0c060',
        'h': '#f4dc88',
        'G': '#a88838',
        'e': '#2a1a12',
        'J': '#c43a6a',
        'j': '#8a2848',
        'i': '#e05a88',
        'S': '#f4f0f2',
        's': '#d0c8cc',
        'T': '#e0c060',
        't': '#a88838',
        'P': '#2a2a34',
        'p': '#1c1c24',
        'B': '#1a1a22',
        'd': '#0e0e14',
        'b': '#2c2c36',
        'X': '#3a3f48',
        'x': '#262a30',
        'y': '#5a606c',
        'z': '#4fb7e8',
    },
    head={
        's': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHhhhHHHH.
                ..HHHhhHHHHHHG
                ..HHhHHHHHHHHG
                ..HHHHHHHHHHGG
                ..HHkkkkkkkkHG
                ..HHkkkkkkkkHG
                ..HHkkkkkkkkHG
                ..HHkkekkkkekG
                ..HHkkekkkkekG
                ..HHKkkkkkkkKG
                ..HH.KkkkkkK.G
                ....H....H....
                """
            ),
        ),
        'e': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHHhhhHHH.
                ..HHHHHhhHHHHH
                ..HHHHHHHHHHHH
                ..HHHHHHHHHHHH
                ..HHHHHHHHkkkk
                ..GHHHHHHkkkkk
                ..GHHHHHkkkGkk
                ..GHHHHHkkkekk
                ...GHHHHKkkekk
                ...GHHHKkkkkkK
                ....KK.kkkkkK.
                ......H.......
                """
            ),
        ),
        'n': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHhhhHHHH.
                ..HHHhhHHHHHHG
                ..HHHHHHHHHHHG
                ..HHHHHHHHHHGG
                ..HHHHHHHHHGGG
                ..HHHHHHHHHGGG
                ...HHHHHHHGGG.
                ...HHHHHHHGGG.
                ...HHHHHHGGGG.
                ...HGGGGGGGGG.
                ...HH....HH...
                ....H....H....
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
                iSSSTTSSSj
                JSSTTTTSSj
                JJSSTTSJJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJSSTj
                JJJJSSTj
                JJJJSSTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
)

# --- Reyes — Client Success, close fade, terracotta sweater, headset

REYES = Actor(
    'reyes',
    {
        'k': '#8a5a3a',
        'K': '#6a4028',
        'l': '#a87250',
        'H': '#1a1410',
        'h': '#3a2a22',
        'G': '#0c0a08',
        'e': '#1a1010',
        'J': '#c45a38',
        'j': '#8a3a24',
        'i': '#e07850',
        'S': '#c45a38',
        's': '#8a3a24',
        'T': '#f4efe8',
        't': '#c8c0b4',
        'P': '#2a2a30',
        'p': '#1c1c22',
        'B': '#1a1a1e',
        'd': '#0e0e10',
        'b': '#2c2c32',
        'X': '#3a3a42',
        'x': '#222228',
        'y': '#5a5a64',
        'z': '#4ade80',
    },
    head={
        's': (
            (9, 3),
            rows(
                """
                ...HHHHH....
                .HHHHHHHHH..
                .HHkkkkkkHG.
                .Hkkkkkkkkk.
                ..kkkkkkkkk.
                ..kkGkkkkGk.
                ..kkekkkkek.
                ..kkkkkkkkkK
                ..KkkkkmkkkK
                ...KkkkkkkK.
                """
            ),
        ),
        'e': (
            (9, 3),
            rows(
                """
                ....HHHHH...
                ..HHHHHHHHH.
                .GHHHHHkkkkk
                .GHHHHHkkkkk
                .GHHHHkkkGk.
                .GHHHHkkkek.
                ..GHHHkkkekk
                ..GHHKkkkkkK
                ...KKkkkkmkK
                ....KkkkkkK.
                """
            ),
        ),
        'n': (
            (9, 3),
            rows(
                """
                ...HHHHH....
                .HHHHHHHHH..
                .HHHHHHHHHG.
                .HHHHHHHHGG.
                .HHHHHHHGGG.
                ..HHHHHHGGG.
                ..HHHHHGGGG.
                ..HGGGGGGGG.
                ...KKkkkkKK.
                ...KkkkkkkK.
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
                iSSSSSSSSj
                JSSSTTSSSj
                JJSSSSSJjj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
                JJJJJJJJJj
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
                iJJJSSSj
                JJJJSSTj
                JJJJSSSj
                JJJJJJJj
                JJJJJJJj
                JJJJJJJj
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
        's': [('under', (8, 13), rows("""
            XX.........XX
            X...........X
            """))],
        'e': [('hand', (17, 21), rows("""
            XXXXXXX
            XzzzzzX
            xxxxxxx
            """))],
        'n': [('under', (8, 13), rows("""
            XX.........XX
            X...........X
            """))],
    },
)

# --- Ashford — VP Sales, salt-and-pepper, pinstripe, closed-won folder

ASHFORD = Actor(
    'ashford',
    {
        'k': '#e8b896',
        'K': '#c48a64',
        'l': '#f4cdae',
        'H': '#6a6468',
        'h': '#9a9498',
        'G': '#3a3438',
        'e': '#1a1420',
        'J': '#2a2038',
        'j': '#1c1628',
        'i': '#3e3450',
        'S': '#f4f0e8',
        's': '#d0ccc4',
        'T': '#c43c3c',
        't': '#8a2828',
        'P': '#2a2038',
        'p': '#1c1628',
        'B': '#121018',
        'd': '#08080c',
        'b': '#2a2830',
        'X': '#3a2a18',
        'x': '#241810',
        'y': '#5a4030',
        'z': '#c9a24a',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ...HHHHHHh....
                .HHHHHHHHHHh..
                .HhHHHHHHHHHG.
                .HHHHHHHHHHHG.
                .HHkkkkkkkHGG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkGkkkkGkk..
                ..kkekkkkekk..
                ..kkkkkkkkkK..
                ..kkkkkkkkkK..
                ..KkkkkmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ....HHHHHHh...
                ..HHHHHHHHHHH.
                .HHHHHHHHHHHHH
                .HHHHHHHHHHHH.
                .GHHHHHHHkkkkk
                .GHHHHHHkkkkkk
                .GHHHHHkkkGkk.
                .GHHHHHkkkekk.
                ..GHHHHKkkekkk
                ..GHHHKkkkkkK.
                ...KKKkkkkkK..
                ....KkkkkmkK..
                .....KkkkkK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ...HHHHHHh....
                .HHHHHHHHHHh..
                .HHHHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHGGGG.
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
                iSSTTTTTSj
                JSSTTTTTSj
                JJSSTTTSJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJTTTj
                JJJJTTTj
                JJJJTTTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
        's': [('hand', (5, 20), rows("""
            yXXX
            XzzX
            XXXX
            xxxx
            """))],
        'e': [('hand', (17, 20), rows("""
            XXXy
            XzzX
            XXXX
            xxxx
            """))],
        'n': [('hand', (22, 20), rows("""
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

# --- Marlowe — EA, sharp black bob, black dress, gold folio

MARLOWE = Actor(
    'marlowe',
    {
        'k': '#e8c0a0',
        'K': '#c49470',
        'l': '#f4d4b8',
        'H': '#141418',
        'h': '#2e2e36',
        'G': '#08080c',
        'e': '#2a1a14',
        'J': '#1a1a22',
        'j': '#101014',
        'i': '#2e2e38',
        'S': '#1a1a22',
        's': '#101014',
        'T': '#c9a24a',
        't': '#8a7028',
        'P': '#1a1a22',
        'p': '#101014',
        'B': '#121214',
        'd': '#08080a',
        'b': '#2a2a30',
        'X': '#c9a24a',
        'x': '#8a7028',
        'y': '#e0c06a',
        'z': '#1a1a22',
    },
    head={
        's': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHhhhHHHH.
                ..HHHhhHHHHHHG
                ..HHhHHHHHHHHG
                ..HHHHHHHHHHGG
                ..HHkkkkkkkkHG
                ..HHkkkkkkkkHG
                ..HHkkkkkkkkHG
                ..HHkkekkkkekG
                ..HHkkekkkkekG
                ..HHKkkkkkkkKG
                ..HH.KkkkkkK.G
                """
            ),
        ),
        'e': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHHhhhHHH.
                ..HHHHHhhHHHHH
                ..HHHHHHHHHHHH
                ..HHHHHHHHHHHH
                ..HHHHHHHHkkkk
                ..GHHHHHHkkkkk
                ..GHHHHHkkkGkk
                ..GHHHHHkkkekk
                ...GHHHHKkkekk
                ...GHHHKkkkkkK
                ....KK.kkkkkK.
                """
            ),
        ),
        'n': (
            (8, 2),
            rows(
                """
                .....HHHHHh...
                ...HHHhhhHHHH.
                ..HHHhhHHHHHHG
                ..HHHHHHHHHHHG
                ..HHHHHHHHHHGG
                ..HHHHHHHHHGGG
                ..HHHHHHHHHGGG
                ...HHHHHHHGGG.
                ...HHHHHHHGGG.
                ...HHHHHHGGGG.
                ...HGGGGGGGGG.
                ...KK....KK...
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
                iSSSTTSSSj
                JSSTTTTTSj
                JJSSTTTSJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJTTTj
                JJJJTTTj
                JJJJTTTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
        's': [('hand', (5, 20), rows("""
            yXXX
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'e': [('hand', (17, 20), rows("""
            XXXy
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'n': [('hand', (22, 20), rows("""
            XXXX
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

# --- Caldwell — CEO, white hair, navy three-piece, company pin

CALDWELL = Actor(
    'caldwell',
    {
        'k': '#e6b48e',
        'K': '#bf8a66',
        'l': '#f0c8a8',
        'H': '#e8e8ee',
        'h': '#ffffff',
        'G': '#b0b0bc',
        'e': '#1a1420',
        'J': '#1a2438',
        'j': '#101828',
        'i': '#2a3858',
        'S': '#f4f0e8',
        's': '#d0ccc4',
        'T': '#8a2020',
        't': '#5a1414',
        'P': '#1a2438',
        'p': '#101828',
        'B': '#101014',
        'd': '#08080a',
        'b': '#242428',
        'X': '#c9a24a',
        'x': '#8a7028',
        'y': '#e0c06a',
        'z': '#8a2020',
    },
    head={
        's': (
            (9, 2),
            rows(
                """
                ..HHHHHHHHh...
                .HhHHHHHHHHHH.
                HHhHHHHHHHHHHG
                .HHkkkkkkkkHG.
                .HkkkkkkkkkkG.
                ..kkkkkkkkkk..
                ..kkGkkkkGkk..
                ..kKekkkkeKk..
                ..kkkkkkkkkK..
                ..KkKkkkkKkK..
                ..KkkkmmkkkK..
                ...KkkkkkkK...
                """
            ),
        ),
        'e': (
            (9, 2),
            rows(
                """
                ...HHHHHHHh...
                ..HHHHHHHHHHH.
                .HHHHHHHHHHHHH
                .GHHHHHHHkkkkk
                .GHHHHHHkkkkkk
                .GHHHHHkkkGkk.
                .GHHHHHkkkekk.
                ..GHHHHKkekkkk
                ..GHHHKkkkkkK.
                ...KKKkkKkKkK.
                ....KkkkmmkK..
                .....KkkkkK...
                """
            ),
        ),
        'n': (
            (9, 2),
            rows(
                """
                ..HHHHHHHHh...
                .HHHHHHHHHHHH.
                .HHHHHHHHHHHG.
                .HHHHHHHHHHGG.
                .HHHHHHHHHGGG.
                .HHHHHHHHGGGG.
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
                iSSTTTTTSj
                JSSTTTTTSj
                JJSSTXTSJj
                JJJJTTJJJj
                JJJJtTJJJj
                JJJJJtJJJj
                JJJJJJJJJj
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
                iJJJTTTj
                JJJJTTTj
                JJJJTXTj
                JJJJJJTj
                JJJJJJtj
                JJJJJJJj
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
        's': [('hand', (6, 21), rows("""
            yXXX
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'e': [('hand', (17, 21), rows("""
            XXXy
            XXXX
            XzzX
            XXXX
            .xx.
            """))],
        'n': [('hand', (22, 21), rows("""
            XXXX
            XXXX
            XXXX
            XXXX
            xxxx
            """))],
    },
)

CAST: list[Actor] = [
    LEAD_ENG,
    LEAD_DESIGN,
    LEAD_PM,
    RENATA,
    GAVIN,
    PRIYA,
    HOLLOWAY,
    TEDDY,
    KESSLER,
    WHITLOCK,
    SLOANE,
    NICO,
    QUINCY,
    HARPER,
    REYES,
    ASHFORD,
    MARLOWE,
    CALDWELL,
]


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
    head_tpl = hairline_shadow(head_tpl)
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
