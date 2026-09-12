// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('Office climb harness path + role env', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('PLAYTEST_CLASS', '')
    vi.stubEnv('PLAYTEST_ROLE', '')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('defaults the climb class to Product Manager and aliases PLAYTEST_CLASS', async () => {
    const { playtestClassName } = await import('../../e2e/office-helpers')
    expect(playtestClassName()).toBe('Product Manager')
    expect(playtestClassName('eng')).toBe('Senior Engineer')
    expect(playtestClassName('UX Designer')).toBe('UX Designer')
    expect(playtestClassName('pm')).toBe('Product Manager')
  })

  it('routes Floor 5 take-five and elevator boarding through the Ultra flake tiles', async () => {
    const { harnessPathfind, harnessWalkable } = await import('../../e2e/office-helpers')

    expect(harnessWalkable('floor_05', 9, 9)).toBe(true)
    expect(harnessWalkable('floor_05', 9, 10)).toBe(true)
    expect(harnessWalkable('floor_05', 3, 5)).toBe(true)
    expect(harnessWalkable('floor_05', 3, 2)).toBe(true)

    const takeFive = harnessPathfind('floor_05', { x: 10, y: 4 }, { x: 5, y: 12 })
    expect(takeFive).not.toBeNull()
    const takeTiles = tilesOn(takeFive!, { x: 10, y: 4 })
    expect(takeTiles).toContain('9,9')

    const board = harnessPathfind('floor_05', { x: 17, y: 11 }, { x: 3, y: 2 })
    expect(board).not.toBeNull()
    const boardTiles = tilesOn(board!, { x: 17, y: 11 })
    expect(boardTiles).toContain('3,5')
    expect(boardTiles).toContain('3,2')
  })

  it('can step off Floor 2 take-five so walkTo does not re-open the cooler', async () => {
    const { harnessWalkable, harnessPathfind } = await import('../../e2e/office-helpers')
    // BREAK_SPOT floor_02 is (11,11). Kessler door approach is (3,8).
    expect(harnessWalkable('floor_02', 11, 11)).toBe(true)
    const exits = [
      [11, 10],
      [12, 11],
      [10, 11],
      [11, 12],
    ] as const
    expect(exits.some(([x, y]) => harnessWalkable('floor_02', x, y))).toBe(true)
    const away = harnessPathfind('floor_02', { x: 11, y: 11 }, { x: 3, y: 8 })
    expect(away).not.toBeNull()
    expect(away!.length).toBeGreaterThan(0)
  })
})

function tilesOn(path: Array<'n' | 'e' | 's' | 'w'>, from: { x: number; y: number }) {
  const step = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] } as const
  const seen = [`${from.x},${from.y}`]
  let x = from.x
  let y = from.y
  for (const dir of path) {
    x += step[dir][0]
    y += step[dir][1]
    seen.push(`${x},${y}`)
  }
  return seen
}
