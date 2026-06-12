import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, buffedSave, continueFromSave, attackUntil } from './helpers'

/**
 * The elevator bank: from floor 5 (where elites unlock) the player can
 * ride the Executive Track into an ELITE fight, and beating it drops a
 * Status Symbol on the victory screen.
 */
test.use({ viewport: GAME_VIEWPORT })

test('executive track fights an elite and drops a status symbol', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await continueFromSave(page, buffedSave(5, { playerHp: 200 }))

  // Resuming on an elite-eligible floor re-offers the elevator.
  await expect(page.getByText('THE ELEVATOR BANK')).toBeVisible({ timeout: 12_000 })
  await page.getByRole('button', { name: /EXECUTIVE TRACK/ }).click({ timeout: 5_000 })

  // The floor intro and battle face the scaled-up elite.
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/ELITE/).first()).toBeVisible()
  await page.locator('#root').click({ position: { x: 220, y: 380 } })

  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('STATUS SYMBOL!')).toBeVisible({ timeout: 5_000 })

  expect(pageErrors, 'no uncaught page errors through the elite chain').toEqual([])
})

test('mystery floor reveals its outcome at the floor intro', async ({ page }) => {
  test.setTimeout(60_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await continueFromSave(page, buffedSave(5, { playerHp: 200 }))

  await expect(page.getByText('THE ELEVATOR BANK')).toBeVisible({ timeout: 12_000 })
  await page.getByRole('button', { name: /MYSTERY FLOOR/ }).click({ timeout: 5_000 })

  // Whatever was rolled, the gamble is revealed before the fight.
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 12_000 })
  await expect(page.getByText(/WINDFALL|SLACKER|AMBUSH|JACKPOT/)).toBeVisible()

  expect(pageErrors, 'no uncaught page errors through the mystery chain').toEqual([])
})
