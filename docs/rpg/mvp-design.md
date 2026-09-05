# The Office — Overworld MVP Design (Floor 1)

_Status: design freeze for the first slice, revision 3 (polish specified as an acceptance
criterion). Owner: Fable (experience, content, wording, pacing, polish sign-off). Implementation:
Astra. This document is meant to be playtested on paper — every tile, line, number, screen, and
piece of feedback a reviewer needs is here. Anything marked **FROZEN** is an ID or value code will
be written against; change it here first, then in code. Nothing player-facing in this document is
"fine for now": §14 separates ship-quality requirements from stand-ins, and §19 is the checklist
the slice must pass before it is called done._

Companion reading: `CLAUDE.md` (architecture), `src/content/*` (existing classes, items, perks,
enemies the overworld reuses), `src/engine/turn.ts` (the one battle resolver the party rides on),
`src/ui/tokens.css` (visual system), `src/sfx.ts` and `src/platform/haptics.ts` (the cue
vocabulary every feedback row below is written against). `docs/REWRITE_PLAN.md` is historical;
nothing here restarts that rewrite.

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

### Polish is the acceptance criterion

This is a small floor, so every surface on it is load-bearing. The bar: a player who has never seen
Corporate Climb can pick this up on a phone, always knows where to go and why, never wonders
whether an input registered, never sees a blank panel or a raw emoji standing in for furniture, and
finishes wanting Floor 2. Concretely: every screen and overlay is named and laid out (§10), every
action has feedback (§12), every transition has a return position and a tone (§13), the art is
ship-quality or it blocks done (§14), and Fable signs the §19 checklist in the task-8 playtest.

### Locked defaults (from the brief, confirmed against the repo)

| Default                                         | Repo check / design answer                                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Player is the lead employee (chosen class)      | `PLAYER_CLASSES` (pm / eng / design) reused as-is; `ClassSelect` reused; lead is always party slot 0                                        |
| **Recruitable coworker party — required in v1** | §3. Party cap 3 (lead + 2). Recruit by beating a recruitable coworker and extending an Offer Letter the printer produced                    |
| Persistent completed work                       | Assignment stages, encounter results and the party roster live on the office campaign save (§15)                                            |
| Free break-room recovery, no loss currency cost | "Take five" restores the whole party; nothing in `RunState` is decremented on defeat                                                        |
| Static directional avatar                       | Badge-token avatar with a facing notch, 4 facings, no walk cycle (§14.2); recruits do not follow on the map                                 |
| Classic tower stays on its own save slot        | Classic uses `corporate-climb-save`; the office campaign gets its own key (§15). Title screen gets a third mode button                      |
| One floor, 24×18 tiles, five zones + connector  | §1                                                                                                                                          |
| No random encounters                            | Every battle is behind an explicit confirm (§5). Sightlines trigger _dialogue_, never combat                                                |
| One battle system                               | The party is a projection over the existing `TurnContext`; one new player action (switch) and one new battle phase (§3.4). No second engine |
| Currency                                        | Stock Options (`📈`, `CURRENCY_ICON`), the existing run currency. Written "Options" in dialogue, "OPT" only in the wallet chip              |
| Polish                                          | Hard acceptance criterion: §10 presentation, §12 feedback, §13 transitions, §14 asset bar, §19 sign-off checklist                           |

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
| `=`   | Desk                       | yes   | Reception desk tiles `(7–9,15)` proxy "Talk · Renata" | `poi_reception_desk`  |
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
rule). Standing adjacent without facing shows no prompt. Recruited coworkers keep their map tile
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

Zone display names (used in the zone chip and in objective destination chips): RECEPTION, DESKS,
BREAK ROOM, MEETING ROOM, ELEVATOR LOBBY, HALL.

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
| `trg_switch_coach`    | in battle                    | —      | —                            | §3.6                                                     | `coach_switch`                                  |

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

Dialogue conventions: one box = one line below, rendered in `ovl_dialogue` (§10.4). Lines advance
on Enter/E/tap; Esc closes a plain dialogue, and on a choice prompt Esc selects the safe option
(marked ⎋). `→` means state effect. Every node id is `dlg_<npc>_<name>`.

Copy rules (§9.2): a line is ≤ 90 characters and fits two rows of the box; a node is at most three
lines before a choice or an effect; no line explains a control (controls are taught by prompts and
coach marks, §9.3); every NPC line names a place, a person, or a joke.

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

Portraits (all reused from `src/assets/characters/`, see §14.2): Renata `recruiter`, Gavin
`overachiever`, Priya `scrum`, Holloway `manager`. The same headshot crop appears on the map token,
in the dialogue eyebrow, on the party strip, in the team panel, on the bench picker and on the
recruit card — one face per person everywhere.

### 2.1 `npc_receptionist` — Renata, Front Desk

Role: gets the player moving and interacting, issues and closes the printer ticket, points to the
next beat, explains the Offer Letters. Never fights.

| Node                       | Condition                                                 | Lines / choices                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_renata_callout`       | `trg_first_step`, once                                    | _(spoken across the room — no portrait, "!" marker pops over Renata, destination pin lands on her)_ "New hire. Front desk. Now." → objective: **Talk to Renata** · destination RECEPTION → `flag_greeted`                                                                                                                                                                                                                                                                                         |
| `dlg_renata_ticket`        | `asg_printer = not_started`                               | "You have the look. Hopeful. Badge-less." · "Floor 1: reception, desks, break room, meeting room, elevator. That's the whole world for now." · "Your first ticket is already late. The desk-pit printer is down. Toner's in the grey cabinet in the break room." · "Fix it, then come back so I can close the ticket." → `asg_printer = accepted` → objective: **Get toner from the supply cabinet** · destination BREAK ROOM                                                                     |
| `dlg_renata_hint_toner`    | `asg_printer = accepted`                                  | "Break room's up the hall, on the right. Grey cabinet. Nobody labels it. Push."                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dlg_renata_hint_install`  | `asg_printer = toner_collected`                           | "You're holding toner like it's a promotion. Printer. Desk pit. Go."                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `dlg_renata_close_ticket`  | `asg_printer = installed`                                 | "It printed? It printed. Ticket closed." → **receipt** `TICKET #0001 CLOSED` (+10 📈) · "Ten Options. Don't spend them all on espresso. Spend most of them on espresso." · "It printed offer letters too? Keep them. HR pre-signs a stack every quarter. Beat someone in an argument, hand them one, they're yours." · "Gavin at the desks wants a word. He wants a word with everyone." → `asg_printer = complete`, `rwd_asg_printer` claimed → objective: **Talk to Gavin** · destination DESKS |
| `dlg_renata_gavin_pending` | `asg_printer = complete`, `enc_desk_challenger = open`    | "Gavin's still at his desk. He's always at his desk. It's sort of his whole thing."                                                                                                                                                                                                                                                                                                                                                                                                               |
| `dlg_renata_holloway`      | `enc_desk_challenger = won`, `enc_supervisor_1on1 = open` | "Holloway wants to see you. Elevator lobby, through the glass door." · _(if party size = 1)_ "Alone? Bold. She's built to outlast one person." · _(if party size ≥ 2)_ "Bring the team. She talks a lot; let someone else stand there for a bit." · "Eat something first."                                                                                                                                                                                                                        |
| `dlg_renata_recruit_me`    | any time the player holds `key_offer_letter`, talk twice  | "Don't. I'm the front desk. I don't go places."                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dlg_renata_badged`        | `key_access_badge` held, `flag_preview_complete` unset    | "Look at you. Badged. Elevator's top left. It goes to Floor 2." · "Floor 2 isn't finished. Take that up with the people who build floors."                                                                                                                                                                                                                                                                                                                                                        |
| `dlg_renata_after`         | `flag_preview_complete` set                               | "Back already? Floor 2 will be there when it exists."                                                                                                                                                                                                                                                                                                                                                                                                                                             |

### 2.2 `npc_desk_challenger` — Gavin, Senior Associate

Role: the required gate before the supervisor and the first recruit. Grudging, territorial, never
actually busy. Encounter `enc_desk_challenger` (rank 0). Declinable. No rematch after a win (§17).
Recruit def `cw_desk_challenger` (§3.3).

| Node                       | Condition                                               | Lines / choices                                                                                                                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_gavin_busy`           | `asg_printer = not_started`                             | "Can't talk. Printing." · "Trying to print. Somebody's meant to be fixing that."                                                                                                                                                                                                       |
| `dlg_gavin_no_pressure`    | `asg_printer ∈ {accepted, toner_collected, installed}`  | "You're the fix? Great. No pressure. The whole quarter is in that tray."                                                                                                                                                                                                               |
| `dlg_gavin_callout`        | sightline, `asg_printer = complete`, `enc = open`, once | "Hey. Printer person." → continues into `dlg_gavin_challenge`                                                                                                                                                                                                                          |
| `dlg_gavin_challenge`      | talk, `asg_printer = complete`, `enc = open`            | "You fixed a printer on day one. Now everyone thinks you're competent." · "Desk-pit rules: we argue until one of us stops. Loser refills the coffee." → **stakes card** (§5.2): `[Bring it]` → battle · `[Not now]` ⎋ → `dlg_gavin_declined`                                           |
| `dlg_gavin_declined`       | chose Not now                                           | "Sure. I'll be here. I'm always here."                                                                                                                                                                                                                                                 |
| `dlg_gavin_you_lost`       | talk after a loss, `enc = open`                         | "Break room's that way. Take five." · "I'll be here, still not having been beaten." → `dlg_gavin_challenge` on next talk                                                                                                                                                               |
| `dlg_gavin_beaten`         | immediately after win (after the receipt)               | "…Okay. Fine. Okay." · "Holloway's going to hear about this. From me. Reluctantly." → `enc_desk_challenger = won` → continues into `dlg_gavin_offer` if `key_offer_letter` held, else objective: **See Holloway** · destination ELEVATOR LOBBY                                         |
| `dlg_gavin_offer`          | `enc = won`, not in party, `key_offer_letter` held      | "…Is that an offer letter. Is that a pre-signed offer letter." · "You know what, fine. If you're going up against Holloway I want to be in the room. For the story." → **recruit card** (§3.2): `[Extend the offer]` → `dlg_gavin_joined` · `[Not yet]` ⎋ → `dlg_gavin_offer_declined` |
| `dlg_gavin_offer_declined` | chose Not yet                                           | "Right. Keep it. I'll be at my desk, professionally unbothered." → objective: **See Holloway** · destination ELEVATOR LOBBY                                                                                                                                                            |
| `dlg_gavin_joined`         | offer extended                                          | "I'm still sitting here. Being on your team and being at my desk are both true." · "Switch me in when Holloway starts a sentence with 'so'. Trust me." → `party += cw_desk_challenger`, `key_offer_letter` −1 → objective: **See Holloway** · destination ELEVATOR LOBBY               |
| `dlg_gavin_party`          | in party, `enc_supervisor_1on1 = open`                  | "Still on your team. Still at my desk. Multitasking."                                                                                                                                                                                                                                  |
| `dlg_gavin_after`          | `enc = won`, not in party, no `key_offer_letter`        | "We're not doing that again. I have a reputation to rebuild."                                                                                                                                                                                                                          |
| `dlg_gavin_after_win`      | in party, `enc_supervisor_1on1 = won`                   | "We beat Holloway. I'm putting it on my calendar as a recurring event."                                                                                                                                                                                                                |

### 2.3 `npc_meeting_prepper` — Priya, Ops

Role: optional assignment (meeting prep), optional battle, optional second recruit. Competent,
over-caffeinated, blames herself out loud so nobody else has to. Encounter `enc_meeting_prepper`
(rank 1). Declinable. The spar is offered only after the handout is delivered. Recruit def
`cw_meeting_prepper` (§3.3).

| Node                       | Condition                                                     | Lines / choices                                                                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_priya_hook`           | sightline, `asg_meeting_prep = not_started`, once             | "Don't go in there. The 10:30 isn't ready. I'm the reason. I'm choosing not to accept that." → continues into `dlg_priya_request`                                                                                                                                           |
| `dlg_priya_request`        | talk, `asg_meeting_prep = not_started`                        | "Read the agenda on the table. Bring me the handout that matches." · "There are three. Two are wrong. That's the job." → `[Take it on]` → `asg_meeting_prep = accepted`, optional objective: **Read the agenda** · destination MEETING ROOM · `[Pass]` ⎋ → `dlg_priya_pass` |
| `dlg_priya_pass`           | chose Pass                                                    | "Fair. Nobody signed up for the 10:30."                                                                                                                                                                                                                                     |
| `dlg_priya_waiting`        | `asg_meeting_prep = accepted`                                 | "Agenda's on the table. Handouts are on the rack. Matching is the hard part, apparently."                                                                                                                                                                                   |
| `dlg_priya_wrong_deck`     | `handout_held`, holding `key_handout_q3_deck`                 | "Forty-eight pages. She'll read the first one and hold the rest like a shield." · "Summary. One page." _(handout stays in hand; swap it at the rack)_                                                                                                                       |
| `dlg_priya_wrong_q2`       | `handout_held`, holding `key_handout_q2_summary`              | "That's Q2. We don't say Q2 here anymore." · "Check the quarter on the agenda." _(handout stays in hand)_                                                                                                                                                                   |
| `dlg_priya_delivered`      | `handout_held`, holding `key_handout_q3_summary`              | "This is it. This is the one. You have no idea how rare that is." → consume handout, `asg_meeting_prep = complete` → **receipt** `THE 10:30 — PREPPED` (+6 📈) · "Six Options. Expensed, technically." → continues into `dlg_priya_spar`                                    |
| `dlg_priya_spar`           | `asg_meeting_prep = complete`, `enc_meeting_prepper = open`   | "While I've got you. I run a thing. Pre-meeting sparring. Keeps the nerves off." → **stakes card** (§5.2): `[Spar]` → battle · `[Rain check]` ⎋ → `dlg_priya_raincheck`                                                                                                     |
| `dlg_priya_raincheck`      | chose Rain check                                              | "Rain check. I'll hold you to it. I hold everyone to it."                                                                                                                                                                                                                   |
| `dlg_priya_you_lost`       | talk after a loss, `enc = open`                               | "Break room. Hydrate. Come back angrier." → `dlg_priya_spar` on next talk                                                                                                                                                                                                   |
| `dlg_priya_beaten`         | immediately after win (after the receipt)                     | "Good. Now I'll be calm in the 10:30 and nobody will know why." → `enc_meeting_prepper = won` → continues into `dlg_priya_offer` if `key_offer_letter` held and a slot is free                                                                                              |
| `dlg_priya_offer`          | `enc = won`, not in party, `key_offer_letter` held, slot free | "An offer letter. Pre-signed. You're just handing these out?" · "Yes. Obviously yes. I've been trying to get off this floor since the 10:30 existed." → **recruit card**: `[Extend the offer]` → `dlg_priya_joined` · `[Not yet]` ⎋ → `dlg_priya_offer_declined`            |
| `dlg_priya_offer_declined` | chose Not yet                                                 | "Sure. Come back. I'm easy to find. I'm always outside this door."                                                                                                                                                                                                          |
| `dlg_priya_offer_full`     | `enc = won`, not in party, letter held, party full            | "You've got a full team. Send someone home first. Not me — I mean, hypothetically." _(unreachable on Floor 1 — kept so the state is never silent)_                                                                                                                          |
| `dlg_priya_joined`         | offer extended                                                | "Great. I'll hold you to the schedule. Switch me in early; I front-load." → `party += cw_meeting_prepper`, `key_offer_letter` −1                                                                                                                                            |
| `dlg_priya_party`          | in party                                                      | "Team member. Also still running the 10:30. It's called range."                                                                                                                                                                                                             |
| `dlg_priya_after`          | `enc = won`, not in party, no `key_offer_letter`              | "The 10:30 went fine. Nobody read the handout. It was still the right handout."                                                                                                                                                                                             |

### 2.4 `npc_supervisor` — Holloway, Team Lead (Interim)

Role: mandatory boss, designed to be fought as a team. Dry, tired, quietly fair. Encounter
`enc_supervisor_1on1` (rank 2, boss). Not declinable once inside the lobby; no flee. Not
recruitable. Prerequisites: `asg_printer = complete` and `enc_desk_challenger = won`. Party size is
**not** a prerequisite (a solo win is allowed; the fight is tuned so it hurts).

| Node                         | Condition                                                                 | Lines / choices                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dlg_holloway_early`         | sightline or talk, `asg_printer ≠ complete`                               | "You're new. The printer's broken and you haven't met Gavin." · "Both of those are your problem now."                                                                                                                                                                                                                                                                                                   |
| `dlg_holloway_gavin_pending` | sightline or talk, `asg_printer = complete`, `enc_desk_challenger = open` | "Printer works. Noted." · "Gavin hasn't signed off on you. It isn't a real process. It's the one we have."                                                                                                                                                                                                                                                                                              |
| `dlg_holloway_1on1`          | sightline, prerequisites met, `enc = open` (fires on entering the lobby)  | "Sit. Actually — stand. This is the standing kind." · "Printer's fixed. Gavin's sulking. You've been here forty minutes and I already have to have an opinion about you." · _(party ≥ 2)_ "You brought people. Good. I talk for a living; take turns." · "This is your one-on-one. There's no leaving early. There's a badge on the other side of it." → **stakes card** (§5.2) with a single `[Begin]` |
| `dlg_holloway_you_lost`      | spoken over the defeat interstitial                                       | "Break room. Five minutes. All of you. I have a 10:30 anyway."                                                                                                                                                                                                                                                                                                                                          |
| `dlg_holloway_beaten`        | immediately after win (after the receipt)                                 | "…Well. That's a data point." · "Here. Badge. It opens the elevator." · "Don't lose it, don't lend it, don't laminate it. It's already laminated." → `key_access_badge`, `enc_supervisor_1on1 = won` → promotion (§8) → objective: **Take the elevator** · destination ELEVATOR LOBBY                                                                                                                   |
| `dlg_holloway_after`         | `enc = won`                                                               | "Elevator's behind me. Reader's on the right. It beeps. Everything here beeps." · _(if `key_offer_letter` held)_ "And no. I'm your manager. That's the opposite of joining."                                                                                                                                                                                                                            |

### 2.5 Point-of-interest copy (state-keyed)

| POI                   | Condition                                  | Text / effect                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `poi_printer`         | `asg_printer = not_started`                | "The printer shows an error in a font designed to calm you. It does not."                                                                                                                                                                                                                                                                                                                                 |
| `poi_printer`         | `accepted` (no toner)                      | "TONER LOW. It has been low since March."                                                                                                                                                                                                                                                                                                                                                                 |
| `poi_printer`         | `toner_collected` — prompt "Install toner" | "You install the toner. The printer thinks about it." · "It prints a test page. The test page says TEST PAGE. Triumph." · "Then two more pages. OFFER LETTER. Pre-signed by HR. Blank where the name goes." → consume `key_toner`, gain `key_offer_letter` ×2 (**receipt** `PRINTER — ONLINE`: Offer Letter ×2), `asg_printer = installed` → objective: **Report back to Renata** · destination RECEPTION |
| `poi_printer`         | `installed` or later                       | "The printer hums. Gavin has already printed forty pages. None of them are offer letters; it only does that for you, apparently."                                                                                                                                                                                                                                                                         |
| `poi_supply_cabinet`  | `asg_printer = not_started`                | "Grey cabinet. Unlabeled. Full of things nobody ordered."                                                                                                                                                                                                                                                                                                                                                 |
| `poi_supply_cabinet`  | `accepted`                                 | "Behind eleven boxes of the wrong toner: the right toner." → gain `key_toner` (toast "Got: Toner Cartridge"), `asg_printer = toner_collected` → objective: **Install the toner** · destination DESKS                                                                                                                                                                                                      |
| `poi_supply_cabinet`  | `toner_collected` or later                 | "Eleven boxes of the wrong toner. Someone's annual review."                                                                                                                                                                                                                                                                                                                                               |
| `poi_break_counter`   | always — prompt "Take five"                | confirm card `TAKE FIVE`: "Restores HP and PP for the whole team. Free. Always." `[Take five]` `[Not now]` ⎋ → "You take five. Everyone's restored. The couch has seen worse."                                                                                                                                                                                                                            |
| `poi_vending_machine` | always — prompt "Buy"                      | Opens `ovl_vending` (§10.9). Flavor line in the header: "Accepts Stock Options. Nobody asked how."                                                                                                                                                                                                                                                                                                        |
| `poi_break_table`     | always                                     | "Someone left a cake. The icing says SORRY FOR YOUR LOSS. It was forty percent off."                                                                                                                                                                                                                                                                                                                      |
| `poi_agenda`          | `asg_meeting_prep = not_started`           | "A meeting agenda. You have no meeting. You read it anyway." · `ovl_document` (agenda)                                                                                                                                                                                                                                                                                                                    |
| `poi_agenda`          | `accepted` or later                        | `ovl_document` (agenda) → if `accepted`: optional objective: **Pick the matching handout** · destination MEETING ROOM                                                                                                                                                                                                                                                                                     |
| `poi_handout_rack`    | `asg_meeting_prep = not_started`           | "Three stacks of paper. None of them are yours yet."                                                                                                                                                                                                                                                                                                                                                      |
| `poi_handout_rack`    | `accepted` or `handout_held`               | Choice card (§4.2). Picking swaps whatever handout is held. → optional objective: **Bring the handout to Priya** · destination HALL                                                                                                                                                                                                                                                                       |
| `poi_handout_rack`    | `complete`                                 | "Two stacks left. Both wrong. Both will be here forever."                                                                                                                                                                                                                                                                                                                                                 |
| `poi_elevator_door`   | no `key_access_badge`                      | "The reader blinks red. It's not personal. It's policy." → `flag_badge_reader_denied`                                                                                                                                                                                                                                                                                                                     |
| `poi_elevator_door`   | `key_access_badge` held                    | confirm card `FLOOR 2`: "The reader blinks green." `[Ride up]` `[Not yet]` ⎋ → celebration (§8)                                                                                                                                                                                                                                                                                                           |
| `poi_exit_door`       | always                                     | "You just got here. Leaving now would be a statement."                                                                                                                                                                                                                                                                                                                                                    |
| `poi_water_cooler`    | always                                     | "No gossip today. The VPs are upstairs, being VPs."                                                                                                                                                                                                                                                                                                                                                       |
| `poi_directory_sign`  | always                                     | `ovl_document` (directory): "FLOOR 1 — Desks: left. Break room: up the hall, right. Meeting room: top right. Elevator: top left. Badge required."                                                                                                                                                                                                                                                         |
| `poi_reception_desk`  | always                                     | Proxies `npc_receptionist` (same node table as §2.1)                                                                                                                                                                                                                                                                                                                                                      |

Agenda document (`ovl_document`, §10.5):

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
  strip is three 54-px chips on a 472-px frame. Raising the cap on Floor 2+ is a constant
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
  floor. Renata explains the rule when closing the ticket; the receipt shows them as a line item.
- Immediately after a recruitable coworker's `dlg_*_beaten`, if the player holds a letter and the
  party has a free slot, the NPC's `dlg_*_offer` node runs and ends in the **recruit card**
  (`ovl_recruit_card`, §10.7).
- `[Extend the offer]`: `key_offer_letter` −1, member appended to the party at **full HP / full
  PP**, recruit feedback (§12 row "Recruit joined"), `dlg_*_joined` plays.
- `[Not yet]`: nothing is consumed; card closes with `menuBack`; the letter count on the HUD is
  unchanged and visibly so (the count chip doesn't move). Talking to the NPC again while holding a
  letter re-offers (`dlg_*_offer`). Declining is never final.
- Recruitment costs **no** Options and grants **no** XP or Options. The encounter reward was paid
  once on the win; recruiting is a use of that win, not a second one. The receipt for the win shows
  "Offer eligible ✓" as a line item so the player knows the offer is coming before the card appears.
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
track); `spd` is 10 for both (only `caffeinated` reads it). Move descriptions (shown on the move
buttons like the class kits): Well, Actually — "Corrects you. Loudly."; Passive-Aggressive Sticky
Note — "Left on the monitor. Signed 'thx'."; Calendar Hold — "Blocks their afternoon."; Agenda
Item — "Item 4 is you."; Circle Back — "Reschedules the damage."

Intended loop against Holloway: Gavin lands Sticky Note (Holloway −DEF) → switch to the lead →
lead's big move hits harder; when the lead is low, switch to Gavin to eat a turn. Priya's
Micromanaged blunts Holloway's `Stretch Goal`.

### 3.4 Combat rules (what changes, what doesn't)

Nothing about damage, statuses, type effectiveness, items, or the enemy AI changes. The battle
screen still shows **one** fighter per side. The party is a projection: the active member's
`hp`/`pp`/kit are what `TurnContext` sees.

| Rule                  | Design                                                                                                                                                                                                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Who starts            | The lead, unless the lead is fainted (HP 0) entering the battle, then the first non-fainted member in slot order. If _every_ member is fainted the stakes card is replaced by a confirm card "Your team needs a minute. Break room first." with `[Back]`, and no battle starts.                              |
| Switch action         | A fifth player action, **SWITCH** (`act_switch`; key **5** or **Tab**; `ui_switch_button` beside ITEMS). Opens the bench picker (`ui_party_bench`, §10.8): cards for the other members with HP/PP; fainted cards greyed and unselectable; ⎋/back cancels.                                                    |
| Switch cost           | Switching **uses your action**. Events: `switch_out` (outgoing member steps back, its statuses are cleared), `switch_in` (incoming member steps up), then the enemy takes its normal turn against the incoming member. Pokémon rule; the free hit is the price. The bench card says so: "Costs your turn."   |
| Statuses on switch    | Cleared for the outgoing member (they "leave the room"). This gives switching a defensive use (drop Demoralized/Micromanaged/Burned Out) and costs buffs (Motivated/Focused) — a real trade. The bench card lists the active member's statuses with "cleared on switch".                                     |
| Faint → forced switch | When the active member's HP hits 0 and any bench member has HP > 0: `member_faint` event, then battle phase `switch_required` — the bench picker opens with **no cancel** and the header "Send in the next person." The enemy does **not** act after a forced switch (the KO already consumed the exchange). |
| Loss                  | Battle is lost only when every member has fainted (`party_wipe`). Loss flow is §6, and it restores the **whole party**.                                                                                                                                                                                      |
| Items                 | One shared bag (`RunState.inventory`, 4 slots), carried by the lead. Items used in battle apply to the **active** member (Espresso heals whoever is standing there; PIP Notice still targets the enemy). Using an item is still a full action.                                                               |
| Struggle              | Unchanged: a member with 0 PP on every move Struggles. Switching is always available as an alternative while a bench member stands.                                                                                                                                                                          |
| Boss phase 2          | Holloway has none. Rule for later floors: a phase-2 transition happens to the enemy regardless of who is active.                                                                                                                                                                                             |
| Keyboard              | Moves 1–4 unchanged; 5/Tab opens SWITCH; in the bench picker ←/→ or 1–2 select, Enter confirms, Esc cancels (disabled when forced).                                                                                                                                                                          |

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

| Thing                                  | Rule                                                                                                                                                              |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| XP                                     | Paid once per won encounter to the **team** (`RunState.xp`). One team level; every member's level bonus is the team level. No per-member XP, no grinding surface. |
| Level-up heal (+20)                    | Applies to **every** member with HP > 0 (the team gets promoted together). Fainted members stay fainted (a free revive would make the break room pointless).      |
| Post-battle heals (PM perk, Self Care) | Apply to the member **active at the end** of the battle.                                                                                                          |
| Stock Options                          | Team wallet on `RunState`. Once-only per encounter (`rwd_enc_*`). Recruiting pays nothing.                                                                        |
| Items                                  | Team bag (`RunState.inventory`). Key items (`keyItems`) are separate and uncapped.                                                                                |
| Perks (promotion)                      | Team-wide via `collectMods`; stat packages apply to whoever is active. "Cleared Probation" is one pick for the team.                                              |
| Break room / defeat restore            | Whole party, HP and PP, statuses cleared.                                                                                                                         |

### 3.6 Switch tutorial (`trg_switch_coach` → `coach_switch`)

The party must be real without being mandatory in a way that punishes solo players. The teaching
moment is placed where the switch is genuinely the right call:

- Fires **once per save** (`flag_switch_coached`), in any battle where (a) the party has ≥ 2
  standing members, (b) the active member is below 50% HP, and (c) it's the player's turn.
- `coach_switch` (§10.10) anchored on the SWITCH button: "**SWITCH** — send in Gavin. Holloway
  gets one free swing at whoever walks in." (name resolves to the first standing bench member;
  opponent name resolves to the current enemy). Dismisses on any action.
- Gavin's `dlg_gavin_joined` line seeds the idea in prose before the fight, so the coach mark is a
  reminder, not a lesson.

In practice this fires during the Holloway fight on the acceptance route. It never fires for a
player with no recruits, and it never blocks input.

### 3.7 Party surfaces

The party appears on five surfaces, each specified in §10: `hud_party_strip` (always visible),
`ovl_team_panel` (P / TEAM), `ui_party_bench` + `ui_switch_button` (battle), `ovl_recruit_card`
(recruitment), and the party rows on every stakes/door card. One rule ties them together: **a
member is always shown as the same headshot, the same name, and an HP number with a bar** — never
just a bar, never just a name.

---

## 4. Activities — stages and copy

### 4.1 Required: "Get the printer working" — `asg_printer`

| #   | Stage             | Where                 | Player does             | Copy / feedback                                                                                 | Objective banner after (destination)           |
| --- | ----------------- | --------------------- | ----------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 0   | `not_started`     | Reception             | Talk to Renata          | `dlg_renata_ticket`                                                                             | Get toner from the supply cabinet (BREAK ROOM) |
| 1   | `accepted`        | Break room `(15,8)` ↑ | Open the supply cabinet | toast "Got: Toner Cartridge"                                                                    | Install the toner (DESKS)                      |
| 2   | `toner_collected` | Desks `(9,8)` ↑       | Install toner           | printer state flips to working; receipt `PRINTER — ONLINE` with Offer Letter ×2                 | Report back to Renata (RECEPTION)              |
| 3   | `installed`       | Reception             | Talk to Renata          | receipt `TICKET #0001 CLOSED` **+10 📈** (once, `rwd_asg_printer`); Renata explains the letters | Talk to Gavin (DESKS)                          |
| 4   | `complete`        | —                     | —                       | Unlocks Gavin's challenge; counts toward the supervisor prerequisite                            | —                                              |

Reward is paid exactly once; re-talking never re-pays. The assignment can't be abandoned or
failed. The Offer Letters are the printer's second payload on purpose: the required activity hands
the player the recruitment tool before the first recruitable fight, so recruitment never needs a
detour.

### 4.2 Optional: "Prepare the meeting" — `asg_meeting_prep`

| #   | Stage          | Where                   | Player does               | Copy / feedback                                                                                                     | Objective banner after (optional style, destination) |
| --- | -------------- | ----------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 0   | `not_started`  | Hall `(13,2)`           | Talk to Priya, take it on | `dlg_priya_request`                                                                                                 | Read the agenda (MEETING ROOM)                       |
| 1   | `accepted`     | Meeting room `(16,2)` → | Read agenda               | `ovl_document`                                                                                                      | Pick the matching handout (MEETING ROOM)             |
| 2   | `accepted`     | Meeting room `(21,1)` → | Pick a handout            | choice card below → `handout_held`; toast "Got: <handout>"                                                          | Bring the handout to Priya (HALL)                    |
| 3   | `handout_held` | Hall                    | Deliver to Priya          | wrong → hint line + handout chip shake, stage stays `handout_held`; right → receipt `THE 10:30 — PREPPED` **+6 📈** | (cleared) → Priya offers the spar                    |
| 4   | `complete`     | —                       | —                         | Spar available via `dlg_priya_spar`; winning it opens the second recruit                                            | —                                                    |

Handout rack choice card (`ovl_confirm` variant with three options; order fixed; the correct answer
is deliberately in the middle):

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

Holloway is tuned for a bench (130/14/9): a real threat to a solo lead and a tense, winnable fight
for a team of two.

"Flee n/a": the existing battle screen has no flee action; declining happens on the stakes card
before combat. For Holloway the stakes card has one button, and the lobby door prompt (§8) is the
only exit — before you step in.

Encounter title cards (the battle intro beat, §13): Gavin `DESK-PIT ARGUMENT`, Priya `PRE-MEETING
SPAR`, Holloway `ONE-ON-ONE` with the eyebrow `NO LEAVING EARLY`.

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

### 5.2 Stakes card (`ovl_stakes_card`) — exact copy

Layout is §10.6. Live party row (every member's headshot + HP number) and the active member's PP
summary are displayed so the player can judge. Buttons use the existing `Button` primary/secondary
styles; the ⎋ option is always the secondary button on the right.

```
CHALLENGE · RANK 0
Gavin — Senior Associate
WIN    +15 XP · +8 📈 · Offer eligible
LOSE   Break room, walk back. Nothing lost.
TEAM   [●YOU 100/100]  [ + ]  [ — ]
[ Bring it ]                    [ Not now ]
```

```
SPAR · RANK 1
Priya — Ops
WIN    +22 XP · +11 📈 · Offer eligible
LOSE   Break room, walk back. Nothing lost.
TEAM   [●YOU 100/100]  [●GAVIN 70/70]  [ — ]
[ Spar ]                        [ Rain check ]
```

```
ONE-ON-ONE · RANK 2 · BOSS
Holloway — Team Lead (Interim)
WIN    +30 XP · +20 📈 · Access Badge · Promotion
LOSE   Break room, walk back, try again.
       No leaving early.
TEAM   [●YOU 74/100]  [●GAVIN 70/70]  [ — ]
[ Begin ]
```

Won encounters pay once (`rwd_enc_*`). A won encounter cannot be re-fought in the MVP. "Offer
eligible" appears only on recruitable opponents while the player holds an Offer Letter; without a
letter the line reads "Offer letters: 0" in `--cc-text-dim` so the absence is explained, not blank.

---

## 6. Loss and recovery flow

1. Battle reaches `phase: 'lost'` — which, with a party, means every member has fainted
   (`party_wipe`). A single member fainting is a forced switch (§3.4), not a loss. The tower's
   `GameOverScreen` must **not** appear; the campaign is not over.
2. `ovl_interstitial_minute` (§10.11): "Your team needs a minute." with the opponent's loss line
   (`dlg_*_you_lost`) beneath it. 1.2 s, tap/Enter to skip, static under reduced motion.
3. Fade to the break room. Player placed at `(19,8)` facing the coffee counter. On arrival: **every
   party member** restored to full HP and PP, all statuses cleared; the recover feedback plays (§12
   row "Recover (break room)"); toast "You take five. Everyone's back." (auto — no press required;
   the counter stays available for free at any later time).
4. State: the encounter stays `open`; the opponent is at their tile and offers the same stakes
   card again; no XP, no Options, no items, no recruits are awarded or removed by the loss. The
   objective banner is unchanged and its destination pin still points at the opponent, so the walk
   back is never a guess.
5. The cost is the walk back (break room → Gavin: 16 tiles; → Priya: 13; → Holloway's door: 16;
   about 4 s each at 4 tiles/s) plus the re-commit prompt. Consumables used during the lost battle
   are gone — the same rule as the tower, kept deliberately so Espresso purchases mean something.

Fainted members outside a loss: a member KO'd in a battle you _won_ stays at 0 HP until the break
room. The party strip chip shows the headshot desaturated with an `OUT` tag; the stakes card shows
them greyed with "OUT — break room"; the team panel row says "Out. Take five in the break room."
Walking into Holloway with a fainted bench is allowed and is a choice the card makes visible.

---

## 7. Economy touchpoints (feel, not gating)

| Touchpoint             | Amount | When                      | Ledger id                 | Receipt title                                                         |
| ---------------------- | ------ | ------------------------- | ------------------------- | --------------------------------------------------------------------- |
| Signing float          | +10    | New campaign save created | `rwd_start_options`       | `SIGNING BONUS` (shown once, on first spawn, before Renata's callout) |
| Printer ticket closed  | +10    | `dlg_renata_close_ticket` | `rwd_asg_printer`         | `TICKET #0001 CLOSED`                                                 |
| Gavin beaten           | +8     | after battle              | `rwd_enc_desk_challenger` | `DESK-PIT ARGUMENT — WON`                                             |
| Handout delivered      | +6     | `dlg_priya_delivered`     | `rwd_asg_meeting_prep`    | `THE 10:30 — PREPPED`                                                 |
| Priya beaten           | +11    | after battle              | `rwd_enc_meeting_prepper` | `PRE-MEETING SPAR — WON`                                              |
| Holloway beaten        | +20    | after battle              | `rwd_enc_supervisor_1on1` | `ONE-ON-ONE — SURVIVED`                                               |
| Recruiting (either)    | **0**  | `dlg_*_joined`            | — (no ledger entry)       | none (party strip is the feedback)                                    |
| **Maximum on Floor 1** | **65** |                           |                           |                                                                       |

Recruitment is free and pays nothing: the floor's wallet is fixed at 65, an Options price would
compete directly with the Espresso that makes the boss survivable, and an Options reward would be
a second payout for the same win. Beating the coworker is the cost; the Offer Letter is the token.

Every grant above is delivered through exactly one `ovl_reward_receipt` (§10.6). Nothing is ever
granted silently, and nothing is ever shown as granted twice: a re-talk that pays nothing shows no
receipt and the NPC's line says so in character ("Ticket's closed. I don't reopen tickets.").

Vending machine (`poi_vending_machine`, `ovl_vending` §10.9) — the only spend on the floor.
Prices are the existing base prices at act-1 inflation (×1), unaffected by perks until a perk is
owned (after Holloway, `employee_discount` would apply via `shopPrice` — fine, it's post-boss).

| Item (existing id) | Price | Stock | Why it's here                                                                                  |
| ------------------ | ----- | ----- | ---------------------------------------------------------------------------------------------- |
| `espresso`         | 14 📈 | 2     | Affordable right after the printer (20 OPT). The boss safety valve; heals whoever is active.   |
| `side_hustle`      | 28 📈 | 1     | Exactly affordable after Gavin if nothing was spent (28 OPT). PP refill for the active member. |

Rules: purchases never gate progress (every fight is winnable from a fresh full-HP state without
items); `MAX_INVENTORY = 4` applies to the team bag; Wellness Day is not sold (the counter is
free); stock does not restock in the preview. Reject states are specified in §10.9 and §12.

---

## 8. Progression and gates

```
spawn ──► Renata ticket ──► toner ──► install (prints 2 Offer Letters) ──► Renata closes (+10)
                                                                                 │
                                                                                 ▼
               Gavin sightline/talk ──► stakes ──► WIN ──► receipt ──► OFFER? ──► Gavin joins
                                           │  LOSE ──► break room ──► walk back ──┘   (Not yet: re-offer on talk)
                                           ▼
    door (10,3): prerequisites met? ──no──► door just opens; Holloway explains what's missing
              │ yes
              ▼
"Step in?" [Step in] [Not yet] ──► lobby sightline ──► Holloway stakes [Begin] ──► fight (coach_switch fires) ──► WIN
                                                        │ LOSE (party wipe) ──► break room ──► door again
                                                        ▼
        receipt ──► badge ──► promotion (pick 1 of 3, offer persisted first) ──► elevator green
                                                                                 │
                                                                                 ▼
                                                   "Ride up?" ──► FLOOR 1 CLEARED ──► back to (3,2)
```

- **Supervisor gate**: `asg_printer = complete` AND `enc_desk_challenger = won`. Party size is not
  a gate. Until then the door at `(10,3)` is a normal door and Holloway just talks
  (`dlg_holloway_early` / `dlg_holloway_gavin_pending`).
- **Door commit prompt** (`ovl_door_prompt`, only when the gate is open and the boss is unbeaten).
  Stepping onto `(10,3)`:

  ```
  ELEVATOR LOBBY
  Holloway's one-on-one starts when you step in. It doesn't stop.
  TEAM   [●YOU 74/100]  [●GAVIN 70/70]  [ — ]      📈 28
  [ Step in ]                              [ Not yet ]
  ```

  "Not yet" ⎋ steps the player back to `(11,3)` with `menuBack`. "Step in" places the player at
  `(9,3)` — inside Holloway's sightline — and `dlg_holloway_1on1` fires immediately. If every member
  is fainted the card reads "Your team needs a minute. Break room first." with only `[Back]`, and
  the destination pin jumps to the coffee counter until someone is standing.

- **Promotion**: on `dlg_holloway_beaten`, the engine rolls `rollPerkOffer(run.perks, rng,
BASE_PERK_POOL)` and writes it to `pendingPerkOffer`, **saves**, then shows `screen_promotion`
  (the existing `PromotionScreen`) with headline `CLEARED PROBATION`, sub-line "Pick one. HR calls
  it a development plan. It applies to the whole team." A reload mid-pick resumes the same offer
  (same rule as the tower). No title change in the MVP. Ledger `rwd_promotion_f1`. The pick is
  confirmed with `menuConfirm` + `Haptics.success` and the perk appears as a chip in the team
  panel footer.
- **Badge → elevator**: `key_access_badge` flips `poi_elevator_door` to the green state (reader
  LED `--cc-heal`, steady). Objective: **Take the elevator** · destination ELEVATOR LOBBY, pin on
  the doors.
- **End-of-preview celebration** (`screen_preview_complete`, §10.12).

---

## 9. Pacing, copy and tutorial weave

### 9.1 Targets and estimates

Assumptions: 4 tiles/s, ~2.5 s per dialogue line at normal text speed (read time included),
receipts ~2 s each, first battle ~45–60 s with the current sequencer timings, boss ~2–3 min with
switches.

| Target                       | Brief   | Estimate (attentive first-time player)                                                                    |
| ---------------------------- | ------- | --------------------------------------------------------------------------------------------------------- |
| Visible objective            | ≤ 30 s  | ~3 s (`trg_first_step` banner + pin) · ticket objective at ~20 s (5 tiles + 4 lines)                      |
| First battle begins          | ≤ 3 min | ~2:10 — 52 tiles of printer loop (~13 s) + 7 interactions and 2 receipts (~50 s) + Gavin's 3 lines + card |
| Recruit Gavin                | —       | +10 s (2 lines + card) — happens where you already stand                                                  |
| Full required department     | 10–15   | ~10–13 min with one loss, a vending stop, and a two-switch boss; ~8 min for a fast reader who never loses |
| Optional meeting prep + spar | —       | +3–4 min; +10 s to recruit Priya                                                                          |

Recruitment adds no tiles to any route: both offers happen at the tile where you just won, using a
tool the required path already put in your hand. The switch tutorial is a coach mark, not a
screen. The boss fight is longer than a solo draft would be (130 HP, switches cost turns) — that is
where the extra minutes live, and it's the part that should feel long.

Risk: the required path can still land under 10 minutes for fast players. Do not pad it with
walking or extra lines; the fix, if wanted, is content on Floor 2, not friction on Floor 1.

### 9.2 Copy rules

- A dialogue line is ≤ 90 characters and never wraps past two rows of `ovl_dialogue` at
  `--body-lg`. A node is ≤ 3 lines before a choice or an effect.
- Every line does one of three jobs: names the next place or person, states a stake, or lands a
  joke. Lines that only explain a control are forbidden; controls are taught by prompts and coach
  marks (§9.3).
- Card titles are display-face uppercase eyebrows ≤ 24 characters. Button labels are ≤ 14
  characters, verb-first, and the safe option always reads as a real choice ("Not now", "Rain
  check", "Not yet"), never "Cancel".
- Receipt titles are corporate artefacts (`TICKET #0001 CLOSED`, `ONE-ON-ONE — SURVIVED`), never
  "You won!". Toasts are ≤ 40 characters and start with "Got:", "Swapped:", or "Saved".
- Numbers are always shown with their unit: `+8 📈`, `+15 XP`, `74/100`. Never a bare number.
- Satire target is the institution, not the player. Nobody on this floor calls the player stupid.

### 9.3 Tutorial weave (no tutorial screens)

Exactly three coach marks exist on Floor 1, each attached to the first moment its input matters;
none pauses the game; each dismisses on the action it teaches and never returns on that save.

| Coach mark       | When                                                   | Copy (desktop / touch)                                                      | Dismissed by         |
| ---------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- | -------------------- |
| `coach_move`     | on spawn, before any input                             | "Arrows or WASD to move" / "D-pad to move"                                  | first completed step |
| `coach_interact` | the first time a Nearby prompt appears (Renata's desk) | the prompt chip itself pulses twice and appends " — press E" / " — tap ACT" | first interaction    |
| `coach_switch`   | §3.6                                                   | "SWITCH — send in Gavin. Holloway gets one free swing at whoever walks in." | any battle action    |

Everything else is taught by the world: Renata's callout makes you walk; the receipt teaches what
Options and letters are; Gavin's offer teaches recruiting by doing it; the stakes card teaches what
losing costs before the first fight; the door prompt teaches "no flee" with your HP in front of you.

---

## 10. Presentation spec — every screen and overlay, named

Design space is the existing `Stage` frame, **472 × 884** design-px, scaled to fit. Typography and
color come only from `tokens.css`: display face `--cc-font-display` (Anton) for eyebrows and
titles, `--cc-font-body` (Space Grotesk) for everything else; body text is never below
`--body-sm` (13 px) and interactive text never below `--body-md` (14 px). Surfaces are
`--cc-surface-1/2/3` with `--cc-line` hairlines and `--radius-md`; the one accent is `--cc-gold`.
Every overlay below is a `Panel`; every button is the existing `Button`. New CSS lives in CSS
modules on tokens; no inline style objects.

### 10.1 Screen map

| Id                        | Type    | Purpose                                                        | Entered from → returns to                             |
| ------------------------- | ------- | -------------------------------------------------------------- | ----------------------------------------------------- |
| `screen_title`            | screen  | existing title; gains THE OFFICE button                        | app start → `screen_office_start`                     |
| `screen_office_start`     | screen  | Continue / New campaign for the office slot                    | title → overworld or `ClassSelect`                    |
| `screen_class_select`     | screen  | existing `ClassSelect`, eyebrow "YOUR ROLE · FLOOR 1"          | office start → `screen_overworld` (first spawn)       |
| `screen_overworld`        | screen  | the floor: HUD + map + controls                                | everywhere returns here at a stated tile/facing (§13) |
| `screen_battle`           | screen  | existing battle screen + `ui_switch_button` + `ui_party_bench` | stakes card → receipt (win) / interstitial (loss)     |
| `screen_promotion`        | screen  | existing `PromotionScreen`, office copy                        | Holloway receipt → overworld `(9,3)` facing west      |
| `screen_preview_complete` | screen  | Floor 1 Cleared celebration                                    | elevator confirm → overworld `(3,2)` facing south     |
| `ovl_dialogue`            | overlay | speech + choices                                               | over the map                                          |
| `ovl_document`            | overlay | agenda / directory cards                                       | over the map                                          |
| `ovl_reward_receipt`      | overlay | every XP / Options / item / badge grant                        | over the map (after battles, over the returned map)   |
| `ovl_stakes_card`         | overlay | pre-battle commit                                              | over the map                                          |
| `ovl_door_prompt`         | overlay | lobby commit                                                   | over the map                                          |
| `ovl_recruit_card`        | overlay | extend an offer                                                | over the map                                          |
| `ovl_confirm`             | overlay | Take five / Ride up / handout pick / New campaign erase        | over the map                                          |
| `ovl_team_panel`          | overlay | roster                                                         | over the map (P / TEAM)                               |
| `ovl_vending`             | overlay | `ShopScreen` in vending mode                                   | over the map                                          |
| `ovl_coach_mark`          | overlay | the three coach marks                                          | over map or battle deck                               |
| `ovl_interstitial_minute` | overlay | "Your team needs a minute."                                    | over the battle → fades to overworld                  |
| `ovl_toast`               | overlay | minor pickups and "Saved"                                      | over the map, bottom of the map region                |
| `ovl_settings`            | overlay | existing `SettingsPanel`                                       | gear button                                           |

### 10.2 `screen_title` and `screen_office_start`

- Title: a third primary button **THE OFFICE** under the existing ones, eyebrow `PREVIEW · FLOOR 1`
  in `--cc-text-dim`. If an office save exists, a one-line status under the label in `--body-sm`:
  "Floor 1 · Team of 2 · 📈 28 · 11:42 in". Never shows a bare "Continue".
- `screen_office_start`: a `Panel` with the campaign summary card (headshot row of the party, class
  name, wallet, time on floor) and two buttons: **Continue** (primary) and **New campaign**
  (secondary). New campaign with a save present opens `ovl_confirm`: "Erase this campaign? The team
  goes back to being coworkers." `[Erase]` (danger style: `--cc-danger` text on secondary)
  `[Keep it]` ⎋. No save → straight to `screen_class_select`. Back arrow top-left returns to the
  title with `menuBack`.

### 10.3 `screen_overworld` layout

```
┌──────────────────────────────── 472 ────────────────────────────────┐
│ hud_top (60)   [OBJECTIVE ▸ text ....... → DESKS] [●][●][ ] [📈 28] │
├─────────────────────────────────────────────────────────────────────┤
│ hud_map (576)  zone chip top-left · tiles · pins · nearby prompt     │
│                ovl_dialogue docks over the bottom 3 tile rows        │
├─────────────────────────────────────────────────────────────────────┤
│ ctl_band (248) [ D-PAD 192×192 ]        [ TEAM 54 ] [ ACT 84 ] [⚙]  │
└─────────────────────────────────────────────────────────────────────┘
```

| Element            | Spec                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hud_objective`    | Left 60% of `hud_top`. Row 1 eyebrow `OBJECTIVE` (`--display-2xs`, `--cc-track-label`, gold) or `OPTIONAL` (`--cc-text-dim`). Row 2 objective text `--body-md`, ≤ 42 chars, one line, ellipsis never allowed (copy is written to fit). Right-aligned within the banner: a destination chip `→ DESKS` in the destination zone's accent. When the optional objective is also active it shows as a second, dimmer row; the banner grows to 72 px. Never empty: after the preview it reads `FLOOR 1 CLEARED · Floor 2 under construction`. |
| `hud_party_strip`  | Right of the objective: up to three 54×54 chips. Each chip: headshot (40 px circle, type ring 2 px), HP number `74` bottom-right in `--display-2xs`, 3-px HP bar under the headshot colored by `--cc-hp-high/mid/low` thresholds (>50 / 25–50 / <25 %). Lead chip has a 1-px gold ring instead of type ring. Fainted: headshot desaturated, `OUT` tag replaces the number. Empty slot: dotted `--cc-line` circle with `+` in `--cc-text-faint`. Active member (in battle only) gets a gold underline.                                  |
| `hud_wallet`       | Far right chip `📈 28` in `--display-sm`; pulses gold once on change (§12).                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `hud_letters`      | Appears under the wallet chip only while `key_offer_letter > 0`: `📄 ×2` in `--body-sm`. Disappears at 0 — the team panel keeps the explanation (§10.8).                                                                                                                                                                                                                                                                                                                                                                               |
| `hud_zone_chip`    | Top-left over the map, 8 px inset: uppercase zone name eyebrow on a `--cc-glass` plate with a 4-px left bar in the zone accent (`--cc-accent-bar`). Shows for 1.6 s on zone change, then fades to 60% and stays (the player always knows the room they're in).                                                                                                                                                                                                                                                                         |
| `hud_pin`          | Destination pin: a gold `?` glyph (display face, 14 px) bobbing 2 px above the objective's target tile (NPC or POI); static under reduced motion. Exactly one pin for the required objective; the optional objective uses a dim `?` at 60%.                                                                                                                                                                                                                                                                                            |
| `hud_edge_arrow`   | When the pinned target is off-screen horizontally, a gold chevron `›`/`‹` sits at the map's edge on the target's row, 24 px, with the destination zone name beneath it in `--display-2xs`. Disappears when the target is on screen.                                                                                                                                                                                                                                                                                                    |
| `hud_nearby`       | Interaction prompt chip (§10.4) floating 6 px above the faced interactable; also mirrored as plain text centered in `ctl_band` on desktop ("E · Talk · Renata"). Only one prompt at a time; absent when nothing is faced.                                                                                                                                                                                                                                                                                                              |
| `ctl_dpad`         | Touch only. 192×192 cross, four 64×64 pads with 54-px minimum hit targets that extend into the gaps; pressed pad fills `--cc-fill-soft` → `--cc-gold` at 30%. Hold repeats at tile cadence.                                                                                                                                                                                                                                                                                                                                            |
| `ctl_act`          | Touch only. 84-px gold circle, label `ACT` in display face; when a prompt is available the label becomes the verb (`TALK`, `BUY`, `TAKE FIVE`) so the thumb knows before it moves. Disabled look (40% alpha) when nothing is faced.                                                                                                                                                                                                                                                                                                    |
| `ctl_team`         | Touch only. 54-px secondary square left of ACT, headshot stack icon + `TEAM`; badge with member count. Desktop: key `P`.                                                                                                                                                                                                                                                                                                                                                                                                               |
| `ctl_settings`     | Existing gear, top-right of `ctl_band`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Desktop `ctl_band` | D-pad/ACT/TEAM hidden; the band shows the mirrored Nearby text (center) and a one-line key legend in `--cc-text-faint`: `Move ↑↓←→ · Interact E · Team P · Menu Esc`.                                                                                                                                                                                                                                                                                                                                                                  |

### 10.4 Interaction prompts and dialogue chrome

**Prompt chip** (`hud_nearby`): `IconChip` on `--cc-glass`, 28 px tall, hairline border; content
`[E] Talk · Renata` on desktop, `Talk · Renata` on touch (the ACT button carries the key). Verb
table:

| Target state                     | Verb          | Object                            |
| -------------------------------- | ------------- | --------------------------------- |
| Any NPC                          | Talk          | first name                        |
| Reception desk tiles             | Talk          | Renata                            |
| Printer, not installable         | Inspect       | Printer                           |
| Printer, toner held              | Install toner | Printer                           |
| Supply cabinet                   | Open          | Supply cabinet                    |
| Coffee counter                   | Take five     | Coffee counter                    |
| Vending machine                  | Buy           | Vending                           |
| Agenda                           | Read          | Agenda                            |
| Handout rack (assignment active) | Pick          | Handout                           |
| Handout rack (otherwise)         | Inspect       | Handout rack                      |
| Elevator, no badge               | Badge in      | Elevator (chip shows a red dot)   |
| Elevator, badge                  | Ride          | Elevator (chip shows a green dot) |
| Break table, water cooler, exit  | Inspect       | object name                       |
| Directory sign                   | Read          | Directory                         |

**`ovl_dialogue`**: docks over the bottom three tile rows of `hud_map` with 12-px side margins;
`--cc-glass` plate, `--radius-md`, `--cc-line-strong` border, `--cc-shadow-plate`. Left: 48-px
speaker headshot with type ring (absent for "spoken across the room" lines, which render in italic
with the speaker name still in the eyebrow). Eyebrow: `RENATA · FRONT DESK` (display face,
`--display-xs`, `--cc-track-label`, gold). Body: `--body-lg` (16 px), `--cc-text`, two rows max,
typewriter via `TextBox` with `SFX.textTick`. Advance caret `▾` bottom-right, blinking 0.9 s
(static under reduced motion). Tap anywhere on the box / Enter / E advances; a tap during
typewriting completes the line first (existing behaviour). Choices render below the body as
stacked full-width buttons, ≥ 54 px tall, primary gold for the forward option, secondary for the
⎋ option; ↑/↓ moves focus, Enter confirms, Esc picks ⎋. While open, movement input is ignored
and the D-pad dims to 40%.

### 10.5 `ovl_document`

Agenda and directory. A "paper" card centered over the map: `--cc-surface-1` plate with a 4-px gold
top bar and a paperclip glyph top-left; title in display face `--display-md`; body `--body-md` with
bold via `--cc-text` vs `--cc-text-2`. One button **Close** (Enter/E/Esc/tap outside). The agenda's
key phrase (`Q3 summary`) is bold so the answer is findable in two seconds.

### 10.6 `ovl_reward_receipt` and `ovl_stakes_card`

**Receipt** — the single grant surface. Styled as an expense report:

```
┌ APPROVED ───────────────────────────────┐   eyebrow in --cc-heal, display-2xs
│ TICKET #0001 CLOSED                     │   title, display-md
│                                         │
│ Stock Options                  +10 📈   │   rows: label --body-md left, value display-sm right
│ Offer Letter                    ×2 📄   │   values count up over 400 ms (instant under RM)
│                                         │
│ "Filed under: things that beep."        │   one satire footer line, --body-sm, --cc-text-dim
│                       [ File it ]       │   single primary button; Enter / E / tap
└─────────────────────────────────────────┘
```

Row vocabulary (only these, in this order when present): `Stock Options +N 📈` · `XP +N (cur/next)`
· `TEAM LEVEL N · +20 HP all` (gold row, plays `levelUp`) · `Offer Letter ×N 📄` ·
`Access Badge 🪪` · `Offer eligible ✓` · `Promotion → next`. Footer lines per receipt: SIGNING
BONUS "Vests immediately. Suspicious."; TICKET #0001 CLOSED "Filed under: things that beep.";
PRINTER — ONLINE "Two letters. Zero names. Infinite potential."; DESK-PIT ARGUMENT — WON "Coffee
refill: his problem now."; THE 10:30 — PREPPED "Nobody will read it. It's still right."; PRE-MEETING
SPAR — WON "She'll be calm. Nobody will know why."; ONE-ON-ONE — SURVIVED "Laminated. Finally."
The wallet chip and XP (team panel) update **when the receipt closes**, with the wallet pulse — so
the number on the HUD never changes while the player isn't looking at it. After a battle, the
receipt appears over the overworld once the player is back at their tile (§13), before the NPC's
post-battle line.

**Stakes card** — layout per §5.2: eyebrow (`CHALLENGE · RANK 0`), name row with headshot (name
display-md, role `--body-sm` dim), `WIN` / `LOSE` rows with labels in display-2xs and values in
`--body-md`, the `TEAM` row of member chips (same component as `hud_party_strip`, 44 px), and the
button row. Card width 440 px, centered over the map, with the map dimmed to 40% behind it.

### 10.7 `ovl_recruit_card`

```
┌ EXTEND AN OFFER ────────────────────────┐   eyebrow gold
│ [headshot 64]  Gavin                    │   display-md
│                Senior Associate         │   --body-sm dim
│ HP 70 · ATK 10 · DEF 8 · [NORMAL]       │   stat row + TypeBadge
│ Well, Actually · Passive-Aggressive     │   move names, --body-sm
│ Sticky Note                             │
│ Offer Letters left: 2 📄                │   --body-md
│ TEAM  [●YOU] [ + ] [ — ]                │   the + slot is outlined gold: "he goes here"
│ [ Extend the offer ]        [ Not yet ] │
└─────────────────────────────────────────┘
```

On confirm the `+` slot fills with his headshot in place (the card stays 400 ms so the player sees
it land), `fanfare` plays, then the card closes and the same fill repeats on `hud_party_strip`.

### 10.8 `ovl_team_panel`, `ui_party_bench`, `ui_switch_button`

**Team panel** — full map height, 440 px wide, `Panel`. Header eyebrow `TEAM · FLOOR 1`, close `✕`
(Esc / P / TEAM toggles). Three member rows, 96 px each:

- Filled row: 64-px headshot with type ring (gold for the lead) · name (display-sm) + `LEAD` chip or
  role (`--body-sm` dim) · HP bar with `74 / 100` · four PP mini-bars each labeled with the move
  name in `--body-sm` and `12/15` · type badges · status line when fainted: "Out. Take five in the
  break room."
- Empty row: dotted outline, headshot silhouette, text "Open seat" (display-sm dim) and one
  explanatory line that changes with state — letters > 0: "Beat a coworker, hand them an Offer
  Letter."; letters = 0 and recruitables remain: "Out of letters. HR prints two per quarter."; no
  recruitables remain: "Floor 1 is fully staffed." Never a blank row.
- Footer: `Team level 2 · XP 7/55` with the existing `XpBar`, then perk chips (`--cc-fill-soft`) or
  "No perks yet — Holloway decides that." Then `Offer Letters: 1 📄 · Bag 2/4`.

**Bench picker** (battle) — replaces the move grid in place (same height, so the deck never jumps):
header `SWITCH · costs your turn` (or `SEND IN THE NEXT PERSON` in forced mode, eyebrow in
`--cc-danger`), then one card per bench member, 200 px wide: `StagedSprite` at 64 px with type
ring, name, HP bar with number, PP summary `PP 20 · 10`, and a footnote of the active member's
statuses that will clear ("Clears: Demoralized"). Fainted card: greyed, `OUT`, unselectable.
Footer: `[ Back ]` (hidden when forced). Keys per §3.4.

**Switch button** — sits beside ITEMS in the deck's bottom row, same size, label `SWITCH` with a
count badge of standing bench members (`SWITCH · 1`); disabled look with tooltip text "No one on
the bench" when the party is solo. Key hint `5` in the corner like the move keys.

### 10.9 `ovl_vending`

`ShopScreen` in vending mode: header eyebrow `VENDING · BREAK ROOM`, sub-line "Accepts Stock
Options. Nobody asked how.", wallet chip top-right, `Bag 2/4` chip beside it. Rows: item emoji
(the existing item icon language), name, one-line desc, price chip `14 📈`, stock `×2`. Row
states:

| State                | Look                                                         | On press                                                                      |
| -------------------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Affordable, bag room | normal, price chip gold                                      | buy: `coin`, price chip counts down, stock decrements, bag chip increments    |
| Insufficient funds   | price chip `--cc-danger`, row 80%; sub-label "Short by 6 📈" | row shakes 4 px (static under RM), `eventBad`, `Haptics.warning`, no purchase |
| Bag full             | row 80%; sub-label "Bag full (4/4) — use something first"    | same reject feedback                                                          |
| Sold out             | row 50%, price replaced by `SOLD OUT` in `--cc-text-faint`   | inert, no sound                                                               |

No Wellness row. **Leave** button bottom (Esc). The vending machine tile shows a lit face while the
overlay is open.

### 10.10 `ovl_coach_mark`

Gold-bordered callout (`--cc-gold` 1 px on `--cc-glass`), `--body-md` text with the key word in
display face, a 8-px pointer toward its anchor. Anchors: `coach_move` above the D-pad (touch) or
centered in `ctl_band` (desktop); `coach_interact` is the prompt chip itself; `coach_switch` above
the SWITCH button. Appears with a 120-ms scale-in (instant under RM); never has a close button —
it dies on the action it teaches.

### 10.11 `ovl_interstitial_minute`

Full-frame `--cc-bg` at 92%, centered: eyebrow `TIME OUT` in `--cc-danger`, headline "Your team
needs a minute." (display-lg), the opponent's `dlg_*_you_lost` line in `--body-lg` italic, and a
dim "tap to continue". 1.2 s minimum, then the break-room fade.

### 10.12 `screen_preview_complete`

`RunCompleteScreen` layout language, full-bleed:

```
FLOOR 1 CLEARED                                   display-xl, gold
You fixed a printer, hired a critic, survived a    --body-lg
one-on-one, and got laminated. That's a career.

[●YOU] [●GAVIN] [ + ]                             party chips, 64 px, with names beneath
Assignments  2 / 2         Battles won  3
Losses  1                  Switches  2
Options earned  65 📈      Time on floor  11:42

Floor 2 is under construction.                    --body-md dim
The elevator goes back down.

[ Back to Floor 1 ]            [ Title ]
```

The second line adapts: "hired a critic" if Gavin was recruited, "hired nobody" if not, "hired two
people" with Priya. Stats count up over 600 ms (instant under RM). `fanfare` on mount. The empty
slot shows as the dotted `+` chip, never omitted — the screen tells the truth about the team.

### 10.13 Empty and edge states (none may be blank)

| State                                  | What the player sees                                                                                                          |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| No objective (never happens by design) | `hud_objective` always has text; after the preview: `FLOOR 1 CLEARED · Floor 2 under construction`                            |
| Party of one                           | Strip shows `[●YOU] [ + ] [ + ]`; team panel rows explain how to fill them (§10.8)                                            |
| Zero Offer Letters                     | `hud_letters` hidden; team panel footer `Offer Letters: 0 📄`; stakes card line "Offer letters: 0"; Priya/Gavin `dlg_*_after` |
| Empty bag                              | Team panel `Bag 0/4`; battle ITEMS button disabled look with "Bag's empty. Vending's in the break room."                      |
| Full bag at the cabinet / rack         | Key items don't use the bag — no conflict, by design                                                                          |
| Vending sold out                       | Rows read `SOLD OUT`; header sub-line changes to "Restocked never. Budget."                                                   |
| Fainted bench at the door              | §8: card explains, pin moves to the coffee counter                                                                            |
| Replay after the preview               | Elevator ride shows the same celebration; no receipt; Renata `dlg_renata_after`                                               |
| Save missing/corrupt on Continue       | `screen_office_start` shows "Couldn't read this campaign." and only **New campaign**; Classic save unaffected                 |

---

## 11. Controls, readability and accessibility

| Action              | Keyboard             | Touch                                              | Notes                                                                                          |
| ------------------- | -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Move                | Arrows / WASD        | D-pad (`ctl_dpad`), 64-px pads, 54-px minimum hits | 4-direction, tile-locked, hold to keep walking                                                 |
| Interact / advance  | Enter / E            | ACT (`ctl_act`, 84 px); tap dialogue to advance    | ACT's label becomes the verb when a prompt exists                                              |
| Close / safe choice | Esc                  | ✕ on the box / secondary button                    | Esc on a stakes card = the ⎋ option; disabled on Holloway's `[Begin]` card and forced switches |
| Team panel          | P                    | TEAM (`ctl_team`, 54 px)                           | Read-only roster (§10.8)                                                                       |
| Battle moves        | 1–4 (existing)       | existing MoveButtons                               | Unchanged                                                                                      |
| Battle switch       | 5 / Tab              | SWITCH button beside ITEMS                         | Bench picker: ←/→ or 1–2 select, Enter confirm, Esc cancel (not when forced)                   |
| Menu (settings)     | Existing gear button | Existing gear button                               | Reduced motion, text speed, haptics already exist in `settings.ts`                             |

**Readability guarantees**

- The objective is always visible (`hud_objective` never hides, never scrolls off, never empties)
  and always names its destination zone; the destination itself is pinned on the map and pointed
  to at the edge when off-screen (§10.3).
- Party HP is readable at a glance: number + bar + color threshold on every chip; fainted is a word
  (`OUT`), not a color.
- Text floors: body ≥ 13 px, interactive ≥ 14 px, in design px before Stage scaling (the Stage can
  shrink ~17% on small phones; `--text-floor` guards the result).
- Touch targets: every tappable thing ≥ `--tap-min` (54 px) including D-pad hit slop, choice
  buttons, chips that open panels, and bench cards. Thumb zones: D-pad bottom-left, ACT/TEAM
  bottom-right, nothing important in the top corners.
- One prompt at a time, one pin for the required objective, one receipt per grant, one toast at a
  time (later toasts queue).

**Reduced motion (OS preference or the in-app toggle)** — a complete path, not a degradation:
camera snaps per tile instead of easing; no idle bob on pins or markers (static glyphs); zone chip
swaps without fade; dialogue caret static; receipt values appear instantly; switch-in/out become
instant swaps; the party-strip fill is instant; shake rejects become a color flash; the encounter
title card holds instead of wiping. The typewriter is governed by its own text-speed setting.

**Screen readers / live region**: one `aria-live="polite"` region receives: objective changes
("Objective: Get toner from the supply cabinet. Break room."), Nearby prompts ("Nearby: Talk,
Renata. Press E."), receipts (title + rows), recruit events ("Gavin joined the team."), switch and
faint events ("Gavin steps in. 70 HP."), rejects ("Not enough Options. Short by 6."). Focus: the
dialogue box is a focus trap while open; choice buttons are real `<button>`s with the global
`:focus-visible` ring; the bench picker traps focus while open and, in forced mode, moves focus to
the first standing member; when a box closes, focus returns to the map canvas or the move grid.

**Haptics** (existing adapter, respects the setting): `selection` on interact and menu moves,
`impact('light')` on a blocked step (once per press, not per frame), `success` on recruit / badge /
level-up, `warning` on rejects, existing battle patterns in combat, nothing on movement.

---

## 12. Feedback matrix — every action answers

Cues are the existing `SFX` methods and `Haptics` calls; "RM" is the reduced-motion variant.
Nothing in this table is optional.

| Moment                           | Visual                                                                                                                                   | Audio                            | Haptic             | Live region                            |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------ | -------------------------------------- |
| Step                             | avatar slides one tile in 250 ms (RM: snaps); camera follows                                                                             | —                                | —                  | —                                      |
| Move blocked (wall/solid/NPC)    | avatar nudges 2 px into the tile and back in 120 ms (RM: none); facing updates                                                           | —                                | `impact('light')`  | —                                      |
| Move blocked by a door prompt    | `ovl_door_prompt` opens (§8)                                                                                                             | `glassDoor`                      | `selection`        | card text                              |
| Interact available               | `hud_nearby` chip appears; target tile gets a 1-px gold outline; ACT label becomes the verb                                              | —                                | —                  | "Nearby: …"                            |
| Interact (talk / inspect)        | chip collapses into the dialogue box                                                                                                     | `menuSelect`                     | `selection`        | speaker + line                         |
| Dialogue advance                 | caret blinks off, next line types                                                                                                        | `textTick`                       | —                  | line                                   |
| Choice focused / confirmed       | focus ring / button press state                                                                                                          | `menuSelect` / `menuConfirm`     | `selection`        | button label                           |
| Safe choice / close              | box slides down 8 px and fades (RM: instant)                                                                                             | `menuBack`                       | —                  | —                                      |
| Sightline callout                | gold `!` pops over the NPC 300 ms, NPC token faces the player, dialogue opens                                                            | `email`                          | `selection`        | speaker + line                         |
| Zone change                      | `hud_zone_chip` swaps with 1.6-s full opacity then 60%; carpet tint differs per zone                                                     | —                                | —                  | "Entering: Break room."                |
| Objective stage advance          | old text strikes through and slides up (300 ms), new text slides in; pin jumps to the new target; edge arrow updates (RM: swap)          | `menuConfirm`                    | `selection`        | "Objective: …"                         |
| Optional objective accepted      | dim second row appears in the banner; dim pin appears                                                                                    | `menuConfirm`                    | —                  | "Optional: …"                          |
| Key item pickup (toner, handout) | `ovl_toast` "Got: Toner Cartridge" 1.8 s; cabinet/rack tile plays its open frame                                                         | `coin`                           | `selection`        | toast text                             |
| Printer fixed                    | printer tile flips from red-screen to green-screen, three "pages" slide out; receipt `PRINTER — ONLINE`                                  | `printerJam` then `coin`         | `success`          | receipt                                |
| Options / XP grant               | `ovl_reward_receipt`; on close, `hud_wallet` pulses gold once and counts to the new value                                                | `coin`; `levelUp` on a level row | `success`          | receipt rows                           |
| Team level up                    | gold `TEAM LEVEL 2 · +20 HP all` row in the receipt; every standing chip's HP bar grows                                                  | `levelUp`                        | `success`          | "Team level 2."                        |
| Recruit joined                   | `+` slot on the card fills with the headshot (400 ms), then `hud_party_strip` fills the same way; letters chip decrements                | `fanfare`                        | `success`          | "Gavin joined the team."               |
| Recruit declined                 | card closes; letters chip does not move; NPC line                                                                                        | `menuBack`                       | —                  | line                                   |
| Offer unavailable (no letter)    | stakes card line "Offer letters: 0"; NPC `dlg_*_after`; no card                                                                          | —                                | —                  | line                                   |
| Battle start                     | encounter title card wipe (§13)                                                                                                          | `enemyAppear` / `bossIntro`      | `impact('medium')` | title                                  |
| Switch (voluntary)               | bench picker → outgoing sprite slides down/fades, incoming `StagedSprite` rises (RM: swap); log "Gavin steps in."; strip underline moves | `menuConfirm`                    | `selection`        | "Gavin steps in. 70 HP."               |
| Member faint                     | existing faint animation; strip chip desaturates with `OUT`; bench picker opens in forced mode                                           | `faint`                          | `impact('heavy')`  | "You're out. Send in the next person." |
| Party wipe                       | `ovl_interstitial_minute` (§10.11)                                                                                                       | `gameOver` (short)               | `warning`          | "Your team needs a minute."            |
| Recover (break room)             | counter tile steams; chips refill left-to-right 200 ms each (RM: instant); `OUT` tags drop; toast "You take five. Everyone's back."      | `coffee` then `heal`             | `success`          | toast                                  |
| Take five (manual)               | same as above after the confirm; if already full: toast "Everyone's fine. Take five anyway." and the same steam, no `heal`               | `coffee`                         | `selection`        | toast                                  |
| Shop buy                         | price chip counts down, stock `×1`, bag chip `3/4`, item row flashes gold                                                                | `coin`                           | `success`          | "Bought Espresso Shot. 14 Options."    |
| Shop reject — insufficient funds | row shake 4 px (RM: red flash), sub-label "Short by 6 📈"                                                                                | `eventBad`                       | `warning`          | "Not enough Options. Short by 6."      |
| Shop reject — bag full           | row shake (RM: flash), sub-label "Bag full (4/4) — use something first"                                                                  | `eventBad`                       | `warning`          | "Bag full."                            |
| Shop — sold out row pressed      | nothing (row is inert)                                                                                                                   | —                                | —                  | —                                      |
| Elevator, no badge               | reader LED blinks red twice; line                                                                                                        | `eventBad`                       | `warning`          | line                                   |
| Elevator, badge                  | reader LED steady green; confirm card                                                                                                    | `menuConfirm`                    | `selection`        | card                                   |
| Ride up                          | doors close (2 tiles slide), fade, celebration                                                                                           | `elevatorUp` then `fanfare`      | `success`          | "Floor 1 cleared."                     |
| Wrong handout delivered          | handout chip in the dialogue shakes (RM: flash); Priya's hint line                                                                       | `eventBad`                       | `warning`          | line                                   |
| Coach mark appears               | 120-ms scale-in (RM: instant)                                                                                                            | —                                | —                  | coach text                             |
| Save written                     | `ovl_toast` "Saved" 0.8 s at 60% — only on recruit, promotion pick, and celebration (not every step)                                     | —                                | —                  | —                                      |

---

## 13. Transitions — continuous, with return positions

Every transition names the out-beat, the in-beat, where the player lands, and the audio tone. Audio
tracks may be deferred (§14.4) but the cue points are fixed now so the sequencer has them.

| Transition                           | Out                                                                                                                                                                               | In                                                                                                                                                                                   | Return position / facing                                                                           | Tone                                                                                  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Title → office start → class → floor | existing screen fades                                                                                                                                                             | map fades in on `(12,15)`, `coach_move` appears, `SIGNING BONUS` receipt (first spawn only), then first step → Renata's callout                                                      | `(12,15)` north                                                                                    | overworld loop starts on the fade-in                                                  |
| Overworld → battle                   | stakes card `[Bring it]`: card collapses, map desaturates 200 ms, encounter title card wipes in (display-lg, opponent name, eyebrow) 700 ms; RM: title card holds 700 ms, no wipe | existing battle intro (enemy `StagedSprite` rises, taunt in the log)                                                                                                                 | —                                                                                                  | overworld loop ducks out over 300 ms; battle cue on the wipe; boss uses `bossIntro`   |
| Battle (win) → overworld             | existing victory beat (`victory`), 600 ms                                                                                                                                         | map fades in **at the exact tile and facing the player had when the stakes card opened**, NPC token facing the player; then `ovl_reward_receipt`; on close, `dlg_*_beaten` continues | same tile/facing as before the fight                                                               | battle cue resolves; overworld loop returns under the receipt                         |
| Battle (wipe) → break room           | `ovl_interstitial_minute` 1.2 s                                                                                                                                                   | map fades in on `(19,8)`, recover feedback plays immediately                                                                                                                         | `(19,8)` north                                                                                     | silence under the interstitial; overworld loop returns low-passed for 2 s then normal |
| Receipt → recruit card               | receipt `[File it]`                                                                                                                                                               | `dlg_*_offer` lines → card                                                                                                                                                           | unchanged                                                                                          | —                                                                                     |
| Holloway receipt → promotion         | receipt `[File it]`                                                                                                                                                               | `screen_promotion` slides up over the map (existing screen); `CLEARED PROBATION`                                                                                                     | on pick: map returns at `(9,3)` facing west, Holloway's `dlg_holloway_beaten` badge lines continue | `fanfare` on the promotion mount                                                      |
| Overworld → elevator celebration     | confirm `[Ride up]`: doors close over the avatar (400 ms), `elevatorUp`, fade to `--cc-bg`                                                                                        | `screen_preview_complete` counts up                                                                                                                                                  | `[Back to Floor 1]`: fade in at `(3,2)` facing south, doors open behind the avatar                 | celebration `fanfare`; overworld loop returns on the fade-in                          |
| Overlay open / close (any card)      | map dims to 40% behind the card, 120 ms                                                                                                                                           | card scales from 96% → 100%, 120 ms (RM: instant)                                                                                                                                    | unchanged                                                                                          | `menuSelect` / `menuBack`                                                             |
| Team panel                           | slides in from the right 160 ms (RM: instant)                                                                                                                                     | slides out                                                                                                                                                                           | unchanged; the game does not pause music                                                           | —                                                                                     |

Continuity rules: the player never appears at a tile they did not walk to except the three named
placements (spawn, break-room respawn, post-celebration). Facing is preserved across every battle.
The NPC you fought is always facing you when you return. Music never hard-cuts: every transition
is a duck or a fade with the durations above.

---

## 14. Asset bar — ship-quality vs stand-ins

Rule: **everything the player sees is ship-quality or the slice is not done.** Reuse of existing
high-quality assets is preferred over new art of any lower quality. Emoji are allowed only where
the shipped game already uses them as an icon language (items, currency, perk icons, status
badges) — never as furniture, characters, or map tiles.

### 14.1 Reused as-is (ship-quality today)

| Asset                                                                                                 | Use                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/assets/characters/*.webp` via `PixelSprite`/`StagedSprite`                                       | Battle portraits (player classes; Gavin `overachiever`, Priya `scrum`, Holloway `manager`) and, cropped, every headshot on the floor (§14.2) |
| `TextBox`, `Panel`, `Button`, `IconChip`, `HpBar`, `XpBar`, `TypeBadge`, `StatusBadges`, `MoveButton` | Dialogue, cards, chips, bars, badges, deck                                                                                                   |
| `PromotionScreen`, `ShopScreen`, `RunCompleteScreen` layout, `SettingsPanel`                          | Promotion, vending, celebration, settings                                                                                                    |
| `SFX` cues, `Haptics` adapter                                                                         | The entire §12 matrix                                                                                                                        |
| Emoji `📈 ☕ 💰 🪪 📄` and item emoji                                                                 | Wallet, item rows, badge/letter receipt rows (existing icon language)                                                                        |
| `tokens.css`                                                                                          | All color, type, spacing, motion                                                                                                             |

### 14.2 Required new assets — ship-quality, block "done"

**Characters: the badge-token system.** Everyone on the floor is drawn as their employee badge: a
28×28 rounded-rect lanyard token with the character's existing portrait cropped to a headshot
(top-of-frame focal crop, defined per sprite in `sprites.ts` metadata), a 2-px ring in the
character's primary type color (gold for the player), a 1-px ink outline matching `PixelSprite`'s
drop-shadow outline, and a soft 4-px shadow ellipse. Facing is a 6-px notch on the ring edge plus a
2° tilt toward the facing side; four facings per token. This is a deliberate art direction (the
office renders people as their badges), it reuses the best art the project has, and the same
headshot recurs on every party surface so faces are consistent everywhere. Required: 3 player
tokens (pm/eng/design) × 4 facings, 4 NPC tokens × 1 facing each, plus the same crops at 40/48/64
px for chips, dialogue and cards. Renata's headshot is the `recruiter` portrait.

**Tileset (32×32, one sheet), flat two-tone with hairline and 1-px ink outline, palette from
`--cc-surface-*` and zone accents.** Required tiles and states:

| Tile                                                  | States                                                  |
| ----------------------------------------------------- | ------------------------------------------------------- |
| Carpet × 6 zone tints (subtle pattern, not flat fill) | —                                                       |
| Wall, wall top edge, inner corner                     | —                                                       |
| Glass wall, glass door frame (open)                   | —                                                       |
| Street exit (double door, closed)                     | —                                                       |
| Elevator doors (2-wide) + badge reader                | closed / opening frames; reader red / green             |
| Reception desk (3-wide, with monitor and bell)        | —                                                       |
| Desk (with monitor), chair                            | —                                                       |
| Printer                                               | error (red screen) / working (green) / printing (pages) |
| Supply cabinet                                        | closed / open                                           |
| Coffee counter (3-wide: machine, cups, sink)          | idle / steaming                                         |
| Vending machine                                       | idle / lit                                              |
| Break table (2-wide) with the cake                    | —                                                       |
| Meeting table (4×2) with agenda sheet, handout rack   | —                                                       |
| Water cooler, plant, directory sign                   | —                                                       |

**UI vector (CSS/SVG, no raster):** D-pad, ACT, TEAM, SWITCH glyphs; pin `?` and callout `!` in
the display face; headshot-stack icon; paperclip glyph; reader LEDs.

### 14.3 Stand-ins that block "done"

Any of the following present in a build means the slice is not done, regardless of what else works:
emoji or colored rectangles standing in for any tile or character; a missing tile state (a printer
that never changes); an unstyled default button or panel; text overflow, ellipsis, or clipping in
any card at the smallest supported viewport; a blank empty state from §10.13; a placeholder string
(`TODO`, `Lorem`, `??`); a transition that hard-cuts where §13 specifies a fade.

### 14.4 Deferred with approval (audio)

Two music tracks are specified but may ship after the first playtest with Adrian's sign-off: an
overworld loop (calm, sparse, office-hum register) and a boss variant (same loop, added pulse). Until
they exist, the current title loop plays as the overworld loop and the battle cue is unchanged —
the §13 duck/fade points are implemented against whatever track is present. All SFX cue points in
§12 are **not** deferrable; every one is an existing method.

---

## 15. Frozen content IDs — **FROZEN**

Astra codes against these. Additions are fine; renames go through this doc.

| Kind           | Ids                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Floor          | `floor_01`                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Zones          | `zone_reception`, `zone_desks`, `zone_break`, `zone_meeting`, `zone_elevator`, `zone_hall`                                                                                                                                                                                                                                                                                                                                                                                  |
| NPCs           | `npc_receptionist`, `npc_desk_challenger`, `npc_meeting_prepper`, `npc_supervisor`                                                                                                                                                                                                                                                                                                                                                                                          |
| Encounters     | `enc_desk_challenger`, `enc_meeting_prepper`, `enc_supervisor_1on1` (enemy content entries use the same ids)                                                                                                                                                                                                                                                                                                                                                                |
| Party slots    | `party_slot_0` (lead, fixed), `party_slot_1`, `party_slot_2`; constant `PARTY_MAX = 3`                                                                                                                                                                                                                                                                                                                                                                                      |
| Recruit defs   | `cw_desk_challenger` (Gavin), `cw_meeting_prepper` (Priya) — `PlayerClass`-shaped kits (§3.3)                                                                                                                                                                                                                                                                                                                                                                               |
| Party actions  | `act_move` (existing move pick), `act_item` (existing item use), `act_switch` (new, key 5/Tab), `act_party_menu` (overworld, key P)                                                                                                                                                                                                                                                                                                                                         |
| Battle phases  | existing `player` / `won` / `lost` + new `switch_required`                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Battle events  | new `switch_out`, `switch_in`, `member_faint` (with `slot`); `party_wipe` is `lost` with no standing member                                                                                                                                                                                                                                                                                                                                                                 |
| Screens        | `screen_title`, `screen_office_start`, `screen_class_select`, `screen_overworld`, `screen_battle`, `screen_promotion`, `screen_preview_complete`                                                                                                                                                                                                                                                                                                                            |
| Overlays       | `ovl_dialogue`, `ovl_document`, `ovl_reward_receipt`, `ovl_stakes_card`, `ovl_door_prompt`, `ovl_recruit_card`, `ovl_confirm`, `ovl_team_panel`, `ovl_vending`, `ovl_coach_mark`, `ovl_interstitial_minute`, `ovl_toast`, `ovl_settings`                                                                                                                                                                                                                                    |
| HUD / controls | `hud_top`, `hud_objective`, `hud_party_strip`, `hud_wallet`, `hud_letters`, `hud_map`, `hud_zone_chip`, `hud_pin`, `hud_edge_arrow`, `hud_nearby`, `ctl_band`, `ctl_dpad`, `ctl_act`, `ctl_team`, `ctl_settings`; battle `ui_party_bench`, `ui_switch_button`                                                                                                                                                                                                               |
| Coach marks    | `coach_move`, `coach_interact`, `coach_switch`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Receipts       | `rcpt_signing_bonus`, `rcpt_printer_online`, `rcpt_ticket_closed`, `rcpt_desk_argument`, `rcpt_meeting_prepped`, `rcpt_premeeting_spar`, `rcpt_one_on_one`                                                                                                                                                                                                                                                                                                                  |
| Assignments    | `asg_printer` (`not_started → accepted → toner_collected → installed → complete`), `asg_meeting_prep` (`not_started → accepted → handout_held → complete`)                                                                                                                                                                                                                                                                                                                  |
| Key items      | `key_toner`, `key_offer_letter` (stack, max 2, the recruit token), `key_handout_q3_summary`, `key_handout_q3_deck`, `key_handout_q2_summary`, `key_access_badge` — stored in `keyItems`, **never** in the 4-slot battle `inventory`                                                                                                                                                                                                                                         |
| POIs           | `poi_reception_desk`, `poi_directory_sign`, `poi_exit_door`, `poi_water_cooler`, `poi_printer`, `poi_supply_cabinet`, `poi_break_counter`, `poi_vending_machine`, `poi_break_table`, `poi_agenda`, `poi_handout_rack`, `poi_elevator_door`, `poi_supervisor_door`                                                                                                                                                                                                           |
| Triggers       | `trg_first_step`, `trg_sight_desk_challenger`, `trg_sight_meeting_prepper`, `trg_sight_supervisor`, `trg_supervisor_door`, `trg_elevator_ride`, `trg_switch_coach`                                                                                                                                                                                                                                                                                                          |
| Rewards        | `rwd_start_options`, `rwd_asg_printer`, `rwd_asg_meeting_prep`, `rwd_enc_desk_challenger`, `rwd_enc_meeting_prepper`, `rwd_enc_supervisor_1on1`, `rwd_promotion_f1` (each claimable once; recruitment has none)                                                                                                                                                                                                                                                             |
| Flags          | `flag_greeted`, `flag_badge_reader_denied`, `flag_switch_coached`, `flag_move_coached`, `flag_interact_coached`, `flag_preview_complete`                                                                                                                                                                                                                                                                                                                                    |
| Dialogue       | `dlg_renata_{callout,ticket,hint_toner,hint_install,close_ticket,gavin_pending,holloway,recruit_me,badged,after}` · `dlg_gavin_{busy,no_pressure,callout,challenge,declined,you_lost,beaten,offer,offer_declined,joined,party,after,after_win}` · `dlg_priya_{hook,request,pass,waiting,wrong_deck,wrong_q2,delivered,spar,raincheck,you_lost,beaten,offer,offer_declined,offer_full,joined,party,after}` · `dlg_holloway_{early,gavin_pending,1on1,you_lost,beaten,after}` |
| Shop           | vending stock: `espresso` ×2, `side_hustle` ×1 (existing item ids)                                                                                                                                                                                                                                                                                                                                                                                                          |
| Save           | separate slot key `corporate-climb-office-save`, own version number starting at 1; Classic `corporate-climb-save` untouched                                                                                                                                                                                                                                                                                                                                                 |

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

## 16. Route traces and acceptance checklist (paper playtest)

Steps are tile moves; `→` is an interaction. State after each beat is in brackets.

### 16.1 Required route (acceptance route: recruit Gavin, win Holloway with a switch)

1. Spawn `(12,15)` facing north; `coach_move`; `SIGNING BONUS` receipt (+10 📈, wallet 10). First
   step → `dlg_renata_callout`; banner "Talk to Renata → RECEPTION", pin on Renata.
2. Walk `(12,16) → (8,16)` (5 steps), face north → prompt "Talk · Renata" (`coach_interact`) →
   `dlg_renata_ticket` [`asg_printer = accepted`]. Banner: toner → BREAK ROOM; pin on the cabinet;
   edge arrow `›` (cabinet is off-screen to the right).
3. Walk `(8,16) → (5,16) → (5,13) → (5,12)D → (5,11)` (8). Gavin is at `(6,10)`; his sightline is
   inactive (printer not complete). Optional peek: talk → `dlg_gavin_no_pressure`.
4. Walk `(6,11) → (9,11) → (9,9) → (10,9)D → (13,9) → (14,9)D → (15,9) → (15,8)` (13), face north
   → cabinet opens. [`toner_collected`, `key_toner`]. Toast. Banner: install → DESKS.
5. Walk back `(15,9) → (14,9) → (10,9) → (9,9) → (9,8)` (8), face north → "Install toner". Printer
   flips to working, pages slide out, receipt `PRINTER — ONLINE` (Offer Letter ×2). [`installed`,
   **`key_offer_letter` ×2**, `hud_letters` appears]. Banner: report back → RECEPTION.
6. Walk `(9,9) → (9,11) → (5,11) → (5,12) → (5,13) → (7,13) → (7,14)` (12), face east → Renata.
   `dlg_renata_close_ticket` → receipt `TICKET #0001 CLOSED` **+10 📈** (wallet 20 on close),
   letters explained. [`complete`]. Banner: talk to Gavin → DESKS; pin on Gavin.
7. Walk `(6,14) → (6,13) → (5,13) → (5,12) → (5,11) → (5,10)` (6). Stepping on `(5,10)` enters
   Gavin's sightline → `!` → `dlg_gavin_callout` → `dlg_gavin_challenge` → stakes card (Offer
   eligible) → `[Bring it]` → title card `DESK-PIT ARGUMENT`. **Battle 1**, solo (~2:10 elapsed).
8. Win → return to `(5,10)` facing east, Gavin facing you → receipt `DESK-PIT ARGUMENT — WON`
   (+15 XP 15/30, **+8 📈** → 28, Offer eligible ✓) → `dlg_gavin_beaten` → `dlg_gavin_offer` →
   recruit card → `[Extend the offer]` → slot fills, `fanfare` → `dlg_gavin_joined`.
   [**party = YOU, GAVIN**; letters 1]. Banner: see Holloway → ELEVATOR LOBBY; pin on the door.
9. Optional vending: `(5,9) → (9,9) → (14,9) → (21,9)` (16), face east → `ovl_vending` → Espresso
   (wallet 14, bag 2/4). Recommended for a first run; skip for the fastest route.
10. Walk `(5,9) → (9,9) → (10,9)D → (11,9) → (11,3) → (10,3)D` (14). `ovl_door_prompt` (party row
    shows YOU / GAVIN) → `[Step in]` → placed at `(9,3)` → `dlg_holloway_1on1` (with the "You
    brought people" line) → `[Begin]` → title card `ONE-ON-ONE / NO LEAVING EARLY`. **Boss.**
11. Boss script a reviewer should be able to reproduce: lead attacks twice (~56 dmg); Holloway's
    two turns leave the lead near 50% → `coach_switch` → `SWITCH` → bench → Gavin in (Holloway's
    free swing hits Gavin) → Sticky Note (Holloway Demoralized) → `SWITCH` back to the lead (free
    swing on the lead) → two boosted hits finish her. If the lead faints instead, the forced bench
    opens with no enemy turn and Gavin finishes or falls; a party wipe goes to §6 and the route
    resumes at step 10.
12. Win → return to `(9,3)` facing west → receipt `ONE-ON-ONE — SURVIVED` (+30 XP → **TEAM LEVEL
    2** row, +20 HP to standing members; **+20 📈** → 48, or 34 with the Espresso; Access Badge;
    Promotion →) → `screen_promotion` "CLEARED PROBATION" → pick → back at `(9,3)` →
    `dlg_holloway_beaten` badge lines. Banner: take the elevator → ELEVATOR LOBBY; pin on the doors;
    reader steady green.
13. Walk `(9,2) → (3,2)` (7 — Holloway stands at `(6,3)`, so go along row 2), face north → confirm
    `FLOOR 2` → `[Ride up]` → doors close, `elevatorUp` → **FLOOR 1 CLEARED** → `[Back to Floor 1]`
    → `(3,2)` facing south, doors open behind you. [`flag_preview_complete`]. Banner: `FLOOR 1
CLEARED · Floor 2 under construction`. Renata says `dlg_renata_after`; Gavin `dlg_gavin_after_win`.

Tile total ≈ 73 moves (~18 s of walking); the rest is reading, recruiting and fighting.

### 16.2 Optional route (insert between steps 8 and 10 above, or any time after step 2)

- a. From the desks door `(10,9)`, walk up the hall on column 13: `(11,9) → (13,9) → (13,5)` (6).
  Stepping on `(13,5)` enters Priya's sightline → `dlg_priya_hook` → `dlg_priya_request` →
  `[Take it on]`. [`asg_meeting_prep = accepted`]. Dim optional row in the banner; dim pin on the
  agenda.
- b. Walk `(13,4) → (13,3) → (14,3)D → (16,3) → (16,2)` (5), face east → `ovl_document`. Optional
  row: pick the handout → MEETING ROOM.
- c. Walk `(16,1) → (21,1)` (6), face east → rack card → **Q3 Numbers — Summary (1 pg)**
  [`handout_held`, `key_handout_q3_summary`]; toast. Optional row: bring it to Priya → HALL.
  - Wrong-pick branch: choose the Full Deck, walk back to Priya `(13,3)` facing north (10 steps) →
    `dlg_priya_wrong_deck` (chip shake); return to the rack (10), swap (toast "Swapped: …").
    Nothing lost; ~12 s.
- d. Walk `(16,1) → (16,3) → (14,3)D → (13,3)` (10), face north → Priya → `dlg_priya_delivered` →
  receipt `THE 10:30 — PREPPED` **+6 📈** [`complete`] → `dlg_priya_spar` → `[Spar]` → title card
  `PRE-MEETING SPAR`. **Battle 2** — with Gavin on the bench if step 8 happened → receipt (+22 XP,
  **+11 📈**, Offer eligible ✓) [`enc_meeting_prepper = won`] → `dlg_priya_offer` → `[Extend the
offer]` → `dlg_priya_joined` [**party = YOU, GAVIN, PRIYA**; letters 0, `hud_letters` hides].
- e. Loss branch (any fight): `ovl_interstitial_minute` → `(19,8)`, whole party restored → walk
  back: to Priya 13 tiles, to Gavin 16, to Holloway's door 16 → same stakes card.
- f. Rejoin the required route at step 10 (Priya's tile is 4 steps from the lobby door).

With the optional route: 65 📈 total, team level 2 reached at Priya (37 XP ≥ 30), Holloway then
lands at 37/55 — no second level-up in the preview. A full party makes Holloway comfortable; that
is the reward for doing everything.

### 16.3 Functional acceptance checklist

| #   | Check                                                                                                                                                   | Where it's specified |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| A1  | Objective banner with destination chip and map pin visible within 30 s of spawn                                                                         | §9.1, §10.3          |
| A2  | Printer fixed; tile state flips; Renata pays +10 exactly once via a receipt; installing toner yields Offer Letter ×2 via a receipt                      | §4.1, §10.6          |
| A3  | Gavin's fight starts before 3:00 on a straight run; it is solo (strip shows one filled chip)                                                            | §9.1, §16.1          |
| A4  | After beating Gavin, the recruit card appears; `[Not yet]` keeps the letter and talking again re-offers; `[Extend the offer]` fills slot 2              | §3.2, §10.7          |
| A5  | Team panel (P / TEAM) lists YOU + GAVIN with HP/PP; empty row explains itself; Gavin's token is still at `(6,10)` with `dlg_gavin_party`                | §10.8, §2.2          |
| A6  | Door `(10,3)` prompt shows the party row; `[Not yet]` steps back; `[Step in]` triggers Holloway with the "You brought people" line                      | §8                   |
| A7  | In the Holloway fight, SWITCH (5/Tab/button) opens the bench; switching costs the turn (Holloway swings at the incoming member)                         | §3.4                 |
| A8  | `coach_switch` appears once when the active member drops under 50% with a standing bench member; never again on this save                               | §3.6                 |
| A9  | Lead KO with Gavin standing → forced bench, no cancel, no enemy turn; both KO → interstitial → break room, both restored with the recover feedback      | §3.4, §6, §12        |
| A10 | Holloway win pays +30 XP / +20 📈 once via a receipt with the level row, grants the badge, rolls and **saves** the perk offer before `screen_promotion` | §5, §8, §10.6        |
| A11 | Elevator green → celebration shows Team, Switches, Options earned; return to `(3,2)` facing south; ride again shows the same screen, no receipt         | §8, §10.12           |
| A12 | Optional: Priya recruited with the second letter; a third recruit attempt is impossible (no letters; `dlg_*_after`; letters chip hidden)                | §2.3, §3.2           |
| A13 | Reload mid-campaign restores position, facing, party HP/PP, letters, assignment stages, encounter results, and a pending promotion offer                | §15                  |
| A14 | Classic save untouched by any of the above; Classic Continue still works                                                                                | §15                  |
| A15 | Every row of the §12 feedback matrix can be triggered and observed (visual + audio + live region) on desktop and touch                                  | §12                  |
| A16 | Every transition in §13 lands the player at the stated tile and facing with the NPC facing them                                                         | §13                  |

Why the switch is exercised but not gated: gating the badge on "you must have switched" would be
an invisible rule and would punish a strong solo run. Instead the boss is tuned so the switch is
the obvious play (§5.1), the coach mark names it at the moment it matters (§3.6), and A7–A9 make
the reviewer perform it. A solo win is legal, hard, and honest.

### 16.4 State matrix (which line plays)

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

## 17. Decisions and their reasons

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
- **Holloway tuned for a bench (130 HP).** The bench is real HP; the boss has to respect it or the
  switch is never worth its turn.
- **One receipt surface for every grant.** The player is never surprised by a number changing;
  the HUD updates when the receipt closes; duplicated rewards are impossible to _feel_ because a
  re-talk shows no receipt and says so in character.
- **Badge tokens instead of new sprite sheets.** Reuses the project's best art at full quality,
  makes every face consistent across seven surfaces, and turns the art constraint into an art
  direction.
- **Three coach marks, no tutorial screens.** Each teaches one input at the first moment it
  matters and dies on that input. Everything else is taught by the world.
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

## 18. Open risks for Astra's architecture pass

1. **Party projection over `TurnContext`.** `resolvePlayerMove` / `resolveItemUse` read
   `run.hp`/`run.pp`/`effectivePlayer`. The design asks for a copy-in/copy-out projection of the
   active member (§3.4) plus one new entry point `resolvePartySwitch` and one new phase
   `switch_required`. Watch: `'lost'` is passed to `finish()` from two call sites in `turn.ts`
   (the enemy-turn KO and the end-of-turn burn KO) — both need the bench check to choose
   `switch_required` instead. Keep the tower path bit-identical (no party → old behaviour) so
   `simulation.test.ts` stays green.
2. **`BattleEventKind` additions.** `switch_out` / `switch_in` / `member_faint` need sequencer
   entries (timing table) and `ViewPatch` support for swapping the player sprite/HP bar mid-battle.
   The `BattleScreen` currently assumes one player identity for the whole fight, and the deck must
   keep a stable height when the bench picker replaces the move grid (PR #59 fixed a deck-height
   jitter; don't reintroduce it).
3. **Battle exit plumbing and the receipt.** The tower's post-battle path (`applyVictory` →
   `BattleVictoryScreen` → floor advance / `GameOverScreen`) assumes a run ladder. The office needs
   an encounter-mode exit that returns to `screen_overworld` at the saved tile/facing **first**,
   then shows `ovl_reward_receipt`, then continues the NPC's post-battle dialogue; and on a wipe,
   the interstitial → break-room path. Rewards come from the encounter, never the formula.
4. **Level-up heal semantics.** `applyVictory` heals `run.hp` by `levelUpHeal`; with a party it
   must heal every standing member (§3.5) — a small change but it touches a shared function; gate
   it on the presence of a party.
5. **`Enemy.floor` is required by the type.** Either put `rank` in that slot for office entries or
   widen the type; do not let office entries near `ENEMY_POOLS`. Recruit kits (`cw_*`) are
   `PlayerClass`-shaped but have no `perk`/`intro`/`winText` — make those optional or give the kits
   neutral values.
6. **Promotion offer persistence.** Roll and save `pendingPerkOffer` before the screen mounts —
   the same rule the tower follows via `advanceFloor`; here the trigger is the boss win, not a floor
   change.
7. **Save isolation and shape.** A second slot key (`corporate-climb-office-save`) means two
   Continue states; clearing one must never clear the other; `history.ts` lifetime stats should
   either ignore the office or tag it. `run.hp`/`run.pp` mirroring `party[0]` at rest is a
   two-places-to-be-wrong risk — consider making `party` canonical and `run.hp/pp` derived.
8. **Headshot crops and the badge-token pipeline.** The token system (§14.2) needs a per-sprite
   focal point and a shared `Headshot` component rendered at 24/40/48/64 px; get the crop right once
   and every surface inherits it. A blurry or off-center crop anywhere fails §19.
9. **Tileset states and the renderer.** Tiles have states (printer, cabinet, reader, counter,
   vending); the map renderer needs per-tile state lookup, not a static image. Also new UI code:
   horizontal camera follow with clamping — verify no sub-pixel shimmer at the Stage scale and that
   the reduced-motion snap is truly static.
10. **Title screen crowding.** A third mode (THE OFFICE) plus Continue/Daily/Codex/golden-badge
    easter egg needs a layout pass; `screen_office_start` owns its Continue/New so the title gets
    one button.
11. **Balance is untested.** Numbers in §5 are derived from the damage formula, not from play; the
    solo-Engineer-vs-Holloway matchup is the tightest and the full-party fight may be too easy. Tune
    Holloway's DEF/HP and the recruits' HP, not rewards or letter counts.
12. **Pacing may run short** of the 10-minute floor for fast readers (§9). Recommendation: accept.
13. **Touch ergonomics.** D-pad + ACT + TEAM on a 472-px-wide frame at ~17% shrink on small phones
    must keep `--tap-min`; the 248-px control band is sized for that but needs a device check.
14. **Keyboard collisions.** Key 5 for SWITCH sits next to the 1–4 move keys; Tab is the
    alternative. Intercept Tab only while the battle deck has focus so it doesn't fight the
    browser's focus order.
15. **Live region volume.** The §12 matrix routes many events through one polite live region; make
    sure rapid sequences (switch → enemy hit → faint) coalesce rather than queue a backlog.

## 19. Definition of polish-done — Fable's task-8 sign-off checklist

Every line is pass/fail on a real device (one small phone, one desktop browser) with a player who
has not read this document. Any fail blocks done.

**Confusion points**

- [ ] The tester says where they are going and why at any moment when paused (objective + pin + zone
      chip do the job without a hint from the observer).
- [ ] The tester finds the supply cabinet without backtracking more than once (edge arrow works).
- [ ] The tester understands Offer Letters before the first recruit card (receipt + Renata line).
- [ ] The tester understands that switching costs a turn before their first switch (bench header).
- [ ] No tester asks "did that register?" for any input.

**Dead ends**

- [ ] No state exists where no NPC or POI advances the objective (walk the §16.4 matrix live).
- [ ] Declining an offer, losing a fight, or walking away from the door never removes a path forward.
- [ ] A fully fainted party is told exactly where to go (door card + pin on the counter).
- [ ] Reload at every §16.1 step resumes with the correct banner, pin, and party.

**Unclear stakes**

- [ ] Every stakes card shows win/lose lines, the party's HP numbers, and (for Holloway) "No leaving
      early" before the commit button is reachable.
- [ ] The door prompt is the last exit and says so; no tester is surprised the fight can't be left.
- [ ] Loss costs are exactly what the card promised (walk-back only; consumables used are gone and
      the tester can name that rule when asked).

**Ugly empty states**

- [ ] Every §10.13 state has been reached in a build and matches its spec (no blank panel, no bare
      dash, no "undefined", no missing headshot).
- [ ] Party strip with one member, team panel with two open seats, vending sold out, letters at 0,
      bag empty — all reviewed on the small phone.

**Reward duplication feel**

- [ ] Every grant appears as exactly one receipt; the wallet chip changes only when a receipt closes.
- [ ] Re-talking any NPC after a payout shows no receipt and gets an in-character line.
- [ ] Recruiting shows no Options/XP; the tester does not expect any (ask them).
- [ ] The celebration's `Options earned` equals the sum of receipts seen (65 on the full route).

**Party UX friction**

- [ ] Recruit flow from win to "joined" is ≤ 15 s and needs no reading beyond the card.
- [ ] The tester can name each member's HP from the strip without opening the panel.
- [ ] Voluntary switch, forced switch, and cancel all work by keyboard alone and by thumb alone.
- [ ] The bench picker never changes the deck's height; no layout jump on open/close.
- [ ] `coach_switch` fires once, at the right moment, and is not needed a second time.

**Presentation, feedback, motion**

- [ ] Every §12 row verified on both devices with sound on; every reduced-motion variant verified
      with the toggle on (no residual animation anywhere, including the caret and pins).
- [ ] Every §13 transition lands at the stated tile/facing; no hard cuts; NPC faces the player.
- [ ] No text overflow, clipping, or ellipsis in any card, banner, or chip at the smallest viewport
      and at "slow" and "instant" text speeds.
- [ ] No emoji or rectangle stand-ins for tiles or characters (§14.3); all tile states present.
- [ ] Headshots are sharp and centered at every size; the same face everywhere for each person.
- [ ] 60 fps camera scroll on the small phone; no shimmer; no input lag perceptible to the tester.
- [ ] Touch: every target ≥ 54 px measured in the shrunk Stage; the tester's thumb never covers the
      party strip or the objective while using the D-pad.
- [ ] Keyboard-only run from title to celebration; screen reader announces objective, prompts,
      receipts, recruits, switches, and rejects.

**Pacing and copy**

- [ ] First objective ≤ 30 s, first battle ≤ 3 min, required route 10–15 min for the tester
      (measured, with one loss allowed).
- [ ] The tester laughs or smiles at least twice; no line is read twice to be understood.
- [ ] No line explains a control; no coach mark appears more than once; no coach mark appears for a
      solo player except move and interact.
