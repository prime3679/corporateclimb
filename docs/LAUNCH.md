# Corporate Climber — launch doctrine (decided 2026-09-12)

Two decisions Adrian made, and the operating rule that follows from them.
This file outranks older phrasing in `docs/rpg/*` where they disagree.

## Decisions

1. **The Office is the hero.** The five-floor campaign is the game. Classic
   (30-floor tower) stays as the Daily challenge's engine and a labelled
   secondary mode; it gets no new content or art passes. Retirement of the
   non-daily Classic run is a separate decision after launch data exists.
2. **The name is Corporate Climber.** Player-facing everywhere: title tag,
   OG/Twitter, manifest `name`, Capacitor `appName`, wordmark, share text,
   install nudge. Home-screen short name is `Corp Climber` (12 chars).
   Storage keys (`corporate-climb-save`, `corporate-climb-office-save`),
   the Capacitor appId, repo name and CSS token prefix do **not** change —
   renaming a save key is a save-bleed bug, not a rename.
   Canonical host is `https://corpclimber.com`; `corporateclimb.vercel.app`
   is a redirect only and must not appear in new copy.

## The rule: no polish without signal

From now until the first 100 sessions are in PostHog:

- No visual, copy, or "calm" pass may open as a PR unless its description
  links either (a) a PostHog event or funnel drop it addresses, or (b) a
  line in `docs/playtest/sessions.md` where a real person hesitated.
- Bugs, crashes, save/offline correctness, and analytics/instrumentation
  are always in scope.
- The agent roles in `docs/rpg/iteration-roadmap.md` (Fable / Astra / CoS)
  stay; the pass ladder pauses at Pass J. The next ladder is written from
  data, not taste.

## What's wired in code (this branch)

| Piece                                                      | Where                                                                        | Needs                                                                    |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| PostHog capture, no-op by default                          | `src/analytics.ts`, `src/screens/office/analytics.ts`                        | `VITE_POSTHOG_KEY` in Vercel env                                         |
| Vercel Web Analytics (script tag, no package)              | `injectVercelAnalytics()` in `src/main.tsx`                                  | Analytics toggled on in the Vercel project                               |
| Crash capture (window error, promise, render)              | `registerErrorCapture()`, `ErrorBoundary`                                    | nothing                                                                  |
| Share / install outcome events                             | `src/platform/share.ts`, `src/platform/install.ts`                           | nothing                                                                  |
| Crawlable About page, robots, sitemap, canonical, noscript | `public/about.html`, `public/robots.txt`, `public/sitemap.xml`, `index.html` | nothing                                                                  |
| Rename to Corporate Climber (display strings)              | 24 files, see `git log`                                                      | regenerate `public/og.png` and `resources/splash.png` (TASK-CLIMBER-002) |

## Owner-only steps (Adrian, ~30 minutes total)

These need accounts an agent cannot touch. Do them in order; nothing
downstream is measurable until 1–3 are done.

1. **PostHog** — create a project at posthog.com (free tier is plenty),
   copy the project API key, add `VITE_POSTHOG_KEY` to Vercel →
   corporateclimb → Settings → Environment Variables (Production + Preview),
   redeploy. Verify: open corpclimber.com, PostHog → Activity shows
   `title_view`.
2. **Vercel Web Analytics** — Vercel → corporateclimb → Analytics → Enable.
   The script tag in `main.tsx` starts working on the next production load.
3. **Leaderboard store** — Vercel → Storage → Create → Upstash Redis (free),
   connect to corporateclimb. This sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`
   automatically. Verify: `curl "https://corpclimber.com/api/daily-leaderboard?seed=20260912"`
   returns `[]` (not 503).
4. **Redirect** — Vercel → corporateclimb → Settings → Domains: make sure
   `corpclimber.com` is primary and `corporateclimb.vercel.app` redirects
   (308) to it. Share links already point at corpclimber.com.
5. **Merge order** — #134 (Codex ship-readiness) → #135 (feedback + coffee)
   → this branch (`climber-launch`). Resolve the rename conflicts in favour
   of "Corporate Climber".
6. **Playtests** — five real first sessions on phones before you leave.
   Script and log in `docs/playtest/`. The calendar hold is on the 16th.

## Dashboard to build once events flow (PostHog, ~15 min)

Funnel: `title_view` → `mode_start (office)` → `office_fight_start` →
`office_fight_won` → `office_floor_cleared (screen_floor2_complete)` →
`office_floor_cleared (screen_floor5_complete)` → `share`.

Two extra insights: `error` by `message` (crashes), and `mode_start` split
by `mode` (how much Classic still matters).
