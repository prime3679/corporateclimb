# TASK-CLIMBER-004 — Playtest fixes

Owner role: Astra (Fable reviews). Blocks on `docs/playtest/sessions.md`
having five filled blocks.

## Do

1. Read all five sessions. Tally every "Wait / huh" and "Looked at me"
   line by how many people hit it. Post the tally as the first comment on
   the tracking issue.
2. Open **one PR per finding** for the top three only. Each PR body links
   the exact `sessions.md` anchor(s). Prefer the smallest fix that removes
   the hesitation (a coach mark, a copy change, a bigger tap target) over
   a redesign.
3. Anything below the top three goes in the issue as "waits for PostHog",
   not in a PR.

## Verify

`python3 .agent/zero_context_gate.py verify` per PR; a re-test with one of
the original five people if the fix is on the first three minutes.
