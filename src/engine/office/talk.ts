import type { DialogueId, EncounterId, NpcId } from '@/content/office'
import {
  hasFlag,
  heldHandout,
  inParty,
  isHired,
  keyCount,
  lettersHeld,
  partyHasRoom,
  type OfficeState,
} from './state'

export function resolveNpcTalk(state: OfficeState, npc: NpcId): DialogueId {
  if (npc === 'npc_help_desk_intern') return resolveTeddy(state)
  if (npc === 'npc_auditor') return resolveWhitlock(state)
  if (npc === 'npc_director') return resolveKessler(state)
  if (npc === 'npc_receptionist') return resolveRenata(state)
  if (npc === 'npc_desk_challenger') return resolveGavin(state)
  if (npc === 'npc_meeting_prepper') return resolvePriya(state)
  if (npc === 'npc_staff_pm') return resolveSloane(state)
  if (npc === 'npc_researcher') return resolveNico(state)
  if (npc === 'npc_vp_product') return resolveQuincy(state)
  if (npc === 'npc_account_exec') return resolveHarper(state)
  if (npc === 'npc_client_success') return resolveReyes(state)
  if (npc === 'npc_vp_sales') return resolveAshford(state)
  if (npc === 'npc_exec_assistant') return resolveMarlowe(state)
  if (npc === 'npc_ceo') return resolveCaldwell(state)
  return resolveHolloway(state)
}

/* Floors 3–5 (docs/rpg/floor-3-5-design.md). First-state lines so a debug
   floorId can talk; assignment reducers are Astra's. */

export function resolveSloane(state: OfficeState): DialogueId {
  const asg = state.assignments.asg_roadmap
  if (asg === 'not_started') return 'dlg_sloane_brief'
  if (asg === 'accepted') return 'dlg_sloane_hint_card'
  if (asg === 'card_held') return 'dlg_sloane_hint_nico'
  if (asg === 'initialled') return 'dlg_sloane_filed'
  if (state.encounters.enc_vp_product === 'won') return 'dlg_sloane_after_win'
  return 'dlg_sloane_after'
}

export function resolveNico(state: OfficeState): DialogueId {
  const asg = state.assignments.asg_roadmap
  if (asg === 'card_held') return 'dlg_nico_waiting'
  if (asg === 'initialled' || asg === 'complete') return 'dlg_nico_after'
  return 'dlg_nico_hook'
}

export function resolveQuincy(state: OfficeState): DialogueId {
  if (state.encounters.enc_vp_product === 'won') return 'dlg_quincy_after'
  if (state.lastLossEncounter === 'enc_vp_product') return 'dlg_quincy_you_lost'
  if (state.assignments.asg_roadmap === 'complete') return 'dlg_quincy_review'
  if (state.assignments.asg_roadmap === 'initialled') return 'dlg_quincy_sloane_pending'
  return 'dlg_quincy_early'
}

export function resolveHarper(state: OfficeState): DialogueId {
  const asg = state.assignments.asg_leavebehind
  if (asg === 'not_started') return 'dlg_harper_brief'
  if (asg === 'accepted') return 'dlg_harper_hint_deck'
  if (asg === 'deck_held') return 'dlg_harper_hint_reyes'
  if (asg === 'delivered') return 'dlg_harper_filed'
  if (state.encounters.enc_vp_sales === 'won') return 'dlg_harper_after_win'
  return 'dlg_harper_after'
}

export function resolveReyes(state: OfficeState): DialogueId {
  const asg = state.assignments.asg_leavebehind
  if (asg === 'deck_held') return 'dlg_reyes_waiting'
  if (asg === 'delivered' || asg === 'complete') return 'dlg_reyes_after'
  return 'dlg_reyes_hook'
}

export function resolveAshford(state: OfficeState): DialogueId {
  if (state.encounters.enc_vp_sales === 'won') return 'dlg_ashford_after'
  if (state.lastLossEncounter === 'enc_vp_sales') return 'dlg_ashford_you_lost'
  if (state.assignments.asg_leavebehind === 'complete') return 'dlg_ashford_close'
  if (state.assignments.asg_leavebehind === 'delivered') return 'dlg_ashford_harper_pending'
  return 'dlg_ashford_early'
}

export function resolveMarlowe(state: OfficeState): DialogueId {
  const asg = state.assignments.asg_board_packet
  if (asg === 'not_started') return 'dlg_marlowe_brief'
  if (asg === 'accepted') return 'dlg_marlowe_hint_packet'
  if (asg === 'packet_held') return 'dlg_marlowe_filed'
  if (state.encounters.enc_ceo_review === 'won') return 'dlg_marlowe_after_win'
  return 'dlg_marlowe_after'
}

export function resolveCaldwell(state: OfficeState): DialogueId {
  if (state.encounters.enc_ceo_review === 'won') return 'dlg_caldwell_after'
  if (state.lastLossEncounter === 'enc_ceo_review') return 'dlg_caldwell_you_lost'
  if (state.assignments.asg_board_packet === 'complete') return 'dlg_caldwell_review'
  if (state.assignments.asg_board_packet === 'packet_held') return 'dlg_caldwell_packet_pending'
  return 'dlg_caldwell_early'
}

export function resolveTeddy(state: OfficeState): DialogueId {
  const transfer = state.assignments.asg_transfer
  const won = state.encounters.enc_help_desk_intern === 'won'
  const recruited = inParty(state, 'cw_help_desk_intern')
  const hired = isHired(state, 'cw_help_desk_intern')
  if (transfer === 'not_started') return 'dlg_teddy_packet'
  if (transfer === 'accepted') return 'dlg_teddy_hint_photo'
  if (transfer === 'photo_taken') return 'dlg_teddy_hint_signature'
  if (transfer === 'signed') return 'dlg_teddy_hint_file'
  if (!won) {
    if (state.lastLossEncounter === 'enc_help_desk_intern') return 'dlg_teddy_you_lost'
    return 'dlg_teddy_filed'
  }
  if (hasFlag(state, 'flag_floor2_complete')) return 'dlg_teddy_after_win'
  if (keyCount(state, 'key_employee_badge') > 0) return 'dlg_teddy_after'
  if (state.encounters.enc_director_review === 'won') return 'dlg_teddy_badge_pending'
  if (recruited) return 'dlg_teddy_party'
  if (hired && partyHasRoom(state)) return 'dlg_teddy_rejoin'
  if (hired) return 'dlg_teddy_rejoin_full'
  if (lettersHeld(state) > 0 && partyHasRoom(state)) return 'dlg_teddy_offer'
  if (lettersHeld(state) > 0) return 'dlg_teddy_offer_full'
  return 'dlg_teddy_no_letter'
}

export function resolveWhitlock(state: OfficeState): DialogueId {
  const audit = state.assignments.asg_audit
  const won = state.encounters.enc_auditor === 'won'
  if (won) return 'dlg_whitlock_after'
  if (audit === 'complete') {
    if (state.lastLossEncounter === 'enc_auditor') return 'dlg_whitlock_you_lost'
    return 'dlg_whitlock_challenge'
  }
  if (audit === 'receipts_held') return 'dlg_whitlock_delivered'
  if (audit === 'accepted') return 'dlg_whitlock_waiting'
  return 'dlg_whitlock_request'
}

export function resolveKessler(state: OfficeState): DialogueId {
  if (state.encounters.enc_director_review === 'won') return 'dlg_kessler_after'
  if (state.lastLossEncounter === 'enc_director_review') return 'dlg_kessler_you_lost'
  if (state.assignments.asg_transfer !== 'complete') return 'dlg_kessler_early'
  if (state.encounters.enc_help_desk_intern !== 'won') return 'dlg_kessler_teddy_pending'
  return 'dlg_kessler_review'
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
  if (state.assignments.asg_transfer === 'photo_taken') return 'dlg_renata_transfer'
  if (keyCount(state, 'key_employee_badge') > 0) return 'dlg_renata_f2_after'
  if (hasFlag(state, 'flag_visited_f2')) return 'dlg_renata_upstairs'
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
  const hired = isHired(state, 'cw_desk_challenger')
  if (hasFlag(state, 'flag_floor2_complete')) return 'dlg_gavin_f2_after'
  if (hired && !recruited && partyHasRoom(state)) return 'dlg_gavin_rejoin'
  if (hired && !recruited) return 'dlg_gavin_rejoin_full'
  if (won && recruited && state.encounters.enc_supervisor_1on1 === 'won')
    return 'dlg_gavin_after_win'
  if (won && recruited && hasFlag(state, 'flag_visited_f2')) return 'dlg_gavin_upstairs'
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
  const hired = isHired(state, 'cw_meeting_prepper')
  const asg = state.assignments.asg_meeting_prep
  if (hired && !recruited && partyHasRoom(state)) return 'dlg_priya_rejoin'
  if (hired && !recruited) return 'dlg_priya_rejoin_full'
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
  if (hasFlag(state, 'flag_visited_f2')) return 'dlg_priya_upstairs'
  return 'dlg_priya_request'
}

export function resolveHolloway(state: OfficeState): DialogueId {
  if (state.assignments.asg_transfer === 'photo_taken') return 'dlg_holloway_sign_transfer'
  if (keyCount(state, 'key_employee_badge') > 0) return 'dlg_holloway_f2_after'
  if (state.assignments.asg_transfer === 'signed' || state.assignments.asg_transfer === 'filed')
    return 'dlg_holloway_upstairs'
  if (state.encounters.enc_supervisor_1on1 === 'won') return 'dlg_holloway_after'
  if (state.assignments.asg_printer !== 'complete') return 'dlg_holloway_early'
  if (state.encounters.enc_desk_challenger !== 'won') return 'dlg_holloway_gavin_pending'
  return 'dlg_holloway_1on1'
}

export function lossDialogue(encounterId: EncounterId): DialogueId {
  if (encounterId === 'enc_desk_challenger') return 'dlg_gavin_you_lost'
  if (encounterId === 'enc_meeting_prepper') return 'dlg_priya_you_lost'
  if (encounterId === 'enc_help_desk_intern') return 'dlg_teddy_you_lost'
  if (encounterId === 'enc_auditor') return 'dlg_whitlock_you_lost'
  if (encounterId === 'enc_director_review') return 'dlg_kessler_you_lost'
  if (encounterId === 'enc_vp_product') return 'dlg_quincy_you_lost'
  if (encounterId === 'enc_vp_sales') return 'dlg_ashford_you_lost'
  if (encounterId === 'enc_ceo_review') return 'dlg_caldwell_you_lost'
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
  if (npc === 'npc_help_desk_intern') {
    if (state.assignments.asg_transfer !== 'filed') return null
    if (state.encounters.enc_help_desk_intern !== 'open') return null
    return 'dlg_teddy_filed'
  }
  if (npc === 'npc_auditor') {
    if (state.assignments.asg_audit !== 'not_started') return null
    return 'dlg_whitlock_hook'
  }
  if (npc === 'npc_director') {
    if (state.encounters.enc_director_review === 'won') return null
    return resolveKessler(state)
  }
  if (npc === 'npc_staff_pm') {
    if (state.assignments.asg_roadmap !== 'not_started') return null
    return 'dlg_sloane_callout'
  }
  if (npc === 'npc_researcher') {
    if (state.assignments.asg_roadmap !== 'accepted' && state.assignments.asg_roadmap !== 'card_held')
      return null
    return 'dlg_nico_hook'
  }
  if (npc === 'npc_vp_product') {
    if (state.encounters.enc_vp_product === 'won') return null
    return resolveQuincy(state)
  }
  if (npc === 'npc_account_exec') {
    if (state.assignments.asg_leavebehind !== 'not_started') return null
    return 'dlg_harper_callout'
  }
  if (npc === 'npc_client_success') {
    if (
      state.assignments.asg_leavebehind !== 'accepted' &&
      state.assignments.asg_leavebehind !== 'deck_held'
    )
      return null
    return 'dlg_reyes_hook'
  }
  if (npc === 'npc_vp_sales') {
    if (state.encounters.enc_vp_sales === 'won') return null
    return resolveAshford(state)
  }
  if (npc === 'npc_exec_assistant') {
    if (state.assignments.asg_board_packet !== 'not_started') return null
    return 'dlg_marlowe_callout'
  }
  if (npc === 'npc_ceo') {
    if (state.encounters.enc_ceo_review === 'won') return null
    return resolveCaldwell(state)
  }
  return null
}
