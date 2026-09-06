import { describe, expect, it } from 'vitest'
import {
  FLOOR_3_LEDGER_MAX,
  FLOOR_4_LEDGER_MAX,
  FLOOR_5_LEDGER_MAX,
  FLOOR_LEDGER_MAX,
  FLOOR_REWARD_IDS,
  OFFICE_FLOOR_COUNT,
  OFFICE_VENDING_STOCK_BY_FLOOR,
  POI_INSPECT,
  REWARD_OPTIONS,
  SIDE_LOCKERS_OPEN,
  SIDE_RACK_RED,
  SIDE_SAFE_READ,
  ledgerOptionsEarned,
  resolveSidePoi,
  vendingFlavor,
} from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import {
  celebrationLedger,
  celebrationStats,
  dispatchOfficeAction,
  newOfficeCampaign,
  OFFICE_VENDING_STOCK,
  OFFICE_VENDING_STOCK_UPPER,
  type OfficeState,
} from '@/engine/office'
import { hudKeyChips, promptText } from '@/screens/office/cast'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

function at(
  state: OfficeState,
  x: number,
  y: number,
  facing: OfficeState['player']['facing'] = 'n',
): OfficeState {
  return { ...state, overlay: null, overlayQueue: [], player: { x, y, facing } }
}

function inspectAt(
  state: OfficeState,
  x: number,
  y: number,
  facing: OfficeState['player']['facing'],
) {
  return dispatchOfficeAction(at(state, x, y, facing), { type: 'INTERACT' }).state
}

describe('Pass D — five floors, no sixth', () => {
  it('keeps the climb at five floors', () => {
    expect(OFFICE_FLOOR_COUNT).toBe(5)
    expect(Object.keys(OFFICE_VENDING_STOCK_BY_FLOOR)).toEqual([
      'floor_01',
      'floor_02',
      'floor_03',
      'floor_04',
      'floor_05',
    ])
  })
})

describe('Pass D — per-floor vending', () => {
  it('keeps Floor 1 and Operations SKUs and gives 3–5 their own machines', () => {
    const fresh = start()
    expect(fresh.vendingStock.floor_01).toEqual(OFFICE_VENDING_STOCK)
    expect(fresh.vendingStock.floor_02).toEqual(OFFICE_VENDING_STOCK_UPPER)
    expect(fresh.vendingStock.floor_03).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
    expect(fresh.vendingStock.floor_04).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_04])
    expect(fresh.vendingStock.floor_05).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_05])
    expect(fresh.vendingStock.floor_03).not.toEqual(OFFICE_VENDING_STOCK_UPPER)
    expect(fresh.vendingStock.floor_04).not.toEqual(fresh.vendingStock.floor_03)
    expect(fresh.vendingStock.floor_05).not.toEqual(fresh.vendingStock.floor_04)
  })

  it('opens Product vending on Floor 3 stock without writing Floor 1', () => {
    let s = dispatchOfficeAction(at({ ...start(), floorId: 'floor_03' }, 21, 16, 'e'), {
      type: 'INTERACT',
    }).state
    expect(s.screen).toBe('vending')
    expect(s.run.shopStock).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
    expect(vendingFlavor('floor_03', s.run.shopStock ?? []).title).toBe('VENDING · PRODUCT')
    s = dispatchOfficeAction(s, { type: 'CLOSE_OVERLAY' }).state
    expect(s.vendingStock.floor_01).toEqual(OFFICE_VENDING_STOCK)
    expect(s.vendingStock.floor_03).toEqual([...OFFICE_VENDING_STOCK_BY_FLOOR.floor_03])
  })
})

describe('Pass D — ledger 54 / 64 / 78', () => {
  it('sums each floor ledger to the published maxima and ignores 0-Option promotions', () => {
    const sum = (floor: keyof typeof FLOOR_REWARD_IDS) =>
      FLOOR_REWARD_IDS[floor].reduce((n, id) => n + (REWARD_OPTIONS[id] ?? 0), 0)
    expect(sum('floor_01')).toBe(FLOOR_LEDGER_MAX)
    expect(sum('floor_03')).toBe(FLOOR_3_LEDGER_MAX)
    expect(sum('floor_04')).toBe(FLOOR_4_LEDGER_MAX)
    expect(sum('floor_05')).toBe(FLOOR_5_LEDGER_MAX)
    expect(FLOOR_3_LEDGER_MAX).toBe(54)
    expect(FLOOR_4_LEDGER_MAX).toBe(64)
    expect(FLOOR_5_LEDGER_MAX).toBe(78)
  })

  it('prints Options as earned / max and lists only earning rows', () => {
    const s: OfficeState = {
      ...start(),
      rewardsClaimed: ['rwd_asg_roadmap', 'rwd_enc_vp_product', 'rwd_promotion_f3'],
    }
    const ledger = celebrationLedger(s, 'screen_floor3_complete')
    const stats = celebrationStats(s, 'screen_floor3_complete')
    expect(ledger.earned).toBe(54)
    expect(ledger.max).toBe(54)
    expect(ledger.complete).toBe(true)
    expect(stats.options).toBe(54)
    expect(stats.ledgerMax).toBe(54)
    expect(ledger.rows.map((row) => row.id)).toEqual(['rwd_asg_roadmap', 'rwd_enc_vp_product'])
    expect(ledger.rows.every((row) => row.claimed)).toBe(true)
    expect(ledgerOptionsEarned(s.rewardsClaimed, 'floor_03')).toBe(54)
  })

  it('marks missed optional Floor 1 rows without changing the 65 max', () => {
    const s: OfficeState = {
      ...start(),
      rewardsClaimed: [
        'rwd_start_options',
        'rwd_asg_printer',
        'rwd_enc_desk_challenger',
        'rwd_enc_supervisor_1on1',
      ],
    }
    const ledger = celebrationLedger(s, 'screen_preview_complete')
    expect(ledger.earned).toBe(48)
    expect(ledger.max).toBe(65)
    expect(ledger.complete).toBe(false)
    expect(ledger.rows.find((row) => row.id === 'rwd_enc_meeting_prepper')?.claimed).toBe(false)
  })
})

describe('Pass D — optional side POIs', () => {
  it('opens the Finance lockers only after reading the safe sticky', () => {
    let s = { ...start(), floorId: 'floor_02' as const }
    s = inspectAt(s, 9, 12, 'w')
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_lockers}`,
    })
    expect(s.firedTriggers).not.toContain(SIDE_LOCKERS_OPEN)

    s = inspectAt({ ...s, overlay: null, overlayQueue: [] }, 21, 10, 'e')
    expect(s.firedTriggers).toContain(SIDE_SAFE_READ)
    expect(s.overlay).toMatchObject({
      kind: 'dialogue',
      nodeId: `inspect:${POI_INSPECT.poi_safe}`,
    })
    expect(promptText({ kind: 'poi', id: 'poi_lockers', label: 'Inspect · Lockers' }, s)).toBe(
      'Try combo · Lockers',
    )

    s = inspectAt({ ...s, overlay: null, overlayQueue: [] }, 9, 12, 'w')
    expect(s.firedTriggers).toContain(SIDE_LOCKERS_OPEN)
    expect(s.overlay?.kind === 'dialogue' && s.overlay.nodeId).toContain('SEE SAFE')
    expect(s.overlayQueue[0]).toMatchObject({ kind: 'toast', text: 'Got: Nothing. On purpose.' })
    expect(s.rewardsClaimed.some((id) => id.startsWith('rwd_') && id.includes('locker'))).toBe(
      false,
    )
    expect(s.run.stockOptions).toBe(10)
  })

  it('finds the red Christmas light on the server rack once', () => {
    let s = inspectAt({ ...start(), floorId: 'floor_02' }, 12, 4, 'e')
    expect(s.firedTriggers).toContain(SIDE_RACK_RED)
    expect(s.overlay?.kind === 'dialogue' && s.overlay.nodeId).toContain('Christmas')
    s = inspectAt({ ...s, overlay: null, overlayQueue: [] }, 12, 4, 'e')
    expect(s.overlay?.kind === 'dialogue' && s.overlay.nodeId).toContain('feature')
    expect(s.firedTriggers.filter((t) => t === SIDE_RACK_RED)).toHaveLength(1)
  })

  it('changes Floor 4 cooler gossip on the second ask and F5 exit after the nod', () => {
    const first = resolveSidePoi(start(), 'poi_water_cooler_f4')
    expect(first?.text).toBe(POI_INSPECT.poi_water_cooler_f4)
    const second = resolveSidePoi(
      { ...start(), firedTriggers: [first?.trigger ?? ''] },
      'poi_water_cooler_f4',
    )
    expect(second?.text).toContain('That is Sales')

    const afterNod = resolveSidePoi(
      { ...start(), flags: ['flag_floor5_complete'] },
      'poi_exit_door',
    )
    expect(afterNod?.text).toContain('nod')
  })

  it('never pays ledger Options from a side POI', () => {
    const ids = [
      'poi_water_cooler',
      'poi_break_table',
      'poi_exit_door',
      'poi_safe',
      'poi_lockers',
      'poi_server_rack',
      'poi_board_table',
      'poi_caldwell_desk',
    ] as const
    for (const id of ids) {
      const view = resolveSidePoi(start(), id)
      expect(view, id).toBeTruthy()
      expect(view?.text.length, id).toBeGreaterThan(10)
    }
    expect(hudKeyChips(start()).some((c) => /Locker|Safe|Rack/.test(c.label))).toBe(false)
  })
})
