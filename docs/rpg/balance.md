# The Office — Balance (Floor 1 MVP)

_Status: number contract for the Floor 1 preview. Content IDs are frozen in
`docs/rpg/mvp-design.md` §15. Classic `applyVictory` / `ENEMY_POOLS` /
`BASE_PERK_POOL` are not retuned here._

---

## 1. Floor ledger (`rwd_*`) — max 65

Celebration **Options earned** is the sum of claimed `rwd_*` rows only.
Recruiting pays nothing. The Signing Bonus perk is not a ledger row.

| Ledger id                   | Options | XP  | When                                  | Receipt                          |
| --------------------------- | ------- | --- | ------------------------------------- | -------------------------------- |
| `rwd_start_options`         | +10     | —   | New campaign created                  | `SIGNING BONUS`                  |
| `rwd_asg_printer`           | +10     | —   | Renata closes the printer ticket      | `TICKET #0001 CLOSED`            |
| `rwd_enc_desk_challenger`   | +8      | +15 | Gavin won                             | `DESK-PIT ARGUMENT — WON`        |
| `rwd_asg_meeting_prep`      | +6      | —   | Correct handout delivered to Priya    | `THE 10:30 — PREPPED`            |
| `rwd_enc_meeting_prepper`   | +11     | +22 | Priya won                             | `PRE-MEETING SPAR — WON`         |
| `rwd_enc_supervisor_1on1`   | +20     | +30 | Holloway won                          | `ONE-ON-ONE — SURVIVED`          |
| `rwd_promotion_f1`          | 0       | —   | Perk offer rolled (once); not Options | — (promotion screen is the beat) |
| **Required route subtotal** | **48**  | 45  | start + printer + Gavin + Holloway    |                                  |
| **Full-floor maximum**      | **65**  | 67  | + meeting + Priya                     |                                  |

Each id is claimable once. A re-talk after a payout shows no receipt.

## 2. Post-promotion Signing Bonus (not a ledger row)

`BASE_PERK_POOL` is unchanged. `signing_bonus` still grants `instantOptions: 60`
through `choosePerk`. After that pick the office shows a separate receipt
`rcpt_promotion_signing_bonus` (+60). That amount is **not** added to
`rewardsClaimed` as a `rwd_*` and is **not** counted in celebration Options
earned. The wallet may therefore read 108 (65 + 60) or 48 + 60 on the required
route; the celebration chip still reads 65 / 48.

## 3. Encounter kits (explicit payouts, never `applyVictory`)

| Encounter             | Rank | HP  | ATK | DEF | XP  | OPT | Flee / decline      |
| --------------------- | ---- | --- | --- | --- | --- | --- | ------------------- |
| `enc_desk_challenger` | 0    | 70  | 8   | 6   | 15  | 8   | declinable          |
| `enc_meeting_prepper` | 1    | 85  | 11  | 7   | 22  | 11  | declinable          |
| `enc_supervisor_1on1` | 2    | 130 | 14  | 9   | 30  | 20  | no flee, no decline |

`Enemy.floor` holds rank. Legacy AI only. No phase 2. Level bonuses are the
existing `turn.ts` team-level mods (+2 ATK / +1 DEF per `RunState.level`).

## 4. Recruit kits

| Def                  | HP  | ATK | DEF | SPD | Role                |
| -------------------- | --- | --- | --- | --- | ------------------- |
| `cw_desk_challenger` | 70  | 10  | 8   | 10  | Debuff + soak       |
| `cw_meeting_prepper` | 80  | 11  | 9   | 10  | Debuff + small heal |

Recruits enter at full HP/PP. Level-up heal (+20) applies to every standing
member. Post-battle heals apply to the member active at the end. A wipe
restores the whole party at the break room; the encounter stays `open`.

## 5. Vending (act-1 prices)

| Item          | Price | Stock |
| ------------- | ----- | ----- |
| `espresso`    | 14    | 2     |
| `side_hustle` | 28    | 1     |

`shopPrice` at floor 0 (×1). Stock lives on `run.shopStock` and does not
restock. Wellness Day is not offered.

## 6. Team XP

Same curve as the tower (`xpToNext` starts at 30, +25 per level). Required
route: Gavin +15 → 15/30; Holloway +30 → level 2 (15 remaining if Priya was
skipped). Full route: Priya +22 first, so Holloway lands at 37/55 with no
second level-up.
