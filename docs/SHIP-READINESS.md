# Corporate Climb — web release candidate

This pass builds on `2edd776` and [handoff #133](https://github.com/prime3679/corporateclimb/issues/133). The existing five-floor Office campaign, Classic climb, daily challenge, cast, music and night-glass presentation form a substantial playable game. The handoff already recorded successful Office climbs with all three careers. The remaining engineering work concentrated on what happens when play is interrupted and on controls that shrink on phones.

## Changes in this candidate

| Priority | Player-facing problem                                                                                       | Resolution                                                                                                                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Critical | Reloading after a boss win could lose the following promotion, badge or ending sequence.                    | Office save v3 preserves the unfinished dialogue/reward chain and elevator destination. Older saves recover unclaimed promotions without repeating XP or currency payouts.                                  |
| Critical | Keyboard shortcuts could move or attack behind Settings/Career Profile.                                     | Shared modal owns input, traps focus, isolates background controls and restores focus on close. Native sliders and buttons still work.                                                                      |
| High     | First-use offline Office could be missing maps, actors and icons.                                           | Production installation includes all 20 Office art files. The fallback shell stays paired with its installed assets.                                                                                        |
| High     | The worker could cache stale leaderboard responses or remove unrelated caches.                              | API requests bypass caching; activation deletes only obsolete Corporate Climb caches. Failed/partial asset responses are not cached.                                                                        |
| High     | Damaged saves could crash the UI; failed writes were silent.                                                | Validate run, party, inventory, continuation and daily-history data before use. Preserve invalid source data. Failed Office/Classic writes show a retryable notice. Error recovery can return to the title. |
| Polish   | Phone scaling made frequently used controls too small.                                                      | Minimum 44px rendered targets for global controls, Office movement/team/title, and key Settings controls. Browser zoom is enabled.                                                                          |
| Polish   | The sound toggle only muted music; Daily showed 30 floors; every Office promotion said “Cleared Probation.” | Master mute covers effects too, Daily shows 15 floors, and promotions reflect the earned Office milestone.                                                                                                  |

No combat balance, random-number generation, Classic save version, dependency versions or lockfile changed. Native packaging remains parked as requested in the handoff.

## Verification

The repository gate runs its normal checks with the sanitized child environment unchanged. New coverage includes interruption at each boss reward step, legacy recovery, active/benched coworkers with their actual move counts, bad data, blocked storage, modal input/focus, scaled phone targets, and a real production service-worker install/update.

- `python3 .agent/zero_context_gate.py audit`
- `python3 .agent/zero_context_gate.py verify`
- `npm run test:production` after a production build
- Fresh Office 1→5 with `PLAYTEST_ROLE` set to each career, including mid-climb resume and post-ending backtracking
- Visual inspection of desktop and 320/390/430px phone layouts, Settings, offline Office, promotions and final scenes
- Secret scan of all changed files

The full-climb runner supports all three roles through `PLAYTEST_ROLE`; the ordinary smoke suite keeps those longer runs opt-in. CI also runs the new production offline/update suite.

CI exposed an additional cold-start cache miss: a host's `Vary: Origin` header made module requests miss assets cached during installation. Static asset lookup now ignores that irrelevant variation. The offline test clears the browser HTTP cache before disconnecting, so ordinary downloaded files cannot conceal an incomplete installed-app boot.

### Results recorded on 2026-09-11

| Check                                                              | Result                                               |
| ------------------------------------------------------------------ | ---------------------------------------------------- |
| Repository audit and full sanitized verification gate              | PASS                                                 |
| Unit tests, including deterministic balance/ascension guards       | 715 passed across 58 files                           |
| Browser smoke and phone layouts                                    | 43 passed; 2 opt-in long tests skipped in this suite |
| Production offline and worker update                               | 2 passed                                             |
| Fresh Product Manager Office 1→5, resume and post-ending backtrack | PASS, 5.4 minutes                                    |
| Fresh Senior Engineer Office 1→5, resume and post-ending backtrack | PASS, 5.3 minutes; recovered from one Kessler loss   |
| Fresh UX Designer Office 1→5, resume and post-ending backtrack     | PASS, 5.0 minutes                                    |
| Secret scan                                                        | No findings in changed files                         |

The final campaign runs reported no page errors or Classic save bleed. The existing route helper retried its Floor 5 rest/elevator approach before succeeding; this is recorded separately from combat losses. Physical phones have not been checked in this session.

## Final release gates

1. **Real phones.** Walk the main route on an iPhone and an Android phone. Check taps, browser chrome, rotation, sound/mute, background/resume, installed launch and offline resume. Desktop browser emulation cannot establish these physical-device results.
2. **An unassisted first session.** Ask a few first-time players to start Office, collect toner, finish Renata's task and reach the first fight. Watch where they hesitate. Address observed confusion and missed inputs before adding more effects.
3. **Promote the verified web candidate.** Review the change and CI evidence, then merge and check the deployed build's first launch, existing-save migration, audio and offline installation.

Global leaderboards remain optional: the client already hides that section when its backing service is not provisioned. Local daily play, results and sharing remain the web release scope. Native store builds require a separate decision and physical-device work.

A fresh dependency audit found zero production-package advisories and 14 development/tooling findings (8 high, 4 moderate, 2 low). Track compatible toolchain updates as a separate reviewed maintenance pass; these counts do not establish live-site exploitability. This candidate leaves dependency versions unchanged.

The handoff's remaining art/feel ideas—confetti treatment, Headhunter/binoculars, Bag typography, shop glyph consistency and demo surround—are a subsequent polish pass informed by actual play. A large visual redesign or balance rewrite would add risk without addressing the verified release defects above.
