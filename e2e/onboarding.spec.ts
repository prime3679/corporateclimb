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
