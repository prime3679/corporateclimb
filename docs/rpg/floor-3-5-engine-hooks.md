# Floors 3–5 — engine hooks for Astra

_Short note to go with `docs/rpg/floor-3-5-design.md`. Fable owns the design,
copy, IDs and art; Astra owns the engine work below. Nothing here needs a
second combat engine, a second perk pool, or a Classic change. Frozen names
are in the design doc §8 and in `src/content/office/floor3.ts` /
`floor4.ts` / `floor5.ts`; if a name here disagrees with those, those win._

## 0. Where this branch stands

`cursor/office-floors-3-5-design-f696` sits on `feat/office-floor-2-design`
(`#72`). Already wired, under the frozen ids:

- **Content**: `FloorId` includes `floor_03` / `floor_04` / `floor_05`; zones,
  NPCs, encounters, assignments, key items, POIs, triggers, rewards, receipts,
  flags and dialogue ids in `ids.ts`; every node in `dialogue.ts`;
  `OFFICE_ENCOUNTERS` + `RECEIPTS` + `REWARD_*` rows (Caldwell's `phase2` is
  present but inert until Floor 2 hooks §5 lands); `floor3.ts` / `floor4.ts` /
  `floor5.ts` keyed under those ids in `map.ts`.
- **Renderer**: `tiles.tsx` draws the three maps (floors, rugs, decor, the four
  new props, reused take-five / desks / meeting table). Actor sheets and
  `NPC_ACTOR` entries exist. Dialogue / party cards reuse house portraits via
  new `spriteId` keys.
- **Reducer**: first-state talk lines resolve so a debug `floorId` can walk
  and talk. Assignment state machines, sightline first-steps, badges, panel
  rows and celebrations are **not** wired.

`elevatorDestination` still toggles Floor 1 ↔ Floor 2. Do not change that
toggle until the panel exists — Floor 1/2 tests depend on it.

## 1. Elevator panel (completes Floor 2 hooks §2)

```
ELEVATOR_FLOORS = [
  { id: 'floor_05', number: 5, name: 'EXEC',       requires: 'key_client_badge' },
  { id: 'floor_04', number: 4, name: 'SALES',      requires: 'key_product_badge' },
  { id: 'floor_03', number: 3, name: 'PRODUCT',    requires: 'key_employee_badge' },
  { id: 'floor_02', number: 2, name: 'OPERATIONS', requires: 'key_access_badge' },
  { id: 'floor_01', number: 1, name: 'YOUR TEAM',  requires: null },
]
```

`act_ride(to)` sets `floorId`, `player = elevatorArrivalForFloor(to)` (always
`(3,2)` south), saves. Missing key keeps the panel open and beeps. After
Caldwell, the Floor 5 row rides to `screen_floor5_complete`, not a sixth floor.

Content already exports `ELEVATOR_PANEL` from `src/content/office/map.ts`.

## 2. Assignment reducers

Mirror Teddy's packet. First-step flags: `flag_visited_f3` / `_f4` / `_f5`.

| Floor | Talk starts            | Fetch                                      | Deliver                         | Complete receipt              |
| ----- | ---------------------- | ------------------------------------------ | ------------------------------- | ----------------------------- |
| 3     | `dlg_sloane_brief`     | `poi_roadmap_wall` → `key_roadmap_card`    | Nico / `poi_intake_board`       | `rcpt_roadmap_initialled` +14 |
| 4     | `dlg_harper_brief`     | `poi_pipeline_board` **or** `poi_leavebehind` → `key_leavebehind` (once) | Reyes                  | `rcpt_leavebehind_delivered` +16 |
| 5     | `dlg_marlowe_brief`    | `poi_sideboard` → `key_board_packet`       | Marlowe                         | `rcpt_board_packet_filed` +18 |

Boss talk is `early` until the assignment is `complete`, then the review node
and a stakes card. Loss → `(5,12)` facing north on that floor.

## 3. Badges

Grant on the boss receipt, not a printer:

- Quincy won → `key_product_badge` + `rcpt_product_badge` + `flag_floor3_complete`
- Ashford won → `key_client_badge` + `rcpt_client_badge` + `flag_floor4_complete`
- Caldwell won → `rcpt_the_climb` + `flag_floor5_complete` (no further badge)

Reader green on floor N when that floor's outbound badge is held (Floor 3:
product; Floor 4: client; Floor 5: climb complete).

## 4. Save

Add the three assignment keys, three encounter keys and six flags to the
existing office save (v2 if Floor 2's migration has landed; otherwise default
them in `fromOfficeSave` the way Floor 2 keys already default). Classic
`corporate-climb-save` is never read or written.

`isKnownFloorId` already accepts 3–5. `loadOfficeSave` will resume a debug
save parked on those floors.

## 5. Objectives

`currentObjective` should evaluate Floor 5 chain → Floor 4 → Floor 3 → Floor 2
→ Floor 1. Copy is the banners in the design doc §§2.4, 3.4, 4.4. Cross-floor
pins sit on the current floor's elevator doors, same as Floor 2.

## 6. Tests to add

- A required-route reducer trace per floor (design §§2.4 / 3.4 / 4.4 as
  `dispatchOfficeAction` scripts).
- Panel ride 2 → 3 → 4 → 5 → celebration, and backtracking 5 → 1.
- Caldwell phase 2 at ≤ 130, Classic `simulation.test.ts` still bit-identical.
- Paper-playtest (`floors-3-5-map.test.ts`) is already on this branch — keep it
  green when moving furniture.

## 7. Do not

- Rename or move any Floor 1 / Floor 2 frozen id.
- Add a sixth floor, a fourth party seat, or a new combat resolver.
- Treat the house-portrait stand-ins as final Headshot art (Fable's next
  portrait pass).
