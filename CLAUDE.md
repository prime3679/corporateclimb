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
  `run.ts` handles floor/XP/promotion-perk/hallway-event transitions; `shop.ts` is the
  mid-act Stock Option shop; `save.ts` is the versioned save (v5, migrates v4/v3/v2/v1);
  `events.ts` defines the battle event vocabulary.
- `src/battle.ts` — pure combat math (damage, type effectiveness, status). RNG is always
  injected, never `Math.random()` inline, so dailies stay deterministic.
- `src/sequencer.ts` — plays engine event lists back as timed view mutations; cancellable
  and skippable. `src/CorporateClimb.tsx` is the orchestrating component that owns state
  and screen flow.
- `src/screens/` — one component per screen (title, battle, hallway, promotion, …).
- `src/components/` + `src/ui/` — reusable pieces; `ui/tokens.css` is the single source of
  design tokens (colors, type scale, shadows). Prefer CSS modules + tokens over new inline
  styles.
- `src/data.ts` — all game content (classes, enemies, items, perks, relics, events, achievements).
- `src/daily.ts` — daily challenge seeding (Mulberry32) and result persistence.

## Conventions

- All `localStorage` access goes through try/catch (private browsing must not crash the game).
- Game logic changes belong in `src/engine/` or `battle.ts` with unit tests in
  `src/__tests__/`; screens should stay thin.
- Character art is 512×512 WebP in `src/assets/characters/`, registered in `src/sprites.ts`.
  PNG masters live in git history (see README).
- Move/enemy types use the `MoveType` union — never bare strings.
- `src/__tests__/simulation.test.ts` snapshots the balance curve: any combat/content change
  must update that snapshot deliberately, and the winnability floor (the greedy bot clears
  ≥ 7 floors on every class/seed) must keep holding.
- New run state needs a save migration in `src/engine/save.ts` — never a breaking change.
- Keep keyboard support working: battle moves are bound to keys 1–4, focus rings come from
  the global `:focus-visible` rule.
