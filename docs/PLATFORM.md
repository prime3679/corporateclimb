# Platform services & the store-build path

Corporate Climb ships as an installable PWA today. Everything that
touches a native capability goes through `src/platform/` — small,
framework-free adapter modules (nothing in that directory may import
React). That directory is the seam that makes an app-store build a
configuration task instead of a rewrite: each adapter has a web
implementation now and a documented Capacitor replacement.

## The adapter contract

| Module         | Exported surface                                                          | Web implementation                                         | Capacitor swap                                        |
| -------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------- |
| `haptics.ts`   | `Haptics.selection/impact(strength)/success/warning/setEnabled/supported` | `navigator.vibrate` patterns (no-op on iOS Safari)         | `@capacitor/haptics` (`impactMedium`, `notification`) |
| `wakeLock.ts`  | `WakeLock.acquire/release/reacquire/supported`                            | `navigator.wakeLock.request('screen')`                     | `@capacitor-community/keep-awake`                     |
| `lifecycle.ts` | `registerLifecycle()` — fans out background/foreground                    | `document.visibilitychange`                                | `@capacitor/app` `appStateChange`                     |
| `install.ts`   | `registerInstallCapture/canInstall/promptInstall/isStandalone/isIOS`      | `beforeinstallprompt` capture + `display-mode` media query | Not needed (a native app is always "installed")       |
| `share.ts`     | `share(text): 'shared' \| 'copied' \| 'failed'`                           | `navigator.share` with clipboard fallback                  | `@capacitor/share`                                    |

Consumers (the sequencer's haptic beats, the battle wake lock, the
run-end share buttons, the install nudge) only see this surface — they
never touch a browser API directly.

## Store-build recipe (when the time comes)

1. `npm install @capacitor/core @capacitor/cli @capacitor/haptics @capacitor/share @capacitor/app`
2. `npx cap init "Corporate Climb" com.corporateclimb.app --web-dir dist`
3. Add an `isNative()` helper (`Capacitor.isNativePlatform()`) to
   `src/platform/index.ts` and branch inside each adapter — the
   exported surfaces above stay unchanged.
4. In `src/main.tsx`, skip service-worker registration when
   `isNative()` (the native shell bundles its assets; a SW would fight
   the local scheme).
5. `npm run build && npx cap add ios android && npx cap sync`
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
  eviction ever becomes real; the save format is versioned and
  migration-friendly).
- The daily leaderboard client points at `/api/daily-leaderboard` —
  a native build needs an absolute base URL (one constant in
  `src/leaderboard.ts`).
