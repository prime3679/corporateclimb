# Corporate Climb

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

## Testing

```bash
npm test           # run unit tests (vitest)
npm run test:smoke # run Playwright smoke tests (spins up dev server)
```

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
