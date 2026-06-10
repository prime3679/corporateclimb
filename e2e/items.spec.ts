import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, tapToBattle } from './helpers'

/**
 * Item use in battle (the useItem path): using an item heals, logs the effect,
 * consumes a turn, and removes the item from the inventory.
 */
test.use({ viewport: GAME_VIEWPORT })

test('using an item heals and is consumed', async ({ page }) => {
  test.setTimeout(60_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // Low HP + one Espresso Shot (heals 30). High DEF (default) keeps the enemy's
  // counterattack to ~1 so the player survives to act again. atkBuff 0 so we
  // never accidentally end the fight — we only ever use the item.
  await continueFromSave(page, buffedSave(2, { playerHp: 30, atkBuff: 0, inventory: ['espresso'] }))
  await tapToBattle(page)

  const itemsTab = page.getByRole('button', { name: /ITEMS/ })
  await expect(itemsTab).toBeVisible({ timeout: 10_000 })
  await expect(itemsTab).toContainText('1') // inventory badge

  await itemsTab.click()
  const espresso = page.getByRole('button', { name: /Espresso Shot/ })
  await expect(espresso).toBeVisible({ timeout: 5_000 })
  await espresso.click()

  // The heal effect is logged.
  await expect(page.getByText(/Restored 30 HP/)).toBeVisible({ timeout: 5_000 })

  // After the enemy's turn the player acts again, and the item is gone.
  await expect(page.getByRole('button', { name: 'FIGHT' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /ITEMS/ }).click()
  await expect(page.getByText('No items')).toBeVisible({ timeout: 5_000 })

  expect(pageErrors, 'no uncaught page errors using an item').toEqual([])
})
