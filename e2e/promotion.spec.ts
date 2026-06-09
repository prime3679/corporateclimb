import { test, expect } from '@playwright/test'

/**
 * Regression test: the promotion → act-transition flow.
 *
 * Winning floor 9 as PM promotes to Director of Product (floor 10) AND
 * crosses into Act 2, so both interstitial screens chain back-to-back.
 * This exact path once crashed at runtime (a setter referencing deleted
 * state) and nothing covered it — the smoke test stops at the first
 * battle. Drives it with a save injected at floor 9 and a stat buff
 * large enough to win the fight in one or two hits.
 */
test.use({ viewport: { width: 440, height: 760 } })

const FLOOR_9_SAVE = {
  classId: 'pm',
  floor: 9,
  level: 25,
  xp: 0,
  xpToNext: 100_000,
  playerHp: 140,
  playerPp: [40, 40, 40, 40],
  atkBuff: 220,
  defBuff: 80,
  usedEvents: [],
  inventory: [],
}

test('floor 9 win chains promotion and act 2 screens', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await page.evaluate((save) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-save', JSON.stringify(save))
  }, FLOOR_9_SAVE)
  await page.reload()

  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })

  // Floor intro for floor 9 — the whole screen is the tap target.
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  // Battle: click the first enabled move until the victory screen shows.
  // The buffed save one-shots most floor-9 variants; allow a few rounds.
  const victory = page.getByText('VICTORY')
  for (let round = 0; round < 30; round++) {
    if (await victory.isVisible().catch(() => false)) break
    const move = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await move.isVisible().catch(() => false)) {
      await move.click({ timeout: 2_500 }).catch(() => {})
    }
    await page.waitForTimeout(400)
  }
  await expect(victory).toBeVisible({ timeout: 10_000 })

  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // Promotion screen (Senior PM → Director of Product), then Act 2.
  await expect(page.getByText('PROMOTED')).toBeVisible({ timeout: 10_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  await expect(page.getByText('MANAGEMENT')).toBeVisible({ timeout: 10_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  // Lands on the floor-10 route choice.
  await expect(page.getByText('CHOOSE YOUR PATH')).toBeVisible({ timeout: 10_000 })

  expect(pageErrors, 'no uncaught page errors through the transition chain').toEqual([])
})
