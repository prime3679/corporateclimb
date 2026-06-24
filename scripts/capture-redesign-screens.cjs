const { chromium } = require('@playwright/test')
const fs = require('fs')
const path = require('path')

const BASE_URL = process.env.CAPTURE_BASE_URL || 'http://127.0.0.1:4173'
const OUT_DIR = process.env.CAPTURE_OUT_DIR || 'artifacts/mobile-rpg-motion-pass'
const VIEWPORT = {
  width: Number(process.env.CAPTURE_WIDTH || 390),
  height: Number(process.env.CAPTURE_HEIGHT || 844),
}

const saveKey = 'corporate-climb-save'
const settingsKey = 'corporate-climb-settings'

function buffedSave(floor, overrides = {}) {
  return {
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
    ...overrides,
  }
}

async function waitForAnyText(page, patterns, timeout = 15000) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    for (const pattern of patterns) {
      const locator = page.getByText(pattern)
      if (
        await locator
          .first()
          .isVisible()
          .catch(() => false)
      )
        return pattern.toString()
    }
    await page.waitForTimeout(100)
  }
  throw new Error(`Timed out waiting for any text: ${patterns.map(String).join(', ')}`)
}

async function settle(page, ms = 900) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
}

async function shot(page, name, settleMs = 900) {
  await settle(page, settleMs)
  await page.screenshot({ path: path.join(OUT_DIR, `${name}.png`), fullPage: true })
}

async function loadFresh(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.evaluate(
    ([saveKey, settingsKey]) => {
      localStorage.clear()
      localStorage.setItem(
        settingsKey,
        JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
      )
    },
    [saveKey, settingsKey],
  )
  await page.reload({ waitUntil: 'networkidle' })
}

async function continueFromSave(page, save) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  await page.evaluate(
    ([saveKey, settingsKey, save]) => {
      localStorage.clear()
      localStorage.setItem(saveKey, JSON.stringify(save))
      localStorage.setItem(
        settingsKey,
        JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
      )
    },
    [saveKey, settingsKey, save],
  )
  await page.reload({ waitUntil: 'networkidle' })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15000 })
}

async function tapToBattle(page) {
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12000 })
  await page.locator('#root').click({ position: { x: Math.min(220, VIEWPORT.width - 20), y: 380 } })
}

async function attackOnce(page) {
  const move = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
  await move.click({ timeout: 8000 })
}

async function attackUntil(page, target, rounds = 40) {
  const goal = page.getByText(target)
  for (let i = 0; i < rounds; i++) {
    if (await goal.isVisible().catch(() => false)) return
    const move = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await move.isVisible().catch(() => false))
      await move.click({ timeout: 2500 }).catch(() => {})
    await page.waitForTimeout(450)
  }
  await goal.waitFor({ timeout: 5000 })
}

async function clickPlayableButton(page, textHint) {
  if (textHint) {
    const hinted = page.getByRole('button', { name: textHint }).first()
    if (await hinted.isVisible().catch(() => false)) return hinted.click()
  }
  const btns = page.locator('button')
  const n = await btns.count()
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i)
    if (!(await b.isVisible().catch(() => false))) continue
    const text = (await b.textContent().catch(() => '')) || ''
    if (/🔊|🔇|⚙️|💼/.test(text)) continue
    await b.click({ timeout: 3000 }).catch(() => {})
    return
  }
  throw new Error('No playable button found')
}

async function makeContactSheet() {
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.png'))
    .sort()
  const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#111;color:white;font:12px system-ui}.grid{display:grid;grid-template-columns:repeat(3,390px);gap:16px;padding:16px}.card{background:#222;padding:8px}.card img{width:390px;height:auto;display:block}.label{margin-bottom:6px}</style><div class="grid">${files.map((f) => `<div class="card"><div class="label">${f}</div><img src="${f}"></div>`).join('')}</div>`
  fs.writeFileSync(path.join(OUT_DIR, 'contact-sheet.html'), html)
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: path.join(OUT_DIR, 'videos'), size: VIEWPORT },
  })
  const page = await context.newPage()

  await loadFresh(page)
  await waitForAnyText(page, [/START CLIMB/i, /DAILY CHALLENGE/i])
  await shot(page, '01-title')
  await page.getByRole('button', { name: /START CLIMB|NEW CLIMB/i }).click()
  await waitForAnyText(page, [/PRODUCT MANAGER/i, /ENGINEER/i, /DESIGNER/i])
  await shot(page, '02-class-select')
  await page.getByRole('button', { name: /PRODUCT MANAGER/i }).click()
  await page.getByRole('button', { name: /ACCEPT OFFER/i }).click()
  await waitForAnyText(page, [/TAP TO BATTLE/i])
  await shot(page, '03-floor-intro')
  await tapToBattle(page)
  await waitForAnyText(page, [/FIGHT/i])
  await shot(page, '04-battle-idle')
  await attackOnce(page)
  await page.waitForTimeout(140)
  await page.screenshot({ path: path.join(OUT_DIR, '05a-battle-attack-lunge.png'), fullPage: true })
  await page.waitForTimeout(240)
  await page.screenshot({ path: path.join(OUT_DIR, '05b-battle-hit-flash.png'), fullPage: true })
  await page.waitForTimeout(170)
  await page.screenshot({ path: path.join(OUT_DIR, '05c-battle-damage-pop.png'), fullPage: true })

  await continueFromSave(page, buffedSave(4, { playerHp: 160 }))
  await tapToBattle(page)
  await attackUntil(page, 'VICTORY')
  await waitForAnyText(page, [/VICTORY/i])
  await shot(page, '06-victory')
  await page.getByRole('button', { name: /CONTINUE/i }).click()
  await waitForAnyText(page, [/PROMOTED/i, /CHOOSE A PERK/i])
  await shot(page, '07-promotion-settled', 1700)
  await page.locator('button').filter({ hasText: '[1]' }).click({ timeout: 5000 })
  await waitForAnyText(page, [/THE COMPANY STORE/i])
  await shot(page, '08-shop-real')
  await page.getByRole('button', { name: /BACK TO WORK/i }).click()
  await waitForAnyText(page, [/CHOOSE YOUR PATH/i])
  await shot(page, '09-route-choice')

  await continueFromSave(page, buffedSave(1, { usedEvents: [] }))
  await waitForAnyText(page, [/TAP TO BATTLE/i])
  await shot(page, '10-elevator-or-floor-intro')

  await continueFromSave(page, buffedSave(6, { usedEvents: [] }))
  await waitForAnyText(page, [/CHOOSE YOUR PATH/i, /TAP TO BATTLE/i, /THE ELEVATOR BANK/i])
  if (
    await page
      .getByText('CHOOSE YOUR PATH')
      .isVisible()
      .catch(() => false)
  )
    await shot(page, '11-route-choice-later')
  else if (
    await page
      .getByText('THE ELEVATOR BANK')
      .isVisible()
      .catch(() => false)
  )
    await shot(page, '11-elevator')
  else await shot(page, '11-floor-intro-later')

  await continueFromSave(page, buffedSave(7, { usedEvents: [] }))
  await waitForAnyText(page, [/CHOOSE YOUR PATH/i, /TAP TO BATTLE/i, /THE ELEVATOR BANK/i])
  if (
    await page
      .getByText('CHOOSE YOUR PATH')
      .isVisible()
      .catch(() => false)
  ) {
    await clickPlayableButton(page)
    await waitForAnyText(page, [/TAP TO BATTLE/i, /POLICY|AUDIT|MENTOR|EVENT|STAKEHOLDER/i])
  }
  await shot(page, '12-hallway-event-or-floor-intro')

  await page
    .getByRole('button', { name: /CAREER/i })
    .click()
    .catch(async () => page.locator('button').filter({ hasText: '💼' }).click())
  await waitForAnyText(page, [/CAREER/i, /STOCK OPTIONS/i])
  await shot(page, '13-career-modal')

  await continueFromSave(page, buffedSave(29, { playerHp: 1, atkBuff: 0, defBuff: 0, level: 1 }))
  await tapToBattle(page)
  for (let i = 0; i < 12; i++) {
    if (
      await page
        .getByText('GAME OVER')
        .isVisible()
        .catch(() => false)
    )
      break
    await attackOnce(page).catch(() => {})
    await page.waitForTimeout(600)
  }
  await waitForAnyText(page, [/GAME OVER/i])
  await shot(page, '14-game-over')

  await makeContactSheet()
  await context.close()
  await browser.close()
  console.log(`Captured ${OUT_DIR} at ${VIEWPORT.width}x${VIEWPORT.height}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
