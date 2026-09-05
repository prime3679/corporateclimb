import { test, expect, type Page } from '@playwright/test'
import { GAME_VIEWPORT, tapToBattle } from './helpers'

/**
 * The type-matchup coach-mark only teaches where it can demonstrate:
 * it stays quiet against the NORM-type Intern (no move carries a ▲),
 * appears in the first battle with a genuine super-effective option,
 * and once dismissed never returns.
 *
 * Canonical enemies (floorEnemyIds: []) make this deterministic:
 * floor index 0 = Intern (NORM), index 1 = Recruiter (INFL), and the
 * PM's strategy move is super effective against influence.
 */
test.use({ viewport: GAME_VIEWPORT })

/** A buffed v7-format PM save with canonical enemy resolution. */
function v7Save(floor: number) {
  return {
    version: 7,
    run: {
      mode: { kind: 'normal' },
      classId: 'pm',
      floor,
      level: 25,
      xp: 0,
      xpToNext: 100_000,
      hp: 200,
      pp: [40, 40, 40, 40],
      atkBuff: 220,
      defBuff: 80,
      inventory: [],
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
      ascension: 0,
    },
  }
}

async function resumeAtFloor(page: Page, floor: number, opts: { fresh: boolean }) {
  await page.goto('/')
  await page.evaluate(
    ({ save, fresh }) => {
      if (fresh) localStorage.clear()
      localStorage.setItem('corporate-climb-save', JSON.stringify(save))
      localStorage.setItem(
        'corporate-climb-settings',
        JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
      )
    },
    { save: v7Save(floor), fresh: opts.fresh },
  )
  await page.reload()
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })
  await tapToBattle(page)
  await page.getByRole('button', { name: 'FIGHT' }).waitFor({ timeout: 15_000 })
}

async function muteAndClear(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
    )
  })
  await page.reload()
}

test('office first-run: title → role → Floor 1 coaches without a start card', async ({ page }) => {
  test.setTimeout(90_000)
  await muteAndClear(page)

  await expect(page.getByText('CAMPAIGN · FLOORS 1–5')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible()

  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await expect(
    page.getByText('Reception to the board. Five floors. One badge at a time.'),
  ).toBeVisible()
  await expect(page.getByText('SELECT CAREER ARCHETYPE')).toBeVisible()
  await expect(page.getByRole('button', { name: 'NEW CAMPAIGN' })).toHaveCount(0)

  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()

  await expect(page.locator('#coach_move')).toBeVisible()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible()
  await expect(page.getByLabel('Objective')).toContainText('Look around')

  await page.keyboard.press('ArrowLeft')
  await expect(page.getByText('New hire. Front desk. Now.')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('Enter')
  await expect(page.locator('#coach_pin')).toBeVisible()
  await expect(page.getByLabel('Objective')).toContainText('Talk to Renata')

  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('ArrowUp')
  await expect(page.getByText('Talk · Renata').first()).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('#coach_interact')).toBeVisible()

  await page.keyboard.press('e')
  await expect(page.getByText('You have the look. Hopeful. Badge-less.')).toBeVisible({
    timeout: 10_000,
  })
})

test('office onboarding is a keyboard path from title to role accept', async ({ page }) => {
  test.setTimeout(60_000)
  await muteAndClear(page)

  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'THE OFFICE' }).focus()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('ArrowRight')
  await expect(page.getByRole('radio', { name: 'Senior Engineer' })).toHaveAttribute(
    'aria-checked',
    'true',
  )
  await page.keyboard.press('Enter')
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
})

test('office Continue vs New campaign erase confirm stays clear', async ({ page }) => {
  test.setTimeout(60_000)
  await muteAndClear(page)

  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await page.getByRole('button', { name: 'Title' }).click()

  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByRole('heading', { name: 'THE OFFICE' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible()
  await page.getByRole('button', { name: 'NEW CAMPAIGN' }).click()
  await expect(page.getByRole('dialog', { name: 'Erase campaign?' })).toBeVisible()
  await expect(page.getByText('The team goes back to being coworkers.')).toBeVisible()
  await page.getByRole('button', { name: 'Keep it' }).click()
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible()
  await expect(page.getByRole('dialog', { name: 'Erase campaign?' })).toHaveCount(0)
})

test('coach-mark waits for a battle where a super-effective move exists', async ({ page }) => {
  test.setTimeout(120_000)

  // Floor index 0 — Intern (NORM): nothing is super effective, so the
  // hint must hold its fire even on a virgin profile.
  await resumeAtFloor(page, 0, { fresh: true })
  await expect(page.getByRole('note')).toBeHidden()

  // Floor index 1 — Recruiter (INFL): the PM's strategy move carries a
  // ▲, so the hint appears here and dismisses on the first move.
  await resumeAtFloor(page, 1, { fresh: true })
  await expect(page.getByRole('note')).toBeVisible()
  await page.locator('[data-testid="move-button"]').first().click()
  await expect(page.getByRole('note')).toBeHidden()

  // Dismissal is persisted: the same ▲ battle stays hint-free.
  await resumeAtFloor(page, 1, { fresh: false })
  await expect(page.getByRole('note')).toBeHidden()
})
