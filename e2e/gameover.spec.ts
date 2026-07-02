import { test, expect } from '@playwright/test'
import { GAME_VIEWPORT, continueFromSave, tapToBattle, attackUntil, type Save } from './helpers'

/**
 * Regression test: losing a battle reaches Game Over cleanly.
 *
 * Exercises the player-death path in doEnemyTurn — the branch that must NOT
 * hand the turn back to a 0-HP player (which would let a dead player act, or
 * race victory against game over). A deliberately weak save at a tough floor
 * makes the enemy one-shot the player within a turn or two.
 */
test.use({ viewport: GAME_VIEWPORT })

const DOOMED_SAVE: Save = {
  classId: 'pm',
  floor: 8,
  level: 1,
  xp: 0,
  xpToNext: 30,
  playerHp: 8,
  playerPp: [5, 5, 5, 5],
  atkBuff: 0,
  defBuff: 0,
  usedEvents: [],
  inventory: [],
}

test('losing a battle reaches Game Over without a dead-player turn', async ({ page }) => {
  test.setTimeout(120_000)

  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(e.message))

  await continueFromSave(page, DOOMED_SAVE)
  await tapToBattle(page)
  await attackUntil(page, 'GAME OVER')

  await expect(page.getByText('GAME OVER')).toBeVisible({ timeout: 10_000 })
  // A doomed run must never slip into a victory.
  await expect(page.getByText('VICTORY')).toBeHidden()

  // The exit-interview stat card and lifetime context are the retention
  // surface of the loss screen — they must render with the run's data.
  await expect(page.getByText('Exit Interview')).toBeVisible()
  await expect(page.getByText('TURNS')).toBeVisible()
  await expect(page.getByText('Taken down by')).toBeVisible()
  await expect(page.getByText(/Run #1 ·/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'SHARE' })).toBeVisible()

  expect(pageErrors, 'no uncaught page errors on the death path').toEqual([])
})
