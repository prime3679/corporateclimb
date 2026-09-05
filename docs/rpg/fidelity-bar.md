# Floor 1 fidelity bar — walk-cycle follow-up

This is a presentation follow-up to [PR #67](https://github.com/prime3679/corporateclimb/pull/67)
(`cursor/office-fidelity-rebuild-1667`). It amplifies that rebuild. It does not
replace the office engine, frozen IDs, Classic save isolation, or #67's tile /
HUD / transition work.

Companion reading: `docs/rpg/architecture.md` (Astra vs Fable ownership),
`docs/rpg/mvp-design.md` §14 (asset bar), `CLAUDE.md` (Classic tower).

## Relationship to #67

#67 rebuilt Floor 1 presentation: zone-tinted tiles, layered props, badge-token
bodies with a facing notch, camera look-ahead, overlay contrast, and battle
veils. People on the map still read as **lanyard badges** — the §14.2 stand-in
#67 correctly kept while it raised the room around them.

This follow-up only changes how those people are drawn on `WorldMap`:

| Surface                       | #67                                  | This PR                                  |
| ----------------------------- | ------------------------------------ | ---------------------------------------- |
| Player + NPC map token        | `BadgeToken` (28px headshot + notch) | `OverworldActor` (32×40 walk-cycle body) |
| Dialogue / party / cards      | `Headshot` crop                      | Unchanged `Headshot`                     |
| Tiles, HUD, overlays, SFX     | Rebuilt in #67                       | Untouched                                |
| Engine / frozen IDs / Classic | Isolated                             | Isolated                                 |

Do not thrash #67 to land this. Stack it. If #67 is still open, this branch
starts at that tip (`3c6ff1b` / `4378e28`) so the fidelity pass stays one
story.

## Before / after (map tokens)

**Before (#67):** each actor is a 32×32 badge token — portrait crop, type ring,
body stub, facing notch, step-phase bob. Readable, on-brand, still a badge.

**After (this PR):** each actor is a 32×40 full-body sheet (`public/office/actors/`)
with four facings and a one-shot 250ms walk (`idle / stepL / idle / stepR`)
keyed on tile change. Map tokens do **not** mount a mini `Headshot` (that
circular import crashed the office screen). Dialogue / party / cards still
use `Headshot`. Recruits still do not follow.

Sheets (128×160 RGBA, 4×4, frame 32×40):

- `lead_eng`, `lead_design`, `lead_pm` — chosen class
- `renata`, `gavin`, `priya`, `holloway` — floor NPCs

Regenerate with `python3 scripts/gen_office_actors.py` (Pillow). Palettes track
the existing 512px portraits.

### Sprite art (`feat/office-sprite-art`)

The first cut of these sheets was a ~1.7KB rectangle generator. They are now
hand-authored pixel art, versioned as ASCII templates inside
`scripts/gen_office_actors.py` so the sheets stay regenerable:

- One chibi rig for the whole cast (13px head / 10px torso / 9px legs, feet on
  y=33, ~8px head overflow above the tile) so everyone reads as one world.
- Per-character heads (hair silhouette is the primary identity carrier),
  costumes and props: Eng hoodie + lanyard + laptop, Design patchwork blazer +
  hair clip + wide trousers + tablet, PM bob + teal blazer + tablet, Renata
  wavy hair + phone, Gavin slicked hair + pin + paper stack, Priya spikes +
  sticky-note badges + index cards, Holloway slouch + mug + binder.
- Top-left light, lit / base / shadow ramp per material, one plum ink for the
  silhouette plus selective outlines that separate head, arms and props from
  the torso.
- Walk: front / back lift one foot and drop the hips 1px; side views use the
  contact stride (near leg forward, far leg trailing in shadow tone) with the
  arms swinging opposite the legs. Frame order and cell size are unchanged.

`OverworldActor.module.css` gives `.sheet` its own compositor layer
(`will-change: transform`). Without it the sprites live inside the camera
layer, which the `Stage` scales fractionally, and every 1px detail gets
bilinear-filtered into mush.

### Environment art (`feat/office-environment-art`)

The rooms now match the cast. `tiles.tsx` no longer draws SVG furniture; it
decides which cell of a hand-authored pixel tileset goes where, and
`WorldMap` paints those cells as sprite-sheet spans exactly like
`OverworldActor` paints its sheet.

- `scripts/gen_office_tiles.py` → `public/office/tiles.png` +
  `src/screens/office/tileAtlas.ts` (generated name → cell index). Same
  pipeline and art language as the actor sheets: plum ink `#1b1726`, top-left
  light, lit / base / shadow ramp per material, no gradients, no
  anti-aliasing. Regenerate with `python3 scripts/gen_office_tiles.py`
  (`--preview` dumps a 3× contact sheet to `/tmp`).
- Cells are 32×48: the bottom 32×32 is the tile footprint, the 16px above is
  upward overflow for tall props (cabinet, vending, elevator portal, plants,
  cooler, rack). Every cell sits in a 34×50 slot with a 1px extruded border
  and each span is drawn one pixel larger than its art, so neighbours overlap
  by an identical pixel — without that, the Stage's fractional scale leaves
  anti-aliased hairline seams between adjacent spans.
- Depth without z-sorting: props are split into a footprint layer under the
  actors and an overflow layer over them. A person standing south of a desk
  overlaps its footprint with their head and is in front; only a person
  standing north can overlap the overflow, and they are behind.
- Floors: six zone materials (hall carpet, reception planks, desks carpet
  tiles, break lino checker, meeting diamond carpet, elevator stone), rugs in
  front of the elevator and behind reception, a navy runner down the hall.
  Walls autotile from a 16-way neighbour mask — dark cap, plaster face with
  chair rail, wainscot and baseboard wherever floor lies south, lit / shadow
  jambs at wall ends — and drop stepped shadows onto the floor south and east
  of them. Wall-face decor (windows, whiteboard, pinboards, clocks, posters,
  signs, the lobby plaque) is keyed by wall coordinate in `tiles.tsx`; the
  frozen `FLOOR_ART` is untouched.
- Doorways: every walkable `D` is drawn as floor plus a frame. The 3-tall
  openings at x=10 / x=14 read as one retracted glass partition (aluminium
  floor track, leaves stacked against the jamb posts); the single door at
  (5,12) gets a header with an exit light. `tileset.test.ts` guards this.
- Stateful props come from the existing `TileStates`: printer error /
  working / printing (2 frames), cabinet closed / open, coffee machine idle /
  steaming (2 frames), vending idle / lit (2 frames), badge reader red / green
  (blink), elevator closed / open. Frames are consecutive sheet cells stepped
  by `background-position-x`; reduced motion holds frame 0 and stills the
  light pools, as before.

### Floor 2 art (`feat/office-floor-2-design`)

The same two generators now carry Floor 2 (`docs/rpg/floor-2-design.md` §11). Floor 2 tile
cells are appended after every Floor 1 cell, so the 108 Floor 1 atlas indices and their pixels
are unchanged; the sheet grows to 272×1050 (165 cells) with five room floors, a one-tile
vertical doorway, Operations signage and the help-desk / People Ops / Facilities / Finance /
director props. Three new walk sheets (`teddy`, `kessler`, `whitlock`) use the same rig and
are registered in `ACTOR_IDS` and `NPC_ACTOR`.

### Floors 3–5 art (`cursor/office-floors-3-5-design`)

Same pipeline, same families. Floor 1 and Floor 2 atlas indices stay bit-identical;
new cells append after `btable_f2_r` (`docs/rpg/floor-3-5-design.md` §7). The sheet
grows to **272×1250** (195 cells): six department floors (war cork, intake lilac,
product slate, pipeline terracotta, client sand, board plush), three 3-tile hall
plaques, five room signs, three nameplates, three directories, and four props
(roadmap wall, intake board, pipeline board, walnut sideboard). Take-five, desks,
chairs, plants, elevator, reader, sofa, exec desk and the Floor 1 meeting table
are reused. Eight walk sheets (`sloane`, `nico`, `quincy`, `harper`, `reyes`,
`ashford`, `marlowe`, `caldwell`) use the Floor 1/2 rig.

## What stays frozen

- Office reducer, party projection, `corporate-climb-office-save` v1
- Classic `corporate-climb-save` and `simulation.test.ts`
- Frozen player-facing IDs and copy in `docs/rpg/mvp-design.md`
- `MOVE_MS = 250`; reduced-motion still skips the walk and the tile tween

## Playtest notes

1. New Office run. Walk N/E/S/W from spawn — facing row changes; a 250ms walk
   plays once per tile, then idle.
2. Cross reception → hall → desks → break → meeting → elevator. Confirm bodies
   sit on carpet (feet on the tile, 8px head overflow) and pass under desk
   foreground trim.
3. Face Renata / Gavin / Priya / Holloway. NPC sheets turn toward the player.
   Talk. Dialogue cards still use the large `Headshot`, not the walk sheet.
4. Switch lead class (eng / design / pm) on a fresh run. The map body matches
   the class; the badge crop still matches battle portraits.
5. Settings → reduce motion (and OS `prefers-reduced-motion`): no walk frames,
   no token tween. Idle facing still updates.
6. Required route smoke (printer → Gavin → Holloway → badge → elevator) — same
   prompts, same save key, no Classic Continue bleed.

## Still Fable's (do not treat this PR as §14 done)

#67 and this follow-up raise the presentation floor. They do **not** clear
Fable's ownership table:

- §14 asset sign-off. Character walk sheets and the Floor 1 tileset / props
  are now hand-authored pixel art (see "Sprite art" and "Environment art"
  above); the §19 device pass still has to confirm them on hardware.
- Full §12 feedback matrix and coach-mark motion
- §13 fade/duck timings
- §19 device sign-off (task-8 playtest)

Astra still does not own merge, deploy, or rewriting frozen IDs.
