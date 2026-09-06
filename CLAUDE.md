# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

Corporate Climb — a browser-based pixel-art RPG (React 18 + TypeScript + Vite) where you battle
up 30 floors of corporate bosses. Deployed on Vercel; pushing to `main` deploys automatically.

## Commands

```bash
npm run dev           # dev server at http://localhost:5173
npm test              # unit tests (vitest, jsdom)
npm run test:smoke    # Playwright e2e (spins up dev server itself)
npm run lint          # ESLint (flat config, src/ only)
npm run format:check  # Prettier check (CI enforces this)
npm run build         # tsc type-check + Vite production build
```

CI (`.github/workflows/smoke-tests.yml`) runs unit tests, lint, format check, build, and the
Playwright smoke suite on every PR — keep all five green.

## Architecture

The game follows a strict engine/presentation split (see `docs/REWRITE_PLAN.md` for history
and the remaining roadmap):

- `src/engine/` — pure game logic. `state.ts` holds the canonical `RunState`/`BattleState`;
  `turn.ts` resolves a full turn into an ordered event list (no timers, no React);
  `run.ts` handles floor/promotion/elevator/treasure transitions and `flow.ts` is the single
  between-floor router (used by gameplay and save resume alike — treasure cache, then
  promotion → shop → act → events → elevator → intro); `modifiers.ts` is the one
  place perk+relic effects are collected and `ascension.ts` folds the Re-Org difficulty
  tiers the same way (level 0 must stay a strict identity — that's what keeps the balance
  snapshot stable); `player.ts`/`economy.ts`/`scaling.ts`/`offers.ts`
  hold effective stats, payouts, enemy transforms, and seeded reward rolls; `shop.ts` is the
  mid-act Stock Option shop; `save.ts` is the versioned save (v8, migrated via a pipeline
  table — add an entry; `SAVE_VERSION` is derived from the table); `events.ts` defines the
  battle event vocabulary.
- `src/battle.ts` — pure combat math (damage, type effectiveness, status). RNG is always
  injected, never `Math.random()` inline, so dailies stay deterministic.
- `src/sequencer.ts` — plays engine event lists back as timed view mutations; cancellable
  and skippable. `src/CorporateClimb.tsx` is the orchestrating component that owns state
  and screen flow.
- `src/screens/` — one component per screen (title, battle, hallway, promotion, …).
- `src/components/` + `src/ui/` — reusable pieces; `ui/tokens.css` is the single source of
  design tokens (colors, type scale, shadows). Prefer CSS modules + tokens over new inline
  styles.
- `src/content/` — all game content, one module per table (classes, enemies, items, perks,
  relics, mystery, treasure, events, statuses, type chart, achievements/progress, ascension).
  `src/data.ts` is the barrel that preserves the `@/data` import surface. Content modules
  hold tables and lookups only — game logic belongs in `src/engine/`.
- `src/daily.ts` — daily challenge seeding (Mulberry32) and result persistence. Dailies are
  pinned to Re-Org 0 and the legacy enemy AI so seeded runs stay deterministic and share
  grids comparable — the smart AI (`chooseEnemyMoveSmart`) is only reachable at ascension 3+.
- `src/platform/` — framework-free native-capability adapters (haptics, wake lock,
  lifecycle, install prompt, share). Nothing here may import React; the Capacitor
  store-build swap is documented in `docs/PLATFORM.md`.
- `src/history.ts` / `src/onboarding.ts` — run history + lifetime stats, and the first-run
  coach-mark / install-nudge gates (both persistence modules in the style of `daily.ts`).
- `public/sw.js` is a template: `scripts/sw-precache-plugin.ts` injects the precache
  manifest and a content-hash VERSION at build time (`npm run build` prints the entry
  count). Keep its `self.__PRECACHE = ['/']` and `const VERSION = 'dev'` placeholders
  intact.
- Office music/SFX are a second catalog on the same `Music` / `SFX` facades
  (`docs/rpg/office-audio.md`). Do not retarget Classic `CLASSIC_TRACKS` filenames;
  regenerate Office files with `python3 scripts/gen_office_audio.py`.

## Conventions

- All `localStorage` access goes through try/catch (private browsing must not crash the game).
- Game logic changes belong in `src/engine/` or `battle.ts` with unit tests in
  `src/__tests__/`; screens should stay thin.
- Character art is 512×512 WebP in `src/assets/characters/`, registered in `src/sprites.ts`.
  PNG masters live in git history (see README).
- Move/enemy types use the `MoveType` union — never bare strings.
- `src/__tests__/simulation.test.ts` snapshots the balance curve: any combat/content change
  must update that snapshot deliberately, and the winnability floor (the greedy bot clears
  ≥ 7 floors on every class/seed) must keep holding. The Re-Org guards must hold too: the
  base table stays bit-identical unless deliberately retuned, and at Re-Org 10 the greedy
  bot must never clear the tower.
- New run state needs a save migration in `src/engine/save.ts` — never a breaking change.
- Keep keyboard support working: battle moves are bound to keys 1–4, focus rings come from
  the global `:focus-visible` rule.
