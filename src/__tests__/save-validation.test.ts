import { beforeEach, describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { SAVE_KEY, loadRun, newRun, saveRun } from '@/engine'
import { OFFICE_SAVE_KEY, loadOffice, newOfficeCampaign, saveOffice } from '@/engine/office'
import { getAllDailyResults, getDailyResult, saveDailyResult } from '@/daily'

beforeEach(() => localStorage.clear())

describe('untrusted local saves', () => {
  it.each(['null', '[]', '"oops"', '{', '{}'])(
    'rejects %s without crashing or destroying the original',
    (raw) => {
      localStorage.setItem(OFFICE_SAVE_KEY, raw)
      localStorage.setItem(SAVE_KEY, raw)
      expect(loadOffice()).toBeNull()
      expect(loadRun()).toBeNull()
      expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBe(raw)
    },
  )

  it.each([
    { party: [null] },
    {
      party: [
        {
          slot: 'party_slot_0',
          def: { kind: 'coworker', id: 'missing' },
          hp: 10,
          pp: [1, 1, 1, 1],
        },
      ],
    },
    { hired: ['missing'] },
    { bench: { missing: { hp: 1, pp: [1, 1, 1, 1] } } },
    { continuation: { overlays: [{ kind: 'receipt', receiptId: 'missing' }], rideTo: null } },
    {
      continuation: { overlays: [{ kind: 'dialogue', nodeId: 'missing', line: 0 }], rideTo: null },
    },
    { continuation: { overlays: [], rideTo: 'floor_99' } },
    { keyItems: { key_access_badge: 'yes' } },
    { flags: null },
    { player: { x: 2.5, y: 2, facing: 'n' } },
  ])('rejects malformed Office state: %j', (patch) => {
    saveOffice(newOfficeCampaign(PLAYER_CLASSES[0]))
    const valid = JSON.parse(localStorage.getItem(OFFICE_SAVE_KEY)!)
    localStorage.setItem(OFFICE_SAVE_KEY, JSON.stringify({ ...valid, ...patch }))
    expect(loadOffice()).toBeNull()
  })

  it.each([
    { hp: null },
    { level: -1 },
    { inventory: ['missing'] },
    { pp: [1] },
    { pendingPerkOffer: ['missing'] },
    { pendingPerkOffer: [] },
    { stockOptions: 'many' },
    { stats: null },
    { floor: 1.5 },
    { perks: ['__proto__'] },
  ])('rejects malformed run fields in both campaign slots: %j', (patch) => {
    saveRun(newRun(PLAYER_CLASSES[0]))
    saveOffice(newOfficeCampaign(PLAYER_CLASSES[0]))
    for (const key of [SAVE_KEY, OFFICE_SAVE_KEY]) {
      const valid = JSON.parse(localStorage.getItem(key)!)
      localStorage.setItem(key, JSON.stringify({ ...valid, run: { ...valid.run, ...patch } }))
    }
    expect(loadRun()).toBeNull()
    expect(loadOffice()).toBeNull()
  })
})

describe('daily history recovery', () => {
  const key = 'corporate-climb-daily-results'
  const result = {
    seed: 20260911,
    classId: 'pm',
    score: 100,
    floorsCleared: 2,
    totalTurns: 5,
    totalDamageDealt: 60,
    hpRemaining: 0,
    won: false,
    modifierId: 'all_hands',
  }
  it.each(['null', '[]', '"oops"', '{'])('recovers from %s and can save the next result', (raw) => {
    localStorage.setItem(key, raw)
    expect(getDailyResult(result.seed)).toBeNull()
    saveDailyResult(result)
    expect(getDailyResult(result.seed)).toEqual(result)
  })
  it('retains valid history while discarding malformed neighbors', () => {
    localStorage.setItem(
      key,
      JSON.stringify({
        [result.seed]: result,
        20260910: null,
        20260909: { ...result, seed: 20260909, classId: 'missing' },
        20260231: { ...result, seed: 20260231 },
      }),
    )
    expect(getAllDailyResults()).toEqual({ [result.seed]: result })
  })
})
