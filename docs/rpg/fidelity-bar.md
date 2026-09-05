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
keyed on tile change. A 12px `Headshot` badge stays pinned to the sprite so
the map face matches dialogue. Recruits still do not follow.

Sheets (128×160 RGBA, 4×4, frame 32×40):

- `lead_eng`, `lead_design`, `lead_pm` — chosen class
- `renata`, `gavin`, `priya`, `holloway` — floor NPCs

Regenerate with `python3 scripts/gen_office_actors.py` (Pillow). Palettes track
the existing 512px portraits. These sheets are **generated stand-ins**, not
ship-quality art.

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

- Ship-quality tileset and character art (`mvp-design.md` §14) — these sheets
  are generated pixel stand-ins
- Full §12 feedback matrix and coach-mark motion
- §13 fade/duck timings
- §19 device sign-off (task-8 playtest)

Astra still does not own merge, deploy, or rewriting frozen IDs.
