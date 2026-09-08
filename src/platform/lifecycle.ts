// ─── APP LIFECYCLE ───────────────────────────────────────────
// One subscription fanned out to the services that care: music pauses
// when the app is backgrounded (a web tab keeps playing otherwise) and
// resumes with the wake lock on return. Native uses Capacitor App
// appStateChange; web uses document.visibilitychange.

import { App } from '@capacitor/app'
import { Music } from '@/music'
import { isNative } from './native'
import { WakeLock } from './wakeLock'

let registered = false

function onForeground() {
  Music.resume()
  void WakeLock.reacquire()
}

function onBackground() {
  Music.suspend()
}

export function registerLifecycle() {
  if (registered) return
  if (isNative()) {
    registered = true
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) onForeground()
      else onBackground()
    })
    return
  }
  if (typeof document === 'undefined') return
  registered = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) onBackground()
    else onForeground()
  })
}
