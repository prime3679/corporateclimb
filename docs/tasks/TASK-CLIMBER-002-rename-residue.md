# TASK-CLIMBER-002 — Rename residue (Corporate Climber)

Owner role: Fable. Scope: generated art and demo; docs wording.

## Context

Display strings were renamed to "Corporate Climber" on the `climber-launch`
branch (`docs/LAUNCH.md` → Decisions). Three generated assets still show
the old wordmark, and `docs/rpg/*` still say "Corporate Climb".

## Do

1. `node scripts/gen-og.mjs` → `public/og.png` reads CORPORATE CLIMBER.
   Keep 1280×720 and the three-workers-plus-ladder composition;
   `src/__tests__/public-share.test.ts` pins alt/description copy — update
   the alt only if the card copy changed.
2. `node scripts/gen-splash.mjs` → `resources/splash.png`. Run
   `npm test -- boot-splash` — the PNG decode guard must stay green (hero
   inside the portrait crop, background `#12141a`).
3. `scripts/office-demo.mjs` title card already says CORPORATE CLIMBER;
   do **not** re-record `public/demos/office-demo.mp4` in this PR
   (`docs/rpg/iteration-roadmap.md` → demo remux is its own PR). Open a
   follow-up ticket instead.
4. `docs/rpg/*.md`: replace "Corporate Climb" → "Corporate Climber" in
   prose only. Leave code identifiers, storage keys, file names and the
   `corporate-climb-*` save keys untouched (grep `-save` before/after: zero diff).
5. Home-screen: confirm `manifest.webmanifest` `short_name` is `Corp Climber`
   and `src/__tests__/app-name.test.ts` passes (12-char cap).

## Verify

`python3 .agent/zero_context_gate.py verify`; attach before/after of og.png
and splash.png in the PR.
