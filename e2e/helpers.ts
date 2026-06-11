import { type Page } from '@playwright/test'

// The app is a 420px-wide centered column; pin a snug viewport so #root clicks
// land inside the game rather than the letterbox.
export const GAME_VIEWPORT = { width: 440, height: 760 }

export type Save = {
  classId: string
  floor: number
  level: number
  xp: number
  xpToNext: number
  playerHp: number
  playerPp: number[]
  atkBuff: number
  defBuff: number
  usedEvents: string[]
  inventory: string[]
  [key: string]: unknown
}

/**
 * A heavily-buffed PM save at `floor`: high level/ATK one- or two-shots most
 * enemies and high DEF keeps the player alive, so a bot can deterministically
 * reach later screens regardless of which enemy variant is rolled.
 */
export function buffedSave(floor: number, overrides: Partial<Save> = {}): Save {
  return {
    classId: 'pm',
    floor,
    level: 25,
    xp: 0,
    xpToNext: 100_000,
    playerHp: 200,
    playerPp: [40, 40, 40, 40],
    atkBuff: 220,
    defBuff: 80,
    usedEvents: [],
    inventory: [],
    ...overrides,
  }
}

/** Inject a save, reload, and resume it from the title screen. */
export async function continueFromSave(page: Page, save: Save) {
  await page.goto('/')
  await page.evaluate((s) => {
    localStorage.clear()
    localStorage.setItem('corporate-climb-save', JSON.stringify(s))
    // Instant text + silent audio keeps the suite fast and quiet.
    localStorage.setItem(
      'corporate-climb-settings',
      JSON.stringify({ textSpeed: 'instant', musicVolume: 0, sfxVolume: 0 }),
    )
  }, save)
  await page.reload()
  await page.getByRole('button', { name: 'CONTINUE' }).click({ timeout: 15_000 })
}

/** FloorIntro is a click-anywhere screen; tap into the battle. */
export async function tapToBattle(page: Page) {
  await page.getByText('TAP TO BATTLE').waitFor({ timeout: 12_000 })
  await page.locator('#root').click({ position: { x: 220, y: 380 } })
}

/** Click the first enabled move each round until `target` text appears. */
export async function attackUntil(page: Page, target: string, rounds = 40) {
  const goal = page.getByText(target)
  for (let i = 0; i < rounds; i++) {
    if (await goal.isVisible().catch(() => false)) return
    const move = page.locator('button:not([disabled])').filter({ hasText: 'PWR' }).first()
    if (await move.isVisible().catch(() => false)) {
      await move.click({ timeout: 2_500 }).catch(() => {})
    }
    await page.waitForTimeout(400)
  }
}

/** Click the first visible button that isn't a global control (route / hallway). */
export async function clickNonMuteButton(page: Page) {
  const btns = page.locator('button')
  const n = await btns.count()
  for (let i = 0; i < n; i++) {
    const b = btns.nth(i)
    if (!(await b.isVisible().catch(() => false))) continue
    const text = (await b.textContent().catch(() => '')) ?? ''
    if (text.includes('🔊') || text.includes('🔇') || text.includes('⚙️') || text.includes('💼'))
      continue
    await b.click({ timeout: 2_500 }).catch(() => {})
    return
  }
}
