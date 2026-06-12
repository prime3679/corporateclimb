# Architecture Refactor Log

_Started 2026-06-12 after the v2.0 feature sprint (PRs #40–#47). Goal:
make the codebase match its own stated architecture (CLAUDE.md): game
logic in `src/engine/`, screens thin, `src/data.ts` pure content.
Every step below is refactor-only — **zero behavior change**, enforced
by the full test gate (260 unit tests incl. the balance snapshot,
11 e2e specs) plus a live browser test per step._

## Audit (what the feature sprint left behind)

1. **Interstitial flow is duplicated.** The post-victory routing
   (promotion → shop → act transition → route choice → elevator →
   floor intro) is hand-ordered in four places in `CorporateClimb.tsx`
   (`handleVictoryContinue`, `handlePerkPick`, `handleShopLeave`,
   `continueGame` resume) and they have already drifted once (act
   transitions are silently skipped on resume). One engine-level flow
   resolver should be the single source of truth.
2. **Modifier soup.** Perks and relics share most effect fields, but
   effect collection is five parallel code paths: `getPerkCombatMods`,
   `getRelicCombatMods`, `getConditionalDmgMult`, inline payout
   reducers in `getVictoryPayout`, inline price reducers in
   `shopPrice`, plus separate perk/relic loops in `getEffectivePlayer`
   and `applyPostBattlePerk`. One `collectMods(run)` should replace
   them all.
3. **Logic re-leaked into the content layer.** `data.ts` (3,071
   lines) holds `rollPerkOffer`, `rollRelicDrop`, `rollMysteryOutcome`,
   `scaleEnemyForNgPlus/Elite/Slacker`, `getVictoryPayout`,
   `getEffectivePlayer` — pure game logic that CLAUDE.md assigns to
   `src/engine/`.
4. **`data.ts` is content + logic + persistence in one 3k-line file.**
   After (3), split the content tables into `src/content/` modules
   with `data.ts` as the compatibility barrel.
5. **Save migrations are a nested call chain.** `migrateToV6(migrateToV5(
migrateToV4(...)))` × 5 branches — table-ize into a pipeline.

## Definition of done

- `CorporateClimb.tsx` contains screen wiring only; the between-floor
  routing decision lives in one engine function used by both the
  in-game flow and save resume.
- Exactly one code path collects perk+relic effects.
- `data.ts` exports content tables and content lookups only.
- The balance snapshot is byte-identical throughout (refactor proof).

## Steps

- [x] 0. Branch + this log.
- [x] 1. Engine flow resolver (`engine/flow.ts`), adopt in
     `CorporateClimb.tsx` + resume. Fixes the resume/act-transition
     drift by construction.
- [x] 2. Unified modifier collection (`engine/modifiers.ts`).
- [x] 3. Move game logic out of `data.ts` into engine modules
     (`scaling`, `economy`, `player`, offer/drop rolls).
- [x] 4. Split content tables into `src/content/`; `data.ts` becomes
     the barrel.
- [x] 5. Table-ize save migrations.
- [x] 6. Final pass: docs, dead exports, auto-review, full gate, live test, PR.

## Step log

### Step 0 — setup (done)

Branch `claude/architecture-refactor`. Hotspots measured:
`CorporateClimb.tsx` 875 lines, `data.ts` 3,071 lines, engine total
~1,500 lines across 9 modules.

### Step 1 — flow resolver (done)

`engine/flow.ts`: `nextStop(run, { actPending, eventsDone })` is now
the only place that knows the interstitial order (promotion → shop →
act transition → events → elevator → intro). `CorporateClimb.tsx`
gained one `goToStop` dispatcher (side effects: event-offer roll on
route entry, promotion fanfare suppressed on resume) and lost
`proceedToFloorEntry` / `proceedToRouteChoice` /
`proceedAfterFloorAdvance` plus the bespoke resume if-chain — net −51
lines in the component. 7 resolver tests pin the ordering, daily
events-disabled skip, and resume semantics. Gate: 267 unit / 11 e2e
green; balance snapshot untouched.

### Step 2 — unified modifiers (done)

`engine/modifiers.ts`: `collectMods(perks, relics)` folds both effect
sources into one `Mods` record. Converted every consumer — damage,
crit, lifesteal, conditional (low-HP / boss) multipliers, burn guard
in `turn.ts`; post-battle heal, event item chance, battle-opening
statuses in `run.ts`; price multipliers in `shop.ts` — and deleted
`getPerkCombatMods`, `getRelicCombatMods`, `getConditionalDmgMult`
from `data.ts`. `getVictoryPayout`/`getEffectivePlayer` still hold
their own loops in `data.ts` to avoid an engine→data→engine cycle;
they move into the engine in step 3, which closes the "exactly one
collection path" goal. Gate: 267 unit / 11 e2e green; balance
snapshot byte-identical.

### Step 3 — logic out of the content layer (done)

Four new engine modules: `scaling.ts` (NG+/elite/slacker enemy
transforms), `player.ts` (`getEffectivePlayer`, now via
`collectMods` — closing step 2's "one collection path" goal),
`economy.ts` (`getVictoryPayout`), `offers.ts` (perk offer, relic
drop, mystery rolls). `data.ts` keeps only content tables, pools, and
content lookups (`getPromotionTrack` made public for the engine).
All src + test imports rewired to `@/engine`; no compatibility
re-exports. `data.ts` 3,071 → 2,844 lines. Gate: 267 unit / 11 e2e
green; balance snapshot byte-identical.

### Step 4 — content split (done)

`src/content/` now holds eleven focused modules (constants, statuses,
type-chart, classes, perks, relics, mystery, enemies, events, items,
progress) and `data.ts` is a 16-line barrel preserving the `@/data`
import surface — zero import churn for consumers. Largest module is
`enemies.ts` (1,442 lines of pure tables). Also cleaned two latent
lint warnings (unused `MoveType` import; `ExecutiveScene`'s unused
palette param). Gate: 267 unit / 11 e2e green; snapshot byte-identical.

### Step 5 — migration pipeline (done)

`save.ts`: the five-branch nested call chain became a
`MIGRATIONS[v]` table walked by `migrateFrom(version, run)`; adding a
save version is now one table entry plus a `SAVE_VERSION` bump, and
`loadRun` never changes again. Typed per-step migrators unchanged.
All migration-path tests (v1→, v2→, v3→, v4→, v5→, v6 round-trip)
pass unchanged. Gate: 267 unit / 11 e2e green.

### Step 6 — final pass (done)

Dead legacy v1 save API (`saveGame`/`loadGame`, app-unused since the
Phase-1 engine) removed from `content/progress.ts` along with its 8
tests; CLAUDE.md architecture section updated for `engine/flow|
modifiers|player|economy|scaling|offers` and the `src/content/`
split. Live browser drive of the full refactored chain (fresh start →
class select; save → battle → victory → perk pick → shop → events →
elevator → elite intro) passed with zero page errors. Five parallel
review agents are auditing the branch diff; their confirmed findings
land as fixes before the PR.

### Auto-review outcome (5 parallel finder agents over the branch diff)

Two agents independently **proved fidelity**: the content move is a
byte-identical multiset (and an in-order subsequence) of the old
`data.ts`; `collectMods` covers every field of the five replaced
reducers with matching semantics; `nextStop` reproduces all four
legacy routing paths; the migration pipeline composes the exact same
chain.

13 findings consolidated; all fixed except two consciously declined:

- **Fixed (correctness):** loosened save-version guard now requires
  `Number.isInteger`; `elevatorPending` tolerates `mystery:
undefined` from mislabeled saves; ShopScreen now shows
  relic-discounted prices (pre-existing bug — display disagreed with
  what `buyShopItem` charged); restored boss-floor gating test
  coverage for Killer Instinct.
- **Fixed (structure):** save migrations are an array the version is
  _derived from_ (a forgotten entry can no longer silently wipe
  saves); `collectMods` is one uniform fold over the shared
  perk/relic vocabulary (a field added to either def type is picked
  up automatically); `turn.ts` folds mods once per action;
  `scaling.ts` is one parameterized transform; the dead
  `tier.statBoost` path and its type field are gone;
  elevator/mystery picks route through `goToStop` like every other
  handler; the `celebrate` flag became a return value; the
  ActTransition screen renders from run data so a flow/state desync
  can't blank-screen; `EVENT_ITEM_BASE_CHANCE` lives with the event
  content; five dangling imports removed.
- **Declined:** float-associativity rounding note (no constructible
  case; snapshot identical); persisting `actPending` into RunState
  (a save-format change isn't worth a cosmetic interstitial — the
  render-from-run fix removes the harmful failure mode).

### Definition of done — verdict

- ✅ `CorporateClimb.tsx` is screen wiring; every between-floor route
  decision (including elevator/mystery picks and save resume) goes
  through `engine/flow.ts`.
- ✅ Exactly one modifier-collection path (`collectMods`, one fold).
- ✅ `data.ts` is a 16-line barrel over `src/content/`; content
  modules hold tables and lookups only.
- ✅ Balance snapshot byte-identical across all six steps.

Final gate: 260 unit tests (one added), 0 lint warnings (was 1 on
main), 11/11 e2e, live browser drive of the full between-floor chain
clean. I'm happy with the architecture.
