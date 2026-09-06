/**
 * Trailer-style Office capture. Not a CI test — run with:
 *   DEMO_URL=http://127.0.0.1:4173 npm run demo:office
 * Playwright video has no audio; the mux uses the live Office beds +
 * cab / stamp / combat stingers at scene marks. Writes
 * /opt/cursor/artifacts/office-demo.mp4 and public/demos/office-demo.mp4
 */
import { chromium } from '@playwright/test'
import { spawn } from 'node:child_process'
import { copyFile, mkdir, writeFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.DEMO_URL || 'http://127.0.0.1:4173'
const OUT_DIR = '/opt/cursor/artifacts'
const FONT = '/usr/share/fonts/truetype/macos/Inter-Bold.ttf'
const AUDIO_DIR = path.resolve('public/audio')
const PUBLIC_OUT = path.resolve('public/demos/office-demo.mp4')
const TITLE_SECS = 3.2
const END_SECS = 3.0
// Cab ride beats — keep in lockstep with src/content/office/elevator.ts
const CAB_CLOSE = 0.24
const CAB_CHIME = 0.24 + 0.48 + 0.92

const marks = []
let recStart = 0
function mark(id) {
  const t = recStart ? (Date.now() - recStart) / 1000 : 0
  marks.push({ id, t })
  console.log(`mark ${id} ${t.toFixed(2)}s`)
}
function markAt(id, fallback = 0) {
  const hit = [...marks].reverse().find((m) => m.id === id)
  return hit ? hit.t : fallback
}

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
  await page
    .getByText(/Floor \d · of 5/)
    .first()
    .waitFor({ timeout: 15_000 })
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
    mark(`scene:${name}`)
    await fn()
  } catch (err) {
    console.error(`scene ${name} failed`, err)
  }
}

function audioFile(name) {
  return path.join(AUDIO_DIR, name)
}

/** Playwright recordVideo has no audio. Mux the same beds/stingers the live game plays. */
async function mixLiveAudio(concat, seconds, out) {
  const fadeOut = Math.max(0, seconds - 2.2)
  const body = (id, fallback) => TITLE_SECS + markAt(id, fallback)
  const tFloor1 = body('floor1', 14)
  const tFloor2 = body('floor2', 48)
  const tExec = body('exec', 62)
  const tCab = body('cab', 40)
  const tCabExec = body('cab-exec', 54)
  const tCabClimb = body('cab-climb', 70)
  const tWin = body('combat-win', 34)
  const tCleared = body('floor1-cleared', 44)
  const tClimb = body('the-climb', 72)

  const beds = [
    {
      file: audioFile('music_office_title_after_hours.mp3'),
      start: 0,
      end: tFloor1,
      fadeIn: 1.4,
    },
    {
      file: audioFile('music_office_floor1_cubicle_hum.mp3'),
      start: tFloor1,
      end: tFloor2,
      fadeIn: 0.45,
    },
    {
      file: audioFile('music_office_floor2_operations.mp3'),
      start: tFloor2,
      end: tExec,
      fadeIn: 0.45,
    },
    {
      file: audioFile('music_office_exec_the_nod.mp3'),
      start: tExec,
      end: seconds,
      fadeIn: 0.45,
    },
  ]

  const stings = [
    [audioFile('sfx_elevator_door_open.mp3'), tCab, 0.82],
    [audioFile('sfx_elevator_door_close.mp3'), tCab + CAB_CLOSE, 0.82],
    [audioFile('sfx_elevator_arrive_chime.mp3'), tCab + CAB_CHIME, 0.88],
    [audioFile('sfx_elevator_door_open.mp3'), tCabExec, 0.82],
    [audioFile('sfx_elevator_door_close.mp3'), tCabExec + CAB_CLOSE, 0.82],
    [audioFile('sfx_elevator_arrive_chime.mp3'), tCabExec + CAB_CHIME, 0.88],
    [audioFile('sfx_elevator_door_open.mp3'), tCabClimb, 0.82],
    [audioFile('sfx_elevator_door_close.mp3'), tCabClimb + CAB_CLOSE, 0.82],
    [audioFile('sfx_elevator_arrive_chime.mp3'), tCabClimb + CAB_CHIME, 0.88],
    [audioFile('sfx_office_win.mp3'), tWin, 0.85],
    [audioFile('sting_cleared_stamp.mp3'), tWin, 1],
    [audioFile('sting_cleared_stamp.mp3'), tCleared, 1],
    [audioFile('sting_the_nod_stamp.mp3'), tClimb, 1],
    ...marks
      .filter((m) => m.id === 'combat-hit')
      .slice(0, 6)
      .map((m) => [audioFile('sfx_office_hit.mp3'), TITLE_SECS + m.t, 0.9]),
  ].filter(([, t]) => t >= 0 && t < seconds - 0.05)

  const args = ['-y', '-i', concat]
  for (const bed of beds) args.push('-stream_loop', '-1', '-i', bed.file)
  for (const [file] of stings) args.push('-i', file)

  const filters = []
  let input = 1
  const labels = []
  for (const bed of beds) {
    const dur = Math.max(0.6, bed.end - bed.start)
    const fadeOutAt = Math.max(0.15, dur - 0.45)
    const delay = Math.max(0, Math.round(bed.start * 1000))
    const fadeOutSt = bed.end >= seconds - 0.05 ? Math.max(0, fadeOut - bed.start) : fadeOutAt
    const fadeOutDur = bed.end >= seconds - 0.05 ? 2.0 : 0.45
    const label = `bed${input}`
    filters.push(
      `[${input}:a]volume=0.28,atrim=0:${dur.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=${bed.fadeIn},afade=t=out:st=${fadeOutSt.toFixed(2)}:d=${fadeOutDur},adelay=${delay}:all=1,aformat=channel_layouts=stereo[${label}]`,
    )
    labels.push(label)
    input += 1
  }
  for (const [, t, vol] of stings) {
    const delay = Math.max(0, Math.round(t * 1000))
    const label = `sfx${input}`
    filters.push(
      `[${input}:a]volume=${vol},adelay=${delay}:all=1,aformat=channel_layouts=stereo[${label}]`,
    )
    labels.push(label)
    input += 1
  }

  const mix = labels.map((l) => `[${l}]`).join('')
  filters.push(
    `${mix}amix=inputs=${labels.length}:duration=longest:dropout_transition=0:normalize=0,aformat=channel_layouts=stereo[a]`,
  )

  args.push(
    '-filter_complex',
    filters.join(';'),
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
  )
  console.log('mix beds', {
    tFloor1,
    tFloor2,
    tExec,
    tCab,
    tCabExec,
    tWin,
    tCleared,
    tClimb,
    seconds,
  })
  await run('ffmpeg', args)
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

  recStart = Date.now()
  mark('rec-start')

  await scene('open', async () => {
    await page.goto(BASE)
    await page.evaluate((settings) => {
      localStorage.clear()
      localStorage.setItem('corporate-climb-settings', JSON.stringify(settings))
    }, SETTINGS)
    await page.reload()
    await page.getByRole('button', { name: 'THE OFFICE' }).waitFor({ timeout: 25_000 })
    await hold(page, 2000)

    mark('office-title')
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
    mark('floor1')
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
    await page
      .getByText(/FLOOR\s+1\/5/)
      .first()
      .waitFor({ timeout: 12_000 })
    mark('combat')
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
      mark('combat-hit')
      await hold(page, 700)
    }
    mark('combat-win')
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
    mark('cab')
    await page.getByRole('option', { name: /OPERATIONS/ }).click()
    await hold(page, 2600)
    await page.getByText('FLOOR 1 CLEARED').first().waitFor({ timeout: 12_000 })
    mark('floor1-cleared')
    await hold(page, 3400)
    await clickIf(page, 'Floor 2', 4000)
    await page.getByText('Floor 2 · of 5').first().waitFor({ timeout: 12_000 })
    mark('floor2')
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
    mark('cab-exec')
    await page.getByRole('option', { name: /EXEC/ }).click()
    await hold(page, 3000)
    await page.getByText('Floor 5 · of 5').first().waitFor({ timeout: 12_000 })
    mark('exec')
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
    mark('cab-climb')
    await page.getByRole('option', { name: /EXEC/ }).click()
    await page.getByText('THE CLIMB').first().waitFor({ timeout: 10_000 })
    mark('the-climb')
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

  await writeFile('/tmp/office-demo/marks.json', JSON.stringify(marks, null, 2))
  await card(title, ['CORPORATE CLIMB', 'THE OFFICE', 'Floors 1–5'], TITLE_SECS)
  await card(end, ['FIVE FLOORS.', 'There is no Floor 6.', 'Pass C  ·  feel'], END_SECS)

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
  console.log('concat duration', seconds)
  await mixLiveAudio(concat, seconds, out)
  await copyFile(out, trailer)
  await mkdir(path.dirname(PUBLIC_OUT), { recursive: true })
  await copyFile(out, PUBLIC_OUT)

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
