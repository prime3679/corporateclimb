# Agent Guide

Start with `docs/ZERO-CONTEXT-CONTRIBUTION.md` for the canonical contribution doctrine, then read `CLAUDE.md` for the full Corporate Climb domain guide.

Precedence order:

1. `docs/ZERO-CONTEXT-CONTRIBUTION.md`
2. `.agent/contribution-contract.json`
3. `CLAUDE.md`
4. `REVIEW.md`
5. `README.md`

Run:

- `python3 .agent/zero_context_gate.py audit`
- `python3 .agent/zero_context_gate.py verify`

`verify` is not a sandbox. It runs trusted repo-owned argv commands with bounded timeouts, bounded output capture, closed stdin, and a minimal sanitized child environment.
