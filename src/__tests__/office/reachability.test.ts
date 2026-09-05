import { describe, expect, it } from 'vitest'
import type { Facing } from '@/content/office'
import { PLAYER_CLASSES } from '@/data'
import {
  currentObjective,
  dispatchOfficeAction,
  keyCount,
  newOfficeCampaign,
  tryStep,
  type OfficeState,
} from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!
const DIRS: Facing[] = ['n', 'e', 's', 'w']
const DIALOGUE_ESCAPE_CHOICES: Record<string, string> = {
  dlg_gavin_challenge: 'not_now',
  dlg_gavin_offer: 'not_yet',
  dlg_priya_request: 'pass',
  dlg_priya_spar: 'rain_check',
  dlg_priya_offer: 'not_yet',
}

interface ReachTarget {
  label: string
  x: number
  y: number
  facing?: Facing
}

function start() {
  const initial = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return clearOverlays(initial)
}

function clearOverlays(state: OfficeState): OfficeState {
  let next = state
  for (let i = 0; i < 80 && next.overlay; i += 1) {
    const overlay = next.overlay
    if (overlay.kind === 'receipt') {
      next = dispatchOfficeAction(next, { type: 'ACK_RECEIPT' }).state
      continue
    }
    if (
      overlay.kind === 'coach' ||
      overlay.kind === 'dialogue' ||
      overlay.kind === 'document' ||
      overlay.kind === 'interstitial' ||
      overlay.kind === 'toast'
    ) {
      const advanced = dispatchOfficeAction(next, { type: 'ADVANCE' }).state
      if (
        overlay.kind === 'dialogue' &&
        advanced.overlay?.kind === 'dialogue' &&
        advanced.overlay.nodeId === overlay.nodeId &&
        advanced.overlay.line === overlay.line
      ) {
        const choice = DIALOGUE_ESCAPE_CHOICES[overlay.nodeId]
        next = choice ? dispatchOfficeAction(next, { type: 'CHOOSE', choice }).state : advanced
      } else {
        next = advanced
      }
      continue
    }
    if (overlay.kind === 'confirm') {
      next = dispatchOfficeAction(next, {
        type: overlay.prompt === 'door' ? 'DOOR_STEP_BACK' : 'CLOSE_OVERLAY',
      }).state
      continue
    }
    if (overlay.kind === 'team') {
      next = dispatchOfficeAction(next, { type: 'CLOSE_TEAM' }).state
      continue
    }
    break
  }
  return next
}

function followRoute(state: OfficeState, route: Facing[]): OfficeState {
  let next = state
  for (const dir of route) {
    next = dispatchOfficeAction(next, { type: 'MOVE', dir }).state
    next = clearOverlays(next)
  }
  return next
}

function findRouteWithTryStep(state: OfficeState, target: ReachTarget): Facing[] | null {
  const queue: { x: number; y: number; facing: Facing; path: Facing[] }[] = [
    { ...state.player, path: [] },
  ]
  const seen = new Set<string>()
  for (let idx = 0; idx < queue.length; idx += 1) {
    const cur = queue[idx]
    const key = `${cur.x},${cur.y},${cur.facing}`
    if (seen.has(key)) continue
    seen.add(key)
    const facingMatches = !target.facing || target.facing === cur.facing
    if (cur.x === target.x && cur.y === target.y && facingMatches) return cur.path
    for (const dir of DIRS) {
      const stepped = tryStep({ ...state, player: { x: cur.x, y: cur.y, facing: cur.facing } }, dir)
        .state.player
      const stepKey = `${stepped.x},${stepped.y},${stepped.facing}`
      if (seen.has(stepKey)) continue
      queue.push({ ...stepped, path: [...cur.path, dir] })
    }
  }
  return null
}

function mustFindRoute(state: OfficeState, target: ReachTarget): Facing[] {
  const route = findRouteWithTryStep(state, target)
  expect(route, `${target.label} should stay reachable`).not.toBeNull()
  if (!route) throw new Error(`${target.label} blocked`)
  return route
}

function acceptPrinterTicket(state: OfficeState): OfficeState {
  const route = mustFindRoute(state, { label: 'Renata ticket spot', x: 8, y: 16, facing: 'n' })
  let next = followRoute(state, route)
  next = dispatchOfficeAction(next, { type: 'INTERACT' }).state
  next = clearOverlays(next)
  return next
}

describe('office route reachability', () => {
  it('keeps key route tiles reachable after accepting the printer assignment', () => {
    const accepted = acceptPrinterTicket(start())
    expect(accepted.assignments.asg_printer).toBe('accepted')

    const required: ReachTarget[] = [
      { label: 'Supply cabinet interact tile', x: 15, y: 8, facing: 'n' },
      { label: 'Printer interact tile', x: 9, y: 8, facing: 'n' },
      { label: 'Gavin approach tile', x: 5, y: 10, facing: 'e' },
      { label: 'Holloway door approach tile', x: 10, y: 3 },
    ]

    for (const target of required) mustFindRoute(accepted, target)
  })

  it('updates objective after ticket acceptance and supports full reducer walk', () => {
    let state = acceptPrinterTicket(start())
    expect(state.assignments.asg_printer).toBe('accepted')
    expect(currentObjective(state).text).toBe('Get toner from the supply cabinet')

    state = followRoute(
      state,
      mustFindRoute(state, { label: 'Supply cabinet interact tile', x: 15, y: 8, facing: 'n' }),
    )
    state = dispatchOfficeAction(state, { type: 'INTERACT' }).state
    state = clearOverlays(state)
    expect(state.assignments.asg_printer).toBe('toner_collected')
    expect(keyCount(state, 'key_toner')).toBeGreaterThan(0)

    state = followRoute(
      state,
      mustFindRoute(state, { label: 'Printer interact tile', x: 9, y: 8, facing: 'n' }),
    )
    state = dispatchOfficeAction(state, { type: 'INTERACT' }).state
    state = clearOverlays(state)
    expect(state.assignments.asg_printer).toBe('installed')
    expect(currentObjective(state).text).toBe('Report back to Renata')

    state = followRoute(
      state,
      mustFindRoute(state, { label: 'Renata closeout spot', x: 8, y: 16, facing: 'n' }),
    )
    state = dispatchOfficeAction(state, { type: 'INTERACT' }).state
    state = clearOverlays(state)
    expect(state.assignments.asg_printer).toBe('complete')
    expect(currentObjective(state).text).toBe('Talk to Gavin')
  })
})
