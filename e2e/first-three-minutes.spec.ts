import { test, expect } from '@playwright/test'

test('first three minutes present a stronger hook and clearer choices', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  await expect(
    page.getByText('THREE ACTS. THIRTY FLOORS. ONE BADGE SWIPE FROM GLORY.'),
  ).toBeVisible({
    timeout: 15_000,
  })
  await expect(
    page.getByText(
      'Pick a role, exploit type matchups, and expense your way past managers before burnout catches you.',
    ),
  ).toBeVisible()

  await page.getByRole('button', { name: 'START CLIMB' }).click()
  await expect(page.getByText('SELECT CAREER ARCHETYPE')).toBeVisible({ timeout: 10_000 })
})

test('daily first battle has mobile-friendly commands and satisfying hit feedback', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
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
