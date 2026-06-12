import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT } from './helpers'

/**
 * The Codex: browsable collection with achievement-gated unlocks shown
 * as locked silhouettes plus their unlock hints.
 */
test.use({ viewport: GAME_VIEWPORT })

test('codex lists content with locked unlockables and hints', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
    )
  })
  await page.reload()

  await page.getByRole('button', { name: /CODEX/ }).click({ timeout: 15_000 })
  await expect(page.getByText('THE CODEX')).toBeVisible({ timeout: 5_000 })

  // Base content is visible; gated content is a locked silhouette with a hint.
  await expect(page.getByText('Gym Membership')).toBeVisible()
  await expect(page.getByText('???').first()).toBeVisible()
  await expect(page.getByText(/Unlock: First Day/).first()).toBeVisible()

  await page.getByRole('button', { name: 'BACK' }).click({ timeout: 5_000 })
  await expect(page.getByText('DAILY CHALLENGE')).toBeVisible({ timeout: 5_000 })
})
