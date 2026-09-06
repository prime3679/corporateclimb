#!/usr/bin/env node
/**
 * Record a Meng-tier Corporate Climb Office trailer (~60–120s).
 *
 * Usage (dev server must be up, or pass --start-server):
 *   node scripts/record-office-demo.mjs
 *
 * Writes:
 *   /opt/cursor/artifacts/corporate-climb-office-demo.mp4
 *   /tmp/office-demo/  (working clips)
 */
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { mkdir, rm, readdir, copyFile } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const WORK = '/tmp/office-demo'
const CLIPS = path.join(WORK, 'clips')
const FINAL = '/opt/cursor/artifacts/corporate-climb-office-demo.mp4'
const POSTER = '/opt/cursor/artifacts/corporate-climb-office-demo-poster.png'
const BASE = process.env.OFFICE_DEMO_URL ?? 'http://127.0.0.1:4173'
const VIEW = { width: 1920, height: 1080 }
const OUT = { width: 1280, height: 720 }
const FONT_DISPLAY = '/usr/share/fonts/truetype/noto/NotoSansDisplay-Bold.ttf'
const FONT_BODY = '/usr/share/fonts/truetype/macos/Inter-Regular.ttf'

const PERK_POOL = [
  'gym_membership',
  'assertiveness_training',
  'executive_presence',
  'balanced_package',
  'overtime_grind',
  'perfectionist',
  'networking_guru',
  'morning_person',
  'self_care',
  'negotiator',
  'employee_discount',
  'headhunter',
  'signing_bonus',
  'personal_brand',
  'golden_handcuffs',
  'killer_instinct',
  'dividends',
]

const SETTINGS = {
  textSpeed: 'fast',
  musicVolume: 0,
  sfxVolume: 0,
  reduceMotion: false,
  haptics: false,
}

function officeSave(patch = {}) {
  const pp = [15, 20, 6, 3]
  const base = {
    version: 2,
    run: {
      mode: { kind: 'normal' },
      classId: 'pm',
      floor: 0,
      level: 6,
      xp: 24,
      xpToNext: 90,
      hp: 100,
      pp,
      atkBuff: 40,
      defBuff: 20,
      inventory: ['networking_card'],
      floorEnemyIds: [],
      ngPlus: 0,
      stats: { totalTurns: 18, totalDamageDealt: 220, itemsUsed: 0 },
      usedEvents: [],
      rngState: null,
      stockOptions: 48,
      perks: [],
      pendingPerkOffer: null,
      shopStock: ['espresso', 'espresso', 'side_hustle'],
      relics: [],
      eliteFloor: false,
      mystery: null,
      treasureFloor: false,
      treasureLoot: null,
      perkPool: PERK_POOL,
      relicPool: [],
      ascension: 0,
    },
    party: [{ slot: 'party_slot_0', def: { kind: 'lead', classId: 'pm' }, hp: 100, pp }],
    hired: [],
    bench: {},
    floorId: 'floor_01',
    player: { x: 3, y: 2, facing: 'n' },
    assignments: {
      asg_printer: 'complete',
      asg_meeting_prep: 'complete',
      asg_transfer: 'not_started',
      asg_audit: 'not_started',
      asg_roadmap: 'not_started',
      asg_leavebehind: 'not_started',
      asg_board_packet: 'not_started',
    },
    encounters: {
      enc_desk_challenger: 'won',
      enc_meeting_prepper: 'won',
      enc_supervisor_1on1: 'won',
      enc_help_desk_intern: 'open',
      enc_auditor: 'open',
      enc_director_review: 'open',
      enc_vp_product: 'open',
      enc_vp_sales: 'open',
      enc_ceo_review: 'open',
    },
    keyItems: { key_access_badge: 1, key_offer_letter: 2 },
    rewardsClaimed: [
      'rwd_start_options',
      'rwd_asg_printer',
      'rwd_enc_desk_challenger',
      'rwd_enc_meeting_prepper',
      'rwd_enc_supervisor_1on1',
    ],
    flags: ['flag_move_coached', 'flag_interact_coached', 'flag_pin_coached', 'flag_greeted'],
    firedTriggers: [
      'trg_first_step:spawn',
      'trg_renata_callout',
      'trg_elevator_ride:floor_01->floor_02',
    ],
    stats: { battlesWon: 3, losses: 0, switches: 1, msOnFloor: 280000, rides: 0 },
    vendingStock: {
      floor_01: ['espresso', 'espresso', 'side_hustle'],
      floor_02: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_03: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_04: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_05: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
    },
  }
  return {
    ...base,
    ...patch,
    run: { ...base.run, ...(patch.run ?? {}) },
    party: patch.party ?? base.party,
    assignments: { ...base.assignments, ...(patch.assignments ?? {}) },
    encounters: { ...base.encounters, ...(patch.encounters ?? {}) },
    keyItems: { ...base.keyItems, ...(patch.keyItems ?? {}) },
    flags: patch.flags ?? base.flags,
    firedTriggers: patch.firedTriggers ?? base.firedTriggers,
    stats: { ...base.stats, ...(patch.stats ?? {}) },
    player: patch.player ?? base.player,
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function sh(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    let out = ''
    let err = ''
    child.stdout.on('data', (d) => {
      out += d
    })
    child.stderr.on('data', (d) => {
      err += d
    })
    child.on('close', (code) => {
      if (code === 0) resolve({ out, err })
      else reject(new Error(`${cmd} ${args.join(' ')} failed (${code})\n${err || out}`))
    })
  })
}

async function waitFor(page, fn, timeout = 15_000) {
  const start = Date.now()
  while (Date.now() - start < timeout) {
    if (await fn()) return
    await sleep(120)
  }
  throw new Error(`waitFor timed out after ${timeout}ms`)
}

async function walk(page, keys, ms = 380) {
  for (const key of keys) {
    await page.keyboard.press(key)
    await sleep(ms)
  }
}

/** Finish the typewriter, hold, then advance. */
async function beatLine(page, { typeMs = 700, hold = 1100, advance = true } = {}) {
  await sleep(typeMs)
  await page.keyboard.press('Enter')
  await sleep(hold)
  if (advance) {
    await page.keyboard.press('Enter')
    await sleep(220)
  }
}

async function primePage(page, { save = null, fresh = false } = {}) {
  await page.addInitScript(
    ({ settings, save, fresh }) => {
      try {
        if (fresh) localStorage.clear()
        localStorage.setItem('corporate-climb-settings', JSON.stringify(settings))
        localStorage.setItem('corporate-climb-seen-hint', '1')
        localStorage.setItem(
          'corporate-climb-install-nudge',
          JSON.stringify({ count: 2, last: Date.now() }),
        )
        if (save) localStorage.setItem('corporate-climb-office-save', JSON.stringify(save))
      } catch {
        /* ignore */
      }
    },
    { settings: SETTINGS, save, fresh },
  )
  await page.addStyleTag({
    content: 'html, body, * { cursor: none !important; }',
  })
}

async function openTitle(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' })
  await page.locator('button', { hasText: 'THE OFFICE' }).waitFor({ timeout: 20_000 })
  await sleep(400)
}

async function continueOffice(page) {
  await page.locator('button', { hasText: 'THE OFFICE' }).click()
  await page.locator('button', { hasText: 'CONTINUE' }).waitFor({ timeout: 10_000 })
  await sleep(700)
  await page.locator('button', { hasText: 'CONTINUE' }).click()
}

async function recordClip(browser, name, play) {
  const dir = path.join(CLIPS, name)
  await mkdir(dir, { recursive: true })
  const context = await browser.newContext({
    viewport: VIEW,
    deviceScaleFactor: 1,
    recordVideo: { dir, size: VIEW },
    reducedMotion: 'no-preference',
  })
  const page = await context.newPage()
  try {
    await play(page)
  } catch (err) {
    const shot = path.join(WORK, `${name}-fail.png`)
    await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
    throw new Error(`${name}: ${err.message}\nsee ${shot}`)
  } finally {
    await context.close()
  }
  const files = (await readdir(dir)).filter((f) => f.endsWith('.webm'))
  if (!files.length) throw new Error(`No video written for ${name}`)
  const src = path.join(dir, files[0])
  const dest = path.join(WORK, `${name}.webm`)
  await copyFile(src, dest)
  return dest
}

async function clipArrival(page) {
  await primePage(page, { fresh: true })
  await openTitle(page)
  await sleep(2800)

  await page.locator('button', { hasText: 'THE OFFICE' }).click()
  await page.getByText('YOUR ROLE · FLOORS 1–5').waitFor({ timeout: 10_000 })
  await sleep(1400)
  await page.keyboard.press('ArrowRight')
  await sleep(700)
  await page.keyboard.press('ArrowLeft')
  await sleep(900)
  await page.locator('button', { hasText: 'ACCEPT OFFER' }).click()

  await page.getByText('SIGNING BONUS').waitFor({ timeout: 10_000 })
  await sleep(1600)
  await page.locator('button', { hasText: 'File it' }).click()

  await page.locator('#coach_move').waitFor({ timeout: 10_000 })
  await page.getByText('Floor 1 · of 5').waitFor()
  await sleep(1600)

  await page.keyboard.press('ArrowLeft')
  await page.getByText('New hire. Front desk. Now.').waitFor({ timeout: 10_000 })
  await sleep(1300)
  await page.keyboard.press('Enter')
  await page.locator('#coach_pin').waitFor({ timeout: 8_000 })
  await sleep(1400)
  await page.locator('#coach_pin').click()

  await walk(page, ['ArrowLeft', 'ArrowDown', 'ArrowLeft', 'ArrowUp'])
  await page.getByText('Talk · Renata').first().waitFor({ timeout: 8_000 })
  await sleep(600)
  await page.keyboard.press('e')
  await page.getByText('You have the look. Hopeful. Badge-less.').waitFor({ timeout: 10_000 })
  await beatLine(page, { typeMs: 500, hold: 1400, advance: true })
  await beatLine(page, { typeMs: 800, hold: 1800, advance: false })
  await sleep(800)
}

async function clipShaft(page) {
  await primePage(page, {
    save: officeSave({
      player: { x: 3, y: 2, facing: 'n' },
      flags: [
        'flag_move_coached',
        'flag_interact_coached',
        'flag_pin_coached',
        'flag_elevator_coached',
        'flag_greeted',
      ],
    }),
  })
  await openTitle(page)
  await sleep(400)
  await continueOffice(page)
  await page
    .getByText('Floor 1 · of 5')
    .or(page.getByText('YOUR TEAM'))
    .waitFor({ timeout: 12_000 })
  await sleep(900)
  await page.keyboard.press('e')
  await page.getByRole('listbox', { name: 'Elevator floors' }).waitFor({ timeout: 8_000 })
  await sleep(2400)
  await page.keyboard.press('2')
  await page
    .getByLabel(/Elevator to/)
    .waitFor({ timeout: 5_000 })
    .catch(() => {})
  await page.getByText('FLOOR 1 CLEARED').waitFor({ timeout: 12_000 })
  await sleep(3600)
  await page.locator('button', { hasText: 'Floor 2' }).click()
  await sleep(1600)
  await page.keyboard.press('ArrowDown')
  await sleep(500)
  const callout = page.getByText('Visitor badge. On two. Bold.')
  if (await callout.isVisible().catch(() => false)) {
    await sleep(1400)
    await page.keyboard.press('Enter')
    await sleep(400)
  }
  await sleep(1400)
}

async function clipCombat(page) {
  await primePage(page, {
    save: officeSave({
      floorId: 'floor_02',
      player: { x: 8, y: 3, facing: 'e' },
      assignments: { asg_transfer: 'complete' },
      flags: [
        'flag_move_coached',
        'flag_interact_coached',
        'flag_pin_coached',
        'flag_elevator_coached',
        'flag_greeted',
        'flag_preview_complete',
        'flag_visited_f2',
      ],
      firedTriggers: [
        'trg_first_step:spawn',
        'trg_first_step_f2:arrival',
        'trg_elevator_ride:floor_01->floor_02',
      ],
      stats: { battlesWon: 3, losses: 0, switches: 1, msOnFloor: 90000, rides: 1 },
    }),
  })
  await openTitle(page)
  await continueOffice(page)
  await page.getByText('Talk · Teddy').first().waitFor({ timeout: 12_000 })
  await sleep(700)
  await page.keyboard.press('e')
  await page.getByText('Filed. That makes you a transfer').waitFor({ timeout: 10_000 })
  await beatLine(page, { typeMs: 600, hold: 1200, advance: true })
  await beatLine(page, { typeMs: 600, hold: 1300, advance: true })
  await page.getByText('Begin training').waitFor({ timeout: 8_000 })
  await sleep(1100)
  await page.locator('button', { hasText: 'Begin training' }).click()
  await page.locator('[data-testid="move-button"]').first().waitFor({ timeout: 12_000 })
  await page.getByText('FLOOR').waitFor()
  await sleep(2000)
  const move = page.locator('[data-testid="move-button"]').first()
  if (await move.isVisible().catch(() => false)) await move.click()
  else await page.keyboard.press('1')
  await sleep(2800)
}

async function clipExec(page) {
  await primePage(page, {
    save: officeSave({
      floorId: 'floor_05',
      player: { x: 3, y: 2, facing: 's' },
      keyItems: { key_access_badge: 1, key_employee_badge: 1, key_offer_letter: 1 },
      flags: [
        'flag_move_coached',
        'flag_interact_coached',
        'flag_pin_coached',
        'flag_elevator_coached',
        'flag_greeted',
        'flag_preview_complete',
        'flag_floor2_complete',
        'flag_visited_f2',
        'flag_visited_f3',
        'flag_visited_f4',
      ],
      firedTriggers: [
        'trg_first_step:spawn',
        'trg_first_step_f2:arrival',
        'trg_first_step_f3:arrival',
        'trg_first_step_f4:arrival',
      ],
      stats: { battlesWon: 7, losses: 1, switches: 2, msOnFloor: 40000, rides: 4 },
    }),
  })
  await openTitle(page)
  await continueOffice(page)
  await sleep(1000)
  await page.keyboard.press('ArrowDown')
  await page.getByText('You are not on the calendar.').waitFor({ timeout: 10_000 })
  await sleep(1600)
  await page.keyboard.press('Enter')
  await sleep(300)
  await walk(page, [
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
    'ArrowRight',
  ])
  await page.getByText('Talk · Marlowe').first().waitFor({ timeout: 8_000 })
  await sleep(500)
  await page.keyboard.press('e')
  await page
    .getByText('Caldwell reviews people who arrive with the packet')
    .waitFor({ timeout: 10_000 })
  await beatLine(page, { typeMs: 700, hold: 2000, advance: false })
  await sleep(1600)
}

async function toMp4(webm, mp4) {
  await sh('ffmpeg', [
    '-y',
    '-i',
    webm,
    '-an',
    '-vf',
    `scale=${OUT.width}:${OUT.height}:force_original_aspect_ratio=decrease,pad=${OUT.width}:${OUT.height}:(ow-iw)/2:(oh-ih)/2:color=0x0b0d14,fps=30`,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '18',
    '-preset',
    'medium',
    mp4,
  ])
}

async function titleCard(file, lines, seconds) {
  const [eyebrow, title, sub] = lines
  const draw = [
    `drawtext=fontfile=${FONT_BODY}:text='${eyebrow}':fontcolor=0xefc14a:fontsize=22:letter_spacing=8:x=(w-text_w)/2:y=h/2-92`,
    `drawtext=fontfile=${FONT_DISPLAY}:text='${title}':fontcolor=0xf4efe4:fontsize=72:x=(w-text_w)/2:y=h/2-48`,
    `drawtext=fontfile=${FONT_BODY}:text='${sub}':fontcolor=0xb8c0ce:fontsize=26:x=(w-text_w)/2:y=h/2+48`,
  ].join(',')
  await sh('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x0b0d14:s=${OUT.width}x${OUT.height}:d=${seconds}:r=30`,
    '-vf',
    draw,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '16',
    file,
  ])
}

function probeSec(file) {
  return sh('ffprobe', [
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    file,
  ]).then((r) => Number(r.out.trim()))
}

async function stitch(parts, musicBeds, dest) {
  const inputs = []
  for (const p of parts) {
    inputs.push('-i', p)
  }
  for (const m of musicBeds) {
    inputs.push('-i', m)
  }

  const fade = 0.55
  let filter = ''
  let last = '[0:v]'
  let acc = 0
  const durs = []
  for (let i = 0; i < parts.length; i++) durs.push(await probeSec(parts[i]))
  for (let i = 1; i < parts.length; i++) {
    acc += durs[i - 1] - fade
    const out = i === parts.length - 1 ? '[vout]' : `[v${i}]`
    filter += `${last}[${i}:v]xfade=transition=fade:duration=${fade}:offset=${acc.toFixed(3)}${out};`
    last = out
  }
  const total = durs.reduce((a, b) => a + b, 0) - fade * (parts.length - 1)
  const musicIdx = parts.length
  const execIdx = parts.length + 1
  const stingIdx = parts.length + 2
  // Lobby under the whole piece; executive bed swells on the last clip; promotion sting on celebration.
  const celebOffset = durs[0] + durs[1] + durs[2] - fade * 2 + 0.4
  filter += `[${musicIdx}:a]volume=0.20,afade=t=in:st=0:d=1.6,afade=t=out:st=${Math.max(0, total - 3.2).toFixed(2)}:d=3.0[alobby];`
  filter += `[${execIdx}:a]volume=0.22,adelay=${Math.round((total - durs[durs.length - 1]) * 1000)}|${Math.round((total - durs[durs.length - 1]) * 1000)},afade=t=in:st=${(total - durs[durs.length - 1]).toFixed(2)}:d=1.4,afade=t=out:st=${Math.max(0, total - 2.4).toFixed(2)}:d=2.2[aexec];`
  filter += `[${stingIdx}:a]volume=0.32,adelay=${Math.round(celebOffset * 1000)}|${Math.round(celebOffset * 1000)}[asting];`
  filter += `[alobby][aexec][asting]amix=inputs=3:duration=first:dropout_transition=2,atrim=0:${total.toFixed(2)},asetpts=PTS-STARTPTS[aout]`

  await sh('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex',
    filter,
    '-map',
    '[vout]',
    '-map',
    '[aout]',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '17',
    '-preset',
    'medium',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-movflags',
    '+faststart',
    '-t',
    total.toFixed(2),
    dest,
  ])
  return total
}

async function posterFrom(mp4, dest, at = 8) {
  await sh('ffmpeg', ['-y', '-ss', String(at), '-i', mp4, '-frames:v', '1', dest])
}

function urlUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume()
      resolve(res.statusCode && res.statusCode < 500)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(1500, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function ensureServer() {
  if (await urlUp(BASE + '/')) return null
  console.log(`starting vite at ${BASE}`)
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '4173'], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })
  const start = Date.now()
  while (Date.now() - start < 60_000) {
    if (await urlUp(BASE + '/')) return child
    await sleep(400)
  }
  child.kill()
  throw new Error('Vite did not start on :4173')
}

async function main() {
  await rm(WORK, { recursive: true, force: true })
  await mkdir(CLIPS, { recursive: true })
  await mkdir('/opt/cursor/artifacts', { recursive: true })
  const server = await ensureServer()

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
  })

  console.log('clip 1 · arrival')
  const w1 = await recordClip(browser, '01-arrival', clipArrival)
  console.log('clip 2 · shaft')
  const w2 = await recordClip(browser, '02-shaft', clipShaft)
  console.log('clip 3 · combat')
  const w3 = await recordClip(browser, '03-combat', clipCombat)
  console.log('clip 4 · exec')
  const w4 = await recordClip(browser, '04-exec', clipExec)
  await browser.close()

  const p0 = path.join(WORK, '00-title.mp4')
  const p5 = path.join(WORK, '05-end.mp4')
  const m1 = path.join(WORK, '01-arrival.mp4')
  const m2 = path.join(WORK, '02-shaft.mp4')
  const m3 = path.join(WORK, '03-combat.mp4')
  const m4 = path.join(WORK, '04-exec.mp4')

  await titleCard(
    p0,
    ['CORPORATE CLIMB', 'THE OFFICE', 'Floors 1–5  ·  Reception to the board'],
    3.2,
  )
  await Promise.all([toMp4(w1, m1), toMp4(w2, m2), toMp4(w3, m3), toMp4(w4, m4)])
  await titleCard(
    p5,
    ['THE OFFICE', 'There is no Floor 6.', 'Five floors. One badge at a time.'],
    3.6,
  )

  const lobby = path.join(ROOT, 'public/audio/music_menu_corporate_lobby.mp3')
  const exec = path.join(ROOT, 'public/audio/music_executive_floor_luxury_predator.mp3')
  const sting = path.join(ROOT, 'public/audio/sting_promotion.mp3')

  const total = await stitch([p0, m1, m2, m3, m4, p5], [lobby, exec, sting], FINAL)
  await posterFrom(FINAL, POSTER, Math.min(12, total * 0.22))
  console.log(`wrote ${FINAL} (${total.toFixed(1)}s)`)
  console.log(`poster ${POSTER}`)
  if (server) server.kill()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
