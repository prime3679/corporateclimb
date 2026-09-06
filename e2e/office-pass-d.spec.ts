import { test, expect, type Page } from '@playwright/test'
import { GAME_VIEWPORT } from './helpers'

test.use({ viewport: GAME_VIEWPORT })

function muteSettings() {
  return JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 })
}

function baseSave() {
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
      stockOptions: 80,
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
    floorId: 'floor_01',
    player: { x: 12, y: 15, facing: 'n' },
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
      floor_03: ['espresso', 'noise_cancelling', 'mentors_advice', 'standing_desk'],
      floor_04: ['espresso', 'networking_card', 'linkedin_endorsement', 'reply_all_grenade'],
      floor_05: ['espresso', 'pto_day', 'reorg_memo', 'forward_to_legal'],
    },
  }
}

async function continueOffice(page: Page, save: ReturnType<typeof baseSave>) {
  await page.goto('/')
  await page.evaluate(
    ({ next, settings }) => {
      localStorage.clear()
      localStorage.setItem('corporate-climb-office-save', JSON.stringify(next))
      localStorage.setItem('corporate-climb-settings', settings)
    },
    { next: save, settings: muteSettings() },
  )
  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 10_000 })
}

test('Floor 1 and Product machines keep distinct SKUs and titles', async ({ page }) => {
  test.setTimeout(45_000)
  const f1 = baseSave()
  f1.player = { x: 21, y: 9, facing: 'e' }
  await continueOffice(page, f1)
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('e')
  await expect(page.getByText('VENDING · YOUR TEAM')).toBeVisible({ timeout: 8_000 })
  await expect(page.getByText('Side Hustle')).toBeVisible()
  await expect(page.getByText('Nobody asked how.')).toBeVisible()
  await page.getByRole('button', { name: /BACK TO WORK/ }).click()

  const f3 = baseSave()
  f3.floorId = 'floor_03'
  f3.player = { x: 21, y: 16, facing: 'e' }
  f3.flags.push(
    'flag_preview_complete',
    'flag_visited_f2',
    'flag_floor2_complete',
    'flag_visited_f3',
  )
  await continueOffice(page, f3)
  await expect(page.getByText('Floor 3 · of 5')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('e')
  await expect(page.getByText('VENDING · PRODUCT')).toBeVisible({ timeout: 8_000 })
  await expect(page.getByText('Noise-Cancelling')).toBeVisible()
  await expect(page.getByText('Side Hustle')).toHaveCount(0)
})

test('Floor 5 Exec row after the nod opens THE CLIMB ledger at 78 / 78', async ({ page }) => {
  test.setTimeout(45_000)
  const f5 = baseSave()
  f5.floorId = 'floor_05'
  f5.player = { x: 3, y: 2, facing: 'n' }
  f5.flags.push(
    'flag_preview_complete',
    'flag_visited_f2',
    'flag_floor2_complete',
    'flag_visited_f5',
    'flag_floor5_complete',
  )
  f5.encounters.enc_ceo_review = 'won'
  f5.assignments.asg_board_packet = 'complete'
  f5.rewardsClaimed = ['rwd_asg_board_packet', 'rwd_enc_ceo_review']
  await continueOffice(page, f5)
  await expect(page.getByText('Floor 5 · of 5')).toBeVisible({ timeout: 10_000 })
  await page.keyboard.press('e')
  await expect(page.getByRole('option', { name: '5 EXEC The climb' })).toBeVisible({
    timeout: 8_000,
  })
  await page.keyboard.press('5')
  await expect(page.getByRole('dialog', { name: 'THE CLIMB' })).toBeVisible({ timeout: 8_000 })
  await expect(page.getByText('Work ticket')).toBeHidden()
  await expect(page.getByText('THE NOD', { exact: true })).toBeVisible()
  await expect(page.getByText('THE CLIMB', { exact: true })).toBeVisible()
  await expect(page.getByText('78 / 78')).toBeVisible({ timeout: 3_000 })
  await expect(page.getByText('Full ledger')).toBeVisible()
  await expect(page.getByText('BOARD PACKET — FILED')).toBeVisible()
  await expect(page.getByText('THE REVIEW — NODDED')).toBeVisible()
})
