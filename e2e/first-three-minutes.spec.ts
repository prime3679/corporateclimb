import { test, expect } from '@playwright/test'

test('first three minutes present a stronger hook and clearer choices', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(
    page.getByText('RECEPTION TO THE BOARD. FIVE FLOORS. ONE BADGE SWIPE FROM GLORY.'),
  ).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByText(
      'Pick a role, work the floor, build your team, and out-battle every manager between you and the board.',
    ),
  ).toBeVisible()

  // Office-first: THE OFFICE is the hero CTA, Classic sits below it as a
  // labelled secondary path and stays one tap away.
  const office = page.getByRole('button', { name: 'THE OFFICE' })
  const classic = page.getByRole('button', { name: 'START CLIMB' })
  await expect(page.getByText('CAMPAIGN · FLOORS 1–5')).toBeVisible()
  await expect(page.getByText('CLASSIC · 30 FLOORS')).toBeVisible()
  const [officeBox, classicBox] = await Promise.all([office.boundingBox(), classic.boundingBox()])
  expect(officeBox).not.toBeNull()
  expect(classicBox).not.toBeNull()
  expect(officeBox!.y).toBeLessThan(classicBox!.y)
  expect(officeBox!.width).toBeGreaterThan(classicBox!.width)
  expect(officeBox!.height).toBeGreaterThan(classicBox!.height)

  await classic.click()
  await expect(page.getByText('SELECT CAREER ARCHETYPE')).toBeVisible({ timeout: 10_000 })
})

test('daily first battle has mobile-friendly commands and satisfying hit feedback', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    // Today's daily enemy types vary by date, so whether the type-matchup
    // coach-mark applies here is nondeterministic — pre-dismiss it and
    // leave hint behavior to e2e/onboarding.spec.ts.
    localStorage.setItem('corporate-climb-seen-hint', '1')
  })
  await page.reload()

  await page.getByRole('button', { name: 'DAILY CHALLENGE' }).click()
  await page.getByRole('button', { name: 'BEGIN CHALLENGE' }).click()
  await expect(page.getByText('TAP TO BATTLE')).toBeVisible({ timeout: 10_000 })
  await page.locator('#root').click()

  const fightTab = page.getByRole('button', { name: 'FIGHT' })
  await expect(fightTab).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText('TAP A MOVE')).toBeVisible()

  const firstMove = page.locator('[data-testid="move-button"]').first()
  await expect(firstMove).toBeVisible()
  await firstMove.click()

  await expect(page.getByText(/NICE HIT|Super effective!|Not effective\.\.\./)).toBeVisible({
    timeout: 2_000,
  })
})
