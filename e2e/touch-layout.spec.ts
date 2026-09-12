import { test, expect } from '@playwright/test'
import { drainOverlays, startFreshOffice } from './office-helpers'

for (const viewport of [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
]) {
  test(`Office controls remain comfortable at ${viewport.width}px`, async ({ page }, info) => {
    await page.setViewportSize(viewport)
    await startFreshOffice(page)
    await drainOverlays(page)
    for (const name of [
      'Mute sound',
      'Settings',
      'Move up',
      'Move down',
      'Move left',
      'Move right',
      'Team',
      'Title',
    ]) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox()
      expect(box, name).not.toBeNull()
      expect(box!.height, `${name} height`).toBeGreaterThanOrEqual(43.5)
      expect(box!.width, `${name} width`).toBeGreaterThanOrEqual(43.5)
      expect(box!.y + box!.height, name).toBeLessThanOrEqual(viewport.height + 1)
    }
    const ticket = await page.getByLabel('Objective').boundingBox()
    const sound = await page.getByRole('button', { name: 'Mute sound' }).boundingBox()
    expect(ticket!.x + ticket!.width).toBeLessThanOrEqual(sound!.x)
    await page.screenshot({ path: info.outputPath('office-phone.png') })
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('button', { name: 'DONE', exact: true }).scrollIntoViewIfNeeded()
    const done = await page.getByRole('button', { name: 'DONE', exact: true }).boundingBox()
    expect(done!.y).toBeGreaterThanOrEqual(0)
    expect(done!.y + done!.height).toBeLessThanOrEqual(viewport.height)
    await page.screenshot({ path: info.outputPath('settings-phone.png') })
    await page.getByRole('button', { name: 'DONE', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused()
  })
}
