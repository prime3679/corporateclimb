# Agent Guide

Start with `docs/ZERO-CONTEXT-CONTRIBUTION.md` for the canonical contribution doctrine, then read `CLAUDE.md` for the full Corporate Climb domain guide.

Instruction precedence lives in `docs/ZERO-CONTEXT-CONTRIBUTION.md` and `.agent/contribution-contract.json`. Follow that canonical list instead of restating a local variant here.

Run:

- `python3 .agent/zero_context_gate.py audit`
- `python3 .agent/zero_context_gate.py verify`

`verify` is not a sandbox. It runs trusted repo-owned argv commands with bounded timeouts, bounded output capture, closed stdin, and a minimal sanitized child environment that intentionally omits `HOME` and `USERPROFILE`.
