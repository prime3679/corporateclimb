import { test, expect } from '@playwright/test'

/**
 * Regression test: losing a battle reaches the Game Over screen cleanly.
 *
 * Exercises the player-death path in doEnemyTurn — the branch that must NOT
 * hand the turn back to a 0-HP player (which would let a dead player act, or
 * race victory against game over). A deliberately weak save at a tough floor
 * makes the enemy one-shot the player within a turn or two.
 */
test.use({ viewport: { width: 440, height: 760 } })

const DOOMED_SAVE = {
  classId: 'pm',
  floor: 8,
  level: 1,
  xp: 0,
  xpToNext: 30,
  playerHp: 8,
  playerPp: [5, 5, 5, 5],
  atkBuff: 0,
  defBuff: 0,
  usedEvents: [],
  inventory: [],
}

test('losing a battle reaches Game Over without a dead-player turn', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await page.evaluate((save) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-save', JSON.stringify(save))
  }, DOOMED_SAVE)
  await page.reload()

  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  const gameOver = page.getByText('GAME OVER')
  const victory = page.getByText('VICTORY')

  // Attack until we die. The weak save can't win, so this only ends in defeat.
  for (let round = 0; round < 40; round++) {
    if (await gameOver.isVisible().catch(() => false)) break
    const move = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await move.isVisible().catch(() => false)) {
      await move.click({ timeout: 2_500 }).catch(() => {})
    }
    await page.waitForTimeout(400)
  }

  await expect(gameOver).toBeVisible({ timeout: 10_000 })
  // A doomed run must never slip into a victory.
  await expect(victory).toBeHidden()
  expect(pageErrors, 'no uncaught page errors on the death path').toEqual([])
})
