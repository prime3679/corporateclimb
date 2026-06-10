import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, tapToBattle, attackUntil } from './helpers'

/**
 * Regression test: the promotion -> act-transition chain.
 *
 * Winning floor 9 as PM promotes to Director of Product (floor 10) AND crosses
 * into Act 2, so both interstitial screens chain back-to-back. This exact path
 * once crashed at runtime (a setter referencing deleted state) and nothing
 * covered it — the smoke test stops at the first battle.
 */
test.use({ viewport: GAME_VIEWPORT })

test('floor 9 win chains promotion and act 2 screens', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await continueFromSave(page, buffedSave(9, { playerHp: 140 }))
  await tapToBattle(page)

  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // Promotion screen (Senior PM -> Director of Product), then Act 2.
  await expect(page.getByText('PROMOTED')).toBeVisible({ timeout: 10_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  await expect(page.getByText('MANAGEMENT')).toBeVisible({ timeout: 10_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  // Lands on the floor-10 route choice.
  await expect(page.getByText('CHOOSE YOUR PATH')).toBeVisible({ timeout: 10_000 })

  expect(pageErrors, 'no uncaught page errors through the transition chain').toEqual([])
})
