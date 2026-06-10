import { test, expect } from '@playwright/test'
import {
  GAME_VIEWPORT,
  buffedSave,
  continueFromSave,
  tapToBattle,
  attackUntil,
  clickNonMuteButton,
} from './helpers'

/**
 * The between-floors flow: route choice -> hallway event -> apply choice ->
 * next floor (handleRoutePick + handleEventChoice). Event content is
 * RNG-picked, so this asserts the flow structurally.
 */
test.use({ viewport: GAME_VIEWPORT })

test('route choice and hallway event lead into the next floor', async ({ page }) => {
  test.setTimeout(90_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // Floor 1 -> floor 2 has no promotion or act change, so the route/hallway
  // flow runs instead of an interstitial.
  await continueFromSave(page, buffedSave(1))
  await tapToBattle(page)

  await attackUntil(page, 'VICTORY')
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // Route choice -> pick a path.
  await expect(page.getByText('CHOOSE YOUR PATH')).toBeVisible({ timeout: 10_000 })
  await clickNonMuteButton(page)
  await expect(page.getByText('CHOOSE YOUR PATH')).toBeHidden({ timeout: 5_000 })

  // Hallway event -> choose -> the result's CONTINUE advances to the next floor.
  await clickNonMuteButton(page)
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 8_000 })

  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 10_000 })

  expect(pageErrors, 'no uncaught page errors through route + hallway').toEqual([])
})
