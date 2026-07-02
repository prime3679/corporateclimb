import { test, expect } from '@playwright/test'
import { buffedSave, continueFromSave, tapToBattle } from './helpers'

// A modern tall phone: the stage should fill the screen edge-to-edge
// instead of letterboxing a 472×884 strip, and combat touch targets
// must stay at usable physical sizes after the width-fit scale.
test.use({ viewport: { width: 390, height: 844 } })

test('phone viewport gets a full-bleed stage with usable touch targets', async ({ page }) => {
  await page.goto('/')
  const stageLoc = page.getByTestId('stage')
  await stageLoc.waitFor({ timeout: 15_000 })

  const stage = await stageLoc.boundingBox()
  expect(stage).not.toBeNull()
  // Full-bleed: the scaled stage spans (nearly) the whole viewport.
  expect(stage!.width).toBeGreaterThan(390 - 2)
  expect(stage!.height).toBeGreaterThan(844 - 4)

  // Battle tabs meet the 44px physical touch-target bar on this device.
  await continueFromSave(page, buffedSave(3))
  await tapToBattle(page)
  const fightTab = await page.getByRole('button', { name: 'FIGHT' }).boundingBox()
  expect(fightTab).not.toBeNull()
  expect(fightTab!.height).toBeGreaterThanOrEqual(44)
})
