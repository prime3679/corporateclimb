// Drive through every screen and screenshot each for visual inspection.
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const out = 'shots-tour'
mkdirSync(out, { recursive: true })
const server = spawn('npx', ['vite', '--port', '5196', '--strictPort'], { stdio: 'pipe' })
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => d.toString().includes('Local:') && res())
  setTimeout(() => rej(new Error('vite timeout')), 30000)
})
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 440, height: 760 } })
const shot = (name) => page.screenshot({ path: `${out}/${name}.png` })
const buffed = (floor, extra = {}) => ({
  classId: 'pm',
  floor,
  level: 25,
  xp: 0,
  xpToNext: 100000,
  playerHp: 200,
  playerPp: [40, 40, 40, 40],
  atkBuff: 220,
  defBuff: 80,
  usedEvents: [],
  inventory: [],
  ...extra,
})
const inject = async (save) => {
  await page.evaluate((s) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-save', JSON.stringify(s))
  }, save)
  await page.reload()
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15000 })
}
const tapBattle = async () => {
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12000 })
  await page.waitForTimeout(500)
  await page.locator('#root').click({ position: { x: 220, y: 380 } })
  await page.getByRole('button', { name: 'FIGHT' }).waitFor({ timeout: 12000 })
  await page.waitForTimeout(800)
}
const attackUntil = async (target, rounds = 30) => {
  const goal = page.getByText(target)
  for (let i = 0; i < rounds; i++) {
    if (await goal.isVisible().catch(() => false)) return
    const mv = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await mv.isVisible().catch(() => false)) await mv.click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(400)
  }
}

await page.goto('http://localhost:5196/')
await page.evaluate(() => localStorage.clear())
await page.reload()

// 1 title, 2 daily pre, 3 class select
await page.getByRole('button', { name: /PRESS START|NEW GAME/ }).waitFor({ timeout: 15000 })
await page.waitForTimeout(700)
await shot('01-title')
await page.getByRole('button', { name: 'DAILY CHALLENGE' }).click()
await page.waitForTimeout(700)
await shot('02-daily-pre')
await page
  .getByRole('button', { name: 'BACK' })
  .click()
  .catch(() => page.goBack())
await page.waitForTimeout(500)
await page.getByRole('button', { name: /PRESS START|NEW GAME/ }).click()
await page.waitForTimeout(700)
await shot('03-class-select')

// 4 floor intro, 5 battle, 6 items tab, 7 mid-turn log
await inject(buffed(2, { playerHp: 180, inventory: ['espresso', 'mentors_advice', 'pto_day'] }))
await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12000 })
await page.waitForTimeout(500)
await shot('04-floor-intro')
await page.locator('#root').click({ position: { x: 220, y: 380 } })
await page.getByRole('button', { name: 'FIGHT' }).waitFor({ timeout: 12000 })
await page.waitForTimeout(800)
await shot('05-battle-fight')
await page.getByRole('button', { name: /ITEMS/ }).click()
await page.waitForTimeout(400)
await shot('06-battle-items')
await page.getByRole('button', { name: 'FIGHT' }).click()
await page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first().click()
await page.waitForTimeout(1100)
await shot('07-battle-midturn')

// 8 victory, 9 route choice, 10 hallway choices, 11 hallway result
await attackUntil('VICTORY')
await page.waitForTimeout(600)
await shot('08-victory')
await page.getByRole('button', { name: /CONTINUE/ }).click()
await page.getByText('CHOOSE YOUR PATH').waitFor({ timeout: 10000 })
await page.waitForTimeout(600)
await shot('09-route-choice')
const btns = page.locator('button')
for (let i = 0; i < (await btns.count()); i++) {
  const b = btns.nth(i)
  const t = (await b.textContent().catch(() => '')) ?? ''
  if (!t.includes('🔊') && !t.includes('🔇') && (await b.isVisible().catch(() => false))) {
    await b.click()
    break
  }
}
await page.waitForTimeout(900)
await shot('10-hallway-event')
const cbtns = page.locator('button')
for (let i = 0; i < (await cbtns.count()); i++) {
  const b = cbtns.nth(i)
  const t = (await b.textContent().catch(() => '')) ?? ''
  if (!t.includes('🔊') && !t.includes('🔇') && (await b.isVisible().catch(() => false))) {
    await b.click()
    break
  }
}
await page.waitForTimeout(700)
await shot('11-hallway-result')

// 12 promotion + 13 act transition (floor 9 win), 14 game over
await inject(buffed(9, { playerHp: 140 }))
await tapBattle()
await attackUntil('VICTORY')
await page.getByRole('button', { name: /CONTINUE/ }).click()
await page.getByText('PROMOTED').waitFor({ timeout: 10000 })
await page.waitForTimeout(700)
await shot('12-promotion')
await page.locator('#root').click({ position: { x: 220, y: 380 } })
await page.getByText('MANAGEMENT').waitFor({ timeout: 10000 })
await page.waitForTimeout(700)
await shot('13-act-transition')

await inject({ ...buffed(8), level: 1, playerHp: 8, atkBuff: 0, defBuff: 0 })
await tapBattle()
await attackUntil('GAME OVER')
await page.waitForTimeout(700)
await shot('14-game-over')

// 15 win screen (clear floor 29)
await page
  .getByRole('button', { name: /TRY AGAIN|RESTART/ })
  .click()
  .catch(() => {})
await page.waitForTimeout(500)
await inject(buffed(29))
await tapBattle()
await attackUntil('CONGRATULATIONS', 60)
await page.waitForTimeout(800)
await shot('15-win')

await browser.close()
server.kill()
process.exit(0)
