import { test, expect, type Page } from '@playwright/test'
import { buffedSave, continueFromSave } from './helpers'
import { OFFICE_SAVE_KEY, muteSettings } from './office-helpers'

// Pass J battle: on the 840 desktop canvas the battlefield stretches into an
// 816-wide arena, so the combatants scale up (236 enemy / 224 player) and
// sit in opposite corners without touching the dossier, the resource panel,
// the floor counter or the SOUND / SET chrome. The phone canvas keeps the
// 164 / 154 sprites and their exact boxes.

const DESKTOP = { enemy: 236, player: 224 }
const PHONE = { enemy: 164, player: 154 }

type Box = { left: number; top: number; right: number; bottom: number }

type Arena = {
  shell: string | undefined
  scale: number
  enemy: { stand: Box; size: number; artTop: number; imgPx: number }
  player: { stand: Box; size: number; artTop: number; imgPx: number }
  dossier: Box
  resources: Box
  floorCounter: Box
  chrome: Box
}

/** Geometry in stage design px (the stage is CSS-scaled; divide it out). */
async function measureArena(page: Page): Promise<Arena> {
  return page.evaluate(() => {
    const stage = document.querySelector('[data-testid="stage"]') as HTMLElement
    const st = stage.getBoundingClientRect()
    const scale = st.width / stage.offsetWidth
    const box = (el: Element): Box => {
      const r = el.getBoundingClientRect()
      return {
        left: Math.round((r.left - st.left) / scale),
        top: Math.round((r.top - st.top) / scale),
        right: Math.round((r.right - st.left) / scale),
        bottom: Math.round((r.bottom - st.top) / scale),
      }
    }
    const combatant = (id: string) => {
      const stand = document.querySelector(`[data-testid="${id}"]`) as HTMLElement
      const staged = stand.firstElementChild as HTMLElement
      const img = stand.querySelector('img') as HTMLImageElement
      const b = box(stand)
      // PixelSprite pads the art 8% (of width) at the top.
      return {
        stand: b,
        size: staged.offsetWidth,
        artTop: box(img).top + Math.round(0.08 * img.offsetWidth),
        imgPx: Math.round(img.getBoundingClientRect().width),
      }
    }
    const q = (sel: string) => box(document.querySelector(sel) as HTMLElement)
    return {
      shell: stage.dataset.stageShell,
      scale,
      enemy: combatant('enemy-stand'),
      player: combatant('player-stand'),
      dossier: q('[data-testid="enemy-dossier"]'),
      resources: q('[data-testid="player-resources"]'),
      floorCounter: q('[data-testid="floor-counter"]'),
      chrome: box(
        document.querySelector('[aria-label="Mute sound"], [aria-label="Unmute sound"]')!,
      ),
    }
  })
}

function overlaps(a: Box, b: Box) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom
}

async function classicBattle(page: Page) {
  await continueFromSave(page, buffedSave(3))
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12_000 })
  // Click the stage itself: on desktop #root's centre may be a theater wing.
  await page.getByTestId('stage').click()
  await expect(page.getByRole('button', { name: 'FIGHT' })).toBeVisible({ timeout: 10_000 })
}

/** Floor 1 save standing beside Gavin with the printer fixed: `E` opens
 *  the desk-pit spar, the same beat the Office demo records. */
function gavinSparSave() {
  return {
    version: 2,
    run: {
      mode: { kind: 'normal' },
      classId: 'eng',
      floor: 0,
      level: 18,
      xp: 20,
      xpToNext: 80,
      hp: 90,
      pp: [12, 8, 10, 12],
      atkBuff: 0,
      defBuff: 0,
      inventory: [],
      floorEnemyIds: [],
      ngPlus: 0,
      stats: { totalTurns: 12, totalDamageDealt: 240, itemsUsed: 0 },
      usedEvents: [],
      rngState: null,
      stockOptions: 42,
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
      { slot: 'party_slot_0', def: { kind: 'lead', classId: 'eng' }, hp: 90, pp: [12, 8, 10, 12] },
    ],
    hired: [],
    bench: {},
    floorId: 'floor_01',
    player: { x: 5, y: 10, facing: 'e' },
    assignments: {
      asg_printer: 'complete',
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
    keyItems: {},
    rewardsClaimed: ['rwd_start_options'],
    flags: [
      'flag_move_coached',
      'flag_interact_coached',
      'flag_pin_coached',
      'flag_elevator_coached',
      'flag_switch_coached',
      'flag_roster_coached',
      'flag_office_intro',
      'flag_first_desk_done',
    ],
    firedTriggers: [],
    stats: { battlesWon: 0, losses: 0, switches: 0, msOnFloor: 40_000, rides: 0 },
    vendingStock: {
      floor_01: ['espresso', 'espresso', 'side_hustle'],
      floor_02: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_03: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_04: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_05: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
    },
  }
}

async function officeBattle(page: Page) {
  await page.goto('/')
  await page.evaluate(
    ({ next, settings, key }) => {
      localStorage.clear()
      localStorage.setItem(key, JSON.stringify(next))
      localStorage.setItem('corporate-climb-settings', settings)
    },
    { next: gavinSparSave(), settings: muteSettings(), key: OFFICE_SAVE_KEY },
  )
  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 10_000 })
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 15_000 })
  await page.keyboard.press('e')
  await page.getByRole('dialog').first().waitFor({ timeout: 10_000 })
  const fight = page.getByRole('button', { name: 'FIGHT' })
  for (let i = 0; i < 12 && !(await fight.isVisible().catch(() => false)); i++) {
    const stakes = page.getByRole('button', { name: /^(Bring it|Begin)$/ }).last()
    if (await stakes.isVisible().catch(() => false)) {
      await stakes.click({ timeout: 2_000 }).catch(() => {})
    } else {
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(300)
  }
  await expect(fight).toBeVisible({ timeout: 10_000 })
}

async function expectDesktopArena(page: Page) {
  const a = await measureArena(page)
  expect(a.shell).toBe('desktop')
  expect(a.enemy.size).toBe(DESKTOP.enemy)
  expect(a.player.size).toBe(DESKTOP.player)
  // Real pixels on the 1080p theater: the art is drawn well above phone size.
  expect(a.enemy.imgPx).toBeGreaterThan(300)
  expect(a.player.imgPx).toBeGreaterThan(280)

  // Opposite corners: enemy up-right, player down-left.
  expect(a.enemy.stand.left).toBeGreaterThan(a.player.stand.right + 200)
  expect(a.enemy.stand.top).toBeLessThan(a.player.stand.top)

  // Neither figure runs into the panels.
  expect(overlaps(a.enemy.stand, a.dossier)).toBe(false)
  expect(overlaps(a.enemy.stand, a.resources)).toBe(false)
  expect(overlaps(a.player.stand, a.dossier)).toBe(false)
  expect(overlaps(a.player.stand, a.resources)).toBe(false)
  // The floor counter and the SOUND / SET chrome sit above the enemy's art.
  expect(a.floorCounter.bottom).toBeLessThanOrEqual(a.enemy.artTop)
  expect(a.chrome.bottom).toBeLessThanOrEqual(a.enemy.artTop)
}

test.describe('desktop theater (1920×1080)', () => {
  test.use({ viewport: { width: 1920, height: 1080 } })

  test('Classic battle scales the combatants to arena size', async ({ page }) => {
    await classicBattle(page)
    await expectDesktopArena(page)
  })

  test('Office battle shares the same arena composition', async ({ page }) => {
    test.setTimeout(45_000)
    await officeBattle(page)
    await expectDesktopArena(page)
  })
})

test.describe('phone (390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('battle keeps the phone sprite sizes and boxes', async ({ page }) => {
    await classicBattle(page)
    const a = await measureArena(page)
    expect(a.shell).toBe('phone')
    expect(a.enemy.size).toBe(PHONE.enemy)
    expect(a.player.size).toBe(PHONE.player)
    // Pre-Pass-J boxes on this viewport (stage design px), pinned so the
    // desktop block can never leak into the phone layout.
    expect(a.enemy.stand).toEqual({ left: 291, top: 33, right: 455, bottom: 204 })
    expect(a.player.stand).toEqual({ left: 21, top: 448, right: 175, bottom: 608 })
  })
})
