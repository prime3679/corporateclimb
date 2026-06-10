// Capture reference screenshots of key screens (title, class select, battle).
// Usage: node scripts/screenshot.mjs <outDir>
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const outDir = process.argv[2] || 'shots'
mkdirSync(outDir, { recursive: true })

const server = spawn('npx', ['vite', '--port', '5199', '--strictPort'], { stdio: 'pipe' })
await new Promise((resolve, reject) => {
  server.stdout.on('data', (d) => {
    if (d.toString().includes('Local:')) resolve()
  })
  server.on('exit', reject)
  setTimeout(() => reject(new Error('vite timeout')), 30000)
})

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 440, height: 760 } })
await page.goto('http://localhost:5199/')
await page.evaluate(() => localStorage.clear())
await page.reload()

await page.getByRole('button', { name: /PRESS START|NEW GAME/ }).waitFor({ timeout: 15000 })
await page.waitForTimeout(800)
await page.screenshot({ path: `${outDir}/1-title.png` })

await page.getByRole('button', { name: /PRESS START|NEW GAME/ }).click()
await page.waitForTimeout(800)
await page.screenshot({ path: `${outDir}/2-class-select.png` })

// Jump straight to a mid-run battle via an injected save (same trick as e2e).
await page.evaluate(() => {
  localStorage.setItem(
    'corporate-climb-save',
    JSON.stringify({
      classId: 'pm',
      floor: 2,
      level: 8,
      xp: 40,
      xpToNext: 150,
      playerHp: 96,
      playerPp: [15, 20, 6, 3],
      atkBuff: 0,
      defBuff: 0,
      usedEvents: [],
      inventory: ['espresso', 'mentors_advice'],
    }),
  )
})
await page.reload()
await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15000 })
await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12000 })
await page.waitForTimeout(600)
await page.screenshot({ path: `${outDir}/3-floor-intro.png` })

await page.locator('#root').click({ position: { x: 220, y: 380 } })
await page.getByRole('button', { name: 'FIGHT' }).waitFor({ timeout: 12000 })
await page.waitForTimeout(900)
await page.screenshot({ path: `${outDir}/4-battle.png` })

await browser.close()
server.kill()
process.exit(0)
