import { test, expect, type Page } from '@playwright/test'
import { OFFICE_SAVE_KEY } from './office-helpers'

// Phone viewport: the stage's untransformed layout box (472 × ~1020 design
// px) is wider and taller than the 390 × 844 backdrop, so any focus-scroll
// into the backdrop had somewhere to go while it was `overflow: hidden`.
// Returning from the Office via `‹ Title` used to leave the backdrop with
// scrollLeft/scrollTop stuck non-zero and the title rendered up-left.
test.use({ viewport: { width: 390, height: 844 } })

type Scroll = { left: number; top: number; stageX: number; stageY: number }

async function backdropScroll(page: Page): Promise<Scroll> {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-testid="stage"]') as HTMLElement
    const backdrop = stage.parentElement as HTMLElement
    const rect = stage.getBoundingClientRect()
    return {
      left: backdrop.scrollLeft,
      top: backdrop.scrollTop,
      stageX: Math.round(rect.x),
      stageY: Math.round(rect.y),
    }
  })
}

async function expectCentered(page: Page, where: string) {
  const s = await backdropScroll(page)
  expect(s, `${where}: backdrop must not be scrolled`).toMatchObject({ left: 0, top: 0 })
  // The scaled stage spans the viewport, so its box starts at the origin.
  expect(Math.abs(s.stageX), `${where}: stage x`).toBeLessThanOrEqual(1)
  expect(Math.abs(s.stageY), `${where}: stage y`).toBeLessThanOrEqual(1)
}

async function gotoTitle(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0, reduceMotion: true }),
    )
  })
  await page.reload()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 15_000 })
}

test('Office class select → ‹ Title leaves the stage centered', async ({ page }) => {
  await gotoTitle(page)
  await expectCentered(page, 'title (fresh)')
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'class select')
  await page.getByRole('button', { name: 'Back to title' }).click()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'title (after class select)')
})

test('Office overworld → Title leaves the stage centered', async ({ page }) => {
  await gotoTitle(page)
  // A minimal saved campaign so THE OFFICE lands on the start card first.
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('radio', { name: 'Product Manager' }).click()
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'overworld')

  await page.getByRole('button', { name: 'Title' }).click()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'title (after overworld)')

  // Start card (CONTINUE autofocuses) → ‹ Title.
  const save = await page.evaluate((key) => localStorage.getItem(key), OFFICE_SAVE_KEY)
  expect(save).not.toBeNull()
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'start card')
  await page.getByRole('button', { name: 'Back to title' }).click()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 10_000 })
  await expectCentered(page, 'title (after start card)')
})

test('a programmatic scroll on the backdrop or stage is a no-op', async ({ page }) => {
  await gotoTitle(page)
  // overflow: clip makes both boxes non-scroll containers: even an explicit
  // scroll (what focus() / scrollIntoView into an off-box child used to do)
  // can't move them. Before the fix this returned { left: 40, top: 80 }.
  const after = await page.evaluate(() => {
    const stage = document.querySelector('[data-testid="stage"]') as HTMLElement
    const backdrop = stage.parentElement as HTMLElement
    for (const el of [backdrop, stage]) {
      el.scrollLeft = 40
      el.scrollTop = 80
      el.scrollTo(40, 80)
    }
    ;(stage.firstElementChild as HTMLElement | null)?.scrollIntoView({ block: 'end' })
    return {
      backdrop: { left: backdrop.scrollLeft, top: backdrop.scrollTop },
      stage: { left: stage.scrollLeft, top: stage.scrollTop },
    }
  })
  expect(after).toEqual({ backdrop: { left: 0, top: 0 }, stage: { left: 0, top: 0 } })
  await expectCentered(page, 'title (after forced scroll)')
})
