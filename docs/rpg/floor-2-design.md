# The Office — Floor 2: Operations (Design)

_Status: design freeze for the second floor, revision 2 — on top of Astra's multi-floor loop
([PR #71](https://github.com/prime3679/corporateclimb/pull/71), now on `main`), whose Floor 2 stub
(Callie, a blank map, a take-five) this branch replaces with the frozen map, cast and IDs below. Owner: Fable
(experience, content, wording, pacing, art). Implementation: Astra
(`docs/rpg/floor-2-engine-hooks.md`, which now opens with what is already wired on this branch).
Everything marked **FROZEN** is an ID or value code will be written against; change it here first,
then in code. Floor 1 (`docs/rpg/mvp-design.md`) is the base contract — this document only adds to
it and changes exactly the Floor 1 copy listed in §2.5. Nothing in Floor 1's frozen ID table is
renamed._

Companion reading: `docs/rpg/mvp-design.md` (the loop, party rules, presentation spec §10–§14
that Floor 2 inherits wholesale), `docs/rpg/architecture.md` (Astra/Fable split),
`docs/rpg/fidelity-bar.md` (the art pipeline this floor extends), `src/content/office/floor2.ts`
(the frozen map and IDs as tables, checked by `src/__tests__/office/floor2-map.test.ts`).

---

## 0. One-paragraph pitch

Floor 2 is **Operations** — the floor that runs the building and says no. You step off the
elevator with a laminated _visitor_ badge and meet Teddy, a rotational intern fourteen months into
a three-month rotation who runs the help desk, the badge printer and, this week, HR. A real badge
needs a transfer packet: a photo from the booth behind him and a signature from your manager —
who is downstairs. So the elevator goes both ways now, and Floor 1 knows you've been up. File the
packet, pass Teddy's "compliance training" (he is the training), hire him if you have room —
and if you don't, learn that seats on the team are just seats: anyone you've hired can go back to
their desk and come back later, free. Then the Director of Operations reviews you. Kessler does
not do one-on-ones; he reviews teams, and halfway through he restructures. Win, get made
permanent, print the employee badge, and the elevator lists a 3.

### What Floor 2 is _for_

Floor 1 taught the loop: explore → activity → battle → badge → elevator. Floor 2 keeps every
rule and adds exactly three things, each placed where it is the obvious answer, none of them a
new system:

| Addition                                    | Where the player meets it                                                                        | Engine cost                                        |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------- |
| **The elevator goes both ways** (§8.2)      | The required packet needs Holloway's signature — one round trip, batched with an optional errand | Multi-floor state + one overlay (Astra hooks §1–2) |
| **Seats, not hires** — roster swap (§3)     | Teddy's offer when the party is full; every hired coworker keeps their desk and can rejoin       | `hired` list + dismiss / rejoin actions            |
| **The boss changes shape** — phase 2 (§5.3) | Kessler restructures at half HP; the rule Floor 1 wrote ("happens regardless of who is active")  | Un-gate the existing phase-2 path for encounters   |

Everything else — combat, party of 3, Stock Options, receipts, coach marks, cards — is Floor 1's,
unchanged.

### Locked defaults

| Default                                 | Answer                                                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Party of 3, lead in slot 0              | Unchanged (`PARTY_MAX = 3`). Floor 2 adds one recruitable and a way to make room, not a fourth seat                                        |
| One combat engine                       | Kessler's phase 2 uses the existing `phase2` path in `turn.ts`, currently gated off for encounters (`docs/rpg/floor-2-engine-hooks.md` §5) |
| Currency                                | Stock Options. Floor 2 pays 90 max; Floor 1's 65 is untouched                                                                              |
| Map size                                | **24×18, same as Floor 1** — justified in §1.6                                                                                             |
| Recruits stay at their desks            | Unchanged, and now literal: a dismissed coworker is _at their desk on their floor_                                                         |
| No random encounters, sightlines = talk | Unchanged                                                                                                                                  |
| Floor 1 reachability and IDs            | Untouched. Floor 1 gains new dialogue nodes and a state-keyed prompt on the vending machine; no tile, spawn or frozen ID moves             |
| Polish                                  | The same §10–§14 bar as Floor 1. Every surface named here has a stated empty state, feedback row and return position                       |

---

## 1. Floor 2 map (24×18) — **FROZEN**

Coordinates are `(x, y)`, origin top-left, `x` 0–23, `y` 0–17. Tiles, movement speed, camera and
viewport are Floor 1's. The elevator occupies **the same three tiles as Floor 1** — `E` at
`(2,1)`/`(3,1)`, badge reader `R` at `(4,1)` — because it is the same shaft; you arrive at
`(3,2)` facing south, which is exactly where Floor 1 puts you after the celebration. One shaft, one
arrival tile, every floor.

### 1.1 Combined tile + entity map

```
         x → 0         1         2
           012345678901234567890123
    y  0   ########################
       1   #.EER.#.....BG#.ff.....#      LANDING      | HELP DESK (IT)      | PEOPLE OPS
       2   #..@..#.===b.G#......p.#
       3   #.....D..5....D..QQQ...#      ← glass doors at (6,3) and (14,3)
       4   #...i.#......G#.....LL.#
       5   #p...p#......G#p.......#
       6   ###D#####D##########D###      ← doors down to the hall at (3,6) (9,6) (20,6)
       7   #......................#      HALL (two rows; navy runner on row 8)
       8   #.....................w#
       9   ###D####D##########D####      ← doors at (3,9) director · (8,9) facilities · (19,9) finance
      10   #......#.SKKK..#ff....$#      DIRECTOR'S   | FACILITIES          | FINANCE
      11   #......#.......#==.....#      OFFICE       |                     |
      12   #c.....#k.....V#cc.6==.#
      13   #..7dd.#k.tt...#.......#
      14   #....c.#.......#==.....#
      15   #LL....#......j#cc.....#
      16   #p....p#p.....p#p.....m#
      17   ########################
```

### 1.2 Legend and collision

Glyphs are per-floor: Floor 2's legend does not have to agree with Floor 1's, and it doesn't
(`X` was Floor 1's street exit; Floor 2 has no street). Solid set:
`# E R f w B G b = Q L S K V $ c k d t j m p i 5 6 7`. Walkable: `.` `D` and the arrival `@`.

| Glyph | Tile                                              | Solid | Interaction (label when adjacent + facing)            | POI id                   | Atlas cell(s)                                                          |
| ----- | ------------------------------------------------- | ----- | ----------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------- |
| `#`   | Wall (16-way autotile, Floor 1 rules)             | yes   | —                                                     | —                        | `wall_0..15`                                                           |
| `.`   | Floor (zone material, §1.3)                       | no    | —                                                     | —                        | per zone                                                               |
| `D`   | Doorway (glass, open)                             | no    | `(3,9)` only: director door prompt (§8.1)             | `poi_director_door`      | `door_v_single` at `(6,3)` `(14,3)`; `door_h` on rows 6 and 9          |
| `@`   | Arrival `(3,2)`, facing south                     | —     | —                                                     | —                        | rendered as floor                                                      |
| `E`   | Elevator doors (2 tiles)                          | yes   | "Elevator" → `ovl_elevator_panel` (§8.2)              | `poi_elevator_door_f2`   | `elev_l/r_closed`, `elev_l/r_open`                                     |
| `R`   | Badge reader                                      | yes   | "Elevator" (same POI)                                 | `poi_elevator_door_f2`   | `reader_red_0/1`, `reader_green_0/1`                                   |
| `i`   | Floor directory                                   | yes   | "Read · Directory"                                    | `poi_directory_sign_f2`  | `directory_f2`                                                         |
| `B`   | Badge photo booth                                 | yes   | "Take photo · Booth" / "Inspect · Booth"              | `poi_photo_booth`        | `photo_booth_idle`, `photo_booth_flash_0/1`                            |
| `b`   | Badge printer (on a stand)                        | yes   | "Print badge · Badge printer" / "Inspect"             | `poi_badge_printer`      | `badge_printer_idle`, `_printing_0/1`, `_done`                         |
| `G`   | Server rack                                       | yes   | "Inspect · Server rack"                               | `poi_server_rack`        | `server_rack_0/1` (LEDs blink, 900 ms)                                 |
| `=`   | Desk (3-wide at the help desk; 2-wide in Finance) | yes   | Help desk: "Inspect · Help desk"; Finance desks: none | `poi_help_desk`          | `desk_l_0/1`, `desk_m_0/1`, `desk_r` (Floor 1 cells)                   |
| `f`   | Filing cabinet                                    | yes   | "Inspect · Filing cabinets"                           | `poi_filing_cabinets`    | `filing_closed` (even x), `filing_open` (odd x)                        |
| `Q`   | People Ops counter (3-wide, tray on middle)       | yes   | "File · People Ops tray" / "Inspect"                  | `poi_people_tray`        | `pcounter_l/m/r`                                                       |
| `L`   | Sofa (2-wide)                                     | yes   | —                                                     | —                        | `sofa_l/r`                                                             |
| `w`   | Water cooler                                      | yes   | "Inspect · Water cooler"                              | `poi_water_cooler_f2`    | `water_cooler`                                                         |
| `d`   | Director's desk (2-wide)                          | yes   | "Inspect · Desk"                                      | `poi_director_desk`      | `exec_desk_l/r`                                                        |
| `c`   | Chair                                             | yes   | —                                                     | —                        | `chair_n` when a desk (`=`/`d`) is north, else `chair_s`               |
| `S`   | Supply cabinet                                    | yes   | "Open · Supply cabinet"                               | `poi_supply_cabinet_f2`  | `cabinet_closed/open`                                                  |
| `K`   | Coffee counter (3 tiles)                          | yes   | "Take five · Coffee counter"                          | `poi_break_counter_f2`   | `counter_machine`, `counter_steam_0/1`, `counter_cups`, `counter_sink` |
| `V`   | Vending machine                                   | yes   | "Buy · Vending"                                       | `poi_vending_machine_f2` | `vending_idle`, `vending_lit_0/1`                                      |
| `k`   | Locker                                            | yes   | "Inspect · Lockers"                                   | `poi_lockers`            | `locker`                                                               |
| `t`   | Break table (2-wide)                              | yes   | "Inspect · Break table"                               | `poi_break_table_f2`     | `btable_f2_l/r` (donut box, not Floor 1's cake)                        |
| `j`   | Janitor cart                                      | yes   | "Inspect · Janitor cart"                              | `poi_janitor_cart`       | `janitor_cart`                                                         |
| `$`   | Safe                                              | yes   | "Inspect · Safe"                                      | `poi_safe`               | `safe`                                                                 |
| `m`   | Shredder                                          | yes   | "Inspect · Shredder"                                  | `poi_shredder`           | `shredder_idle`, `shredder_shredding_0/1`                              |
| `p`   | Plant                                             | yes   | —                                                     | —                        | `plant_a/b`                                                            |
| `5`   | Teddy (required coworker)                         | yes   | "Talk · Teddy"                                        | `npc_help_desk_intern`   | actor `teddy`                                                          |
| `6`   | Whitlock (optional, not recruitable)              | yes   | "Talk · Whitlock"                                     | `npc_auditor`            | actor `whitlock`                                                       |
| `7`   | Kessler (boss)                                    | yes   | "Talk · Kessler"                                      | `npc_director`           | actor `kessler`                                                        |

Interaction rule is Floor 1's (adjacent + facing). The full spot list is
`FLOOR_2_INTERACT_SPOTS` in `src/content/office/floor2.ts`; the test proves every spot is
reachable floor that faces its target.

### 1.3 Zones

| Zone id           | Interior tiles      | Label             | Accent (chip bar, destination chip, tint) | Floor cell         | Notes                                               |
| ----------------- | ------------------- | ----------------- | ----------------------------------------- | ------------------ | --------------------------------------------------- |
| `zone_landing`    | x1–5, y1–5          | LANDING           | `#e0844d` (= Floor 1's elevator lobby)    | `floor_elevator`   | Same stone, same shaft. Arrival, directory, red rug |
| `zone_it`         | x7–13, y1–5         | HELP DESK         | `#4d8fe0`                                 | `floor_it`         | Teddy, photo booth, badge printer, rack wall        |
| `zone_people`     | x15–22, y1–5        | PEOPLE OPS        | `#d178b8`                                 | `floor_people`     | Filing, the tray, a sofa nobody has time for        |
| `zone_hall_f2`    | y7–8 + all doorways | HALL              | `#8b98a8`                                 | `floor_hall`       | Two rows wide; OPERATIONS plaque on the north wall  |
| `zone_director`   | x1–6, y10–16        | DIRECTOR'S OFFICE | `#e0b34a` (gold — the boss room)          | `floor_director`   | Kessler, walnut desk, the sofa you may not sit on   |
| `zone_facilities` | x8–14, y10–16       | FACILITIES        | `#5aa9b8`                                 | `floor_facilities` | Take five, vending, lockers, cart. Defeat respawn   |
| `zone_finance`    | x16–22, y10–16      | FINANCE           | `#6fae5c`                                 | `floor_finance`    | Whitlock, desks nobody sits at, safe, shredder      |

Landing and hall deliberately **reuse Floor 1 materials** (elevator stone, hall carpet): the
building's common parts are the building's. Rooms get new materials: anti-static tile (IT), rose
herringbone (People), charcoal plush (Director), sealed concrete (Facilities), green carpet tiles
(Finance). Rugs: red in front of the elevator (`(2–4, 2–3)`, same as Floor 1), a navy runner along
hall row 8 (`x1–21`), a gold rug under Kessler and his desk (`(2–5, 11–14)`).

### 1.4 NPC positions, facing, sightlines, triggers

Sightline rules are Floor 1's: straight line in the facing direction, stops at the first solid
tile, capped at 3; entering one triggers _dialogue_, never combat, once per state.

| NPC / trigger id       | Tile                                        | Facing | Sightline tiles          | Active when                                              | Fires                                              |
| ---------------------- | ------------------------------------------- | ------ | ------------------------ | -------------------------------------------------------- | -------------------------------------------------- |
| `npc_help_desk_intern` | `(9,3)`                                     | south  | `(9,4) (9,5) (9,6)`      | `asg_transfer = filed` and `enc_help_desk_intern = open` | `dlg_teddy_filed` (the compliance callout)         |
| `npc_auditor`          | `(19,12)`                                   | north  | `(19,11) (19,10) (19,9)` | `asg_audit = not_started`                                | `dlg_whitlock_hook`                                |
| `npc_director`         | `(3,13)`                                    | north  | `(3,12) (3,11) (3,10)`   | always until `enc_director_review = won`                 | `dlg_kessler_*` by state (§2.4)                    |
| `trg_first_step_f2`    | any                                         | —      | —                        | first completed step on Floor 2, once                    | `dlg_teddy_callout` (across the room, no portrait) |
| `trg_director_door`    | `(3,9)`                                     | —      | —                        | gate met (§8.1) and `enc_director_review ≠ won`          | door prompt; "Not yet" steps back to `(3,8)`       |
| `trg_elevator_ride_f2` | `(2–4,2)` facing north, `(5,1)` facing west | —      | —                        | always                                                   | `ovl_elevator_panel` (§8.2)                        |
| `trg_roster_coach`     | recruit card                                | —      | —                        | first `[Make room]` shown (§3.2), once per save          | `coach_roster`                                     |

Teddy's sightline runs to the hall door at `(9,6)`: coming back from the tray you re-enter the help
desk through the hall and he catches you at the door. Whitlock's reaches the Finance door at
`(19,9)`: you cannot enter Finance without being audited at least verbally. Kessler's covers the
three tiles between him and the door — stepping in puts you at the far end of it.

### 1.5 Fixed placements

| Purpose                             | Tile                                       | Facing                                     |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------ |
| Arrival (every ride to Floor 2)     | `(3,2)`                                    | south (doors open behind you)              |
| Defeat respawn (Facilities)         | `(11,11)`                                  | north (looking at the good coffee machine) |
| Director door step-in               | `(3,10)`                                   | south (inside Kessler's sightline)         |
| Director door step-back ("Not yet") | `(3,8)`                                    | north                                      |
| Post-promotion return               | `(3,10)`                                   | south                                      |
| Photo booth interaction             | `(12,2)` ↑, `(11,1)` →                     |
| Badge printer interaction           | `(11,3)` ↑, `(12,2)` ←                     |
| People Ops tray interaction         | `(17–19,4)` ↑, `(16,3)` →, `(20,3)` ←      |
| Teddy interaction                   | `(8,3)` →, `(10,3)` ←, `(9,4)` ↑           |
| Whitlock interaction                | `(19,11)` ↓, `(18,12)` →, `(19,13)` ↑      |
| Kessler interaction                 | `(3,12)` ↓, `(2,13)` →                     |
| Coffee counter                      | `(10–12,11)` ↑, `(13,10)` ←                |
| Vending                             | `(13,12)` →, `(14,11)` ↓, `(14,13)` ↑      |
| Elevator                            | `(2–4,2)` ↑, `(5,1)` ←                     |
| Directory                           | `(3,4)` →, `(5,4)` ←, `(4,3)` ↓, `(4,5)` ↑ |

### 1.6 Why 24×18 again

- The viewport (14 wide × full height), camera clamp, `MAP_WIDTH`/`MAP_HEIGHT` constants and the
  "whole floor height always on screen" guarantee are shared. A different size means per-floor
  camera maths for no player-facing gain.
- Floor 2 is **denser**, not bigger: six rooms and a two-row hall against Floor 1's five and a
  spine, with a loop (landing → IT → People Ops → hall → landing) instead of a comb. It reads as a
  different floor at a glance because the plan is different, not because the frame is.
- Pacing stays in the 10–15 minute band (§9) with the elevator round trip included; more tiles
  would push it with walking, which Floor 1 explicitly refused to do.

### 1.7 Wall decor (keyed by wall tile; only on faces with open floor south)

Landing `(1,0)` vent · `(5,0)` clock. Help desk `(7,0)` HELPDESK sign · `(8–9,0)` ticket board
(OPEN full, DONE one card) · `(10,0)` extinguisher · `(11,0)` server status monitor. People Ops
`(15,0)` PEOPLE sign · `(18–19,0)` org chart (one box crossed out) · `(20,0)` compliance poster ·
`(21–22,0)` window. Hall north wall `(1,6)` extinguisher · `(5,6)` pinboard · `(7–8,6)` DAYS SINCE
REORG: 0 · `(10–12,6)` OPERATIONS / FLOOR 2 plaque · `(14,6)` vent · `(16,6)` poster · `(18,6)` clock
· `(22,6)` vent. Director `(1–2,9)` window · `(4,9)` KESSLER nameplate · `(5–6,9)` whiteboard.
Facilities `(9,9)` breaker panel (high, above the cabinet) · `(13,9)` PANTRY sign · `(14,9)` mug
shelf. Finance `(16,9)` clock · `(18,9)` FINANCE sign · `(20–21,9)` window · `(22,9)` vent.

The full table is `FLOOR_2_WALL_DECOR`; the test asserts each key is a wall with a visible face
and each value is an atlas cell.

---

## 2. NPCs and dialogue trees — **FROZEN IDs**

Conventions, copy rules and the state vocabulary are Floor 1's §2 and §9.2 (≤ 90 chars per line,
≤ 3 lines before a choice/effect, no line explains a control, satire targets the institution).
New state vocabulary:

- `asg_transfer ∈ { not_started, accepted, photo_taken, signed, filed, complete }`
- `asg_audit ∈ { not_started, accepted, receipts_held, complete }`
- `enc_help_desk_intern`, `enc_auditor`, `enc_director_review ∈ { open, won }`
- `hired` — every coworker who has ever accepted a letter; `party` ⊆ `hired` ∪ lead (§3)
- key items: `key_badge_photo`, `key_transfer_form` (signed), `key_receipt_roll`,
  `key_employee_badge`; `key_offer_letter` now caps at **3** (2 from Floor 1 + 1 from Floor 2)
- flags: `flag_visited_f2`, `flag_floor2_complete`, `flag_roster_coached`, `flag_reader_denied_f2`
- `{n}` in copy is the Floor 1 ledger total actually earned (`ledgerOptionsEarned` over Floor 1
  ids); `{party}` selects a variant by party size, as Floor 1 does for Renata.

Recruitability at a glance:

| NPC      | Recruitable | Why                                                                       |
| -------- | ----------- | ------------------------------------------------------------------------- |
| Teddy    | **yes**     | Required coworker; the only new hire on the floor, and the roster teacher |
| Whitlock | no          | External. "I don't work here. Legally, that's the point of me."           |
| Kessler  | no          | Boss. "Directors don't join. Directors are joined."                       |

Portraits (reused, one face per person everywhere): Teddy `intern`, Whitlock `boss`, Kessler `vp`.
Map bodies: `public/office/actors/{teddy,kessler,whitlock}.png`, same rig and ink as the Floor 1
cast (`scripts/gen_office_actors.py`). Eyebrows: `TEDDY · IT HELP DESK`, `WHITLOCK · EXTERNAL
AUDITOR`, `KESSLER · DIRECTOR OF OPERATIONS`.

### 2.1 `npc_help_desk_intern` — Teddy, IT Help Desk (Rotational Intern)

Role: Floor 2's greeter, required activity owner, required fight and only recruit. Anxious,
over-competent, has been "on rotation" for fourteen months. Encounter `enc_help_desk_intern` (rank
3). Declinable. No rematch. Recruit def `cw_help_desk_intern` (§3.3).

| Node                       | Condition                                               | Lines / choices                                                                                                                                                                                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_teddy_callout`        | `trg_first_step_f2`, once                               | _(across the room, no portrait, `!` over Teddy, pin lands on him)_ "Visitor badge. On two. Bold." → objective: **Talk to Teddy** · HELP DESK → `flag_visited_f2`                                                                                                                                                                                                      |
| `dlg_teddy_packet`         | `asg_transfer = not_started`                            | "Help desk. Also badges. Also HR this week; People Ops is self-service and the self is me." · "Your badge is a visitor badge. Holloway laminated a visitor badge. That's very Floor 1." · "A real one needs a transfer packet: a photo, and your manager's signature. Booth's behind me." → `asg_transfer = accepted` → objective: **Take a badge photo** · HELP DESK |
| `dlg_teddy_hint_photo`     | `accepted`                                              | "Booth's the red curtain. It counts down from three and fires on two. Everyone's does."                                                                                                                                                                                                                                                                               |
| `dlg_teddy_hint_signature` | `photo_taken`                                           | "Now the signature. Holloway. Floor 1. Elevator's where you left it." · "Finance is asking about you too. Whitlock, down the hall, right. Do everything downstairs in one trip."                                                                                                                                                                                      |
| `dlg_teddy_hint_file`      | `signed`                                                | "Signed? Drop the packet in the People Ops tray. Through the glass, right. The tray has a face."                                                                                                                                                                                                                                                                      |
| `dlg_teddy_filed`          | sightline or talk, `filed`, `enc = open`                | "Filed. That makes you a transfer, which means I run you through compliance." · "Module one of one. It's interactive. I'm the interactive." → `asg_transfer = complete` → **stakes card** (§5.2): `[Begin training]` → battle · `[Later]` ⎋ → `dlg_teddy_declined`                                                                                                    |
| `dlg_teddy_declined`       | chose Later                                             | "Later works. The module doesn't go anywhere. Neither do I."                                                                                                                                                                                                                                                                                                          |
| `dlg_teddy_you_lost`       | talk after a loss, `enc = open`                         | "Facilities has the good coffee machine. Nobody downstairs knows. Take five, come back." → `dlg_teddy_filed` on next talk                                                                                                                                                                                                                                             |
| `dlg_teddy_beaten`         | immediately after win (after the receipt)               | "Passed. You passed. I've never passed anyone; the module is usually me losing on purpose." → `enc_help_desk_intern = won` → `dlg_teddy_offer` (letter, slot free) / `dlg_teddy_offer_full` (letter, party full) / else objective: **See Kessler** · DIRECTOR'S OFFICE                                                                                                |
| `dlg_teddy_offer`          | `won`, not hired, letter held, slot free                | "Is that a pre-signed offer letter. From the tray. That I filed." · "Yes. Take me. Fourteen months on rotation. Rotations are three." → **recruit card**: `[Extend the offer]` → `dlg_teddy_joined` · `[Not yet]` ⎋ → `dlg_teddy_offer_declined`                                                                                                                      |
| `dlg_teddy_offer_full`     | `won`, not hired, letter held, party full               | "You've got three. That's the whole elevator." · "Send someone back to their desk and I'm in. They keep the desk. Everyone keeps the desk." → **recruit card, full variant** (§3.2): `[Make room]` → roster → back to the card · `[Not yet]` ⎋ → `dlg_teddy_offer_declined`                                                                                           |
| `dlg_teddy_offer_declined` | chose Not yet                                           | "Sure. I'll be here. Ticket's open. My tickets stay open."                                                                                                                                                                                                                                                                                                            |
| `dlg_teddy_joined`         | offer extended                                          | "Team. I'll keep the desk too; that's how it works here. Gavin explained it in a ticket." · "Switch me in when someone's on fire. I do restarts." → `party += cw_help_desk_intern`, `hired += cw_help_desk_intern`, letter −1 → objective: **See Kessler** · DIRECTOR'S OFFICE                                                                                        |
| `dlg_teddy_rejoin`         | hired, not in party, slot free                          | "Back on the team? Sure. I never logged off." → `party += cw_help_desk_intern` (no letter)                                                                                                                                                                                                                                                                            |
| `dlg_teddy_rejoin_full`    | hired, not in party, party full                         | "Three's three. Send someone to their desk first. Not a metaphor; we have desks."                                                                                                                                                                                                                                                                                     |
| `dlg_teddy_party`          | in party, `enc_director_review = open`                  | "Teammate. Also the help desk. The queue doesn't know I left."                                                                                                                                                                                                                                                                                                        |
| `dlg_teddy_no_letter`      | `won`, not hired, no letter                             | "No letters left? HR prints two a quarter. It's a long quarter." _(unreachable by the ledger — kept so the state is never silent)_                                                                                                                                                                                                                                    |
| `dlg_teddy_badge_pending`  | `enc_director_review = won`, no `key_employee_badge`    | "He signed? Printer's next to my desk. It jams on the photo. Everyone's does."                                                                                                                                                                                                                                                                                        |
| `dlg_teddy_after`          | `key_employee_badge` held, `flag_floor2_complete` unset | "Employee badge. Level two. Mine says INTERN and expires never."                                                                                                                                                                                                                                                                                                      |
| `dlg_teddy_after_win`      | `flag_floor2_complete` set                              | _(in party)_ "We passed Kessler. It's going on my rotation review. Which is also me." · _(not in party)_ "Floor 3? Send a ticket from up there. I'll close it from down here."                                                                                                                                                                                        |

### 2.2 `npc_auditor` — Whitlock, External Auditor

Role: optional activity (`asg_audit`) and optional fight. Precise, unhurried, bills by the hour,
leaves at four. Encounter `enc_auditor` (rank 4). Declinable. Not recruitable.

| Node                     | Condition                                      | Lines / choices                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_whitlock_hook`      | sightline, `asg_audit = not_started`, once     | "You. Floor 1. {n} Options earned on a floor with one vending machine. Stand there." → continues into `dlg_whitlock_request`                                                                                                                                                                                                                                                      |
| `dlg_whitlock_request`   | talk, `not_started`                            | "I'm external. I don't work here; I count here. Your machine downstairs prints receipts." · "Bring me the roll. All of it. Then we'll talk about your ledger." → `[Take it on]` → `asg_audit = accepted`, optional objective: **Print the vending receipts** · FLOOR 1 · `[Pass]` ⎋ → `dlg_whitlock_pass`                                                                         |
| `dlg_whitlock_pass`      | chose Pass                                     | "Declining an audit is also a data point. Noted. In pencil."                                                                                                                                                                                                                                                                                                                      |
| `dlg_whitlock_waiting`   | `accepted`                                     | "Floor 1. Break room. Vending machine. It has a button that says RECEIPT. Nobody has pressed it."                                                                                                                                                                                                                                                                                 |
| `dlg_whitlock_delivered` | `receipts_held`                                | _(purchases made)_ "Two point three metres. Espresso. Espresso. A side hustle. I have questions; they're rhetorical." · _(no purchases)_ "Two point three metres of blank receipt. That is somehow worse." · "Reconciled. Reimbursed." → consume `key_receipt_roll`, `asg_audit = complete` → **receipt** `AUDIT — RECONCILED` (+10 📈) → continues into `dlg_whitlock_challenge` |
| `dlg_whitlock_challenge` | `complete`, `enc = open`                       | "Now the ledger. {n} Options earned on Floor 1. I'd like to see the work." → **stakes card**: `[Open the books]` → battle · `[Not today]` ⎋ → `dlg_whitlock_declined`                                                                                                                                                                                                             |
| `dlg_whitlock_declined`  | chose Not today                                | "Not today. Audits don't end. They pause."                                                                                                                                                                                                                                                                                                                                        |
| `dlg_whitlock_you_lost`  | talk after a loss, `enc = open`                | "Facilities. Take five. I'll be here; I bill by the hour." → `dlg_whitlock_challenge` on next talk                                                                                                                                                                                                                                                                                |
| `dlg_whitlock_beaten`    | immediately after win (after the receipt)      | "…The numbers hold." · "Initialled. In pencil. I don't do pen for anyone." → `enc_auditor = won`                                                                                                                                                                                                                                                                                  |
| `dlg_whitlock_recruit`   | any time the player holds a letter, talk twice | "An offer letter? I don't work here. Legally, that's the point of me."                                                                                                                                                                                                                                                                                                            |
| `dlg_whitlock_after`     | `enc = won`                                    | "Audit's closed. Your receipts are confetti now. Compliant confetti." _(the shredder tile plays its shredding frames while this line is up)_                                                                                                                                                                                                                                      |

### 2.3 `npc_director` — Kessler, Director of Operations

Role: mandatory boss with a phase 2, tuned for a full team. Crisp, arms crossed, says "aligned".
Encounter `enc_director_review` (rank 5, boss). Not declinable once inside; no flee. Not
recruitable. Prerequisites: `asg_transfer = complete` and `enc_help_desk_intern = won`.

| Node                        | Condition                                                                   | Lines / choices                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dlg_kessler_early`         | sightline or talk, `asg_transfer ≠ complete`, `enc_help_desk_intern = open` | "Transfer's not filed. Or Teddy hasn't cleared you. Or both. Operations runs on 'or both'."                                                                                                                                                                                                                                                                                                                                    |
| `dlg_kessler_teddy_pending` | `asg_transfer = complete`, `enc_help_desk_intern = open`                    | "Packet's filed. Compliance isn't. Teddy runs it. Yes, the intern. It's his fourteenth month; he's senior."                                                                                                                                                                                                                                                                                                                    |
| `dlg_kessler_review`        | sightline after step-in, gate met, `enc = open`                             | "Stand. Everyone stands here; it keeps reviews short. This one won't be." · "Teddy passed you, which means Teddy lost. Interesting." · _(party ≥ 2)_ "Good, you brought the team. I review teams. Individually, in sequence." · _(party = 1)_ "Alone. Operations doesn't do one-on-ones. You're about to find out why." · "This is your operations review. There's no rescheduling." → **stakes card** with a single `[Begin]` |
| `dlg_kessler_you_lost`      | spoken over the defeat interstitial                                         | "Facilities. All of you. Reschedule with Teddy; he owns a calendar he isn't allowed to edit."                                                                                                                                                                                                                                                                                                                                  |
| `dlg_kessler_beaten`        | immediately after win (after the receipt and the promotion)                 | "…Fine. Aligned." · "Signed. Transfer approved. Teddy prints the badge; I don't touch the printer. It's a policy about me." → `enc_director_review = won` → objective: **Print your badge** · HELP DESK                                                                                                                                                                                                                        |
| `dlg_kessler_after`         | `enc = won`                                                                 | "Badge printer's at the help desk. Then the elevator. Floor 3 exists; nobody's mapped it." · _(letter held)_ "And no. Directors don't join. Directors are joined."                                                                                                                                                                                                                                                             |

### 2.4 Point-of-interest copy (state-keyed)

| POI                      | Condition                              | Text / effect                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------ | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poi_photo_booth`        | `asg_transfer = not_started`           | "A badge photo booth. The curtain is the colour of a mistake."                                                                                                                                                                                                                                                                                                                                     |
| `poi_photo_booth`        | `accepted` — prompt "Take photo"       | "Three. Two—" → booth plays `photo_booth_flash_0/1` (2 frames, 220 ms) → "It prints a photo. Your eyes are closed. It's the only copy." → gain `key_badge_photo` (toast "Got: Badge Photo (eyes closed)"), `asg_transfer = photo_taken` → objective: **Get Holloway's signature** · FLOOR 1                                                                                                        |
| `poi_photo_booth`        | `photo_taken` or later                 | "The booth hums. It has your photo now. Forever, per the form."                                                                                                                                                                                                                                                                                                                                    |
| `poi_badge_printer`      | `enc_director_review ≠ won`            | "A badge printer. Amber light. It prints for people with signatures."                                                                                                                                                                                                                                                                                                                              |
| `poi_badge_printer`      | `won`, no badge — prompt "Print badge" | printer plays `badge_printer_printing_0/1` (2 frames, 600 ms, 1.8 s) → "It thinks. It prints. Level two, laminated, the photo with your eyes closed." → **receipt** `EMPLOYEE BADGE — ISSUED` (Employee Badge 🪪) → `key_employee_badge` → tile `badge_printer_done` → objective: **Take the elevator** · LANDING                                                                                  |
| `poi_badge_printer`      | badge held                             | "Green light. It's done printing you."                                                                                                                                                                                                                                                                                                                                                             |
| `poi_people_tray`        | `asg_transfer ∈ {not_started}`         | "An in-tray with a face drawn on it. The face is patient."                                                                                                                                                                                                                                                                                                                                         |
| `poi_people_tray`        | `accepted` / `photo_taken`             | "The tray wants a photo and a signature. It cannot say so. Someone drew it a face instead."                                                                                                                                                                                                                                                                                                        |
| `poi_people_tray`        | `signed` — prompt "File"               | "You place the packet in the tray. The tray does not react. Somewhere, a process starts." · "A pre-signed Offer Letter slides out from under the stack. HR staples one to everything." → consume `key_badge_photo` + `key_transfer_form`, gain `key_offer_letter` ×1 → **receipt** `TRANSFER PACKET — FILED` (+12 📈, Offer Letter ×1) → `filed` → objective: **Report back to Teddy** · HELP DESK |
| `poi_people_tray`        | `filed` or later                       | "The tray's empty. The face looks satisfied. Or bored. It's a sticky note."                                                                                                                                                                                                                                                                                                                        |
| `poi_help_desk`          | always                                 | "Three monitors. Eleven tabs each. One tab is titled HOW TO ESCALATE MYSELF."                                                                                                                                                                                                                                                                                                                      |
| `poi_server_rack`        | always                                 | "Forty-two units of blinking. One light is red. Nobody knows which one matters."                                                                                                                                                                                                                                                                                                                   |
| `poi_filing_cabinets`    | always                                 | "P to T. Someone's whole career is in the middle drawer, filed under R for Reorg."                                                                                                                                                                                                                                                                                                                 |
| `poi_water_cooler_f2`    | always                                 | "The gossip up here is about you. It's positive. That's the gossip."                                                                                                                                                                                                                                                                                                                               |
| `poi_directory_sign_f2`  | always — prompt "Read"                 | `ovl_document` (directory): "FLOOR 2 — OPERATIONS. Help desk: through the glass. People Ops: far right. Director: down the hall, left. Facilities: down the hall, middle. Finance: down the hall, right. Elevator: you're standing at it."                                                                                                                                                         |
| `poi_director_desk`      | always                                 | "Nameplate: R. KESSLER, DIRECTOR OF OPERATIONS. Bolted down. The plate and the desk."                                                                                                                                                                                                                                                                                                              |
| `poi_supply_cabinet_f2`  | first open                             | "Toner. Eleven boxes. The right kind. Nobody downstairs knows." → tile stays open (`cabinet_open`), no item                                                                                                                                                                                                                                                                                        |
| `poi_supply_cabinet_f2`  | later                                  | "Still the right toner. Still a secret."                                                                                                                                                                                                                                                                                                                                                           |
| `poi_break_counter_f2`   | always — prompt "Take five"            | confirm card `TAKE FIVE`: "Restores HP and PP for the whole team. This is the good machine." `[Take five]` `[Not now]` ⎋ → "You take five. The good machine. Everyone's restored and slightly smug."                                                                                                                                                                                               |
| `poi_vending_machine_f2` | always — prompt "Buy"                  | `ovl_vending` (§7.2). Header sub-line: "Accepts Stock Options. Finance has questions." Sold-out sub-line: "Restocked never. Budget."                                                                                                                                                                                                                                                               |
| `poi_break_table_f2`     | always                                 | "A donut box. Two donuts. A napkin where the third was, with a note: FOR KESSLER."                                                                                                                                                                                                                                                                                                                 |
| `poi_lockers`            | always                                 | "Padlocked. The combination is on a sticky note on the safe in Finance."                                                                                                                                                                                                                                                                                                                           |
| `poi_janitor_cart`       | always                                 | "WET FLOOR. The floor is dry. The sign is aspirational."                                                                                                                                                                                                                                                                                                                                           |
| `poi_safe`               | always                                 | "A safe. The combination is on a sticky note. On the safe."                                                                                                                                                                                                                                                                                                                                        |
| `poi_shredder`           | `asg_audit ≠ complete`                 | "A cross-cut shredder. It has eaten better receipts than yours."                                                                                                                                                                                                                                                                                                                                   |
| `poi_shredder`           | `asg_audit = complete`                 | "Your receipts, as confetti. Whitlock fed them in one at a time. Lovingly."                                                                                                                                                                                                                                                                                                                        |
| `poi_elevator_door_f2`   | always                                 | opens `ovl_elevator_panel` (§8.2). Reader LED: red until `key_employee_badge`, then steady green. First red interaction adds the line "The reader blinks red. Floor 3 is above your grade. It says so, in a beep." → `flag_reader_denied_f2`                                                                                                                                                       |
| `poi_director_door`      | gate open, `enc = open` (step-on)      | door prompt (§8.1). Otherwise a plain doorway.                                                                                                                                                                                                                                                                                                                                                     |

### 2.5 Floor 1 — returning cast (new nodes, plus two copy changes to frozen ids)

Floor 1's map, spawns, POIs and IDs do not move. These are the lines that make going back down
feel like a decision the building noticed. Node ids are new except where marked **copy change**
(the id stays; only the text, which referred to Floor 2 not existing, is replaced).

| NPC / POI             | Node                                | Condition                                                 | Lines / effect                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------- | ----------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renata                | `dlg_renata_badged` **copy change** | `key_access_badge`, `flag_preview_complete` unset         | "Look at you. Badged. Elevator's top left. It goes to Floor 2." · "Floor 2 is Operations. They run the building. They'll tell you."                                                                                                                                                                                                                                              |
| Renata                | `dlg_renata_after` **copy change**  | `flag_preview_complete`, `flag_visited_f2` unset          | "Back down before going up? Take the elevator. Operations sends everyone down once anyway."                                                                                                                                                                                                                                                                                      |
| Renata                | `dlg_renata_transfer`               | `asg_transfer = photo_taken`                              | "Transfer form? Holloway. Elevator lobby. She signs anything you hold still enough."                                                                                                                                                                                                                                                                                             |
| Renata                | `dlg_renata_audit`                  | `asg_audit = accepted`, no roll                           | "The vending machine prints receipts? Since when. Since always? Don't tell Whitlock about the cake."                                                                                                                                                                                                                                                                             |
| Renata                | `dlg_renata_upstairs`               | `flag_visited_f2`, no other Renata node applies           | "How's up there? Don't tell me. I like it here. The plants are real."                                                                                                                                                                                                                                                                                                            |
| Renata                | `dlg_renata_f2_after`               | `key_employee_badge` held                                 | "Employee badge. A real one. You're still my new hire. That's forever; it's on a spreadsheet."                                                                                                                                                                                                                                                                                   |
| Gavin                 | `dlg_gavin_upstairs`                | in party, `flag_visited_f2`, `enc_director_review = open` | "Operations. They have the good coffee and no personality. Balanced."                                                                                                                                                                                                                                                                                                            |
| Gavin                 | `dlg_gavin_rejoin`                  | hired, not in party, slot free                            | "Back? Fine. I kept the seat warm. It's a chair; they're always warm." → `party += cw_desk_challenger`                                                                                                                                                                                                                                                                           |
| Gavin                 | `dlg_gavin_rejoin_full`             | hired, not in party, party full                           | "Three's three. I'm not going to be the fourth chair. I've seen how the fourth chair is treated."                                                                                                                                                                                                                                                                                |
| Gavin                 | `dlg_gavin_f2_after`                | `flag_floor2_complete`                                    | "Permanent. Great. I've been permanent for nine years. It's mostly a chair."                                                                                                                                                                                                                                                                                                     |
| Priya                 | `dlg_priya_upstairs`                | `flag_visited_f2`, no other Priya node applies            | "You went up. Without a handout. Brave."                                                                                                                                                                                                                                                                                                                                         |
| Priya                 | `dlg_priya_rejoin`                  | hired, not in party, slot free                            | "Back on the team? I never updated the calendar. I knew." → `party += cw_meeting_prepper`                                                                                                                                                                                                                                                                                        |
| Priya                 | `dlg_priya_rejoin_full`             | hired, not in party, party full                           | "Full team. Send someone to their desk first. Send Gavin. Hypothetically."                                                                                                                                                                                                                                                                                                       |
| Holloway              | `dlg_holloway_sign_transfer`        | `asg_transfer = photo_taken`                              | "A transfer form. To Operations. Kessler." · "He'll make you stand too. He learned it from me. He'll say he didn't." · "Signed. Don't tell him I read it." → gain `key_transfer_form` (toast "Got: Transfer Form (signed)"), `asg_transfer = signed` → objective: **File the packet at People Ops** · FLOOR 2                                                                    |
| Holloway              | `dlg_holloway_upstairs`             | `signed` or later, `enc_director_review = open`           | "Kessler counts. Bring everyone. Then bring the count."                                                                                                                                                                                                                                                                                                                          |
| Holloway              | `dlg_holloway_f2_after`             | `key_employee_badge` held                                 | "Permanent. Congratulations. I'm still interim. Four years. It's a lifestyle."                                                                                                                                                                                                                                                                                                   |
| `poi_vending_machine` | prompt "Print receipts"             | `asg_audit = accepted`                                    | _(purchases made)_ "You press RECEIPT. It prints two point three metres. Someone has been busy. It was you." · _(none)_ "You press RECEIPT. Two point three metres of blank. It has never sold anything. It's still proud." → gain `key_receipt_roll` (toast "Got: Receipt Roll (2.3 m)"), `asg_audit = receipts_held` → objective: **Bring the receipts to Whitlock** · FLOOR 2 |
| `poi_elevator_door`   | prompt "Elevator"                   | `key_access_badge` held                                   | opens `ovl_elevator_panel` (§8.2) instead of the Floor 1 `FLOOR 2` confirm — after the first celebration has been seen                                                                                                                                                                                                                                                           |

Objective banner on Floor 1 after the preview: `FLOOR 1 CLEARED · Floor 2 under construction`
becomes **Take the elevator to Floor 2** · ELEVATOR LOBBY (pin on the doors) until the first ride;
after that, the banner always shows the live Floor 2 objective with a floor destination chip when
the target is upstairs (§10.1).

---

## 3. Party on Floor 2 — seats, not hires — **FROZEN**

### 3.1 Model

Floor 1's party model stands (§3 there). One rule is added:

- **`hired`** is the list of coworkers who have ever accepted an Offer Letter. `party` holds the
  lead plus up to two members of `hired`. A hired coworker not in the party is **at their desk**
  (their map tile, on their floor), at full HP/PP, and rejoins for free by talking to them
  (`dlg_*_rejoin`) whenever a seat is free.
- **Sending someone to their desk** is free, never loses anything, and is done from the team
  panel (§3.2). The letter was the hire; the seat is just who is in the room. A dismissed member
  keeps their current HP/PP (they are not healed by being benched — the break room is still the
  heal).
- The lead cannot be sent anywhere. `PARTY_MAX` stays 3.

Why not a fourth seat: Floor 2 has one recruit, so a fourth seat would ship half-empty again, and
the bench picker / strip / stakes cards are all built for three. The roster rule costs one list
and two actions, gives the party system a second verb, and turns "your coworkers stay at their
desks" from a joke into a mechanic.

### 3.2 Recruit card, full variant, and roster mode

When `dlg_teddy_offer_full` ends, `ovl_recruit_card` shows the standard card with the `TEAM` row
full and the buttons `[Make room]` (primary) · `[Not yet]` ⎋. `[Make room]` opens `ovl_team_panel`
in **roster mode**: every coworker row gains a secondary button **Send to desk** (≥ 54 px); the lead
row has none. Pressing it opens `ovl_confirm`:

```
SEND GAVIN TO HIS DESK?
He keeps his HP, his PP and his opinions. Talk to him at his desk to bring him back.
[ Send ]                                   [ Keep ]
```

`[Send]`: row empties left-to-right (200 ms, RM instant), toast "Gavin's at his desk. Floor 1.",
`menuBack`, the panel closes and the recruit card returns with the `+` slot outlined gold. Esc /
`[Keep]` returns to the card unchanged. `coach_roster` fires the first time `[Make room]` is shown:
"**TEAM** — three seats. Sending someone to their desk is free. So is bringing them back."
Dismisses on any card action; never returns on that save (`flag_roster_coached`).

Roster mode is also available from the normal team panel at any time on either floor (the same
button), so a player can reshuffle before Kessler without a recruit card. Empty rows in the team
panel now read: "Open seat · Gavin is at his desk (Floor 1)" when a hired coworker is benched;
otherwise Floor 1's letter-keyed lines.

Stakes cards, door prompts and the strip show only the party, as before. The celebration shows the
party at the moment of the ride.

### 3.3 Coworker kit — `cw_help_desk_intern`

| Recruit def id        | Name  | Portrait | HP  | ATK | DEF | SPD | Types       | Moves (dmg · type · PP · extra)                                                                                                                                            |
| --------------------- | ----- | -------- | --- | --- | --- | --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cw_help_desk_intern` | Teddy | `intern` | 75  | 9   | 10  | 10  | `technical` | Have You Tried Restarting · 11 · `technical` · 15 PP · heals 6 — Reply All · 9 · `influence` · 12 PP · 40% Burned Out (DoT) on enemy — Escalate · 14 · `technical` · 10 PP |

Move descriptions: Have You Tried Restarting — "Turns it off and on. Including you."; Reply All —
"Per my last email. Everyone's."; Escalate — "Now it's someone else's problem." Role: chip damage
over time plus a small self-sustain; the party's first DoT. `desc`: "Rotational intern. Month
fourteen." Kit is `PlayerClass`-shaped like the Floor 1 recruits (`perk: none`, no upgrades).

Intended loop against Kessler: Teddy opens with Reply All (Burned Out ticks through the transform —
statuses on the enemy clear at phase 2, so land it again after), switch to the lead for the big
hits, switch to Gavin to eat Right-Size when the lead is low.

---

## 4. Activities — stages and copy

### 4.1 Required: "Make it official" — `asg_transfer`

| #   | Stage         | Where                     | Player does                 | Copy / feedback                                                                      | Objective banner after (destination)        |
| --- | ------------- | ------------------------- | --------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------- |
| 0   | `not_started` | Help desk                 | Talk to Teddy               | `dlg_teddy_packet`                                                                   | Take a badge photo (HELP DESK)              |
| 1   | `accepted`    | Booth `(12,2)` ↑          | Take photo                  | flash frames, toast "Got: Badge Photo (eyes closed)"                                 | Get Holloway's signature (**FLOOR 1**)      |
| 2   | `photo_taken` | Floor 1, Holloway `(6,3)` | Ride down, talk to Holloway | `dlg_holloway_sign_transfer`, toast "Got: Transfer Form (signed)"                    | File the packet at People Ops (**FLOOR 2**) |
| 3   | `signed`      | Tray `(17–19,4)` ↑        | File the packet             | receipt `TRANSFER PACKET — FILED` **+12 📈**, Offer Letter ×1; photo + form consumed | Report back to Teddy (HELP DESK)            |
| 4   | `filed`       | Help desk (his sightline) | Teddy's compliance callout  | `dlg_teddy_filed` → stakes card                                                      | (battle) → See Kessler (DIRECTOR'S OFFICE)  |
| 5   | `complete`    | —                         | —                           | Counts toward the director gate                                                      | —                                           |

The activity is Floor 1's printer loop with the middle step on another floor. The player learns the
elevator is two-way because the required path needs it, once, at a moment when the walk on Floor 1
is seven tiles. Nothing on Floor 1 has to be re-fought or re-done; the visit is a signature and
whatever the player chooses to batch with it (§4.2, vending, re-hiring a benched coworker).

### 4.2 Optional: "The audit" — `asg_audit`

| #   | Stage           | Where                      | Player does                            | Copy / feedback                                                                                                                           | Objective banner after (optional style, destination) |
| --- | --------------- | -------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0   | `not_started`   | Finance door `(19,9–11)`   | Enter Whitlock's sightline, take it on | `dlg_whitlock_hook` → `dlg_whitlock_request`                                                                                              | Print the vending receipts (**FLOOR 1**)             |
| 1   | `accepted`      | Floor 1 vending `(21,9)` → | Print receipts                         | `poi_vending_machine` new prompt; toast "Got: Receipt Roll (2.3 m)"                                                                       | Bring the receipts to Whitlock (**FLOOR 2**)         |
| 2   | `receipts_held` | Finance                    | Deliver                                | receipt `AUDIT — RECONCILED` **+10 📈**; the roll is consumed; shredder flips to `shredding` frames while `dlg_whitlock_after` is showing | (cleared) → Whitlock offers the fight                |
| 3   | `complete`      | —                          | —                                      | `enc_auditor` available via `dlg_whitlock_challenge`                                                                                      | —                                                    |

Batching is the design intent: Teddy's `dlg_teddy_hint_signature` names Whitlock and says "one
trip"; the directory names Finance; Whitlock's sightline covers the Finance doorway so a player who
peeks in gets the request. A player who skips Finance before riding down makes two trips — honest,
and the only cost is ~50 s.

---

## 5. Encounters — **FROZEN**

Same contract as Floor 1 §5: content entries shaped like `Enemy` with `rank`, `boss`, `recruit`,
explicit `xp`/`options`; never in `ENEMY_POOLS`; legacy AI; explicit payouts, never `applyVictory`.
Ranks continue the ladder (Floor 1 used 0–2).

| Encounter id           | Opponent | Rank | Boss | Recruit unlocked      | HP  | ATK | DEF | Types                    | Battle sprite | XP  | 📈 OPT | Declinable | Phase 2 |
| ---------------------- | -------- | ---- | ---- | --------------------- | --- | --- | --- | ------------------------ | ------------- | --- | ------ | ---------- | ------- |
| `enc_help_desk_intern` | Teddy    | 3    | no   | `cw_help_desk_intern` | 95  | 12  | 8   | `technical`              | `intern`      | 36  | 15     | yes        | —       |
| `enc_auditor`          | Whitlock | 4    | no   | —                     | 120 | 14  | 10  | `analytics`              | `boss`        | 43  | 21     | yes        | —       |
| `enc_director_review`  | Kessler  | 5    | yes  | —                     | 170 | 16  | 12  | `execution`, `analytics` | `vp`          | 55  | 32     | **no**     | **yes** |

### 5.1 Move sets and battle copy

**Teddy — title `THE ROTATIONAL INTERN`** · taunt: "Please hold. You're my only ticket." · defeat:
"Teddy closes the ticket, reopens it to add a note, and closes it again."

| Move                      | Dmg | Type        | Extra                    |
| ------------------------- | --- | ----------- | ------------------------ |
| Have You Tried Restarting | 12  | `technical` | heals 8                  |
| Reply All                 | 10  | `influence` | 30% Burned Out on player |
| Escalate                  | 15  | `technical` | —                        |

**Whitlock — title `THE EXTERNAL AUDITOR`** · taunt: "Every receipt. Every quarter. Every one of
you." · defeat: "Whitlock initials the ledger. Once. In pencil."

| Move        | Dmg | Type        | Extra                      |
| ----------- | --- | ----------- | -------------------------- |
| Line Item   | 14  | `analytics` | —                          |
| Discrepancy | 18  | `analytics` | 40% Micromanaged on player |
| Reconcile   | 8   | `analytics` | heals 14                   |

**Kessler — title `THE DIRECTOR OF OPERATIONS`** · taunt: "There's no rescheduling." · defeat:
"Kessler uncrosses his arms. It takes a moment; they've been like that since March."

Phase 1 (170 HP · ATK 16 · DEF 12 · `execution`,`analytics`):

| Move                | Dmg | Type        | Extra                      |
| ------------------- | --- | ----------- | -------------------------- |
| Process Improvement | 15  | `execution` | 40% Micromanaged on player |
| KPI Review          | 19  | `analytics` | —                          |
| Headcount Freeze    | 11  | `analytics` | 50% Demoralized on player  |

Phase 2 — **"Kessler (Restructuring)"**, triggers at ≤ 50% of phase-1 HP, taunt "Let's
restructure." (100 HP · ATK 18 · DEF 10 · `strategy`,`execution`):

| Move        | Dmg | Type        | Extra                       |
| ----------- | --- | ----------- | --------------------------- |
| Restructure | 20  | `strategy`  | —                           |
| Right-Size  | 26  | `execution` | 85% accuracy                |
| Synergy     | 12  | `influence` | heals 16, Motivated on self |

Sanity math (`calcDamage`, level bonuses +2 ATK / +1 DEF per team level; a full-route team enters
Floor 2 at level 2 and reaches level 3 after Teddy): a level-3 PM (ATK 20, DEF 13) hits phase-1
Kessler for ~30 (Prioritize Backlog) / ~47 (Ship MVP) and phase 2 for ~54 (strategy is super
effective against `strategy`/`execution`); ~5–6 hits to clear 85 + 100 HP. Kessler lands ~23
(KPI Review) in phase 1 and ~41 (Restructure on a PM) in phase 2, and the transform spends his
turn. Two switches each way give him ~7 turns ≈ 230 damage against a three-member team with
~245 HP plus level-up heals — winnable with a PTO Day or two Espressos and one forced switch,
tense without. **A solo lead is not realistically winnable, by design**; the door prompt says so in
words (§8.1) and the roster rule means every player can field a team. Whitlock at rank 4 is a mid
fight (his analytics hit PMs neutrally, Engineers and Designers harder). Retune HP/DEF after the
first playtest, not rewards.

Type notes for tuning: Kessler phase 1 resists nothing cleanly (execution+analytics cancel most
match-ups to 1×); phase 2 takes 1.5× from `strategy` and neutral from everything else, so the PM's
kit is the closer while the Engineer's raw ATK does the work. Everyone gets hit super-effectively
by one of his moves; that is boss-shaped on purpose.

### 5.2 Stakes cards — exact copy

```
COMPLIANCE · RANK 3
Teddy — IT Help Desk (Rotational)
WIN    +36 XP · +15 📈 · Offer eligible
LOSE   Facilities, walk back. Nothing lost.
TEAM   [●YOU 96/100]  [●GAVIN 70/70]  [●PRIYA 80/80]
[ Begin training ]                  [ Later ]
```

```
AUDIT · RANK 4
Whitlock — External Auditor
WIN    +43 XP · +21 📈
LOSE   Facilities, walk back. Nothing lost.
TEAM   [●YOU 96/100]  [●GAVIN 70/70]  [ + ]
[ Open the books ]                  [ Not today ]
```

```
REVIEW · RANK 5 · BOSS
Kessler — Director of Operations
WIN    +55 XP · +32 📈 · Transfer approved · Promotion
LOSE   Facilities, walk back, try again.
       No rescheduling.
TEAM   [●YOU 88/100]  [●GAVIN 70/70]  [●TEDDY 75/75]
[ Begin ]
```

Encounter title cards (§13 beat): Teddy `COMPLIANCE TRAINING` with eyebrow `MODULE 1 OF 1`;
Whitlock `THE AUDIT` with eyebrow `RECEIPTS, PLEASE`; Kessler `OPERATIONS REVIEW` with eyebrow
`NO RESCHEDULING`. "Offer eligible" / "Offer letters: 0" follow Floor 1's rule. Whitlock's card has
no offer line at all (he is not recruitable; an absent line is correct here, a dim "not
recruitable" would be a control explanation).

### 5.3 Phase 2 — the rule and the beat

Floor 1 §3.4 wrote the rule: _a phase-2 transition happens to the enemy regardless of who is
active_. Kessler is the first encounter to use it, through the existing `phase2` path in
`turn.ts` (threshold 50% of phase-1 `maxHp`, enemy statuses cleared, the enemy spends the turn
transforming). Presentation is the tower's: pause, `💥 Let's restructure.`, `⚠️ PHASE 2`, sprite
flash, HP bar refills to 100 with the new name `Kessler (Restructuring)`. The active member's
statuses are **not** cleared (only the enemy's), so a Burned Out or Demoralized member stays that
way — switching remains the way out.

---

## 6. Loss and recovery flow

Floor 1 §6, with Floor 2 placements: `ovl_interstitial_minute` shows the opponent's
`dlg_*_you_lost`; fade to Facilities at `(11,11)` facing the coffee machine; whole party restored;
toast "You take five. Everyone's back."; the encounter stays `open`. Walk-backs from the respawn:
Teddy 13 tiles, Whitlock 20, Kessler's door 12. A loss on Floor 1 while visiting (Gavin or Priya, if
still open) respawns at Floor 1's `(19,8)` as before — you recover on the floor you fell on.

Benched-at-desk coworkers are unaffected by a wipe (they were not in the room).

---

## 7. Economy touchpoints

### 7.1 Floor 2 ledger (`rwd_*`) — max **90**

| Ledger id                   | Options | XP  | When                       | Receipt                          | Footer                                        |
| --------------------------- | ------- | --- | -------------------------- | -------------------------------- | --------------------------------------------- |
| `rwd_asg_transfer`          | +12     | —   | Packet filed at the tray   | `TRANSFER PACKET — FILED`        | "Stapled to everything. Even this."           |
| `rwd_enc_help_desk_intern`  | +15     | +36 | Teddy won                  | `COMPLIANCE — PASSED`            | "Module 1 of 1. Certificate pending forever." |
| `rwd_asg_audit`             | +10     | —   | Receipts delivered         | `AUDIT — RECONCILED`             | "Reimbursed from his own wallet. Don't ask."  |
| `rwd_enc_auditor`           | +21     | +43 | Whitlock won               | `THE AUDIT — CLOSED`             | "Initialled in pencil. Framed anyway."        |
| `rwd_enc_director_review`   | +32     | +55 | Kessler won                | `OPERATIONS REVIEW — PASSED`     | "Aligned. Whatever that costs."               |
| `rwd_promotion_f2`          | 0       | —   | Perk offer rolled (once)   | — (promotion screen is the beat) |                                               |
| **Required route subtotal** | **59**  | 91  | transfer + Teddy + Kessler |                                  |                                               |
| **Full-floor maximum**      | **90**  | 134 | + audit + Whitlock         |                                  |                                               |

Receipt rows follow Floor 1's vocabulary. `TRANSFER PACKET — FILED` rows: `Stock Options +12 📈` ·
`Offer Letter ×1 📄`. `OPERATIONS REVIEW — PASSED` rows: `XP +55` · `Stock Options +32 📈` ·
`Transfer approved ✓` · `Promotion →`. `EMPLOYEE BADGE — ISSUED` (not a ledger row, no Options):
`Employee Badge 🪪`, footer "Eyes closed. Permanent." Recruiting still pays nothing; the Signing
Bonus perk receipt is unchanged and still not a ledger row.

Team XP: Floor 1 full route ends at level 2 (37/55). Teddy +36 → **level 3** (18/80); Whitlock +43
→ 61/80; Kessler +55 → **level 4** (36/105). Required-only: 15/55 → Teddy 51/55 → Kessler → level 3
(51/80). Level-up heals apply to standing members as before.

Celebration `Options earned` sums Floor 2 `rwd_*` ids only (90 / 59). The Floor 1 celebration is
unchanged at 65 / 48.

### 7.2 Vending (Facilities) — Floor 2 stock

| Item (existing id) | Price | Stock | Why it's here                                                                            |
| ------------------ | ----- | ----- | ---------------------------------------------------------------------------------------- |
| `espresso`         | 14 📈 | 2     | Same safety valve as Floor 1                                                             |
| `pto_day`          | 24 📈 | 1     | 50 HP — the phase-2 answer. Affordable after the packet + Teddy (27 on this floor alone) |
| `standing_desk`    | 22 📈 | 1     | +4 DEF and 15 HP: the "I'm going solo-ish into Kessler" purchase                         |

Prices are `shopPrice` at floor 0 (×1) as on Floor 1; perks owned after Floor 1's promotion apply
as they would. Stock is per machine: the Floor 1 machine keeps its own remaining stock; neither
restocks. Wellness Day is still not sold. `MAX_INVENTORY = 4` still applies.

---

## 8. Progression, gates and the elevator

```
arrive (3,2) ──► Teddy packet ──► photo ──► ELEVATOR ▼ Floor 1 ──► Holloway signs ──► ELEVATOR ▲ ──► tray files (+12, letter)
                                                       │ (optional, same trip) vending prints receipts ─────────────┐
                                                       ▼                                                            ▼
        Teddy sightline ──► compliance stakes ──► WIN ──► receipt ──► OFFER? (full → Make room) ──► Teddy joins    Whitlock reconciles (+10) ──► audit stakes ──► WIN (+21)
                    │ LOSE ──► Facilities ──► walk back ──┘
                    ▼
   door (3,9): gate met? ──no──► plain doorway; Kessler explains what's missing
             │ yes
             ▼
 "Step in?" [Step in] [Not yet] ──► sightline ──► Kessler stakes [Begin] ──► fight, PHASE 2 at 50% ──► WIN
                                                     │ LOSE (wipe) ──► Facilities ──► door again
                                                     ▼
          receipt ──► promotion MADE PERMANENT ──► Kessler signs ──► badge printer prints ──► reader green
                                                                                                │
                                                                                                ▼
                                            panel lists 3 ──► "Ride up?" ──► FLOOR 2 CLEARED ──► back to (3,2)
```

### 8.1 Director gate and door prompt

Gate: `asg_transfer = complete` AND `enc_help_desk_intern = won`. Party size is not a gate. Until
then `(3,9)` is a normal doorway and Kessler just talks. Stepping onto `(3,9)` with the gate open
and the boss unbeaten opens `ovl_door_prompt`:

```
DIRECTOR'S OFFICE
Kessler's review starts when you step in. He doesn't do one-on-ones — bring everyone.
TEAM   [●YOU 88/100]  [●GAVIN 70/70]  [●TEDDY 75/75]      📈 46
[ Step in ]                                [ Not yet ]
```

"Not yet" ⎋ steps back to `(3,8)` facing north with `menuBack`. "Step in" places the player at
`(3,10)` facing south, inside Kessler's sightline, and `dlg_kessler_review` fires. All fainted: the
card reads "Your team needs a minute. Facilities first." with `[Back]` and the pin jumps to the
coffee counter. With a solo party the second line of the prompt is replaced by "He doesn't do
one-on-ones. Your coworkers are at their desks; they'll come." — a nudge, not a gate.

**Promotion**: on Kessler's win the engine rolls `rollPerkOffer(run.perks, rng, BASE_PERK_POOL)`
into `pendingPerkOffer`, **saves**, then shows `screen_promotion` with headline `MADE PERMANENT`,
sub-line "Pick one. Operations calls it a competency. It applies to the whole team." Ledger
`rwd_promotion_f2`. Return: `(3,10)` facing south, `dlg_kessler_beaten` continues.

**Badge**: Kessler's win sets the encounter but the badge is physical — the printer at `(11,2)`
issues `key_employee_badge` (§2.4). Objective **Print your badge** · HELP DESK runs between them so
the player crosses the floor once with every `after` line live, and Teddy's desk is where the
floor began. Reader LED flips green when the badge is held.

### 8.2 The elevator — how it works, thematically and mechanically

One shaft. The same three tiles on every floor, the same red rug in front of it, the same arrival
tile `(3,2)` facing south with the doors open behind you. The cab has a panel; the panel is the
only place floors are chosen. **Badges are access levels, not keys**: the laminated visitor badge
from Holloway opens Floors 1–2; the employee badge from Kessler adds 3. A floor you can't reach is
listed anyway, greyed, with the reason — nothing about the building is hidden, only locked.

`ovl_elevator_panel` (opens from "Elevator" on either floor once `key_access_badge` is held; on a
fresh Floor 1 save before the badge the Floor 1 red-reader line still plays):

```
┌ ELEVATOR ────────────────────────────────┐   eyebrow gold, display-2xs
│  3   FLOOR 3                Badge required│   row disabled (40%), red LED dot · with employee badge: "Under construction" enabled → ride = FLOOR 2 CLEARED
│  2   OPERATIONS             You are here  │   current floor: inert, dim
│  1   YOUR TEAM              Renata · Gavin│   destination rows: floor number display-md, name display-sm, sub-line --body-sm dim
│                                 [ Stay ]  │   Esc / secondary
└──────────────────────────────────────────┘
```

Rows are ≥ 54 px buttons; ↑/↓ moves focus, Enter rides, Esc = Stay. The sub-line for Floor 1
lists who is at their desk there (hired coworkers not in the party), so the panel doubles as the
roster reminder. Riding: doors close over the avatar (400 ms), `elevatorUp` (down rides reuse the
same cue; a `elevatorDown` variant is a §14.4-style deferral), fade to `--cc-bg` 300 ms, fade in on
the destination at `(3,2)` facing south with the doors open behind, zone chip announces LANDING /
ELEVATOR LOBBY, the objective banner re-evaluates for the new floor. Total ~1.4 s; RM: cuts to the
fades' end states. `stats.rides` increments.

**First ride only**: Floor 1's celebration (`screen_preview_complete`) plays as before, with its
button row changed to `[Floor 2]` (primary) · `[Back to Floor 1]` · `[Title]`, and its dim line
changed to "Floor 2 is Operations. The elevator goes both ways." Every later ride between 1 and 2
is just a ride. Riding to 3 with the employee badge plays `screen_floor2_complete` (§10.4); riding
again replays it, no receipt, as Floor 1 does.

**What travels**: the party (they are in the elevator with you), the bag, the wallet, key items.
**What stays**: every NPC at their tile; every floor's state; the vending stock of each machine.
Recruited coworkers still don't follow on the map — on either floor.

**Objectives across floors** (§10.1): when the objective's target is on another floor the
destination chip reads `→ FLOOR 1` / `→ FLOOR 2` in the landing accent and the pin sits on this
floor's elevator doors; the edge arrow points at the elevator. When the target is on this floor,
Floor 1's rules apply unchanged.

---

## 9. Pacing, copy and tutorial weave

### 9.1 Targets and estimates

Assumptions are Floor 1's (4 tiles/s, ~2.5 s a line, ~2 s a receipt, ride ~1.4 s + fades).
Tile counts are from the frozen map (`src/content/office/floor2.ts`).

| Beat                                                | Tiles      | Reading / cards               | Estimate                                                              |
| --------------------------------------------------- | ---------- | ----------------------------- | --------------------------------------------------------------------- |
| Arrive → callout → Teddy → packet                   | 6          | 1 + 3 lines                   | 0:20                                                                  |
| Photo booth                                         | 7          | 2 lines, flash, toast         | 0:15                                                                  |
| Ride down, Holloway signs, ride up                  | 11 + 6 + 6 | 3 lines, 2 rides              | 1:00                                                                  |
| _(optional, same trip)_ Whitlock + Floor 1 receipts | +8 +46     | 4 lines, toast                | +0:55                                                                 |
| People Ops tray                                     | 17         | 2 lines, receipt              | 0:30                                                                  |
| Teddy compliance: lines, card, **battle 1**         | 8          | 2 lines, card, ~60–75 s fight | 1:40                                                                  |
| Recruit (+ roster if full)                          | 0          | 2–4 lines, 1–2 cards          | 0:15–0:35                                                             |
| Vending stop (recommended)                          | 21         | shop                          | 0:30                                                                  |
| _(optional)_ **Whitlock fight**                     | 12         | 1 line, card, ~75 s           | +1:40                                                                 |
| Door, Kessler's 4 lines, **boss with phase 2**      | 13         | ~3–4 min fight                | 4:00                                                                  |
| Receipt, promotion, Kessler's lines                 | 0          | receipt, pick, 2 lines        | 0:40                                                                  |
| Badge printer                                       | 15         | 1 line, frames, receipt       | 0:25                                                                  |
| Elevator, celebration                               | 11         | panel, ride, screen           | 0:25                                                                  |
| **Required route**                                  | ~100       |                               | **~10–12 min** with one loss; ~8:30 for a fast reader who never loses |
| **Full route**                                      | ~165       |                               | **~13–16 min**                                                        |

First objective visible: ~3 s (callout on the first step). First battle: ~4 min in — later than
Floor 1's 2:10 because the round trip sits before it; that is the floor's shape (the elevator
_is_ the new thing) and the trip has three jokes and a receipt in it. Risk: the full route can
pass 15 minutes for a slow reader with two losses; the fix, if wanted, is to move the vending stop
or accept it — not to cut the audit.

### 9.2 Copy rules

Floor 1 §9.2, unchanged. Two additions for a second floor: every Floor 1 NPC has at least one line
that acknowledges you've been upstairs (nobody on Floor 1 may be frozen in the Floor 1 present),
and no line on either floor says "Floor 2 isn't finished" any more (§2.5 copy changes).

### 9.3 Tutorial weave

Floor 2 adds **one** coach mark, `coach_roster` (§3.2), at the first moment the roster matters
(the full-party offer). It never fires for a player with a free seat. Everything else — the
elevator, the second floor, the boss transform — is taught by the world: Teddy names the floor and
the elevator, the panel lists the floors with their reasons, and phase 2 is announced by the
existing battle beat. `coach_move` / `coach_interact` / `coach_switch` do not re-fire.

---

## 10. Presentation deltas (everything else is Floor 1 §10–§13)

### 10.1 HUD

- `hud_objective` destination chip gains a **floor destination** style: `→ FLOOR 1` / `→ FLOOR 2`
  in the landing accent (`#e0844d`) with a small `▲`/`▼` glyph before the text. The pin sits on the
  elevator doors of the current floor. Live region: "Objective: Get Holloway's signature. Floor 1.
  Take the elevator."
- `hud_zone_chip` unchanged; Floor 2 labels are §1.3.
- Title / `screen_office_start` summary line reads the current floor: "Floor 2 · Team of 3 · 📈
  46 · 18:02 in". Team panel header: `TEAM · FLOOR 2`.

### 10.2 Overlays added

| Id                           | Type    | Purpose                              | Entered from → returns to                              |
| ---------------------------- | ------- | ------------------------------------ | ------------------------------------------------------ |
| `ovl_elevator_panel`         | overlay | choose a floor (§8.2)                | "Elevator" prompt → ride or `[Stay]` at the same tile  |
| `ovl_team_panel` roster mode | mode    | send a coworker to their desk (§3.2) | `[Make room]` or the panel's own button → card / panel |
| `screen_floor2_complete`     | screen  | Floor 2 Cleared celebration (§10.4)  | panel ride to 3 → `(3,2)` facing south on Floor 2      |

### 10.3 Tile states (Floor 2 additions to `TileStates`)

| Prop           | States                                    | Driven by                                                        |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Photo booth    | idle / flash (2 frames, 220 ms)           | flash while the "Three. Two—" line is up                         |
| Badge printer  | idle / printing (2 frames, 600 ms) / done | `enc_director_review` won → prompt → 1.8 s printing → badge held |
| Shredder       | idle / shredding (2 frames, 500 ms)       | while `dlg_whitlock_after` is showing                            |
| Server racks   | 2 frames, 900 ms, always                  | — (reduced motion holds frame 0)                                 |
| Supply cabinet | closed / open                             | first open                                                       |
| Coffee counter | idle / steaming                           | in zone_facilities or on recover, as Floor 1                     |
| Vending        | idle / lit                                | faced, as Floor 1                                                |
| Reader         | red blink / green steady                  | `key_employee_badge`                                             |
| Elevator       | closed / open                             | while the panel is open and during the ride out                  |

Floor 1's `tileStates` rules stand for the shared props.

### 10.4 `screen_floor2_complete`

Same layout as `screen_preview_complete`:

```
FLOOR 2 CLEARED                                     display-xl, gold
You took a photo with your eyes closed, got audited, passed compliance,
and were made permanent. That's tenure.             --body-lg

[●YOU] [●GAVIN] [●TEDDY]                            party at the moment of the ride, names beneath
Assignments  2 / 2          Battles won  3
Losses  0                   Switches  4
Options earned  90 📈       Time on floor  12:08     (Floor 2 time only)

Floor 3 exists. Nobody has mapped it yet.          --body-md dim
The elevator still goes down.

[ Back to Floor 2 ]        [ Floor 1 ]        [ Title ]
```

The second line adapts: "got audited" only if `asg_audit = complete`, else "dodged an audit";
"hired the intern" replaces "passed compliance" if Teddy was recruited. `fanfare` on mount; counts
up 600 ms (RM instant). `flag_floor2_complete` set. After it, the objective banner reads **FLOOR 2
CLEARED · Floor 3 unmapped** on Floor 2 and **Take the elevator to Floor 2** on Floor 1 only if
something on Floor 2 is still open (an unfinished audit, an unhired Teddy); otherwise `FLOOR 2
CLEARED · Floor 3 unmapped` on both.

### 10.5 Empty and edge states (additions to Floor 1 §10.13)

| State                                            | What the player sees                                                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| Full party at Teddy's offer                      | recruit card with `[Make room]`; `coach_roster`; team panel roster mode                                            |
| Hired coworker benched, on the other floor       | team panel empty row "Open seat · Gavin is at his desk (Floor 1)"; elevator panel sub-line lists him under Floor 1 |
| Solo at the director door                        | prompt's second line names the coworkers at their desks                                                            |
| Elevator with visitor badge only, on Floor 2     | Floor 3 row disabled "Badge required", red dot; first press adds the beep line                                     |
| Elevator on Floor 1 before any badge             | unchanged Floor 1 behaviour (red reader line)                                                                      |
| Floor 1 vending machine sold out, audit accepted | "Print receipts" prompt still works (the roll is a record, not stock)                                              |
| Receipts printed with zero purchases             | blank-roll variants of the vending and Whitlock lines                                                              |
| Reload mid-ride                                  | never persisted mid-ride; saves are written on arrival with `floorId` + `player` at `(3,2)`                        |
| Save from before Floor 2 existed (v1)            | migrates to v2: `floorId = floor_01`, `hired` = party coworkers, new assignments `not_started`, encounters `open`  |

---

## 11. Asset delivery — what this branch ships

All art here is hand-authored pixel art in the Floor 1 language (plum ink `#1b1726`, top-left
light, lit/base/shadow ramps, no gradients, no anti-aliasing), regenerable from the scripts. No
emoji, no rectangles, no placeholder strings.

**Tileset** (`scripts/gen_office_tiles.py` → `public/office/tiles.png` 272×1050, 165 cells;
`src/screens/office/tileAtlas.ts`). Floor 2 cells are appended after every Floor 1 cell, so the
108 Floor 1 indices are unchanged and the Floor 1 sheet region is byte-identical (verified during
authoring; `tileset.test.ts` still passes against the frozen Floor 1 map).

| Kind       | Cells                                                                                                                                                                                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floors     | `floor_it`, `floor_people`, `floor_director`, `floor_facilities`, `floor_finance` (landing and hall reuse `floor_elevator`, `floor_hall`)                                                                                                                                                                   |
| Rugs       | `rug_gold_l/r/c` (a 4×4 rug needs a field), `rug_navy_tbl/tb/tbr` (horizontal runner)                                                                                                                                                                                                                       |
| Doorway    | `door_v_single` (one-tile opening in a vertical wall — Floor 1 only had 3-tall partitions)                                                                                                                                                                                                                  |
| Wall decor | `plaque_ops_l/m/r` (OPERATIONS / FLOOR 2), `ticketboard_l/r`, `orgchart_l/r`, `incident_l/r` (DAYS SINCE REORG: 0), `compliance_poster`, `breaker_panel`, `calendar`, `server_status`, `sign_helpdesk`, `sign_people`, `sign_finance`, `sign_pantry`, `nameplate_kessler`                                   |
| Props      | `directory_f2`, `server_rack_0/1`, `photo_booth_idle` + `_flash_0/1`, `badge_printer_idle` + `_printing_0/1` + `_done`, `filing_closed/open`, `sofa_l/r`, `pcounter_l/m/r` (the tray with the face), `exec_desk_l/r`, `locker`, `janitor_cart`, `safe`, `shredder_idle` + `_shredding_0/1`, `btable_f2_l/r` |
| Font       | 3×5 signage font gained `J Q V W Y Z 0 3–9 - :`                                                                                                                                                                                                                                                             |

**Actor sheets** (`scripts/gen_office_actors.py` → `public/office/actors/{teddy,kessler,whitlock}.png`,
128×160 RGBA, 4×4, same chibi rig, walk cycle and ink as the Floor 1 cast). Teddy: messy brown
hair, navy blazer over a light shirt and short red tie, tan chinos, backpack (seen from behind,
straps from the front), paper coffee cup. Kessler: blond slicked back, high hairline, navy suit
with a pocket square, grey-blue tie, slim dark folder with a brass clasp. Whitlock: swept white
hair, black suit, red tie, age lines under the eyes, green ledger. Palettes track the `intern`,
`vp`, `boss` portraits so the map body and the headshot agree. Registered in `ACTOR_IDS` /
`SPRITE_TO_ACTOR` (`intern → teddy`, `vp → kessler`, `boss → whitlock`); `overworld-actor.test.ts`
covers the files.

**Reused as-is**: every Floor 1 cell, the three portraits above via `Headshot` (focal points may
need one `HEADSHOT_FOCALS` entry each — check the crop on the small phone as part of §12),
`PromotionScreen`, `ShopScreen`, `RunCompleteScreen` layout, all SFX/haptics.

**Wired on this branch** (on top of PR #71's floor-keyed content and elevator ride): the Floor 2
map, zones, floors, rugs, decor, props and doorway in `tiles.tsx`; the three NPCs on the map with
their talk lines, sightlines and `NPC_ACTOR` entries; every Floor 2 POI prompt and inspect line;
the transfer packet from Teddy's callout through `filed` → `complete` (booth, Holloway's signature
downstairs, the tray's receipt and letter); Whitlock's `{n}` ledger line; Kessler's state lines;
Facilities take-five and vending; the Floor 2 directory; the per-floor objective chain with
`(Floor n)` destinations pinned on the elevator. **Astra's** (`docs/rpg/floor-2-engine-hooks.md`):
compliance training (Teddy's stakes card, fight, recruit, roster), the audit's receipts step and
fight, Kessler's door gate, review and phase 2, the badge printer, the employee badge / Floor 3 row,
the elevator panel, save v2 and per-floor vending stock.

---

## 12. Frozen content IDs — **FROZEN**

Additions only. Floor 1's table in `mvp-design.md` §15 stands in full.

| Kind         | Ids                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floor        | `floor_02` (`FloorId = 'floor_01' \| 'floor_02'`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Zones        | `zone_landing`, `zone_it`, `zone_people`, `zone_hall_f2`, `zone_director`, `zone_facilities`, `zone_finance`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| NPCs         | `npc_help_desk_intern` (Teddy), `npc_auditor` (Whitlock), `npc_director` (Kessler)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Encounters   | `enc_help_desk_intern` (rank 3), `enc_auditor` (rank 4), `enc_director_review` (rank 5, boss, phase 2)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Recruit defs | `cw_help_desk_intern` (Teddy)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Roster       | `hired: CoworkerId[]` on the save; actions `act_dismiss` (send to desk), `act_rejoin` (via `dlg_*_rejoin`); `PARTY_MAX` unchanged                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Screens      | `screen_floor2_complete`; `screen_promotion` reused with headline `MADE PERMANENT`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Overlays     | `ovl_elevator_panel`; `ovl_team_panel` roster mode; `ovl_recruit_card` full variant (`[Make room]`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Coach marks  | `coach_roster`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Receipts     | `rcpt_transfer_filed`, `rcpt_compliance`, `rcpt_audit_reconciled`, `rcpt_the_audit`, `rcpt_operations_review`, `rcpt_employee_badge`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Assignments  | `asg_transfer` (`not_started → accepted → photo_taken → signed → filed → complete`), `asg_audit` (`not_started → accepted → receipts_held → complete`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Key items    | `key_badge_photo`, `key_transfer_form`, `key_receipt_roll`, `key_employee_badge`; `key_offer_letter` cap raised to 3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| POIs         | `poi_elevator_door_f2`, `poi_directory_sign_f2`, `poi_photo_booth`, `poi_badge_printer`, `poi_server_rack`, `poi_help_desk`, `poi_people_tray`, `poi_filing_cabinets`, `poi_water_cooler_f2`, `poi_director_door`, `poi_director_desk`, `poi_supply_cabinet_f2`, `poi_break_counter_f2`, `poi_vending_machine_f2`, `poi_break_table_f2`, `poi_lockers`, `poi_janitor_cart`, `poi_safe`, `poi_shredder`                                                                                                                                                                                                                                                            |
| Triggers     | `trg_first_step_f2`, `trg_sight_help_desk_intern`, `trg_sight_auditor`, `trg_sight_director`, `trg_director_door`, `trg_elevator_ride_f2`, `trg_roster_coach`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Rewards      | `rwd_asg_transfer` 12, `rwd_enc_help_desk_intern` 15, `rwd_asg_audit` 10, `rwd_enc_auditor` 21, `rwd_enc_director_review` 32, `rwd_promotion_f2` 0 — `FLOOR_2_LEDGER_MAX = 90`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Flags        | `flag_visited_f2`, `flag_floor2_complete`, `flag_roster_coached`, `flag_reader_denied_f2`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Dialogue     | `dlg_teddy_{callout,packet,hint_photo,hint_signature,hint_file,filed,declined,you_lost,beaten,offer,offer_full,offer_declined,joined,rejoin,rejoin_full,party,no_letter,badge_pending,after,after_win}` · `dlg_whitlock_{hook,request,pass,waiting,delivered,challenge,declined,you_lost,beaten,recruit,after}` · `dlg_kessler_{early,teddy_pending,review,you_lost,beaten,after}` · Floor 1 additions `dlg_renata_{transfer,audit,upstairs,f2_after}`, `dlg_gavin_{upstairs,rejoin,rejoin_full,f2_after}`, `dlg_priya_{upstairs,rejoin,rejoin_full}`, `dlg_holloway_{sign_transfer,upstairs,f2_after}` · copy changes to `dlg_renata_badged`, `dlg_renata_after` |
| Shop         | Facilities vending stock: `espresso` ×2, `pto_day` ×1, `standing_desk` ×1 — stored per floor                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| Save         | `corporate-climb-office-save` **v2** (migration from v1 in `docs/rpg/floor-2-engine-hooks.md` §7); Classic untouched                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Stats        | `stats.rides`, `stats.msByFloor: Record<FloorId, number>` (celebration "Time on floor" per floor)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

Office save shape v2 (field names are part of the freeze):

```ts
interface OfficeSave {
  version: 2
  run: RunState
  party: PartyMember[]
  hired: CoworkerId[] // everyone who ever accepted a letter
  floorId: 'floor_01' | 'floor_02'
  player: { x: number; y: number; facing: 'n' | 'e' | 's' | 'w' } // on floorId
  assignments: Record<AssignmentId, string> // + asg_transfer, asg_audit
  encounters: Record<EncounterId, 'open' | 'won'> // + the three Floor 2 ids
  vendingStock: Record<FloorId, ItemId[]> // replaces run.shopStock as the source of truth
  keyItems: Record<string, number> // key_offer_letter ≤ 3
  rewardsClaimed: string[]
  flags: string[]
  firedTriggers: string[]
  stats: {
    battlesWon: number
    losses: number
    switches: number
    rides: number
    msByFloor: Record<FloorId, number>
  }
}
```

---

## 13. Route traces, state matrix and acceptance checklist

### 13.1 Required route (acceptance route: full party from Floor 1, roster swap at Teddy)

1. Ride from Floor 1 (celebration `[Floor 2]` or the panel). Arrive `(3,2)` facing south; zone chip
   LANDING. First step → `dlg_teddy_callout` (`!` over Teddy through the glass); banner **Talk to
   Teddy → HELP DESK**; pin on him. `[flag_visited_f2]`
2. Walk `(3,3) → (5,3) → (6,3)D → (8,3)` (6), face east → `dlg_teddy_packet`. `[asg_transfer =
accepted]` Banner: photo → HELP DESK; pin on the booth.
3. Walk `(8,4) → (12,4) → (12,2)` (7), face north → "Take photo" → flash → toast. `[photo_taken,
key_badge_photo]` Banner: **Get Holloway's signature → ▼ FLOOR 1**; pin on the elevator doors.
4. Walk back to `(3,2)` (11), face north → `ovl_elevator_panel` → **1 · YOUR TEAM** → ride. Arrive
   Floor 1 `(3,2)` facing south; banner now pins Holloway. Walk `(4,2) → (6,2)` (3), face south →
   `dlg_holloway_sign_transfer` → toast. `[signed, key_transfer_form]` Banner: **File the packet →
   ▲ FLOOR 2**; pin on the doors. Renata/Gavin/Priya have their upstairs lines if visited.
5. Ride up. Walk `(3,3) → (6,3)D → (8,3) → (8,4) → (12,4) → (12,3) → (14,3)D → (16,3) → (16,4) →
(17,4)` (17), face north → "File" → 2 lines → receipt `TRANSFER PACKET — FILED` (+12 📈, Offer
   Letter ×1 — `hud_letters` shows `📄 ×1`). `[filed]` Banner: report back → HELP DESK.
6. Walk `(16,4) → (16,3) → (14,3)D → (10,3)` (8). This path enters through the People Ops door,
   not the hall, so the sightline at `(9,4–6)` is not crossed; talk directly, facing west →
   `dlg_teddy_filed` → stakes `COMPLIANCE · RANK 3` → `[Begin training]` → title card `COMPLIANCE
TRAINING`. **Battle 1** (~4:00 elapsed). `[asg_transfer = complete]` (A player who returns via
   the hall is caught by the sightline at `(9,6)` instead — same node, same card.)
7. Win → return to `(10,3)` facing west, Teddy facing you → receipt `COMPLIANCE — PASSED` (+36 XP →
   **TEAM LEVEL 3** row, +15 📈, Offer eligible ✓) → `dlg_teddy_beaten` → party is full →
   `dlg_teddy_offer_full` → recruit card `[Make room]` → `coach_roster` → team panel roster mode →
   **Send to desk** on Priya → confirm `[Send]` → toast "Priya's at her desk. Floor 1." → card
   returns, `+` slot gold → `[Extend the offer]` → `fanfare` → `dlg_teddy_joined`. `[party = YOU,
GAVIN, TEDDY; hired = Gavin, Priya, Teddy; letters 0]` Banner: **See Kessler → DIRECTOR'S
   OFFICE**; pin on the door `(3,9)`.
8. Recommended: Facilities vending. `(10,4) → (9,4) → (9,5) → (9,6)D → (9,7) → (8,7) → (8,8) →
(8,9)D → (8,10) → (8,11) → (9,11) → (9,12) → (13,12)` (13), face east → `ovl_vending` → PTO Day
   (wallet 27 → 3 on this floor's earnings; more with Floor 1's balance).
9. Walk to `(8,9)D → (8,8) → (3,8) → (3,9)` (≈9) → `ovl_door_prompt` (party row YOU / GAVIN / TEDDY)
   → `[Step in]` → placed `(3,10)` facing south → `dlg_kessler_review` (team variant) → `[Begin]` →
   title card `OPERATIONS REVIEW / NO RESCHEDULING`. **Boss.**
10. Boss script a reviewer can reproduce: Teddy opens (Reply All → Burned Out), switch to the lead,
    two hits (~77) → Kessler at ~93 → one more hit crosses 85 → **PHASE 2** (`Let's restructure.`,
    100 HP, statuses cleared, his turn spent) → lead hits (~54) → Right-Size lands ~40 on the lead →
    `SWITCH` to Gavin (free swing on Gavin) → Sticky Note (Demoralized) → switch back → finish. A
    lead faint opens the forced bench; a wipe goes to §6 and resumes at step 9.
11. Win → return `(3,10)` facing south → receipt `OPERATIONS REVIEW — PASSED` (+55 XP → **TEAM
    LEVEL 4** row on the full route, +32 📈, Transfer approved ✓, Promotion →) → `screen_promotion`
    `MADE PERMANENT` → pick → `dlg_kessler_beaten`. Banner: **Print your badge → HELP DESK**; pin
    on the printer.
12. Walk `(3,9)D → (3,8) → (9,8) → (9,7) → (9,6)D → (9,4) → (11,4) → (11,3)` (15), face north →
    "Print badge" → printing frames → receipt `EMPLOYEE BADGE — ISSUED` → reader green.
    `[key_employee_badge]` Banner: **Take the elevator → LANDING**; pin on the doors. Teddy
    `dlg_teddy_after`.
13. Walk `(10,3) → (10,4) → (8,4) → (8,3) → (6,3)D → (3,3) → (3,2)` (11), face north → panel → **3 ·
    FLOOR 3** (now enabled: "Under construction") → ride → `FLOOR 2 CLEARED` → `[Back to Floor 2]`
    → `(3,2)` facing south. `[flag_floor2_complete]` Banner: `FLOOR 2 CLEARED · Floor 3 unmapped`.

Tile total ≈ 100 moves (~25 s of walking) plus two rides; the rest is reading, recruiting and two
fights.

### 13.2 Optional route (insert between steps 3 and 4, or any time before step 9)

- a. From the booth, take the hall to Finance: `(12,4) → (9,4) → (9,5) → (9,6)D → (9,8) → (19,8) →
(19,9)D` (≈18). Stepping on `(19,9)` enters Whitlock's sightline →
  `dlg_whitlock_hook` → `dlg_whitlock_request` → `[Take it on]`. `[asg_audit = accepted]` Dim
  optional row: **Print the vending receipts → ▼ FLOOR 1**.
- b. On the Floor 1 visit (step 4), after Holloway: walk to the vending machine `(6,2) → (9,2) →
(10,3) → (11,3) → (11,9) → (21,9)` (≈23), face east → "Print receipts" → toast. `[receipts_held]`
  Optional row: **Bring the receipts to Whitlock → ▲ FLOOR 2**. Walk back (23), ride up.
- c. Any time before Kessler: Finance, face Whitlock → `dlg_whitlock_delivered` → receipt `AUDIT —
RECONCILED` (+10 📈) `[complete]` → `dlg_whitlock_challenge` → `[Open the books]` → title card
  `THE AUDIT`. **Battle 2** → receipt `THE AUDIT — CLOSED` (+43 XP, +21 📈) `[enc_auditor = won]`
  → `dlg_whitlock_beaten`; shredder runs under `dlg_whitlock_after`.
- d. Loss branch (any fight): interstitial → `(11,11)` → whole party restored → walk back (Teddy
  13, Whitlock 20, Kessler's door 12).
- e. Roster branch: at any team panel, send Gavin to his desk and ride down to fetch Priya
  (`dlg_priya_rejoin`) — free, ~1 minute, and the elevator panel's Floor 1 row lists who is
  there.

Full route: 90 📈 on this floor, level 4 reached at Kessler.

### 13.3 State matrix (which line plays)

| Player state                      | Teddy                       | Whitlock               | Kessler (door)         | Elevator panel Floor 3 row  | Holloway (Floor 1) |
| --------------------------------- | --------------------------- | ---------------------- | ---------------------- | --------------------------- | ------------------ |
| Just arrived                      | `callout` → `packet`        | `hook` / `request`     | `early`                | Badge required              | `after` (Floor 1)  |
| Photo taken                       | `hint_signature`            | as above / `waiting`   | `early`                | Badge required              | `sign_transfer`    |
| Signed                            | `hint_file`                 | as above               | `early`                | Badge required              | `upstairs`         |
| Filed, Teddy open                 | `filed` (sightline or talk) | as above / `delivered` | `teddy_pending`        | Badge required              | `upstairs`         |
| Teddy won, not hired, letter held | `offer` / `offer_full`      | as above / `challenge` | door prompt → `review` | Badge required              | `upstairs`         |
| Teddy hired (in party / benched)  | `party` / `rejoin`          | as above               | door prompt → `review` | Badge required              | `upstairs`         |
| Kessler won, no badge             | `badge_pending`             | `after` / `challenge`  | `after`                | Badge required              | `upstairs`         |
| Badge printed                     | `after`                     | as above               | `after`                | Under construction          | `f2_after`         |
| Floor 2 cleared                   | `after_win`                 | as above               | `after`                | Under construction (replay) | `f2_after`         |

### 13.4 Functional acceptance checklist

| #   | Check                                                                                                                                                                     | Where        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| B1  | Arrival at `(3,2)` facing south on every ride; zone chip LANDING; callout within 30 s                                                                                     | §1.5, §8.2   |
| B2  | Photo booth flashes and grants the photo once; objective chip reads `▼ FLOOR 1`; pin on the elevator doors; edge arrow points at them                                     | §2.4, §10.1  |
| B3  | Elevator panel lists 3 (disabled, "Badge required"), 2 (you are here), 1 (with benched coworkers named); ride lands on Floor 1 `(3,2)` south, doors open behind           | §8.2         |
| B4  | Holloway signs once; a re-talk shows no toast and plays `upstairs`; Floor 1 tiles, spawns and Floor 1 objectives are unchanged; Classic save untouched                    | §2.5, §15    |
| B5  | Tray pays +12 and one letter exactly once via a receipt; photo and form leave `keyItems`                                                                                  | §4.1         |
| B6  | Teddy's sightline fires at `(9,6)`/`(9,5)`/`(9,4)` only when `filed`; talking works from all three spots                                                                  | §1.4         |
| B7  | Full party at the offer → `[Make room]` → roster mode → send → card returns with a gold `+` → hire; `coach_roster` once per save; letters chip hides at 0                 | §3.2         |
| B8  | A benched coworker rejoins at their desk for free with a full-HP/PP-preserving swap; `rejoin_full` when the party is full                                                 | §3.1         |
| B9  | Director door prompt shows the party; solo variant names the coworkers at their desks; all-fainted variant pins the counter                                               | §8.1         |
| B10 | Kessler transforms at ≤ 85 HP regardless of who is active; enemy statuses clear, player statuses persist; the transform spends his turn                                   | §5.3         |
| B11 | Kessler win pays +55 XP / +32 📈 once with the level row; rolls and **saves** the perk offer before `MADE PERMANENT`; badge is granted by the printer, not the win        | §7.1, §8.1   |
| B12 | Badge printer plays printing frames, then `done`; reader turns green; Floor 3 row enables; ride shows `FLOOR 2 CLEARED` with Floor 2 time and Options 90 / 59             | §10.3, §10.4 |
| B13 | Optional: receipts print at the Floor 1 machine only while `asg_audit = accepted`; blank-roll variants when nothing was bought; shredder runs under Whitlock's after line | §4.2         |
| B14 | Reload at every step resumes floor, tile, facing, party, hired list, letters, both assignments, all encounters, both vending stocks and a pending promotion               | §12          |
| B15 | v1 save migrates: Floor 1 continues exactly where it was; Floor 2 opens from the elevator                                                                                 | §10.5        |
| B16 | Every §12 row of Floor 1 still holds on Floor 2, plus the panel/roster/printer/booth/shredder rows above, on desktop and touch, with reduced motion                       | §10          |

---

## 14. Decisions and their reasons

- **The required activity leaves the floor.** Backtracking that is optional is backtracking nobody
  does. One signature, seven tiles from the elevator, with three new Holloway lines, is the cheapest
  possible proof that the building is one place — and it is the beat that makes every Floor 1 NPC's
  "you've been upstairs" line land.
- **Two errands, one trip, by hint not gate.** Teddy tells you to batch; the directory names
  Finance; Whitlock's sightline covers the door. A player who ignores all three pays ~50 seconds.
  Gating the elevator on "have you talked to Finance" would be an invisible rule.
- **Seats, not hires.** With one recruit and a cap of three, the only honest options were a fourth
  seat (ships empty), no recruit (the party system stops growing), or making the roster a thing you
  manage. The third is one list and two verbs, and it retroactively makes Floor 1's "on your team
  and at my desk" line true.
- **HR is a tray with a face.** People Ops as a self-service counter avoids a fourth new face (there
  are exactly three unused portraits in the house style, and one is the CEO's) and it is a better
  joke than a fourth person would be.
- **Whitlock wears the `boss` portrait.** The remaining faces are `intern`, `vp`, `boss`. Every
  floor after this one needs new portraits regardless; spending the last one on an external auditor
  who "doesn't work here" is the reuse that reads best. Floor 3's cast is a portrait commission
  either way.
- **Kessler gets phase 2, not a gimmick.** Floor 1 wrote the rule and left it unused. A boss whose
  numbers change halfway is the tower's language, already sequenced, and it is exactly what makes a
  three-member team feel necessary rather than nice.
- **The badge is printed, not handed over.** Ten more tiles after the boss walk the player past the
  whole floor's `after` lines and back to the desk where the floor started. It also gives the badge
  printer — a prop the player saw at minute one — its payoff.
- **Ranks continue (3–5); rewards scale but don't formula.** Same rule as Floor 1: the boss is a
  premium override, the others are near the `15 + 7·rank` / `8 + 3·rank` curve with rounding toward
  numbers the vending prices make meaningful.
- **Same map frame.** §1.6.
- **Floor 1's copy is edited in two places.** Two frozen nodes said Floor 2 didn't exist. IDs kept,
  text replaced, listed in §2.5; everything else on Floor 1 is additive.

## 15. Open risks for Astra

Detailed hooks are in `docs/rpg/floor-2-engine-hooks.md`. In priority order: (1) multi-floor
content resolution without forking `tiles.tsx`/`WorldMap` per floor; (2) un-gating phase 2 for
encounters in `resolveEnemyDown` while keeping the Classic path bit-identical; (3) the roster
actions and the `hired` list in the reducer and the team panel; (4) the elevator panel, ride
transition and cross-floor objective destination; (5) v1 → v2 save migration including the
per-floor vending stock; (6) the letter cap; (7) balance — every number in §5 is derived, not
played. Retune Kessler's HP/DEF and Teddy's kit after the first playtest; do not touch rewards or
letter counts.
