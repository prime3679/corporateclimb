#!/usr/bin/env python3
"""Generate Floor 1 overworld walk-cycle sheets.

Each sheet is 128x160 RGBA: 4 columns x 4 rows, frame 32x40.
Columns: idle, stepL, idle, stepR. Rows: s, w, e, n.

These are presentation stand-ins that amplify PR #67's badge tokens.
Ship-quality actor art remains Fable's §14 job.

Usage:
    python3 scripts/gen_office_actors.py
"""

from __future__ import annotations

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

INK = (8, 11, 18, 255)
SHADOW = (0, 0, 0, 90)


def hex_rgba(value: str) -> tuple[int, int, int, int]:
    v = value.lstrip('#')
    return int(v[0:2], 16), int(v[2:4], 16), int(v[4:6], 16), 255


class Frame:
    def __init__(self) -> None:
        self.px: dict[tuple[int, int], tuple[int, int, int, int]] = {}

    def put(self, x: int, y: int, color: tuple[int, int, int, int]) -> None:
        if 0 <= x < FRAME_W and 0 <= y < FRAME_H and color[3] > 0:
            self.px[(x, y)] = color

    def fill(
        self,
        x0: int,
        y0: int,
        x1: int,
        y1: int,
        color: tuple[int, int, int, int],
    ) -> None:
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                self.put(x, y, color)

    def rect(self, x: int, y: int, w: int, h: int, color: tuple[int, int, int, int]) -> None:
        self.fill(x, y, x + w - 1, y + h - 1, color)

    def ink_outline(self) -> None:
        solid = {p for p, c in self.px.items() if c[3] == 255 and c != INK}
        extras: dict[tuple[int, int], tuple[int, int, int, int]] = {}
        for x, y in solid:
            for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
                if (nx, ny) not in self.px:
                    extras[(nx, ny)] = INK
        for p, c in extras.items():
            self.put(*p, c)

    def to_image(self) -> Image.Image:
        im = Image.new('RGBA', (FRAME_W, FRAME_H), (0, 0, 0, 0))
        pix = im.load()
        for (x, y), color in self.px.items():
            pix[x, y] = color
        return im


# Palettes pulled from the existing 512px portraits so the walk-cycle
# body and the Headshot badge read as the same person.
ACTORS: dict[str, dict[str, str]] = {
    'lead_eng': {
        'skin': '#e8b896',
        'skin_sh': '#c48a64',
        'hair': '#1a1a1e',
        'hair_hi': '#3a3a42',
        'eye': '#2a1a12',
        'top': '#2c3e50',
        'top_hi': '#3d556d',
        'shirt': '#e8eaed',
        'accent': '#3b82f6',
        'pants': '#c4b28a',
        'pants_sh': '#9a8762',
        'shoes': '#222226',
        'sole': '#f2f2f2',
        'prop': '#8b95a3',
    },
    'lead_design': {
        'skin': '#f0c4a8',
        'skin_sh': '#d49a78',
        'hair': '#5a3a24',
        'hair_hi': '#7a5234',
        'eye': '#2d6a3e',
        'top': '#3b82f6',
        'top_hi': '#f59e0b',
        'shirt': '#f7f7f4',
        'accent': '#a855f7',
        'pants': '#8b5a3c',
        'pants_sh': '#6a4028',
        'shoes': '#4a2c18',
        'sole': '#4a2c18',
        'prop': '#dc2626',
    },
    'lead_pm': {
        'skin': '#c9956c',
        'skin_sh': '#a87450',
        'hair': '#3d2a1c',
        'hair_hi': '#5a3e28',
        'eye': '#4a2e1c',
        'top': '#2a8a7a',
        'top_hi': '#3aa494',
        'shirt': '#f5f5f5',
        'accent': '#c4a574',
        'pants': '#2a2a30',
        'pants_sh': '#1a1a20',
        'shoes': '#1a1a1a',
        'sole': '#1a1a1a',
        'prop': '#4b5563',
    },
    'renata': {
        'skin': '#e8b896',
        'skin_sh': '#c48a64',
        'hair': '#6b4423',
        'hair_hi': '#8a5c34',
        'eye': '#4a2e1c',
        'top': '#1e3a5f',
        'top_hi': '#2c5282',
        'shirt': '#93c5e8',
        'accent': '#f5f5f5',
        'pants': '#c4b28a',
        'pants_sh': '#9a8762',
        'shoes': '#5c3a1e',
        'sole': '#5c3a1e',
        'prop': '#1a1a1e',
    },
    'gavin': {
        'skin': '#e8b896',
        'skin_sh': '#c48a64',
        'hair': '#1a1a1e',
        'hair_hi': '#2e2e34',
        'eye': '#3a2418',
        'top': '#1e3a5f',
        'top_hi': '#2c5282',
        'shirt': '#f7f7f4',
        'accent': '#1a2744',
        'pants': '#1e3a5f',
        'pants_sh': '#15283f',
        'shoes': '#111114',
        'sole': '#111114',
        'prop': '#f4f1ea',
    },
    'priya': {
        'skin': '#e8b896',
        'skin_sh': '#c48a64',
        'hair': '#5a3a24',
        'hair_hi': '#7a5234',
        'eye': '#3a2418',
        'top': '#7a4a2a',
        'top_hi': '#9a6238',
        'shirt': '#93c5e8',
        'accent': '#f59e0b',
        'pants': '#2a2a30',
        'pants_sh': '#1a1a20',
        'shoes': '#5c3a1e',
        'sole': '#5c3a1e',
        'prop': '#22c55e',
    },
    'holloway': {
        'skin': '#e0b090',
        'skin_sh': '#b88464',
        'hair': '#4a3424',
        'hair_hi': '#6a4c34',
        'eye': '#2a1a12',
        'top': '#3a3d44',
        'top_hi': '#52565f',
        'shirt': '#b8d4e8',
        'accent': '#2563eb',
        'pants': '#3a3d44',
        'pants_sh': '#2a2d34',
        'shoes': '#4a3424',
        'sole': '#4a3424',
        'prop': '#f5f5f5',
    },
}


def pal(spec: dict[str, str]) -> dict[str, tuple[int, int, int, int]]:
    return {k: hex_rgba(v) for k, v in spec.items()}


def pose(facing: str, frame: str) -> dict[str, int]:
    step = 0
    bob = 0
    if frame == 'stepL':
        step = -1
        bob = -1
    elif frame == 'stepR':
        step = 1
        bob = -1
    return {'step': step, 'bob': bob, 'facing': 0 if facing else 0}


def draw_shadow(fr: Frame) -> None:
    for x, y in (
        (12, 37),
        (13, 36),
        (14, 36),
        (15, 36),
        (16, 36),
        (17, 36),
        (18, 36),
        (19, 37),
        (13, 37),
        (14, 37),
        (15, 37),
        (16, 37),
        (17, 37),
        (18, 37),
        (14, 38),
        (15, 38),
        (16, 38),
        (17, 38),
    ):
        fr.put(x, y, SHADOW)


def draw_shoes(fr: Frame, p: dict[str, tuple[int, int, int, int]], facing: str, step: int) -> None:
    ly = 34 + (1 if step < 0 else 0)
    ry = 34 + (1 if step > 0 else 0)
    if facing in ('e', 'w'):
        x = 14 if facing == 'w' else 15
        fr.rect(x, 34 + (1 if step else 0), 5, 3, p['shoes'])
        fr.rect(x, 36 + (1 if step else 0), 5, 1, p['sole'])
        return
    if facing == 'n':
        fr.rect(12, ly, 4, 3, p['shoes'])
        fr.rect(16, ry, 4, 3, p['shoes'])
        return
    fr.rect(11, ly, 5, 3, p['shoes'])
    fr.rect(16, ry, 5, 3, p['shoes'])
    fr.rect(11, ly + 2, 5, 1, p['sole'])
    fr.rect(16, ry + 2, 5, 1, p['sole'])


def draw_legs(fr: Frame, p: dict[str, tuple[int, int, int, int]], facing: str, step: int, bob: int) -> None:
    y = 26 + bob
    if facing in ('e', 'w'):
        fr.rect(13, y, 6, 8, p['pants'])
        fr.rect(13, y, 2, 8, p['pants_sh'])
        return
    lx = 12 + (-1 if step < 0 and facing == 's' else 1 if step < 0 else 0)
    rx = 16 + (1 if step > 0 and facing == 's' else -1 if step > 0 else 0)
    fr.rect(lx, y + (1 if step < 0 else 0), 4, 8, p['pants'])
    fr.rect(rx, y + (1 if step > 0 else 0), 4, 8, p['pants'])
    fr.rect(lx, y + 4, 4, 4, p['pants_sh'])
    fr.rect(rx, y + 4, 4, 4, p['pants_sh'])


def draw_torso(
    fr: Frame,
    name: str,
    p: dict[str, tuple[int, int, int, int]],
    facing: str,
    bob: int,
) -> None:
    y = 16 + bob
    if facing in ('e', 'w'):
        fr.rect(12, y, 8, 10, p['top'])
        fr.rect(12 if facing == 'w' else 17, y, 3, 10, p['top_hi'])
        if facing == 'e':
            fr.rect(14, y + 1, 2, 6, p['shirt'])
        elif facing == 'w':
            fr.rect(16, y + 1, 2, 6, p['shirt'])
        if name == 'lead_design':
            fr.put(13, y + 2, p['accent'])
            fr.put(18, y + 4, p['top_hi'])
            fr.put(14, y + 6, hex_rgba('#3b82f6'))
        if name == 'gavin':
            fr.rect(15, y + 1, 2, 7, p['accent'])
        if name == 'holloway':
            fr.rect(15, y + 1, 2, 7, p['accent'])
        if name == 'priya':
            fr.put(13 if facing == 'w' else 18, y + 2, hex_rgba('#f97316'))
            fr.put(13 if facing == 'w' else 18, y + 4, hex_rgba('#2563eb'))
            fr.put(13 if facing == 'w' else 18, y + 6, p['accent'])
        if name == 'lead_eng':
            fr.rect(15, y + 1, 2, 8, p['accent'])
        return

    fr.rect(11, y, 10, 10, p['top'])
    if facing == 's':
        fr.rect(14, y + 1, 4, 7, p['shirt'])
        if name == 'lead_design':
            fr.put(12, y + 2, p['top_hi'])
            fr.put(19, y + 2, p['accent'])
            fr.put(12, y + 5, p['accent'])
            fr.put(19, y + 6, hex_rgba('#3b82f6'))
            fr.put(13, y + 7, p['top_hi'])
        if name == 'lead_eng':
            fr.rect(15, y + 2, 2, 8, p['accent'])
            fr.rect(14, y + 8, 4, 2, hex_rgba('#dbeafe'))
        if name == 'gavin':
            fr.rect(15, y + 1, 2, 8, p['accent'])
            fr.put(12, y + 2, hex_rgba('#eab308'))
            fr.put(12, y + 4, hex_rgba('#cbd5e1'))
        if name == 'priya':
            fr.put(12, y + 2, hex_rgba('#f97316'))
            fr.put(12, y + 4, hex_rgba('#2563eb'))
            fr.put(12, y + 6, p['accent'])
            fr.put(12, y + 8, hex_rgba('#22c55e'))
        if name == 'holloway':
            fr.rect(15, y + 1, 2, 8, p['accent'])
        if name == 'renata':
            fr.put(19, y + 2, p['accent'])
        if name == 'lead_pm':
            fr.rect(13, y + 8, 6, 1, p['accent'])
    else:
        fr.rect(11, y, 10, 10, p['top'])
        fr.rect(12, y + 1, 8, 2, p['top_hi'])
        if name == 'lead_eng':
            fr.rect(14, y + 2, 4, 3, p['hair'])  # hoodie back


def draw_arms(
    fr: Frame,
    name: str,
    p: dict[str, tuple[int, int, int, int]],
    facing: str,
    step: int,
    bob: int,
) -> None:
    y = 17 + bob
    swing = step
    if facing == 's':
        fr.rect(9, y + max(0, swing), 2, 8, p['top'])
        fr.rect(21, y + max(0, -swing), 2, 8, p['top'])
        fr.put(9, y + 7 + max(0, swing), p['skin'])
        fr.put(21, y + 7 + max(0, -swing), p['skin'])
    elif facing == 'n':
        fr.rect(9, y + max(0, -swing), 2, 8, p['top'])
        fr.rect(21, y + max(0, swing), 2, 8, p['top'])
        fr.put(9, y + 7 + max(0, -swing), p['skin'])
        fr.put(21, y + 7 + max(0, swing), p['skin'])
    elif facing == 'e':
        fr.rect(19, y + max(0, swing), 3, 8, p['top'])
        fr.put(21, y + 7 + max(0, swing), p['skin'])
    else:
        fr.rect(10, y + max(0, swing), 3, 8, p['top'])
        fr.put(10, y + 7 + max(0, swing), p['skin'])

    # Signature props — small, direction-aware.
    if name == 'lead_eng' and facing in ('e', 's'):
        fr.rect(19 if facing == 'e' else 20, y + 4, 5, 3, p['prop'])
    if name == 'lead_design' and facing != 'n':
        fr.rect(20 if facing != 'w' else 7, y + 5, 4, 3, p['prop'] if False else hex_rgba('#8b95a3'))
    if name == 'gavin' and facing in ('e', 's', 'w'):
        bx = 20 if facing != 'w' else 8
        fr.rect(bx, y + 3, 3, 5, p['prop'])
    if name == 'holloway' and facing in ('e', 's', 'w'):
        mx = 21 if facing != 'w' else 8
        fr.rect(mx, y + 5, 3, 3, p['prop'])
        fr.put(mx + 1, y + 4, hex_rgba('#d6d3d1'))


def draw_head(
    fr: Frame,
    name: str,
    p: dict[str, tuple[int, int, int, int]],
    facing: str,
    bob: int,
) -> None:
    y = 5 + bob
    # Neck
    fr.rect(14, y + 10, 4, 2, p['skin_sh'])
    # Head
    fr.rect(12, y + 2, 8, 8, p['skin'])
    fr.rect(13, y + 1, 6, 1, p['skin'])
    fr.rect(13, y + 9, 6, 1, p['skin_sh'])

    if facing == 'n':
        fr.rect(11, y, 10, 7, p['hair'])
        fr.rect(12, y + 6, 8, 2, p['hair'])
        if name == 'lead_eng':
            fr.rect(11, y + 1, 10, 4, p['hair'])  # hoodie
        if name == 'lead_design':
            fr.put(11, y + 3, p['prop'])
        return

    # Hair
    if name in ('lead_eng', 'gavin'):
        fr.rect(11, y, 10, 4, p['hair'])
        fr.put(12, y - 1, p['hair'])
        fr.put(15, y - 1, p['hair_hi'])
        fr.put(18, y - 1, p['hair'])
        fr.rect(11, y + 2, 2, 4, p['hair'])
        fr.rect(19, y + 2, 2, 4, p['hair'])
    elif name in ('lead_design', 'priya'):
        fr.rect(11, y, 10, 4, p['hair'])
        fr.rect(11, y + 3, 2, 4, p['hair'])
        fr.rect(19, y + 3, 2, 3, p['hair'])
        if name == 'lead_design':
            fr.put(11, y + 4, p['prop'])
    elif name == 'lead_pm':
        fr.rect(11, y, 10, 4, p['hair'])
        fr.rect(11, y + 3, 2, 5, p['hair'])
        fr.rect(19, y + 3, 2, 5, p['hair'])
        fr.rect(13, y + 1, 6, 2, p['hair_hi'])
    elif name == 'renata':
        fr.rect(11, y, 10, 4, p['hair'])
        fr.rect(11, y + 3, 2, 5, p['hair'])
        fr.rect(19, y + 3, 2, 5, p['hair'])
        fr.put(15, y - 1, p['hair_hi'])
    else:  # holloway
        fr.rect(11, y, 10, 4, p['hair'])
        fr.put(13, y - 1, p['hair'])
        fr.put(17, y - 1, p['hair'])
        fr.rect(11, y + 2, 2, 3, p['hair'])
        fr.rect(19, y + 2, 2, 3, p['hair'])

    if facing == 's':
        fr.put(14, y + 5, p['eye'])
        fr.put(17, y + 5, p['eye'])
        fr.put(14, y + 6, hex_rgba('#fff6ee'))
        fr.put(17, y + 6, hex_rgba('#fff6ee'))
        mouth = hex_rgba('#a35a48')
        if name == 'holloway':
            fr.put(15, y + 8, mouth)
            fr.put(16, y + 8, mouth)
        else:
            fr.put(15, y + 8, mouth)
            fr.put(16, y + 7, mouth)
        if name == 'gavin':
            fr.rect(13, y + 5, 6, 1, hex_rgba('#2a2a30'))
    elif facing == 'e':
        fr.rect(16, y + 2, 5, 7, p['skin'])
        fr.put(18, y + 5, p['eye'])
        fr.put(19, y + 7, hex_rgba('#a35a48'))
        fr.rect(12, y + 1, 5, 4, p['hair'])
    else:
        fr.rect(11, y + 2, 5, 7, p['skin'])
        fr.put(13, y + 5, p['eye'])
        fr.put(12, y + 7, hex_rgba('#a35a48'))
        fr.rect(15, y + 1, 5, 4, p['hair'])


def draw_actor(name: str, facing: str, frame: str) -> Frame:
    p = pal(ACTORS[name])
    pose_n = pose(facing, frame)
    fr = Frame()
    draw_shadow(fr)
    draw_shoes(fr, p, facing, pose_n['step'])
    draw_legs(fr, p, facing, pose_n['step'], pose_n['bob'])
    draw_torso(fr, name, p, facing, pose_n['bob'])
    draw_arms(fr, name, p, facing, pose_n['step'], pose_n['bob'])
    draw_head(fr, name, p, facing, pose_n['bob'])
    fr.ink_outline()
    return fr


def build_sheet(name: str) -> Image.Image:
    sheet = Image.new('RGBA', (SHEET_W, SHEET_H), (0, 0, 0, 0))
    for row, facing in enumerate(FACINGS):
        for col, frame in enumerate(FRAMES):
            im = draw_actor(name, facing, frame).to_image()
            sheet.paste(im, (col * FRAME_W, row * FRAME_H), im)
    return sheet


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in ACTORS:
        path = OUT_DIR / f'{name}.png'
        sheet = build_sheet(name)
        if sheet.size != (SHEET_W, SHEET_H) or sheet.mode != 'RGBA':
            raise SystemExit(f'{name}: expected {SHEET_W}x{SHEET_H} RGBA, got {sheet.size} {sheet.mode}')
        sheet.save(path, 'PNG')
        print(f'{path.relative_to(ROOT)}: {SHEET_W}x{SHEET_H} RGBA')


if __name__ == '__main__':
    main()
