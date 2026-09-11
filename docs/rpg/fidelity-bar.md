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
grows to **272×1250** (195 cells) on the design branch, then **272×1300**
(206 cells) after Pass E appends `floor_sales` / `floor_ante` / `floor_hall_f3–5`
and one-row red/gold runners, then **272×1350** (207 cells) after Pass J
splits the CALDWELL nameplate into two cells.
Original six department floors (war cork, intake lilac, product slate, pipeline
terracotta, client sand, board plush), three 3-tile hall
plaques, five room signs, three nameplates, three directories, and four props
(roadmap wall, intake board, pipeline board, walnut sideboard). Take-five, desks,
chairs, plants, elevator, reader, sofa, exec desk and the Floor 1 meeting table
are reused. Eight walk sheets (`sloane`, `nico`, `quincy`, `harper`, `reyes`,
`ashford`, `marlowe`, `caldwell`) use the Floor 1/2 rig.

### Pass E — F3–5 contrast + portraits

Presentation follow-up. Does not touch Office audio, Classic, or frozen IDs.

- **Glass:** `door_v_single` at `(6,3)` / `(14,3)` is an opening — thin jambs,
  folded glass, dashed track, south threshold. The middle stays empty so the
  floor under the `D` shows through.
- **Floors:** Sales no longer reuses Product slate. New cells (appended):
  `floor_sales`, `floor_ante`, `floor_hall_f3` / `_f4` / `_f5`. Existing F3–5
  floor pixels are punched so indigo / wine / plum read instantly vs the F1
  navy hall. F4 hall runner is red; F5 runner is gold. Light pools tint per
  department.
- **Portraits:** unique 512px WebP for the eight F3–5 faces. Same `Headshot`
  focal contract. Encounter kits for Quincy / Ashford / Caldwell use those
  keys. Floor 1–2 house portraits were already unique and stay put. Pass I
  confirms there is no leftover ambient / side-cast plate to commission.
- **Sloane crop (Pass H):** `#93` deferred “faces may sit a hair high.”
  Focal is now `{ x: 0.48, y: 0.105, zoom: 3.38 }` so the eyes sit in the
  upper third of the badge, not the top rim. Placement goes through
  `headshotPlacement` in `sprites.ts`.
- **Stub copy:** live maps still do not place `poi_directory_sign_stub` or
  `STUB_DIRECTORY_TEXT`. The leftover inspect id stays for save compat.

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

### Pass H — residual presentation

Share-proud polish on tip `0d1b72b`. Does not retouch Pass E audio, Pass F
coaches, Pass G objectives/elevator/combat, or the demo mp4.

- **Sloane Headshot:** tighter crop (see portraits above).
- **Short-stage chrome:** Stage is a size container (`container-name: stage`)
  and sets `data-stage-density` at design height ≤ 820 (the 440×760 playtest
  viewport). Office HUD, start card, and celebration compact there.
- **Safe areas:** `#root` already pads `env(safe-area-inset-*)`; Stage
  measures that backdrop. `--tap-min` 54 / `--text-floor` 10 stay the floors.
- **Titles:** celebration titles stay ≤ 16 chars (`FLOOR n CLEARED` /
  `THE CLIMB`); compact type is `--display-lg`. Office start `THE OFFICE`
  uses `text-wrap: balance`.

### Pass I — ambient / side-cast Headshots

Share-proud confirmation on tip `d37413a`. Does not retouch Pass E audio,
Pass F coaches, Pass G objectives/elevator, Pass H chrome, or the demo mp4.

The 5-floor climb has **exactly 15 speakers**. Every one already has a unique
512px plate on the existing `sprites.ts` / `HEADSHOT_FOCALS` / `Headshot`
contract — no second portrait system, no leftover house alias on F3–5, no
generic stand-in on the required route or common side POIs.

| Band                          | Speakers                                                                                                                   | Plates                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| F1–2 house (unique by freeze) | Renata `recruiter`, Gavin `overachiever`, Priya `scrum`, Holloway `manager`, Teddy `intern`, Whitlock `boss`, Kessler `vp` | Keys at the time (Classic plates); since rekeyed to `renata` … `kessler` — Pass J recast below       |
| F3–5 named (Pass E)           | Sloane, Nico, Quincy, Harper, Reyes, Ashford, Marlowe, Caldwell                                                            | Own keys + own pixels                                                                                |
| Extra ambient / side-cast     | none                                                                                                                       | Floor 2 made People Ops a tray so it would not grow a fourth face (`docs/rpg/floor-2-design.md` §14) |

Inspect, first-step callouts, and Pass D side POIs (cooler / booth / tray /
lockers / cart) stay speaker-less — italic inspect text, not a stub Headshot.
Roster lock lives in `OFFICE_CAST_HEADSHOTS` + `pass-i-meng.test.ts`.

Still deferred at the time: F1–2 recast (already unique house art — do not
re-commission without Adrian) — since commissioned by the Captain, see
"Pass J — F1–2 house-plate recast" below; hardware CoS on §12 / §13 / §19.

### Pass J — visual residuals promoted to Must

Share-proud pass on tip `4243663`. Four scoped items, nothing else: no Floor
6, Classic untouched, demo mp4 not remuxed, no engine work.

- **F1–2 house plates vs the F3–5 bar.** The house 512s are unique and stay
  (no recast). Where F1–2 was clearly behind was the crop, not the art:
  Kessler stands on the right third of `vp.webp`, so the house `x: 0.5` pin
  framed empty background with his ear on the badge rim. `vp` is now
  `{ x: 0.685, y: 0.105, zoom: 3.25 }`; Renata (`recruiter`) nudges from
  `x: 0.45` to `0.47` so her eyes, not the handset, sit on centre. Same
  `headshotPlacement` contract, same house zoom band. _(Superseded by the
  house-plate recast below: Office no longer keys `vp` / `recruiter`; those
  rows now serve Classic-side crops only.)_
- **F2 environment.** `nameplate_kessler` was a 33px plate in a 32px cell —
  the ink frame fell off both edges. It now uses the seven-glyph tight plate
  (same index, new pixels). Regenerate with `python3 scripts/gen_office_tiles.py`.
- **Sloane chibi.** The walk sheet wore a 2px blue tie her portrait never
  had. Torso templates now read open white shirt + cardigan + brown belt;
  `T`/`t` are the belt. Headshot unchanged.
- **CALDWELL nameplate.** Eight glyphs are 31px; the single cell had the
  letters touching the frame and the boardroom camera edge sliced them.
  `nameplate_caldwell_l/r` spans `(15,9)–(16,9)`; the plate hangs from the
  left cell edge and ends by x=6 of the right cell, so the name completes
  from `(9, y)` facing east (one tile sooner) and the one pose that still
  clips it — `(9, y)` facing north/south — cuts on the D|W glyph gap.
- **Holloway folder text.** `manager.webp` prints garbled type on the folder
  at y≈0.32–0.39; the `manager` crop bottom sits at 0.291 at every badge
  size, so it never reaches a Headshot or dialogue card. Left as-is (the
  plate was Classic-shared; battle shows the full body). Guarded in
  `pass-j-visual.test.ts` at the time. _(Retired by the recast below:
  Holloway wears her own Office-only `holloway` plate, which has no folder.)_

Noted here for the next pass and since closed (see "Pass J — F2 HELP DESK
sign frame" below): `sign_helpdesk` (F2 `(7,0)`) was a 35px plate in a 32px
cell for the same reason as KESSLER.

### Pass J — F2 HELP DESK sign frame

The last share-proud leftover from the visual pass, on tip `6a04778`. One
scoped item: no Floor 6, Classic untouched, demo mp4 not remuxed, no engine
work, no map change.

**Before.** `sign_room('HELPDESK')` — eight 3×5 glyphs are 31px, so the plate
was 35px and its ink frame 37px in a 32px cell. Both frame columns fell off
the cell, the letters sat flush against the cell edges, and the sign ran into
the ticket board at `(8,0)`. On a phone at playtest size it read as a dark
strip with text bleeding out of it. The seven-glyph siblings — `FINANCE`
(F2), `MEETING` and `KITCHEN` (F1) — had the milder version of the same bug:
a 33px frame, left column gone, plate flush to the left edge.

**Design call: stack, do not shorten or widen.** The roadmap offered shorter
copy or a two-cell sign. Neither reads best here:

- A two-cell `sign_helpdesk_l/r` has nowhere to hang. The wall-decor rule is
  "wall tile with open floor south of it": `(6,1)` is the glass partition, so
  `(6,0)` cannot carry decor, and `(8–9,0)` is the ticket board. Moving the
  board and extinguisher along the wall would touch the frozen Floor 2 decor
  layout for a sign.
- Shorter copy (`SUPPORT`, `IT DESK`, `HELP`) fits a tight seven-glyph plate,
  but drops the words the zone chip (`HELP DESK`), the directory and every
  objective banner (`… · HELP DESK`) use for wayfinding.
- Stacking keeps the exact words in one cell. `sign_stacked('HELP', 'DESK')`
  is the same dark plate, ink frame and paper caps as `sign_room`, two lines
  with a two-pixel gap, frame x 5–25 and y 9–26: it hangs from the wall-cap
  line like the ticket board beside it and closes on the incident board's
  bottom line, so the help-desk wall reads as one set. Same atlas index
  `[7, 16]`, new pixels; `FLOOR_2_WALL_DECOR['7,0']` unchanged.

**Siblings.** `sign_room` now drops to one-pixel margins at seven glyphs so
the frame closes at x 0–30 (one clear column on the right — `sign_finance`
sits next to the `(19,9)` door), and raises `SystemExit` for anything that
still cannot frame, pointing at `sign_stacked`. `PEOPLE` / `PANTRY` and the
F3–5 room signs are ≤ 6 glyphs and are bit-identical. Regenerate with
`python3 scripts/gen_office_tiles.py`; `tileAtlas.ts` does not change.

**Guard.** `pass-j-visual.test.ts` decodes the sheet: complete frame on all
four sides of the stacked plaque, transparent wall everywhere outside it, two
paper-cap bands with clear margins, both frame columns on the seven-glyph
signs, and a source check that every registered `sign_room` label is ≤ 7
glyphs and the generator refuses longer ones.

### Pass J — F1–2 house-plate recast

The leftover from the visual pass above, promoted to Must by the Captain on
tip `2c4d2f0`. One scoped item: no Floor 6, Classic untouched, demo mp4 not
remuxed, no engine work.

**Before.** The seven F1–2 speakers were badged with the Classic tower's
enemy plates (`recruiter`, `overachiever`, `scrum`, `manager`, `intern`,
`boss`, `vp`). Unique from each other, yes — but Pokémon-trainer art: Renata
and Priya were drawn as grinning / shouting men while the dialogue says "she",
Holloway (also "she") was a tired man with a coffee, four of the seven were
brown-haired lookalikes, props (handset, whiteboard, coffee) crowded the badge
rim, and expressions sat at battle-taunt energy next to the calm F3–5 badge
photos. The Pass J crop nudges (`vp` x→0.685, `recruiter` x→0.47) framed the
faces better but could not fix the art.

**After.** Seven Office-only 512×512 WebPs — `renata`, `gavin`, `priya`,
`holloway`, `teddy`, `whitlock`, `kessler` — on the same
`sprites.ts` / `HEADSHOT_FOCALS` / `Headshot` contract as the F3–5 named
plates. Same roster style (cel-shaded, crisp ink, one shading step, white
ground, full body so Office battle shows the same figure). Each figure stands
centred, badge-photo calm, and carries the walk sheet's identity: Renata wavy
brown hair / navy blazer / khakis / handset; Gavin slick near-black hair /
navy suit / gold pin / papers; Priya spiky brown pixie / brown blazer /
sky-blue shirt / sticky-note badges / index cards; Holloway brown bun / grey
pantsuit / cobalt tie / coffee; Teddy messy brown hair / navy blazer / red
lanyard / chinos / sneakers / coffee; Whitlock swept white hair / black suit
/ red tie / green ledger / reading glasses; Kessler blond slicked back / navy
suit / steel tie / dark folder. Renata, Priya and Holloway are women now, as
written.

**Pipeline.** `scripts/gen_office_plates.py` is the regenerable half:
`brief` prints each speaker's commission (style anchor + character + the
identity carriers read straight from the `gen_office_actors.py` palettes, so
portrait and OverworldActor cannot disagree); `import <dir>` runs the
`import_art.py` contract (edge flood-fill background, trim, fit 512, WebP
q82); `check` verifies 512×512 RGBA, side margins, not byte-identical to any
Classic plate, and that the hair sampled at the top of the head sits within
hue / lightness tolerance of the actor palette `H`. Masters are generated
from the briefs and are not committed (same as Pass E).

**Classic.** `recruiter.webp` … `vp.webp` are bit-identical to `main`
(`pass-j-visual.test.ts` pins their sha256); Classic enemies still key them
and their `HEADSHOT_FOCALS` rows stay for Classic-side crops. Office no
longer references those keys anywhere (`SPEAKER_SPRITE`,
`OFFICE_CAST_HEADSHOTS.house`, encounter / coworker kits, `SPRITE_TO_ACTOR`).
`spriteId` is never persisted, so Office saves resume unchanged.

**Focals.** All seven sit in the named-plate band: x 0.45–0.5 (centred
figures), y 0.11–0.135 (eye line in the upper third), zoom 3.15–3.35. Renata's
wavy hair is the widest head and takes the loosest zoom; the three
slick-haired men take the tightest. The Holloway folder-text guard is retired
— the new plate has no folder.

Not touched, noted for the next pass: the F1–2 walk sheets already carried
these palettes, so no chibi retouch was needed; if a future re-commission
changes a carrier, update the `gen_office_actors.py` palette first and let
`check` catch the portrait.

### Pass J — F1–2 plate pose energy

Follow-up to the recast above, on tip `414a77c`. One scoped item across all
seven house plates: no Floor 6, Classic untouched (sha256 pins hold), no
iOS, demo mp4 not remuxed, no engine work, no walk-sheet change.

**Before.** The recast fixed identity and calm, but landed static next to
the F3–5 plates: Kessler and Whitlock arms straight down, Teddy with both
hands on the cup, Holloway holding a coffee at arm's length, Gavin a hand in
a pocket and papers flat to the chest. The F3–5 named plates read alive —
Sloane's contrapposto and clipboard, Nico's cards and pocket, Quincy's tube
under the arm, Ashford's lean, Marlowe reading the tablet — and the two rows
did not sit together on the party strip. Two of the old F1–2 props (Priya's
cards, Holloway's cup) also cut the badge rim at 64px, the same corner-clip
the Classic `recruiter` handset had.

**After.** Seven re-commissioned masters against the same style anchor, same
identity carriers, same `sprites.ts` / `HEADSHOT_FOCALS` / `Headshot`
contract. Gesture per speaker:

- **Renata** — hip cocked, hand on hip, handset hanging at thigh height with
  the mouthpiece tipped at you ("it's for you"), head tilted, one eyebrow up.
- **Gavin** — three-quarter turn, weight back, chin lifted; papers tucked
  under one arm, the other hand fastening his jacket button. Smug half smile.
- **Priya** — forward lean from the ankles, cards carried low, the other
  hand tapping her watch; sticky notes blank. Tight determined smile.
- **Holloway** — weight sunk onto one hip, shoulders sloped, cup carried at
  the waist, other hand on her hip, tie loose, eyes half-lidded.
- **Teddy** — leaning in from the ankles, heels together, cup in one hand at
  the sternum, thumb hooked under the backpack strap, eyebrows up, closed
  hopeful smile (no open mouth, no stride).
- **Whitlock** — leaning back a touch, green ledger open at chest height,
  pen mid-note, looking at you over the top of his reading glasses.
- **Kessler** — planted, chin raised, folder under one arm, wrist turned up
  checking his watch: the meeting started without you.

Faces stay badge-photo calm — closed mouths, no shouting, no thrash — so the
dialogue crops read the same as F3–5.

**Crop contract.** The brief now carries a shared pose contract
(`POSE_ANCHOR` in `gen_office_plates.py`): hands and props stay below the
shoulder line, so the top third of every figure is head / neck / shoulders
only. At 40–64px every badge shows a clean face with no prop touching the
rim; the props are all in the full figure the Office battle shows. Focals
moved only where a head moved: Renata `x 0.45→0.49, y 0.135→0.14` (hip cock
shifts her head right), Priya `x 0.49→0.505, y 0.135→0.14`, Teddy
`x 0.5→0.47` (he leans in from the left). All seven stay in the named-plate
band (x 0.47–0.505, y 0.11–0.14, zoom 3.15–3.35); `pass-j-visual.test.ts`
pins Renata and Kessler.

**Pipeline.** `brief` prints the pose contract + gesture under the character
line; `check` is unchanged and passes for all seven (hair carriers still
match the walk-sheet palettes, so no chibi retouch). One master (Priya) had
a scribble on a sticky note flat-filled before import; otherwise the masters
are as generated and, as before, not committed.

### Pass J — welcome: Office-first

Title hierarchy on tip `5dde97d`. Scope is the welcome stack and its copy;
no Floor 6, no engine work, Classic still one tap away.

- **Hero.** THE OFFICE takes the treatment START CLIMB had: gold `primary`
  / `lg`, 250px minimum, one soft gold glow (`.hero` in
  `TitleScreen.module.css`), `CAMPAIGN · FLOORS 1–5` eyebrow in gold above
  it, campaign summary line below it when a save exists. Label stays
  `THE OFFICE` (e2e / demo contract).
- **Classic.** `CLASSIC · 30 FLOORS` eyebrow over a blue `secondary` / `md`
  `START CLIMB`; with a Classic save it becomes `CONTINUE` (secondary) +
  `NEW CLIMB` (ghost) on one row. The erase confirm now says "Classic" so
  nobody thinks it touches the campaign.
- **Daily + Codex** share one row under Classic. The floating "Type
  matchups, expense reports…" chip is removed — at 760 design height it sat
  on top of the CTA stack and pushed CODEX behind the skyline.
- **Copy nudge.** Tagline `RECEPTION TO THE BOARD. FIVE FLOORS. ONE BADGE
SWIPE FROM GLORY.`; lede `Pick a role, work the floor, build your team,
and out-battle every manager between you and the board.` Wordmark,
  `Q4 LADDER SIMULATION` kicker, and the FLOOR 30 / Konami sign are untouched.
- **Short stages.** `@container stage (max-height: 820px)` tightens gaps,
  drops the wordmark to 38px and the cast to 72/80px so the whole stack fits
  the 440×760 playtest viewport with both saves present.

### Pass J — welcome: Meng polish

Title composition on tip `68b5b72`, after the Captain's desktop shot read as
"not high quality enough": a floating type stack in a void, 70px plates under
polished chrome, flat buttons, pixel ↔ UI mismatch. Scope is the welcome
only — no Floor 6, no iOS, no engine work, Classic one tap away, demo mp4
not remuxed (that lane followed: "Pass J — demo remux: Meng title" below).
Labels and e2e selectors are unchanged.

- **Type.** Kicker between two gold hairlines; brushed-paper wordmark with a
  gold under-glow — one line at 60px on the 840 desktop canvas, two lines on
  the phone (50 / 56 tall / 42 compact); tagline in gold-bright so the copy
  carries one accent; lede on a 560px measure at `body-lg` on desktop.
- **Plates.** The three lead roles stand in glass badge frames (same
  `--cc-glass` / hairline / plate-shadow language as the Office role cards)
  with a type-coloured top rail, a light pool at the feet and a role
  caption. The frame is square and the figure is 34% taller than it, so
  head and shoulders rise past the rail: 124 / 138px desktop, 100 / 112
  phone, 90 / 100 compact. A lit lobby floor line runs under the row.
- **Deck.** THE OFFICE, Classic, Daily + Codex and the career strip share
  one glass directory panel with a gold top rule and ruled eyebrows. The
  hero is brushed gold with a lit top edge and a slow breathing glow (off
  under reduce-motion); Classic and Daily get the same lit edge one step
  down. Hero is full deck width; START CLIMB solo is 72% so the e2e
  hierarchy guard (`officeBox.width > classicBox.width`) still holds.
- **Field.** Two-row skyline (far row dim, near row lit) on a taller haze,
  full width on desktop; warm key pool behind the wordmark, cool city glow
  at the bottom corners; the elevator shaft is masked to fade out above the
  deck instead of cutting through the CTAs; faint neighbour shafts at
  18% / 82% on the wide canvas.
- **Budgets.** Every 16:9 desktop is the short stage (840 × 760), so it
  spends sideways; `@container stage (max-height: 820px)` covers it and the
  440×760 playtest viewport, `(min-height: 940px) and (max-width: 699px)`
  covers tall phones. With both saves and the career strip present the deck
  bottoms out at 745 / 815 (440×760) and 720 / 760 (1080p).

All backdrop decoration moved from inline styles into
`TitleScreen.module.css`; the skyline, cast and celebration are module
classes now.

### Pass J — demo remux

`public/demos/office-demo.mp4` re-recorded on tip `aa89d23` through
`npm run demo:office` (the `#96` capture predated every Pass J visual).
Same mux: Playwright video is silent, so the script lays the live Office
beds and cab / stamp / hit stingers at the scene marks. ~100 s at 1280×720.

- **Welcome** now opens on the Office-first stack — gold THE OFFICE hero,
  `CAMPAIGN · FLOORS 1–5` eyebrow, blue Classic secondary — instead of the
  old START CLIMB hero.
- **F1** Renata and Gavin speak through the `#107` / `#111` recast plates
  (spar included), so the trailer carries the pose-energy portraits.
- **F2** gets a real beat: the old walk pressed arrows into Teddy's
  first-step callout and stood at `(3,3)`. Now it lets the callout read,
  walks the glass at `(6,3)` to `(8,3)` under the stacked HELP / DESK sign
  (`#110`), and opens Teddy's transfer-packet dialogue. New `helpdesk` mark;
  the Ops bed just runs longer.
- End card reads `Pass J · tip`. F3 / F4 / F5 peeks and THE CLIMB are
  unchanged. No Floor 6; Classic stays out of the trailer.

### Pass J — demo remux: Meng title

`public/demos/office-demo.mp4` re-recorded again on tip `e562dc1` (`#118`
Meng welcome polish) through the same `npm run demo:office` pipeline; the
`#113` capture predated the 840 canvas (`#116` / `#117`) and the Meng
title. Same mux — silent Playwright video, live beds and stingers at the
scene marks. ~102 s at 1280×720; no hand-edited bytes.

- **Welcome** now shows the Meng composition: kicker between gold
  hairlines, one-line brushed-paper wordmark with the gold under-glow, the
  three glass cast plates with heads past the rail, THE OFFICE as a brushed
  gold hero inside the glass directory panel, two-row skyline running the
  full width. The dwell grows from 2.0 s to 3.6 s so the hero glow breathes
  one full cycle before the cut.
- **Desktop theater.** The trailer's 1280×720 viewport is desktop-class
  (`DESKTOP_MIN_WIDTH` 1024), so every beat records on the
  `DESKTOP_DESIGN_WIDTH` 840 canvas at 0.95× inside the theater frame —
  wordmark spine on the left, keyboard legend on the right, the full 24-tile
  Office floor on F1–F5, the four-move battle deck in one row. No viewport
  change was needed; the script only documents it. The phone canvas (472)
  is untouched and is not what the trailer records.
- End card still reads `Pass J · tip`. F1 spar, F2 HELP / DESK walk, F3–5
  peeks and THE CLIMB carry over from `#113`. No Floor 6; Classic stays
  out of the trailer (visible only as the blue secondary on the title).
- Marks (body offset by the 3.2 s title card): welcome 3.2–7.3 s · floor1
  12.7 s · combat 40.3 s · cab 49.9 s · FLOOR 1 CLEARED 52.5 s · floor2
  56.0 s · helpdesk 61.0 s · floor3 66.7 s · floor4 75.6 s · exec 84.4 s ·
  THE CLIMB 95.0 s · end card 99.5–102.5 s.

### Pass J — battle: larger desktop combat sprites

Combat arena fidelity on tip `d20d4c2`, the Meng move queued behind the
Title polish. Scope is the shared `BattleScreen` presentation (Office and
Classic both mount it): no Floor 6, no iOS, no engine work, Classic content
untouched, demo mp4 not remuxed (that lane followed: "Pass J — demo remux:
battle sprites" below).

**Before.** `#116` / `#117` gave the 840 desktop canvas a theater frame and
a 4-move hotbar, and the battlefield stretched to an 816 × ~490 arena (the
stage height clamps at 760 on every 16:9 desktop) — but the combatants were
hardcoded at the phone 164 / 154, hugging the arena edges. Under the polished
chrome they read as chibi, the same class of problem the Title plates had.
Damage numbers were fixed battlefield px tuned for the 456-wide phone arena,
so on desktop the enemy's numbers spawned ~350px left of the enemy and the
player's floated near the top of the arena on every canvas.

**After.**

- **Sizes.** `@container stage (min-width: 700px)` sets `--staged-size` to
  236px on the enemy stand and 224px on the player (from 164 / 154 —
  ~+44%). Fixed px, not a percentage, so the art never lands on a
  fractional scale; at 1080p (1.42×) that is ~335 / 318 real px, still
  downscaled from the 512 masters. The phone canvas keeps the `size` props
  bit-for-bit: `e2e/battle-arena.spec.ts` pins the 390×844 stand boxes
  (`291,33 → 455,204` and `21,448 → 175,608`).
- **Composition.** Enemy up-right at `top: 44px / right: 40px`, player
  down-left at `bottom: 14px / left: 40px` — opposite corners with the
  far / near perspective the phone already had. The enemy's head starts
  below the floor counter and the SOUND / SET chrome; neither stand touches
  the dossier or the resource panel (the e2e asserts all four). The player
  stands on the floor band in both Office and Classic rooms.
- **`StagedSprite` is CSS-sized.** The `size` prop becomes
  `--staged-size-default`; an ancestor may set `--staged-size` inside a
  container query and the ring / shadow follow through `--staged-ring-w`.
  `PixelSprite` accepts a CSS length (`'100%'`) so the staged image fills
  the stand. FloorIntro / class select render identically (212 → ring 174 /
  shadow 200, the old JS math).
- **Popups land on the sprite.** `DamagePopup` carries `target`, and `x` /
  `y` are percentages of that stand; `BattleScreen` mounts each number
  inside its stand. Enemy numbers spill left from the chest (`x −20…10%`,
  `y 22…40%`), player numbers right from the upper body (`55…85%`,
  `12…30%`). Jitter is presentation-only (`popupAnchor(target, rand)`), so
  seeded runs are untouched.

Guards: `src/__tests__/battle-arena.test.ts` (props, wide-block sizes,
stand positions, StagedSprite var wiring, popup anchors) and
`e2e/battle-arena.spec.ts` (1920×1080 Classic + Office, 390×844 Classic).

### Pass J — demo remux: battle sprites

`public/demos/office-demo.mp4` re-recorded on tip `71e5cc9` (`#120` larger
desktop combat sprites) through the same `npm run demo:office` pipeline;
the `#119` capture predated the arena-scale stands. Same mux — silent
Playwright video, live beds and stingers at the scene marks, Floor 1 bed
ducked to 22% across the spar. ~102 s at 1280×720; no hand-edited bytes.
Product code untouched: demo script, mp4 and docs only.

- **Combat** now records the wide-stage arena: Gavin on the 236 enemy
  stand up-right under the floor counter, the Senior Engineer on the 224
  player stand down-left on the floor band, both clear of the dossier and
  the resource panel. The spar is a one-shot (Lv18 vs 70 HP), so the
  script's pre-move dwell grows from 1.1 s to 1.9 s to let the stands read
  before the hit; the `-204 NICE HIT` number then lands beside Gavin's
  chest on his own stand (the `#120` %-anchored popup) instead of the old
  phone-px spot 350px left of him. CLEARED stamp and File it follow.
- **Kept from `#119`.** Meng welcome (kicker hairlines, one-line brushed
  wordmark, glass cast plates, gold THE OFFICE in the directory panel,
  two-row skyline) and the desktop theater / 840 canvas on every beat —
  the 1280×720 viewport is already desktop-class, no viewport change.
- End card still reads `Pass J · tip`. Office-first welcome, F1 Renata /
  Gavin on the recast plates, F2 HELP / DESK glass walk to Teddy, F3–5
  peeks and THE CLIMB carry over. No Floor 6; Classic never entered
  (blue secondary on the title only).
- Marks (body offset by the 3.2 s title card): welcome 3.2–7.1 s · floor1
  12.3 s · combat 39.7 s · hit lands ~41.6–42.4 s · CLEARED 44.5 s · cab
  50.6 s · FLOOR 1 CLEARED 53.2 s · floor2 56.7 s · helpdesk 61.6 s ·
  floor3 67.2 s · floor4 75.8 s · exec 84.4 s · THE CLIMB 94.8 s · end card
  99.2–102.2 s.

## Still Fable's (do not treat this PR as §14 done)

#67 and this follow-up raise the presentation floor. They do **not** clear
Fable's ownership table:

- §14 asset sign-off. Character walk sheets and the Floor 1 tileset / props
  are now hand-authored pixel art (see "Sprite art" and "Environment art"
  above); hardware still confirms them on a real phone.
- Full §12 feedback matrix and coach-mark motion — **presentation shipped**
  (Pass E audio, Pass F coaches, `useOfficeFeedback`). Hardware CoS still
  walks the matrix with sound on.
- §13 fade/duck timings — **presentation shipped** (scene veils, cab plan,
  combat duck). Hardware CoS still confirms no hard cuts.
- §19 device sign-off (task-8 playtest) — **presentation evidence** is in
  `src/screens/office/presentation.ts`. CoS still signs the live device
  checklist; that is the merge gate, not a missing code surface.

Astra still does not own merge, deploy, or rewriting frozen IDs.
