import { BASE_PERK_POOL, ITEMS } from '@/data'
import { buyShopItem, shopPrice } from '../shop'
import { choosePerk } from '../run'
import { rollPerkOffer } from '../offers'
import type { Rng } from '../rng'
import type { BattleEvent } from '../events'
import type { ItemId, PerkId } from '@/types'
import {
  CABINET_COPY,
  DIALOGUE,
  HANDOUT_CHOICES,
  HANDOUT_PICK_LINE,
  POI_INSPECT,
  POST_CELEBRATION,
  PRINTER_COPY,
  type DialogueId,
  type EncounterId,
  type Facing,
  type KeyItemId,
  type NpcId,
  type PoiId,
} from '@/content/office'
import { applyOfficeSwitch, applyOfficeTurn, shouldCoachSwitch, startEncounter } from './combat'
import { interactTarget, sightlineNpc, tryStep } from './movement'
import { recruitCoworker, restoreParty } from './party'
import {
  closeOverlay,
  enqueueOverlays,
  heldHandout,
  inParty,
  keyCount,
  lettersHeld,
  partyHasRoom,
  pushOverlay,
  rewardClaimed,
  supervisorGateOpen,
  withFlag,
  withKey,
  type OfficeState,
  type Overlay,
} from './state'
import { lossDialogue, resolveNpcTalk, sightDialogue } from './talk'

export type OfficeAction =
  | { type: 'MOVE'; dir: Facing }
  | { type: 'INTERACT' }
  | { type: 'ADVANCE' }
  | { type: 'CHOOSE'; choice: string }
  | { type: 'CLOSE_OVERLAY' }
  | { type: 'ACK_RECEIPT' }
  | { type: 'CONFIRM_STAKES' }
  | { type: 'DECLINE_STAKES' }
  | { type: 'EXTEND_OFFER' }
  | { type: 'DECLINE_OFFER' }
  | { type: 'TAKE_FIVE' }
  | { type: 'BUY_VENDING'; itemId: ItemId }
  | { type: 'PICK_HANDOUT'; itemId: KeyItemId }
  | { type: 'OPEN_TEAM' }
  | { type: 'CLOSE_TEAM' }
  | { type: 'OPEN_SWITCH' }
  | { type: 'CANCEL_SWITCH' }
  | { type: 'BATTLE_MOVE'; moveIdx: number }
  | { type: 'BATTLE_ITEM'; itemIdx: number }
  | { type: 'BATTLE_SWITCH'; to: number }
  | { type: 'PICK_PERK'; perkId: PerkId }
  | { type: 'RIDE_ELEVATOR' }
  | { type: 'RETURN_FROM_PREVIEW' }
  | { type: 'DOOR_STEP_IN' }
  | { type: 'DOOR_STEP_BACK' }

export interface OfficeDispatchResult {
  state: OfficeState
  events: BattleEvent[]
}

const rngDefault: Rng = () => Math.random()

/** Pure reducer. Persistence is the UI's job (`saveOffice` after overworld dispatch). */
export function dispatchOfficeAction(
  state: OfficeState,
  action: OfficeAction,
  rng: Rng = rngDefault,
): OfficeDispatchResult {
  return apply(state, action, rng)
}

function done(state: OfficeState, events: BattleEvent[] = []): OfficeDispatchResult {
  return { state, events }
}

function apply(state: OfficeState, action: OfficeAction, rng: Rng): OfficeDispatchResult {
  switch (action.type) {
    case 'MOVE':
      return done(handleMove(state, action.dir))
    case 'INTERACT':
      return done(handleInteract(state))
    case 'ADVANCE':
      return done(handleAdvance(state))
    case 'CHOOSE':
      return done(handleChoose(state, action.choice))
    case 'CLOSE_OVERLAY':
    case 'ACK_RECEIPT':
      return done(handleClose(state, rng))
    case 'CONFIRM_STAKES':
      return done(confirmStakes(state))
    case 'DECLINE_STAKES':
      return done(declineStakes(state))
    case 'EXTEND_OFFER':
      return done(extendOffer(state))
    case 'DECLINE_OFFER':
      return done(declineOffer(state))
    case 'TAKE_FIVE':
      return done(takeFive(state))
    case 'BUY_VENDING':
      return done(buyVending(state, action.itemId))
    case 'PICK_HANDOUT':
      return done(pickHandout(state, action.itemId))
    case 'OPEN_TEAM':
      return done(state.overlay ? state : { ...state, overlay: { kind: 'team' } })
    case 'CLOSE_TEAM':
      return done(state.overlay?.kind === 'team' ? closeOverlay(state) : state)
    case 'OPEN_SWITCH':
      return done(canSwitch(state) ? { ...state, benchOpen: true } : state)
    case 'CANCEL_SWITCH':
      return done(
        state.battle?.phase === 'switch_required' ? state : { ...state, benchOpen: false },
      )
    case 'BATTLE_MOVE':
      return finishBattle(applyOfficeTurn(state, 'move', action.moveIdx, rng))
    case 'BATTLE_ITEM':
      return finishBattle(applyOfficeTurn(state, 'item', action.itemIdx, rng))
    case 'BATTLE_SWITCH':
      return finishBattle(
        applyOfficeSwitch(state, action.to, rng, state.battle?.phase === 'switch_required'),
      )
    case 'PICK_PERK':
      return done(pickPerk(state, action.perkId))
    case 'RIDE_ELEVATOR':
      return done(rideElevator(state))
    case 'RETURN_FROM_PREVIEW':
      return done({
        ...withFlag(state, 'flag_preview_complete'),
        screen: 'overworld',
        player: { ...POST_CELEBRATION },
        overlay: null,
        overlayQueue: [],
      })
    case 'DOOR_STEP_IN':
      return done(doorStepIn(state))
    case 'DOOR_STEP_BACK':
      return done({
        ...closeOverlay(state),
        player: { x: 11, y: 3, facing: 'e' },
      })
    default:
      return done(state)
  }
}

function finishBattle(result: OfficeDispatchResult): OfficeDispatchResult {
  let { state } = result
  if (state.screen === 'battle' && shouldCoachSwitch(state) && !state.overlay) {
    state = withFlag(
      pushOverlay(state, { kind: 'coach', id: 'coach_switch' }),
      'flag_switch_coached',
    )
  }
  return { ...result, state }
}

function handleMove(state: OfficeState, dir: Facing): OfficeState {
  if (state.screen !== 'overworld') return state
  if (state.overlay && state.overlay.kind !== 'coach') return state
  let ready = state
  if (state.overlay?.kind === 'coach') {
    ready = closeOverlay(maybeCoachMove(state, state.overlay))
  }
  const { state: stepped, moved } = tryStep(ready, dir)
  if (!moved) return stepped
  return afterMove(maybeFirstStep(stepped))
}

function maybeFirstStep(state: OfficeState): OfficeState {
  if (state.firedTriggers.includes('trg_first_step:spawn')) {
    return withFlag(state, 'flag_move_coached')
  }
  return enqueueOverlays(
    withFlag(
      {
        ...state,
        firedTriggers: [...state.firedTriggers, 'trg_first_step:spawn'],
      },
      'flag_greeted',
    ),
    [{ kind: 'dialogue', nodeId: 'dlg_renata_callout', line: 0 }],
  )
}

function afterMove(state: OfficeState): OfficeState {
  let next = withFlag(state, 'flag_move_coached')
  if (next.overlay) return next

  if (next.player.x === 10 && next.player.y === 3) {
    if (supervisorGateOpen(next) && next.encounters.enc_supervisor_1on1 !== 'won') {
      const key = 'trg_supervisor_door:ready'
      if (!next.firedTriggers.includes(key)) {
        next = { ...next, firedTriggers: [...next.firedTriggers, key] }
      }
      return pushOverlay(next, { kind: 'confirm', prompt: 'door' })
    }
  }

  if (
    (next.player.x === 2 || next.player.x === 3) &&
    next.player.y === 2 &&
    next.player.facing === 'n' &&
    keyCount(next, 'key_access_badge') > 0
  ) {
    return pushOverlay(next, { kind: 'confirm', prompt: 'elevator' })
  }

  const npc = sightlineNpc(next)
  if (npc) {
    const node = sightDialogue(next, npc)
    if (node) {
      const key = `trg_sight_${npc}:${next.assignments.asg_printer}:${next.assignments.asg_meeting_prep}:${next.encounters.enc_desk_challenger}`
      if (!next.firedTriggers.includes(key)) {
        next = { ...next, firedTriggers: [...next.firedTriggers, key] }
        if (node === 'dlg_gavin_callout') {
          return enqueueOverlays(next, [
            { kind: 'dialogue', nodeId: 'dlg_gavin_callout', line: 0 },
            { kind: 'dialogue', nodeId: 'dlg_gavin_challenge', line: 0 },
          ])
        }
        if (node === 'dlg_priya_hook') {
          return enqueueOverlays(next, [
            { kind: 'dialogue', nodeId: 'dlg_priya_hook', line: 0 },
            { kind: 'dialogue', nodeId: 'dlg_priya_request', line: 0 },
          ])
        }
        return pushOverlay(next, { kind: 'dialogue', nodeId: node, line: 0 })
      }
    }
  }
  return next
}

function handleInteract(state: OfficeState): OfficeState {
  if (state.screen === 'battle') return state
  if (state.overlay) return handleAdvance(state)
  const target = interactTarget(state)
  if (!target) return state
  const next = withFlag(state, 'flag_interact_coached')
  if (target.kind === 'npc') return openTalk(next, target.id)
  return handlePoi(next, target.id)
}

function openTalk(state: OfficeState, npc: NpcId): OfficeState {
  const node = resolveNpcTalk(state, npc)
  let next = state
  if (npc === 'npc_receptionist' && lettersHeld(state) > 0 && node !== 'dlg_renata_recruit_me') {
    const idle = [
      'dlg_renata_gavin_pending',
      'dlg_renata_holloway',
      'dlg_renata_badged',
      'dlg_renata_after',
    ]
    if (idle.includes(node)) next = withFlag(next, 'flag_renata_recruit_hint')
  }
  if (node === 'dlg_renata_recruit_me') {
    next = { ...next, flags: next.flags.filter((f) => f !== 'flag_renata_recruit_hint') }
  }
  return pushOverlay(next, { kind: 'dialogue', nodeId: node, line: 0 })
}

function handlePoi(state: OfficeState, id: PoiId): OfficeState {
  if (id === 'poi_reception_desk') return openTalk(state, 'npc_receptionist')
  if (id === 'poi_printer') return handlePrinter(state)
  if (id === 'poi_supply_cabinet') return handleCabinet(state)
  if (id === 'poi_break_counter')
    return pushOverlay(state, { kind: 'confirm', prompt: 'take_five' })
  if (id === 'poi_vending_machine') return { ...state, screen: 'vending' }
  if (id === 'poi_agenda') return pushOverlay(state, { kind: 'document', docId: 'agenda' })
  if (id === 'poi_handout_rack') return handleRack(state)
  if (id === 'poi_directory_sign')
    return pushOverlay(state, { kind: 'document', docId: 'directory' })
  if (id === 'poi_elevator_door') return handleElevatorPoi(state)
  if (id === 'poi_exit_door') return inspect(state, POI_INSPECT.poi_exit_door)
  if (id === 'poi_water_cooler') return inspect(state, POI_INSPECT.poi_water_cooler)
  if (id === 'poi_break_table') return inspect(state, POI_INSPECT.poi_break_table)
  if (id === 'poi_supervisor_door') {
    if (supervisorGateOpen(state) && state.encounters.enc_supervisor_1on1 !== 'won') {
      return pushOverlay(state, { kind: 'confirm', prompt: 'door' })
    }
    return inspect(state, POI_INSPECT.poi_supervisor_door)
  }
  return inspect(state, POI_INSPECT[id])
}

function inspect(state: OfficeState, text: string): OfficeState {
  return pushOverlay(state, { kind: 'dialogue', nodeId: `inspect:${text}`, line: 0 })
}

function handlePrinter(state: OfficeState): OfficeState {
  const stage = state.assignments.asg_printer
  if (stage === 'toner_collected') {
    return enqueueOverlays(
      withKey(
        withKey(
          {
            ...state,
            assignments: { ...state.assignments, asg_printer: 'installed' },
          },
          'key_toner',
          -keyCount(state, 'key_toner'),
        ),
        'key_offer_letter',
        2,
      ),
      [
        {
          kind: 'dialogue',
          nodeId: 'inspect:You install the toner. The printer thinks about it.',
          line: 0,
        },
        { kind: 'receipt', receiptId: 'rcpt_printer_online' },
      ],
    )
  }
  if (stage === 'not_started') return inspect(state, PRINTER_COPY.not_started)
  if (stage === 'accepted') return inspect(state, PRINTER_COPY.accepted)
  return inspect(state, PRINTER_COPY.installed)
}

function handleCabinet(state: OfficeState): OfficeState {
  if (state.assignments.asg_printer === 'accepted') {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_printer: 'toner_collected' } },
        'key_toner',
        1,
      ),
      [{ kind: 'toast', text: 'Got: Toner Cartridge' }],
    )
  }
  if (state.assignments.asg_printer === 'not_started')
    return inspect(state, CABINET_COPY.not_started)
  return inspect(state, CABINET_COPY.later)
}

function handleRack(state: OfficeState): OfficeState {
  const asg = state.assignments.asg_meeting_prep
  if (asg === 'not_started') return inspect(state, POI_INSPECT.poi_handout_rack)
  if (asg === 'complete')
    return inspect(state, 'Two stacks left. Both wrong. Both will be here forever.')
  return pushOverlay(state, { kind: 'handout' })
}

function handleElevatorPoi(state: OfficeState): OfficeState {
  if (keyCount(state, 'key_access_badge') > 0) {
    return pushOverlay(state, { kind: 'confirm', prompt: 'elevator' })
  }
  return inspect(withFlag(state, 'flag_badge_reader_denied'), POI_INSPECT.poi_elevator_door)
}

function handleAdvance(state: OfficeState): OfficeState {
  const ov = state.overlay
  if (!ov) return state
  if (ov.kind === 'toast' || ov.kind === 'coach' || ov.kind === 'document')
    return closeOverlay(maybeCoachMove(state, ov))
  if (ov.kind === 'interstitial') {
    const next = closeOverlay(state)
    return pushOverlay(next, { kind: 'dialogue', nodeId: lossDialogue(ov.encounterId), line: 0 })
  }
  if (ov.kind === 'dialogue') {
    if (ov.nodeId.startsWith('inspect:')) return closeOverlay(state)
    const node = DIALOGUE[ov.nodeId as DialogueId]
    if (!node) return closeOverlay(state)
    if (ov.line + 1 < node.lines.length) return { ...state, overlay: { ...ov, line: ov.line + 1 } }
    if (node.choices?.length) return state
    return finishDialogue(closeOverlay(state), node.id)
  }
  if (ov.kind === 'receipt') return handleClose(state, rngDefault)
  if (ov.kind === 'celebration') return state
  return closeOverlay(state)
}

function maybeCoachMove(state: OfficeState, ov: Overlay): OfficeState {
  if (ov.kind === 'coach' && ov.id === 'coach_move') return withFlag(state, 'flag_move_coached')
  if (ov.kind === 'coach' && ov.id === 'coach_interact')
    return withFlag(state, 'flag_interact_coached')
  if (ov.kind === 'coach' && ov.id === 'coach_switch') return withFlag(state, 'flag_switch_coached')
  return state
}

function finishDialogue(state: OfficeState, id: DialogueId): OfficeState {
  if (id === 'dlg_renata_ticket') {
    return { ...state, assignments: { ...state.assignments, asg_printer: 'accepted' } }
  }
  if (id === 'dlg_renata_close_ticket') {
    if (rewardClaimed(state, 'rwd_asg_printer')) return state
    return {
      ...state,
      assignments: { ...state.assignments, asg_printer: 'complete' },
      run: { ...state.run, stockOptions: state.run.stockOptions + 10 },
      rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_printer'],
      overlay: { kind: 'receipt', receiptId: 'rcpt_ticket_closed' },
    }
  }
  if (id === 'dlg_gavin_beaten') {
    if (lettersHeld(state) > 0 && !inParty(state, 'cw_desk_challenger')) {
      return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_gavin_offer', line: 0 })
    }
    return state
  }
  if (id === 'dlg_priya_delivered') {
    let next = state
    const held = heldHandout(state)
    if (held) next = withKey(next, held, -1)
    if (!rewardClaimed(next, 'rwd_asg_meeting_prep')) {
      next = {
        ...next,
        assignments: { ...next.assignments, asg_meeting_prep: 'complete' },
        run: { ...next.run, stockOptions: next.run.stockOptions + 6 },
        rewardsClaimed: [...next.rewardsClaimed, 'rwd_asg_meeting_prep'],
      }
      return enqueueOverlays(next, [
        { kind: 'receipt', receiptId: 'rcpt_meeting_prepped' },
        { kind: 'dialogue', nodeId: 'dlg_priya_spar', line: 0 },
      ])
    }
    return pushOverlay(
      { ...next, assignments: { ...next.assignments, asg_meeting_prep: 'complete' } },
      { kind: 'dialogue', nodeId: 'dlg_priya_spar', line: 0 },
    )
  }
  if (id === 'dlg_priya_beaten') {
    if (lettersHeld(state) > 0 && !inParty(state, 'cw_meeting_prepper') && partyHasRoom(state)) {
      return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_priya_offer', line: 0 })
    }
    return state
  }
  if (id === 'dlg_gavin_you_lost' || id === 'dlg_priya_you_lost') {
    return { ...state, lastLossEncounter: null }
  }
  return state
}

function handleChoose(state: OfficeState, choice: string): OfficeState {
  const ov = state.overlay
  if (ov?.kind === 'confirm') {
    if (choice === 'yes' || choice === 'take_five' || choice === 'step_in' || choice === 'ride') {
      if (ov.prompt === 'take_five') return takeFive(closeOverlay(state))
      if (ov.prompt === 'door') return doorStepIn(state)
      if (ov.prompt === 'elevator') return rideElevator(closeOverlay(state))
    }
    if (ov.prompt === 'door') {
      return { ...closeOverlay(state), player: { x: 11, y: 3, facing: 'e' } }
    }
    return closeOverlay(state)
  }
  if (ov?.kind === 'stakes') {
    if (choice === 'yes' || choice === 'bring_it' || choice === 'spar' || choice === 'begin') {
      return confirmStakes(state)
    }
    return declineStakes(state)
  }
  if (ov?.kind === 'recruit') {
    return choice === 'extend' ? extendOffer(state) : declineOffer(state)
  }
  if (ov?.kind === 'handout') {
    const pick = HANDOUT_CHOICES.find((c) => c.id === choice)
    if (pick) return pickHandout(state, pick.id)
    return closeOverlay(state)
  }
  if (ov?.kind !== 'dialogue') return state
  const node = DIALOGUE[ov.nodeId as DialogueId]
  if (!node) return state
  const closed = closeOverlay(state)
  if (node.id === 'dlg_gavin_challenge') {
    if (choice === 'bring_it')
      return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_desk_challenger' })
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_gavin_declined', line: 0 })
  }
  if (node.id === 'dlg_gavin_offer') {
    if (choice === 'extend')
      return extendOffer({
        ...closed,
        overlay: { kind: 'recruit', coworkerId: 'cw_desk_challenger' },
      })
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_gavin_offer_declined', line: 0 })
  }
  if (node.id === 'dlg_priya_request') {
    if (choice === 'take_it') {
      return { ...closed, assignments: { ...closed.assignments, asg_meeting_prep: 'accepted' } }
    }
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_priya_pass', line: 0 })
  }
  if (node.id === 'dlg_priya_spar') {
    if (choice === 'spar')
      return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_meeting_prepper' })
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_priya_raincheck', line: 0 })
  }
  if (node.id === 'dlg_priya_offer') {
    if (choice === 'extend')
      return extendOffer({
        ...closed,
        overlay: { kind: 'recruit', coworkerId: 'cw_meeting_prepper' },
      })
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_priya_offer_declined', line: 0 })
  }
  if (node.id === 'dlg_holloway_1on1') {
    return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_supervisor_1on1' })
  }
  return closed
}

function handleClose(state: OfficeState, rng: Rng): OfficeState {
  if (state.screen === 'vending') return { ...state, screen: 'overworld' }
  const ov = state.overlay
  if (!ov) return state
  if (ov.kind === 'receipt') {
    const closed = closeOverlay(state)
    return afterReceipt(closed, ov.receiptId, rng)
  }
  if (ov.kind === 'celebration') return state
  return handleAdvance(state)
}

function afterReceipt(state: OfficeState, receiptId: string, rng: Rng): OfficeState {
  if (receiptId === 'rcpt_desk_argument') {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_gavin_beaten', line: 0 })
  }
  if (receiptId === 'rcpt_premeeting_spar') {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_priya_beaten', line: 0 })
  }
  if (receiptId === 'rcpt_one_on_one') {
    let next = state
    if (!next.run.pendingPerkOffer) {
      const offer = rollPerkOffer(next.run.perks, rng, BASE_PERK_POOL)
      next = {
        ...next,
        run: { ...next.run, pendingPerkOffer: offer },
        rewardsClaimed: next.rewardsClaimed.includes('rwd_promotion_f1')
          ? next.rewardsClaimed
          : [...next.rewardsClaimed, 'rwd_promotion_f1'],
      }
    }
    return { ...next, screen: 'promotion' }
  }
  if (receiptId === 'rcpt_promotion_signing_bonus') {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_holloway_beaten', line: 0 })
  }
  if (receiptId === 'rcpt_printer_online') {
    return withKey(
      { ...state, keyItems: { ...state.keyItems } },
      'key_toner',
      -keyCount(state, 'key_toner'),
    )
  }
  return state
}

function confirmStakes(state: OfficeState): OfficeState {
  const ov = state.overlay
  if (ov?.kind !== 'stakes') return state
  return startEncounter({ ...state, overlay: null, overlayQueue: [] }, ov.encounterId)
}

function declineStakes(state: OfficeState): OfficeState {
  const ov = state.overlay
  if (ov?.kind !== 'stakes') return closeOverlay(state)
  const closed = closeOverlay(state)
  if (ov.encounterId === 'enc_desk_challenger') {
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_gavin_declined', line: 0 })
  }
  if (ov.encounterId === 'enc_meeting_prepper') {
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_priya_raincheck', line: 0 })
  }
  return closed
}

function extendOffer(state: OfficeState): OfficeState {
  const coworker =
    state.overlay?.kind === 'recruit'
      ? state.overlay.coworkerId
      : state.overlay?.kind === 'dialogue' && state.overlay.nodeId === 'dlg_gavin_offer'
        ? 'cw_desk_challenger'
        : state.overlay?.kind === 'dialogue' && state.overlay.nodeId === 'dlg_priya_offer'
          ? 'cw_meeting_prepper'
          : null
  if (!coworker) return state
  const joined = recruitCoworker({ ...state, overlay: null, overlayQueue: [] }, coworker)
  const node = coworker === 'cw_desk_challenger' ? 'dlg_gavin_joined' : 'dlg_priya_joined'
  return pushOverlay(joined, { kind: 'dialogue', nodeId: node, line: 0 })
}

function declineOffer(state: OfficeState): OfficeState {
  const node =
    state.overlay?.kind === 'recruit' && state.overlay.coworkerId === 'cw_meeting_prepper'
      ? 'dlg_priya_offer_declined'
      : 'dlg_gavin_offer_declined'
  return pushOverlay(closeOverlay(state), { kind: 'dialogue', nodeId: node, line: 0 })
}

function takeFive(state: OfficeState): OfficeState {
  return enqueueOverlays(restoreParty(closeOverlay(state)), [
    { kind: 'toast', text: "You take five. Everyone's restored. The couch has seen worse." },
  ])
}

function buyVending(state: OfficeState, itemId: ItemId): OfficeState {
  const stock = state.run.shopStock ?? []
  const idx = stock.indexOf(itemId)
  if (idx < 0) return state
  const price = shopPrice(ITEMS[itemId].price, state.run.perks, state.run.floor, state.run.relics)
  if (state.run.stockOptions < price || state.run.inventory.length >= 4) return state
  return { ...state, run: buyShopItem(state.run, idx) }
}

function pickHandout(state: OfficeState, itemId: KeyItemId): OfficeState {
  const prev = heldHandout(state)
  let next = state
  if (prev) next = withKey(next, prev, -1)
  next = withKey(next, itemId, 1)
  if (
    next.assignments.asg_meeting_prep === 'accepted' ||
    next.assignments.asg_meeting_prep === 'handout_held'
  ) {
    next = { ...next, assignments: { ...next.assignments, asg_meeting_prep: 'handout_held' } }
  }
  const label = HANDOUT_CHOICES.find((c) => c.id === itemId)?.label ?? itemId
  const text = prev
    ? `Swapped: ${HANDOUT_CHOICES.find((c) => c.id === prev)?.label ?? prev} → ${label}`
    : `Got: ${label}`
  return enqueueOverlays(closeOverlay(next), [
    { kind: 'toast', text },
    { kind: 'dialogue', nodeId: `inspect:${HANDOUT_PICK_LINE[itemId] ?? label}`, line: 0 },
  ])
}

function pickPerk(state: OfficeState, perkId: PerkId): OfficeState {
  if (!state.run.pendingPerkOffer?.includes(perkId)) return state
  const run = choosePerk(state.run, perkId)
  const next: OfficeState = { ...state, run, screen: 'overworld' }
  if (perkId === 'signing_bonus') {
    return pushOverlay(next, { kind: 'receipt', receiptId: 'rcpt_promotion_signing_bonus' })
  }
  return pushOverlay(next, { kind: 'dialogue', nodeId: 'dlg_holloway_beaten', line: 0 })
}

function rideElevator(state: OfficeState): OfficeState {
  if (keyCount(state, 'key_access_badge') < 1) return state
  return {
    ...state,
    screen: 'preview_complete',
    overlay: { kind: 'celebration' },
    overlayQueue: [],
  }
}

function doorStepIn(state: OfficeState): OfficeState {
  if (state.party.every((m) => m.hp <= 0)) {
    return pushOverlay(closeOverlay(state), { kind: 'confirm', prompt: 'take_five' })
  }
  return pushOverlay(
    { ...closeOverlay(state), player: { x: 9, y: 3, facing: 'w' } },
    { kind: 'dialogue', nodeId: 'dlg_holloway_1on1', line: 0 },
  )
}

function canSwitch(state: OfficeState): boolean {
  if (state.screen !== 'battle' || !state.encounter) return false
  return state.encounter.party.filter((m) => m.hp > 0).length >= 2
}

export function inspectText(nodeId: string): string | null {
  if (!nodeId.startsWith('inspect:')) return null
  return nodeId.slice('inspect:'.length)
}

export function encounterIdFromStakes(state: OfficeState): EncounterId | null {
  return state.overlay?.kind === 'stakes' ? state.overlay.encounterId : null
}
