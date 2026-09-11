import { test, expect } from '@playwright/test'

test('first three minutes present a stronger hook and clearer choices', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()

  const tagline = page.getByText('Reception to the board. One badge swipe from glory.')
  await expect(tagline).toBeVisible({ timeout: 15_000 })
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

  // One spine: the FLOOR 30 sign, the wordmark glyphs, the lead (centre)
  // plate and the hero share a centre X. The wordmark is measured by its
  // glyph range, not its flex box, so a left-aligned line can't hide
  // inside a full-width h1 (the #118 desktop composition sat ~90px left).
  const sign = page.getByText('▲ FLOOR 30')
  const centreX = (b: { x: number; width: number }) => b.x + b.width / 2
  const spine = centreX(officeBox!)
  const wordmark = await page.locator('h1').evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    const r = range.getBoundingClientRect()
    return { x: r.x, width: r.width }
  })
  const [signBox, leadBox] = await Promise.all([
    sign.boundingBox(),
    page.locator('figure').nth(1).boundingBox(),
  ])
  expect(Math.abs(centreX(wordmark) - spine)).toBeLessThanOrEqual(2)
  expect(Math.abs(centreX(signBox!) - spine)).toBeLessThanOrEqual(2)
  expect(Math.abs(centreX(leadBox!) - spine)).toBeLessThanOrEqual(2)

  // Top chrome shares the sign's row instead of floating in the corner,
  // and the three role plates are equal — the lead's ring is drawn inside.
  const soundBox = await page.getByRole('button', { name: 'Mute music' }).boundingBox()
  expect(Math.abs(soundBox!.y - signBox!.y)).toBeLessThanOrEqual(1)
  const plateWidths = await page
    .locator('figure')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().width))
  expect(plateWidths).toHaveLength(3)
  expect(Math.max(...plateWidths) - Math.min(...plateWidths)).toBeLessThanOrEqual(0.5)

  // #122 Designer Shoulds. The lead's ring is a hard inset line: every
  // gold shadow on the plate is `inset`, so nothing blooms outside its
  // box. The tagline is one sentence-case line, not a caps shout. THE
  // OFFICE wins by value, not by a breathing glow.
  const leadRing = await page
    .locator('figure')
    .nth(1)
    .evaluate((el) => {
      const cs = getComputedStyle(el)
      const shadows = cs.boxShadow.split(/,(?![^(]*\))/).map((s) => s.trim())
      const gold = shadows.filter((s) => /rgba?\(255, 21\d, \d+/.test(s))
      return { shadows, gold, border: cs.borderTopWidth, borderColor: cs.borderTopColor }
    })
  expect(leadRing.gold.length).toBeGreaterThan(0)
  for (const s of leadRing.gold) expect(s).toContain('inset')
  expect(leadRing.border).toBe('1px')
  expect(leadRing.borderColor).toMatch(/^rgb\(255, 21\d, \d+\)$/)

  const taglineStyle = await tagline.evaluate((el) => {
    const range = document.createRange()
    range.selectNodeContents(el)
    return { transform: getComputedStyle(el).textTransform, lines: range.getClientRects().length }
  })
  expect(taglineStyle.transform).toBe('none')
  expect(taglineStyle.lines).toBe(1)

  await expect(office).toHaveCSS('animation-name', 'none')

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
