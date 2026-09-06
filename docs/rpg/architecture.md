# The Office — Architecture (5-floor campaign)

_Status: implementation contract for `feat/overworld-mvp`. Frozen player-facing
IDs and numbers live in `docs/rpg/mvp-design.md`. This file records how Astra
wired that freeze into the existing engine/presentation split. Do not invent a
second combat engine or a second perk pool._

Companion reading: `docs/rpg/iteration-roadmap.md` (Fable / Astra / CoS loop),
`docs/rpg/mvp-design.md` (content freeze), `docs/rpg/balance.md`
(ledger and combat numbers), `docs/rpg/fidelity-bar.md` (walk-cycle follow-up to
the #67 presentation rebuild), `docs/rpg/office-audio.md` (Office beds vs Classic),
`CLAUDE.md` (Classic tower). Floor 2 is designed in
`docs/rpg/floor-2-design.md`; the engine work it asks for (multi-floor state, elevator
destinations, badges, roster, encounter phase 2) is listed in
`docs/rpg/floor-2-engine-hooks.md`. Floors 3–5 (the 5-floor climb) are designed in
`docs/rpg/floor-3-5-design.md`; elevator panel, assignment reducers and boss doors
are listed in `docs/rpg/floor-3-5-engine-hooks.md`.

## Ownership — Astra vs Fable

Matches the freeze header in `docs/rpg/mvp-design.md`: Fable owns the
experience; Astra implements the playable required route. Do not swap those
jobs.

**Astra owns** the playable Floor 1 required route:

- Office engine and a pure `dispatchOfficeAction` reducer
- Party projection into existing `turn.ts` (`resolvePartySwitch`,
  `switch_required`) — no second combat engine
- Isolated `corporate-climb-office-save` v1 (Classic `corporate-climb-save`
  untouched)
- Title **THE OFFICE** entry; reuse of `BattleScreen`, `ClassSelect`,
  `PromotionScreen`, `ShopScreen`
- Token-tinted stand-in tiles and tests that keep Classic green

Astra does **not** own ship-quality art, §12 / §13 / §19 polish sign-off,
rewriting frozen IDs or wording, a second perk pool, merge, or deploy.

**Fable owns** experience, content, wording, and pacing:

- The `mvp-design.md` freeze (player-facing IDs, copy, numbers)
- §14 ship-quality tileset and badge-token art
- Full §12 feedback matrix, coach-mark motion, and §13 fade/duck timings
- §19 device sign-off (task-8 playtest)

Fable does **not** invent a parallel combat resolver, touch Classic
save/combat, or treat token-tinted tiles as done art.

CoS playtests the required route on this draft. Fable's §19 checklist is
later polish, not a merge gate for this PR.

---

## 1. Split

| Layer        | Path                                                                          | Owns                                                                                                                                  |
| ------------ | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Content      | `src/content/office/*`                                                        | Frozen IDs, the 24×18 map, dialogue nodes, encounter kits, POI copy, reward ledger. Tables and lookups only.                          |
| Engine       | `src/engine/office/*`                                                         | `OfficeState`, `dispatchOfficeAction`, party, movement, dialogue effects, save I/O, encounter projection.                             |
| Combat       | existing `src/engine/turn.ts`                                                 | Damage, statuses, items, enemy AI. Office passes an `EncounterContext` projection; it does not fork a resolver.                       |
| Presentation | `src/screens/OfficeScreen.tsx` + `src/screens/office/*`                       | Map, overlays, party strip. Reuses `BattleScreen`, `ClassSelect`, `PromotionScreen`, `ShopScreen`.                                    |
| Art          | `scripts/gen_office_*.py` → `public/office/*`                                 | Hand-authored pixel sheets (actors, tileset + generated `tileAtlas.ts`). See `fidelity-bar.md`.                                       |
| Audio        | `scripts/gen_office_audio.py` → `public/audio/music_office_*` + Office stings | Distinct Office beds/stingers (title + F1–F5 + combat duck). Classic `CLASSIC_TRACKS` stay on the Act-1 files. See `office-audio.md`. |

Classic (`corporate-climb-save`, `ENEMY_POOLS`, `BASE_PERK_POOL`, `simulation.test.ts`)
is untouched. Office enemies never enter `ENEMY_POOLS`. Office campaigns always
run at Re-Org 0 with `BASE_PERK_POOL`.

## 2. Campaign state

`OfficeSave` is the persisted freeze from mvp-design §15. `OfficeState` is that
save plus session fields (overlay, battle, encounter). A battle in progress is
not written; reload restores the overworld (or `screen_promotion` when
`run.pendingPerkOffer` is set).

```ts
interface OfficeSave {
  version: 2
  run: RunState // floor stays 0; hp/pp mirror party[0] at rest
  party: PartyMember[] // [0] is the lead; PARTY_MAX = 3
  hired: CoworkerId[]
  bench: Partial<Record<CoworkerId, { hp: number; pp: number[] }>>
  floorId: FloorId // floor_01 … floor_05
  player: { x: number; y: number; facing: 'n' | 'e' | 's' | 'w' }
  assignments: Record<AssignmentId, string>
  encounters: Record<EncounterId, 'open' | 'won'>
  keyItems: Record<string, number>
  rewardsClaimed: string[]
  flags: string[]
  firedTriggers: string[]
  stats: { battlesWon: number; losses: number; switches: number; msOnFloor: number; rides: number }
}
```

`dispatchOfficeAction(state, action, rng?)` is a **pure reducer**. It never
reads or writes `localStorage`. Persistence lives at the UI boundary: after an
overworld / promotion / vending change, `CorporateClimb` writes
`corporate-climb-office-save` v2 (v1 migrates). Mid-battle states are not persisted. Classic
`SAVE_KEY` (`corporate-climb-save`) is never read or written by this path.

### 2.1 Five-floor contract

`FloorId` is `'floor_01' | 'floor_02' | 'floor_03' | 'floor_04' | 'floor_05'`.
`floorId` is authoritative for geometry and content lookups. `map.ts` keys art,
zones, NPC tiles, sightlines, interact spots, spawn, and elevator arrival by
floor. Floors 1–2 keep their frozen ids and maps. Floors 3–5 are Product / Sales
/ Exec (`docs/rpg/floor-3-5-design.md`, `floor3.ts` / `floor4.ts` / `floor5.ts`)
on the same shaft (`E` at `(2,1)`/`(3,1)`, reader `(4,1)`, arrival `(3,2)` facing
south). The drop-in checklist is `docs/rpg/floors-3-5-content-contract.md`.

The cab panel (`ovl_elevator_panel`, table `ELEVATOR_FLOORS`) is the only
destination picker. Rows: 5 EXEC / 4 SALES / 3 PRODUCT (`key_employee_badge`),
2 OPERATIONS (`key_access_badge`), 1 YOUR TEAM (open). The current floor is inert
("You are here"). Pressing a locked 3+ row plays that destination’s red-reader inspect once
(`poi_elevator_door_f2` / `_f3` / `_f4` with `flag_reader_denied_f2` / `_f3` /
`_f4` for Floors 3 / 4 / 5) and leaves the panel open. `poi_elevator_door_f5`
is the green “no 6” inspect, not a lockout.

Rides stay two-phase: `RIDE_ELEVATOR { to }` → `screen_elevator_ride` (doors /
fade presentation) → `COMPLETE_ELEVATOR_RIDE` sets `floorId`, teleports to
`elevatorArrivalForFloor(to)`, increments `stats.rides`, and saves. Backtracking
is always allowed once you are on a floor.

Office save is v2 (`hired`, `bench`, `stats.rides`). v1 loads through
`migrateOfficeSave`. Classic `corporate-climb-save` is never read or written.

## 3. Party

- Slot 0 is the chosen class. Slots 1–2 are `cw_desk_challenger` / `cw_meeting_prepper`
  in recruit order.
- Recruit = encounter won + `key_offer_letter` ≥ 1 + a free slot. The printer
  grants exactly two letters. Recruiting costs no Options and grants no XP.
- Team-wide: `RunState.level`, `xp`, `stockOptions`, `perks`, `inventory`.
- Per-member: `hp`, `pp`. Statuses live on `BattleState` and clear on switch.

## 4. Combat projection

`EncounterContext` is the overworld’s battle entry:

- `enemy` is the office content entry (`Enemy.floor` holds rank). It is passed
  as `TurnContext.encounterEnemy` so `resolveEnemy` / `ENEMY_POOLS` are never
  consulted.
- Before `resolvePlayerMove` / `resolveItemUse` / `resolvePartySwitch`, copy the
  active member’s `hp`/`pp`/kit into `run` + `effectivePlayer`. After the call,
  write `run.hp`/`run.pp` back onto `party[activeIndex]`.
- Classic path: no `encounterEnemy`, no `party` on the context → existing
  `'lost'` behaviour, bit-identical.
- Office path: a KO with a standing bench member becomes `switch_required`
  (`member_faint`) instead of `'lost'`. Voluntary switch emits `switch_out` /
  `switch_in` and then the existing enemy turn. Forced switch does not give the
  enemy a turn.
- Rewards are the encounter’s explicit `{ xp, options }`, claimed once via
  `rwd_enc_*`. Do not call `applyVictory`.

## 5. Economy and promotion

The floor ledger is the `rwd_*` ids in `docs/rpg/balance.md`. Celebration
“Options earned” sums only those claimed ids (Floor 1 max 65; Floor 2 max 90;
Floors 3–5 max 54 / 64 / 78). The celebration plate prints `earned / max`
and the earning rows; 0-Option promotion ids stay off the plate.

`BASE_PERK_POOL` is unchanged. Holloway’s win rolls `rollPerkOffer(run.perks,
rng, BASE_PERK_POOL)` into `pendingPerkOffer` and saves before
`PromotionScreen` mounts. Picking `signing_bonus` still uses `choosePerk`
(which applies `instantOptions: 60`) and then shows a **separate** receipt
`rcpt_promotion_signing_bonus`. That +60 is not a `rwd_*` row and must not
appear in the celebration total.

Vending is the existing shop math at floor 0 (`shopPrice`, `buyShopItem`).
`vendingStock[floorId]` is the source of truth; `run.shopStock` is the machine
currently open. Floor 1 stays `espresso` ×2 + `side_hustle`. Floor 2 stays
Operations (`espresso` ×2, `pto_day`, `standing_desk`). Floors 3–5 have their
own SKU lists in `OFFICE_VENDING_STOCK_BY_FLOOR`. Wellness Day is not sold.

## 6. Screens

Title gains one button, **THE OFFICE**, which opens an office Continue/New
gate (`screen_office_start`). New starts `ClassSelect` (Re-Org pick is
ignored; office is pinned to 0). `OfficeScreen` owns the overworld, overlays,
and the reuse of `BattleScreen` / `PromotionScreen` / `ShopScreen`.

## 7. Deferred for Fable (polish, not architecture)

These stay on Fable's side of the ownership table. They are not Astra
architecture work and they do not block this draft:

- Ship-quality tileset and badge-token art (§14)
- Full §12 feedback matrix and coach-mark motion
- §13 fade/duck timings
- §19 device sign-off

The MVP is playable on the required route with token-tinted tiles and the
existing portrait sprites.
