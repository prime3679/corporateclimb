// ─── APP LIFECYCLE ───────────────────────────────────────────
// One visibilitychange subscription fanned out to the services that
// care: music pauses when the app is backgrounded (a web tab keeps
// playing otherwise) and resumes with the wake lock on return.

import { Music } from '@/music'
import { WakeLock } from './wakeLock'

let registered = false

export function registerLifecycle() {
  if (registered || typeof document === 'undefined') return
  registered = true
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Music.suspend()
    } else {
      Music.resume()
      void WakeLock.reacquire()
    }
  })
}
