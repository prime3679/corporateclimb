import { BASE_PERK_POOL, ITEMS } from '@/data'
import { buyShopItem, shopPrice } from '../shop'
import { choosePerk } from '../run'
import { rollPerkOffer } from '../offers'
import type { Rng } from '../rng'
import type { BattleEvent } from '../events'
import type { ItemId, PerkId } from '@/types'
import {
  CABINET_COPY,
  CABINET_F2_COPY,
  COWORKER_DESK,
  COWORKER_NAME,
  canOpenElevatorPanel,
  canRideTo,
  elevatorDenyFor,
  DIALOGUE,
  elevatorArrivalForFloor,
  elevatorBoardingSpotsForFloor,
  FLOOR_2_DIRECTOR_DOOR,
  FLOOR_2_DOOR_STEP_BACK,
  FLOOR_2_DOOR_STEP_IN,
  floorNumber,
  HANDOUT_CHOICES,
  HANDOUT_PICK_LINE,
  isKnownFloorId,
  INTAKE_BOARD_COPY,
  LEAVEBEHIND_COPY,
  PEOPLE_TRAY_COPY,
  PHOTO_BOOTH_COPY,
  POI_INSPECT,
  PRINTER_COPY,
  ROADMAP_WALL_COPY,
  SIDEBOARD_COPY,
  BADGE_PRINTER_COPY,
  SHREDDER_COPY,
  type CoworkerId,
  type DialogueId,
  type EncounterId,
  type Facing,
  type FloorId,
  type KeyItemId,
  type NpcId,
  type PoiId,
} from '@/content/office'
import { applyOfficeSwitch, applyOfficeTurn, shouldCoachSwitch, startEncounter } from './combat'
import { interactTarget, sightlineNpc, tryStep } from './movement'
import { dismissCoworker, recruitCoworker, rejoinCoworker, restoreParty } from './party'
import {
  closeOverlay,
  directorGateOpen,
  enqueueOverlays,
  heldHandout,
  inParty,
  keyCount,
  lettersHeld,
  mergeVendingStock,
  partyHasRoom,
  pushOverlay,
  rewardClaimed,
  supervisorGateOpen,
  vendingStockForFloor,
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
  | { type: 'MAKE_ROOM' }
  | { type: 'REQUEST_DISMISS'; slot: number }
  | { type: 'DISMISS_MEMBER'; slot: number }
  | { type: 'REJOIN'; coworkerId: CoworkerId }
  | { type: 'OPEN_SWITCH' }
  | { type: 'CANCEL_SWITCH' }
  | { type: 'BATTLE_MOVE'; moveIdx: number }
  | { type: 'BATTLE_ITEM'; itemIdx: number }
  | { type: 'BATTLE_SWITCH'; to: number }
  | { type: 'PICK_PERK'; perkId: PerkId }
  | { type: 'RIDE_ELEVATOR'; to: FloorId }
  | { type: 'COMPLETE_ELEVATOR_RIDE' }
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
      return done(closeTeam(state))
    case 'MAKE_ROOM':
      return done(makeRoom(state))
    case 'REQUEST_DISMISS':
      return done(requestDismiss(state, action.slot))
    case 'DISMISS_MEMBER':
      return done(dismissMember(state, action.slot))
    case 'REJOIN':
      return done(finishRejoin(state, action.coworkerId))
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
      return done(rideElevator(state, action.to))
    case 'COMPLETE_ELEVATOR_RIDE':
      return done(completeElevatorRide(state))
    case 'DOOR_STEP_IN':
      return done(
        state.overlay?.kind === 'confirm' && state.overlay.prompt === 'kessler_door'
          ? kesslerDoorStepIn(state)
          : doorStepIn(state),
      )
    case 'DOOR_STEP_BACK':
      return done(
        state.overlay?.kind === 'confirm' && state.overlay.prompt === 'kessler_door'
          ? { ...closeOverlay(state), player: { ...FLOOR_2_DOOR_STEP_BACK } }
          : {
              ...closeOverlay(state),
              player: { x: 11, y: 3, facing: 'e' },
            },
      )
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
  if (!moved) return afterFacing(stepped)
  return afterMove(maybeFirstStep(stepped))
}

function maybeFirstStep(state: OfficeState): OfficeState {
  if (state.floorId === 'floor_02') {
    return maybeFirstStepOnFloor(
      state,
      'trg_first_step_f2:arrival',
      'flag_visited_f2',
      'dlg_teddy_callout',
    )
  }
  if (state.floorId === 'floor_03') {
    return maybeFirstStepOnFloor(
      state,
      'trg_first_step_f3:arrival',
      'flag_visited_f3',
      'dlg_sloane_callout',
    )
  }
  if (state.floorId === 'floor_04') {
    return maybeFirstStepOnFloor(
      state,
      'trg_first_step_f4:arrival',
      'flag_visited_f4',
      'dlg_harper_callout',
    )
  }
  if (state.floorId === 'floor_05') {
    return maybeFirstStepOnFloor(
      state,
      'trg_first_step_f5:arrival',
      'flag_visited_f5',
      'dlg_marlowe_callout',
    )
  }
  if (state.firedTriggers.includes('trg_first_step:spawn')) {
    return withFlag(state, 'flag_move_coached')
  }
  let next = withFlag(
    {
      ...state,
      firedTriggers: [...state.firedTriggers, 'trg_first_step:spawn'],
    },
    'flag_greeted',
  )
  const follow: Overlay[] = [{ kind: 'dialogue', nodeId: 'dlg_renata_callout', line: 0 }]
  if (!next.flags.includes('flag_pin_coached')) {
    next = withFlag(next, 'flag_pin_coached')
    follow.push({ kind: 'coach', id: 'coach_pin' })
  }
  return enqueueOverlays(next, follow)
}

function visitFlagFor(
  floorId: FloorId,
): 'flag_visited_f2' | 'flag_visited_f3' | 'flag_visited_f4' | 'flag_visited_f5' | null {
  if (floorId === 'floor_02') return 'flag_visited_f2'
  if (floorId === 'floor_03') return 'flag_visited_f3'
  if (floorId === 'floor_04') return 'flag_visited_f4'
  if (floorId === 'floor_05') return 'flag_visited_f5'
  return null
}

function maybeFirstStepOnFloor(
  state: OfficeState,
  trigger: string,
  flag: 'flag_visited_f2' | 'flag_visited_f3' | 'flag_visited_f4' | 'flag_visited_f5',
  nodeId: DialogueId,
): OfficeState {
  if (state.firedTriggers.includes(trigger)) return state
  return enqueueOverlays(
    withFlag({ ...state, firedTriggers: [...state.firedTriggers, trigger] }, flag),
    [{ kind: 'dialogue', nodeId, line: 0 }],
  )
}

function afterMove(state: OfficeState): OfficeState {
  let next = withFlag(state, 'flag_move_coached')
  if (next.overlay) return next

  if (next.floorId === 'floor_01' && next.player.x === 10 && next.player.y === 3) {
    if (supervisorGateOpen(next) && next.encounters.enc_supervisor_1on1 !== 'won') {
      const key = 'trg_supervisor_door:ready'
      if (!next.firedTriggers.includes(key)) {
        next = { ...next, firedTriggers: [...next.firedTriggers, key] }
      }
      return pushOverlay(next, { kind: 'confirm', prompt: 'door' })
    }
  }

  if (
    next.floorId === 'floor_02' &&
    next.player.x === FLOOR_2_DIRECTOR_DOOR.x &&
    next.player.y === FLOOR_2_DIRECTOR_DOOR.y &&
    directorGateOpen(next)
  ) {
    const key = 'trg_director_door:ready'
    if (!next.firedTriggers.includes(key)) {
      next = { ...next, firedTriggers: [...next.firedTriggers, key] }
    }
    return pushOverlay(next, { kind: 'confirm', prompt: 'kessler_door' })
  }

  if (shouldPromptElevator(next)) {
    return pushOverlay(next, { kind: 'elevator_panel' })
  }

  const npc = sightlineNpc(next)
  if (npc) {
    const node = sightDialogue(next, npc)
    if (node) {
      const a = next.assignments
      const key = `trg_sight_${npc}:${a.asg_printer}:${a.asg_meeting_prep}:${next.encounters.enc_desk_challenger}:${a.asg_transfer}:${a.asg_audit}:${a.asg_roadmap}:${a.asg_leavebehind}:${a.asg_board_packet}`
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
  return maybeNearbyCoaches(next)
}

function shouldPromptElevator(state: OfficeState): boolean {
  if (!canOpenElevatorPanel(state.floorId, state.keyItems)) return false
  return elevatorBoardingSpotsForFloor(state.floorId).some(
    (spot) =>
      spot.x === state.player.x && spot.y === state.player.y && spot.facing === state.player.facing,
  )
}

function isElevatorTarget(target: ReturnType<typeof interactTarget>): boolean {
  return !!target && target.kind === 'poi' && target.id.startsWith('poi_elevator_door')
}

/** Turning in place still opens a boarded cab and teaches the first nearby prompt. */
function afterFacing(state: OfficeState): OfficeState {
  if (state.overlay) return state
  if (shouldPromptElevator(state)) return pushOverlay(state, { kind: 'elevator_panel' })
  return maybeNearbyCoaches(state)
}

function maybeNearbyCoaches(state: OfficeState): OfficeState {
  if (state.overlay) return state
  const target = interactTarget(state)
  if (!target) return state
  if (isElevatorTarget(target) && !state.flags.includes('flag_elevator_coached')) {
    return withFlag(
      pushOverlay(state, { kind: 'coach', id: 'coach_elevator' }),
      'flag_elevator_coached',
    )
  }
  if (!state.flags.includes('flag_interact_coached')) {
    return withFlag(
      pushOverlay(state, { kind: 'coach', id: 'coach_interact' }),
      'flag_interact_coached',
    )
  }
  return state
}

function handleInteract(state: OfficeState): OfficeState {
  if (state.screen === 'battle') return state
  if (state.overlay?.kind === 'coach') {
    const id = state.overlay.id
    const next = closeOverlay(maybeCoachMove(state, state.overlay))
    if (id === 'coach_interact' || id === 'coach_elevator') return handleInteract(next)
    return next
  }
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
  if (id === 'poi_vending_machine') return handleFloor1Vending(state)
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
  // Floor 2 (docs/rpg/floor-2-design.md §2.4)
  if (id === 'poi_elevator_door_f2') return handleElevatorPoi(state)
  if (id === 'poi_break_counter_f2')
    return pushOverlay(state, { kind: 'confirm', prompt: 'take_five' })
  if (id === 'poi_vending_machine_f2') return openVending(state)
  if (id === 'poi_directory_sign_f2')
    return pushOverlay(state, { kind: 'document', docId: 'directory' })
  if (id === 'poi_photo_booth') return handlePhotoBooth(state)
  if (id === 'poi_people_tray') return handlePeopleTray(state)
  if (id === 'poi_badge_printer') return handleBadgePrinter(state)
  if (id === 'poi_director_door') {
    if (directorGateOpen(state)) {
      return pushOverlay(state, { kind: 'confirm', prompt: 'kessler_door' })
    }
    return inspect(state, POI_INSPECT.poi_director_door)
  }
  if (id === 'poi_directory_sign_stub') return inspect(state, POI_INSPECT.poi_directory_sign_stub)
  if (id === 'poi_supply_cabinet_f2') return handleCabinetF2(state)
  if (id === 'poi_shredder') {
    return inspect(
      state,
      state.assignments.asg_audit === 'complete' ? SHREDDER_COPY.after : SHREDDER_COPY.idle,
    )
  }
  // Floors 3–5 — shared take-five / vending / directory / elevator + assignment POIs
  if (
    id === 'poi_elevator_door_f3' ||
    id === 'poi_elevator_door_f4' ||
    id === 'poi_elevator_door_f5'
  )
    return handleElevatorPoi(state)
  if (
    id === 'poi_break_counter_f3' ||
    id === 'poi_break_counter_f4' ||
    id === 'poi_break_counter_f5'
  )
    return pushOverlay(state, { kind: 'confirm', prompt: 'take_five' })
  if (
    id === 'poi_vending_machine_f3' ||
    id === 'poi_vending_machine_f4' ||
    id === 'poi_vending_machine_f5'
  )
    return openVending(state)
  if (
    id === 'poi_directory_sign_f3' ||
    id === 'poi_directory_sign_f4' ||
    id === 'poi_directory_sign_f5'
  )
    return pushOverlay(state, { kind: 'document', docId: 'directory' })
  if (id === 'poi_roadmap_wall') return handleRoadmapWall(state)
  if (id === 'poi_intake_board') return handleIntakeBoard(state)
  if (id === 'poi_pipeline_board') return handleLeavebehindPickup(state, 'poi_pipeline_board')
  if (id === 'poi_leavebehind') return handleLeavebehindPickup(state, 'poi_leavebehind')
  if (id === 'poi_sideboard') return handleSideboard(state)
  if (id === 'poi_supply_cabinet_upper') return handleCabinetUpper(state)
  return inspect(state, POI_INSPECT[id])
}

/** Transfer packet, step 1: the booth fires on two and prints the only copy. */
function handlePhotoBooth(state: OfficeState): OfficeState {
  const stage = state.assignments.asg_transfer
  if (stage === 'accepted') {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_transfer: 'photo_taken' } },
        'key_badge_photo',
        1,
      ),
      [
        { kind: 'dialogue', nodeId: `inspect:${PHOTO_BOOTH_COPY.countdown}`, line: 0 },
        { kind: 'dialogue', nodeId: `inspect:${PHOTO_BOOTH_COPY.printed}`, line: 0 },
        { kind: 'toast', text: 'Got: Badge Photo (eyes closed)' },
      ],
    )
  }
  if (stage === 'not_started') return inspect(state, PHOTO_BOOTH_COPY.not_started)
  return inspect(state, PHOTO_BOOTH_COPY.later)
}

/** Transfer packet, step 3: People Ops is a tray. It pays +12 and one Offer Letter, once. */
function handlePeopleTray(state: OfficeState): OfficeState {
  const stage = state.assignments.asg_transfer
  if (stage === 'signed') {
    if (rewardClaimed(state, 'rwd_asg_transfer')) return state
    let next: OfficeState = {
      ...state,
      assignments: { ...state.assignments, asg_transfer: 'filed' },
      run: { ...state.run, stockOptions: state.run.stockOptions + 12 },
      rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_transfer'],
    }
    next = withKey(next, 'key_badge_photo', -keyCount(next, 'key_badge_photo'))
    next = withKey(next, 'key_transfer_form', -keyCount(next, 'key_transfer_form'))
    next = withKey(next, 'key_offer_letter', 1)
    return enqueueOverlays(next, [
      { kind: 'dialogue', nodeId: `inspect:${PEOPLE_TRAY_COPY.filing}`, line: 0 },
      { kind: 'dialogue', nodeId: `inspect:${PEOPLE_TRAY_COPY.letter}`, line: 0 },
      { kind: 'receipt', receiptId: 'rcpt_transfer_filed' },
    ])
  }
  if (stage === 'not_started') return inspect(state, PEOPLE_TRAY_COPY.not_started)
  if (stage === 'accepted' || stage === 'photo_taken')
    return inspect(state, PEOPLE_TRAY_COPY.waiting)
  return inspect(state, PEOPLE_TRAY_COPY.later)
}

function handleCabinetF2(state: OfficeState): OfficeState {
  const key = 'poi_supply_cabinet_f2:opened'
  if (state.firedTriggers.includes(key)) return inspect(state, CABINET_F2_COPY.later)
  return inspect({ ...state, firedTriggers: [...state.firedTriggers, key] }, CABINET_F2_COPY.first)
}

function handleCabinetUpper(state: OfficeState): OfficeState {
  const key = 'poi_supply_cabinet_upper:opened'
  if (state.firedTriggers.includes(key)) return inspect(state, POI_INSPECT.poi_supply_cabinet_upper)
  return inspect(
    { ...state, firedTriggers: [...state.firedTriggers, key] },
    POI_INSPECT.poi_supply_cabinet_upper,
  )
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
  if (canOpenElevatorPanel(state.floorId, state.keyItems)) {
    return pushOverlay(state, { kind: 'elevator_panel' })
  }
  return inspect(withFlag(state, 'flag_badge_reader_denied'), POI_INSPECT.poi_elevator_door)
}

function handleBadgePrinter(state: OfficeState): OfficeState {
  if (state.encounters.enc_director_review !== 'won') {
    return inspect(state, BADGE_PRINTER_COPY.locked)
  }
  if (keyCount(state, 'key_employee_badge') > 0) {
    return inspect(state, BADGE_PRINTER_COPY.done)
  }
  return enqueueOverlays(state, [
    { kind: 'pause', reason: 'badge_print' },
    { kind: 'receipt', receiptId: 'rcpt_employee_badge' },
  ])
}

function openVending(state: OfficeState): OfficeState {
  const stock = (state.vendingStock ?? mergeVendingStock(null, state.run.shopStock))[state.floorId]
  return {
    ...state,
    screen: 'vending',
    run: { ...state.run, shopStock: [...(stock ?? vendingStockForFloor(state.floorId))] },
  }
}

function handleFloor1Vending(state: OfficeState): OfficeState {
  if (state.assignments.asg_audit === 'accepted' && keyCount(state, 'key_receipt_roll') === 0) {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_audit: 'receipts_held' } },
        'key_receipt_roll',
        1,
      ),
      [{ kind: 'toast', text: 'Got: Receipt Roll (2.3 m)' }],
    )
  }
  return openVending(state)
}

function handleRoadmapWall(state: OfficeState): OfficeState {
  if (state.assignments.asg_roadmap === 'accepted' && keyCount(state, 'key_roadmap_card') === 0) {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_roadmap: 'card_held' } },
        'key_roadmap_card',
        1,
      ),
      [{ kind: 'toast', text: 'Got: Q4 Roadmap Card' }],
    )
  }
  if (state.assignments.asg_roadmap === 'not_started')
    return inspect(state, POI_INSPECT.poi_roadmap_wall)
  return inspect(state, ROADMAP_WALL_COPY.later)
}

function handleIntakeBoard(state: OfficeState): OfficeState {
  if (state.assignments.asg_roadmap === 'card_held') return fileRoadmap(state, true)
  if (
    state.assignments.asg_roadmap === 'not_started' ||
    state.assignments.asg_roadmap === 'accepted'
  ) {
    return inspect(state, POI_INSPECT.poi_intake_board)
  }
  return inspect(state, INTAKE_BOARD_COPY.later)
}

function fileRoadmap(state: OfficeState, fromBoard: boolean): OfficeState {
  if (state.assignments.asg_roadmap !== 'card_held' || rewardClaimed(state, 'rwd_asg_roadmap')) {
    return fromBoard ? inspect(state, INTAKE_BOARD_COPY.later) : state
  }
  let next: OfficeState = {
    ...state,
    assignments: { ...state.assignments, asg_roadmap: 'initialled' },
    run: { ...state.run, stockOptions: state.run.stockOptions + 14 },
    rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_roadmap'],
  }
  next = withKey(next, 'key_roadmap_card', -keyCount(next, 'key_roadmap_card'))
  next = withKey(next, 'key_research_sticky', 1)
  const follow: Overlay[] = [{ kind: 'receipt', receiptId: 'rcpt_roadmap_initialled' }]
  if (fromBoard) {
    return enqueueOverlays(next, [
      { kind: 'dialogue', nodeId: `inspect:${INTAKE_BOARD_COPY.filing}`, line: 0 },
      ...follow,
    ])
  }
  return enqueueOverlays(next, [
    { kind: 'dialogue', nodeId: 'dlg_nico_initialled', line: 0 },
    ...follow,
  ])
}

function handleLeavebehindPickup(
  state: OfficeState,
  id: 'poi_pipeline_board' | 'poi_leavebehind',
): OfficeState {
  if (
    state.assignments.asg_leavebehind === 'accepted' &&
    keyCount(state, 'key_leavebehind') === 0
  ) {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_leavebehind: 'deck_held' } },
        'key_leavebehind',
        1,
      ),
      [{ kind: 'toast', text: 'Got: Leave-behind' }],
    )
  }
  if (state.assignments.asg_leavebehind === 'not_started') {
    return inspect(state, POI_INSPECT[id])
  }
  return inspect(
    state,
    id === 'poi_pipeline_board' ? POI_INSPECT.poi_pipeline_board : LEAVEBEHIND_COPY.later,
  )
}

function deliverLeavebehind(state: OfficeState): OfficeState {
  if (
    state.assignments.asg_leavebehind !== 'deck_held' ||
    rewardClaimed(state, 'rwd_asg_leavebehind')
  ) {
    return state
  }
  let next: OfficeState = {
    ...state,
    assignments: { ...state.assignments, asg_leavebehind: 'delivered' },
    run: { ...state.run, stockOptions: state.run.stockOptions + 16 },
    rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_leavebehind'],
  }
  next = withKey(next, 'key_leavebehind', -keyCount(next, 'key_leavebehind'))
  return enqueueOverlays(next, [
    { kind: 'dialogue', nodeId: 'dlg_reyes_delivered', line: 0 },
    { kind: 'receipt', receiptId: 'rcpt_leavebehind_delivered' },
  ])
}

function handleSideboard(state: OfficeState): OfficeState {
  if (
    state.assignments.asg_board_packet === 'accepted' &&
    keyCount(state, 'key_board_packet') === 0
  ) {
    return enqueueOverlays(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_board_packet: 'packet_held' } },
        'key_board_packet',
        1,
      ),
      [{ kind: 'toast', text: 'Got: Board Packet' }],
    )
  }
  if (state.assignments.asg_board_packet === 'not_started')
    return inspect(state, POI_INSPECT.poi_sideboard)
  return inspect(state, SIDEBOARD_COPY.later)
}

function fileBoardPacket(state: OfficeState): OfficeState {
  if (
    state.assignments.asg_board_packet !== 'packet_held' ||
    rewardClaimed(state, 'rwd_asg_board_packet')
  ) {
    return state
  }
  let next: OfficeState = {
    ...state,
    assignments: { ...state.assignments, asg_board_packet: 'complete' },
    run: { ...state.run, stockOptions: state.run.stockOptions + 18 },
    rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_board_packet'],
  }
  next = withKey(next, 'key_board_packet', -keyCount(next, 'key_board_packet'))
  return pushOverlay(next, { kind: 'receipt', receiptId: 'rcpt_board_packet_filed' })
}

function handleAdvance(state: OfficeState): OfficeState {
  const ov = state.overlay
  if (!ov) return state
  if (ov.kind === 'toast' || ov.kind === 'coach' || ov.kind === 'document' || ov.kind === 'pause')
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
  if (ov.kind === 'coach' && ov.id === 'coach_pin') return withFlag(state, 'flag_pin_coached')
  if (ov.kind === 'coach' && ov.id === 'coach_elevator')
    return withFlag(state, 'flag_elevator_coached')
  if (ov.kind === 'coach' && ov.id === 'coach_switch') return withFlag(state, 'flag_switch_coached')
  if (ov.kind === 'coach' && ov.id === 'coach_roster') return withFlag(state, 'flag_roster_coached')
  return state
}

function finishDialogue(state: OfficeState, id: DialogueId): OfficeState {
  // Floor 2 transfer packet (design §4.1). Compliance training onward is Astra's.
  if (id === 'dlg_teddy_packet') {
    return { ...state, assignments: { ...state.assignments, asg_transfer: 'accepted' } }
  }
  if (id === 'dlg_holloway_sign_transfer') {
    if (state.assignments.asg_transfer !== 'photo_taken') return state
    return pushOverlay(
      withKey(
        { ...state, assignments: { ...state.assignments, asg_transfer: 'signed' } },
        'key_transfer_form',
        1,
      ),
      { kind: 'toast', text: 'Got: Transfer Form (signed)' },
    )
  }
  if (id === 'dlg_teddy_filed') {
    const next: OfficeState = {
      ...state,
      assignments: { ...state.assignments, asg_transfer: 'complete' },
    }
    if (next.encounters.enc_help_desk_intern === 'open') {
      return pushOverlay(next, { kind: 'stakes', encounterId: 'enc_help_desk_intern' })
    }
    return next
  }
  if (id === 'dlg_teddy_beaten') return teddyOfferFollowup(state)
  if (id === 'dlg_whitlock_recruit') return withFlag(state, 'flag_whitlock_recruit_seen')
  if (id === 'dlg_whitlock_delivered') {
    if (state.assignments.asg_audit !== 'receipts_held' || rewardClaimed(state, 'rwd_asg_audit')) {
      return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_whitlock_challenge', line: 0 })
    }
    const paid: OfficeState = withKey(
      {
        ...state,
        assignments: { ...state.assignments, asg_audit: 'complete' },
        run: { ...state.run, stockOptions: state.run.stockOptions + 10 },
        rewardsClaimed: [...state.rewardsClaimed, 'rwd_asg_audit'],
      },
      'key_receipt_roll',
      -keyCount(state, 'key_receipt_roll'),
    )
    return enqueueOverlays(paid, [
      { kind: 'receipt', receiptId: 'rcpt_audit_reconciled' },
      { kind: 'dialogue', nodeId: 'dlg_whitlock_challenge', line: 0 },
    ])
  }
  if (id === 'dlg_teddy_rejoin' || id === 'dlg_gavin_rejoin' || id === 'dlg_priya_rejoin') {
    const coworker: CoworkerId =
      id === 'dlg_teddy_rejoin'
        ? 'cw_help_desk_intern'
        : id === 'dlg_gavin_rejoin'
          ? 'cw_desk_challenger'
          : 'cw_meeting_prepper'
    return finishRejoin(state, coworker)
  }
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
  if (id === 'dlg_sloane_brief') {
    return { ...state, assignments: { ...state.assignments, asg_roadmap: 'accepted' } }
  }
  if (id === 'dlg_sloane_filed') {
    return { ...state, assignments: { ...state.assignments, asg_roadmap: 'complete' } }
  }
  if (id === 'dlg_nico_waiting') return fileRoadmap(state, false)
  if (id === 'dlg_harper_brief') {
    return { ...state, assignments: { ...state.assignments, asg_leavebehind: 'accepted' } }
  }
  if (id === 'dlg_harper_filed') {
    return { ...state, assignments: { ...state.assignments, asg_leavebehind: 'complete' } }
  }
  if (id === 'dlg_reyes_waiting') return deliverLeavebehind(state)
  if (id === 'dlg_marlowe_brief') {
    return { ...state, assignments: { ...state.assignments, asg_board_packet: 'accepted' } }
  }
  if (id === 'dlg_marlowe_filed') return fileBoardPacket(state)
  if (
    id === 'dlg_quincy_you_lost' ||
    id === 'dlg_ashford_you_lost' ||
    id === 'dlg_caldwell_you_lost'
  ) {
    return { ...state, lastLossEncounter: null }
  }
  if (id === 'dlg_quincy_beaten') {
    return pushOverlay(state, { kind: 'celebration', screen: 'screen_floor3_complete' })
  }
  if (id === 'dlg_ashford_beaten') {
    return pushOverlay(state, { kind: 'celebration', screen: 'screen_floor4_complete' })
  }
  if (id === 'dlg_caldwell_beaten') {
    return pushOverlay(state, { kind: 'celebration', screen: 'screen_floor5_complete' })
  }
  return state
}

function handleChoose(state: OfficeState, choice: string): OfficeState {
  const ov = state.overlay
  if (ov?.kind === 'celebration') {
    if (choice === 'title') return closeOverlay(state)
    if (choice === 'continue' || choice === 'stay' || choice === 'back') return closeOverlay(state)
    if (isKnownFloorId(choice)) {
      const closed = closeOverlay(state)
      if (choice === closed.floorId) return closed
      return rideElevator(closed, choice)
    }
    return closeOverlay(state)
  }
  if (ov?.kind === 'elevator_panel') {
    if (choice === 'stay') return closeOverlay(state)
    if (isKnownFloorId(choice)) return selectElevatorFloor(state, choice)
    return state
  }
  if (ov?.kind === 'confirm') {
    if (ov.prompt === 'send_to_desk') {
      if (choice === 'yes' || choice === 'send') return dismissMember(state, ov.slot)
      return closeOverlay(state)
    }
    if (choice === 'yes' || choice === 'take_five' || choice === 'step_in' || choice === 'ride') {
      if (ov.prompt === 'take_five') return takeFive(closeOverlay(state))
      if (ov.prompt === 'door') return doorStepIn(state)
      if (ov.prompt === 'kessler_door') return kesslerDoorStepIn(state)
    }
    if (ov.prompt === 'door') {
      return { ...closeOverlay(state), player: { x: 11, y: 3, facing: 'e' } }
    }
    if (ov.prompt === 'kessler_door') {
      return { ...closeOverlay(state), player: { ...FLOOR_2_DOOR_STEP_BACK } }
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
    if (choice === 'make_room') return makeRoom(state)
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
  if (node.id === 'dlg_teddy_offer') {
    if (choice === 'extend') {
      return extendOffer({
        ...closed,
        overlay: { kind: 'recruit', coworkerId: 'cw_help_desk_intern' },
      })
    }
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_teddy_offer_declined', line: 0 })
  }
  if (node.id === 'dlg_teddy_offer_full') {
    if (choice === 'make_room') {
      return makeRoom({
        ...closed,
        overlay: { kind: 'recruit', coworkerId: 'cw_help_desk_intern' },
      })
    }
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_teddy_offer_declined', line: 0 })
  }
  if (node.id === 'dlg_kessler_review') {
    return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_director_review' })
  }
  if (node.id === 'dlg_quincy_review') {
    return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_vp_product' })
  }
  if (node.id === 'dlg_ashford_close') {
    return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_vp_sales' })
  }
  if (node.id === 'dlg_caldwell_review') {
    return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_ceo_review' })
  }
  if (node.id === 'dlg_whitlock_request') {
    if (choice === 'take_it' || choice === 'take_it_on') {
      return { ...closed, assignments: { ...closed.assignments, asg_audit: 'accepted' } }
    }
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_whitlock_pass', line: 0 })
  }
  if (node.id === 'dlg_whitlock_challenge') {
    if (choice === 'open_books' || choice === 'open_the_books' || choice === 'begin') {
      return pushOverlay(closed, { kind: 'stakes', encounterId: 'enc_auditor' })
    }
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_whitlock_declined', line: 0 })
  }
  return closed
}

function handleClose(state: OfficeState, rng: Rng): OfficeState {
  if (state.screen === 'vending') return closeVending(state)
  const ov = state.overlay
  if (!ov) return state
  if (ov.kind === 'receipt') {
    const closed = closeOverlay(state)
    return afterReceipt(closed, ov.receiptId, rng)
  }
  if (ov.kind === 'celebration') return closeOverlay(state)
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
    return pushOverlay(state, { kind: 'dialogue', nodeId: beatenDialogue(state), line: 0 })
  }
  if (receiptId === 'rcpt_printer_online') {
    return withKey(
      { ...state, keyItems: { ...state.keyItems } },
      'key_toner',
      -keyCount(state, 'key_toner'),
    )
  }
  if (receiptId === 'rcpt_compliance') {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_teddy_beaten', line: 0 })
  }
  if (receiptId === 'rcpt_the_audit') {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_whitlock_beaten', line: 0 })
  }
  if (receiptId === 'rcpt_operations_review') {
    let next = state
    if (!next.run.pendingPerkOffer) {
      const offer = rollPerkOffer(next.run.perks, rng, BASE_PERK_POOL)
      next = {
        ...next,
        run: { ...next.run, pendingPerkOffer: offer },
        rewardsClaimed: next.rewardsClaimed.includes('rwd_promotion_f2')
          ? next.rewardsClaimed
          : [...next.rewardsClaimed, 'rwd_promotion_f2'],
      }
    }
    return { ...next, screen: 'promotion' }
  }
  if (receiptId === 'rcpt_employee_badge') {
    return withKey(state, 'key_employee_badge', 1)
  }
  if (receiptId === 'rcpt_prioritization') {
    let next = withFlag(state, 'flag_floor3_complete')
    if (keyCount(next, 'key_product_badge') === 0) next = withKey(next, 'key_product_badge', 1)
    return pushOverlay(next, { kind: 'receipt', receiptId: 'rcpt_product_badge' })
  }
  if (receiptId === 'rcpt_product_badge') {
    return offerFloorPromotion(state, 'rwd_promotion_f3', rng)
  }
  if (receiptId === 'rcpt_the_close') {
    let next = withFlag(state, 'flag_floor4_complete')
    if (keyCount(next, 'key_client_badge') === 0) next = withKey(next, 'key_client_badge', 1)
    return pushOverlay(next, { kind: 'receipt', receiptId: 'rcpt_client_badge' })
  }
  if (receiptId === 'rcpt_client_badge') {
    return offerFloorPromotion(state, 'rwd_promotion_f4', rng)
  }
  if (receiptId === 'rcpt_the_review') {
    return pushOverlay(withFlag(state, 'flag_floor5_complete'), {
      kind: 'receipt',
      receiptId: 'rcpt_the_climb',
    })
  }
  if (receiptId === 'rcpt_the_climb') {
    return offerFloorPromotion(state, 'rwd_promotion_f5', rng)
  }
  return state
}

function offerFloorPromotion(
  state: OfficeState,
  rewardId: 'rwd_promotion_f3' | 'rwd_promotion_f4' | 'rwd_promotion_f5',
  rng: Rng,
): OfficeState {
  let next = state
  if (!next.run.pendingPerkOffer) {
    const offer = rollPerkOffer(next.run.perks, rng, BASE_PERK_POOL)
    next = {
      ...next,
      run: { ...next.run, pendingPerkOffer: offer },
      rewardsClaimed: next.rewardsClaimed.includes(rewardId)
        ? next.rewardsClaimed
        : [...next.rewardsClaimed, rewardId],
    }
  }
  return { ...next, screen: 'promotion' }
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
  if (ov.encounterId === 'enc_help_desk_intern') {
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_teddy_declined', line: 0 })
  }
  if (ov.encounterId === 'enc_auditor') {
    return pushOverlay(closed, { kind: 'dialogue', nodeId: 'dlg_whitlock_declined', line: 0 })
  }
  return closed
}

function joinedNode(coworker: CoworkerId): DialogueId {
  if (coworker === 'cw_desk_challenger') return 'dlg_gavin_joined'
  if (coworker === 'cw_meeting_prepper') return 'dlg_priya_joined'
  return 'dlg_teddy_joined'
}

function declinedNode(coworker: CoworkerId): DialogueId {
  if (coworker === 'cw_meeting_prepper') return 'dlg_priya_offer_declined'
  if (coworker === 'cw_help_desk_intern') return 'dlg_teddy_offer_declined'
  return 'dlg_gavin_offer_declined'
}

function extendOffer(state: OfficeState): OfficeState {
  const coworker =
    state.overlay?.kind === 'recruit'
      ? state.overlay.coworkerId
      : state.overlay?.kind === 'dialogue' && state.overlay.nodeId === 'dlg_gavin_offer'
        ? 'cw_desk_challenger'
        : state.overlay?.kind === 'dialogue' && state.overlay.nodeId === 'dlg_priya_offer'
          ? 'cw_meeting_prepper'
          : state.overlay?.kind === 'dialogue' && state.overlay.nodeId === 'dlg_teddy_offer'
            ? 'cw_help_desk_intern'
            : null
  if (!coworker) return state
  const joined = recruitCoworker({ ...state, overlay: null, overlayQueue: [] }, coworker)
  return pushOverlay(joined, { kind: 'dialogue', nodeId: joinedNode(coworker), line: 0 })
}

function declineOffer(state: OfficeState): OfficeState {
  const coworker =
    state.overlay?.kind === 'recruit' ? state.overlay.coworkerId : 'cw_desk_challenger'
  return pushOverlay(closeOverlay(state), {
    kind: 'dialogue',
    nodeId: declinedNode(coworker),
    line: 0,
  })
}

function takeFive(state: OfficeState): OfficeState {
  return enqueueOverlays(restoreParty(closeOverlay(state)), [
    { kind: 'toast', text: "You take five. Everyone's restored. The couch has seen worse." },
  ])
}

function writeVendingStock(state: OfficeState, shopStock: ItemId[]): OfficeState {
  const stock = mergeVendingStock(state.vendingStock, state.run.shopStock)
  return {
    ...state,
    vendingStock: { ...stock, [state.floorId]: [...shopStock] },
    run: { ...state.run, shopStock: [...shopStock] },
  }
}

function closeVending(state: OfficeState): OfficeState {
  const next = writeVendingStock(state, state.run.shopStock ?? [])
  return { ...next, screen: 'overworld' }
}

function buyVending(state: OfficeState, itemId: ItemId): OfficeState {
  const stock = state.run.shopStock ?? []
  const idx = stock.indexOf(itemId)
  if (idx < 0) return state
  const price = shopPrice(ITEMS[itemId].price, state.run.perks, state.run.floor, state.run.relics)
  if (state.run.stockOptions < price || state.run.inventory.length >= 4) return state
  const run = buyShopItem(state.run, idx)
  return writeVendingStock({ ...state, run }, run.shopStock ?? [])
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
  return pushOverlay(next, { kind: 'dialogue', nodeId: beatenDialogue(state), line: 0 })
}

function beatenDialogue(state: OfficeState): DialogueId {
  if (state.encounters.enc_ceo_review === 'won') return 'dlg_caldwell_beaten'
  if (state.encounters.enc_vp_sales === 'won') return 'dlg_ashford_beaten'
  if (state.encounters.enc_vp_product === 'won') return 'dlg_quincy_beaten'
  if (state.encounters.enc_director_review === 'won') return 'dlg_kessler_beaten'
  return 'dlg_holloway_beaten'
}

function selectElevatorFloor(state: OfficeState, to: FloorId): OfficeState {
  if (
    to === 'floor_05' &&
    state.floorId === 'floor_05' &&
    state.flags.includes('flag_floor5_complete')
  ) {
    return pushOverlay(closeOverlay(state), {
      kind: 'celebration',
      screen: 'screen_floor5_complete',
    })
  }
  if (to === state.floorId) return state
  if (!canRideTo(to, state.keyItems)) {
    const deny = elevatorDenyFor(to)
    if (!deny) return state
    const first = !state.flags.includes(deny.flag)
    const flagged = withFlag(state, deny.flag)
    if (!first) return flagged
    return enqueueOverlays({ ...flagged, overlay: null, overlayQueue: [] }, [
      { kind: 'dialogue', nodeId: `inspect:${POI_INSPECT[deny.poiId]}`, line: 0 },
      { kind: 'elevator_panel' },
    ])
  }
  return rideElevator(state, to)
}

function rideElevator(state: OfficeState, to: FloorId): OfficeState {
  if (to === state.floorId) return state
  if (!canRideTo(to, state.keyItems)) return state
  if (state.floorId === 'floor_01' && !canOpenElevatorPanel(state.floorId, state.keyItems)) {
    return state
  }
  const rideKey = `trg_elevator_ride:${state.floorId}->${to}`
  return {
    ...state,
    firedTriggers: state.firedTriggers.includes(rideKey)
      ? state.firedTriggers
      : [...state.firedTriggers, rideKey],
    screen: 'elevator_ride',
    rideTo: to,
    overlay: null,
    overlayQueue: [],
  }
}

function completeElevatorRide(state: OfficeState): OfficeState {
  if (state.screen !== 'elevator_ride') return state
  const from = state.floorId
  const to = state.rideTo
  if (!to || to === from) {
    return { ...state, screen: 'overworld', rideTo: null }
  }
  let next: OfficeState = {
    ...state,
    floorId: to,
    screen: 'overworld',
    player: elevatorArrivalForFloor(to),
    overlay: null,
    overlayQueue: [],
    rideTo: null,
    stats: { ...state.stats, rides: (state.stats.rides ?? 0) + 1 },
  }
  // Arrival counts as a visit so a peek-and-bounce (ride 1→5, ride back
  // without stepping off the shaft) keeps the objective pin on that floor.
  const visit = visitFlagFor(to)
  if (visit) next = withFlag(next, visit)
  const firstPreview =
    from === 'floor_01' && to === 'floor_02' && !state.flags.includes('flag_preview_complete')
  const firstFloor2 = to === 'floor_03' && !state.flags.includes('flag_floor2_complete')
  if (from === 'floor_01') next = withFlag(next, 'flag_preview_complete')
  if (to === 'floor_03' || to === 'floor_04' || to === 'floor_05') {
    next = withFlag(next, 'flag_floor2_complete')
  }
  if (firstPreview) {
    return pushOverlay(next, { kind: 'celebration', screen: 'screen_preview_complete' })
  }
  if (firstFloor2) {
    return pushOverlay(next, { kind: 'celebration', screen: 'screen_floor2_complete' })
  }
  // Zone chip on the landing covers arrival — no stacked toast (floor-2 §8.2).
  return next
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

function kesslerDoorStepIn(state: OfficeState): OfficeState {
  if (state.party.every((m) => m.hp <= 0)) {
    return pushOverlay(closeOverlay(state), { kind: 'confirm', prompt: 'take_five' })
  }
  return pushOverlay(
    { ...closeOverlay(state), player: { ...FLOOR_2_DOOR_STEP_IN } },
    { kind: 'dialogue', nodeId: 'dlg_kessler_review', line: 0 },
  )
}

function teddyOfferFollowup(state: OfficeState): OfficeState {
  if (
    inParty(state, 'cw_help_desk_intern') ||
    (state.hired ?? []).includes('cw_help_desk_intern')
  ) {
    return state
  }
  if (lettersHeld(state) <= 0) return state
  if (partyHasRoom(state)) {
    return pushOverlay(state, { kind: 'dialogue', nodeId: 'dlg_teddy_offer', line: 0 })
  }
  let next = state
  if (!next.flags.includes('flag_roster_coached')) {
    next = withFlag(pushOverlay(next, { kind: 'coach', id: 'coach_roster' }), 'flag_roster_coached')
  }
  return pushOverlay(next, { kind: 'dialogue', nodeId: 'dlg_teddy_offer_full', line: 0 })
}

function makeRoom(state: OfficeState): OfficeState {
  const coworker =
    state.overlay?.kind === 'recruit'
      ? state.overlay.coworkerId
      : state.overlay?.kind === 'dialogue' && state.overlay.nodeId.startsWith('dlg_teddy_offer')
        ? 'cw_help_desk_intern'
        : null
  if (!coworker) return state
  let next: OfficeState = { ...state, overlay: null, overlayQueue: [] }
  if (!next.flags.includes('flag_roster_coached')) {
    next = withFlag(
      enqueueOverlays(next, [{ kind: 'coach', id: 'coach_roster' }]),
      'flag_roster_coached',
    )
  }
  return pushOverlay(next, { kind: 'team', mode: 'roster', returnRecruit: coworker })
}

function closeTeam(state: OfficeState): OfficeState {
  if (state.overlay?.kind !== 'team') return state
  const recruit = state.overlay.returnRecruit
  const closed = closeOverlay(state)
  if (recruit) return pushOverlay(closed, { kind: 'recruit', coworkerId: recruit })
  return closed
}

function deskToast(id: CoworkerId): string {
  const desk = COWORKER_DESK[id]
  return `${COWORKER_NAME[id]}'s at ${desk.pronoun} desk. Floor ${floorNumber(desk.floorId)}.`
}

function teamOverlay(state: OfficeState): Extract<Overlay, { kind: 'team' }> | null {
  if (state.overlay?.kind === 'team') return state.overlay
  return (
    state.overlayQueue.find((ov): ov is Extract<Overlay, { kind: 'team' }> => ov.kind === 'team') ??
    null
  )
}

function requestDismiss(state: OfficeState, slot: number): OfficeState {
  const member = state.party[slot]
  if (!member || member.def.kind !== 'coworker') return state
  if (state.overlay?.kind !== 'team') return state
  return {
    ...state,
    overlay: { kind: 'confirm', prompt: 'send_to_desk', slot },
    overlayQueue: [state.overlay, ...state.overlayQueue],
  }
}

function dismissMember(state: OfficeState, slot: number): OfficeState {
  const member = state.party[slot]
  if (!member || member.def.kind !== 'coworker') return state
  const id = member.def.id
  const next = dismissCoworker(state, slot)
  const toast = { kind: 'toast' as const, text: deskToast(id) }
  const team = teamOverlay(state)
  if (team?.returnRecruit) {
    return enqueueOverlays({ ...next, overlay: null, overlayQueue: [] }, [
      toast,
      { kind: 'recruit', coworkerId: team.returnRecruit },
    ])
  }
  if (team) {
    return enqueueOverlays({ ...next, overlay: null, overlayQueue: [] }, [
      toast,
      { kind: 'team', mode: team.mode },
    ])
  }
  return enqueueOverlays({ ...next, overlay: null, overlayQueue: next.overlayQueue }, [toast])
}

function finishRejoin(state: OfficeState, id: CoworkerId): OfficeState {
  return rejoinCoworker(closeOverlay(state), id)
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
