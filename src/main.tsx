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

createRoot(document.getElementById('root')!).render(<App />)

// Offline support: production only, so the dev server and e2e runs
// never fight a stale cache.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* offline support is best-effort */
    })
  })
}
