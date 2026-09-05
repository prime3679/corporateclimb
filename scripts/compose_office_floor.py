#!/usr/bin/env python3
"""Compose Floor 3–5 preview PNGs from the live office atlas + map glyphs.

Mirrors `src/screens/office/tiles.tsx` (floor autotile, rugs, decor, props)
so the preview matches what WorldMap paints. Actors are the south-idle frame
from `public/office/actors/*.png`.

Usage:
    python3 scripts/compose_office_floor.py
    python3 scripts/compose_office_floor.py --out /opt/cursor/artifacts/screenshots
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ATLAS_TS = ROOT / "src/screens/office/tileAtlas.ts"
TILES_PNG = ROOT / "public/office/tiles.png"
ACTORS = ROOT / "public/office/actors"

TILE = 32
CELL_W, CELL_H = 32, 48
PAD = 1
STRIDE_X, STRIDE_Y = 34, 50
OVERFLOW = CELL_H - TILE
MAP_W, MAP_H = 24, 18

# Facing row on the 4×4 actor sheet (matches OverworldActor.module.css).
FACE_ROW = {"s": 0, "w": 1, "e": 2, "n": 3}


def parse_atlas() -> dict[str, tuple[int, int]]:
    text = ATLAS_TS.read_text()
    out: dict[str, tuple[int, int]] = {}
    for name, col, row in re.findall(r"(\w+): \[(\d+), (\d+)\]", text):
        out[name] = (int(col), int(row))
    if "floor_war" not in out:
        raise SystemExit("tileAtlas.ts is missing Floor 3–5 cells")
    return out


def parse_art(path: Path) -> list[str]:
    text = path.read_text()
    rows = re.findall(r"^  '(.{24})',?$", text, flags=re.M)
    if len(rows) < 18:
        raise SystemExit(f"{path} has {len(rows)} map rows, want 18")
    return rows[:18]


def parse_rugs(path: Path) -> list[dict]:
    text = path.read_text()
    rugs = []
    for m in re.finditer(
        r"\{ x0: (\d+), y0: (\d+), x1: (\d+), y1: (\d+), kind: '(\w+)' \}",
        text,
    ):
        rugs.append(
            {
                "x0": int(m[1]),
                "y0": int(m[2]),
                "x1": int(m[3]),
                "y1": int(m[4]),
                "kind": m[5],
            }
        )
    return rugs


def parse_decor(path: Path) -> dict[tuple[int, int], str]:
    text = path.read_text()
    block = text.split("WALL_DECOR")[1].split("}")[0]
    out: dict[tuple[int, int], str] = {}
    for x, y, name in re.findall(r"'(\d+),(\d+)': '(\w+)'", block):
        out[(int(x), int(y))] = name
    return out


def parse_npcs(path: Path) -> list[tuple[str, int, int, str]]:
    """Return (actor_sheet, x, y, facing) from FLOOR_N_NPC_TILE + names."""
    text = path.read_text()
    names = dict(re.findall(r"(npc_\w+): '([A-Za-z]+)'", text))
    tiles = []
    ids = re.findall(
        r"(npc_\w+): \{ x: (\d+), y: (\d+), facing: '([nesw])' \}",
        text,
    )
    for nid, x, y, facing in ids:
        tiles.append((names[nid].lower(), int(x), int(y), facing))
    return tiles


def zone_floor(floor_id: str, x: int, y: int) -> str:
    if 1 <= x <= 5 and 1 <= y <= 5:
        return "floor_elevator"
    if floor_id == "floor_05":
        if 7 <= x <= 22 and 1 <= y <= 5:
            return "floor_director"
        if 1 <= x <= 22 and 10 <= y <= 16:
            return "floor_board"
        return "floor_hall"
    if floor_id == "floor_03":
        if 7 <= x <= 13 and 1 <= y <= 5:
            return "floor_war"
        if 15 <= x <= 22 and 1 <= y <= 5:
            return "floor_intake"
        if 1 <= x <= 22 and 10 <= y <= 16:
            return "floor_product"
        return "floor_hall"
    # floor_04
    if 7 <= x <= 13 and 1 <= y <= 5:
        return "floor_pipeline"
    if 15 <= x <= 22 and 1 <= y <= 5:
        return "floor_client"
    if 1 <= x <= 22 and 10 <= y <= 16:
        return "floor_product"
    return "floor_hall"


def glyph(rows: list[str], x: int, y: int) -> str:
    if x < 0 or y < 0 or x >= MAP_W or y >= MAP_H:
        return "#"
    raw = rows[y][x]
    return "." if raw == "@" else raw


def is_wall(rows: list[str], x: int, y: int) -> bool:
    return glyph(rows, x, y) == "#"


def wall_mask(rows: list[str], x: int, y: int) -> int:
    return (
        (0 if is_wall(rows, x, y - 1) else 1)
        | (0 if is_wall(rows, x + 1, y) else 2)
        | (0 if is_wall(rows, x, y + 1) else 4)
        | (0 if is_wall(rows, x - 1, y) else 8)
    )


def rug_part(rugs: list[dict], x: int, y: int) -> str | None:
    for r in rugs:
        if x < r["x0"] or x > r["x1"] or y < r["y0"] or y > r["y1"]:
            continue
        v = "tb" if r["y0"] == r["y1"] else ("t" if y == r["y0"] else "b" if y == r["y1"] else "")
        h = "lr" if r["x0"] == r["x1"] else ("l" if x == r["x0"] else "r" if x == r["x1"] else "")
        part = f"{v}{h}" or "c"
        return f"rug_{r['kind']}_{part}"
    return None


def door_sprite(rows: list[str], x: int, y: int) -> str:
    n = is_wall(rows, x, y - 1)
    s = is_wall(rows, x, y + 1)
    w = is_wall(rows, x - 1, y)
    e = is_wall(rows, x + 1, y)
    if (w or e) and not n and not s:
        return "door_h"
    if n and s:
        return "door_v_single"
    if n:
        return "door_v_top"
    if s:
        return "door_v_bot"
    return "door_v_mid"


def is_table(g: str) -> bool:
    return g in "TA"


def is_desk(g: str) -> bool:
    return g in "=d"


def prop_name(rows: list[str], floor_id: str, x: int, y: int) -> str | None:
    g = glyph(rows, x, y)
    if g == "=":
        left = glyph(rows, x - 1, y) == "="
        right = glyph(rows, x + 1, y) == "="
        part = "m" if left and right else "r" if left else "l"
        return "desk_r" if part == "r" else f"desk_{part}_0"
    if g == "c":
        north = glyph(rows, x, y - 1)
        return "chair_n" if is_desk(north) or is_table(north) else "chair_s"
    if g == "S":
        return "cabinet_closed"
    if g == "K":
        left = glyph(rows, x - 1, y) == "K"
        right = glyph(rows, x + 1, y) == "K"
        if not left:
            return "counter_machine"
        return "counter_cups" if right else "counter_sink"
    if g == "V":
        return "vending_idle"
    if g == "t":
        right = glyph(rows, x - 1, y) == "t"
        return "btable_f2_r" if right else "btable_f2_l"
    if g in "TA":
        top = not is_table(glyph(rows, x, y - 1))
        left = not is_table(glyph(rows, x - 1, y))
        right = not is_table(glyph(rows, x + 1, y))
        part = f"{'t' if top else 'b'}{'l' if left else 'r' if right else ''}"
        return f"mtable_{part}"
    if g == "H":
        return "handout_rack"
    if g == "w":
        return "water_cooler"
    if g == "i":
        return {"floor_03": "directory_f3", "floor_04": "directory_f4", "floor_05": "directory_f5"}[
            floor_id
        ]
    if g == "p":
        return "plant_b" if (x + y) % 2 else "plant_a"
    if g == "E":
        side = "r" if glyph(rows, x - 1, y) == "E" else "l"
        return f"elev_{side}_closed"
    if g == "R":
        return "reader_red_0"
    if g == "f":
        return "filing_open" if x % 2 else "filing_closed"
    if g == "L":
        return "sofa_r" if glyph(rows, x - 1, y) == "L" else "sofa_l"
    if g == "d":
        return "exec_desk_r" if glyph(rows, x - 1, y) == "d" else "exec_desk_l"
    if g == "W":
        return "roadmap_wall"
    if g == "N":
        return "intake_board"
    if g == "C":
        return "pipeline_board"
    if g == "U":
        return "sideboard"
    return None


def crop_cell(atlas: Image.Image, name: str, cells: dict[str, tuple[int, int]]) -> Image.Image:
    col, row = cells[name]
    box = (
        col * STRIDE_X + PAD,
        row * STRIDE_Y + PAD,
        col * STRIDE_X + PAD + CELL_W,
        row * STRIDE_Y + PAD + CELL_H,
    )
    return atlas.crop(box)


def blit(dst: Image.Image, src: Image.Image, x: int, y: int) -> None:
    dst.alpha_composite(src, (x, y))


def compose_floor(
    atlas: Image.Image,
    cells: dict[str, tuple[int, int]],
    floor_id: str,
    src: Path,
) -> Image.Image:
    rows = parse_art(src)
    rugs = parse_rugs(src)
    decor = parse_decor(src)
    npcs = parse_npcs(src)

    w, h = MAP_W * TILE, MAP_H * TILE + OVERFLOW
    img = Image.new("RGBA", (w, h), (18, 16, 14, 255))

    def paste_tile(name: str, tx: int, ty: int) -> None:
        cell = crop_cell(atlas, name, cells)
        blit(img, cell, tx * TILE, ty * TILE)

    for y in range(MAP_H):
        for x in range(MAP_W):
            g = glyph(rows, x, y)
            if g == "#":
                paste_tile(f"wall_{wall_mask(rows, x, y)}", x, y)
                if (x, y) in decor and (wall_mask(rows, x, y) & 4):
                    paste_tile(decor[(x, y)], x, y)
                continue
            floor_name = rug_part(rugs, x, y) or zone_floor(floor_id, x, y)
            paste_tile(floor_name, x, y)
            if is_wall(rows, x, y - 1):
                paste_tile("shade_n", x, y)
            if is_wall(rows, x - 1, y):
                paste_tile("shade_w", x, y)
            if g == "D":
                paste_tile(door_sprite(rows, x, y), x, y)

    for y in range(MAP_H):
        for x in range(MAP_W):
            name = prop_name(rows, floor_id, x, y)
            if name:
                paste_tile(name, x, y)

    # Player on the arrival tile, south-facing lead_pm.
    player = Image.open(ACTORS / "lead_pm.png").convert("RGBA")
    frame = player.crop((0, FACE_ROW["s"] * 40, 32, FACE_ROW["s"] * 40 + 40))
    blit(img, frame, 3 * TILE, 2 * TILE - (40 - TILE))

    for sheet, x, y, facing in npcs:
        path = ACTORS / f"{sheet}.png"
        if not path.exists():
            continue
        actor = Image.open(path).convert("RGBA")
        row = FACE_ROW[facing]
        frame = actor.crop((0, row * 40, 32, row * 40 + 40))
        blit(img, frame, x * TILE, y * TILE - (40 - TILE))

    return img.resize((img.width * 2, img.height * 2), Image.NEAREST)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--out",
        type=Path,
        default=ROOT / "artifacts",
        help="directory for office-floor-N-preview.png",
    )
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)

    cells = parse_atlas()
    atlas = Image.open(TILES_PNG).convert("RGBA")
    floors = (
        ("floor_03", ROOT / "src/content/office/floor3.ts", "3"),
        ("floor_04", ROOT / "src/content/office/floor4.ts", "4"),
        ("floor_05", ROOT / "src/content/office/floor5.ts", "5"),
    )
    for floor_id, src, n in floors:
        img = compose_floor(atlas, cells, floor_id, src)
        dest = args.out / f"office-floor-{n}-preview.png"
        img.save(dest)
        print(f"wrote {dest} ({img.width}×{img.height})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
