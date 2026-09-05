# Floors 3–5 — content contract for Fable

Astra shipped walkable stub maps so the 5-floor elevator works. Fable replaces
art, copy, NPCs and props **without changing engine keys**. Frozen Floor 1 / 2
ids and maps stay put.

**Status:** Floors 3–5 maps now live in `floor3.ts` / `floor4.ts` / `floor5.ts`
and are keyed under `floor_0N` in `map.ts`. `floorStubs.ts` stays for
`STUB_BOARDING`, `STUB_DIRECTORY_TEXT`, and engine tests. `isStubFloor` is still
true for 03/04/05 (assignment reducers have not landed).

## File layout

| What                         | Where                                                                      |
| ---------------------------- | -------------------------------------------------------------------------- |
| Floor id union               | `src/content/office/ids.ts` — already `floor_01`…`floor_05`                |
| Stub art / solids / arrival  | `src/content/office/floorStubs.ts`                                         |
| Per-floor lookup             | `src/content/office/map.ts` (`FLOOR_ART_BY_ID`, spots, zones, NPCs)        |
| Elevator rows / names        | `src/content/office/elevator.ts` (`ELEVATOR_FLOORS`)                       |
| Dialogue / encounters / POIs | `src/content/office/dialogue.ts`, `encounters.ts`, `pois.ts`               |
| Tileset + atlas              | `scripts/gen_office_tiles.py` → `public/office/tiles.png` + `tileAtlas.ts` |
| Actor sheets                 | `public/office/actors/` (same rig as Floors 1–2)                           |

Prefer one content module per floor (`floor3.ts`, `floor4.ts`, `floor5.ts`)
keyed under `floor_0N` in `map.ts`, matching `floor2.ts`. Do not edit Floor 1
exports used by frozen tests.

## Shaft (do not move)

Same three tiles on every floor:

- Doors `E` at `(2,1)` and `(3,1)`
- Reader `R` at `(4,1)`
- Arrival `(3,2)` facing south (`@` in the art string, rendered as floor)
- Boarding: `(2,2)` and `(3,2)` facing north

Map frame stays **24×18**. `#` is wall. `@` is never a prop.

## Id prefixes

| Kind             | Prefix             | Example                               |
| ---------------- | ------------------ | ------------------------------------- |
| Floor            | `floor_0N`         | `floor_03`                            |
| Zone             | `zone_*`           | `zone_landing` (reuse) or `zone_*_f3` |
| NPC              | `npc_*`            | `npc_floor3_…`                        |
| Encounter        | `enc_*`            | `enc_floor3_…`                        |
| Coworker         | `cw_*`             | only if the floor hires               |
| Assignment       | `asg_*`            | `asg_floor3_…`                        |
| Key item         | `key_*`            | never bag items                       |
| POI              | `poi_*`            | `poi_*_f3`                            |
| Trigger          | `trg_*`            | `trg_first_step_f3`                   |
| Reward / receipt | `rwd_*` / `rcpt_*` | floor ledger rows                     |
| Dialogue         | `dlg_*`            | `dlg_<speaker>_…`                     |
| Flag             | `flag_*`           | `flag_visited_f3`                     |

Do not reuse Floor 1 / 2 frozen ids. Additive only.

## Props Fable must fill

For each floor, replace the stub’s empty hall with:

1. **Art string** (18 rows × 24 glyphs) plus `SOLID_GLYPHS`
2. **Zones** (`zoneAt`, labels, optional accents / floor cells)
3. **NPC tiles + sightlines + interact spots** (every NPC / POI needs a faced spot unless it is a step-on door)
4. **Directory copy** (panel name in `ELEVATOR_FLOORS` + `STUB_DIRECTORY_TEXT` replacement)
5. **POI inspect lines** in `pois.ts`
6. **Tileset cells** for new glyphs, registered in the atlas
7. **Optional:** encounters, dialogue, assignments, rewards — tables only; Astra wires the reducer if a fight / recruit / key is required

Those tables have landed. Stubs remain walkable as a fallback export; the
elevator still arrives on the shared shaft, and each floor's directory copy
replaces `STUB_DIRECTORY_TEXT` in the panel.

## Gates

- Floor 2: `key_access_badge` (Holloway)
- Floors 3–5: `key_employee_badge` (badge printer on Floor 2, not the Kessler win)
- If a later floor needs a new key, add a row `requires` on `ELEVATOR_FLOORS` and a `key_*` id. Do not invent a second elevator.

## Engine promises (Astra)

- `dispatchOfficeAction` + `RIDE_ELEVATOR { to }` / `COMPLETE_ELEVATOR_RIDE`
- Phase 2 for encounters that declare `phase2` (Kessler already does)
- Roster: `hired` + `bench` + dismiss / rejoin
- Save v2 migration

Classic tower and PersonalSite stay untouched.
