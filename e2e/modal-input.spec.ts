import { test, expect } from '@playwright/test'
import { buffedSave, continueFromSave, GAME_VIEWPORT, tapToBattle } from './helpers'
import { drainOverlays, readOfficeSave, startFreshOffice } from './office-helpers'

test.use({ viewport: GAME_VIEWPORT })

test('Settings owns focus and never walks, interacts or dismisses Office dialogue', async ({
  page,
}) => {
  await startFreshOffice(page)
  await drainOverlays(page)
  const before = await readOfficeSave(page)
  const trigger = page.getByRole('button', { name: 'Settings', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Settings' })
  await expect(page.locator('#settings-music')).toBeFocused()
  const volume = Number(await page.locator('#settings-music').inputValue())
  await page.keyboard.press('ArrowRight')
  await expect(page.locator('#settings-music')).toHaveValue(String(volume + 1))
  for (const key of ['a', 'e', 'p', '1', 'ArrowDown']) await page.keyboard.press(key)
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press('Tab')
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }
  const after = await readOfficeSave(page)
  expect(after?.player).toEqual(before?.player)
  expect(after?.continuation).toEqual(before?.continuation)
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()
  await expect(trigger).toBeFocused()
  await page.keyboard.press('ArrowLeft')
  await expect.poll(async () => (await readOfficeSave(page))?.player).not.toEqual(before?.player)
})

for (const panel of ['Settings', 'Career profile']) {
  test(`${panel} blocks combat shortcuts and restores the battle`, async ({ page }) => {
    await continueFromSave(page, buffedSave(0))
    await tapToBattle(page)
    const move = page.getByRole('button').filter({ hasText: 'PWR' }).first()
    await expect(move).toBeEnabled()
    const before = await page.locator('#root').innerText()
    await page.getByRole('button', { name: panel, exact: true }).click()
    await expect(page.getByRole('dialog', { name: panel })).toBeVisible()
    for (const key of ['1', '2', '3', '4', '5', 'Tab']) await page.keyboard.press(key)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog', { name: panel })).toBeHidden()
    expect(await page.locator('#root').innerText()).toBe(before)
    await expect(move).toBeEnabled()
    await page.keyboard.press('1')
    await expect(page.locator('#root')).not.toHaveText(before)
  })
}

test('a failed Office save is visible and can be retried without losing the run', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (key, value) {
      if (key === 'corporate-climb-office-save' && !sessionStorage.getItem('allow-save'))
        throw new DOMException('Full', 'QuotaExceededError')
      original.call(this, key, value)
    }
  })
  await startFreshOffice(page)
  const notice = page.getByRole('alert', { name: 'Progress could not be saved' })
  await expect(notice).toBeVisible()
  await page.evaluate(() => sessionStorage.setItem('allow-save', '1'))
  await page.getByRole('button', { name: 'RETRY SAVE' }).click()
  await expect(notice).toBeHidden()
  expect((await readOfficeSave(page))?.run.classId).toBe('pm')
})
