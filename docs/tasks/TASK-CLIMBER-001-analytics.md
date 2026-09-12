# TASK-CLIMBER-001 — Analytics verification + privacy toggle

Owner role: Astra. Scope: `src/analytics.ts`, `src/screens/office/analytics.ts`,
`src/components/SettingsPanel.tsx`, `src/settings.ts`, tests.

## Context

`src/analytics.ts` is a dependency-free PostHog adapter, no-op without
`VITE_POSTHOG_KEY`. Wiring already exists at: screen transitions
(`CorporateClimb.tsx` → `trackScreenChange`), Office battle/floor events
(`OfficeScreen.tsx` → `trackOfficeTransition`), share, install, and the
three crash paths. `src/__tests__/analytics.test.ts` pins the contract.

## Do

1. ~~Settings toggle~~ — done on `climber-launch`: `settings.analytics`
   (default on, missing key → on), the "Share anonymous play stats" row in
   `SettingsPanel`, boot honour in `main.tsx`, effect re-apply in
   `CorporateClimb.tsx`. Verify it in the e2e step below.
2. In `trackOfficeTransition`, add `office_floor_cleared` → also fire
   `run_end { mode: 'office', screen }` when `screen === 'screen_floor5_complete'`
   so the funnel's last step matches Classic's.
3. Extend `analytics.test.ts`: toggle off → no fetch; Office transition
   fixture (`initialOfficeState` → battle → won → celebration) emits
   exactly `office_fight_start`, `office_fight_won`, `office_floor_cleared`.
4. Add an e2e assertion in `e2e/smoke.spec.ts`: with no key, zero requests
   to `*.posthog.com` during a title → class-select → floor-intro walk.
   (Playwright `page.on('request')`.)
5. Do not add the `posthog-js` package. Do not change `package-lock.json`.

## Verify

- `python3 .agent/zero_context_gate.py verify`
- Production build with `VITE_POSTHOG_KEY=phc_test npm run build`, then
  `npm run preview` and confirm one POST to `/i/v0/e/` per screen change
  in devtools. Remove the key afterwards.

## Done when

The Settings toggle exists, the no-op default is tested end-to-end, and
the PR body pastes the devtools request body of one `office_fight_won`.
