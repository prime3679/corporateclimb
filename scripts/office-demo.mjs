/**
 * Trailer-style Office capture. Not a CI test — run with:
 *   DEMO_URL=http://127.0.0.1:4173 node scripts/office-demo.mjs
 * Writes /opt/cursor/artifacts/office-demo.mp4
 */
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.DEMO_URL || 'http://127.0.0.1:4173'
const OUT_DIR = '/opt/cursor/artifacts'
const FONT = '/usr/share/fonts/truetype/macos/Inter-Bold.ttf'
const MUSIC = path.resolve('public/audio/music_executive_floor_luxury_predator.mp3')

const ASSIGNMENTS = {
  asg_printer: 'not_started',
  asg_meeting_prep: 'not_started',
  asg_transfer: 'not_started',
  asg_audit: 'not_started',
  asg_roadmap: 'not_started',
  asg_leavebehind: 'not_started',
  asg_board_packet: 'not_started',
}

const ENCOUNTERS = {
  enc_desk_challenger: 'open',
  enc_meeting_prepper: 'open',
  enc_supervisor_1on1: 'open',
  enc_help_desk_intern: 'open',
  enc_auditor: 'open',
  enc_director_review: 'open',
  enc_vp_product: 'open',
  enc_vp_sales: 'open',
  enc_ceo_review: 'open',
}

const COACH_FLAGS = [
  'flag_move_coached',
  'flag_interact_coached',
  'flag_pin_coached',
  'flag_elevator_coached',
  'flag_switch_coached',
  'flag_roster_coached',
]

function officeSave() {
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
    assignments: { ...ASSIGNMENTS },
    encounters: { ...ENCOUNTERS },
    keyItems: {},
    rewardsClaimed: ['rwd_start_options'],
    flags: [...COACH_FLAGS],
    firedTriggers: [],
    stats: { battlesWon: 1, losses: 0, switches: 0, msOnFloor: 95_000, rides: 0 },
    vendingStock: {
      floor_01: ['espresso', 'espresso', 'side_hustle'],
      floor_02: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_03: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_04: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
      floor_05: ['espresso', 'espresso', 'pto_day', 'standing_desk'],
    },
  }
}

function save(patch = {}) {
  const base = officeSave()
  return {
    ...base,
    ...patch,
    run: { ...base.run, ...(patch.run ?? {}) },
    assignments: { ...base.assignments, ...(patch.assignments ?? {}) },
    encounters: { ...base.encounters, ...(patch.encounters ?? {}) },
    keyItems: { ...base.keyItems, ...(patch.keyItems ?? {}) },
    flags: patch.flags ?? base.flags,
    player: patch.player ?? base.player,
    party: patch.party ?? base.party,
    hired: patch.hired ?? base.hired,
    stats: { ...base.stats, ...(patch.stats ?? {}) },
  }
}

const SETTINGS = {
  textSpeed: 'fast',
  musicVolume: 0.42,
  sfxVolume: 0.8,
  reduceMotion: false,
  haptics: false,
}

async function hold(page, ms) {
  await page.waitForTimeout(ms)
}

async function step(page, key, times = 1) {
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key)
    await page.waitForTimeout(280)
  }
}

async function clickIf(page, name, timeout = 4000) {
  try {
    await page.getByRole('button', { name }).last().click({ timeout })
    return true
  } catch {
    return false
  }
}

async function seen(page, pattern, timeout = 2500) {
  try {
    await page.getByText(pattern).first().waitFor({ timeout })
    return true
  } catch {
    return false
  }
}

async function resumeOffice(page, next) {
  await page.evaluate(
    ({ campaign, settings }) => {
      localStorage.setItem('corporate-climb-office-save', JSON.stringify(campaign))
      localStorage.setItem('corporate-climb-settings', JSON.stringify(settings))
    },
    { campaign: next, settings: SETTINGS },
  )
  await page.goto(BASE)
  await page.getByRole('button', { name: 'THE OFFICE' }).waitFor({ timeout: 20_000 })
  await hold(page, 600)
  await page.getByRole('button', { name: 'THE OFFICE' }).click()
  await page.getByRole('button', { name: 'CONTINUE' }).waitFor({ timeout: 10_000 })
  await hold(page, 450)
  await page.getByRole('button', { name: 'CONTINUE' }).click()
  await page.getByText(/Floor \d · of 5/).waitFor({ timeout: 15_000 })
  await hold(page, 700)
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit' })
    child.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${code}`))))
  })
}

function probeDuration(file) {
  return new Promise((resolve) => {
    const child = spawn('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'csv=p=0',
      file,
    ])
    let dur = ''
    child.stdout.on('data', (d) => {
      dur += String(d)
    })
    child.on('close', () => resolve(Number.parseFloat(dur) || 0))
  })
}

async function card(file, lines, seconds) {
  const filters = lines
    .map((line, i) => {
      const y = 300 + i * 56
      const size = i === 0 ? 52 : i === 1 ? 34 : 20
      const color = i === 0 ? '0xFFC107' : i === 1 ? '0xF2F6FA' : '0x9AA4B2'
      return `drawtext=fontfile=${FONT}:text='${line}':fontsize=${size}:fontcolor=${color}:x=(w-text_w)/2:y=${y}`
    })
    .join(',')
  await run('ffmpeg', [
    '-y',
    '-f',
    'lavfi',
    '-i',
    `color=c=0x070b12:s=1280x720:d=${seconds}`,
    '-vf',
    `${filters},fade=t=in:st=0:d=0.4,fade=t=out:st=${seconds - 0.5}:d=0.45`,
    '-pix_fmt',
    'yuv420p',
    '-r',
    '30',
    file,
  ])
}

async function scene(name, fn) {
  try {
    console.log(`scene ${name}`)
    await fn()
  } catch (err) {
    console.error(`scene ${name} failed`, err)
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  await mkdir('/tmp/office-demo', { recursive: true })

  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required'],
  })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1.25,
    recordVideo: {
      dir: '/tmp/office-demo',
      size: { width: 1280, height: 720 },
    },
    colorScheme: 'dark',
  })
  const page = await context.newPage()
  page.setDefaultTimeout(20_000)

  await scene('open', async () => {
    await page.goto(BASE)
    await page.evaluate((settings) => {
      localStorage.clear()
      localStorage.setItem('corporate-climb-settings', JSON.stringify(settings))
    }, SETTINGS)
    await page.reload()
    await page.getByRole('button', { name: 'THE OFFICE' }).waitFor({ timeout: 25_000 })
    await hold(page, 2000)

    await page.getByRole('button', { name: 'THE OFFICE' }).click()
    await page.getByText('YOUR ROLE · FLOORS 1–5').waitFor()
    await hold(page, 1300)
    await page.keyboard.press('ArrowRight')
    await hold(page, 800)
    await page.keyboard.press('ArrowRight')
    await hold(page, 1000)
    await page.getByRole('button', { name: 'ACCEPT OFFER' }).click()
    await page.getByText('SIGNING BONUS').waitFor()
    await hold(page, 1500)
    await page.getByRole('button', { name: 'File it' }).click()
    await page.getByText('Floor 1 · of 5').waitFor()
    await hold(page, 1300)

    if (
      await page
        .locator('#coach_move')
        .isVisible()
        .catch(() => false)
    ) {
      await hold(page, 800)
    }
    await step(page, 'ArrowLeft')
    await hold(page, 600)
    await page.keyboard.press('Enter')
    await hold(page, 700)
    if (
      await page
        .locator('#coach_pin')
        .isVisible()
        .catch(() => false)
    ) {
      await hold(page, 900)
      await page.locator('#coach_pin').click()
    }
    await step(page, 'ArrowLeft')
    await step(page, 'ArrowDown')
    await step(page, 'ArrowLeft')
    await step(page, 'ArrowUp')
    await hold(page, 600)
    await page.keyboard.press('e')
    if (!(await seen(page, /You have the look/, 6000))) {
      await resumeOffice(
        page,
        save({
          flags: [...COACH_FLAGS, 'flag_office_intro', 'flag_first_desk_done'],
          player: { x: 8, y: 16, facing: 'n' },
        }),
      )
      await page.keyboard.press('e')
      await page.getByText(/You have the look/).waitFor({ timeout: 10_000 })
    }
    await hold(page, 800)
    await page.keyboard.press('Enter')
    await hold(page, 1000)
    await page.keyboard.press('Enter')
    await hold(page, 1300)
  })

  await scene('combat', async () => {
    await resumeOffice(
      page,
      save({
        assignments: { asg_printer: 'complete' },
        player: { x: 5, y: 10, facing: 'e' },
        flags: [...COACH_FLAGS, 'flag_office_intro', 'flag_first_desk_done'],
        stats: { battlesWon: 0, losses: 0, switches: 0, msOnFloor: 40_000, rides: 0 },
      }),
    )
    await hold(page, 500)
    await page.keyboard.press('e')
    await seen(page, /Desk-pit rules/, 10_000)
    await hold(page, 700)
    await page.keyboard.press('Enter')
    await hold(page, 350)
    await clickIf(page, /Bring it/i)
    await page.getByText(/CHALLENGE/i).waitFor({ timeout: 6000 })
    await hold(page, 700)
    await page
      .getByRole('button', { name: /Bring it|Begin/i })
      .last()
      .click()
    await page.getByText(/FLOOR\s+1\/5/).waitFor({ timeout: 12_000 })
    await hold(page, 1100)
    await seen(page, /YOUR MOVE|SPAR|PROVE IT/, 4000)
    for (let i = 0; i < 10; i++) {
      if (
        await page
          .getByText(/CLEARED|REVIEW CLOSED/)
          .first()
          .isVisible()
          .catch(() => false)
      )
        break
      const move = page.locator('[data-testid="move-button"]').first()
      if (await move.isVisible().catch(() => false)) {
        await move.click({ timeout: 2000 }).catch(() => {})
      } else {
        await page.keyboard.press('Digit1')
      }
      await hold(page, 700)
    }
    await hold(page, 1800)
    await clickIf(page, 'File it', 2500)
  })

  await scene('cab', async () => {
    await resumeOffice(
      page,
      save({
        assignments: { asg_printer: 'complete', asg_meeting_prep: 'complete' },
        encounters: { enc_desk_challenger: 'won', enc_supervisor_1on1: 'won' },
        keyItems: { key_access_badge: 1 },
        player: { x: 3, y: 2, facing: 'n' },
        flags: [...COACH_FLAGS],
        stats: { battlesWon: 3, losses: 0, switches: 0, msOnFloor: 120_000, rides: 0 },
      }),
    )
    await page.keyboard.press('e')
    await page.getByRole('listbox', { name: 'Elevator floors' }).waitFor({ timeout: 10_000 })
    await hold(page, 1600)
    await page.getByRole('option', { name: /OPERATIONS/ }).click()
    await hold(page, 2600)
    await page.getByText('FLOOR 1 CLEARED').first().waitFor({ timeout: 12_000 })
    await hold(page, 3400)
    await clickIf(page, 'Floor 2', 4000)
    await page.getByText('Floor 2 · of 5').first().waitFor({ timeout: 12_000 })
    await hold(page, 800)
    await step(page, 'ArrowDown', 3)
    await step(page, 'ArrowRight', 2)
    await hold(page, 1200)
  })

  await scene('exec-peek', async () => {
    await resumeOffice(
      page,
      save({
        floorId: 'floor_02',
        player: { x: 3, y: 2, facing: 'n' },
        assignments: {
          asg_printer: 'complete',
          asg_meeting_prep: 'complete',
          asg_transfer: 'complete',
        },
        encounters: { enc_desk_challenger: 'won', enc_supervisor_1on1: 'won' },
        keyItems: { key_access_badge: 1, key_employee_badge: 1 },
        flags: [...COACH_FLAGS, 'flag_preview_complete', 'flag_visited_f2', 'flag_floor2_complete'],
        stats: { battlesWon: 5, losses: 1, switches: 1, msOnFloor: 80_000, rides: 2 },
      }),
    )
    await page.keyboard.press('e')
    await page.getByRole('listbox', { name: 'Elevator floors' }).waitFor({ timeout: 10_000 })
    await hold(page, 1300)
    await page.getByRole('option', { name: /EXEC/ }).click()
    await hold(page, 3000)
    await page.getByText('Floor 5 · of 5').first().waitFor({ timeout: 12_000 })
    await hold(page, 800)
    await step(page, 'ArrowDown', 3)
    await step(page, 'ArrowRight', 2)
    await hold(page, 1600)
  })

  await scene('the-climb', async () => {
    await resumeOffice(
      page,
      save({
        floorId: 'floor_05',
        player: { x: 3, y: 2, facing: 'n' },
        assignments: {
          asg_printer: 'complete',
          asg_meeting_prep: 'complete',
          asg_transfer: 'complete',
          asg_audit: 'complete',
          asg_roadmap: 'complete',
          asg_leavebehind: 'complete',
          asg_board_packet: 'complete',
        },
        encounters: {
          enc_desk_challenger: 'won',
          enc_meeting_prepper: 'won',
          enc_supervisor_1on1: 'won',
          enc_help_desk_intern: 'won',
          enc_director_review: 'won',
          enc_vp_product: 'won',
          enc_vp_sales: 'won',
          enc_ceo_review: 'won',
        },
        keyItems: { key_access_badge: 1, key_employee_badge: 1 },
        flags: [
          ...COACH_FLAGS,
          'flag_preview_complete',
          'flag_floor2_complete',
          'flag_floor5_complete',
        ],
        hired: ['cw_desk_challenger', 'cw_meeting_prepper'],
        party: [
          {
            slot: 'party_slot_0',
            def: { kind: 'lead', classId: 'eng' },
            hp: 90,
            pp: [12, 8, 10, 12],
          },
          {
            slot: 'party_slot_1',
            def: { kind: 'coworker', id: 'cw_desk_challenger' },
            hp: 70,
            pp: [10, 10],
          },
        ],
        stats: { battlesWon: 9, losses: 2, switches: 3, msOnFloor: 210_000, rides: 6 },
      }),
    )
    await hold(page, 600)
    await page.keyboard.press('e')
    await page.getByRole('listbox', { name: 'Elevator floors' }).waitFor({ timeout: 10_000 })
    await hold(page, 1000)
    await page.getByRole('option', { name: /EXEC/ }).click()
    await page.getByText('THE CLIMB').first().waitFor({ timeout: 10_000 })
    await hold(page, 3600)
  })

  const video = await page.video()
  await context.close()
  await browser.close()
  const raw = await video.path()
  console.log('raw video', raw)

  const title = '/tmp/office-demo/title.mp4'
  const end = '/tmp/office-demo/end.mp4'
  const body = '/tmp/office-demo/body.mp4'
  const out = `${OUT_DIR}/office-demo.mp4`
  const trailer = `${OUT_DIR}/office_pass_c_trailer.mp4`

  await card(title, ['CORPORATE CLIMB', 'THE OFFICE', 'Floors 1–5'], 3.2)
  await card(end, ['FIVE FLOORS.', 'There is no Floor 6.', 'Pass C  ·  feel'], 3.0)

  await run('ffmpeg', [
    '-y',
    '-i',
    raw,
    '-vf',
    'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:color=0x070b12,fps=30,format=yuv420p,fade=t=in:st=0:d=0.35',
    '-an',
    '-c:v',
    'libx264',
    '-crf',
    '18',
    '-preset',
    'medium',
    body,
  ])

  const list = '/tmp/office-demo/concat.txt'
  await writeFile(list, `file '${title}'\nfile '${body}'\nfile '${end}'\n`)
  const concat = '/tmp/office-demo/concat.mp4'
  await run('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', concat])

  const seconds = Math.max(8, (await probeDuration(concat)) || 90)
  const fadeOut = Math.max(0, seconds - 2.2)
  console.log('concat duration', seconds)

  await run('ffmpeg', [
    '-y',
    '-i',
    concat,
    '-stream_loop',
    '-1',
    '-i',
    MUSIC,
    '-filter_complex',
    `[1:a]volume=0.2,afade=t=in:st=0:d=1.4,afade=t=out:st=${fadeOut.toFixed(2)}:d=2.0,aformat=channel_layouts=stereo[a]`,
    '-map',
    '0:v',
    '-map',
    '[a]',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    seconds.toFixed(2),
    '-movflags',
    '+faststart',
    out,
  ])
  await copyFile(out, trailer)

  const files = await readdir(OUT_DIR)
  console.log(
    'artifacts',
    files.filter((f) => f.includes('office') && (f.endsWith('.mp4') || f.endsWith('.png'))),
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
