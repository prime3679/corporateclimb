import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave } from './helpers'

/**
 * The career profile overlay: visible during a run, it shows the current
 * title, the grandfathered perks from the save migration, and the Stock
 * Options balance — then closes back to the underlying screen.
 */
test.use({ viewport: GAME_VIEWPORT })

test('career profile shows title, perks, and balance mid-run', async ({ page }) => {
  test.setTimeout(60_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // A v1-shaped save at floor 9: migration grants one Total Comp Package
  // (the floor-5 promotion already passed) and the floors' payouts.
  await continueFromSave(page, buffedSave(9))
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 12_000 })

  await page.getByRole('button', { name: 'Career profile' }).click({ timeout: 5_000 })

  await expect(page.getByText('CAREER PROFILE')).toBeVisible({ timeout: 5_000 })
  await expect(page.getByText('Senior PM')).toBeVisible() // floor 9 title
  await expect(page.getByText('Total Comp Package')).toBeVisible()
  await expect(page.getByText(/PERKS \(1\)/)).toBeVisible()

  await page.getByRole('button', { name: 'BACK' }).click({ timeout: 5_000 })
  await expect(page.getByText('CAREER PROFILE')).not.toBeVisible()
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible()

  expect(pageErrors, 'no uncaught page errors using the career profile').toEqual([])
})
