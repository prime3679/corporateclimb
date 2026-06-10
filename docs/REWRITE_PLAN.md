# Corporate Climb — Codebase Audit & Rewrite Plan

_Audited 2026-06-10 at commit `fa6c97d`. All 96 unit tests pass, e2e suite exists,
production build is clean (81 KB gzipped JS). This document records what's wrong,
what's worth keeping, and the phased plan to rewrite the experience._

---

## Part 1 — Audit

### What's actually good (keep it)

- **Content layer** (`data.ts`, 2,469 lines): 30 floors with variant pools, 3 classes
  with promotion tracks, hallway events, items, achievements, phase-2 bosses. The
  _content_ is the product; none of it needs rewriting, only re-typing.
- **Pure battle math** (`battle.ts`): damage formula, status modifiers, and enemy AI
  already extracted with an injected RNG. Unit-tested.
- **Daily challenge** (`daily.ts`): proper Mulberry32 seeded RNG, deterministic
  floor maps and modifiers, local result persistence.
- **Test infrastructure**: vitest unit tests, 7 Playwright e2e specs, CI with
  lint + format gates.
- **Performance**: tiny bundle, optimized WebP sprites, sprite preloading.

### Critical architecture problems

#### A1. God component (`CorporateClimb.tsx`, 1,430 lines)

The entire game lives in one component holding **~35 separate `useState` hooks**
(playerHp, enemyHp, turn, xp, level, atkBuff, defBuff, statuses ×2, inventory,
ngPlus, dailyMode, …). Because handlers like `doEnemyTurn` are `useCallback([])`,
every one would see stale state, so the component maintains a **manually-synced
mirror of all state in a ref** (`gsRef`, lines 267–304) with two
`eslint-disable react-hooks/exhaustive-deps` escapes. This is the root cause of
the three battle-orchestration bugs and the daily-RNG stale-closure bug already
fixed in git history — the architecture _manufactures_ this bug class.

#### A2. Battle flow is `setTimeout` choreography

A single player turn chains **6+ nested timeouts** with magic delays (300, 350,
400, 500, 600, 800, 1000, 1500 ms) across `doPlayerMove` → phase-2 check → burn
check → `doEnemyTurn` → faint → game over. Consequences:

- Timing is untestable (the e2e suite has to literally wait out animations).
- No timers are cancelled on unmount/restart; a restart mid-animation can fire
  callbacks into the next run's state.
- The player can't skip or fast-forward anything — battle pacing is locked.
- Win/lose edge cases (burn kills, phase-2 at 0 HP) each need bespoke ordering
  fixes, as the comments in the file admit.

#### A3. No single game-state model

- `turn` is a stringly-typed `'player' | 'waiting'` (declared as `string`).
- Save/load manually enumerates 17 fields; daily mode is a parallel universe of
  booleans + `dailyRngRef` + `dailyFloorMap` that must be manually kept in sync
  (the code comments document past desyncs).
- The current enemy is **derived in render** through a 4-step pipeline (variant
  pool → NG+ scaling → daily multipliers → phase-2 overrides), then _re-derived
  by hand_ inside `doPlayerMove` for the phase-2 threshold check — duplicated
  logic that has already drifted once.

#### A4. Logic leaks out of the pure layer

- The Engineer damage multiplier is applied _outside_ `calcDamage`; Struggle
  recoil is applied in the component; item effects and event effects are
  interpreted inline in the component rather than by the engine.
- `pickTwoEvents` shuffles with `array.sort(() => rng() - 0.5)` — a biased,
  implementation-dependent shuffle (and there's a correct Fisher-Yates sitting
  in `daily.ts`).
- `handleEventChoice` clamps healing to `maxHp + atkBuff * 5` — ATK buffs
  silently raise the HP cap, which looks like a long-lived bug.
- The 30%-chance event item reward is added silently; the comment claims the
  event screen surfaces it, but nothing does — the player just mysteriously
  gains an item.

### Critical presentation problems (the "amateur feel")

#### P1. No styling system at all

**Hundreds of inline `style={{}}` objects** (36 in WinScreen alone), a global
stylesheet embedded as a template string inside the component's JSX, the Google
Font injected via a `<link>` rendered in the component tree, and the literal
string `"'Press Start 2P'"` hard-coded in **21 files**. Color palettes are
ad-hoc hex values per screen — BattleScreen carries a 120-line inline palette
table. There are no tokens, no shared button/panel components (each screen
re-implements the bordered-button-with-hard-shadow by hand, with slightly
different radii, borders, and shadows each time). This inconsistency is the
single biggest contributor to the amateur feel.

#### P2. Typography is illegible

Press Start 2P is used for _everything_ — including body copy at **5–9 px**
(type badges render at `fontSize: 5`). Pixel display fonts are for headlines;
at these sizes the game is genuinely hard to read and fails any accessibility
bar.

#### P3. Fixed-size letterboxed viewport

The game is a hard-coded `420 × 750` box centered on black. On desktop it's a
small phone-shaped strip in a void; on small/large phones it letterboxes
instead of scaling. The `index.html` claims landscape orientation; the layout
is portrait-only.

#### P4. Zero accessibility

No keyboard controls, no focus management, no ARIA, `user-select: none` +
`touch-action: none` globally, no `prefers-reduced-motion` handling, sub-9px
text. The game is mouse/touch-only and screen-reader-invisible.

#### P5. Inconsistent art direction

Three visual languages collide: AI-generated semi-realistic WebP character
sprites, raw emoji for items/events/achievements/UI icons, and flat-color CSS
rectangles for environments. Meanwhile a **full set of purpose-made SVG assets
ships dead in the repo** — every file in `src/assets/items/`, `src/assets/ui/`,
8 NPC SVGs, and 9 player skin-tone variants have _zero references_ in code.
`assets/generated/` (a PNG + prompts.json) is also dead weight in git.

#### P6. UX gaps

- Battle log shows only the last 2 lines; no tap-to-advance, no history.
- No move tooltips/details before committing (type effectiveness is
  discoverable only by trial).
- Item gain/loss outside battle is never announced (see A4).
- No settings beyond a mute toggle (no SFX/music split, no text-speed).
- No pause/confirm when abandoning a run; "NEW GAME" silently clears the save.

### Minor code-quality findings

- `Move.type` is `string` while `EnemyMove.type` is `MoveType`; class ids,
  sprite ids, and event ids are all bare `string` — typos compile fine.
  `TYPE_COLORS`/`TYPE_LABELS` are `Record<string, …>`.
- `PixelSprite` exports a fake hook (`useSpriteUrls`) that returns a module
  constant.
- `popupIdCounter` is module-global mutable state; SFX/Music are module
  singletons with internal mutable state — fine for one instance, but untestable.
- Dead file: `src/screens/WinScreen.tsx` and `VictoryScreen.tsx` overlap in
  naming (win vs victory) — confusing module taxonomy.
- `vite.config.ts` / `tsconfig` are fine; no path aliases, so imports are all
  relative.

---

## Part 2 — Rewrite approach

**Recommendation: incremental rewrite in place ("strangler" style), not a
greenfield repo.** The content tables, battle math, daily system, and the
entire test suite are assets we keep; the React shell and presentation layer
are what get replaced. Each phase lands as a PR with the e2e suite green, so
the game is shippable at every step.

Stack stays **Vite + React 18 + TypeScript** — the problems are architectural,
not framework-level. Two small additions: **Zustand** (or `useReducer` +
context) for the store, and **CSS Modules with a token file** (no runtime CSS
lib needed at this scale).

### Phase 1 — Game engine: state machine + effect sequencer (the foundation)

Replace the 35-hook god component with a real engine:

1. **Single `GameState` model** — one discriminated-union state tree:

   ```ts
   interface RunState {
     mode: { kind: 'normal' } | { kind: 'daily'; seed: number; modifier: DailyModifierContext }
     classId: ClassId
     floor: number
     level: number; xp: number; xpToNext: number
     hp: number; pp: number[]
     buffs: { atk: number; def: number }
     inventory: ItemId[]
     floorEnemyIds: EnemyId[]
     ngPlus: number
     stats: RunStats          // turns, damage, itemsUsed
     usedEvents: string[]
     rngState: number         // serialized — daily and normal use the same pipeline
   }

   type BattleState =
     | { phase: 'intro' }
     | { phase: 'playerTurn' }
     | { phase: 'resolving'; queue: BattleEvent[] }
     | { phase: 'phaseTransition'; ... }
     | { phase: 'won' } | { phase: 'lost' }
   ```

   Daily mode stops being a parallel set of booleans/refs — it's a config on
   the same run pipeline, and the RNG lives _in_ the state (serializable, so a
   daily run can even be resumed).

2. **Pure reducer that returns effects, not timeouts.**
   `resolveTurn(state, action, rng) → { state, events: BattleEvent[] }` where
   `BattleEvent` is declarative data:

   ```ts
   type BattleEvent =
     | { t: 'attack'; actor: Side; move: string }
     | { t: 'damage'; target: Side; amount: number; crit: boolean; eff: 'super' | 'weak' | null }
     | { t: 'status'; target: Side; status: StatusId }
     | { t: 'burnTick'; target: Side; amount: number }
     | { t: 'phase2'; taunt: string }
     | { t: 'faint'; target: Side }
     | { t: 'log'; text: string }
   ```

   The _entire_ turn — player move, burn ticks, phase-2 trigger, enemy
   response, faints — resolves synchronously into an ordered event list. Every
   ordering bug class from A2 becomes a unit test: `expect(events).toEqual([…])`.
   Golden-run tests replay a seeded full battle and snapshot the event stream.

3. **One effect sequencer in the UI layer** plays the event queue: each event
   maps to `{ animation, sfx, duration }` in a single timing table. The
   sequencer is awaitable, cancellable on unmount, and **skippable** — tap to
   fast-forward, which is currently impossible. All magic delays live in one
   place and become tunable.

4. **Engine absorbs the leaked logic**: perk multipliers and recoil move into
   `calcDamage`/`resolveTurn`; item use and event choices become engine
   actions; `pickTwoEvents` uses the existing Fisher-Yates; the
   `maxHp + atkBuff*5` clamp bug dies; event item rewards become an explicit
   event the UI announces.

5. **Versioned save schema**: `{ version: 2, state: RunState }`, validated on
   load with a migration from the v1 shape, replacing the 17-field manual
   enumeration.

### Phase 2 — Presentation system (kills the amateur feel)

1. **Design tokens** (`src/ui/tokens.css`): one palette (per-act themes as CSS
   custom-property overrides, replacing BattleScreen's inline table), a 4-step
   type scale, spacing, border/shadow language. The hard-shadow "chunky button"
   is fine as a _style_ — it just needs to be defined once.
2. **Typography**: Press Start 2P demoted to headlines/logo only. Body text
   moves to a legible pixel-adjacent font (e.g. **VT323 at 16–18 px** or system
   mono), minimum 12 px anywhere. Self-host both fonts (drop the runtime
   Google Fonts `<link>`).
3. **Component library** (`src/ui/`): `Button`, `Panel`, `Meter` (HP/XP),
   `Badge`, `Sprite`, `Dialog` — CSS Modules, every screen consumes them.
   Screens shrink to layout + copy; the per-screen reimplementations go away.
4. **Responsive stage**: a single `<Stage>` component that scales the 420×750
   design space with `transform: scale()` to fit any viewport (integer-ish
   scaling, centered, themed backdrop instead of black void). Desktop gets a
   real presentation instead of a letterboxed strip.
5. **Accessibility pass**: all interactive elements become real focusable
   buttons with visible focus rings; arrow-key/1-4 hotkeys for moves;
   `prefers-reduced-motion` disables shake/flash; ARIA live region mirrors the
   battle log; remove global `user-select: none` outside the stage.

### Phase 3 — Game feel & content polish

1. **Battle UX**: tap-to-advance text box with full scrollback; move buttons
   show type-effectiveness hints against the current enemy after first
   encounter; damage numbers and HP bars animate from the same sequencer
   (hit-stop on crits, eased HP drain).
2. **Art direction decision** — pick one language and commit. Recommended:
   keep the WebP character set, replace raw-emoji items/UI with the existing
   purpose-made SVGs (they're already drawn and shipping dead — wire them up),
   and upgrade act backdrops from flat gradients to 2–3 layered parallax
   scenes per act.
3. **Audio**: keep the procedural chiptune engine (it's genuinely good), add
   separate music/SFX volume settings persisted with the save, and a
   settings panel (text speed, reduced motion, volumes).
4. **Run safety**: confirm dialog before NEW GAME overwrites a save; run
   summary screen (turns, damage, items, route taken) feeding the share card.

### Phase 4 — Hardening

1. **Type tightening**: `ClassId`/`EnemyId`/`SpriteId` unions, `MoveType` on
   `Move`, `Record<MoveType, …>` for color/label maps; a vitest suite that
   validates the whole content table (every sprite id resolves, every status
   id exists, every promotion references a real move name).
2. **Deterministic simulation tests**: seeded full-run simulations through the
   Phase-1 engine (no DOM) asserting winnability bounds and score invariants —
   balance changes become reviewable diffs.
3. **E2E gets faster**: with a skippable sequencer, Playwright drives
   "instant" text speed and stops sleeping through animations.
4. **Repo hygiene**: delete `assets/generated/`, `assets/character-reference.jpg`,
   and any SVGs still unused after Phase 3; add path aliases (`@/ui`, `@/engine`);
   rename the `WinScreen`/`VictoryScreen` pair (`RunCompleteScreen` /
   `BattleVictoryScreen`).

### Sequencing & risk

| Phase            | Scope                                       | Risk                                                       | Payoff                                                                          |
| ---------------- | ------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1 — Engine       | `engine/` module + slim container component | Medium (touches everything, but golden tests pin behavior) | Eliminates the whole stale-closure/timing bug class; unblocks every later phase |
| 2 — Presentation | tokens + UI kit + screen migration          | Low (visual, e2e-verified)                                 | The visible "this looks professional" jump                                      |
| 3 — Game feel    | sequencer-driven juice, art, settings       | Low                                                        | The "this _feels_ good" jump                                                    |
| 4 — Hardening    | types, sim tests, cleanup                   | Low                                                        | Keeps it that way                                                               |

Phase 1 must land first — every presentation improvement (skippable text,
animation timing, settings) depends on the engine owning the timeline instead
of `setTimeout` chains. Phases 2 and 3 can overlap once 1 is in. Each phase is
a reviewable PR with the existing unit + e2e suites green throughout.
