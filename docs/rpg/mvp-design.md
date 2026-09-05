# The Office — Overworld MVP Design (Floor 1)

_Status: design freeze for the first slice, revision 2 (party system promoted to v1). Owner:
Fable (experience, content, wording, pacing). Implementation: Astra. This document is meant to be
playtested on paper — every tile, line, and number a reviewer needs is here. Anything marked
**FROZEN** is an ID or value code will be written against; change it here first, then in code._

Companion reading: `CLAUDE.md` (architecture), `src/content/*` (existing classes, items, perks,
enemies the overworld reuses), `src/engine/turn.ts` (the one battle resolver the party rides on),
`src/ui/tokens.css` (visual system). `docs/REWRITE_PLAN.md` is historical; nothing here restarts
that rewrite.

---

## 0. One-paragraph pitch

You are a new hire on Floor 1. Reception hands you a broken printer. The first thing the fixed
printer prints is two pre-signed Offer Letters. Fixing it earns you the attention of the desk pit's
resident know-it-all; beat him and you can hire him. The Team Lead who has been "interim" for four
years wants a one-on-one — bring your team, because she's built to outlast one person. Win and you
get a badge. The badge opens the elevator. The elevator goes to Floor 2, which does not exist yet.
Battles are the existing Corporate Climb combat, entered on purpose, never by ambush; your
coworkers fight one at a time, Pokémon-style, and you switch between them. Losing costs the whole
team a walk to the break room.

### Locked defaults (from the brief, confirmed against the repo)

| Default                                         | Repo check / design answer                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Player is the lead employee (chosen class)      | `PLAYER_CLASSES` (pm / eng / design) reused as-is; `ClassSelect` reused; lead is always party slot 0                                        |
| **Recruitable coworker party — required in v1** | §3. Party cap 3 (lead + 2). Recruit by beating a recruitable coworker and extending an Offer Letter the printer produced                    |
| Persistent completed work                       | Assignment stages, encounter results and the party roster live on the office campaign save (§12)                                            |
| Free break-room recovery, no loss currency cost | "Take five" restores the whole party; nothing in `RunState` is decremented on defeat                                                        |
| Static directional avatar                       | 4 facing frames per class, no walk cycle; recruits do not follow on the map (§11)                                                           |
| Classic tower stays on its own save slot        | Classic uses `corporate-climb-save`; the office campaign gets its own key (§12). Title screen gets a third mode button                      |
| One floor, 24×18 tiles, five zones + connector  | §1                                                                                                                                          |
| No random encounters                            | Every battle is behind an explicit confirm (§5). Sightlines trigger _dialogue_, never combat                                                |
| One battle system                               | The party is a projection over the existing `TurnContext`; one new player action (switch) and one new battle phase (§3.4). No second engine |
| Currency                                        | Stock Options (`📈`, `CURRENCY_ICON`), the existing run currency. Written "Options" in dialogue, "OPT" in HUD chips                         |

---

## 1. Floor 1 map (24×18) — **FROZEN**

Coordinates are `(x, y)`, origin top-left, `x` 0–23, `y` 0–17. Tiles are 32 design-px. Movement
is 4-directional, one tile per step, 4 tiles/second (250 ms per tile; snaps per tile under reduced
motion). The camera follows the player horizontally only (viewport 14 tiles wide × 18 tall, clamped
to the map); the whole floor height is always on screen.

### 1.1 Combined tile + entity map

```
         x → 0         1         2
           012345678901234567890123
    y  0   ########################
       1   #.EER....p#...#.......H#
       2   #.........#..3#..ATTT..#
       3   #.....4...D...D..TTTT..#
       4   #.........#...#..cccc..#
       5   #p........#...#.......p#
       6   ###########...##########
       7   #p.......P#...#S..KKK..#
       8   #.===.....#...#........#
       9   #.ccc.....D...D.......V#
      10   #.....2==.#...#........#
      11   #.===.....#...#.tt....p#
      12   #####D#####...##########
      13   #p.............i......p#
      14   #.......1..............#
      15   #......===..@..........#
      16   #.cc..................w#
      17   ############X###########
```

### 1.2 Legend and collision

| Glyph | Tile                       | Solid | Interaction (label shown when adjacent + facing)      | POI id                |
| ----- | -------------------------- | ----- | ----------------------------------------------------- | --------------------- |
| `#`   | Wall                       | yes   | —                                                     | —                     |
| `.`   | Floor (zone-tinted carpet) | no    | —                                                     | —                     |
| `D`   | Door (glass, open)         | no    | `(10,3)` only: supervisor door prompt (§8)            | `poi_supervisor_door` |
| `X`   | Street exit                | yes   | "Inspect"                                             | `poi_exit_door`       |
| `E`   | Elevator doors (2 tiles)   | yes   | "Elevator"                                            | `poi_elevator_door`   |
| `R`   | Badge reader               | yes   | "Elevator" (same POI as `E`)                          | `poi_elevator_door`   |
| `T`   | Meeting table              | yes   | —                                                     | —                     |
| `A`   | Agenda on the table        | yes   | "Read agenda"                                         | `poi_agenda`          |
| `H`   | Handout rack               | yes   | "Pick a handout"                                      | `poi_handout_rack`    |
| `c`   | Chair                      | yes   | —                                                     | —                     |
| `=`   | Desk                       | yes   | Reception desk tiles `(7–9,15)` proxy "Talk — Renata" | `poi_reception_desk`  |
| `P`   | Printer                    | yes   | "Inspect" / "Install toner" (state-dependent)         | `poi_printer`         |
| `S`   | Supply cabinet             | yes   | "Open cabinet"                                        | `poi_supply_cabinet`  |
| `K`   | Coffee counter (3 tiles)   | yes   | "Take five"                                           | `poi_break_counter`   |
| `V`   | Vending machine            | yes   | "Buy"                                                 | `poi_vending_machine` |
| `t`   | Break table (2 tiles)      | yes   | "Inspect"                                             | `poi_break_table`     |
| `w`   | Water cooler               | yes   | "Inspect"                                             | `poi_water_cooler`    |
| `i`   | Floor directory sign       | yes   | "Read"                                                | `poi_directory_sign`  |
| `p`   | Plant                      | yes   | —                                                     | —                     |
| `@`   | Player spawn `(12,15)`     | —     | Facing north                                          | —                     |
| `1`   | Renata (receptionist)      | yes   | "Talk"                                                | `npc_receptionist`    |
| `2`   | Gavin (required coworker)  | yes   | "Talk"                                                | `npc_desk_challenger` |
| `3`   | Priya (optional coworker)  | yes   | "Talk"                                                | `npc_meeting_prepper` |
| `4`   | Holloway (supervisor)      | yes   | "Talk"                                                | `npc_supervisor`      |

Doors are decorative: they render as glass frames but are walkable floor. Only `(10,3)` carries
logic. Interaction rule: the player must be on an adjacent tile _facing_ the target (Pokémon
rule). Standing adjacent without facing shows no label. Recruited coworkers keep their map tile
(they are "on your team" and "at their desk" simultaneously — see §3.2); no follower sprites.

### 1.3 Zones

| Zone id          | Interior tiles | Accent token (zone chip + carpet tint) | Notes                                                     |
| ---------------- | -------------- | -------------------------------------- | --------------------------------------------------------- |
| `zone_reception` | x1–22, y13–16  | `--cc-gold`                            | Spawn, Renata, directory, exit                            |
| `zone_desks`     | x1–9, y7–11    | `--cc-type-analytics`                  | Printer, Gavin; doors at `(5,12)` and `(10,9)`            |
| `zone_break`     | x15–22, y7–11  | `--cc-type-technical`                  | Supply cabinet, coffee counter, vending; door at `(14,9)` |
| `zone_meeting`   | x15–22, y1–5   | `--cc-type-influence`                  | Agenda, handout rack; door at `(14,3)`                    |
| `zone_elevator`  | x1–9, y1–5     | `--cc-type-strategy`                   | Elevator, badge reader, Holloway; door at `(10,3)`        |
| `zone_hall`      | x11–13, y1–12  | `--cc-text-dim`                        | Connector spine; Priya stands here                        |

The zone name shows as an uppercase eyebrow chip (`--cc-track-label`) top-left of the map when the
player crosses a zone boundary, for 1.6 s (instant swap under reduced motion).

### 1.4 NPC positions, facing, sightlines, triggers

Sightlines are straight lines from the NPC in its facing direction, stopping at the first solid
tile, capped at 3 tiles. **Entering a sightline triggers dialogue, never a battle.** Each sightline
fires once per state (repeat entries in the same state do nothing; talk directly for repeats).

| NPC / trigger id      | Tile                         | Facing | Sightline tiles              | Active when                                              | Fires                                           |
| --------------------- | ---------------------------- | ------ | ---------------------------- | -------------------------------------------------------- | ----------------------------------------------- |
| `npc_receptionist`    | `(8,14)`                     | south  | none (uses `trg_first_step`) | —                                                        | —                                               |
| `npc_desk_challenger` | `(6,10)`                     | west   | `(5,10) (4,10) (3,10)`       | `asg_printer = complete` and `enc_desk_challenger ≠ won` | `dlg_gavin_callout`                             |
| `npc_meeting_prepper` | `(13,2)`                     | south  | `(13,3) (13,4) (13,5)`       | `asg_meeting_prep = not_started`                         | `dlg_priya_hook`                                |
| `npc_supervisor`      | `(6,3)`                      | east   | `(7,3) (8,3) (9,3)`          | always until `enc_supervisor_1on1 = won`                 | `dlg_holloway_*` by state (§2.4)                |
| `trg_first_step`      | any                          | —      | —                            | player's first completed step                            | `dlg_renata_callout`                            |
| `trg_supervisor_door` | `(10,3)`                     | —      | —                            | prerequisites met (§8) and `enc_supervisor_1on1 ≠ won`   | commit prompt (§8); blocks passage on "Not yet" |
| `trg_elevator_ride`   | `(2,2)`/`(3,2)` facing north | —      | —                            | `key_access_badge` held                                  | ride prompt → celebration (§8)                  |
| `trg_switch_coach`    | in battle                    | —      | —                            | §3.6                                                     | one-time switch coach mark                      |

Sightline overlay (`*` = trigger tile, `>` `<` `v` = NPC facing):

```
           012345678901234567890123
       1   #.EER....p#...#.......H#
       2   #.........#..v#..ATTT..#
       3   #.....>***D..*D..TTTT..#
       4   #.........#..*#..cccc..#
       5   #p........#..*#.......p#
       6   ###########...##########
       7   #p.......P#...#S..KKK..#
       8   #.===.....#...#........#
       9   #.ccc.....D...D.......V#
      10   #..***<==.#...#........#
      11   #.===.....#...#.tt....p#
```

### 1.5 Fixed placements

| Purpose                          | Tile                                                                                   | Facing                                |
| -------------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------- |
| Initial spawn                    | `(12,15)`                                                                              | north                                 |
| Defeat respawn (break room)      | `(19,8)`                                                                               | north (looking at the coffee counter) |
| Post-celebration return          | `(3,2)`                                                                                | south (just stepped off the elevator) |
| Printer interaction tile         | `(9,8)` facing north (also `(8,7)` facing east)                                        |                                       |
| Supply cabinet interaction tile  | `(15,8)` facing north                                                                  |                                       |
| Coffee counter interaction tiles | `(18–20,8)` facing north                                                               |                                       |
| Vending interaction tile         | `(21,9)` facing east                                                                   |                                       |
| Agenda interaction tile          | `(16,2)` facing east (also `(17,1)` facing south)                                      |                                       |
| Handout rack interaction tiles   | `(21,1)` facing east, `(22,2)` facing north                                            |                                       |
| Renata interaction tiles         | `(7–9,16)` facing north (through the desk), `(7,14)` facing east, `(9,14)` facing west |                                       |
| Gavin interaction tile           | `(5,10)` facing east (also `(6,9)`/`(6,11)` facing south/north)                        |                                       |
| Priya interaction tiles          | `(12,2)` facing east, `(13,1)` facing south, `(13,3)` facing north                     |                                       |
| Holloway interaction tiles       | `(7,3)` facing west, `(6,2)`/`(6,4)` facing south/north                                |                                       |

---

## 2. NPCs and dialogue trees — **FROZEN IDs**

Dialogue conventions: one box = one line below. Lines advance on Enter/E/tap; Esc closes a plain
dialogue, and on a choice prompt Esc selects the safe option (marked ⎋). Text uses the existing
`TextBox` typewriter (`--cc-type-speed`, honours text-speed setting). Speaker name renders as the
eyebrow chip above the box. `→` means state effect. Every node id is `dlg_<npc>_<name>`.

State vocabulary used in conditions:

- `asg_printer ∈ { not_started, accepted, toner_collected, installed, complete }`
- `asg_meeting_prep ∈ { not_started, accepted, handout_held, complete }`
- `enc_* ∈ { open, won }` (a lost or declined encounter stays `open`)
- `party` contains `cw_desk_challenger` / `cw_meeting_prepper` once recruited (§3)
- key items: `key_toner`, `key_offer_letter` (×2), `key_handout_q3_summary`, `key_handout_q3_deck`,
  `key_handout_q2_summary`, `key_access_badge`

Recruitability at a glance:

| NPC      | Recruitable | Why                                                       |
| -------- | ----------- | --------------------------------------------------------- |
| Renata   | no          | Never fights. "I'm the front desk. I don't go places."    |
| Gavin    | **yes**     | Required coworker; the acceptance route recruits him      |
| Priya    | **yes**     | Optional coworker; fills the third slot                   |
| Holloway | no          | Boss. "I'm your manager. That's the opposite of joining." |

### 2.1 `npc_receptionist` — Renata, Front Desk

Role: teaches movement + interaction, issues and closes the printer ticket, points to the next
beat, explains the Offer Letters. Never fights. Map token only (no battle portrait needed).

| Node                       | Condition                                                 | Lines / choices                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dlg_renata_callout`       | `trg_first_step`, once                                    | _(spoken across the room, marker bounces over Renata)_ "New hire. Front desk. Now." → objective banner: **Talk to Renata at the front desk** → `flag_greeted`                                                                                                                                                                                                                                                                                                                        |
| `dlg_renata_ticket`        | `asg_printer = not_started`                               | "You have the look. Hopeful. Badge-less." · "Floor 1: reception, desks, break room, meeting room, elevator. That's the whole world for now." · "Your first ticket is already late. The desk-pit printer is down. Toner's in the grey cabinet in the break room." · "Fix it, then come back so I can close the ticket." → `asg_printer = accepted` → objective: **Get the printer working — find toner in the break room**                                                            |
| `dlg_renata_hint_toner`    | `asg_printer = accepted`                                  | "Break room's up the hall, on the right. Grey cabinet. Nobody labels it. Push."                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dlg_renata_hint_install`  | `asg_printer = toner_collected`                           | "You're holding toner like it's a promotion. Printer. Desk pit. Go."                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `dlg_renata_close_ticket`  | `asg_printer = installed`                                 | "It printed? It printed. Ticket closed." · _(reward toast: +10 📈 Stock Options)_ "Ten Options. Don't spend them all on espresso. Spend most of them on espresso." · "It printed offer letters too? Keep them. HR pre-signs a stack every quarter. Beat someone in an argument, hand them one, they're yours." · "Gavin at the desks wants a word. He wants a word with everyone." → `asg_printer = complete`, `rwd_asg_printer` claimed → objective: **Talk to Gavin at the desks** |
| `dlg_renata_gavin_pending` | `asg_printer = complete`, `enc_desk_challenger = open`    | "Gavin's still at his desk. He's always at his desk. It's sort of his whole thing."                                                                                                                                                                                                                                                                                                                                                                                                  |
| `dlg_renata_holloway`      | `enc_desk_challenger = won`, `enc_supervisor_1on1 = open` | "Holloway wants to see you. Elevator lobby, through the glass door." · _(if party size = 1)_ "Alone? Bold. She's built to outlast one person." · _(if party size ≥ 2)_ "Bring the team. She talks a lot; let someone else stand there for a bit." · "Eat something first."                                                                                                                                                                                                           |
| `dlg_renata_recruit_me`    | any time the player holds `key_offer_letter`, talk twice  | "Don't. I'm the front desk. I don't go places."                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `dlg_renata_badged`        | `key_access_badge` held, `flag_preview_complete` unset    | "Look at you. Badged. Elevator's top left. It goes to Floor 2." · "Floor 2 isn't finished. Take that up with the people who build floors."                                                                                                                                                                                                                                                                                                                                           |
| `dlg_renata_after`         | `flag_preview_complete` set                               | "Back already? Floor 2 will be there when it exists."                                                                                                                                                                                                                                                                                                                                                                                                                                |

### 2.2 `npc_desk_challenger` — Gavin, Senior Associate

Role: the required gate before the supervisor and the first recruit. Grudging, territorial, never
actually busy. Encounter `enc_desk_challenger` (rank 0). Declinable. No rematch after a win (§14).
Recruit def `cw_desk_challenger` (§3.3).

| Node                       | Condition                                               | Lines / choices                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_gavin_busy`           | `asg_printer = not_started`                             | "Can't talk. Printing." · "Trying to print. Somebody's meant to be fixing that."                                                                                                                                                                                                                                                |
| `dlg_gavin_no_pressure`    | `asg_printer ∈ {accepted, toner_collected, installed}`  | "You're the fix? Great. No pressure. The whole quarter is in that tray."                                                                                                                                                                                                                                                        |
| `dlg_gavin_callout`        | sightline, `asg_printer = complete`, `enc = open`, once | "Hey. Printer person." → continues into `dlg_gavin_challenge`                                                                                                                                                                                                                                                                   |
| `dlg_gavin_challenge`      | talk, `asg_printer = complete`, `enc = open`            | "You fixed a printer on day one. Now everyone thinks you're competent." · "Desk-pit rules: we argue until one of us stops. Loser refills the coffee." → **stakes card** (§5): `[Bring it]` → battle · `[Not now]` ⎋ → `dlg_gavin_declined`                                                                                      |
| `dlg_gavin_declined`       | chose Not now                                           | "Sure. I'll be here. I'm always here."                                                                                                                                                                                                                                                                                          |
| `dlg_gavin_you_lost`       | talk after a loss, `enc = open`                         | "Break room's that way. Take five." · "I'll be here, still not having been beaten." → `dlg_gavin_challenge` on next talk                                                                                                                                                                                                        |
| `dlg_gavin_beaten`         | immediately after win                                   | "…Okay. Fine. Okay." · "Holloway's going to hear about this. From me. Reluctantly." → `enc_desk_challenger = won`, rewards (§5) → continues into `dlg_gavin_offer` if `key_offer_letter` held, else objective: **See Holloway in the elevator lobby**                                                                           |
| `dlg_gavin_offer`          | `enc = won`, not in party, `key_offer_letter` held      | "…Is that an offer letter. Is that a pre-signed offer letter." · "You know what, fine. If you're going up against Holloway I want to be in the room. For the story." → **recruit card** (§3.2): `[Extend the offer]` → `dlg_gavin_joined` · `[Not yet]` ⎋ → `dlg_gavin_offer_declined`                                          |
| `dlg_gavin_offer_declined` | chose Not yet                                           | "Right. Keep it. I'll be at my desk, professionally unbothered." → objective: **See Holloway in the elevator lobby**                                                                                                                                                                                                            |
| `dlg_gavin_joined`         | offer extended                                          | _(toast: "Gavin joined the team" · party strip fills slot 2)_ "I'm still sitting here. Being on your team and being at my desk are both true." · "Switch me in when Holloway starts a sentence with 'so'. Trust me." → `party += cw_desk_challenger`, `key_offer_letter` −1 → objective: **See Holloway in the elevator lobby** |
| `dlg_gavin_party`          | in party, `enc_supervisor_1on1 = open`                  | "Still on your team. Still at my desk. Multitasking."                                                                                                                                                                                                                                                                           |
| `dlg_gavin_after`          | `enc = won`, not in party, no `key_offer_letter`        | "We're not doing that again. I have a reputation to rebuild."                                                                                                                                                                                                                                                                   |
| `dlg_gavin_after_win`      | in party, `enc_supervisor_1on1 = won`                   | "We beat Holloway. I'm putting it on my calendar as a recurring event."                                                                                                                                                                                                                                                         |

### 2.3 `npc_meeting_prepper` — Priya, Ops

Role: optional assignment (meeting prep), optional battle, optional second recruit. Competent,
over-caffeinated, blames herself out loud so nobody else has to. Encounter `enc_meeting_prepper`
(rank 1). Declinable. The spar is offered only after the handout is delivered. Recruit def
`cw_meeting_prepper` (§3.3).

| Node                       | Condition                                                      | Lines / choices                                                                                                                                                                                                                                                          |
| -------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dlg_priya_hook`           | sightline, `asg_meeting_prep = not_started`, once              | "Don't go in there. The 10:30 isn't ready. I'm the reason. I'm choosing not to accept that." → continues into `dlg_priya_request`                                                                                                                                        |
| `dlg_priya_request`        | talk, `asg_meeting_prep = not_started`                         | "Read the agenda on the table. Bring me the handout that matches." · "There are three. Two are wrong. That's the job." → `[Take it on]` → `asg_meeting_prep = accepted`, objective (optional): **Prepare the meeting — read the agenda** · `[Pass]` ⎋ → `dlg_priya_pass` |
| `dlg_priya_pass`           | chose Pass                                                     | "Fair. Nobody signed up for the 10:30."                                                                                                                                                                                                                                  |
| `dlg_priya_waiting`        | `asg_meeting_prep = accepted`                                  | "Agenda's on the table. Handouts are on the rack. Matching is the hard part, apparently."                                                                                                                                                                                |
| `dlg_priya_wrong_deck`     | `handout_held`, holding `key_handout_q3_deck`                  | "Forty-eight pages. She'll read the first one and hold the rest like a shield." · "Summary. One page." _(handout stays in hand; swap it at the rack)_                                                                                                                    |
| `dlg_priya_wrong_q2`       | `handout_held`, holding `key_handout_q2_summary`               | "That's Q2. We don't say Q2 here anymore." · "Check the quarter on the agenda." _(handout stays in hand)_                                                                                                                                                                |
| `dlg_priya_delivered`      | `handout_held`, holding `key_handout_q3_summary`               | "This is it. This is the one. You have no idea how rare that is." → consume handout, `asg_meeting_prep = complete`, `rwd_asg_meeting_prep` (+6 📈) · "Six Options. Expensed, technically." → continues into `dlg_priya_spar`                                             |
| `dlg_priya_spar`           | `asg_meeting_prep = complete`, `enc_meeting_prepper = open`    | "While I've got you. I run a thing. Pre-meeting sparring. Keeps the nerves off." → **stakes card** (§5): `[Spar]` → battle · `[Rain check]` ⎋ → `dlg_priya_raincheck`                                                                                                    |
| `dlg_priya_raincheck`      | chose Rain check                                               | "Rain check. I'll hold you to it. I hold everyone to it."                                                                                                                                                                                                                |
| `dlg_priya_you_lost`       | talk after a loss, `enc = open`                                | "Break room. Hydrate. Come back angrier." → `dlg_priya_spar` on next talk                                                                                                                                                                                                |
| `dlg_priya_beaten`         | immediately after win                                          | "Good. Now I'll be calm in the 10:30 and nobody will know why." → `enc_meeting_prepper = won`, rewards (§5) → continues into `dlg_priya_offer` if `key_offer_letter` held and party has a free slot                                                                      |
| `dlg_priya_offer`          | `enc = won`, not in party, `key_offer_letter` held, slot free  | "An offer letter. Pre-signed. You're just handing these out?" · "Yes. Obviously yes. I've been trying to get off this floor since the 10:30 existed." → **recruit card**: `[Extend the offer]` → `dlg_priya_joined` · `[Not yet]` ⎋ → `dlg_priya_offer_declined`         |
| `dlg_priya_offer_declined` | chose Not yet                                                  | "Sure. Come back. I'm easy to find. I'm always outside this door."                                                                                                                                                                                                       |
| `dlg_priya_offer_full`     | `enc = won`, not in party, `key_offer_letter` held, party full | "You've got a full team. Send someone home first. Not me — I mean, hypothetically." _(no action in MVP; the party is never full on Floor 1 — see §3.1)_                                                                                                                  |
| `dlg_priya_joined`         | offer extended                                                 | _(toast: "Priya joined the team")_ "Great. I'll hold you to the schedule. Switch me in early; I front-load." → `party += cw_meeting_prepper`, `key_offer_letter` −1                                                                                                      |
| `dlg_priya_party`          | in party                                                       | "Team member. Also still running the 10:30. It's called range."                                                                                                                                                                                                          |
| `dlg_priya_after`          | `enc = won`, not in party, no `key_offer_letter`               | "The 10:30 went fine. Nobody read the handout. It was still the right handout."                                                                                                                                                                                          |

### 2.4 `npc_supervisor` — Holloway, Team Lead (Interim)

Role: mandatory boss, designed to be fought as a team. Dry, tired, quietly fair. Encounter
`enc_supervisor_1on1` (rank 2, boss). Not declinable once inside the lobby; no flee. Not
recruitable. Prerequisites: `asg_printer = complete` and `enc_desk_challenger = won`. Party size is
**not** a prerequisite (a solo win is allowed; the fight is tuned so it hurts).

| Node                         | Condition                                                                 | Lines / choices                                                                                                                                                                                                                                                                                                                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_holloway_early`         | sightline or talk, `asg_printer ≠ complete`                               | "You're new. The printer's broken and you haven't met Gavin." · "Both of those are your problem now."                                                                                                                                                                                                                                                                                                 |
| `dlg_holloway_gavin_pending` | sightline or talk, `asg_printer = complete`, `enc_desk_challenger = open` | "Printer works. Noted." · "Gavin hasn't signed off on you. It isn't a real process. It's the one we have."                                                                                                                                                                                                                                                                                            |
| `dlg_holloway_1on1`          | sightline, prerequisites met, `enc = open` (fires on entering the lobby)  | "Sit. Actually — stand. This is the standing kind." · "Printer's fixed. Gavin's sulking. You've been here forty minutes and I already have to have an opinion about you." · _(party ≥ 2)_ "You brought people. Good. I talk for a living; take turns." · "This is your one-on-one. There's no leaving early. There's a badge on the other side of it." → **stakes card** (§5) with a single `[Begin]` |
| `dlg_holloway_you_lost`      | spoken over the defeat fade                                               | "Break room. Five minutes. All of you. I have a 10:30 anyway."                                                                                                                                                                                                                                                                                                                                        |
| `dlg_holloway_beaten`        | immediately after win                                                     | "…Well. That's a data point." · "Here. Badge. It opens the elevator." · "Don't lose it, don't lend it, don't laminate it. It's already laminated." → `key_access_badge`, `enc_supervisor_1on1 = won`, rewards (§5) → promotion screen (§8)                                                                                                                                                            |
| `dlg_holloway_after`         | `enc = won`                                                               | "Elevator's behind me. Reader's on the right. It beeps. Everything here beeps." · _(if `key_offer_letter` held)_ "And no. I'm your manager. That's the opposite of joining."                                                                                                                                                                                                                          |

### 2.5 Point-of-interest copy (state-keyed)

| POI                   | Condition                                 | Text / effect                                                                                                                                                                                                                                                                                                                                                               |
| --------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poi_printer`         | `asg_printer = not_started`               | "The printer shows an error in a font designed to calm you. It does not."                                                                                                                                                                                                                                                                                                   |
| `poi_printer`         | `accepted` (no toner)                     | "TONER LOW. It has been low since March."                                                                                                                                                                                                                                                                                                                                   |
| `poi_printer`         | `toner_collected` — label "Install toner" | "You install the toner. The printer thinks about it." · "It prints a test page. The test page says TEST PAGE. Triumph." · "Then it prints two more pages. OFFER LETTER. Pre-signed by HR. Blank where the name goes." _(toast: "Got: Offer Letter ×2")_ → consume `key_toner`, gain `key_offer_letter` ×2, `asg_printer = installed` → objective: **Report back to Renata** |
| `poi_printer`         | `installed` or later                      | "The printer hums. Gavin has already printed forty pages. None of them are offer letters; it only does that for you, apparently."                                                                                                                                                                                                                                           |
| `poi_supply_cabinet`  | `asg_printer = not_started`               | "Grey cabinet. Unlabeled. Full of things nobody ordered."                                                                                                                                                                                                                                                                                                                   |
| `poi_supply_cabinet`  | `accepted`                                | "Behind eleven boxes of the wrong toner: the right toner." → gain `key_toner`, `asg_printer = toner_collected` → objective: **Install the toner at the desk-pit printer**                                                                                                                                                                                                   |
| `poi_supply_cabinet`  | `toner_collected` or later                | "Eleven boxes of the wrong toner. Someone's annual review."                                                                                                                                                                                                                                                                                                                 |
| `poi_break_counter`   | always — label "Take five"                | "Take five? Restores HP and PP for the whole team. Free. Always." `[Take five]` `[Not now]` ⎋ → "You take five. Everyone's restored. The couch has seen worse."                                                                                                                                                                                                             |
| `poi_vending_machine` | always — label "Buy"                      | Opens the vending shop (§7). Flavor line on open: "The machine accepts Stock Options. Nobody asked how."                                                                                                                                                                                                                                                                    |
| `poi_break_table`     | always                                    | "Someone left a cake. The icing says SORRY FOR YOUR LOSS. It was forty percent off."                                                                                                                                                                                                                                                                                        |
| `poi_agenda`          | `asg_meeting_prep = not_started`          | "A meeting agenda. You have no meeting. You read it anyway." · _(agenda text below)_                                                                                                                                                                                                                                                                                        |
| `poi_agenda`          | `accepted` or later                       | _(agenda text)_ → if `accepted`: objective: **Pick the matching handout from the rack**                                                                                                                                                                                                                                                                                     |
| `poi_handout_rack`    | `asg_meeting_prep = not_started`          | "Three stacks of paper. None of them are yours yet."                                                                                                                                                                                                                                                                                                                        |
| `poi_handout_rack`    | `accepted` or `handout_held`              | Choice menu (§4.2). Picking swaps whatever handout is held.                                                                                                                                                                                                                                                                                                                 |
| `poi_handout_rack`    | `complete`                                | "Two stacks left. Both wrong. Both will be here forever."                                                                                                                                                                                                                                                                                                                   |
| `poi_elevator_door`   | no `key_access_badge`                     | "The reader blinks red. It's not personal. It's policy." → `flag_badge_reader_denied`                                                                                                                                                                                                                                                                                       |
| `poi_elevator_door`   | `key_access_badge` held                   | "The reader blinks green." `[Ride up]` `[Not yet]` ⎋ → celebration (§8)                                                                                                                                                                                                                                                                                                     |
| `poi_exit_door`       | always                                    | "You just got here. Leaving now would be a statement."                                                                                                                                                                                                                                                                                                                      |
| `poi_water_cooler`    | always                                    | "No gossip today. The VPs are upstairs, being VPs."                                                                                                                                                                                                                                                                                                                         |
| `poi_directory_sign`  | always                                    | "FLOOR 1 — Desks: left. Break room: up the hall, right. Meeting room: top right. Elevator: top left. Badge required."                                                                                                                                                                                                                                                       |
| `poi_reception_desk`  | always                                    | Proxies `npc_receptionist` (same node table as §2.1)                                                                                                                                                                                                                                                                                                                        |

Agenda text (shown as a document card, not a speech box):

> **10:30 — Q3 NUMBERS REVIEW**
> Owner: Holloway. Room: this one.
> Pre-read: the **Q3 summary**. One page. Not the deck. Nobody reads the deck.

---

## 3. Party system — **FROZEN**

### 3.1 Model

- The party is an ordered list of up to **3** members: `party_slot_0` is always the **lead** (the
  player's chosen class, `PLAYER_CLASSES[classId]`); `party_slot_1` and `party_slot_2` hold
  recruited coworkers in recruitment order. The lead cannot be removed or reordered in the MVP;
  coworkers cannot be dismissed in the MVP (nothing on Floor 1 needs it).
- **Why 3, not 4.** Floor 1 has exactly two recruitable coworkers, so a cap of 3 is full at the
  end of the preview — a 4-slot party would ship with a permanently empty slot and a UI that
  advertises content that isn't there. Three also fits the battle deck: the bench picker is two
  cards beside the active card, the same width as the existing 2×2 move grid, and the HUD party
  strip is three chips on a 472-px frame at `--tap-min`. Raising the cap on Floor 2+ is a constant
  (`PARTY_MAX`), not a redesign.
- **No nicknames.** Everyone has their name on a badge; the office is not a place where you rename
  people. Saves one input surface and one moderation problem.
- Each member carries its own `hp`, `pp[]` (per move) and, during a battle, its own statuses.
  `level`, `xp`, `xpToNext`, `stockOptions`, `perks`, `inventory` stay on `RunState` and are
  **team-wide** (§3.5).
- Recruited coworkers do not follow the player on the map. Their token stays at their desk and
  their dialogue acknowledges the double life (`dlg_*_party`). Zero follower-pathing work.

### 3.2 Recruitment

Recruitment is a two-key lock: **beat them** and **have an Offer Letter**.

- `key_offer_letter` — a key item (not a battle item; never occupies the 4-slot bag). The
  fixed printer produces exactly **two** on install (§2.5). They cannot be bought, found elsewhere,
  or lost. Two letters, two recruitables: the economy of letters is exactly the content of the
  floor. Renata explains the rule when closing the ticket.
- Immediately after a recruitable coworker's `dlg_*_beaten`, if the player holds a letter and the
  party has a free slot, the NPC's `dlg_*_offer` node runs and ends in the **recruit card**:

  ```
  EXTEND AN OFFER · GAVIN · Senior Associate
  Offer Letters left: 2
  HP 70 · ATK 10 · DEF 8 · NORMAL
  Well, Actually · Passive-Aggressive Sticky Note
  Team  [ YOU ] [ + ] [ — ]
  [ Extend the offer ]   [ Not yet ]
  ```

- `[Extend the offer]`: `key_offer_letter` −1, member appended to the party at **full HP / full
  PP**, toast "Gavin joined the team", party strip animates the slot filling (static under reduced
  motion), `dlg_*_joined` plays.
- `[Not yet]`: nothing is consumed. Talking to the NPC again while holding a letter re-offers
  (`dlg_*_offer`). Declining is never final.
- Recruitment costs **no** Options and grants **no** XP or Options. The encounter reward was paid
  once on the win; recruiting is a use of that win, not a second one.
- Not recruitable: Renata (never fights), Holloway (boss). Both have a line for players who try
  (`dlg_renata_recruit_me`, `dlg_holloway_after`).
- Recruits are state, not a screen: the whole flow is dialogue + one card; ~10 s per recruit.

### 3.3 Coworker battler kits (`cw_*`)

Recruited coworkers fight with a small fixed kit — the same moves you faced, from the other side.
They are deliberately **support-shaped**: they debuff, absorb a hit, and hand the floor back to
the lead. Stats are base values; level bonuses from `turn.ts` (+2 ATK / +1 DEF per team level)
apply to whichever member is active, exactly as they apply to the lead today.

| Recruit def id       | Name  | Portrait (reuse) | HP  | ATK | DEF | Types      | Moves (dmg · type · PP · extra)                                                                                                                                      |
| -------------------- | ----- | ---------------- | --- | --- | --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cw_desk_challenger` | Gavin | `overachiever`   | 70  | 10  | 8   | `normal`   | Well, Actually · 10 · `normal` · 20 PP — Passive-Aggressive Sticky Note · 12 · `influence` · 10 PP · 40% Demoralized (−DEF) on enemy                                 |
| `cw_meeting_prepper` | Priya | `scrum`          | 80  | 11  | 9   | `strategy` | Calendar Hold · 12 · `strategy` · 12 PP · 50% Micromanaged (−ATK) on enemy — Agenda Item · 14 · `strategy` · 15 PP — Circle Back · 8 · `influence` · 8 PP · heals 10 |

Kits are `PlayerClass`-shaped (`maxHp`, `atk`, `def`, `spd`, `types`, `moves[]`, `perk: none`) so
`getEffectivePlayer` and the move grid work unchanged. Coworker moves never upgrade (no promotion
track); `spd` is 10 for both (only `caffeinated` reads it).

Intended loop against Holloway: Gavin lands Sticky Note (Holloway −DEF) → switch to the lead →
lead's big move hits harder; when the lead is low, switch to Gavin to eat a turn. Priya's
Micromanaged blunts Holloway's `Stretch Goal`.

### 3.4 Combat rules (what changes, what doesn't)

Nothing about damage, statuses, type effectiveness, items, or the enemy AI changes. The battle
screen still shows **one** fighter per side. The party is a projection: the active member's
`hp`/`pp`/kit are what `TurnContext` sees.

| Rule                  | Design                                                                                                                                                                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who starts            | The lead, unless the lead is fainted (HP 0) entering the battle, then the first non-fainted member in slot order. If _every_ member is fainted the stakes card is replaced by "Your team needs a minute. Break room first." and no battle starts.                   |
| Switch action         | A fifth player action, **SWITCH** (`act_switch`; key **5** or **Tab**; touch button beside ITEMS). Opens the bench picker (`ui_party_bench`): cards for the other members with HP/PP bars; fainted cards greyed and unselectable; ⎋/back cancels.                   |
| Switch cost           | Switching **uses your action**. Events: `switch_out` (outgoing member steps back, its statuses are cleared), `switch_in` (incoming member steps up), then the enemy takes its normal turn against the incoming member. Pokémon rule; the free hit is the price.     |
| Statuses on switch    | Cleared for the outgoing member (they "leave the room"). This gives switching a defensive use (drop Demoralized/Micromanaged/Burned Out) and costs buffs (Motivated/Focused) — a real trade.                                                                        |
| Faint → forced switch | When the active member's HP hits 0 and any bench member has HP > 0: `member_faint` event, then battle phase `switch_required` — the bench picker opens with **no cancel**. The enemy does **not** act after a forced switch (the KO already consumed the exchange). |
| Loss                  | Battle is lost only when every member has fainted (`party_wipe`). Loss flow is §6, and it restores the **whole party**.                                                                                                                                             |
| Items                 | One shared bag (`RunState.inventory`, 4 slots), carried by the lead. Items used in battle apply to the **active** member (Espresso heals whoever is standing there; PIP Notice still targets the enemy). Using an item is still a full action.                      |
| Struggle              | Unchanged: a member with 0 PP on every move Struggles. Switching is always available as an alternative while a bench member stands.                                                                                                                                 |
| Boss phase 2          | Holloway has none. Rule for later floors: a phase-2 transition happens to the enemy regardless of who is active.                                                                                                                                                    |
| Keyboard              | Moves 1–4 unchanged; 5/Tab opens SWITCH; in the bench picker ←/→ or 1–2 select, Enter confirms, Esc cancels (disabled when forced).                                                                                                                                 |

**What Astra adds to the engine surface (and nothing else):**

```ts
// Encounter context — the overworld's battle entry point
interface EncounterContext {
  encounterId: 'enc_desk_challenger' | 'enc_meeting_prepper' | 'enc_supervisor_1on1'
  enemy: Enemy // overworld content entry, rank in the `floor` slot
  boss: boolean
  declinable: boolean
  rewards: { xp: number; options: number } // explicit, never derived
  party: PartyMember[] // live copy; written back on every event patch
  activeIndex: number // 0 = lead
}

interface PartyMember {
  slot: 'party_slot_0' | 'party_slot_1' | 'party_slot_2'
  def:
    | { kind: 'lead'; classId: ClassId }
    | { kind: 'coworker'; id: 'cw_desk_challenger' | 'cw_meeting_prepper' }
  hp: number
  pp: number[]
}

// One new resolver entry point next to resolvePlayerMove / resolveItemUse:
//   resolvePartySwitch(ctx: TurnContext & { party, activeIndex }, to: number, rng): TurnResult
//   → events: switch_out, switch_in, then the existing resolveEnemyTurn against the incoming member.
// One new BattlePhase: 'switch_required' (entered instead of 'lost' when a bench member can stand).
// Two new BattleEventKinds: { kind: 'switch_out' | 'switch_in'; slot } and { kind: 'member_faint'; slot }.
// 'party_wipe' is just 'lost' reached with no standing member — no new event needed.
```

The projection rule Astra should follow: before any resolver call, copy the active member's
`hp`/`pp` into `run.hp`/`run.pp` and its kit into `effectivePlayer`; after the call, write
`run.hp`/`run.pp` back into `party[activeIndex]`. `run.hp`/`run.pp` are therefore scratch during a
battle and mirror `party[0]` (the lead) at rest. The balance simulation and the Classic tower never
construct a party, so their code paths are untouched.

### 3.5 XP, level, rewards, items — who gets what

| Thing                                  | Rule                                                                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XP                                     | Paid once per won encounter to the **team** (`RunState.xp`). One team level; every member's level bonus is the team level. No per-member XP, no grinding surface.         |
| Level-up heal (+20)                    | Applies to **every** member (the team gets promoted together). Fainted members stay fainted (0 → 20 would be a free revive; they get `min(hp + 20, max)` only if hp > 0). |
| Post-battle heals (PM perk, Self Care) | Apply to the member **active at the end** of the battle.                                                                                                                  |
| Stock Options                          | Team wallet on `RunState`. Once-only per encounter (`rwd_enc_*`). Recruiting pays nothing.                                                                                |
| Items                                  | Team bag (`RunState.inventory`). Key items (`keyItems`) are separate and uncapped.                                                                                        |
| Perks (promotion)                      | Team-wide via `collectMods`; stat packages apply to whoever is active. "Cleared Probation" is one pick for the team.                                                      |
| Break room / defeat restore            | Whole party, HP and PP, statuses cleared.                                                                                                                                 |

### 3.6 Switch tutorial (`trg_switch_coach`)

The party must be real without being mandatory in a way that punishes solo players. The teaching
moment is placed where the switch is genuinely the right call:

- Fires **once per save** (`flag_switch_coached`), in any battle where (a) the party has ≥ 2
  standing members, (b) the active member is below 50% HP, and (c) it's the player's turn.
- Coach mark (reuses the `onboarding.ts` coach-mark style) anchored on the SWITCH button:
  "SWITCH — send in Gavin. Holloway gets one free swing at whoever walks in." (name resolves to the
  first standing bench member). Dismisses on any action.
- Gavin's `dlg_gavin_joined` line seeds the idea in prose before the fight.

In practice this fires during the Holloway fight on the acceptance route. It never fires for a
player with no recruits, and it never blocks input.

### 3.7 Party UI

| Surface                            | Design                                                                                                                                                                                                                        |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HUD party strip (`ui_party_strip`) | Top strip, right side, next to HP / 📈 chips: three 54-px chips — portrait emoji/token, tiny HP bar (`HpBar` at 60% scale), fainted = greyed with "OUT". Empty slot = dotted outline. Lead chip has a `LEAD` eyebrow.         |
| Team panel (`ui_party_panel`)      | Key **P** / touch **TEAM** button (bottom bar, beside ACT). A `Panel` listing members: name, role, HP / PP per move, types, moves with `TypeBadge`. Read-only in MVP (no reorder/dismiss). Esc closes.                        |
| Bench picker (`ui_party_bench`)    | In battle, replaces the move grid while open: up to two member cards (portrait via `StagedSprite` at 64 px, name, HP bar, PP summary) + a back button. Forced mode hides the back button and shows "Send in the next person." |
| Recruit card                       | §3.2. A `Panel` over the overworld.                                                                                                                                                                                           |
| Battle deck                        | Existing 2×2 moves + a bottom row: `ITEMS` · `SWITCH` (badge shows standing bench count, e.g. "SWITCH · 1").                                                                                                                  |
| Active swap presentation           | `switch_out`: sprite slides down and fades (200 ms; instant under reduced motion), `switch_in`: new `StagedSprite` rises with its type-ring; log line "Gavin steps in." / "You step back in."                                 |

---

## 4. Activities — stages and copy

### 4.1 Required: "Get the printer working" — `asg_printer`

| #   | Stage             | Where                 | Player does             | Copy / feedback                                                                               | Objective banner after                                 |
| --- | ----------------- | --------------------- | ----------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0   | `not_started`     | Reception             | Talk to Renata          | `dlg_renata_ticket`                                                                           | Get the printer working — find toner in the break room |
| 1   | `accepted`        | Break room `(15,8)` ↑ | Open the supply cabinet | gain `key_toner` (toast: "Got: Toner Cartridge")                                              | Install the toner at the desk-pit printer              |
| 2   | `toner_collected` | Desks `(9,8)` ↑       | Install toner           | test page + two Offer Letters; `key_toner` consumed, `key_offer_letter` ×2 gained             | Report back to Renata                                  |
| 3   | `installed`       | Reception             | Talk to Renata          | `dlg_renata_close_ticket` → **+10 📈** (once, `rwd_asg_printer`); Renata explains the letters | Talk to Gavin at the desks                             |
| 4   | `complete`        | —                     | —                       | Unlocks Gavin's challenge; counts toward the supervisor prerequisite                          | —                                                      |

Reward is paid exactly once; re-talking never re-pays. The assignment can't be abandoned or
failed. The Offer Letters are the printer's second payload on purpose: the required activity hands
the player the recruitment tool before the first recruitable fight, so recruitment never needs a
detour.

### 4.2 Optional: "Prepare the meeting" — `asg_meeting_prep`

| #   | Stage          | Where                   | Player does               | Copy / feedback                                                                                          | Objective banner after (optional style) |
| --- | -------------- | ----------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| 0   | `not_started`  | Hall `(13,2)`           | Talk to Priya, take it on | `dlg_priya_request`                                                                                      | Prepare the meeting — read the agenda   |
| 1   | `accepted`     | Meeting room `(16,2)` → | Read agenda               | agenda card                                                                                              | Pick the matching handout from the rack |
| 2   | `accepted`     | Meeting room `(21,1)` → | Pick a handout            | choice menu below → `handout_held`                                                                       | Bring the handout to Priya              |
| 3   | `handout_held` | Hall                    | Deliver to Priya          | wrong → hint, handout kept, stage stays `handout_held`; right → **+6 📈** (once, `rwd_asg_meeting_prep`) | (cleared) → Priya offers the spar       |
| 4   | `complete`     | —                       | —                         | Spar available via `dlg_priya_spar`; winning it opens the second recruit                                 | —                                       |

Handout rack choice menu (order fixed; the correct answer is deliberately in the middle):

| Choice label (as shown)        | Key item granted         | Rack line on pick                                        |
| ------------------------------ | ------------------------ | -------------------------------------------------------- |
| Q3 Numbers — Full Deck (48 pp) | `key_handout_q3_deck`    | "Heavy. Confident. Wrong in a way you can't prove yet."  |
| Q3 Numbers — Summary (1 pg)    | `key_handout_q3_summary` | "One page. Someone did their job so you could do yours." |
| Q2 Numbers — Summary (1 pg)    | `key_handout_q2_summary` | "The staple is rusty. That's a clue."                    |

Wrong choices are never consumed or lost; picking again at the rack swaps the held handout
(toast: "Swapped: <old> → <new>"). Retry is a 20-tile round trip. A player who skipped reading the
agenda can still brute-force in at most two swaps — acceptable; the hints teach the rule.

---

## 5. Encounters — **FROZEN**

Battles use the existing battle screen and engine with the party projection from §3.4. Each
encounter is a content entry shaped like `Enemy` with additions: `rank` (stands in for `floor` in
payout/scaling), `boss` flag, `recruit` (the `cw_*` def unlocked by beating them, if any), and
explicit `xp` / `options` rewards (do **not** derive from `applyVictory`'s floor formula; the
numbers below are the contract — ranks 0/1 happen to match `15 + 7·rank` / `8 + 3·rank`, the boss
is a premium override). Overworld enemies live in their own content module and never enter
`ENEMY_POOLS`, so the tower balance snapshot stays bit-identical.

| Encounter id          | Opponent | Rank | Boss | Recruit unlocked     | HP  | ATK | DEF | Types                   | Battle sprite  | XP  | 📈 OPT | Declinable | Flee   |
| --------------------- | -------- | ---- | ---- | -------------------- | --- | --- | --- | ----------------------- | -------------- | --- | ------ | ---------- | ------ |
| `enc_desk_challenger` | Gavin    | 0    | no   | `cw_desk_challenger` | 70  | 8   | 6   | `normal`                | `overachiever` | 15  | 8      | yes        | n/a    |
| `enc_meeting_prepper` | Priya    | 1    | no   | `cw_meeting_prepper` | 85  | 11  | 7   | `strategy`              | `scrum`        | 22  | 11     | yes        | n/a    |
| `enc_supervisor_1on1` | Holloway | 2    | yes  | —                    | 130 | 14  | 9   | `influence`, `strategy` | `manager`      | 30  | 20     | **no**     | **no** |

Holloway is retuned from the solo draft (110/13/9 → 130/14/9) because the party adds 70–150 HP of
bench; she should still be a real threat to a solo lead and a tense, winnable fight for a team of
two.

"Flee n/a": the existing battle screen has no flee action; declining happens on the stakes card
before combat. For Holloway the stakes card has one button, and the lobby door prompt (§8) is the
only exit — before you step in.

### 5.1 Move sets and battle copy

Player uses their class kit (`PLAYER_CLASSES[classId].moves`), level bonuses from `turn.ts`
(+2 ATK / +1 DEF per team level), and the class starting item (`CLASS_STARTING_ITEMS`) in the
shared bag.

**Gavin — title `THE DESK NEIGHBOR`** · taunt: "You fixed the printer. Fix this." · defeat: "Gavin
returns to his desk and types nothing, loudly."

| Move                           | Dmg | Type        | Extra                     |
| ------------------------------ | --- | ----------- | ------------------------- |
| Well, Actually                 | 10  | `normal`    | —                         |
| Passive-Aggressive Sticky Note | 12  | `influence` | 30% Demoralized on player |

**Priya — title `THE MEETING COORDINATOR`** · taunt: "I've blocked fifteen minutes for this." ·
defeat: "Priya ends the meeting four minutes early. Unheard of."

| Move          | Dmg | Type        | Extra                      |
| ------------- | --- | ----------- | -------------------------- |
| Calendar Hold | 12  | `strategy`  | 40% Micromanaged on player |
| Agenda Item   | 14  | `strategy`  | —                          |
| Circle Back   | 8   | `influence` | heals 10                   |

**Holloway — title `THE TEAM LEAD (INTERIM)`** · taunt: "There's no leaving early." · defeat:
"Holloway writes something in a notebook. Probably your name. Possibly a smiley."

| Move                    | Dmg | Type        | Extra                       |
| ----------------------- | --- | ----------- | --------------------------- |
| One-on-One              | 14  | `influence` | 40% Demoralized on player   |
| Stretch Goal            | 18  | `execution` | —                           |
| Let's Take This Offline | 10  | `strategy`  | heals 12, Motivated on self |

No phase 2. Legacy enemy AI (`chooseEnemyMove`), never the smart AI. The enemy always targets the
active member; switching does not change its move choice.

Sanity math (`calcDamage`: base × atk/def × 0.85–1.15): a level-1 PM (ATK 16) two-shots Gavin
(~48/hit) and three-shots Priya (~41/hit). Against Holloway (DEF 9) the PM needs five hits
(~28/hit) while she lands 20–25 a turn — a solo PM at 100 HP is dead on turn 5 if nothing heals:
solo is possible with Espresso and luck, and that's the point. With Gavin on the bench: Sticky Note
(Holloway −DEF) turns the PM's hits into ~34, and Gavin soaks two of her turns; a two-member team
wins comfortably with one switch each way. Engineer (90 HP, DEF 8) takes 25–32 a turn and kills her
in four; Designer has an in-kit heal. Retune HP/DEF after the first playtest, not before.

### 5.2 Stakes card (pre-commit) — shared component copy

Shown as a `Panel` over the overworld before any battle. Live party strip (all members' HP) and
the active member's PP are displayed so the player can judge. Buttons use the existing `Button`
primary/secondary styles.

```
CHALLENGE · GAVIN · RANK 0
Win   +15 XP  ·  +8 📈 Options  ·  Offer eligible
Lose  Break room, walk back. Nothing lost.
Team  [ YOU 100 ] [ — ] [ — ]
[ Bring it ]   [ Not now ]
```

```
SPAR · PRIYA · RANK 1
Win   +22 XP  ·  +11 📈 Options  ·  Offer eligible
Lose  Break room, walk back. Nothing lost.
Team  [ YOU 100 ] [ GAVIN 70 ] [ — ]
[ Spar ]   [ Rain check ]
```

```
ONE-ON-ONE · HOLLOWAY · RANK 2 · BOSS
Win   +30 XP  ·  +20 📈 Options  ·  Access Badge  ·  Promotion
Lose  Break room, walk back, try again.
No leaving early.
Team  [ YOU 74 ] [ GAVIN 70 ] [ — ]
[ Begin ]
```

Won encounters pay once (`rwd_enc_*`). A won encounter cannot be re-fought in the MVP. "Offer
eligible" appears only on recruitable opponents while the player holds an Offer Letter.

---

## 6. Loss and recovery flow

1. Battle reaches `phase: 'lost'` — which, with a party, means every member has fainted
   (`party_wipe`). A single member fainting is a forced switch (§3.4), not a loss. The tower's
   `GameOverScreen` must **not** appear; the campaign is not over.
2. Interstitial (1.2 s, skippable, static under reduced motion): "Your team needs a minute." with
   the opponent's loss line (`dlg_*_you_lost`) beneath it.
3. Fade to the break room. Player placed at `(19,8)` facing the coffee counter. On arrival: **every
   party member** restored to full HP and PP, all statuses cleared, toast "You take five. Everyone's
   back." (auto — no press required; the counter stays available for free at any later time).
4. State: the encounter stays `open`; the opponent is at their tile and offers the same stakes
   card again; no XP, no Options, no items, no recruits are awarded or removed by the loss.
5. The cost is the walk back (break room → Gavin: 16 tiles; → Priya: 13; → Holloway's door: 16;
   about 4 s each at 4 tiles/s) plus the re-commit prompt. Consumables used during the lost battle
   are gone — the same rule as the tower, kept deliberately so Espresso purchases mean something.
6. Objective banner is unchanged by a loss.

Fainted members outside a loss: a member KO'd in a battle you _won_ stays at 0 HP until the break
room (or a level-up heal if they had HP left — they didn't). The party strip shows "OUT". The
stakes card shows them greyed. Walking into Holloway with a fainted bench is allowed and is a
choice the card makes visible.

---

## 7. Economy touchpoints (feel, not gating)

| Touchpoint             | Amount | When                      | Ledger id                 |
| ---------------------- | ------ | ------------------------- | ------------------------- |
| Signing float          | +10    | New campaign save created | `rwd_start_options`       |
| Printer ticket closed  | +10    | `dlg_renata_close_ticket` | `rwd_asg_printer`         |
| Gavin beaten           | +8     | `dlg_gavin_beaten`        | `rwd_enc_desk_challenger` |
| Handout delivered      | +6     | `dlg_priya_delivered`     | `rwd_asg_meeting_prep`    |
| Priya beaten           | +11    | `dlg_priya_beaten`        | `rwd_enc_meeting_prepper` |
| Holloway beaten        | +20    | `dlg_holloway_beaten`     | `rwd_enc_supervisor_1on1` |
| Recruiting (either)    | **0**  | `dlg_*_joined`            | — (no ledger entry)       |
| **Maximum on Floor 1** | **65** |                           |                           |

Recruitment is free and pays nothing: the floor's wallet is fixed at 65, an Options price would
compete directly with the Espresso that makes the boss survivable, and an Options reward would be
a second payout for the same win. Beating the coworker is the cost; the Offer Letter is the token.

Vending machine (`poi_vending_machine`) — the only spend on the floor. Prices are the existing
base prices at act-1 inflation (×1), unaffected by perks until a perk is owned (after Holloway,
`employee_discount` would apply via `shopPrice` — fine, it's post-boss).

| Item (existing id) | Price | Stock | Why it's here                                                                                  |
| ------------------ | ----- | ----- | ---------------------------------------------------------------------------------------------- |
| `espresso`         | 14 📈 | 2     | Affordable right after the printer (20 OPT). The boss safety valve; heals whoever is active.   |
| `side_hustle`      | 28 📈 | 1     | Exactly affordable after Gavin if nothing was spent (28 OPT). PP refill for the active member. |

Rules: purchases never gate progress (every fight is winnable from a fresh full-HP state without
items); `MAX_INVENTORY = 4` applies to the team bag; Wellness Day is not sold (the counter is
free); stock does not restock in the preview. Buying UI reuses `ShopScreen` with the stock and
Wellness row hidden.

---

## 8. Progression and gates

```
spawn ──► Renata ticket ──► toner ──► install (prints 2 Offer Letters) ──► Renata closes (+10)
                                                                                 │
                                                                                 ▼
               Gavin sightline/talk ──► stakes ──► WIN ──► enc_desk_challenger = won ──► OFFER? ──► Gavin joins
                                           │  LOSE ──► break room ──► walk back ──┘         (Not yet: re-offer on talk)
                                           ▼
    door (10,3): prerequisites met? ──no──► door just opens; Holloway explains what's missing
              │ yes
              ▼
"Step in?" [Step in] [Not yet] ──► lobby sightline ──► Holloway stakes [Begin] ──► fight (switch coach fires) ──► WIN
                                                        │ LOSE (party wipe) ──► break room ──► door again
                                                        ▼
                 badge ──► promotion (pick 1 of 3, offer persisted first) ──► elevator green
                                                                                 │
                                                                                 ▼
                                                   "Ride up?" ──► FLOOR 1 CLEARED ──► back to (3,2)
```

- **Supervisor gate**: `asg_printer = complete` AND `enc_desk_challenger = won`. Party size is not
  a gate. Until then the door at `(10,3)` is a normal door and Holloway just talks
  (`dlg_holloway_early` / `dlg_holloway_gavin_pending`).
- **Door commit prompt** (`trg_supervisor_door`, only when the gate is open and the boss is
  unbeaten). Stepping onto `(10,3)`:

  ```
  ELEVATOR LOBBY
  Holloway's one-on-one starts when you step in. It doesn't stop.
  Team  [ YOU 74/100 ] [ GAVIN 70/70 ] [ — ]   ·   📈 28
  [ Step in ]   [ Not yet ]
  ```

  "Not yet" ⎋ steps the player back to `(11,3)`. "Step in" places the player at `(9,3)` — inside
  Holloway's sightline — and `dlg_holloway_1on1` fires immediately. If every member is fainted the
  prompt reads "Your team needs a minute. Break room first." with only `[Back]`.

- **Promotion**: on `dlg_holloway_beaten`, the engine rolls `rollPerkOffer(run.perks, rng,
BASE_PERK_POOL)` and writes it to `pendingPerkOffer`, **saves**, then shows `PromotionScreen`
  with headline `CLEARED PROBATION`, sub-line "Pick one. HR calls it a development plan. It applies
  to the whole team." A reload mid-pick resumes the same offer (same rule as the tower). No title
  change in the MVP. Ledger `rwd_promotion_f1`.
- **Badge → elevator**: `key_access_badge` flips `poi_elevator_door` to the green state.
  Objective: **Take the elevator**.
- **End-of-preview celebration** (`screen_preview_complete`), full-bleed, reuses the
  `RunCompleteScreen` layout language:

  ```
  FLOOR 1 CLEARED
  You fixed a printer, hired a critic, survived a one-on-one, and got laminated.
  That's a career.

  Team  YOU · GAVIN · (PRIYA)        Assignments  2 / 2
  Battles won  3      Losses  1      Switches  2
  Options earned  65 📈              Time on floor  11:42

  Floor 2 is under construction. The elevator goes back down.
  [ Back to Floor 1 ]   [ Title ]
  ```

  Sets `flag_preview_complete`; returns the player to `(3,2)` facing south. The elevator can be
  ridden again (same screen, no new rewards). The second line adapts: "hired a critic" if Gavin
  was recruited, "hired nobody" if not, "hired two people" with Priya.

---

## 9. Pacing targets and estimates

Assumptions: 4 tiles/s, ~2.5 s per dialogue line at normal text speed (read time included),
first battle ~45–60 s with the current sequencer timings, boss ~2–3 min with switches.

| Target                       | Brief   | Estimate (attentive first-time player)                                                                       |
| ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Visible objective            | ≤ 30 s  | ~3 s (`trg_first_step` banner) · ticket objective at ~20 s (5 tiles + 4 lines)                               |
| First battle begins          | ≤ 3 min | ~2:05 — 52 tiles of printer loop (~13 s) + 7 interactions (~45 s incl. the letters) + Gavin's 3 lines + card |
| Recruit Gavin                | —       | +10 s (2 lines + card) — happens where you already stand                                                     |
| Full required department     | 10–15   | ~10–13 min with one loss, a vending stop, and a two-switch boss; ~8 min for a fast reader who never loses    |
| Optional meeting prep + spar | —       | +3–4 min; +10 s to recruit Priya                                                                             |

Recruitment adds no tiles to any route: both offers happen at the tile where you just won, using a
tool the required path already put in your hand. The switch tutorial is a coach mark, not a
screen. The boss fight is longer than the solo draft (130 HP, switches cost turns) — that is where
the extra minutes live, and it's the part that should feel long.

Risk: the required path can still land under 10 minutes for fast players. Do not pad it with
walking or extra lines; the fix, if wanted, is content on Floor 2, not friction on Floor 1.

---

## 10. Controls and accessibility

| Action              | Keyboard             | Touch                                             | Notes                                                                                          |
| ------------------- | -------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Move                | Arrows / WASD        | D-pad, bottom-left (min 54 px hits, `--tap-min`)  | 4-direction, tile-locked, hold to keep walking                                                 |
| Interact / advance  | Enter / E            | ACT button, bottom-right; tap dialogue to advance | Label chip shows the verb ("E · Talk — Renata" / "ACT · Talk — Renata")                        |
| Close / safe choice | Esc                  | ✕ on the dialogue box                             | Esc on a stakes card = the ⎋ option; disabled on Holloway's `[Begin]` card and forced switches |
| Team panel          | P                    | TEAM button (bottom bar, beside ACT)              | Read-only roster (§3.7)                                                                        |
| Battle moves        | 1–4 (existing)       | existing MoveButtons                              | Unchanged                                                                                      |
| Battle switch       | 5 / Tab              | SWITCH button beside ITEMS                        | Bench picker: ←/→ or 1–2 select, Enter confirm, Esc cancel (not when forced)                   |
| Menu (settings)     | Existing gear button | Existing gear button                              | Reduced motion, text speed, haptics already exist in `settings.ts`                             |

Layout on the 472×884 frame: top strip 60 px (objective banner left, HP / 📈 chips and the
3-chip party strip right), map 576 px (18 tiles × 32), controls 248 px (D-pad, ACT, TEAM, zone
chip). Desktop hides the D-pad/ACT/TEAM buttons and uses the space for the objective + a "Nearby"
line; P still opens the team panel.

Nearby interactions are always labeled: when the player is adjacent to and facing an interactable,
an `IconChip` with the verb and target name floats above it; it is also mirrored into an
`aria-live="polite"` region as "Nearby: Talk — Renata. Press E." Objective changes, reward toasts,
recruit toasts and switch events go through the same live region ("Gavin steps in. 70 HP.").

Reduced motion (OS preference or the in-app toggle): camera snaps per tile instead of easing; no
idle bob on NPC markers; sightline "!" bounce becomes a static "!"; zone chip swaps without fade;
switch-in/out slides become instant swaps; the party-strip fill animation is skipped; dialogue
typewriter is unaffected (it has its own text-speed setting).

Haptics (existing adapter): a short tick on interaction and on a recruit joining, the existing
battle pattern in combat, nothing on movement.

Focus: dialogue box is a focus trap while open; choice buttons are real `<button>`s with the
global `:focus-visible` ring; the bench picker traps focus while open and, in forced mode, moves
focus to the first standing member; when a box closes, focus returns to the map canvas or the move
grid.

---

## 11. Asset list

Reuse first. Placeholders are acceptable for the first slice and are listed so nothing ships
unlabeled.

### 11.1 Reused as-is

| Asset                                                       | Use                                                                                                                                |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `PixelSprite` / `StagedSprite` + `src/assets/characters/*`  | Battle portraits: player class sprites; Gavin `overachiever`, Priya `scrum` (as enemy **and** as party member), Holloway `manager` |
| `TextBox`                                                   | Dialogue typewriter                                                                                                                |
| `Panel`, `Button`, `IconChip`                               | Stakes card, recruit card, prompts, interaction labels                                                                             |
| `HpBar`, `XpBar`, `StatusBadges`, `MoveButton`, `TypeBadge` | Battle screen, party strip mini-bars, team panel                                                                                   |
| `PromotionScreen`                                           | Cleared Probation pick                                                                                                             |
| `ShopScreen`                                                | Vending machine (stock-only mode)                                                                                                  |
| `RunCompleteScreen` layout                                  | Floor 1 Cleared celebration                                                                                                        |
| Coach-mark style from `onboarding.ts`                       | Switch tutorial                                                                                                                    |
| `tokens.css`                                                | Zone tints, chips, eyebrows                                                                                                        |
| Emoji `📈`, `☕`, `💰`, `🪪`, `📄`                          | Currency, Espresso, Side Hustle, badge toast, Offer Letter toast                                                                   |

### 11.2 Needed — tiles (32×32, flat pixel style, dark palette from `--cc-surface-*`)

| Tile                                                                                         | MVP placeholder                                                         |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Floor carpet × 6 zone tints                                                                  | `--cc-surface-3` fill with zone accent at 8% overlay                    |
| Wall, glass wall/door frame, street exit                                                     | `--cc-surface-1` blocks with `--cc-line` hairline; door frame in accent |
| Elevator doors (2-wide), badge reader (red/green states)                                     | Two `--cc-surface-2` panels + a 4 px LED in `--cc-danger` / `--cc-heal` |
| Reception desk (3-wide), desk, chair                                                         | Rounded rectangles in `--cc-surface-1`, chairs in `--cc-text-faint`     |
| Printer (error / working states)                                                             | Box + tiny screen: `--cc-danger` when broken, `--cc-heal` when working  |
| Supply cabinet, vending machine, coffee counter (3-wide), break table (2-wide), water cooler | Boxes with emoji decals (`🗄️`, `🥤`, `☕`, `🎂`, `💧`)                  |
| Meeting table (4×2), agenda decal, handout rack                                              | Table block; `📄` decal; `🗂️` decal                                     |
| Plant, directory sign                                                                        | `🪴`, `🪧` decals on floor tiles                                        |

### 11.3 Needed — characters

| Asset                                        | Count | MVP placeholder                                                               |
| -------------------------------------------- | ----- | ----------------------------------------------------------------------------- |
| Player avatar, static, 4 facings, per class  | 12    | Class emoji (`📋` `⌨️` `🎨`) on a type-colored ring token with a facing notch |
| NPC map tokens (fixed facing)                | 4     | Emoji tokens: Renata `🪪`, Gavin `👓`, Priya `📅`, Holloway `👔`              |
| Party-strip chips                            | 3 + 2 | Same emoji tokens at 24 px (lead uses the class emoji; recruits reuse theirs) |
| "!" marker (callout), "?" marker (objective) | 2     | Text glyphs in `--cc-gold`                                                    |

### 11.4 Needed — UI

D-pad (4 buttons, 54 px min), ACT button, TEAM button, objective banner, party strip, team panel,
zone chip, reward toast, recruit card, bench picker, SWITCH button, "Your team needs a minute."
interstitial, agenda document card, celebration screen. All from existing tokens; no new colors.

### 11.5 Audio

Reuse `SFX` cues: `menuSelect` for steps onto interactables and bench selection, `fanfare` for a
recruit joining, the badge and the celebration, existing battle cues; the existing faint cue for
`member_faint`. New: none required. Music: overworld reuses the current title loop until a floor
theme exists (flagged as missing, not blocking).

---

## 12. Frozen content IDs — **FROZEN**

Astra codes against these. Additions are fine; renames go through this doc.

| Kind          | Ids                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floor         | `floor_01`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Zones         | `zone_reception`, `zone_desks`, `zone_break`, `zone_meeting`, `zone_elevator`, `zone_hall`                                                                                                                                                                                                                                                                                                                                                                                  |
| NPCs          | `npc_receptionist`, `npc_desk_challenger`, `npc_meeting_prepper`, `npc_supervisor`                                                                                                                                                                                                                                                                                                                                                                                          |
| Encounters    | `enc_desk_challenger`, `enc_meeting_prepper`, `enc_supervisor_1on1` (enemy content entries use the same ids)                                                                                                                                                                                                                                                                                                                                                                |
| Party slots   | `party_slot_0` (lead, fixed), `party_slot_1`, `party_slot_2`; constant `PARTY_MAX = 3`                                                                                                                                                                                                                                                                                                                                                                                      |
| Recruit defs  | `cw_desk_challenger` (Gavin), `cw_meeting_prepper` (Priya) — `PlayerClass`-shaped kits (§3.3)                                                                                                                                                                                                                                                                                                                                                                               |
| Party actions | `act_move` (existing move pick), `act_item` (existing item use), `act_switch` (new, key 5/Tab), `act_party_menu` (overworld, key P)                                                                                                                                                                                                                                                                                                                                         |
| Battle phases | existing `player` / `won` / `lost` + new `switch_required`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Battle events | new `switch_out`, `switch_in`, `member_faint` (with `slot`); `party_wipe` is `lost` with no standing member                                                                                                                                                                                                                                                                                                                                                                 |
| Party UI      | `ui_party_strip`, `ui_party_panel`, `ui_party_bench`, `ui_recruit_card`                                                                                                                                                                                                                                                                                                                                                                                                     |
| Assignments   | `asg_printer` (`not_started → accepted → toner_collected → installed → complete`), `asg_meeting_prep` (`not_started → accepted → handout_held → complete`)                                                                                                                                                                                                                                                                                                                  |
| Key items     | `key_toner`, `key_offer_letter` (stack, max 2, the recruit token), `key_handout_q3_summary`, `key_handout_q3_deck`, `key_handout_q2_summary`, `key_access_badge` — stored in `keyItems`, **never** in the 4-slot battle `inventory`                                                                                                                                                                                                                                         |
| POIs          | `poi_reception_desk`, `poi_directory_sign`, `poi_exit_door`, `poi_water_cooler`, `poi_printer`, `poi_supply_cabinet`, `poi_break_counter`, `poi_vending_machine`, `poi_break_table`, `poi_agenda`, `poi_handout_rack`, `poi_elevator_door`, `poi_supervisor_door`                                                                                                                                                                                                           |
| Triggers      | `trg_first_step`, `trg_sight_desk_challenger`, `trg_sight_meeting_prepper`, `trg_sight_supervisor`, `trg_supervisor_door`, `trg_elevator_ride`, `trg_switch_coach`                                                                                                                                                                                                                                                                                                          |
| Rewards       | `rwd_start_options`, `rwd_asg_printer`, `rwd_asg_meeting_prep`, `rwd_enc_desk_challenger`, `rwd_enc_meeting_prepper`, `rwd_enc_supervisor_1on1`, `rwd_promotion_f1` (each claimable once; recruitment has none)                                                                                                                                                                                                                                                             |
| Flags         | `flag_greeted`, `flag_badge_reader_denied`, `flag_switch_coached`, `flag_preview_complete`                                                                                                                                                                                                                                                                                                                                                                                  |
| Dialogue      | `dlg_renata_{callout,ticket,hint_toner,hint_install,close_ticket,gavin_pending,holloway,recruit_me,badged,after}` · `dlg_gavin_{busy,no_pressure,callout,challenge,declined,you_lost,beaten,offer,offer_declined,joined,party,after,after_win}` · `dlg_priya_{hook,request,pass,waiting,wrong_deck,wrong_q2,delivered,spar,raincheck,you_lost,beaten,offer,offer_declined,offer_full,joined,party,after}` · `dlg_holloway_{early,gavin_pending,1on1,you_lost,beaten,after}` |
| Shop          | vending stock: `espresso` ×2, `side_hustle` ×1 (existing item ids)                                                                                                                                                                                                                                                                                                                                                                                                          |
| Screens       | `screen_overworld`, `screen_preview_complete` (naming suggestion; Astra owns file names)                                                                                                                                                                                                                                                                                                                                                                                    |
| Save          | separate slot key `corporate-climb-office-save`, own version number starting at 1; Classic `corporate-climb-save` untouched                                                                                                                                                                                                                                                                                                                                                 |

Office campaign save shape (the field names below are part of the freeze; Astra owns types and
migration plumbing):

```ts
interface OfficeSave {
  version: 1
  run: RunState // classId, level, xp, xpToNext, stockOptions, perks, pendingPerkOffer, inventory; hp/pp mirror party[0] at rest
  party: PartyMember[] // ordered; [0] is the lead; hp/pp per member (see §3.4 for the shape)
  floorId: 'floor_01'
  player: { x: number; y: number; facing: 'n' | 'e' | 's' | 'w' }
  assignments: Record<'asg_printer' | 'asg_meeting_prep', string>
  encounters: Record<
    'enc_desk_challenger' | 'enc_meeting_prepper' | 'enc_supervisor_1on1',
    'open' | 'won'
  >
  keyItems: Record<string, number> // counts; key_offer_letter ≤ 2, everything else 0/1
  rewardsClaimed: string[]
  flags: string[]
  firedTriggers: string[] // sightline/once-only bookkeeping, keyed `${trigger}:${state}`
  stats: { battlesWon: number; losses: number; switches: number; msOnFloor: number }
}
```

`RunState.floor` stays `0` for the whole preview; `rank` on the encounter drives anything that
used to read the floor. A battle in progress is not saved (same as the tower); the save is
written on every overworld state change, including recruitment and the promotion offer roll.

---

## 13. Route traces and acceptance checklist (paper playtest)

Steps are tile moves; `→` is an interaction. State after each beat is in brackets.

### 13.1 Required route (acceptance route: recruit Gavin, win Holloway with a switch)

1. Spawn `(12,15)` facing north. First step → `dlg_renata_callout`; banner "Talk to Renata".
2. Walk `(12,16) → (8,16)` (5 steps), face north → Renata. `dlg_renata_ticket`
   [`asg_printer = accepted`]. Banner: find toner.
3. Walk `(8,16) → (5,16) → (5,13) → (5,12)D → (5,11)` (8). Gavin is at `(6,10)`; his sightline is
   inactive (printer not complete). Optional peek: talk → `dlg_gavin_no_pressure`.
4. Walk `(6,11) → (9,11) → (9,9) → (10,9)D → (13,9) → (14,9)D → (15,9) → (15,8)` (13), face north
   → cabinet. [`toner_collected`, `key_toner`]. Banner: install.
5. Walk back `(15,9) → (14,9) → (10,9) → (9,9) → (9,8)` (8), face north → printer. Three lines.
   [`installed`, toner consumed, **`key_offer_letter` ×2**]. Banner: report back.
6. Walk `(9,9) → (9,11) → (5,11) → (5,12) → (5,13) → (7,13) → (7,14)` (12), face east → Renata.
   `dlg_renata_close_ticket`, **+10 📈** (balance 20), letters explained. [`complete`]. Banner:
   talk to Gavin.
7. Walk `(6,14) → (6,13) → (5,13) → (5,12) → (5,11) → (5,10)` (6). Stepping on `(5,10)` enters
   Gavin's sightline → `dlg_gavin_callout` → `dlg_gavin_challenge` → stakes card → `[Bring it]`.
   **Battle 1**, solo (~2:05 elapsed at this point).
8. Win → `dlg_gavin_beaten`, +15 XP (15/30), **+8 📈** (28). [`enc_desk_challenger = won`] →
   `dlg_gavin_offer` → recruit card → `[Extend the offer]` → `dlg_gavin_joined`.
   [**party = YOU, GAVIN**; letters 1]. Banner: see Holloway.
9. Optional vending: `(5,9) → (9,9) → (14,9) → (21,9)` (16), face east → buy Espresso (14 → balance
   14). Recommended for a first run; skip for the fastest route.
10. Walk `(5,9) → (9,9) → (10,9)D → (11,9) → (11,3) → (10,3)D` (14). Door prompt (party strip shows
    YOU / GAVIN) → `[Step in]` → placed at `(9,3)` → `dlg_holloway_1on1` (with the "You brought
    people" line) → `[Begin]`. **Boss.**
11. Boss script a reviewer should be able to reproduce: lead attacks twice (~56 dmg); Holloway's
    two turns leave the lead near 50% → `trg_switch_coach` fires → `SWITCH` → Gavin in (Holloway's
    free swing hits Gavin) → Gavin uses Passive-Aggressive Sticky Note (Holloway Demoralized) →
    `SWITCH` back to the lead (free swing on the lead) → two boosted hits finish her. If the lead
    faints instead, the forced switch to Gavin happens with no enemy turn and Gavin finishes or
    falls; a party wipe goes to §6 and the route resumes at step 10.
12. Win → `dlg_holloway_beaten`, +30 XP (45 ≥ 30 → **team Level 2**, +20 HP to every standing
    member), **+20 📈** (48, or 34 with the Espresso), `key_access_badge`. Offer rolled and saved →
    `PromotionScreen` "CLEARED PROBATION" → pick one of three.
13. Walk `(9,2) → (3,2)` (7 — Holloway stands at `(6,3)`, so go along row 2), face north →
    elevator. "The reader blinks green." → `[Ride up]` → **FLOOR 1 CLEARED** → `[Back to Floor 1]`
    → `(3,2)` facing south. [`flag_preview_complete`]. Renata now says `dlg_renata_after`; Gavin
    says `dlg_gavin_after_win`.

Tile total ≈ 73 moves (~18 s of walking); the rest is reading, recruiting and fighting.

### 13.2 Optional route (insert between steps 8 and 10 above, or any time after step 2)

- a. From the desks door `(10,9)`, walk up the hall on column 13: `(11,9) → (13,9) → (13,5)` (6).
  Stepping on `(13,5)` enters Priya's sightline → `dlg_priya_hook` → `dlg_priya_request` →
  `[Take it on]`. [`asg_meeting_prep = accepted`]. Optional-style banner: read the agenda.
- b. Walk `(13,4) → (13,3) → (14,3)D → (16,3) → (16,2)` (5), face east → agenda card. Banner: pick
  the handout.
- c. Walk `(16,1) → (21,1)` (6), face east → rack → choose **Q3 Numbers — Summary (1 pg)**
  [`handout_held`, `key_handout_q3_summary`]. Banner: bring it to Priya.
  - Wrong-pick branch: choose the Full Deck, walk back to Priya `(13,3)` facing north (10 steps) →
    `dlg_priya_wrong_deck`; return to the rack (10), swap for the Summary. Nothing lost; ~12 s.
- d. Walk `(16,1) → (16,3) → (14,3)D → (13,3)` (10), face north → Priya → `dlg_priya_delivered`,
  **+6 📈**, handout consumed [`complete`] → `dlg_priya_spar` → `[Spar]`. **Battle 2** — with
  Gavin on the bench if step 8 happened (+22 XP, **+11 📈**) [`enc_meeting_prepper = won`] →
  `dlg_priya_offer` (needs a letter and a free slot) → `[Extend the offer]` → `dlg_priya_joined`
  [**party = YOU, GAVIN, PRIYA**; letters 0].
- e. Loss branch (any fight): "Your team needs a minute." → `(19,8)`, whole party restored → walk
  back: to Priya 13 tiles, to Gavin 16, to Holloway's door 16 → same stakes card.
- f. Rejoin the required route at step 10 (Priya's tile is 4 steps from the lobby door).

With the optional route: 65 📈 total, team level 2 reached at Priya (37 XP ≥ 30), Holloway then
lands at 37/55 — no second level-up in the preview. A full party makes Holloway comfortable; that
is the reward for doing everything.

### 13.3 Acceptance checklist (a reviewer must be able to tick every box)

| #   | Check                                                                                                                                               | Where it's specified |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| A1  | Objective banner visible within 30 s of spawn                                                                                                       | §9                   |
| A2  | Printer fixed; Renata pays +10 exactly once; installing toner yields Offer Letter ×2                                                                | §4.1, §2.5           |
| A3  | Gavin's fight starts before 3:00 on a straight run; it is solo (party strip shows one chip)                                                         | §9, §13.1            |
| A4  | After beating Gavin, the recruit card appears; `[Not yet]` keeps the letter and talking again re-offers; `[Extend the offer]` fills slot 2          | §3.2                 |
| A5  | Team panel (P / TEAM) lists YOU + GAVIN with HP/PP; Gavin's map token is still at `(6,10)` with `dlg_gavin_party`                                   | §3.7, §2.2           |
| A6  | Door `(10,3)` prompt shows the party strip; `[Not yet]` steps back; `[Step in]` triggers Holloway with the "You brought people" line                | §8                   |
| A7  | In the Holloway fight, SWITCH (5/Tab/button) opens the bench; switching costs the turn (Holloway swings at the incoming member)                     | §3.4                 |
| A8  | Switch coach mark appears once when the active member drops under 50% with a standing bench member; never again on this save                        | §3.6                 |
| A9  | Lead KO with Gavin standing → forced bench picker, no cancel, no enemy turn; both KO → "Your team needs a minute." → break room, both restored      | §3.4, §6             |
| A10 | Holloway win pays +30 XP / +20 📈 once, grants the badge, rolls and **saves** the perk offer before `PromotionScreen` shows                         | §5, §8               |
| A11 | Elevator green → celebration screen shows Team, Switches count, Options earned; return to `(3,2)`; ride again shows the same screen, no new rewards | §8                   |
| A12 | Optional: Priya recruited with the second letter; a third recruit attempt is impossible (no letters; `dlg_*_after`)                                 | §2.3, §3.2           |
| A13 | Reload mid-campaign restores position, party HP/PP, letters, assignment stages, encounter results, and a pending promotion offer                    | §12                  |
| A14 | Classic save untouched by any of the above; Classic Continue still works                                                                            | §12                  |

Why the switch is exercised but not gated: gating the badge on "you must have switched" would be
an invisible rule and would punish a strong solo run. Instead the boss is tuned so the switch is
the obvious play (§5.1), the coach mark names it at the moment it matters (§3.6), and A7–A9 make
the reviewer perform it. A solo win is legal, hard, and honest.

### 13.4 State matrix (which line plays)

| Player state                          | Renata                    | Gavin                      | Priya                            | Holloway (door open) | Elevator       |
| ------------------------------------- | ------------------------- | -------------------------- | -------------------------------- | -------------------- | -------------- |
| Fresh                                 | `ticket`                  | `busy`                     | `hook` / `request`               | `early`              | red            |
| Printer accepted / toner / installed  | `hint_*` / `close_ticket` | `no_pressure`              | `request` or `waiting`           | `early`              | red            |
| Printer complete, Gavin open          | `gavin_pending`           | `callout` → `challenge`    | as above                         | `gavin_pending`      | red            |
| Gavin won, not recruited, letter held | `holloway` (solo line)    | `offer` (re-offer on talk) | as above                         | door prompt → `1on1` | red            |
| Gavin won and recruited               | `holloway` (team line)    | `party`                    | as above / `offer` after her win | door prompt → `1on1` | red            |
| Holloway won, not ridden              | `badged`                  | `party` / `after`          | as above                         | `after`              | green          |
| Preview complete                      | `after`                   | `after_win` / `after`      | `party` / `after`                | `after`              | green (replay) |

---

## 14. Decisions and their reasons

- **Party of 3, lead fixed in slot 0.** Matches the floor's content exactly, fits the deck and the
  strip, and keeps "you are the employee" true — coworkers are hires, not replacements.
- **Offer Letters from the printer.** The recruitment token comes out of the required activity,
  costs nothing, can't be bought, and is capped at the number of recruitables. No detour, no
  economy interaction, and it's a joke that lands.
- **Recruit = beat + letter, offered immediately.** No "convince" minigame, no capture roll:
  deterministic, ten seconds, and the fight you just had _is_ the convincing.
- **Switch costs the turn; forced switch doesn't.** The standard Pokémon contract. Voluntary
  switching has a price so the bench isn't a free heal; a KO already cost you the exchange.
- **Statuses clear on switch.** Makes the switch a tool against Demoralized/Micromanaged (which is
  exactly what Holloway does) and a cost for buff builds. One rule, both directions.
- **Team-level XP, team wallet, team bag.** Zero per-member bookkeeping in a fixed-economy floor;
  `RunState.level/xp/inventory/stockOptions` stay exactly as they are.
- **Recruits stay at their desks.** No follower sprites, no pathing; the dialogue owns the joke.
- **Holloway retuned up (130 HP).** The bench is real HP; the boss has to respect it or the switch
  is never worth its turn.
- **Sightlines trigger talk, not fights.** Keeps "no random encounters" literal; the stakes card
  is the only way into combat.
- **Auto-restore on defeat arrival**, whole party: removes the failure mode of wandering back to
  the boss with a fainted bench; the counter still exists as a free, discoverable heal.
- **No rematches on won encounters.** Prevents XP/Options farming on a floor with a fixed economy;
  reopening them is a Floor 2+ question. Declined offers are re-offerable, so nothing is lost.
- **Boss rewards are overrides, not formula.** `applyVictory` would give 29 XP / 14 OPT at rank 2;
  the brief's 30 / 20 is a boss premium the player should feel.
- **Key items are a separate list.** The 4-slot battle bag is a real constraint in fights; toner
  and letters must never displace an Espresso.
- **Promotion title unchanged.** Tower titles are pinned to floors 5/10/15/20/25; the office gets
  its own ladder later. "Cleared Probation" is the headline, the team-wide perk pick is the reward.
- **Commit at the door, not at Holloway.** "No flee" is honest only if the last exit is visible
  and shows your team's HP.
- **Handout rule check happens at delivery, not at the rack.** The walk back is the small tax
  that makes the agenda worth reading; hints make it never punishing.

## 15. Open risks for Astra's architecture pass

1. **Party projection over `TurnContext`.** `resolvePlayerMove` / `resolveItemUse` read
   `run.hp`/`run.pp`/`effectivePlayer`. The design asks for a copy-in/copy-out projection of the
   active member (§3.4) plus one new entry point `resolvePartySwitch` and one new phase
   `switch_required`. Watch: `'lost'` is passed to `finish()` from two call sites in `turn.ts`
   (the enemy-turn KO and the end-of-turn burn KO) — both need the bench check to choose
   `switch_required` instead. Keep the tower path bit-identical (no party → old
   behaviour) so `simulation.test.ts` stays green.
2. **`BattleEventKind` additions.** `switch_out` / `switch_in` / `member_faint` need sequencer
   entries (timing table) and `ViewPatch` support for swapping the player sprite/HP bar mid-battle.
   The `BattleScreen` currently assumes one player identity for the whole fight.
3. **Battle exit plumbing.** The tower's post-battle path (`applyVictory` → victory screen → floor
   advance / `GameOverScreen`) assumes a run ladder. The office needs an encounter-mode battle entry
   that returns to `screen_overworld` on win (then runs `dlg_*_beaten` → optional `dlg_*_offer`) and
   to the break-room flow on loss, with explicit `xp` / `options` from the encounter.
4. **Level-up heal semantics.** `applyVictory` heals `run.hp` by `levelUpHeal`; with a party it
   must heal every standing member (§3.5) — a small change but it touches a shared function; gate
   it on the presence of a party.
5. **`Enemy.floor` is required by the type.** Either put `rank` in that slot for office entries or
   widen the type; do not let office entries near `ENEMY_POOLS` (balance snapshot must stay
   bit-identical). Recruit kits (`cw_*`) are `PlayerClass`-shaped but have no `perk`/`intro`/
   `winText` — make those optional or give the kits neutral values.
6. **Promotion offer persistence.** Roll and save `pendingPerkOffer` before the screen mounts —
   the same rule the tower follows via `advanceFloor`; here the trigger is the boss win, not a floor
   change.
7. **Save isolation and shape.** A second slot key (`corporate-climb-office-save`) means two
   Continue states; clearing one must never clear the other; `history.ts` lifetime stats should
   either ignore the office or tag it. `run.hp`/`run.pp` mirroring `party[0]` at rest is a
   two-places-to-be-wrong risk — consider making `party` canonical and `run.hp/pp` derived.
8. **Title screen crowding.** A third mode (Office) plus Continue/Daily/Codex/golden-badge easter
   egg needs a layout pass; the office should probably be one button that manages its own
   Continue/New inside.
9. **Balance is untested.** Numbers in §5 are derived from the damage formula, not from play; the
   solo-Engineer-vs-Holloway matchup is the tightest and the full-party fight may be too easy. Tune
   Holloway's DEF/HP and the recruits' HP, not rewards or letter counts.
10. **Pacing may run short** of the 10-minute floor for fast readers (§9). Recommendation: accept.
11. **Touch ergonomics.** D-pad + ACT + TEAM on a 472-px-wide frame at ~17% shrink on small phones
    must keep `--tap-min`; the 248-px control band is sized for that but needs a device check. The
    battle deck gains a SWITCH button beside ITEMS — check the deck height stays stable (PR #59
    fixed a deck-height jitter; don't reintroduce it).
12. **Camera + reduced motion.** Horizontal follow with clamping is new UI code; verify no
    sub-pixel shimmer at the Stage scale and that the snap mode is truly static.
13. **Portrait/token mismatch.** Gavin's map token (emoji) and battle/party portrait
    (`overachiever` WebP) won't match. Acceptable for the preview; fix with real tokens.
14. **Keyboard collisions.** Key 5 for SWITCH sits next to the 1–4 move keys; Tab is the
    alternative. Make sure Tab doesn't fight the focus order of the move grid (it's also the
    browser's focus key — intercept only while the battle deck has focus).
