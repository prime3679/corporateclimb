import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, tapToBattle, attackUntil } from './helpers'

/**
 * A saved Re-Org run resumes with its tier intact: the floor intro
 * shows the active tier chip and a battle against the smarter,
 * stat-scaled enemy still completes cleanly.
 */
test.use({ viewport: GAME_VIEWPORT })

/** A heavily-buffed v7-format save at Re-Org 3 (Smarter Managers). */
const V7_REORG_SAVE = {
  version: 7,
  run: {
    mode: { kind: 'normal' },
    classId: 'pm',
    floor: 3,
    level: 25,
    xp: 0,
    xpToNext: 100_000,
    hp: 200,
    pp: [40, 40, 40, 40],
    atkBuff: 220,
    defBuff: 80,
    inventory: [],
    // Empty variant list falls back to each floor's canonical enemy.
    floorEnemyIds: [],
    ngPlus: 0,
    stats: { totalTurns: 0, totalDamageDealt: 0, itemsUsed: 0 },
    usedEvents: [],
    rngState: null,
    stockOptions: 0,
    perks: [],
    pendingPerkOffer: null,
    shopStock: null,
    relics: [],
    eliteFloor: false,
    mystery: null,
    perkPool: [],
    relicPool: [],
    ascension: 3,
  },
}

test('a Re-Org 3 save resumes with its tier and wins a smarter battle', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await page.goto('/')
  await page.evaluate((save) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-save', JSON.stringify(save))
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
    )
  }, V7_REORG_SAVE)
  await page.reload()
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })

  // The floor intro announces the active tier.
  await expect(page.getByText(/RE-ORG 3/)).toBeVisible({ timeout: 12_000 })

  await tapToBattle(page)
  await attackUntil(page, 'VICTORY')
  await expect(page.getByText('VICTORY')).toBeVisible({ timeout: 10_000 })

  expect(pageErrors, 'no uncaught page errors on a Re-Org run').toEqual([])
})
