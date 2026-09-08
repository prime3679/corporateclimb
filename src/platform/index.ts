// ─── PLATFORM SERVICES ───────────────────────────────────────
// The native-capability seam: framework-free adapters with web
// implementations and a Capacitor branch for the store build
// (docs/PLATFORM.md). Nothing here may import React.

export { isNative, bootstrapNativeChrome } from './native'
export { Haptics } from './haptics'
export { WakeLock } from './wakeLock'
export { registerLifecycle } from './lifecycle'
export { registerInstallCapture, canInstall, promptInstall, isStandalone, isIOS } from './install'
export { share, type ShareResult } from './share'
