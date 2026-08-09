import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { db } from './db.ts'

// Ask the browser not to evict our IndexedDB data under storage pressure.
// Best-effort: not all browsers grant this, and it's not required to work.
if ('storage' in navigator && 'persist' in navigator.storage) {
  navigator.storage.persist().catch(() => {
    // Ignore — persistence is a nice-to-have, not a hard requirement.
  })
}

// Dev-only escape hatch so the DB can be inspected/seeded from the browser
// console. Stripped out of production builds along with the rest of DEV code.
if (import.meta.env.DEV) {
  ;(window as unknown as { __gripTrackerDb: typeof db }).__gripTrackerDb = db
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
