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

## Current stack (as of 2026-09-08)

Tip `main` is the `#99` harness fix (`4243663`) on Pass I `#98` / Pass H
`#97` / Pass G `#95` + demo `#96`. Pass I confirmed the 15-speaker Office
Headshot roster — no extra ambient NPCs to commission. Pass J (this)
promotes the flagged visual Should residuals to Must: Kessler / Renata house
focals, Sloane chibi tie, two-cell CALDWELL plate, KESSLER plate frame
(`docs/rpg/fidelity-bar.md` → Pass J). Do not remount the closed `#72`–`#78`
stack. Do not add a Floor 6. Do not re-record the demo mp4.

## Immediate next (after tip playtest)

**Must-fix (Pass A)** — cleared by Pass G live 1→5 E2E (`#95` / `#96`)

- [x] Fresh-save required route 1→5: printer → Holloway → Teddy packet → Kessler → Sloane/Nico → Quincy → Harper/Reyes → Ashford → Marlowe → Caldwell → `screen_floor5_complete`. No softlock.
- [x] Badge gates: Floor 2 needs `key_access_badge`; Floors 3–5 need `key_employee_badge`. Do not tighten 4/5 to product/client until Adrian says so.
- [x] Floor 5 win and the post-climb Exec row open the celebration, not a sixth floor.
- [x] Save/load on each floor; backtrack 5→1; loss respawn `(5,12)` north. Classic `corporate-climb-save` never bleeds.
- [x] Caldwell phase 2 at ≤ 130 HP. Classic `simulation.test.ts` still bit-identical.

**Should-fix (Pass B / C / G)** — Pass G `#95` closed the leftover feel rows

- [x] Glass at `(6,3)` / `(14,3)` reads as openings; Product / Sales / Exec contrast vs hall.
- [x] Actor sheets + Headshot portraits for F3–5 cast; no leftover stub copy (`poi_directory_sign_stub`, `STUB_DIRECTORY_TEXT` on live maps).
- [x] `currentObjective` F5→F4→F3→F2→F1; cross-floor pins on the current elevator doors.
- [x] Elevator: current floor inert (“You are here”); locked row beeps and stays open; ride 2→3→4→5 and 5→1.
- [x] Combat pacing + perk offers on F3–5 bosses; roster stays 3 (no new `cw_*`); light pools per floor.
- [x] Office audio (title / F1–F5 beds + cab + CLEARED/THE NOD + combat hit/win + combat duck) — `docs/rpg/office-audio.md`.

**Nice later (Pass D / H / I)**

- [x] Optional side POIs, per-floor vending stock, ledger polish (54 / 64 / 78).
- [x] F3–5 Headshot portraits shipped (Sloane / Nico / Quincy / Harper / Reyes / Ashford / Marlowe / Caldwell). Floor 1–2 house portraits already unique.
- [x] Sloane Headshot crop tightened (Pass H) — hairline pin, zoom 3.38; no longer sits a hair high vs the house contract.
- [x] §12 / §13 / §19 **presentation** sign-off (Pass H). Evidence in `src/screens/office/presentation.ts` and the PR. Hardware CoS playtest remains the merge gate, not a code gap.
- [x] Extra ambient / side-cast portraits (Pass I). The 5-floor climb has exactly 15 speakers; every Headshot plate is already unique. No extra ambient NPC exists to commission (People Ops is a tray so Floor 2 never grew a fourth face). Side POIs / callouts stay inspect text — no generic Headshot. Same `sprites.ts` / `Headshot` contract.
- [x] Pass J visual residuals. F1–2 house crops framed like F3–5 (Kessler’s face was off the badge; Renata recentred), Sloane’s chibi loses the tie her portrait never had, CALDWELL nameplate spans two cells so the boardroom camera edge never slices a glyph, KESSLER plate gets its frame back. Holloway’s garbled folder text stayed outside every Headshot crop (guarded) while the plate was still Classic-shared — both the `vp` / `recruiter` crop nudges and that guard were superseded by the house-plate recast below.
- [x] Pass J house-plate recast + pose energy (`#107` / `#111`). Seven Office-only 512 plates (`renata`, `gavin`, `priya`, `holloway`, `teddy`, `whitlock`, `kessler`) on the same `sprites.ts` / `HEADSHOT_FOCALS` / `Headshot` contract as F3–5, gestured to the F3–5 bar; `SPEAKER_SPRITE`, `OFFICE_CAST_HEADSHOTS.house`, encounter / coworker kits and `SPRITE_TO_ACTOR` rekeyed to those ids. Classic `recruiter` … `vp` files bit-identical (sha256 pinned in `pass-j-visual.test.ts`). `docs/rpg/fidelity-bar.md` → Pass J house-plate recast / pose energy.
- [x] Pass J welcome: THE OFFICE is the title's hero CTA (gold `primary` / `lg`, `CAMPAIGN · FLOORS 1–5` eyebrow); Classic is a labelled `CLASSIC · 30 FLOORS` secondary row (`START CLIMB`, or `CONTINUE` + `NEW CLIMB` with a save). Daily + Codex share one row; the floating "Type matchups…" chip that sat on the stack at 760 design height is gone. Tagline/lede lean Office; the wordmark and FLOOR 30 sign are untouched. Guarded in `e2e/first-three-minutes.spec.ts`.
- [x] `sign_helpdesk` (F2) was a 35px plate in a 32px cell — same frame loss as KESSLER. Design call: neither shorter copy nor a two-cell sign — the words stack. `HELP` / `DESK` on one two-line plaque (`sign_stacked`), hung from the wall-cap line with the ticket board, full frame, same index at `(7,0)`. A two-cell sign had nowhere to hang (`(6,1)` is the glass wall, `(8–9,0)` the ticket board) and shorter copy would have dropped the words the zone chip and objectives use. The seven-glyph siblings (`FINANCE`, `MEETING`, `KITCHEN`) hung one frame column past the left edge for the same reason; `sign_room` now tightens to one-pixel margins at seven and refuses eight. Guarded in `pass-j-visual.test.ts`.

## Do not

- Grow past 5 floors without Adrian
- Lower the fidelity bar
- Merge drafts without CoS playtest
