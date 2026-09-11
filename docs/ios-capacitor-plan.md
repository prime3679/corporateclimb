# Capacitor iOS plan (planning only)

Corporate Climb already ships as an installable PWA. This document is the
**iOS wrap plan** for a Capacitor shell around the existing Vite `dist/`.
It expands [`PLATFORM.md`](./PLATFORM.md) with a seam inventory, a
step-by-step wrap recipe for _this_ repo, gaps/risks, and a phased path.

**Phase A web wrap has landed** (Capacitor 7 seams, `capacitor.config.ts`,
adapter branches). Do **not** commit an `ios/` native tree in this track
until a Mac can run `npx cap add ios`. **STOP before App Store submit**
even after a wrap exists. Out of scope: Swift rewrite, IAP,
Office/Classic rewrite. Android can wait; the wrap is iOS-first.

## 1. Seam inventory

Native capability already goes through `src/platform/` (framework-free;
nothing there may import React). Consumers (sequencer haptic beats,
battle wake lock, run-end share, install nudge) only see these surfaces.
The Capacitor swap is a branch _inside_ each adapter.

### 1.1 Adapter modules

| Module         | Exported surface                                                                              | Web today                                 | Capacitor swap                                        |
| -------------- | --------------------------------------------------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------- |
| `haptics.ts`   | `Haptics.selection` / `impact(strength)` / `success` / `warning` / `setEnabled` / `supported` | `navigator.vibrate` (no-op on iOS Safari) | `@capacitor/haptics` (`impactMedium`, `notification`) |
| `wakeLock.ts`  | `WakeLock.acquire` / `release` / `reacquire` / `supported`                                    | `navigator.wakeLock.request('screen')`    | `@capacitor-community/keep-awake`                     |
| `lifecycle.ts` | `registerLifecycle()` — fans out background/foreground                                        | `document.visibilitychange`               | `@capacitor/app` `appStateChange`                     |
| `install.ts`   | `registerInstallCapture` / `canInstall` / `promptInstall` / `isStandalone` / `isIOS`          | `beforeinstallprompt` + `display-mode`    | Not needed (native is always "installed")             |
| `share.ts`     | `share(text): 'shared' \| 'copied' \| 'failed'`                                               | `navigator.share` + clipboard fallback    | `@capacitor/share`                                    |

`src/platform/index.ts` is the barrel. Add `isNative()` there
(`Capacitor.isNativePlatform()`); keep every exported surface unchanged.

### 1.2 PWA / service worker (not under `src/platform/`)

| Seam            | Where                                                                | Web today                                                               | Native wrap                                                                                 |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| SW registration | `src/main.tsx` (prod only, `/sw.js`)                                 | Precache + network-first navigations; `WARM_MUSIC` after first gesture  | **Skip** when `isNative()` — native shell bundles assets; a SW would fight the local scheme |
| SW template     | `public/sw.js` (`VERSION` / `__PRECACHE` placeholders)               | `scripts/sw-precache-plugin.ts` injects the manifest at `npm run build` | Leave as-is for the PWA; native never registers it                                          |
| Manifest        | `public/manifest.webmanifest`                                        | `display: standalone`, `orientation: portrait`, `theme_color: #12141a`  | Native config owns orientation/theme; manifest stays for the web PWA                        |
| Boot splash     | `index.html` `.boot-splash`                                          | Static markup until React mounts                                        | Keep; `resources/splash.png` mirrors it for the storyboard + `@capacitor/splash-screen`     |
| Boot color      | `#12141a` night-lobby midtone (`--cc-bg`)                            | `theme-color`, `html/body/#root`, `.boot-splash`, Stage card            | Same value in `capacitor.config.ts` + `BOOT_COLOR`; `boot-splash.test.ts` guards the chain  |
| Safe area       | `index.html` `viewport-fit=cover` + `#root` `env(safe-area-inset-*)` | Already pads notches; Stage backdrop subtracts the same insets          | Keep as the **only** inset: `overlaysWebView: true`, `ios.contentInset: 'never'`            |
| Leaderboard     | `src/leaderboard.ts` `API = '/api/daily-leaderboard'`                | Same-origin Vercel function                                             | Native needs an **absolute** base URL (one constant)                                        |
| Saves           | guarded `localStorage` via `src/engine/save.ts`                      | Versioned (currently **v8**); migration pipeline                        | Unchanged; `@capacitor/preferences` only if WebView eviction becomes real                   |
| Audio           | `AudioContext` SFX + `HTMLAudioElement` music beds                   | Bundled assets                                                          | Unchanged in a native shell                                                                 |

## 2. Wrap recipe (repo-specific)

Do not run this recipe in the planning PR. When a later wrap PR starts:

### 2.1 Packages

```
npm install @capacitor/core @capacitor/cli @capacitor/haptics @capacitor/share @capacitor/app
```

Splash / status / keep-awake are the niceties in §2.7 (`@capacitor/splash-screen`,
`@capacitor/status-bar`, `@capacitor-community/keep-awake`).

### 2.2 Init

```
npx cap init "Corporate Climb" com.corporateclimb.app --web-dir dist
```

App id matches `PLATFORM.md`. Do not invent a different bundle id here.

### 2.3 `isNative()`

Add `isNative()` on the `src/platform/index.ts` barrel using
`Capacitor.isNativePlatform()`. Branch **inside** each adapter; do not
fork callers. On native, `canInstall()` stays false and `isStandalone()`
can treat native as always installed — `beforeinstallprompt` is unused.

### 2.4 Skip the service worker

In `src/main.tsx`, gate `import.meta.env.PROD && 'serviceWorker' in navigator`
with `!isNative()`. Leave `public/sw.js` and the precache plugin alone
so the PWA path stays intact.

### 2.5 Absolute leaderboard URL

Replace the relative `'/api/daily-leaderboard'` in `src/leaderboard.ts`
with a single absolute constant (production origin of the Vercel
function) when `isNative()`. Timeouts, handle sanitization, and
null-on-failure stay as they are.

### 2.6 iOS platform (not Android)

```
npm run build && npx cap add ios && npx cap sync
```

iOS-first: add the iOS platform in the wrap track; Android can wait.
`npx cap add ios` is the first time an `ios/` tree appears — later PR.

### 2.7 Splash, boot color, status bar, portrait

**One boot color: night-lobby midtone `#12141a`** (`--cc-bg` in `src/ui/tokens.css`, Title field floor).
It is the surface the ladder sits on in `.boot-splash` and in the Stage card,
so a cold launch is a single unbroken midtone:

```
LaunchScreen.storyboard (Splash.imageset, aspect-fill)   resources/splash.png
  → SplashScreen plugin (same storyboard, backgroundColor)   capacitor.config.ts
  → WKWebView background                                     capacitor.config.ts backgroundColor
  → html / body / #root void + safe-area bands               index.html
  → .boot-splash (static ladder + wordmark)                  index.html
  → React sprite preloader (same ladder, Space Grotesk)      CorporateClimb.tsx
  → title
```

Web side, `theme-color` and the manifest's `theme_color` / `background_color`
carry the same value, so the installed PWA's Android splash and status bar
match too. The previous `#263238` (Material blue-grey, Classic-era
`theme-color`) and `#0f172a` (slate void) were not on any boot surface; with
overlay status bars they showed up as a blue band under the clock. Every link
is asserted by `src/__tests__/boot-splash.test.ts`; `BOOT_COLOR` in
`src/platform/native.ts` is the named source, mirrored as a literal where the
Capacitor CLI or the browser reads the file outside Vite.

**Splash art.** `resources/splash.png` (2732×2732, generated by
`node scripts/gen-splash.mjs`, regenerable) is the boot ladder + wordmark at
native density, sized so the ladder lands at the HTML boot splash's 76 CSS px
on a 2556-tall @3x iPhone and stays inside the ~1260 px band the narrowest
portrait crop shows. `resources/README.md` has the three `cp` targets in
`ios/App/App/Assets.xcassets/Splash.imageset/` (1x/2x/3x are the same file
in Capacitor's template) and the `@capacitor/assets` alternative. The plugin
hides on the web's own `SplashScreen.hide()` from `bootstrapNativeChrome()`
(before React mounts, `.boot-splash` already in the DOM) with its default
200 ms fade; `launchAutoHide` stays on as the safety net.

**Status bar model** (matches the PWA's `black-translucent`): the bar is a
transparent overlay, the WebView is full-bleed, and `index.html`'s `#root`
padding from `env(safe-area-inset-*)` is the **only** inset.

- `capacitor.config.ts`: `StatusBar.overlaysWebView: true`, `style: 'DARK'`
  (light glyphs), `backgroundColor` night-lobby midtone (only drawn if overlay is
  ever off); `ios.contentInset: 'never'` so UIKit never adds a scroll inset
  on top of the CSS one. Any other `contentInset` double-insets.
- `bootstrapNativeChrome()` sets the light style, then re-asserts
  `setOverlaysWebView({ overlay: true })` and the bar color at runtime, then
  hides the splash. With overlay off the v7 plugin shrinks the
  WebView under a painted bar view; `safe-area-inset-top` then reads 0, so
  the CSS padding collapses rather than doubling — but the overlay model is
  the one the art was composed for.
- `Stage.module.css` backdrop is `100dvh` minus top/bottom insets. `#root`
  already pads those, so a plain `100dvh` backdrop overflowed by the inset
  total and `overflow: hidden` clipped the stage's bottom (~93 pt on a
  Dynamic Island phone). Zero effect where insets are 0 (browsers, CI).
- `UIViewControllerBasedStatusBarAppearance` must stay `true` (the template
  default; the plugin requires it). Do not add `UIStatusBarStyle` /
  `UIStatusBarHidden` to `Info.plist`.

**Simulator checklist (Mac; this is what Fable could not run):**

1. Copy `resources/splash.png` to the three `Splash.imageset` names; set the
   storyboard root view background to `#12141A` (template ships white).
2. Cold-launch on iPhone 16 Pro Max and iPhone SE (3rd gen): storyboard →
   plugin → boot splash → title must be one night-lobby midtone with **no** grey, slate, or
   white frame at any step. Record with the Simulator's screen recording and
   step frames if unsure.
3. The ladder should hold position through the 200 ms fade. Expected
   residual: the HTML splash centers inside the safe-area-padded `#root`, so
   its hero sits (top − bottom inset) / 2 ≈ 12 pt lower than the screen-centered
   storyboard image. A soft settle is fine; a hop or a size jump is not.
4. Status bar glyphs are white over night-lobby midtone; nothing draws under the
   clock or the home indicator; the battle FIGHT row is fully visible at the
   bottom (that is the backdrop fix above working).
5. Rotate: portrait lock (§2.6 Xcode) holds; on iPad the aspect-fill crop
   keeps the hero centered in both orientations.

Orientation lock: set **portrait** in the native project config (the manifest
hint only applies to the installed PWA).

Vite still type-checks and builds `dist/`; Capacitor copies that output.

## 3. Gaps and risks

| Gap                                       | Risk                                      | Mitigation (wrap track, not this PR)                          |
| ----------------------------------------- | ----------------------------------------- | ------------------------------------------------------------- |
| iOS Safari haptics are a no-op today      | Native players expect beats               | Swap `haptics.ts` to `@capacitor/haptics`; keep `setEnabled`  |
| SW vs `capacitor://` / local scheme       | Stale or empty cache, broken navigations  | Skip SW registration when `isNative()`                        |
| Relative leaderboard API                  | Fetch fails in the WebView                | Absolute URL constant in `src/leaderboard.ts`                 |
| `localStorage` eviction in WKWebView      | Rare save loss                            | Stay on v8 `localStorage` first; Preferences only if observed |
| `visibilitychange` vs true app background | Music may not pause on home-button        | `@capacitor/app` `appStateChange` in `lifecycle.ts`           |
| Portrait only via manifest                | iOS may rotate the WebView                | Native orientation lock                                       |
| Cold-launch color step                    | Grey/slate/white frame before first paint | One boot color end to end (§2.7); `boot-splash.test.ts`       |
| Overlay status bar + CSS insets           | Double inset or UI under the clock        | `overlaysWebView: true` + `contentInset: 'never'` (§2.7)      |
| ATS / HTTPS for leaderboard               | App Transport Settings if origin is wrong | Use the production HTTPS origin only                          |
| Signing / certificates                    | Wrap cannot launch on device              | Xcode team + profiles in Phase B — not this PR                |
| Store review                              | Privacy, age rating, screenshots          | Phase C assets only; **no submit**                            |

Do not invent Capacitor APIs beyond the packages already named in
`PLATFORM.md`.

## 4. Phased path

Estimates are relative wrap effort (not calendar).

### Phase A — wrap (web seams landed; `ios/` tree Mac-blocked)

Still not store submit. No IAP, no Swift rewrite.

**Landed (web-side):**

- [x] Packages + `capacitor.config.ts` as in §2.1–2.2 (`cap init` equivalent; no `ios/` tree)
- [x] `isNative()` + adapter branches (§2.3)
- [x] Skip SW (§2.4); absolute leaderboard URL (§2.5)
- [x] Splash / status plugin _config_ in `capacitor.config.ts` (§2.7 web half)
- [x] Confirm PWA path still registers SW in production web builds (`!isNative()`)
- [x] One boot color (`#12141a`) across storyboard config, plugin, WebView, HTML void, boot splash, manifest (§2.7)
- [x] Branded splash art `resources/splash.png` + generator + pixel guard (§2.7)
- [x] Status-bar overlay model pinned (`overlaysWebView`, `contentInset`, runtime re-assert); Stage backdrop honors the insets (§2.7)

**Mac-blocked** (do not run on Linux CI; no `ios/` commit):

- [ ] `npx cap add ios` + `npx cap sync` (§2.6)
- [ ] Copy `resources/splash.png` into `Splash.imageset`; storyboard background `#12141A` (`resources/README.md`)
- [ ] Portrait lock in Xcode (`UISupportedInterfaceOrientations`) — not expressible in Capacitor config
- [ ] Simulator cold-launch pass per the §2.7 checklist (no color step, hero holds, bar glyphs white, FIGHT row visible)
- [ ] Simulator smoke: title → battle haptic → background music pause → share
- [ ] Archive / signing (Phase B)

**Effort:** medium for the landed web seams; native project is Mac-blocked.

### Phase B — TestFlight (internal; still not App Store submit)

- [ ] Apple Developer team, bundle id, signing
- [ ] Device run: wake lock during battle, safe-area, audio resume
- [ ] TestFlight group; crash / WebView blank-screen check
- [ ] Leaderboard against production HTTPS (opt-in handle still)

**Effort:** medium (signing + device), blocked on Apple account access.

### Phase C — review assets (prepare only)

- [ ] Screenshots, privacy text, age rating notes, support URL
- [ ] Confirm no IAP, no tracking SDK, no new entitlements beyond the wrap
- [ ] **STOP.** Do not click App Store Connect submit.

**Effort:** small for asset collection; submit is explicitly out of band.

## 5. STOP before App Store submit

The wrap track ends when a signed TestFlight build exists and review
**assets** are drafted. It does **not** include App Store Connect
submission, review replies, or a public store release. A future,
separately scoped decision is required before any submit.

## 6. Out of scope and doc map

**Out of scope:** Swift/native UI rewrite; IAP; Office vs Classic
rewrites or retargeting `CLASSIC_TRACKS`; Android (`cap add android`);
adding `ios/` until a Mac can run `npx cap add ios`; gameplay, balance, save-format
bumps, CI, or Vercel changes.

| Doc                            | Role                                                               |
| ------------------------------ | ------------------------------------------------------------------ |
| [`PLATFORM.md`](./PLATFORM.md) | Adapter contract + short store-build recipe (iOS-first step 5)     |
| This file                      | Inventory, expanded recipe, gaps, phases, STOP                     |
| `CLAUDE.md`                    | `src/platform/` may not import React; Capacitor swap is documented |
| `resources/README.md`          | Splash art: where the bytes go after `cap add ios`, how to regen   |
| `src/engine/save.ts`           | Save version (v8) — wrap must not break migrations                 |

Phase A web wrap is in-repo. `npx cap add ios` / Simulator / Archive remain Mac-blocked. **STOP before App Store submit.**
