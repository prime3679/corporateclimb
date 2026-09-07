import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT } from './helpers'
import {
  ARTIFACT_DIR,
  assertNoClassicBleed,
  beginAndFight,
  continueOfficeFromTitle,
  drainOverlays,
  expectObjective,
  fightUntilSettled,
  logBeat,
  openElevator,
  readOfficeSave,
  rideElevator,
  shot,
  startFreshOffice,
  talkThrough,
  waitOverworld,
  walkTo,
  writeClimbLog,
} from './office-helpers'

/**
 * Full fresh-save Office climb (printer → … → THE NOD).
 * Not part of CI smoke — enable with PLAYTEST_FULL_CLIMB=1.
 *
 * Auto: title → role → overworld walks, talks, elevator, fights, save/load,
 * backtrack. Combat is played live (no HP smash). No product-code hooks.
 */
test.use({ viewport: GAME_VIEWPORT })

test.skip(!process.env.PLAYTEST_FULL_CLIMB, 'set PLAYTEST_FULL_CLIMB=1 to run the full climb')

test('fresh-save Office 1→5 required route to THE NOD', async ({ page }) => {
  test.setTimeout(20 * 60_000)
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await startFreshOffice(page)
  await shot(page, '00-floor1-signing')
  await assertNoClassicBleed(page)
  await expectObjective(page, 'Talk to Renata')

  // ── Floor 1: printer ──────────────────────────────────────
  await walkTo(page, 8, 16, 'n', 'Renata ticket')
  await talkThrough(page)
  await expect(page.getByLabel('Objective')).toContainText(/toner|supply/i)
  await shot(page, '01-printer-accepted')

  await walkTo(page, 15, 8, 'n', 'supply cabinet')
  await talkThrough(page)
  let save = await readOfficeSave(page)
  expect(save?.assignments.asg_printer).toBe('toner_collected')

  await walkTo(page, 9, 8, 'n', 'printer')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_printer).toBe('installed')

  await walkTo(page, 8, 16, 'n', 'Renata closeout')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_printer).toBe('complete')
  await expectObjective(page, 'Talk to Gavin')
  logBeat('printer-complete')
  await shot(page, '02-printer-done')

  // ── Gavin ─────────────────────────────────────────────────
  await walkTo(page, 5, 10, 'e', 'Gavin')
  await beginAndFight(page, 'gavin', ['Bring it'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_desk_challenger).toBe('won')
  await expectObjective(page, 'See Holloway')
  logBeat('gavin-won')
  await shot(page, '03-gavin-won')

  // ── Holloway + access badge ───────────────────────────────
  await walkTo(page, 6, 2, 's', 'Holloway')
  await beginAndFight(page, 'holloway', ['Begin'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_supervisor_1on1).toBe('won')
  expect(save?.keyItems.key_access_badge).toBe(1)
  expect(save?.keyItems.key_employee_badge ?? 0).toBe(0)
  await expect(page.getByText('🪪 Visitor')).toBeVisible()
  await expectObjective(page, /elevator to Floor 2/i)
  logBeat('holloway-won-access-badge')
  await shot(page, '04-access-badge')

  // ── Elevator: You are here inert + locked F3–5 beep ───────
  await openElevator(page)
  await shot(page, '05-elevator-f1-panel')
  const here = page.getByRole('option', { name: /1 YOUR TEAM/ })
  await expect(here).toBeVisible()
  await expect(here).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByText('You are here')).toBeVisible()
  await expect(page.getByRole('option', { name: /6 / })).toHaveCount(0)

  await page.keyboard.press('1')
  await expect(page.getByRole('listbox', { name: 'Elevator floors' })).toBeVisible()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible()

  await page.keyboard.press('5')
  await expect(page.getByRole('listbox', { name: 'Elevator floors' })).toBeVisible()
  await expect(page.getByText(/Floors 3–5|employee badge|Badge required/i)).toBeVisible({
    timeout: 5_000,
  })
  logBeat('elevator-locked-f3-5-beep')
  await shot(page, '06-elevator-locked-beep')
  await page.keyboard.press('Escape')

  await rideElevator(page, 2)
  await expect(page.getByText('Floor 2 · of 5')).toBeVisible({ timeout: 15_000 })
  save = await readOfficeSave(page)
  expect(save?.floorId).toBe('floor_02')
  expect(save?.flags).toContain('flag_preview_complete')
  logBeat('arrived-floor-2')
  await shot(page, '07-floor2-arrival')

  // ── Floor 2: Teddy packet (backtrack 2→1 for Holloway) ────
  await drainOverlays(page)
  await walkTo(page, 8, 3, 'e', 'Teddy')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_transfer).toBe('accepted')
  await expectObjective(page, /badge photo/i)

  await walkTo(page, 12, 2, 'n', 'photo booth')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_transfer).toBe('photo_taken')
  await expectObjective(page, /Holloway|signature/i)
  logBeat('teddy-photo-taken')

  await rideElevator(page, 1)
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 15_000 })
  await walkTo(page, 6, 2, 's', 'Holloway sign')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_transfer).toBe('signed')
  logBeat('holloway-signed-packet')

  await rideElevator(page, 2)
  await walkTo(page, 18, 4, 'n', 'People Ops file')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_transfer).toBe('filed')
  logBeat('packet-filed')

  await walkTo(page, 9, 7, 'n', 'Teddy report approach')
  await page.keyboard.press('ArrowUp')
  await page.waitForTimeout(320)
  await drainOverlays(page)
  await talkThrough(page, ['Begin training', 'Begin', 'Bring it'])
  const teddyFight = page.getByRole('button', { name: /^(Begin training|Begin|Bring it)$/ }).first()
  if (await teddyFight.isVisible().catch(() => false)) await teddyFight.click()
  await fightUntilSettled(page, 'teddy')
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_help_desk_intern).toBe('won')
  expect(save?.assignments.asg_transfer).toBe('complete')
  await expectObjective(page, /Kessler/i)
  logBeat('teddy-won')
  await shot(page, '08-teddy-won')

  // ── Kessler + employee badge ──────────────────────────────
  await walkTo(page, 3, 8, 's', 'Kessler door approach')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(320)
  const stepIn = page.getByRole('button', { name: 'Step in' })
  if (await stepIn.isVisible().catch(() => false)) await stepIn.click()
  await drainOverlays(page)
  await beginAndFight(page, 'kessler', ['Begin'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_director_review).toBe('won')
  logBeat('kessler-won')
  await shot(page, '09-kessler-won')

  await walkTo(page, 11, 3, 'n', 'badge printer')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.keyItems.key_employee_badge).toBe(1)
  await expect(page.getByText('🪪 Employee')).toBeVisible()
  await expectObjective(page, /elevator to Floor 3/i)
  logBeat('employee-badge')
  await shot(page, '10-employee-badge')

  // ── Save / load mid-climb ─────────────────────────────────
  await assertNoClassicBleed(page)
  await continueOfficeFromTitle(page)
  save = await readOfficeSave(page)
  expect(save?.keyItems.key_employee_badge).toBe(1)
  expect(save?.encounters.enc_director_review).toBe('won')
  expect(save?.floorId).toBe('floor_02')
  logBeat('save-load-mid-climb')
  await shot(page, '11-after-reload')

  await rideElevator(page, 3)
  await expect(page.getByText('Floor 3 · of 5')).toBeVisible({ timeout: 15_000 })
  save = await readOfficeSave(page)
  expect(save?.flags).toContain('flag_floor2_complete')
  logBeat('arrived-floor-3')
  await shot(page, '12-floor3-arrival')

  // ── Backtrack 3→2→3 ───────────────────────────────────────
  await drainOverlays(page)
  await rideElevator(page, 2)
  await expect(page.getByText('Floor 2 · of 5')).toBeVisible({ timeout: 15_000 })
  logBeat('backtrack-3-to-2')
  await rideElevator(page, 3)
  await expect(page.getByText('Floor 3 · of 5')).toBeVisible({ timeout: 15_000 })
  await expectObjective(page, /Sloane/i)
  logBeat('back-to-floor-3')

  // ── Sloane / Nico / Quincy ────────────────────────────────
  await walkTo(page, 10, 4, 'n', 'Sloane')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_roadmap).toBe('accepted')

  await walkTo(page, 13, 2, 'n', 'Q4 card')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_roadmap).toBe('card_held')

  await walkTo(page, 18, 3, 'e', 'Nico')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_roadmap).toBe('initialled')

  await walkTo(page, 10, 4, 'n', 'Sloane closeout')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_roadmap).toBe('complete')
  await expectObjective(page, /Quincy/i)
  logBeat('sloane-nico-complete')
  await shot(page, '13-roadmap-done')

  await walkTo(page, 16, 11, 'e', 'Quincy')
  const quincy = await beginAndFight(page, 'quincy', ['Begin'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_vp_product).toBe('won')
  logBeat('quincy-won', quincy)
  await shot(page, '14-floor3-celebration')
  await drainOverlays(page)
  const f3Stay = page.getByRole('button', { name: /Back to Floor 3/ })
  if (await f3Stay.isVisible().catch(() => false)) await f3Stay.click()
  await drainOverlays(page)

  await rideElevator(page, 4)
  await expect(page.getByText('Floor 4 · of 5')).toBeVisible({ timeout: 15_000 })
  logBeat('arrived-floor-4')

  // ── Harper / Reyes / Ashford ──────────────────────────────
  await drainOverlays(page)
  await walkTo(page, 10, 4, 'n', 'Harper')
  await talkThrough(page)
  await walkTo(page, 13, 2, 'n', 'leave-behind')
  await talkThrough(page)
  await walkTo(page, 18, 3, 'e', 'Reyes')
  await talkThrough(page)
  await walkTo(page, 10, 4, 'n', 'Harper closeout')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_leavebehind).toBe('complete')
  await expectObjective(page, /Ashford/i)
  logBeat('harper-reyes-complete')

  await walkTo(page, 16, 11, 'e', 'Ashford')
  await beginAndFight(page, 'ashford', ['Begin'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_vp_sales).toBe('won')
  logBeat('ashford-won')
  await shot(page, '15-floor4-celebration')
  await drainOverlays(page)
  const f4Stay = page.getByRole('button', { name: /Back to Floor 4/ })
  if (await f4Stay.isVisible().catch(() => false)) await f4Stay.click()
  await drainOverlays(page)

  await rideElevator(page, 5)
  await expect(page.getByText('Floor 5 · of 5')).toBeVisible({ timeout: 15_000 })
  logBeat('arrived-floor-5')
  await shot(page, '16-floor5-arrival')

  // ── Marlowe / Caldwell / THE NOD ──────────────────────────
  await drainOverlays(page)
  await walkTo(page, 10, 4, 'n', 'Marlowe')
  await talkThrough(page)
  await walkTo(page, 17, 5, 'n', 'board packet')
  await talkThrough(page)
  await walkTo(page, 10, 4, 'n', 'Marlowe file')
  await talkThrough(page)
  save = await readOfficeSave(page)
  expect(save?.assignments.asg_board_packet).toBe('complete')
  await expectObjective(page, /Caldwell/i)
  logBeat('marlowe-packet-complete')

  await walkTo(page, 17, 11, 'e', 'Caldwell')
  const caldwell = await beginAndFight(page, 'caldwell', ['Begin'])
  save = await readOfficeSave(page)
  expect(save?.encounters.enc_ceo_review).toBe('won')
  expect(save?.flags).toContain('flag_floor5_complete')
  logBeat('caldwell-won', caldwell)
  await shot(page, '17-the-nod')

  await expect(page.getByText('THE NOD')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByRole('dialog', { name: /THE NOD|THE CLIMB|THE REVIEW/i })).toBeVisible()
  await expect(page.getByText(/Floor 6/i)).toHaveCount(0)
  logBeat('screen-floor5-complete')

  const stay5 = page.getByRole('button', { name: /Back to Floor 5/ })
  if (await stay5.isVisible().catch(() => false)) await stay5.click()
  await drainOverlays(page)
  await waitOverworld(page)

  // Post-nod elevator: 1–5 only, current floor climb/here, ride down.
  await openElevator(page)
  await expect(page.getByRole('option', { name: /5 EXEC/ })).toBeVisible()
  await expect(page.getByRole('option', { name: /6 / })).toHaveCount(0)
  await shot(page, '18-elevator-no-floor-6')
  await page.keyboard.press('1')
  await page.waitForTimeout(2_800)
  await drainOverlays(page)
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 15_000 })
  save = await readOfficeSave(page)
  expect(save?.floorId).toBe('floor_01')
  logBeat('post-nod-backtrack-5-to-1')

  await assertNoClassicBleed(page)
  expect(pageErrors, 'no uncaught page errors').toEqual([])
  writeClimbLog()
  logBeat('PASS', { artifactDir: ARTIFACT_DIR })
})
