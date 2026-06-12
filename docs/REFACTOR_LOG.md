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
- [ ] 1. Engine flow resolver (`engine/flow.ts`), adopt in
     `CorporateClimb.tsx` + resume. Fixes the resume/act-transition
     drift by construction.
- [ ] 2. Unified modifier collection (`engine/modifiers.ts`).
- [ ] 3. Move game logic out of `data.ts` into engine modules
     (`scaling`, `economy`, `player`, offer/drop rolls).
- [ ] 4. Split content tables into `src/content/`; `data.ts` becomes
     the barrel.
- [ ] 5. Table-ize save migrations.
- [ ] 6. Final pass: docs, dead exports, full gate, live test, PR.

## Step log

### Step 0 — setup (done)

Branch `claude/architecture-refactor`. Hotspots measured:
`CorporateClimb.tsx` 875 lines, `data.ts` 3,071 lines, engine total
~1,500 lines across 9 modules.
