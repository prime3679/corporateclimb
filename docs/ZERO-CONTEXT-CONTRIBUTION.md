# Zero-Context Contribution

Corporate Climb must be understandable to a fresh coding agent from this worktree alone. Hidden chat context can explain why work is needed, but it must not be required to discover repo rules, domain boundaries, verification commands, review standards, or escalation conditions.

## Source of truth

Use this precedence order when instructions overlap:

1. `docs/ZERO-CONTEXT-CONTRIBUTION.md` — canonical zero-context doctrine
2. `.agent/contribution-contract.json` — machine-readable contract and exact verification commands
3. `CLAUDE.md` — deep Corporate Climb domain guidance
4. `AGENTS.md` — quick-start pointer for fresh agents
5. `REVIEW.md` — findings-first review rules
6. `README.md` — project map and contribution-path discoverability

If an important rule only exists in chat, the repo is missing source of truth. Promote it into these files instead of relying on memory.

## Boundaries

- Preserve the existing engine/presentation split from `CLAUDE.md`: game logic belongs in `src/engine/` or `src/battle.ts`, while screens and UI stay thin.
- Do not change gameplay, balance, UI, assets, dependencies, lockfiles, CI or deploy config, auth, services, or Vercel state as part of zero-context contribution work.
- Save changes are versioned. Any new persisted run state must add a migration entry in `src/engine/save.ts`; never introduce a breaking save-format change.
- Deterministic gameplay paths must stay deterministic. Engine RNG is always injected, dailies remain seeded, `Re-Org 0` stays a strict identity for the balance table, and daily runs remain pinned to ascension 0.
- `verify` is defense-in-depth, not a sandbox. It executes trusted repo-owned argv-array commands with a minimal sanitized environment, closed stdin, bounded timeouts, and bounded output capture.
- Contract commands must stay argv arrays only. No shell-inline execution, no inline code snippets, no setup or install steps, no bootstrap or deploy commands, and no network fetchers.
- Portable committed files must stay free of local absolute paths, credentials, channel IDs, and runtime output.

## Prerequisites

- `python3` must be available on `PATH` to run the local gate.
- Use installed dependencies only. Do not run package installation from this workflow.
- If this worktree lacks `node_modules` but `/Users/adrian/corporateclimb/node_modules` exists, create a temporary untracked symlink for verification and remove it before commit.

## Standard workflow

1. Read this file, then `.agent/contribution-contract.json`, then `CLAUDE.md`.
2. Run the static audit:

```bash
python3 .agent/zero_context_gate.py audit
```

3. Make the smallest change that keeps doctrine, contract, tests, and root docs aligned.
4. Run explicit verification:

```bash
python3 .agent/zero_context_gate.py verify
```

5. Run existing deterministic checks when the task touches gate, doctrine, or engine-adjacent verification assumptions.
6. Finish with `git diff --check` and `gitleaks`.

## Exact verification commands

The contract verify step must stay aligned with existing CI:

```bash
npm run lint
npm run format:check
npm run build
npm test
npm run test:smoke
```

Use the gate to run these commands from `.agent/contribution-contract.json`. Do not add install, bootstrap, preview, or deploy commands to the contract.

## Review-to-infrastructure classification

- One-off judgment stays in the review.
- Repeatable defect becomes a test, lint rule, or CI gate.
- Missing domain knowledge becomes canonical documentation or a reusable skill.
- Agent behavior failure becomes an operating eval.

## Escalate immediately if

- `CLAUDE.md`, repo code, and zero-context doctrine conflict in a way that requires product or gameplay changes to reconcile.
- Verification requires installs, secrets, unavailable Playwright browsers, or deployment state.
- Any requested action would touch Vercel, a live/public surface, auth, or other mutable external state.
- The worktree is unexpectedly dirty in files relevant to this task and the overlap cannot be resolved safely.

## Done bar

- `audit` passes.
- `verify` passes or any unmet command is called out explicitly with evidence.
- Root docs stay concise and point to `CLAUDE.md` instead of duplicating it.
- The contract names the canonical doctrine, required files, review classification, boundaries, and exact verification commands.
- A fresh agent can identify the repo boundaries, review rules, escalation conditions, and verification path from repo files alone.
