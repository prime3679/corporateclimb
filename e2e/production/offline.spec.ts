import { test, expect } from '@playwright/test'
import { readFileSync, writeFileSync } from 'node:fs'
import { readOfficeSave, startFreshOffice } from '../office-helpers'

test.use({ viewport: { width: 390, height: 844 } })

test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return
  console.log(
    '[production-failure]',
    await page
      .locator('body')
      .innerText()
      .catch(() => 'No page'),
  )
})

test('first Office visit works offline, with all artwork and a resumable reward', async ({
  page,
  context,
}, info) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible()
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  // Prove the installed worker can boot the app without the browser HTTP cache.
  const network = await context.newCDPSession(page)
  await network.send('Network.clearBrowserCache')
  await network.detach()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible()
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible()
  const before = await readOfficeSave(page)
  const art = await page.evaluate(async () => {
    const keys = await caches.keys()
    const cache = await caches.open(keys.find((key) => key.startsWith('corporate-climb-'))!)
    const urls = (await cache.keys())
      .map((req) => req.url)
      .filter((url) => new URL(url).pathname.startsWith('/office/'))
    return Promise.all(
      urls.map(
        (url) =>
          new Promise<{ url: string; width: number }>((resolve, reject) => {
            const img = new Image()
            img.onload = () => resolve({ url, width: img.naturalWidth })
            img.onerror = () => reject(new Error(`Missing offline artwork: ${url}`))
            img.src = url
          }),
      ),
    )
  })
  expect(art.length).toBeGreaterThanOrEqual(20)
  expect(art.every((img) => img.width > 0)).toBe(true)
  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('button', { name: 'CONTINUE', exact: true }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible()
  expect((await readOfficeSave(page))?.run.stockOptions).toBe(before?.run.stockOptions)
  await page.getByRole('button', { name: 'File it' }).click()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible()
  await expect(page.getByLabel('10 Stock Options', { exact: true })).toBeVisible()
  await page.screenshot({ path: info.outputPath('office-offline-phone.png') })
  expect(errors).toEqual([])
})

test('a service-worker update preserves the Office save and unrelated caches', async ({
  page,
}, info) => {
  await startFreshOffice(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    await caches.open('unrelated-data')
  })
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
  const before = await readOfficeSave(page)
  const file = 'dist/sw.js'
  const original = readFileSync(file, 'utf8')
  try {
    writeFileSync(
      file,
      original.replace(/const VERSION = '[^']*'/, "const VERSION = 'upgrade-verification'"),
    )
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready
      await reg.update()
    })
    await expect
      .poll(() => page.evaluate(() => caches.keys()))
      .toContain('corporate-climb-upgrade-verification')
    await expect
      .poll(() =>
        page.evaluate(
          async () => (await caches.keys()).filter((k) => k.startsWith('corporate-climb-')).length,
        ),
      )
      .toBe(1)
    await page.reload()
    await page.getByRole('button', { name: 'THE OFFICE' }).click()
    await page.getByRole('button', { name: 'CONTINUE', exact: true }).click()
    await expect(page.getByText('Floor 1 · of 5')).toBeVisible()
    expect((await readOfficeSave(page))?.player).toEqual(before?.player)
    expect(await page.evaluate(() => caches.keys())).toContain('unrelated-data')
    await page.screenshot({ path: info.outputPath('office-after-update.png') })
  } finally {
    writeFileSync(file, original)
  }
})
