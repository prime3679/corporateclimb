import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, attackUntil } from './helpers'

/**
 * The Supply Closet: on scheduled floors (7/17/27 on the plaques) the
 * elevator bank grows a fourth door. Raiding it fights the standard
 * enemy for half payout, and the win opens a pick-1-of-3 supply cache.
 */
test.use({ viewport: GAME_VIEWPORT })

test('the supply closet raid pays out a supply cache', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  // Floor index 6 is the act-1 treasure floor.
  await continueFromSave(page, buffedSave(6, { playerHp: 200 }))

  // The bank shows the extra door only on scheduled floors.
  await expect(page.getByText('THE ELEVATOR BANK')).toBeVisible({ timeout: 12_000 })
  await page.getByRole('button', { name: /THE SUPPLY CLOSET/ }).click({ timeout: 5_000 })

  // The raid is announced before the (standard) fight.
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText('SUPPLY RAID')).toBeVisible()
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: /CONTINUE/ }).click({ timeout: 5_000 })

  // The cache: pick one of three items, then the between-floor flow
  // resumes (no promotion or shop between floors 7 and 8, so the next
  // stop is the hallway route choice).
  await expect(page.getByText('THE SUPPLY CLOSET')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole('button', { name: /LEAVE IT/ })).toBeVisible()
  await page.getByRole('button', { name: /\[1\]/ }).click({ timeout: 5_000 })
  await expect(page.getByText('CHOOSE YOUR PATH')).toBeVisible({ timeout: 12_000 })

  expect(pageErrors, 'no uncaught page errors through the treasure chain').toEqual([])
})

test('ordinary floors keep a three-door bank', async ({ page }) => {
  test.setTimeout(60_000)

  await continueFromSave(page, buffedSave(5, { playerHp: 200 }))

  await expect(page.getByText('THE ELEVATOR BANK')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByRole('button', { name: /MYSTERY FLOOR/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /THE SUPPLY CLOSET/ })).toHaveCount(0)
})
