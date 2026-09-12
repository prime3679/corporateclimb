# Corporate Climber

A browser-based RPG where you battle your way up the corporate ladder. Fight bosses like the Micromanaging Manager, Overachieving Colleague, and the dreaded VP across 30 floors divided into three acts.

## Gameplay

- **Classes** - Choose from Engineer, Designer, and more, each with unique move sets
- **Type system** - Strategy, Influence, Execution, Analytics, and Technical types with effectiveness matchups
- **Status effects** - Motivated, Caffeinated, Burned Out, and others that alter combat
- **Power-ups** - Espresso, LinkedIn Endorsements, Mentor's Advice, and more
- **Daily challenge** - A fixed seed run that resets each day, shareable with others
- **Acts** - Three acts across 30 floors with escalating enemies and a final boss

## Local Development

```bash
npm install       # install dependencies
npm run dev       # start dev server at http://localhost:5173
```

## Contribution Path

Fresh coding agents should start with `AGENTS.md`, then `docs/ZERO-CONTEXT-CONTRIBUTION.md`, then `CLAUDE.md`. The local contribution gate lives at `python3 .agent/zero_context_gate.py audit|verify` and uses the exact CI verification commands without install or deploy steps.

## Testing

```bash
npm test           # run unit tests (vitest)
npm run test:smoke # run Playwright smoke tests (spins up dev server)
npm run test:production # offline/install/update checks; run npm run build first
```

The full Office campaign is an opt-in playtest. Set `PLAYTEST_FULL_CLIMB=1` and
run `npm run test:smoke -- e2e/office-full-climb.spec.ts -g fresh-save`.
`PLAYTEST_ROLE` accepts `Product Manager`, `Senior Engineer`, or `UX Designer`;
`PLAYTEST_ARTIFACT_DIR` selects the screenshot/checkpoint directory.

## Linting & Formatting

```bash
npm run lint          # ESLint
npm run format        # Prettier (write)
npm run format:check  # Prettier (check only, used in CI)
```

## Build

```bash
npm run build   # type-check + Vite production build (output: dist/)
npm run preview # preview the production build locally
```

## Deploy

This project is deployed on [Vercel](https://vercel.com). Push to `main` and Vercel will automatically build and deploy from the `dist/` output.

The Title coffee tip is gated on `VITE_COFFEE_PAYMENT_URL` (set it in the Vercel Production env to show **Buy the intern a coffee — $5**). In-game **Send feedback** opens the GitHub issue chooser.

## Assets

Character sprites live in `src/assets/characters/` as 512×512 WebP. They were
downscaled and re-encoded (Pillow `Image.resize(LANCZOS)` → WebP quality 82,
alpha preserved) from the original 1024×1024 PNG masters. Those masters are no
longer in the tree — recover them from git history before commit `0ebdf73`
(`git show 0ebdf73~1:src/assets/characters/npcs/boss.png > boss.png`) if you
need to re-export at a different size.

Office Floor 1–2 house plates (`npcs/renata.webp` … `kessler.webp`) are
Office-only portraits on the same 512 contract; `python3 scripts/gen_office_plates.py brief`
prints the commission brief per speaker (identity carriers come from the walk-sheet palettes;
the pose contract and per-speaker gesture keep props under the shoulder line so the Headshot
crop stays clean), `import <dir>` re-encodes masters, and `check` verifies the committed plates.
Classic keeps its own `recruiter` / `overachiever` / … files untouched.

Office campaign audio (distinct from Classic Act-1 beds) is documented in
`docs/rpg/office-audio.md` and regenerated with `python3 scripts/gen_office_audio.py`.
