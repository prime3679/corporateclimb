# TASK-CLIMBER-003 — Classic demotion (Office is the hero)

Owner role: Fable (title layout, copy) + Astra (state). Scope:
`src/screens/TitleScreen.tsx`, `TitleScreen.module.css`, `e2e/first-three-minutes.spec.ts`.

## Context

`docs/LAUNCH.md`: The Office is the game. Title already leads with
THE OFFICE (Pass J welcome). Classic still gets a full labelled row plus
CONTINUE/NEW CLIMB, which reads as a second product.

## Do

1. Title layout: THE OFFICE (hero) → DAILY CHALLENGE + CODEX row → one
   quiet text link "Classic tower (30 floors)" that opens the existing
   Classic START/CONTINUE row in place (no new screen, no new state).
   Keep every existing e2e selector working; adjust the spec's visibility
   expectations only where the row is now folded.
2. If a Classic save exists, the fold opens by default so returning
   players never lose CONTINUE.
3. Copy: the title tagline stays; the Classic fold's one line is
   "The original 30-floor run. Powers the daily." Nothing else.
4. No changes to `src/engine/`, saves, or the daily seed.

## Verify

`python3 .agent/zero_context_gate.py verify`; phone 390×844 and desktop
after-shots in the PR; `e2e/first-three-minutes.spec.ts` green.

## Not in scope

Deleting Classic. That decision waits for `mode_start` data
(`docs/LAUNCH.md` → Dashboard).
