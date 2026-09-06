import { test, expect, type Page } from '@playwright/test'
import { GAME_VIEWPORT, continueFromSave, buffedSave, tapToBattle } from './helpers'

/**
 * Office beds must play through the live Music facade — not a trailer mux —
 * and Classic must keep the Act-1 lobby / battle files.
 */
test.use({ viewport: GAME_VIEWPORT })

async function trackOf(page: Page) {
  return page.evaluate(() => window.__CC_MUSIC_TRACK ?? null)
}

async function expectTrack(page: Page, name: string) {
  await expect.poll(() => trackOf(page), { timeout: 8_000 }).toBe(name)
}

function muteSettings() {
  return JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 })
}

function officeSave(floorId: 'floor_01' | 'floor_02' | 'floor_05') {
  return {
    version: 2,
    run: {
      mode: { kind: 'normal' },
      classId: 'eng',
      floor: 0,
      level: 8,
      xp: 0,
      xpToNext: 80,
      hp: 90,
      pp: [12, 8, 10, 12],
      atkBuff: 0,
      defBuff: 0,
      inventory: [],
      floorEnemyIds: [],
      ngPlus: 0,
      stats: { totalTurns: 4, totalDamageDealt: 40, itemsUsed: 0 },
      usedEvents: [],
      rngState: null,
      stockOptions: 20,
      perks: [],
      pendingPerkOffer: null,
      shopStock: ['espresso', 'espresso', 'side_hustle'],
      relics: [],
      eliteFloor: false,
      mystery: null,
      treasureFloor: false,
      treasureLoot: null,
      perkPool: [],
      relicPool: [],
      ascension: 0,
    },
    party: [
      {
        slot: 'party_slot_0',
        def: { kind: 'lead', classId: 'eng' },
        hp: 90,
        pp: [12, 8, 10, 12],
      },
    ],
    hired: [],
    bench: {},
    floorId,
    player: floorId === 'floor_01' ? { x: 12, y: 15, facing: 'n' } : { x: 3, y: 2, facing: 's' },
    assignments: {
      asg_printer: 'not_started',
      asg_meeting_prep: 'not_started',
      asg_transfer: 'not_started',
      asg_audit: 'not_started',
      asg_roadmap: 'not_started',
      asg_leavebehind: 'not_started',
      asg_board_packet: 'not_started',
    },
    encounters: {
      enc_desk_challenger: 'open',
      enc_meeting_prepper: 'open',
      enc_supervisor_1on1: 'open',
      enc_help_desk_intern: 'open',
      enc_auditor: 'open',
      enc_director_review: 'open',
      enc_vp_product: 'open',
      enc_vp_sales: 'open',
      enc_ceo_review: 'open',
    },
    keyItems: { key_access_badge: 1, key_employee_badge: 1 },
    rewardsClaimed: ['rwd_start_options'],
    flags: [
      'flag_move_coached',
      'flag_interact_coached',
      'flag_pin_coached',
      'flag_elevator_coached',
    ],
    firedTriggers: [],
    stats: { battlesWon: 0, losses: 0, switches: 0, msOnFloor: 1_000, rides: 1 },
    vendingStock: {
      floor_01: ['espresso', 'espresso', 'side_hustle'],
      floor_02: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_03: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_04: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_05: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
    },
  }
}

async function continueOffice(page: Page, floorId: 'floor_01' | 'floor_02' | 'floor_05') {
  await page.goto('/')
  await page.evaluate(
    ({ save, settings }) => {
      localStorage.clear()
      localStorage.setItem('corporate-climb-office-save', JSON.stringify(save))
      localStorage.setItem('corporate-climb-settings', settings)
    },
    { save: officeSave(floorId), settings: muteSettings() },
  )
  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 10_000 })
}

test('shared title stays Classic; Office screens pick distinct beds', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto('/')
  await page.evaluate((settings) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-settings', settings)
  }, muteSettings())
  await page.reload()

  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 15_000 })
  await expectTrack(page, 'title')

  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await expectTrack(page, 'officeTitle')

  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await expectTrack(page, 'officeFloor1')
})

test('Floor 2 and Exec load their own beds, not the Classic lobby', async ({ page }) => {
  test.setTimeout(45_000)
  await continueOffice(page, 'floor_02')
  await expect(page.getByText('Floor 2 · of 5')).toBeVisible({ timeout: 10_000 })
  await expectTrack(page, 'officeFloor2')

  await continueOffice(page, 'floor_05')
  await expect(page.getByText('Floor 5 · of 5')).toBeVisible({ timeout: 10_000 })
  await expectTrack(page, 'officeExec')
})

test('Classic continue still uses Act-1 battle bed', async ({ page }) => {
  test.setTimeout(45_000)
  await continueFromSave(page, buffedSave(1))
  await tapToBattle(page)
  await expect(page.getByText('TAP A MOVE').or(page.getByText('HOLD THE LADDER'))).toBeVisible({
    timeout: 12_000,
  })
  await expectTrack(page, 'battle')
  expect(await trackOf(page)).not.toMatch(/^office/)
})
