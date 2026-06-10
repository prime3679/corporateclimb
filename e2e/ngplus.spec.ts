import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, tapToBattle, attackUntil } from './helpers'

/**
 * Winning the final floor reaches the victory/win screen, and "NEW GAME+"
 * starts a fresh run (the startNgPlus path).
 */
test.use({ viewport: GAME_VIEWPORT })

test('clearing the final floor wins the game and starts New Game+', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // Floor index 29 is the last of 30; winning it ends the run.
  await continueFromSave(page, buffedSave(29))
  await tapToBattle(page)

  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // Win screen.
  await expect(page.getByText('CONGRATULATIONS')).toBeVisible({ timeout: 10_000 })
  const ngPlusBtn = page.getByRole('button', { name: /NEW GAME\+/ })
  await expect(ngPlusBtn).toBeVisible()
  await ngPlusBtn.click()

  // NG+ drops back into a fresh run at the first floor.
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('CONGRATULATIONS')).toBeHidden()

  expect(pageErrors, 'no uncaught page errors winning + NG+').toEqual([])
})
