import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, tapToBattle, attackUntil } from './helpers'

/**
 * The roguelite mid-act stop: winning floor 5 (index 4) chains the
 * promotion (pick-1-of-3 perk) into the Company Store, and leaving the
 * store lands on the route choice.
 */
test.use({ viewport: GAME_VIEWPORT })

test('floor 5 win chains perk choice and the shop', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await continueFromSave(page, buffedSave(4, { playerHp: 140 }))
  await tapToBattle(page)

  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })
  // Stock Options are paid out on the victory screen.
  await expect(page.getByText(/STOCK OPTIONS/)).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // Promotion: pick the first offered perk.
  await expect(page.getByText('PROMOTED')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('CHOOSE A PERK')).toBeVisible({ timeout: 10_000 })
  await page.locator('button').filter({ hasText: '[1]' }).click({ timeout: 5_000 })

  // The Company Store: balance is visible, then leave for the hallway.
  await expect(page.getByText('THE COMPANY STORE')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/BALANCE:/)).toBeVisible({ timeout: 5_000 })
  await page.getByRole('button', { name: /BACK TO WORK/ }).click({ timeout: 5_000 })

  await expect(page.getByText('CHOOSE YOUR PATH')).toBeVisible({ timeout: 10_000 })

  expect(pageErrors, 'no uncaught page errors through the shop chain').toEqual([])
})
