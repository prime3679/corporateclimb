# TASK-CLIMBER-005 — Dependency and toolchain maintenance

Owner role: Astra. Scope: `package.json`, `package-lock.json`, CI config.

## Context

`docs/SHIP-READINESS.md` (PR #134): 0 production advisories, 14
dev/tooling findings (8 high, 4 moderate, 2 low). Deliberately left
untouched in that PR.

## Do

1. `npm audit --omit=prod` → list findings with the package path.
2. Bump only dev/tooling packages, compatible versions first
   (`npm update`), majors one at a time with the full gate between each.
3. Node 20 in CI: check whether Vite 7 / Vitest 4 / Playwright 1.49 have
   moved their floor; if Node 22 is required, change `setup-node` and
   note it in `CLAUDE.md`.
4. Remove `public/demos/office-demo.mp4` (14 MB) from the deploy: move it
   to a GitHub release asset or Vercel Blob and link from `about.html`.
   The SW precache must not have been including it — confirm with the
   build's printed entry count.

## Verify

`python3 .agent/zero_context_gate.py verify`; `npm audit --omit=prod` in
the PR body before/after; production build size before/after.

## Not in scope

React 19, Capacitor majors, any runtime dependency.
