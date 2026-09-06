# Office RPG — iteration roadmap (5 floors)

Operating loop for Corporate Climb Office. Five floors, leave ~2026-09-25.
Design freeze and engine contracts stay in the companion docs; this file is
how Fable, Astra, and CoS ship the stack without growing the building.

Companion reading: `docs/rpg/architecture.md` (ownership),
`docs/rpg/fidelity-bar.md` (art bar), `docs/rpg/floor-3-5-engine-hooks.md`
(tip contract).

## Roles

- **Fable:** design, art, dialogue, map fidelity
- **Astra:** engine, reducers, combat, save, elevator, tests
- **CoS (Adrian's Chief of Staff):** playtest bar, cross-review orchestration, merge when bar met

Astra does not merge. Fable does not invent a second combat engine. CoS does
not waive a cold playtest.

## Cross-review loop (every floor / every stack)

1. Author opens a draft PR.
2. The other specialist posts **Must-fix / Should-fix / Nice later** in the same cycle.
3. CoS cold playtests the tip (fresh save, full 1→5 route, save/load, backtrack).
4. Must-fix cleared → CoS squash-merges in stack order.
5. Should-fix become the next pass ticket; Nice later go to the backlog.

Do not merge a draft that skipped step 3.

## Pass ladder (repeat until leave ~2026-09-25)

- **Pass A — Route clear:** no softlock, badges gate correctly, 1→5 climb + celebration
- **Pass B — Fidelity:** doors readable, contrast, actor sheets, props/states, no stub copy
- **Pass C — Feel:** objective pins, elevator UX, combat pacing, recruit/roster, SFX/light pools
- **Pass D — Depth:** optional side POIs, balance, Classic untouched, polish celebrations

A pass is done when CoS’s cold playtest of that pass’s bar is green. Do not
skip A to chase D.

## Current stack (as of 2026-09-06)

Tip `main` includes Pass D `#91` and demo `#90` (`9d352b6`). Pass E (Astra)
stacks on that tip: dedicated F3/F4 beds and combat duck. Visual Should-fix
(glass / hall contrast) is a separate Fable lane. Do not remount the closed
`#72`–`#78` stack. Do not add a Floor 6.

## Immediate next (after tip playtest)

Placeholders for the first cross-review comments. Fill them against `main`;
do not treat this list as already triaged.

**Must-fix (Pass A)**

- [ ] Fresh-save required route 1→5: printer → Holloway → Teddy packet → Kessler → Sloane/Nico → Quincy → Harper/Reyes → Ashford → Marlowe → Caldwell → `screen_floor5_complete`. No softlock.
- [ ] Badge gates: Floor 2 needs `key_access_badge`; Floors 3–5 need `key_employee_badge`. Do not tighten 4/5 to product/client until Adrian says so.
- [ ] Floor 5 win and the post-climb Exec row open the celebration, not a sixth floor.
- [ ] Save/load on each floor; backtrack 5→1; loss respawn `(5,12)` north. Classic `corporate-climb-save` never bleeds.
- [ ] Caldwell phase 2 at ≤ 130 HP. Classic `simulation.test.ts` still bit-identical.

**Should-fix (Pass B / C)**

- [x] Glass at `(6,3)` / `(14,3)` reads as openings; Product / Sales / Exec contrast vs hall.
- [x] Actor sheets + Headshot portraits for F3–5 cast; no leftover stub copy (`poi_directory_sign_stub`, `STUB_DIRECTORY_TEXT` on live maps).
- [ ] `currentObjective` F5→F4→F3→F2→F1; cross-floor pins on the current elevator doors.
- [ ] Elevator: current floor inert (“You are here”); locked row beeps and stays open; ride 2→3→4→5 and 5→1.
- [ ] Combat pacing + perk offers on F3–5 bosses; roster stays 3 (no new `cw_*`); light pools per floor.
- [x] Office audio (title / F1–F5 beds + cab + CLEARED/THE NOD + combat hit/win + combat duck) — `docs/rpg/office-audio.md`.

**Nice later (Pass D)**

- [x] Optional side POIs, per-floor vending stock, ledger polish (54 / 64 / 78).
- [x] F3–5 Headshot portraits shipped (Sloane / Nico / Quincy / Harper / Reyes / Ashford / Marlowe / Caldwell). Floor 1–2 house portraits already unique. §12 / §13 / §19 device sign-off still open.

## Do not

- Grow past 5 floors without Adrian
- Lower the fidelity bar
- Merge drafts without CoS playtest
