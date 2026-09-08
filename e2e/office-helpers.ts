import { expect, type Locator, type Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const PREFERRED_ARTIFACT_DIR = '/opt/cursor/artifacts/e2e-full-climb'
const FALLBACK_ARTIFACT_DIR = path.join('test-results', 'e2e-full-climb')

function resolveArtifactDir(): string {
  const fromEnv = process.env.PLAYTEST_ARTIFACT_DIR
  const candidates = [...(fromEnv ? [fromEnv] : []), PREFERRED_ARTIFACT_DIR, FALLBACK_ARTIFACT_DIR]
  for (const dir of candidates) {
    try {
      mkdirSync(dir, { recursive: true })
      writeFileSync(path.join(dir, '.writable'), 'ok')
      return dir
    } catch (error) {
      console.warn(`[climb] Artifact directory unavailable: ${dir}`, error)
    }
  }
  return FALLBACK_ARTIFACT_DIR
}

export const ARTIFACT_DIR = resolveArtifactDir()
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
  const file = path.join(ARTIFACT_DIR, `${name}.png`)
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true })
    await page.screenshot({ path: file, fullPage: true })
  } catch (error) {
    console.warn(`[climb] Could not write screenshot: ${file}`, error)
  }
}

export function writeClimbLog() {
  const file = path.join(ARTIFACT_DIR, 'beats.log')
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true })
    writeFileSync(file, BEATS.join('\n') + '\n')
  } catch (error) {
    console.warn(`[climb] Could not write climb log: ${file}`, error)
  }
}

async function vis(el: Locator) {
  return el.isVisible({ timeout: 0 }).catch(() => false)
}

export async function writeCheckpoint(page: Page, name: string) {
  const save = await readOfficeSave(page)
  const file = path.join(ARTIFACT_DIR, `checkpoint-${name}.json`)
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true })
    writeFileSync(file, JSON.stringify(save, null, 2))
  } catch (error) {
    console.warn(`[climb] Could not write checkpoint: ${file}`, error)
  }
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

export async function drainOverlays(
  page: Page,
  rounds = 24,
  opts: { allowCombat?: boolean; keepCelebration?: boolean } = {},
) {
  const allowCombat = opts.allowCombat !== false
  for (let i = 0; i < rounds; i++) {
    // Enter on the cab panel rides to the focused floor. Never auto-advance it.
    if (await vis(page.getByRole('listbox', { name: 'Elevator floors' }))) return
    if (opts.keepCelebration && (await vis(page.getByText('THE NOD', { exact: true })))) return
    if (opts.keepCelebration && (await vis(page.getByRole('dialog', { name: /THE CLIMB/i }))))
      return
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

    let confirmNames = allowCombat
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
    if (opts.keepCelebration) {
      confirmNames = confirmNames.filter((name) => !/^(Back to Floor|Floor \d|Title)/.test(name))
    }
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
    if (await vis(page.getByRole('listbox', { name: 'Elevator floors' }))) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(250)
    }
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
      if (facing && cur.player.facing !== facing) {
        await page.keyboard.press(KEY[facing])
        await page.waitForTimeout(280)
      }
      return
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

const BREAK_SPOT: Record<FloorId, { x: number; y: number; facing: Facing }> = {
  floor_01: { x: 19, y: 8, facing: 'n' },
  floor_02: { x: 11, y: 11, facing: 'n' },
  floor_03: { x: 5, y: 12, facing: 'n' },
  floor_04: { x: 5, y: 12, facing: 'n' },
  floor_05: { x: 5, y: 12, facing: 'n' },
}

export async function takeFive(page: Page) {
  const save = await readOfficeSave(page)
  if (!save) return
  const spot = BREAK_SPOT[save.floorId]
  await walkTo(page, spot.x, spot.y, spot.facing, `take-five-${save.floorId}`)
  await page.keyboard.press('e')
  await page.waitForTimeout(280)
  const yes = page.getByRole('button', { name: 'Take five', exact: true })
  if (await vis(yes)) {
    await yes.click({ timeout: 2_000 }).catch(() => {})
    await page.waitForTimeout(350)
  }
  await drainOverlays(page, 8, { allowCombat: false })
  logBeat('take-five', { floorId: save.floorId })
}

export type FightNotes = { phase2: boolean; wipe: boolean; win: boolean; wipes: number }

async function pickPerk(page: Page) {
  const choices = page.getByLabel('Promotion reward choices').locator('button').first()
  if (await vis(choices)) {
    await choices.click({ timeout: 2_000 }).catch(() => {})
  } else {
    await page.keyboard.press('1')
  }
  await page.waitForTimeout(450)
}

async function dismissWipe(page: Page) {
  // Interstitial ignores input for 1.2s, then Enter / click advances.
  await page.waitForTimeout(1_350)
  const plate = page.getByText('Your team needs a minute.')
  if (await vis(plate)) {
    await plate.click({ timeout: 2_000 }).catch(() => {})
  }
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  await drainOverlays(page, 10, { allowCombat: false })
}

async function skipBattleText(page: Page) {
  const line = page.locator('p[aria-live="polite"][aria-label]').first()
  if (await vis(line)) {
    await line.click({ timeout: 400, force: true }).catch(() => {})
  }
  const logP = page
    .locator('p')
    .filter({ hasText: /used |damage|faint|Offline|burned/i })
    .last()
  if (await vis(logP)) {
    await logP.click({ timeout: 400, force: true }).catch(() => {})
  }
}

async function inBattle(page: Page) {
  if (await vis(page.getByRole('button', { name: 'FIGHT' }))) return true
  if (await vis(page.getByText('YOUR MOVE'))) return true
  if (await vis(page.getByText('THEIR MOVE'))) return true
  if (await vis(page.getByText('TAP A MOVE'))) return true
  if (await vis(page.getByText('REVIEW CLOSED'))) return true
  if ((await page.locator('[data-testid="move-button"]').count()) > 0) return true
  // Sequencer hold: command-deck TextBox stays mounted while moves are hidden.
  if (await vis(page.locator('p[aria-live="polite"][aria-label]').first())) return true
  return false
}

export async function fightUntilSettled(page: Page, encounter: string): Promise<FightNotes> {
  const notes: FightNotes = { phase2: false, wipe: false, win: false, wipes: 0 }
  for (let i = 0; i < 520; i++) {
    if (i > 0 && i % 20 === 0) {
      logBeat(`fight:${encounter}:tick`, { i, ...notes })
      if (i % 80 === 0) await shot(page, `fight-${encounter}-t${i}`)
    }

    if (await vis(page.getByText(/PHASE 2|Let's take this offline|Let's restructure/).first())) {
      notes.phase2 = true
    }

    if (await vis(page.getByText('CHOOSE A PERK'))) {
      notes.win = true
      await page.waitForTimeout(400)
      await pickPerk(page)
      await drainOverlays(page, 24, { keepCelebration: true })
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    // Celebration title is THE CLIMB; the THE NOD stamp is aria-hidden.
    if ((await vis(page.getByRole('dialog', { name: /THE CLIMB/i }))) && !(await inBattle(page))) {
      notes.win = true
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    if (
      (await vis(page.getByText('TIME OUT'))) ||
      (await vis(page.getByText('Your team needs a minute.')))
    ) {
      notes.wipe = true
      await dismissWipe(page)
      logBeat(`fight:${encounter}:wipe`, notes)
      return notes
    }

    const takeFiveToast = page.getByText(/You take five\. Everyone/)
    if ((await vis(takeFiveToast)) && !(await inBattle(page))) {
      notes.wipe = true
      await drainOverlays(page, 8, { allowCombat: false })
      logBeat(`fight:${encounter}:wipe-toast`, notes)
      return notes
    }

    const fileIt = page.getByRole('button', { name: 'File it' })
    if (await vis(fileIt)) {
      notes.win = true
      await fileIt.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(300)
      if (await vis(page.getByText('CHOOSE A PERK'))) await pickPerk(page)
      await drainOverlays(page, 24, { keepCelebration: true })
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    if ((await vis(page.getByRole('dialog', { name: /THE CLIMB/i }))) && !(await inBattle(page))) {
      notes.win = true
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    const backFloor = page.getByRole('button', { name: /Back to Floor/ }).first()
    if ((await vis(backFloor)) && !(await inBattle(page))) {
      notes.win = true
      if (encounter !== 'caldwell') {
        await backFloor.click({ timeout: 2_000 }).catch(() => {})
        await page.waitForTimeout(300)
        await drainOverlays(page, 24, { keepCelebration: true })
      }
      logBeat(`fight:${encounter}`, notes)
      return notes
    }

    if ((await vis(page.getByText(/Floor \d · of 5/))) && !(await inBattle(page))) {
      const dlg = await vis(page.getByRole('dialog').first())
      const interstitial = await vis(page.getByText('TIME OUT'))
      if (!dlg && !interstitial) {
        const save = await readOfficeSave(page)
        const expected: Record<string, string> = {
          gavin: 'enc_desk_challenger',
          holloway: 'enc_supervisor_1on1',
          teddy: 'enc_help_desk_intern',
          kessler: 'enc_director_review',
          quincy: 'enc_vp_product',
          ashford: 'enc_vp_sales',
          caldwell: 'enc_ceo_review',
        }
        const id = expected[encounter]
        if (id && save?.encounters[id] === 'won') {
          notes.win = true
          await drainOverlays(page)
          logBeat(`fight:${encounter}`, notes)
          return notes
        }
      }
    }

    const gotIt = page.getByRole('button', { name: 'GOT IT' })
    if (await vis(gotIt)) {
      await gotIt.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(200)
      continue
    }

    const logClose = page.getByRole('button', { name: 'CLOSE' })
    if (await vis(logClose)) {
      await logClose.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(200)
      continue
    }

    const switchDlg = page.getByRole('dialog', { name: /Switch party member/i })
    if (await vis(switchDlg)) {
      const standing = switchDlg.locator('button:not([disabled])').filter({ hasNotText: /^Back$/ })
      const n = await standing.count()
      if (n > 0) {
        await standing
          .nth(0)
          .click({ timeout: 2_000 })
          .catch(() => {})
        await page.waitForTimeout(500)
        continue
      }
    }

    const coach = page.locator('[id^="coach_"]')
    if (await vis(coach)) {
      await coach.click().catch(() => {})
      await page.keyboard.press('Enter').catch(() => {})
      await page.waitForTimeout(200)
      continue
    }

    const moves = page.locator('[data-testid="move-button"]:not([disabled])')
    const moveCount = await moves.count()
    if (moveCount > 0 && (await vis(moves.first()))) {
      await moves
        .nth(i % moveCount)
        .click({ timeout: 2_000 })
        .catch(() => {})
      await page.waitForTimeout(280)
      await skipBattleText(page)
      await page.waitForTimeout(200)
      continue
    }

    const pwr = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await vis(pwr)) {
      await pwr.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(400)
      continue
    }

    if (await inBattle(page)) {
      await skipBattleText(page)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(180)
      continue
    }

    await page.keyboard.press('Enter')
    await page.waitForTimeout(200)
  }
  await shot(page, `fight-${encounter}-stall`)
  throw new Error(`fight ${encounter} did not settle`)
}

export async function approachKessler(page: Page) {
  await walkTo(page, 3, 8, undefined, 'Kessler door approach')
  await page.keyboard.press('ArrowDown')
  await page.waitForTimeout(320)
  const blocked = page.getByRole('button', { name: 'Back', exact: true })
  if (await vis(blocked)) {
    await blocked.click({ timeout: 2_000 }).catch(() => {})
    await takeFive(page)
    await walkTo(page, 3, 8, undefined, 'Kessler door retry')
    await page.keyboard.press('ArrowDown')
    await page.waitForTimeout(320)
  }
  await passDoor(page)
}

export async function beginAndFight(
  page: Page,
  encounter: string,
  opts: {
    preferred?: string[]
    approach?: () => Promise<void>
    healFirst?: boolean
    maxWipes?: number
  } = {},
): Promise<FightNotes> {
  const preferred = opts.preferred
  const maxWipes = opts.maxWipes ?? 8
  if (opts.healFirst) await takeFive(page)

  const start = async () => {
    if (opts.approach) await opts.approach()
    await talkThrough(page, preferred)
    const stakes = page.getByRole('button', { name: /^(Bring it|Begin|Begin training)$/ }).first()
    if (await vis(stakes)) {
      await stakes.click({ timeout: 2_000 }).catch(() => {})
      await page.waitForTimeout(400)
    }
  }

  let wipes = 0
  let last: FightNotes = { phase2: false, wipe: false, win: false, wipes: 0 }
  for (let attempt = 0; attempt <= maxWipes; attempt++) {
    if (attempt > 0) {
      await drainOverlays(page, 10, { allowCombat: false })
      await takeFive(page)
    }
    await start()
    last = await fightUntilSettled(page, encounter)
    last.wipes = wipes
    if (last.win) {
      logBeat(`fight:${encounter}:cleared`, last)
      return last
    }
    if (last.wipe) {
      wipes += 1
      last.wipes = wipes
      logBeat(`fight:${encounter}:retry`, { attempt, wipes })
      continue
    }
  }
  await shot(page, `fight-${encounter}-gave-up`)
  throw new Error(`fight ${encounter} did not win after ${wipes} wipes`)
}

export async function openElevator(page: Page) {
  const panel = page.getByRole('listbox', { name: 'Elevator floors' })
  if (await vis(panel)) return
  const here = await readOfficeSave(page)
  if (!here || here.player.x !== 3 || here.player.y !== 2 || here.player.facing !== 'n') {
    await walkTo(page, 3, 2, 'n', 'elevator boarding')
  }
  if (await vis(panel)) return
  await page.keyboard.press('e')
  await expect(panel).toBeVisible({ timeout: 8_000 })
}

export async function rideElevator(page: Page, to: 1 | 2 | 3 | 4 | 5) {
  const already = await readOfficeSave(page)
  if (already?.floorId === (`floor_0${to}` as FloorId)) {
    const panel = page.getByRole('listbox', { name: 'Elevator floors' })
    if (await vis(panel)) {
      await page.keyboard.press('Escape')
      await page.waitForTimeout(200)
    }
    await waitOverworld(page)
    return
  }
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
