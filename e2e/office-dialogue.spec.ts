import { expect, test } from '@playwright/test'

async function advanceDialogue(page: import('@playwright/test').Page, times = 8) {
  for (let i = 0; i < times; i += 1) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(20)
  }
}

test('office preview dialogue advances without crashing and objective survives reload', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({
        textSpeed: 'instant',
        musicVolume: 0,
        sfxVolume: 0,
        haptics: false,
        reduceMotion: true,
      }),
    )
  })
  await page.reload()

  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'File it' }).click({ timeout: 15_000 })

  await page.keyboard.press('ArrowDown')
  if (
    await page
      .getByText('New hire. Front desk. Now.')
      .isVisible()
      .catch(() => false)
  ) {
    await page.keyboard.press('Enter')
  }
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('KeyE')
  await advanceDialogue(page, 8)

  await expect(page.getByText('OUT OF OFFICE')).toHaveCount(0)
  await expect(page.getByText('Get toner from the supply cabinet')).toBeVisible({ timeout: 10_000 })

  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })

  await expect(page.getByText('OUT OF OFFICE')).toHaveCount(0)
  await expect(page.getByText('Get toner from the supply cabinet')).toBeVisible({ timeout: 10_000 })
})
