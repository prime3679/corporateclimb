import { createRoot } from 'react-dom/client'
import '@fontsource/press-start-2p'
import '@fontsource/vt323'
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
