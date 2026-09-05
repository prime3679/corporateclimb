# Floor 2 — engine hooks for Astra

_Short note to go with `docs/rpg/floor-2-design.md`. Fable owns the design, copy, IDs and art;
Astra owns the engine work below. Nothing here needs a second combat engine, a second perk pool,
or a Classic change. Frozen names are in the design doc §12 and in `src/content/office/floor2.ts`;
if a name here disagrees with those, those win._

## 0. Where this branch stands

`feat/office-floor-2-design` sits on `main` after [PR #71](https://github.com/prime3679/corporateclimb/pull/71)
(the multi-floor loop) and replaces its Floor 2 stub. Already wired, under the frozen
ids, with `floors.test.ts` tracing it:

- **Content**: `FloorId`, all Floor 2 zones / NPCs / encounters / coworker / assignments / key
  items / POIs / triggers / rewards / receipts / flags / dialogue ids in `ids.ts`; every node in
  `dialogue.ts` (with the two Floor 1 copy changes); `OFFICE_ENCOUNTERS` + `COWORKER_KITS` +
  `RECEIPTS` + `REWARD_*` rows (Kessler's `phase2` entry is present but inert until §5);
  `floor2.ts` keyed under `floor_02` in `map.ts`.
- **Renderer**: `tiles.tsx` draws the Floor 2 map (floors, rugs, decor, `door_v_single`, all new
  props with their states), per-floor light pools, Floor 2 zone accents/SFX, the Floor 2
  directory, Whitlock's `{n}` substitution in the dialogue box.
- **Reducer (stub parity + the backtracking beat)**: Teddy's callout on the first step
  (`trg_first_step_f2`, `flag_visited_f2`); `asg_transfer` from `not_started` through `complete`
  — `dlg_teddy_packet` → booth (`key_badge_photo`) → Holloway on Floor 1 (`dlg_holloway_sign_transfer`,
  `key_transfer_form`) → People Ops tray (`rcpt_transfer_filed`, +12, one letter, once) →
  Teddy's sightline / talk (`dlg_teddy_filed`); Whitlock's sightline hook; Kessler's `early` /
  `teddy_pending` lines; Facilities take-five / vending / cabinet; objective chain with
  cross-floor `(Floor n)` destinations pinned on the elevator doors; letter cap 3; old saves
  default the new assignment / encounter keys.

Not wired (the rest of this note): compliance training onward. Two divergences from the design to
settle with Adrian: PR #71 replaced the Floor 1 celebration with the ride transition (design §8.2
keeps the celebration on the first ride with a `[Floor 2]` button), and the ride is a Floor 1 ⇄
Floor 2 toggle rather than the `ovl_elevator_panel` in §8.2 — fine until Floor 3 needs a row.

## 1. Multi-floor state

- `FloorId = 'floor_01' | 'floor_02'`; `OfficeSave.floorId` becomes the union. `player` is the
  position **on that floor**. Arrival is always the elevator tile, so no per-floor positions are
  stored.
- Content resolution by floor: `map.ts` today exports Floor 1 tables at module scope
  (`FLOOR_ART`, `zoneAt`, `NPC_TILE`, `INTERACT_SPOTS`, …). Wrap them in a `FloorContent` bundle
  (`{ art, solid, zoneAt, zoneLabel, npcTiles, sightlines, spots, decor, rugs, doorCells, propCells,
spawnPoints }`) and add a `FLOORS: Record<FloorId, FloorContent>` lookup. `floor2.ts` already
  holds Floor 2's tables in that shape (`FLOOR_2_*`); promote it into the barrel when the bundle
  exists. `movement.ts`, `talk.ts`, `objective.ts`, `WorldMap`, `tiles.tsx` read through the bundle
  instead of the module-scope Floor 1 tables. Keep Floor 1's exports as-is for the frozen tests.
- `tiles.tsx`: the glyph → sprite switch becomes per-floor data. Floor 2's glyph table is
  `FLOOR_2_PROP_CELLS` / `FLOOR_2_DOOR_CELLS` / `FLOOR_2_WALL_DECOR` / `FLOOR_2_RUGS`; Floor 2
  specifics vs Floor 1: `c` counts `d` (exec desk) as a desk for `chair_n`; `t` uses `btable_f2_*`;
  `i` uses `directory_f2`; `D` in a vertical wall with walls N **and** S is `door_v_single`;
  `f` alternates `filing_closed`/`filing_open` by x parity; `=` runs of 3 are `desk_l/m/r`, runs
  of 2 are `desk_l` + `desk_r`. Wall autotile, shades and floors are the same code.
- `WorldMap` `aria-label` and `campaignSummary` read the floor. Light pools are per floor (Floor 2
  wants pools over the help desk, People Ops, the director's rug, the coffee counter and Finance).
- `NPC_ACTOR` gains `npc_help_desk_intern → 'teddy'`, `npc_auditor → 'whitlock'`,
  `npc_director → 'kessler'` (`ACTOR_IDS` and `SPRITE_TO_ACTOR` already have them).
- `HEADSHOT_FOCALS` in `sprites.ts` has no entries for `intern`, `vp`, `boss` — add one each after
  checking the 40/48/64 px crops.

## 2. Elevator destinations

- New overlay `{ kind: 'elevator_panel' }`. Rows come from a small table
  `ELEVATOR_FLOORS: { id: FloorId | 'floor_03'; number: 1|2|3; name; requires: KeyItemId | null }`
  = `[3: 'FLOOR 3', requires key_employee_badge] [2: 'OPERATIONS', requires key_access_badge]
[1: 'YOUR TEAM', requires null]`. A row is disabled when its key is missing; the current floor's
  row is inert ("You are here"). Floor 1's sub-line lists hired coworkers not in the party whose
  desk is on Floor 1.
- Action `act_ride(to: FloorId | 'floor_03')`: `floor_03` with the badge → `screen_floor2_complete`
  (celebration; `flag_floor2_complete`; return to Floor 2 `(3,2)` south). Otherwise set `floorId`,
  `player = { x: 3, y: 2, facing: 's' }`, `stats.rides++`, clear overlays, **save**. The doors-close /
  fade / doors-open sequence is presentation (`useOfficeFeedback`), 400 + 300 + 300 ms, RM instant.
- Floor 1's existing `confirm/elevator` → `rideElevator` path becomes: first time (no
  `flag_preview_complete`) → the existing celebration with a new primary `[Floor 2]` that calls
  `act_ride('floor_02')`; afterwards the "Elevator" prompt opens the panel instead of the confirm.
- `poi_elevator_door_f2` red-reader line (`flag_reader_denied_f2`) plays once when the Floor 3 row is
  pressed without the badge; the panel stays open.

## 3. Access badges

- `key_access_badge` (visitor, Floor 1) unlocks Floor 2 in the panel. `key_employee_badge` (Floor 2,
  granted by `poi_badge_printer`, **not** by the Kessler win) unlocks the Floor 3 row. Both are
  `keyItems`, never bag items.
- Reader tile state on Floor 2: `readerGreen = key_employee_badge > 0`. On Floor 1 unchanged.
- The badge printer is a stateful prop: `idle` until `enc_director_review = won`; on "Print badge"
  → `printing` for 1.8 s (overlay `{ kind: 'toast' }` is not right for this — use a short `pause`
  overlay or the existing dialogue line as the timer) → receipt `rcpt_employee_badge` → `done`.

## 4. Roster (seats, not hires)

`key_offer_letter` already caps at 3 on this branch. Remaining:

- `OfficeSave.hired: CoworkerId[]`. `dlg_*_joined` appends to both `party` and `hired`.
- `act_dismiss(slot)`: remove a coworker from `party` (never slot 0); they keep `hp`/`pp` — store
  the member record on a `bench: Partial<Record<CoworkerId, { hp; pp }>>` so rejoin restores it
  (or simplify: benched members rejoin at the HP/PP they left with; a wipe does not touch them).
  Toast "{Name}'s at {his/her} desk. Floor {n}." Confirm card copy is design §3.2.
- `act_rejoin(cw)`: via `dlg_*_rejoin` when `hired` includes them, they are not in `party`, and
  `party.length < PARTY_MAX`; no letter consumed. `dlg_*_rejoin_full` otherwise.
- Recruit card full variant: when `partyHasRoom` is false and a letter is held, the card shows
  `[Make room]` which opens the team panel in roster mode and then re-pushes the recruit overlay.
  `coach_roster` fires once (`flag_roster_coached`) when that variant first mounts.
- Team panel empty-row copy gains the "Open seat · {Name} is at {his/her} desk (Floor {n})" state.

## 5. Phase 2 for encounters

`turn.ts` `resolveEnemyDown` skips the phase-2 check when `ctx.encounterEnemy` is set. Un-gate it
for encounters that carry a `phase2`:

```ts
const base = ctx.encounterEnemy ?? resolveNgBaseEnemy(run)
const threshold = ctx.encounterEnemy ? 0.5 : ascensionEffects(run.ascension).bossPhase2Threshold
if (w.enemyPhase === 1 && base.phase2 && w.enemyHp > 0 && w.enemyHp <= base.maxHp * threshold) {
  const phase2 = ctx.encounterEnemy ? applyPhase2(ctx.encounterEnemy) : resolveEnemy(run, 2)
  …
}
```

`combatEnemy(ctx, 2)` must return the phase-2 projection for encounters (name `Kessler
(Restructuring)`, `maxHp` 100, ATK 18, DEF 10, types `strategy`/`execution`, the phase-2 moves).
Classic path (`encounterEnemy` undefined) must stay bit-identical — `simulation.test.ts` is the
guard. Enemy statuses clear on transform (existing behaviour); party member statuses do not. The
`phase2` event already exists in the sequencer and `BattleScreen`.

## 6. Objectives across floors

`currentObjective(save)` returns `{ text, floor, zone, pin }`. When `floor !== save.floorId`, the
presentation shows the destination chip as `▲ FLOOR 2` / `▼ FLOOR 1` (landing accent) and pins the
current floor's elevator doors (`(3,1)` on both floors); the edge arrow follows the pin as today.
Order of evaluation (first match wins): Floor 2 chain → Floor 1 chain → cleared states. Copy for
every state is in design §4, §8 and §10.4.

## 7. Save v2 and migration

```ts
OFFICE_SAVE_VERSION = 2
migrateV1toV2(v1): {
  ...v1, version: 2,
  hired: v1.party.filter(m => m.def.kind === 'coworker').map(m => m.def.id),
  vendingStock: { floor_01: v1.run.shopStock ?? [...OFFICE_VENDING_STOCK], floor_02: [...OFFICE_VENDING_STOCK_F2] },
  assignments: { ...v1.assignments, asg_transfer: 'not_started', asg_audit: 'not_started' },
  encounters: { ...v1.encounters, enc_help_desk_intern: 'open', enc_auditor: 'open', enc_director_review: 'open' },
  stats: { ...v1.stats, rides: 0, msByFloor: { floor_01: v1.stats.msOnFloor, floor_02: 0 } },
}
```

`loadOfficeSave` accepts v1 and v2 (v1 through the migration), rejects anything else, and keeps the
`floor_01 | floor_02` check. `run.shopStock` is set from `vendingStock[floorId]` when the vending
overlay opens and written back on close (or refactor `ShopScreen` to take the stock explicitly).
`msOnFloor` accrues into `msByFloor[floorId]`; the celebration reads its own floor's total.
Classic `corporate-climb-save` is not read or written by any of this.

## 8. Floor 1 changes (additive)

- New dialogue nodes and the two copy changes in design §2.5; `SpeakerId` gains
  `'teddy' | 'whitlock' | 'kessler'`; `NPC_CAST` / `cast.ts` gain the three entries (roles: "IT
  Help Desk (Rotational)", "External Auditor", "Director of Operations").
- `poi_vending_machine` (Floor 1): prompt "Print receipts · Vending" while `asg_audit =
accepted`; grants `key_receipt_roll` once; copy branches on whether Floor 1 stock was ever
  bought (`vendingStock.floor_01.length < 3`).
- `screen_preview_complete`: button row and dim line per design §8.2.
- Objective after Floor 1 clear: **Take the elevator to Floor 2** instead of the "under
  construction" text.

## 9. Content entries to add (from the design doc)

`OFFICE_ENCOUNTERS` + `enc_help_desk_intern`, `enc_auditor`, `enc_director_review` (with `phase2`);
`COWORKER_KITS` + `cw_help_desk_intern`; `REWARD_OPTIONS` / `REWARD_XP` / `RECEIPTS` +
the six Floor 2 rows; `ENCOUNTER_RECEIPT` + three; `OFFICE_VENDING_STOCK_F2 = ['espresso',
'espresso', 'pto_day', 'standing_desk']`; `FLOOR_2_LEDGER_MAX = 90`; `HANDOUT_CHOICES`-style tables
for the directory text. All numbers are in design §5 and §7.

## 10. Tests to add / keep

- Keep: every Floor 1 test untouched and green; `simulation.test.ts` bit-identical.
- Already here: `floor2-map.test.ts` (reachability, spot geometry, sightlines, elevator continuity,
  atlas coverage) and the extended `tileset.test.ts` / `overworld-actor.test.ts`.
- Add: a Floor 2 required-route reducer trace (design §13.1 as a `dispatchOfficeAction` script,
  like the Floor 1 recruit/switch tests), a v1 → v2 migration test, an elevator round-trip test
  (state preserved on both floors), a roster dismiss/rejoin test (HP preserved, no letter
  consumed, `PARTY_MAX` respected), and a phase-2 encounter test (transform at ≤ 85, statuses,
  turn spent, Classic unaffected).
