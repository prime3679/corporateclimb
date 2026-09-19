import { test, expect, type Page } from '@playwright/test'
import { drainOverlays, readClassicSave, readOfficeSave } from './office-helpers'

/** Like startFreshOffice, but motion stays on so the camera tween is real. */
async function startOfficeWithMotion(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({
        textSpeed: 'instant',
        musicVolume: 0,
        sfxVolume: 0,
        reduceMotion: false,
        haptics: false,
      }),
    )
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 15_000 })
  expect(await readClassicSave(page)).toBeNull()
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('radio', { name: 'Product Manager' }).click()
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 10_000 })
}

// Phone column: 14-tile camera follows on both axes. Desktop Chrome is the
// only Playwright project; we pin a mobile viewport so the walk clock and
// camera lockstep are exercised the way a thumb uses the D-pad.
test.use({ viewport: { width: 390, height: 844 } })

test('Office D-pad hold walks at tile cadence without scrolling the phone stage', async ({
  page,
}) => {
  await startOfficeWithMotion(page)
  await drainOverlays(page)
  // First step opens Renata's callout; drain so the hold is not swallowed.
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(320)
  await drainOverlays(page)

  const before = await readOfficeSave(page)
  expect(before, 'office save after first step').not.toBeNull()
  expect(before!.player.x).toBeGreaterThanOrEqual(12)

  const map = page.getByTestId('office-map')
  const camera = page.getByTestId('office-camera')
  await expect(map).toBeVisible()

  const feel = await page.evaluate(() => {
    const mapEl = document.querySelector('[data-testid="office-map"]') as HTMLElement | null
    const camEl = document.querySelector('[data-testid="office-camera"]') as HTMLElement | null
    if (!mapEl || !camEl) return null
    const mapStyle = getComputedStyle(mapEl)
    const camStyle = getComputedStyle(camEl)
    return {
      mapTouch: mapStyle.touchAction,
      camDuration: camStyle.transitionDuration,
      camTiming: camStyle.transitionTimingFunction,
      camTransform: camStyle.transform,
    }
  })
  expect(feel, 'map/camera styles').not.toBeNull()
  expect(feel!.mapTouch).toBe('none')
  expect(feel!.camDuration).toMatch(/0\.25s|250ms/)
  expect(feel!.camTiming).toMatch(/linear/)

  const pad = page.getByRole('button', { name: 'Move right', exact: true })
  const box = await pad.boundingBox()
  expect(box, 'Move right').not.toBeNull()
  const x = box!.x + box!.width / 2
  const y = box!.y + box!.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  // Drift off the pad — pointer capture must keep the hold (old pointerleave
  // cancelled walks when a thumb slid a few pixels).
  await page.mouse.move(x + 12, y + 18)
  await page.waitForTimeout(900)
  await page.mouse.up()

  const after = await readOfficeSave(page)
  expect(after, 'office save after hold').not.toBeNull()
  expect(
    after!.player.x - before!.player.x,
    'hold should cover more than one tile',
  ).toBeGreaterThanOrEqual(2)
  expect(after!.player.y).toBe(before!.player.y)

  const scroll = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="stage"]') as HTMLElement | null
    const backdrop = stage?.parentElement
    return {
      left: backdrop?.scrollLeft ?? -1,
      top: backdrop?.scrollTop ?? -1,
      stageLeft: stage?.scrollLeft ?? -1,
      stageTop: stage?.scrollTop ?? -1,
    }
  })
  expect(scroll).toEqual({ left: 0, top: 0, stageLeft: 0, stageTop: 0 })

  const camAfter = await camera.evaluate((el) => getComputedStyle(el).transform)
  expect(camAfter).not.toBe(feel!.camTransform)

  // Keyboard still takes a discrete step (desktop path, same clock).
  const westFrom = after!.player.x
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(320)
  const keyed = await readOfficeSave(page)
  expect(keyed!.player.x).toBe(westFrom - 1)
})
