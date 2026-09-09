// ─── NATIVE SHELL DETECTION & CHROME ─────────────────────────
// Capacitor.isNativePlatform() is the single gate. Callers keep the
// existing adapter surfaces; this module must not import React.

import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/**
 * Frame black (`--cc-bg`): the one boot color. Every surface on the cold-launch
 * path is this value — LaunchScreen storyboard art, SplashScreen plugin,
 * WKWebView background, `html/body/#root`, `.boot-splash`, Stage card — so
 * the native splash dissolves into the web boot splash with no color step.
 * Mirrored (not imported — the Capacitor CLI loads that file outside Vite)
 * in `capacitor.config.ts`, `index.html`, and `public/manifest.webmanifest`;
 * `boot-splash.test.ts` keeps them in step.
 */
export const BOOT_COLOR = '#06080c'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/**
 * Status bar + splash hide. No-op on the web PWA.
 *
 * iOS status-bar model (matches the PWA's `black-translucent`): the bar is
 * transparent and overlays the WebView; `index.html` pads `#root` with
 * `env(safe-area-inset-*)` so no UI sits under the clock or the home
 * indicator. `setOverlaysWebView(true)` pins that model even if the native
 * config drifts — with overlay off, the plugin shrinks the WebView below the
 * bar and paints its own bar view, at which point `safe-area-inset-top` is 0
 * and the CSS padding would collapse (fine) or, with `ios.contentInset`
 * anything but `never`, double-inset (not fine). Frame black for the bar
 * background covers the overlay-off case so a flip can't flash the default
 * `#000000`. Style.Dark is light glyphs on a dark bar.
 */
export async function bootstrapNativeChrome(): Promise<void> {
  if (!isNative()) return
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setOverlaysWebView({ overlay: true })
    await StatusBar.setBackgroundColor({ color: BOOT_COLOR })
  } catch {
    /* best-effort — plugin absent or web stub */
  }
  try {
    // Called before React mounts: `.boot-splash` is already in the DOM, so the
    // plugin's fade lands on the same ladder + wordmark the splash PNG shows.
    await SplashScreen.hide()
  } catch {
    /* launchAutoHide covers the failure case */
  }
}
