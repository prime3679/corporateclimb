import { expect, type Locator, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export const ARTIFACT_DIR = '/opt/cursor/artifacts/e2e-full-climb'
export const OFFICE_SAVE_KEY = 'corporate-climb-office-save'
export const CLASSIC_SAVE_KEY = 'corporate-climb-save'

export type Facing = 'n' | 'e' | 's' | 'w'
export type FloorId = 'floor_01' | 'floor_02' | 'floor_03' | 'floor_04' | 'floor_05'

export type OfficeSave = {
  version: number
  floorId: FloorId
  player: { x: number; y: number; facing: Facing }
  assignments: Record<string, string>
  encounters: Record<string, 'open' | 'won'>
  keyItems: Record<string, number>
  flags: string[]
  rewardsClaimed: string[]
  run: { stockOptions: number; level: number; hp: number; classId: string }
  stats: { battlesWon: number; losses: number; rides: number }
}

export const BEATS: string[] = []

export function logBeat(label: string, extra?: Record<string, unknown>) {
  const line = extra ? `${label} ${JSON.stringify(extra)}` : label
  BEATS.push(line)
  console.log(`[climb] ${line}`)
}

export function muteSettings() {
  return JSON.stringify({
    textSpeed: 'instant',
    musicVolume: 0,
    sfxVolume: 0,
    reduceMotion: true,
    haptics: false,
  })
}

export async function readOfficeSave(page: Page): Promise<OfficeSave | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as OfficeSave) : null
  }, OFFICE_SAVE_KEY)
}

export async function readClassicSave(page: Page): Promise<string | null> {
  return page.evaluate((key) => localStorage.getItem(key), CLASSIC_SAVE_KEY)
}

export async function shot(page: Page, name: string) {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  await page.screenshot({ path: path.join(ARTIFACT_DIR, `${name}.png`), fullPage: true })
}

export function writeClimbLog() {
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  writeFileSync(path.join(ARTIFACT_DIR, 'beats.log'), BEATS.join('\n') + '\n')
}

async function vis(el: Locator) {
  return el.isVisible({ timeout: 0 }).catch(() => false)
}

export async function writeCheckpoint(page: Page, name: string) {
  const save = await readOfficeSave(page)
  mkdirSync(ARTIFACT_DIR, { recursive: true })
  writeFileSync(path.join(ARTIFACT_DIR, `checkpoint-${name}.json`), JSON.stringify(save, null, 2))
}

const KEY: Record<Facing, 'ArrowUp' | 'ArrowRight' | 'ArrowDown' | 'ArrowLeft'> = {
  n: 'ArrowUp',
  e: 'ArrowRight',
  s: 'ArrowDown',
  w: 'ArrowLeft',
}

const FLOOR_ART: Record<FloorId, readonly string[]> = {
  floor_01: [
    '########################',
    '#.EER....p#...#.......H#',
    '#.........#..3#..ATTT..#',
    '#.....4..........TTTT..#',
    '#................cccc..#',
    '#p........#...#.......p#',
    '###########...##########',
    '#p.......P#...#S..KKK..#',
    '#.===.....D...D........#',
    '#.ccc.....D...D.......V#',
    '#.....2==.D...D........#',
    '#.===.....#...#.tt....p#',
    '#####D#####...##########',
    '#p.............i......p#',
    '#.......1..............#',
    '#......===..@..........#',
    '#.cc..................w#',
    '############X###########',
  ],
  floor_02: [
    '########################',
    '#.EER.#.....BG#.ff.....#',
    '#..@..#.===b.G#......p.#',
    '#.....D..5....D..QQQ...#',
    '#...i.#......G#.....LL.#',
    '#p...p#......G#p.......#',
    '###D#####D##########D###',
    '#......................#',
    '#.....................w#',
    '###D####D##########D####',
    '#......#.SKKK..#ff....$#',
    '#......#.......#==.....#',
    '#c.....#k.....V#cc.6==.#',
    '#..7dd.#k.tt...#.......#',
    '#....c.#.......#==.....#',
    '#LL....#......j#cc.....#',
    '#p....p#p.....p#p.....m#',
    '########################',
  ],
  floor_03: [
    '########################',
    '#.EER.#.===..W#..f.....#',
    '#..@..#.ccc...#........#',
    '#.....D...8...D....9...#',
    '#...i.#.......#....N...#',
    '#p...p#p.....p#p.......#',
    '###D########D#####D#####',
    '#......................#',
    '#.....................w#',
    '#########D##############',
    '#......................#',
    '#..SKKK..........ydd...#',
    '#...............c......#',
    '#..tt..........c.......#',
    '#......................#',
    '#..............LL......#',
    '#p............p.......V#',
    '########################',
  ],
  floor_04: [
    '########################',
    '#.EER.#.===..C#........#',
    '#..@..#.ccc...#........#',
    '#.....D...5...D....6...#',
    '#...i.#.......#....H...#',
    '#p...p#p.....p#p.......#',
    '###D########D#####D#####',
    '#......................#',
    '#.....................w#',
    '#########D##############',
    '#......................#',
    '#..SKKK..........7dd...#',
    '#...............c......#',
    '#..tt..........c.......#',
    '#......................#',
    '#..............LL......#',
    '#p............p.......V#',
    '########################',
  ],
  floor_05: [
    '########################',
    '#.EER.#................#',
    '#..@..#................#',
    '#.....D...4............#',
    '#...i.#..........U.....#',
    '#p...p#p..............p#',
    '###D####################',
    '#......................#',
    '#.....................w#',
    '#########D##############',
    '#......................#',
    '#..SKKK....TTTT...0dd..#',
    '#..........cccc.....c..#',
    '#..tt..................#',
    '#......................#',
    '#..............LL......#',
    '#p............p.......V#',
    '########################',
  ],
}

const SOLID: Record<FloorId, Set<string>> = {
  floor_01: new Set('#XERTAHc=PSKVtwip1234'.split('')),
  floor_02: new Set('#ERfwBGb=QLSKV$ckdtjmpi567'.split('')),
  floor_03: new Set('#ER=Wfipc89NwSKydtLV'.split('')),
  floor_04: new Set('#ER=CHipc56wSKydtLV7'.split('')),
  floor_05: new Set('#ERipcwSKTtLVdU40'.split('')),
}

const NPCS: Record<FloorId, Array<{ x: number; y: number }>> = {
  floor_01: [
    { x: 8, y: 14 },
    { x: 6, y: 10 },
    { x: 13, y: 2 },
    { x: 6, y: 3 },
  ],
  floor_02: [
    { x: 9, y: 3 },
    { x: 19, y: 12 },
    { x: 3, y: 13 },
  ],
  floor_03: [
    { x: 10, y: 3 },
    { x: 19, y: 3 },
    { x: 17, y: 11 },
  ],
  floor_04: [
    { x: 10, y: 3 },
    { x: 19, y: 3 },
    { x: 17, y: 11 },
  ],
  floor_05: [
    { x: 10, y: 3 },
    { x: 18, y: 11 },
  ],
}

function glyphAt(floorId: FloorId, x: number, y: number) {
  const row = FLOOR_ART[floorId][y]
  if (!row || x < 0 || x >= row.length) return '#'
  const raw = row[x]
  return raw === '@' ? '.' : raw
}

function walkable(floorId: FloorId, x: number, y: number) {
  if (x < 0 || y < 0 || x >= 24 || y >= 18) return false
  if (SOLID[floorId].has(glyphAt(floorId, x, y))) return false
  if (NPCS[floorId].some((n) => n.x === x && n.y === y)) return false
  return true
}

function pathfind(
  floorId: FloorId,
  from: { x: number; y: number },
  to: { x: number; y: number },
): Facing[] | null {
  if (from.x === to.x && from.y === to.y) return []
  const q: Array<{ x: number; y: number; path: Facing[] }> = [{ ...from, path: [] }]
  const seen = new Set([`${from.x},${from.y}`])
  const dirs: Array<[Facing, number, number]> = [
    ['n', 0, -1],
    ['e', 1, 0],
    ['s', 0, 1],
    ['w', -1, 0],
  ]
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]
    for (const [dir, dx, dy] of dirs) {
      const nx = cur.x + dx
      const ny = cur.y + dy
      const key = `${nx},${ny}`
      if (seen.has(key) || !walkable(floorId, nx, ny)) continue
      const path = [...cur.path, dir]
      if (nx === to.x && ny === to.y) return path
      seen.add(key)
      q.push({ x: nx, y: ny, path })
    }
  }
  return null
}

export async function startFreshOffice(page: Page, className = 'Product Manager') {
  await page.goto('/')
  await page.evaluate((settings) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-settings', settings)
  }, muteSettings())
  await page.reload()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 15_000 })
  expect(await readClassicSave(page)).toBeNull()
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await expect(page.getByText('YOUR ROLE · FLOORS 1–5')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('radio', { name: className }).click()
  await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
  await expect(page.getByText('SIGNING BONUS')).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'File it' }).click()
  await expect(page.getByText('Floor 1 · of 5')).toBeVisible({ timeout: 10_000 })
  logBeat('fresh-save-started', { className })
}

export async function drainOverlays(page: Page, rounds = 24, opts: { allowCombat?: boolean } = {}) {
  const allowCombat = opts.allowCombat !== false
  for (let i = 0; i < rounds; i++) {
    if (!allowCombat) {
      const combatChoice = await page
        .getByRole('button', { name: /^(Bring it|Begin|Begin training|Not now)$/ })
        .first()
        .isVisible({ timeout: 0 })
        .catch(() => false)
      if (combatChoice) return
    }
    if (
      await page
        .getByText(/Floor \d · of 5/)
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      const blocking = await page
        .getByRole('dialog')
        .isVisible({ timeout: 0 })
        .catch(() => false)
      const coach = await page
        .locator('[id^="coach_"]')
        .isVisible({ timeout: 0 })
        .catch(() => false)
      if (!blocking && !coach) return
    }

    if (
      await page
        .getByText('CHOOSE A PERK')
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      await page.keyboard.press('1')
      await page.waitForTimeout(400)
      continue
    }

    const fileIt = page.getByRole('button', { name: 'File it' })
    if (await fileIt.isVisible({ timeout: 0 }).catch(() => false)) {
      await fileIt.click({ timeout: 2_000 })
      await page.waitForTimeout(200)
      continue
    }

    const confirmNames = allowCombat
      ? [
          'Bring it',
          'Begin',
          'Begin training',
          'Extend the offer',
          'Stay on the floor',
          'Back to Floor 1',
          'Back to Floor 2',
          'Back to Floor 3',
          'Back to Floor 4',
          'Back to Floor 5',
        ]
      : ['File it']
    let clicked = false
    for (const name of confirmNames) {
      const btn = page.getByRole('button', { name, exact: true })
      if (await btn.isVisible({ timeout: 0 }).catch(() => false)) {
        await btn.click({ timeout: 2_000 }).catch(() => {})
        await page.waitForTimeout(250)
        clicked = true
        break
      }
    }
    if (clicked) continue

    const coach = page.locator('[id^="coach_"]')
    if (await coach.isVisible({ timeout: 0 }).catch(() => false)) {
      await coach.click().catch(() => {})
      await page.keyboard.press('Enter').catch(() => {})
      await page.waitForTimeout(200)
      continue
    }

    await page.keyboard.press('Enter')
    await page.waitForTimeout(180)
  }
}

export async function walkTo(
  page: Page,
  x: number,
  y: number,
  facing?: Facing,
  label = `${x},${y}`,
) {
  logBeat(`walkTo:${label}:start`)
  for (let attempt = 0; attempt < 80; attempt++) {
    await drainOverlays(page, 6, { allowCombat: false })
    if (
      await page
        .getByText('TAP A MOVE')
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      return
    }
    if (
      await page
        .getByRole('button', { name: /^(Bring it|Begin|Begin training)$/ })
        .first()
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      return
    }
    const cur = await readOfficeSave(page)
    if (!cur) throw new Error(`walkTo ${label}: no office save`)
    if (cur.player.x === x && cur.player.y === y) {
      const dlg = await page
        .getByRole('dialog')
        .isVisible({ timeout: 0 })
        .catch(() => false)
      if (!facing || cur.player.facing === facing || dlg) {
        await drainOverlays(page, 4, { allowCombat: false })
        return
      }
      await page.keyboard.press(KEY[facing])
      await page.waitForTimeout(280)
      continue
    }
    const route = pathfind(cur.floorId, cur.player, { x, y })
    if (!route) {
      throw new Error(
        `walkTo ${label}: no path from ${cur.player.x},${cur.player.y} on ${cur.floorId}`,
      )
    }
    if (attempt > 0 && attempt % 20 === 0) {
      logBeat(`walkTo:${label}:retry`, { attempt, at: `${cur.player.x},${cur.player.y}` })
    }
    await page.keyboard.press(KEY[route[0]])
    await page.waitForTimeout(300)
  }
  const after = await readOfficeSave(page)
  throw new Error(
    `walkTo ${label}: stuck at ${after?.player.x},${after?.player.y} facing ${after?.player.facing}`,
  )
}

export async function passDoor(page: Page) {
  const stepIn = page.getByRole('button', { name: 'Step in' })
  if (await stepIn.isVisible({ timeout: 0 }).catch(() => false)) {
    await stepIn.click({ timeout: 2_000 }).catch(() => {})
    await page.waitForTimeout(350)
    return true
  }
  return false
}

export async function interact(page: Page) {
  await page.keyboard.press('e')
  await page.waitForTimeout(280)
  await drainOverlays(page)
}

export async function talkThrough(page: Page, preferred?: string[]) {
  await page.keyboard.press('e')
  await page.waitForTimeout(250)
  for (let i = 0; i < 20; i++) {
    if (preferred) {
      for (const name of preferred) {
        const btn = page.getByRole('button', { name, exact: true })
        if (await btn.isVisible({ timeout: 0 }).catch(() => false)) {
          await btn.click()
          await page.waitForTimeout(250)
          return
        }
      }
    }
    if (
      await page
        .getByText(/Floor \d · of 5/)
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      const dlg = await page
        .getByRole('dialog')
        .isVisible({ timeout: 0 })
        .catch(() => false)
      if (!dlg) return
    }
    if (
      await page
        .getByText('TAP A MOVE')
        .isVisible({ timeout: 0 })
        .catch(() => false)
    )
      return
    if (
      await page
        .getByText('CHOOSE A PERK')
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      await page.keyboard.press('1')
      await page.waitForTimeout(400)
      return
    }
    const fileIt = page.getByRole('button', { name: 'File it' })
    if (await fileIt.isVisible({ timeout: 0 }).catch(() => false)) {
      await fileIt.click()
      await page.waitForTimeout(200)
      continue
    }
    for (const name of ['Bring it', 'Begin', 'Begin training', 'Step in', 'Extend the offer']) {
      const btn = page.getByRole('button', { name, exact: true })
      if (await btn.isVisible({ timeout: 0 }).catch(() => false)) {
        await btn.click()
        await page.waitForTimeout(250)
        return
      }
    }
    await page.keyboard.press('Enter')
    await page.waitForTimeout(160)
  }
}

export async function waitOverworld(page: Page) {
  await expect(page.getByText(/Floor \d · of 5/)).toBeVisible({ timeout: 20_000 })
}

export async function fightUntilSettled(page: Page, encounter: string) {
  const notes = { phase2: false, wipe: false, win: false }
  for (let i = 0; i < 220; i++) {
    if (i > 0 && i % 20 === 0) logBeat(`fight:${encounter}:tick`, { i, ...notes })
    if (
      await page
        .getByText(/PHASE 2|Let's take this offline/)
        .first()
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      notes.phase2 = true
    }

    if (
      await page
        .getByText('CHOOSE A PERK')
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      notes.win = true
      await page.keyboard.press('1')
      await page.waitForTimeout(500)
      await drainOverlays(page)
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    if (
      await page
        .getByText(/You take five|take five/i)
        .isVisible({ timeout: 0 })
        .catch(() => false)
    ) {
      notes.wipe = true
      await drainOverlays(page)
      logBeat(`fight:${encounter}:wipe`, notes)
      return notes
    }

    if (
      (await page
        .getByText(/Floor \d · of 5/)
        .isVisible({ timeout: 0 })
        .catch(() => false)) &&
      !(await page
        .getByText('TAP A MOVE')
        .isVisible({ timeout: 0 })
        .catch(() => false)) &&
      !(await page
        .locator('[data-testid="move-button"]')
        .first()
        .isVisible({ timeout: 0 })
        .catch(() => false))
    ) {
      const dlg = await page
        .getByRole('dialog')
        .isVisible({ timeout: 0 })
        .catch(() => false)
      if (!dlg) {
        notes.win = true
        await drainOverlays(page)
        logBeat(`fight:${encounter}`, notes)
        return notes
      }
    }

    const switchDlg = page.getByRole('dialog', { name: /Switch party member/i })
    if (await switchDlg.isVisible({ timeout: 0 }).catch(() => false)) {
      const bench = switchDlg.locator('button').first()
      if (await bench.isVisible({ timeout: 0 }).catch(() => false)) {
        await bench.click({ timeout: 2_000 }).catch(() => {})
        await page.waitForTimeout(500)
        continue
      }
    }

    const move = page.locator('[data-testid="move-button"]:not([disabled])').first()
    if (await move.isVisible({ timeout: 0 }).catch(() => false)) {
      await move.click({ timeout: 2_000 }).catch(() => {})
      await page.keyboard.press(String((i % 4) + 1))
      await page.waitForTimeout(700)
      continue
    }

    const pwr = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await pwr.isVisible({ timeout: 0 }).catch(() => false)) {
      await pwr.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(700)
      continue
    }

    await page.keyboard.press('Enter')
    await page.waitForTimeout(220)
  }
  throw new Error(`fight ${encounter} did not settle`)
}

export async function beginAndFight(page: Page, encounter: string, preferred?: string[]) {
  await talkThrough(page, preferred)
  const stakes = page.getByRole('button', { name: /^(Bring it|Begin|Begin training)$/ }).first()
  if (await stakes.isVisible({ timeout: 0 }).catch(() => false)) {
    await stakes.click()
    await page.waitForTimeout(400)
  }
  return fightUntilSettled(page, encounter)
}

export async function openElevator(page: Page) {
  await walkTo(page, 3, 2, 'n', 'elevator boarding')
  await page.keyboard.press('e')
  await expect(page.getByRole('listbox', { name: 'Elevator floors' })).toBeVisible({
    timeout: 8_000,
  })
}

export async function rideElevator(page: Page, to: 1 | 2 | 3 | 4 | 5) {
  await openElevator(page)
  await page.keyboard.press(String(to))
  await page.waitForTimeout(400)
  // Cab ride + optional celebration. Prefer the destination floor button
  // (preview-complete labels it "Floor 2", not "stay").
  await page.waitForTimeout(2_800)
  const dest = page.getByRole('button', { name: `Floor ${to}`, exact: true })
  if (await dest.isVisible({ timeout: 0 }).catch(() => false)) {
    await dest.click()
    await page.waitForTimeout(400)
  } else {
    const stay = page.getByRole('button', { name: /Back to Floor/ })
    if (await stay.isVisible({ timeout: 0 }).catch(() => false)) await stay.click()
  }
  await drainOverlays(page)
  await waitOverworld(page)
}

export async function expectObjective(page: Page, text: string | RegExp) {
  await expect(page.getByLabel('Objective')).toContainText(text, { timeout: 8_000 })
}

export async function injectOfficeSave(page: Page, save: unknown) {
  await page.goto('/')
  await page.evaluate(
    ({ next, settings, key }) => {
      localStorage.clear()
      localStorage.setItem(key, JSON.stringify(next))
      localStorage.setItem('corporate-climb-settings', settings)
    },
    { next: save, settings: muteSettings(), key: OFFICE_SAVE_KEY },
  )
  await page.reload()
  await page.getByRole('button', { name: 'THE OFFICE' }).click({ timeout: 15_000 })
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 10_000 })
  await waitOverworld(page)
}

export async function continueOfficeFromTitle(page: Page) {
  await page.getByRole('button', { name: 'Title' }).click()
  await expect(page.getByRole('button', { name: 'THE OFFICE' })).toBeVisible({ timeout: 10_000 })
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 10_000 })
  await waitOverworld(page)
}

export async function assertNoClassicBleed(page: Page) {
  const classic = await readClassicSave(page)
  expect(classic, 'Classic corporate-climb-save must stay empty during Office').toBeNull()
}
