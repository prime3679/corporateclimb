import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  EMPTY_LIFETIME,
  HISTORY_CAP,
  HISTORY_KEY,
  LIFETIME_KEY,
  addToLifetime,
  getLifetimeStats,
  getRunHistory,
  recordRunEnd,
  type RunRecord,
} from '@/history'
import { newRun } from '@/engine'
import { PLAYER_CLASSES } from '@/data'

function freshRun() {
  const cls = PLAYER_CLASSES[0]
  return newRun(cls, { perkPool: [], relicPool: [] })
}

describe('run history', () => {
  beforeEach(() => localStorage.clear())

  it('records a loss with the enemy that ended it', () => {
    const run = { ...freshRun(), floor: 7 }
    run.stats = { totalTurns: 42, totalDamageDealt: 1234, itemsUsed: 3 }
    const record = recordRunEnd(run, { won: false, floorReached: 8, defeatedBy: 'C-Suite' })

    expect(record.won).toBe(false)
    expect(record.floorReached).toBe(8)
    expect(record.defeatedBy).toBe('C-Suite')
    expect(record.mode).toBe('normal')
    expect(record.ascension).toBe(0)

    const history = getRunHistory()
    expect(history).toHaveLength(1)
    expect(history[0].totalTurns).toBe(42)
  })

  it('caps the buffer at HISTORY_CAP, newest first', () => {
    const run = freshRun()
    for (let i = 0; i < HISTORY_CAP + 10; i++) {
      recordRunEnd(run, { won: false, floorReached: i + 1 })
    }
    const history = getRunHistory()
    expect(history).toHaveLength(HISTORY_CAP)
    expect(history[0].floorReached).toBe(HISTORY_CAP + 10) // newest first
  })

  it('aggregates lifetime stats across records', () => {
    const run = freshRun()
    run.stats = { totalTurns: 10, totalDamageDealt: 100, itemsUsed: 1 }
    recordRunEnd(run, { won: false, floorReached: 5 })
    recordRunEnd(run, { won: true, floorReached: 30 })

    const lifetime = getLifetimeStats()
    expect(lifetime.runs).toBe(2)
    expect(lifetime.wins).toBe(1)
    expect(lifetime.bestFloor).toBe(30)
    expect(lifetime.totalTurns).toBe(20)
    expect(lifetime.runsByClass[run.classId]).toBe(2)
    expect(lifetime.winsByClass[run.classId]).toBe(1)
  })

  it('addToLifetime is a pure fold', () => {
    const record: RunRecord = {
      endedAt: 0,
      classId: 'eng',
      mode: 'daily',
      won: true,
      floorReached: 15,
      ngPlus: 0,
      ascension: 0,
      totalTurns: 50,
      totalDamageDealt: 2000,
      itemsUsed: 2,
      perks: [],
      relics: [],
      stockOptions: 120,
    }
    const next = addToLifetime(EMPTY_LIFETIME, record)
    expect(next.runs).toBe(1)
    expect(next.wins).toBe(1)
    expect(next.bestFloor).toBe(15)
    expect(EMPTY_LIFETIME.runs).toBe(0) // untouched
  })

  it('degrades to empty on corrupt blobs', () => {
    localStorage.setItem(HISTORY_KEY, '{not json')
    localStorage.setItem(LIFETIME_KEY, '[]')
    expect(getRunHistory()).toEqual([])
    expect(getLifetimeStats().runs).toBe(0)
  })

  it('survives a throwing storage and still returns the record', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })
    const record = recordRunEnd(freshRun(), { won: false, floorReached: 3 })
    expect(record.floorReached).toBe(3)
    vi.restoreAllMocks()
  })
})
