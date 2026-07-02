// ─── PLATFORM SERVICES ───────────────────────────────────────
// The native-capability seam: framework-free adapters with web
// implementations today and a documented Capacitor swap for the store
// build (docs/PLATFORM.md). Nothing here may import React.

export { Haptics } from './haptics'
export { WakeLock } from './wakeLock'
export { registerLifecycle } from './lifecycle'
export { registerInstallCapture, canInstall, promptInstall, isStandalone, isIOS } from './install'
export { share, type ShareResult } from './share'
