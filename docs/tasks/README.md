# Task briefs for coding agents

Each file is one self-contained brief a fresh agent (Cursor, Codex, Claude
Code) can execute from the worktree alone. Read `docs/LAUNCH.md` first.
Precedence: `docs/ZERO-CONTEXT-CONTRIBUTION.md` → `.agent/contribution-contract.json`
→ `CLAUDE.md` → the brief.

Run in this order; 001 must land before 004–006 mean anything.

| ID               | Brief                                                  | Role          | Blocks on                          |
| ---------------- | ------------------------------------------------------ | ------------- | ---------------------------------- |
| TASK-CLIMBER-001 | Analytics verification + Settings privacy toggle       | Astra         | `VITE_POSTHOG_KEY` set by owner    |
| TASK-CLIMBER-002 | Rename residue: og.png, splash.png, demo card, docs    | Fable         | —                                  |
| TASK-CLIMBER-003 | Classic demotion: Daily stays, tower run behind a fold | Fable + Astra | —                                  |
| TASK-CLIMBER-004 | Playtest fixes (three PRs, one per finding)            | Astra         | `docs/playtest/sessions.md` filled |
| TASK-CLIMBER-005 | Dependency + toolchain maintenance pass                | Astra         | —                                  |
| TASK-CLIMBER-006 | iOS TestFlight from the Mac Mini                       | Astra         | owner has Xcode signed in          |

Every PR body: what changed, the verification commands run, and for any
visual change the `docs/playtest/sessions.md` line or PostHog insight it
answers (`docs/LAUNCH.md` → the rule).
