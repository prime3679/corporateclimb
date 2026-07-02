import { createRoot } from 'react-dom/client'
// Display = Anton (impact: headings, floor numbers, damage numerals).
// Body = Space Grotesk (everything readable). Self-hosted so the PWA
// stays offline-capable — no runtime Google Fonts fetch.
import '@fontsource/anton/400.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import './ui/global.css'
import App from './App'
import { MUSIC_URLS } from './music'
import { registerInstallCapture, registerLifecycle } from './platform'

// Platform services that must be listening before the app mounts:
// beforeinstallprompt can fire early, and backgrounding should always
// pause music regardless of which screen is up.
registerInstallCapture()
registerLifecycle()

createRoot(document.getElementById('root')!).render(<App />)

// Offline support: production only, so the dev server and e2e runs
// never fight a stale cache. After the first user gesture the music
// beds warm into the SW cache in the background (they're too heavy to
// block install on).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => {
        let warmed = false
        const warm = () => {
          if (warmed) return
          warmed = true
          navigator.serviceWorker.ready
            .then((reg) => reg.active?.postMessage({ type: 'WARM_MUSIC', urls: MUSIC_URLS }))
            .catch(() => {})
        }
        window.addEventListener('pointerdown', warm, { once: true })
        window.addEventListener('keydown', warm, { once: true })
      })
      .catch(() => {
        /* offline support is best-effort */
      })
  })
}
