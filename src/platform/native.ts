// ─── NATIVE SHELL DETECTION & CHROME ─────────────────────────
// Capacitor.isNativePlatform() is the single gate. Callers keep the
// existing adapter surfaces; this module must not import React.

import { Capacitor } from '@capacitor/core'
import { SplashScreen } from '@capacitor/splash-screen'
import { StatusBar, Style } from '@capacitor/status-bar'

/** Matches web `theme-color` / boot splash (#263238). */
const CHROME_COLOR = '#263238'

export function isNative(): boolean {
  return Capacitor.isNativePlatform()
}

/** Status bar + splash hide. No-op on the web PWA. */
export async function bootstrapNativeChrome(): Promise<void> {
  if (!isNative()) return
  try {
    await StatusBar.setBackgroundColor({ color: CHROME_COLOR })
    await StatusBar.setStyle({ style: Style.Dark })
  } catch {
    /* best-effort — plugin absent or web stub */
  }
  try {
    await SplashScreen.hide()
  } catch {
    /* launchAutoHide covers the failure case */
  }
}
