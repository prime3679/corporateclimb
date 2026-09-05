import type { DialogueId, EncounterId, NpcId } from '@/content/office'
import { hasFlag, heldHandout, inParty, lettersHeld, partyHasRoom, type OfficeState } from './state'

export function resolveNpcTalk(state: OfficeState, npc: NpcId): DialogueId {
  if (npc === 'npc_floor2_contractor') return resolveCallie(state)
  if (npc === 'npc_receptionist') return resolveRenata(state)
  if (npc === 'npc_desk_challenger') return resolveGavin(state)
  if (npc === 'npc_meeting_prepper') return resolvePriya(state)
  return resolveHolloway(state)
}

function resolveCallie(state: OfficeState): DialogueId {
  return hasFlag(state, 'flag_floor2_briefed')
    ? 'dlg_callie_floor2_repeat'
    : 'dlg_callie_floor2_intro'
}

function resolveRenata(state: OfficeState): DialogueId {
  const idle: DialogueId[] = [
    'dlg_renata_gavin_pending',
    'dlg_renata_holloway',
    'dlg_renata_badged',
    'dlg_renata_after',
  ]
  if (lettersHeld(state) > 0 && hasFlag(state, 'flag_renata_recruit_hint')) {
    const next = resolveRenataProgress(state)
    if (idle.includes(next)) return 'dlg_renata_recruit_me'
  }
  return resolveRenataProgress(state)
}

function resolveRenataProgress(state: OfficeState): DialogueId {
  if (hasFlag(state, 'flag_preview_complete')) return 'dlg_renata_after'
  if ((state.keyItems.key_access_badge ?? 0) > 0) return 'dlg_renata_badged'
  const printer = state.assignments.asg_printer
  if (printer === 'not_started') return 'dlg_renata_ticket'
  if (printer === 'accepted') return 'dlg_renata_hint_toner'
  if (printer === 'toner_collected') return 'dlg_renata_hint_install'
  if (printer === 'installed') return 'dlg_renata_close_ticket'
  if (state.encounters.enc_desk_challenger === 'open') return 'dlg_renata_gavin_pending'
  if (state.encounters.enc_supervisor_1on1 === 'open') return 'dlg_renata_holloway'
  return 'dlg_renata_after'
}

function resolveGavin(state: OfficeState): DialogueId {
  const won = state.encounters.enc_desk_challenger === 'won'
  const recruited = inParty(state, 'cw_desk_challenger')
  if (won && recruited && state.encounters.enc_supervisor_1on1 === 'won')
    return 'dlg_gavin_after_win'
  if (won && recruited) return 'dlg_gavin_party'
  if (won && lettersHeld(state) > 0 && !recruited) return 'dlg_gavin_offer'
  if (won) return 'dlg_gavin_after'
  if (state.lastLossEncounter === 'enc_desk_challenger') return 'dlg_gavin_you_lost'
  const printer = state.assignments.asg_printer
  if (printer === 'not_started') return 'dlg_gavin_busy'
  if (printer === 'accepted' || printer === 'toner_collected' || printer === 'installed') {
    return 'dlg_gavin_no_pressure'
  }
  return 'dlg_gavin_challenge'
}

function resolvePriya(state: OfficeState): DialogueId {
  const won = state.encounters.enc_meeting_prepper === 'won'
  const recruited = inParty(state, 'cw_meeting_prepper')
  const asg = state.assignments.asg_meeting_prep
  if (won && recruited) return 'dlg_priya_party'
  if (won && lettersHeld(state) > 0 && !recruited && !partyHasRoom(state))
    return 'dlg_priya_offer_full'
  if (won && lettersHeld(state) > 0 && !recruited) return 'dlg_priya_offer'
  if (won) return 'dlg_priya_after'
  if (asg === 'complete' && state.lastLossEncounter === 'enc_meeting_prepper')
    return 'dlg_priya_you_lost'
  if (asg === 'complete') return 'dlg_priya_spar'
  if (asg === 'handout_held') {
    const held = heldHandout(state)
    if (held === 'key_handout_q3_summary') return 'dlg_priya_delivered'
    if (held === 'key_handout_q3_deck') return 'dlg_priya_wrong_deck'
    if (held === 'key_handout_q2_summary') return 'dlg_priya_wrong_q2'
  }
  if (asg === 'accepted') return 'dlg_priya_waiting'
  return 'dlg_priya_request'
}

export function resolveHolloway(state: OfficeState): DialogueId {
  if (state.encounters.enc_supervisor_1on1 === 'won') return 'dlg_holloway_after'
  if (state.assignments.asg_printer !== 'complete') return 'dlg_holloway_early'
  if (state.encounters.enc_desk_challenger !== 'won') return 'dlg_holloway_gavin_pending'
  return 'dlg_holloway_1on1'
}

export function lossDialogue(encounterId: EncounterId): DialogueId {
  if (encounterId === 'enc_desk_challenger') return 'dlg_gavin_you_lost'
  if (encounterId === 'enc_meeting_prepper') return 'dlg_priya_you_lost'
  return 'dlg_holloway_you_lost'
}

export function sightDialogue(state: OfficeState, npc: NpcId): DialogueId | null {
  if (npc === 'npc_desk_challenger') {
    if (state.assignments.asg_printer !== 'complete') return null
    if (state.encounters.enc_desk_challenger !== 'open') return null
    return 'dlg_gavin_callout'
  }
  if (npc === 'npc_meeting_prepper') {
    if (state.assignments.asg_meeting_prep !== 'not_started') return null
    return 'dlg_priya_hook'
  }
  if (npc === 'npc_supervisor') {
    if (state.encounters.enc_supervisor_1on1 === 'won') return null
    return resolveHolloway(state)
  }
  return null
}
