# Platform services & the store-build path

Corporate Climb ships as an installable PWA today. Everything that
touches a native capability goes through `src/platform/` — small,
framework-free adapter modules (nothing in that directory may import
React). That directory is the seam that makes an app-store build a
configuration task instead of a rewrite: each adapter branches on
`isNative()` — web APIs by default, Capacitor plugins in the native shell.

**Phased iOS plan:** see [`docs/ios-capacitor-plan.md`](./ios-capacitor-plan.md) for seam inventory, the Capacitor wrap recipe expanded for this repo, gaps/risks, TestFlight path, and an explicit **STOP before App Store submit**. Phase A **web** seams (packages, `isNative()`, adapter branches) are in-tree; `npx cap add ios` / Simulator / Archive are Mac-blocked. No store submit in that track.

## The adapter contract

| Module         | Exported surface                                                          | Web implementation                                         | Capacitor swap                                                        |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------- |
| `haptics.ts`   | `Haptics.selection/impact(strength)/success/warning/setEnabled/supported` | `navigator.vibrate` patterns (no-op on iOS Safari)         | `@capacitor/haptics` (`impact` / `notification` / `selectionChanged`) |
| `wakeLock.ts`  | `WakeLock.acquire/release/reacquire/supported`                            | `navigator.wakeLock.request('screen')`                     | `@capacitor-community/keep-awake`                                     |
| `lifecycle.ts` | `registerLifecycle()` — fans out background/foreground                    | `document.visibilitychange`                                | `@capacitor/app` `appStateChange`                                     |
| `install.ts`   | `registerInstallCapture/canInstall/promptInstall/isStandalone/isIOS`      | `beforeinstallprompt` capture + `display-mode` media query | Native: always installed (`canInstall` false)                         |
| `share.ts`     | `share(text): 'shared' \| 'copied' \| 'failed'`                           | `navigator.share` with clipboard fallback                  | `@capacitor/share`                                                    |

Consumers (the sequencer's haptic beats, the battle wake lock, the
run-end share buttons, the install nudge) only see this surface — they
never touch a browser API directly.

## Store-build recipe (Phase A web landed; iOS tree Mac-blocked)

1. Capacitor 7 packages are installed (`@capacitor/core`, CLI, haptics, share, app, splash-screen, status-bar, `@capacitor-community/keep-awake`).
2. `capacitor.config.ts`: appId `com.corporateclimb.app`, appName Corporate Climb, `webDir dist`. Portrait is Xcode-only.
3. `isNative()` (`Capacitor.isNativePlatform()`) is on the `src/platform/index.ts` barrel; each adapter branches — exported surfaces stay unchanged.
4. `src/main.tsx` skips service-worker registration when `isNative()` (the native shell bundles its assets; a SW would fight the local scheme) and calls `bootstrapNativeChrome()`.
5. **Mac-blocked:** `npm run build && npx cap add ios && npx cap sync`
   iOS-first; Android can wait. Details and STOP-before-submit checklist: [`ios-capacitor-plan.md`](./ios-capacitor-plan.md).
6. Native niceties that replace web equivalents:
   - `@capacitor/splash-screen` — the boot splash in `index.html`
     still covers the WebView start
   - `@capacitor/status-bar` — match `theme-color` (#263238); the
     `viewport-fit=cover` + `env(safe-area-inset-*)` padding already
     handles notches
   - Orientation lock: set portrait in the native project config
     (the manifest hint only applies to the installed PWA)

## Things that already work in a native shell unchanged

- Audio: SFX decode through one `AudioContext`; music beds are plain
  `HTMLAudioElement` streams of bundled assets.
- Saves and progression: everything persists through guarded
  `localStorage` (consider `@capacitor/preferences` later if WebView
  eviction ever becomes real; the save format is versioned (currently v8 in `src/engine/save.ts`) and
  migration-friendly).
- The daily leaderboard client points at `/api/daily-leaderboard` on
  web and `https://corporateclimb.vercel.app/api/daily-leaderboard`
  when `isNative()` (`src/leaderboard.ts`).
