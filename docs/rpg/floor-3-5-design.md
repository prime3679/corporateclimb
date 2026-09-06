# The Office — Floors 3–5 (Design)

_Status: design freeze for the three department floors that close a **5-floor** Office
RPG. Owner: Fable (experience, content, wording, pacing, art). Implementation of
play — elevator panel, assignment reducers, boss doors, save keys — is Astra
(`docs/rpg/floor-3-5-engine-hooks.md`). Everything marked **FROZEN** is an ID or
value code will be written against. Floor 1 (`docs/rpg/mvp-design.md`) and Floor 2
(`docs/rpg/floor-2-design.md`) stay untouched: no Floor 1/2 frozen ID is renamed._

Companion reading: `docs/rpg/architecture.md` (Astra/Fable split),
`docs/rpg/fidelity-bar.md` (the art pipeline this extends),
`src/content/office/floor3.ts` / `floor4.ts` / `floor5.ts` (the frozen maps as
tables, checked by `src/__tests__/office/floors-3-5-map.test.ts`).

Adrian locked five floors, not ten. Floor 3–5 are **tighter department floors** —
same 24×18 frame and elevator shaft as 1 and 2, fewer rooms, **2–3 NPCs, one
assignment, one encounter** (the floor boss). They are not a second Operations.

---

## 0. The climb

| Floor | Department             | Assignment                | Encounter (boss)   | Badge out                |
| ----- | ---------------------- | ------------------------- | ------------------ | ------------------------ |
| 1     | Your Team              | Printer ticket            | Holloway           | `key_access_badge`       |
| 2     | Operations             | Transfer packet           | Kessler            | `key_employee_badge`     |
| 3     | **Product / Strategy** | Q4 card + Nico's initials | Quincy             | `key_product_badge`      |
| 4     | **Sales / Client**     | Leave-behind + Reyes      | Ashford            | `key_client_badge`       |
| 5     | **Exec / the climb**   | Board packet              | Caldwell (phase 2) | the building. No Floor 6 |

Loop inherited wholesale: explore → activity → battle → badge → elevator. The
elevator is one shaft: `E` at `(2,1)`/`(3,1)`, reader `R` at `(4,1)`, arrival
`(3,2)` facing south on every floor. Backtracking is always allowed. New floors
are gated by the previous floor's badge.

### Locked defaults (additions only)

| Default              | Answer                                                                                        |
| -------------------- | --------------------------------------------------------------------------------------------- |
| Map size             | **24×18**, same shaft, same camera. Justified in Floor 2 §1.6                                 |
| Party of 3           | Unchanged. Floors 3–5 do **not** add a recruit (the roster already has Gavin / Priya / Teddy) |
| One combat engine    | Caldwell's phase 2 uses the same `phase2` path Floor 2 asked Astra to un-gate                 |
| Currency             | Stock Options. Ledgers: Floor 3 max **54**, Floor 4 max **64**, Floor 5 max **78**            |
| Recruits at desks    | Unchanged. No new `cw_*`                                                                      |
| No random encounters | Unchanged. Sightlines = talk                                                                  |
| Floor 1 and 2 IDs    | Untouched                                                                                     |
| Polish               | Same §10–§14 bar. No prototype tiles, no rectangle actors                                     |
| Badges               | Granted on the boss **receipt**, not a second printer walk — these floors are tighter         |

---

## 1. Shared floor plate

Floors 3–5 share a plate so the building reads as one place. Landing, hall,
take-five (coffee / table / sofa / vending) and the south door sit on the same
tiles every time. Departments dress the two north rooms and the south floor.

```
         x → 0         1         2
           012345678901234567890123
    y  0   ########################
       1   #.EER.#  NORTH A  # B  #      LANDING | dept room A | dept room B
       2   #..@..#           #    #
       3   #.....D           D    #      ← glass at (6,3) and (14,3)
       4   #...i.#           #    #
       5   #p...p#p         p#p   #
       6   ###D########D#####D#####      ← (3,6) landing · (12,6) A · (18,6) B
       7   #......................#      HALL (navy runner on row 8)
       8   #.....................w#
       9   #########D##############      ← (9,9) into the south floor
      10   #......................#      SOUTH FLOOR (boss + take-five)
      11   #..SKKK................#      coffee always at (3–6,11)
      12   #......................#
      13   #..tt..................#
      14   #......................#
      15   #..............LL......#
      16   #p............p.......V#
      17   ########################
```

Arrival `(3,2)` south. Defeat respawn `(5,12)` north (looking at the machine).
Elevator boarding `(2,2)`/`(3,2)` facing north, same as 1 and 2.

Floor 5 drops the A/B split (the antechamber is one waiting room) and keeps the
landing door + the south door.

---

## 2. Floor 3 — Product / Strategy — **FROZEN**

### Pitch

Product owns the roadmap and says later. Sloane, staff PM, has a Q4 card stuck
on the war-room wall that Legal will not look at until Research initials it.
Nico has been sitting on the findings since the last re-org. File the initials,
then Quincy — VP of Product — does a prioritization review. Quincy does not
ship. Quincy sequences.

### 2.1 Map

```
           012345678901234567890123
    y  0   ########################
       1   #.EER.#.===..W#..f.....#      LANDING | WAR ROOM        | INTAKE
       2   #..@..#.ccc...#........#
       3   #.....D...8...D....9...#      8 Sloane · 9 Nico · W roadmap · N board
       4   #...i.#.......#....N...#
       5   #p...p#p.....p#p.......#
       6   ###D########D#####D#####
       7   #......................#
       8   #.....................w#
       9   #########D##############
      10   #......................#      PRODUCT
      11   #..SKKK..........ydd...#      y Quincy · dd walnut desk
      12   #...............c......#
      13   #..tt..........c.......#
      14   #......................#
      15   #..............LL......#
      16   #p............p.......V#
      17   ########################
```

Solid set: `# E R i p w = c K V t S L d f W N 8 9 y`. Walkable: `.` `D` `@`.

### 2.2 Zones

| Zone id        | Interior        | Label    | Accent    | Floor cell       |
| -------------- | --------------- | -------- | --------- | ---------------- |
| `zone_landing` | x1–5, y1–5      | LANDING  | `#e0844d` | `floor_elevator` |
| `zone_war`     | x7–13, y1–5     | WAR ROOM | `#c47a3a` | `floor_war`      |
| `zone_intake`  | x15–22, y1–5    | INTAKE   | `#8a6bb8` | `floor_intake`   |
| `zone_hall_f3` | y7–8 + doorways | HALL     | `#8b98a8` | `floor_hall`     |
| `zone_product` | x1–22, y10–16   | PRODUCT  | `#5a6a9a` | `floor_product`  |

Rugs: red `(2–4, 2–3)`, navy runner row 8 `x1–21`, gold under Quincy `(16–20, 11–13)`.

### 2.3 Cast

| NPC id           | Glyph | Tile      | Face | Sightline                 | Name   | Role          |
| ---------------- | ----- | --------- | ---- | ------------------------- | ------ | ------------- |
| `npc_staff_pm`   | `8`   | `(10,3)`  | s    | `(10,4) (10,5)`           | Sloane | Staff PM      |
| `npc_researcher` | `9`   | `(19,3)`  | w    | `(18,3) (17,3) (16,3)`    | Nico   | Research      |
| `npc_vp_product` | `y`   | `(17,11)` | w    | `(16,11) (15,11) (14,11)` | Quincy | VP of Product |

Sloane's sightline stops at the war-room south wall. Nico's covers the intake
door. Quincy's covers the approach across the product floor.

### 2.4 Assignment `asg_roadmap`

`not_started → accepted → card_held → initialled → complete`

1. First step on Floor 3 → `dlg_sloane_callout` (across the glass, no portrait).
2. Talk Sloane → `dlg_sloane_brief` → `accepted`. Pull the Q4 card off the
   war-room wall (`poi_roadmap_wall`, `W` at `(13,1)`).
3. Card granted once (`key_roadmap_card`). Objective: **Get Nico's initials → INTAKE**.
4. Talk Nico / file the intake board (`poi_intake_board`, `N` at `(19,4)`) →
   `initialled`, `key_research_sticky` (the initials). Receipt
   `ROADMAP — INITIALLED` (`rwd_asg_roadmap` +14).
5. Sloane `after`. Banner: **See Quincy → PRODUCT**.

Optional colour only: filing cabinets and the directory. No second errand.

### 2.5 Encounter `enc_vp_product` — Quincy

Rank 6. HP 195, ATK 18, DEF 13. Types `strategy` / `influence`. XP 57, Options 40.
Not declinable. No recruit. Title card `PRIORITIZATION REVIEW` / `WE'RE SEQUENCING`.
Moves: Icebox (strategy, micromanaged 0.4), Scope Cut (strategy), Parking Lot
(influence, heal 14). Defeat: "Quincy moves you to Now. The column had been empty
since April."

Early (assignment not complete): `dlg_quincy_early`. Ready: `dlg_quincy_review`.

---

## 3. Floor 4 — Sales / Client — **FROZEN**

### Pitch

Sales owns the number and says this quarter. Harper, account exec, has a
leave-behind that is theoretically in the pipeline room and actually in a stack
Reyes (client success) was supposed to reprint. Close the loop, then Ashford —
VP of Sales — does The Close. Ashford does not lose. Ashford reframes.

### 3.1 Map

```
           012345678901234567890123
    y  0   ########################
       1   #.EER.#.===..C#........#      LANDING | PIPELINE       | CLIENT
       2   #..@..#.ccc...#........#
       3   #.....D...5...D....6...#      5 Harper · 6 Reyes · C board · H stand
       4   #...i.#.......#....H...#
       5   #p...p#p.....p#p.......#
       6   ###D########D#####D#####
       7   #......................#
       8   #.....................w#
       9   #########D##############
      10   #......................#      SALES
      11   #..SKKK..........7dd...#      7 Ashford
      12   #...............c......#
      13   #..tt..........c.......#
      14   #......................#
      15   #..............LL......#
      16   #p............p.......V#
      17   ########################
```

Solid set: `# E R i p w = c K V t S L d C H 5 6 7`. `H` reuses Floor 1's
handout-rack cell (the leave-behind stand).

### 3.2 Zones

| Zone id         | Interior        | Label    | Accent    | Floor cell       |
| --------------- | --------------- | -------- | --------- | ---------------- |
| `zone_landing`  | x1–5, y1–5      | LANDING  | `#e0844d` | `floor_elevator` |
| `zone_pipeline` | x7–13, y1–5     | PIPELINE | `#d45a3a` | `floor_pipeline` |
| `zone_client`   | x15–22, y1–5    | CLIENT   | `#c4a05a` | `floor_client`   |
| `zone_hall_f4`  | y7–8 + doorways | HALL     | `#8b98a8` | `floor_hall`     |
| `zone_sales`    | x1–22, y10–16   | SALES    | `#8a3a4a` | `floor_product`  |

`floor_product` is reused on purpose: the south plate is the building's, dressed
with sales signage. Rugs: red elevator, navy hall, gold under Ashford
`(16–20, 11–13)`.

### 3.3 Cast

| NPC id               | Glyph | Tile      | Face | Sightline                 | Name    | Role           |
| -------------------- | ----- | --------- | ---- | ------------------------- | ------- | -------------- |
| `npc_account_exec`   | `5`   | `(10,3)`  | s    | `(10,4) (10,5)`           | Harper  | Account Exec   |
| `npc_client_success` | `6`   | `(19,3)`  | w    | `(18,3) (17,3) (16,3)`    | Reyes   | Client Success |
| `npc_vp_sales`       | `7`   | `(17,11)` | w    | `(16,11) (15,11) (14,11)` | Ashford | VP of Sales    |

### 3.4 Assignment `asg_leavebehind`

`not_started → accepted → deck_held → delivered → complete`

1. First step → `dlg_harper_callout`.
2. Talk Harper → `accepted`. Pull the leave-behind from the pipeline board
   (`poi_pipeline_board`, `C` at `(13,1)`) **or** the stand (`poi_leavebehind`,
   `H` at `(19,4)` — same item, two faces, granted once).
3. `key_leavebehind`. Objective: **Walk it over to Reyes → CLIENT**.
4. Talk Reyes → `delivered` → receipt `LEAVE-BEHIND — DELIVERED` (`rwd_asg_leavebehind` +16).
5. Banner: **See Ashford → SALES**.

### 3.5 Encounter `enc_vp_sales` — Ashford

Rank 7. HP 220, ATK 20, DEF 14. Types `influence` / `execution`. XP 64, Options 48.
Not declinable. Title card `THE CLOSE` / `THIS QUARTER`. Moves: Discount
(influence), Verbal Agreement (influence, demoralized 0.4), Upsell (execution).
Defeat: "Ashford puts the flute down. It was empty the whole time."

---

## 4. Floor 5 — Exec — **FROZEN**

### Pitch

The top floor is a waiting room and a boardroom. Marlowe, the EA, will not put
you on the calendar without the board packet — it is on the sideboard, because
that is where board packets live. Caldwell, the CEO, reviews the climb. Halfway
through he takes it offline. There is no Floor 6.

### 4.1 Map

```
           012345678901234567890123
    y  0   ########################
       1   #.EER.#................#      LANDING | ANTECHAMBER
       2   #..@..#................#
       3   #.....D...4............#      4 Marlowe · U sideboard
       4   #...i.#..........U.....#
       5   #p...p#p..............p#
       6   ###D####################      ← landing door only; ante is one room
       7   #......................#
       8   #.....................w#
       9   #########D##############
      10   #......................#      BOARDROOM
      11   #..SKKK....TTTT...0dd..#      0 Caldwell · TTTT board table
      12   #..........cccc.....c..#
      13   #..tt..................#
      14   #......................#
      15   #..............LL......#
      16   #p............p.......V#
      17   ########################
```

Solid set: `# E R i p w = c K V t S L d T U 4 0`. `T` reuses Floor 1's meeting
table. Two NPCs (tighter than 3).

### 4.2 Zones

| Zone id        | Interior        | Label       | Accent    | Floor cell       |
| -------------- | --------------- | ----------- | --------- | ---------------- |
| `zone_landing` | x1–5, y1–5      | LANDING     | `#e0844d` | `floor_elevator` |
| `zone_ante`    | x7–22, y1–5     | ANTECHAMBER | `#6a5a48` | `floor_director` |
| `zone_hall_f5` | y7–8 + doorways | HALL        | `#8b98a8` | `floor_hall`     |
| `zone_board`   | x1–22, y10–16   | BOARDROOM   | `#2a2438` | `floor_board`    |

`zone_ante` reuses Floor 2's charcoal director carpet — the waiting room is the
expensive carpet you are not supposed to stand on for long. Rugs: red elevator,
navy hall, gold under the board table + Caldwell `(11–20, 11–13)`.

### 4.3 Cast

| NPC id               | Glyph | Tile      | Face | Sightline                 | Name     | Role            |
| -------------------- | ----- | --------- | ---- | ------------------------- | -------- | --------------- |
| `npc_exec_assistant` | `4`   | `(10,3)`  | s    | `(10,4) (10,5)`           | Marlowe  | EA              |
| `npc_ceo`            | `0`   | `(18,11)` | w    | `(17,11) (16,11) (15,11)` | Caldwell | Chief Executive |

### 4.4 Assignment `asg_board_packet`

`not_started → accepted → packet_held → complete`

1. First step → `dlg_marlowe_callout`.
2. Talk Marlowe → `accepted`. The packet is on the sideboard
   (`poi_sideboard`, `U` at `(17,4)`).
3. `key_board_packet`. Return to Marlowe → `complete`, receipt
   `BOARD PACKET — FILED` (`rwd_asg_board_packet` +18).
4. Banner: **See Caldwell → BOARDROOM**.

### 4.5 Encounter `enc_ceo_review` — Caldwell

Rank 8, boss, phase 2. Phase 1: HP 260, ATK 22, DEF 16. Types `influence` /
`strategy`. XP 80, Options 60. Title card `THE REVIEW` / `NO FLOOR 6`.
Moves: All-Hands (influence, demoralized 0.4), Direction (strategy),
Empty Chair (influence, heal 16).

Phase 2 at ≤ 50% (130): name `Caldwell (Offline)`, HP 150, ATK 24, DEF 14,
types `execution` / `strategy`. Taunt: "Let's take this offline." Moves:
Offline (strategy), Reorg (execution, acc 85), Vision (influence, heal 18,
motivated self).

Defeat: "Caldwell nods once. The nod is the offer. There is no letter. There
is no Floor 6."

---

## 5. Numbers

Curve continues Floor 2's `15 + 7·rank` XP / `8 + 3·rank` Options, with the
boss as a premium override (same rule as Holloway / Kessler).

| Encounter        | Rank | HP  | ATK | DEF | XP  | OPT | Phase 2       |
| ---------------- | ---- | --- | --- | --- | --- | --- | ------------- |
| `enc_vp_product` | 6    | 195 | 18  | 13  | 57  | 40  | —             |
| `enc_vp_sales`   | 7    | 220 | 20  | 14  | 64  | 48  | —             |
| `enc_ceo_review` | 8    | 260 | 22  | 16  | 80  | 60  | 150 / 24 / 14 |

| Ledger id              | Options | XP  | When                         |
| ---------------------- | ------- | --- | ---------------------------- |
| `rwd_asg_roadmap`      | +14     | —   | Nico initials the Q4 card    |
| `rwd_enc_vp_product`   | +40     | +57 | Quincy won                   |
| `rwd_promotion_f3`     | 0       | —   | Perk offer (once)            |
| `rwd_asg_leavebehind`  | +16     | —   | Reyes takes the leave-behind |
| `rwd_enc_vp_sales`     | +48     | +64 | Ashford won                  |
| `rwd_promotion_f4`     | 0       | —   | Perk offer (once)            |
| `rwd_asg_board_packet` | +18     | —   | Marlowe files the packet     |
| `rwd_enc_ceo_review`   | +60     | +80 | Caldwell won                 |
| `rwd_promotion_f5`     | 0       | —   | Perk offer (once)            |

`FLOOR_3_LEDGER_MAX = 54`, `FLOOR_4_LEDGER_MAX = 64`, `FLOOR_5_LEDGER_MAX = 78`.

Vending on each south floor is its own machine (`OFFICE_VENDING_STOCK_BY_FLOOR`):
Product (`espresso`, `noise_cancelling`, `mentors_advice`, `standing_desk`),
Sales (`espresso`, `networking_card`, `linkedin_endorsement`, `reply_all_grenade`),
Exec (`espresso`, `pto_day`, `reorg_memo`, `forward_to_legal`). Take-five is
free and full-party, same as 1 and 2. Ledger maxima stay **54 / 64 / 78**.

---

## 6. Access and the elevator

Rows Astra's panel already sketched in Floor 2 hooks, completed:

| Row | Number | Name       | Requires             |
| --- | ------ | ---------- | -------------------- |
| 5   | 5      | EXEC       | `key_client_badge`   |
| 4   | 4      | SALES      | `key_product_badge`  |
| 3   | 3      | PRODUCT    | `key_employee_badge` |
| 2   | 2      | OPERATIONS | `key_access_badge`   |
| 1   | 1      | YOUR TEAM  | (none)               |

Current floor inert ("You are here"). Missing key: disabled, "Badge required".
Down is always allowed. A badge is granted on the boss receipt (no printer
walk). Floor 5's enabled row after Caldwell is **the celebration**
(`screen_floor5_complete`), not a sixth floor.

Until the panel lands, `elevatorDestination` still toggles Floor 1 ↔ Floor 2
so the wired ride does not change. Floors 3–5 are keyed in `map.ts` and the
renderer; they become reachable the moment the panel writes `floorId`.

---

## 7. Presentation

Same pipeline as Floors 1 and 2 (`scripts/gen_office_tiles.py`,
`scripts/gen_office_actors.py`). Floor 3–5 atlas cells are **appended** after
every Floor 1 and Floor 2 cell, so those indices never move.

**Reuse hard:** landing stone, hall carpet, walls, doors, elevator, reader,
plants, water cooler, coffee counter, vending, supply cabinet, break table,
sofa, chairs, desks, exec desk, filing, handout rack, meeting table, windows,
clocks, vents, pinboards, whiteboards, Floor 2 gold/navy rug parts.

**New cells (only what the maps need):**

| Kind   | Cells                                                                                                                                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floors | `floor_war`, `floor_intake`, `floor_product`, `floor_pipeline`, `floor_client`, `floor_board`                                                                                                             |
| Decor  | `plaque_product_l/m/r`, `plaque_sales_l/m/r`, `plaque_exec_l/m/r`, `sign_war`, `sign_intake`, `sign_pipeline`, `sign_client`, `sign_board`, `nameplate_quincy`, `nameplate_ashford`, `nameplate_caldwell` |
| Props  | `directory_f3`, `directory_f4`, `directory_f5`, `roadmap_wall`, `intake_board`, `pipeline_board`, `sideboard`                                                                                             |
| Actors | `sloane`, `nico`, `quincy`, `harper`, `reyes`, `ashford`, `marlowe`, `caldwell`                                                                                                                           |

Walk sheets use the Floor 1 chibi rig. Dialogue / party cards reuse existing
512px portraits as stand-ins (new `spriteId` keys pointing at the house
files) until a portrait commission — Floor 2 already spent `intern` / `vp` /
`boss`. Map bodies are unique.

---

## 8. Frozen content IDs — **FROZEN**

Additions only.

| Kind        | Ids                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floors      | `floor_03`, `floor_04`, `floor_05` (`FloorId` gains them)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Zones       | `zone_war`, `zone_intake`, `zone_hall_f3`, `zone_product`, `zone_pipeline`, `zone_client`, `zone_hall_f4`, `zone_sales`, `zone_ante`, `zone_hall_f5`, `zone_board` (`zone_landing` already exists)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| NPCs        | `npc_staff_pm` (Sloane), `npc_researcher` (Nico), `npc_vp_product` (Quincy), `npc_account_exec` (Harper), `npc_client_success` (Reyes), `npc_vp_sales` (Ashford), `npc_exec_assistant` (Marlowe), `npc_ceo` (Caldwell)                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Encounters  | `enc_vp_product` (rank 6), `enc_vp_sales` (rank 7), `enc_ceo_review` (rank 8, boss, phase 2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Assignments | `asg_roadmap` (`not_started → accepted → card_held → initialled → complete`), `asg_leavebehind` (`not_started → accepted → deck_held → delivered → complete`), `asg_board_packet` (`not_started → accepted → packet_held → complete`)                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Key items   | `key_roadmap_card`, `key_research_sticky`, `key_product_badge`, `key_leavebehind`, `key_client_badge`, `key_board_packet`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| POIs        | `poi_elevator_door_f3`, `poi_directory_sign_f3`, `poi_roadmap_wall`, `poi_intake_board`, `poi_war_desk`, `poi_filing_f3`, `poi_water_cooler_f3`, `poi_break_counter_f3`, `poi_vending_machine_f3`, `poi_break_table_f3`, `poi_quincy_desk`, `poi_elevator_door_f4`, `poi_directory_sign_f4`, `poi_pipeline_board`, `poi_leavebehind`, `poi_pipeline_desk`, `poi_water_cooler_f4`, `poi_break_counter_f4`, `poi_vending_machine_f4`, `poi_break_table_f4`, `poi_ashford_desk`, `poi_elevator_door_f5`, `poi_directory_sign_f5`, `poi_sideboard`, `poi_water_cooler_f5`, `poi_break_counter_f5`, `poi_vending_machine_f5`, `poi_break_table_f5`, `poi_board_table`, `poi_caldwell_desk` |
| Triggers    | `trg_first_step_f3`, `trg_sight_staff_pm`, `trg_sight_researcher`, `trg_sight_vp_product`, `trg_first_step_f4`, `trg_sight_account_exec`, `trg_sight_client_success`, `trg_sight_vp_sales`, `trg_first_step_f5`, `trg_sight_exec_assistant`, `trg_sight_ceo`, `trg_elevator_ride_f3`, `trg_elevator_ride_f4`, `trg_elevator_ride_f5`                                                                                                                                                                                                                                                                                                                                                  |
| Rewards     | `rwd_asg_roadmap` 14, `rwd_enc_vp_product` 40, `rwd_promotion_f3` 0, `rwd_asg_leavebehind` 16, `rwd_enc_vp_sales` 48, `rwd_promotion_f4` 0, `rwd_asg_board_packet` 18, `rwd_enc_ceo_review` 60, `rwd_promotion_f5` 0                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Receipts    | `rcpt_roadmap_initialled`, `rcpt_prioritization`, `rcpt_product_badge`, `rcpt_leavebehind_delivered`, `rcpt_the_close`, `rcpt_client_badge`, `rcpt_board_packet_filed`, `rcpt_the_review`, `rcpt_the_climb`                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Flags       | `flag_visited_f3`, `flag_floor3_complete`, `flag_visited_f4`, `flag_floor4_complete`, `flag_visited_f5`, `flag_floor5_complete`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Dialogue    | `dlg_sloane_{callout,brief,hint_card,hint_nico,filed,after,after_win}` · `dlg_nico_{hook,waiting,initialled,after}` · `dlg_quincy_{early,sloane_pending,review,you_lost,beaten,after}` · `dlg_harper_{callout,brief,hint_deck,hint_reyes,filed,after,after_win}` · `dlg_reyes_{hook,waiting,delivered,after}` · `dlg_ashford_{early,harper_pending,close,you_lost,beaten,after}` · `dlg_marlowe_{callout,brief,hint_packet,filed,after,after_win}` · `dlg_caldwell_{early,packet_pending,review,you_lost,beaten,after}`                                                                                                                                                               |
| Screens     | `screen_floor3_complete`, `screen_floor4_complete`, `screen_floor5_complete` (Astra; same layout as Floor 2's celebration)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

---

## 9. Integration points (this branch vs Astra)

**Shipped here (Fable):** the three maps and zone/NPC/POI/interact tables;
dialogue nodes; encounter kits; reward / receipt rows; actor sheets; appended
tileset cells; renderer glyph rules so a `floorId` of `floor_03`/`04`/`05`
paints the floor; `FloorId` union and `map.ts` lookups; paper-playtest tests;
this freeze.

**Not shipped (Astra — `docs/rpg/floor-3-5-engine-hooks.md`):** elevator panel
rows 3–5; first-step / sightline / assignment reducers; boss stakes + combat
entry; badge grants on the three receipts; celebrations; save keys for the
new assignments / encounters / flags; objective copy for the three chains;
vending stock per floor.

Do not merge this branch to `main`. Stack on `feat/office-floor-2-design`
(`#72`) or rebase onto Astra's elevator-panel branch when it appears.
