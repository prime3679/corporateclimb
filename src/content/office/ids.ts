// Frozen Floor 1 ids remain unchanged; Floor 2 adds stub-only ids.

export const PARTY_MAX = 3
export const MAP_WIDTH = 24
export const MAP_HEIGHT = 18
export const TILE_SIZE = 32
export const VIEWPORT_TILES_X = 14
export const MOVE_MS = 250

export type Facing = 'n' | 'e' | 's' | 'w'

export type FloorId = 'floor_01' | 'floor_02'
export type ZoneId =
  | 'zone_reception'
  | 'zone_desks'
  | 'zone_break'
  | 'zone_meeting'
  | 'zone_elevator'
  | 'zone_hall'

export type NpcId =
  | 'npc_receptionist'
  | 'npc_desk_challenger'
  | 'npc_meeting_prepper'
  | 'npc_supervisor'
  | 'npc_floor2_contractor'

export type EncounterId = 'enc_desk_challenger' | 'enc_meeting_prepper' | 'enc_supervisor_1on1'

export type PartySlot = 'party_slot_0' | 'party_slot_1' | 'party_slot_2'

export type CoworkerId = 'cw_desk_challenger' | 'cw_meeting_prepper'

export type AssignmentId = 'asg_printer' | 'asg_meeting_prep'

export type PrinterStage = 'not_started' | 'accepted' | 'toner_collected' | 'installed' | 'complete'

export type MeetingStage = 'not_started' | 'accepted' | 'handout_held' | 'complete'

export type EncounterStage = 'open' | 'won'

export type KeyItemId =
  | 'key_toner'
  | 'key_offer_letter'
  | 'key_handout_q3_summary'
  | 'key_handout_q3_deck'
  | 'key_handout_q2_summary'
  | 'key_access_badge'

export type PoiId =
  | 'poi_reception_desk'
  | 'poi_directory_sign'
  | 'poi_exit_door'
  | 'poi_water_cooler'
  | 'poi_printer'
  | 'poi_supply_cabinet'
  | 'poi_break_counter'
  | 'poi_vending_machine'
  | 'poi_break_table'
  | 'poi_agenda'
  | 'poi_handout_rack'
  | 'poi_elevator_door'
  | 'poi_supervisor_door'

export type TriggerId =
  | 'trg_first_step'
  | 'trg_sight_desk_challenger'
  | 'trg_sight_meeting_prepper'
  | 'trg_sight_supervisor'
  | 'trg_supervisor_door'
  | 'trg_elevator_ride'
  | 'trg_switch_coach'

export type RewardId =
  | 'rwd_start_options'
  | 'rwd_asg_printer'
  | 'rwd_asg_meeting_prep'
  | 'rwd_enc_desk_challenger'
  | 'rwd_enc_meeting_prepper'
  | 'rwd_enc_supervisor_1on1'
  | 'rwd_promotion_f1'

export type ReceiptId =
  | 'rcpt_signing_bonus'
  | 'rcpt_printer_online'
  | 'rcpt_ticket_closed'
  | 'rcpt_desk_argument'
  | 'rcpt_meeting_prepped'
  | 'rcpt_premeeting_spar'
  | 'rcpt_one_on_one'
  | 'rcpt_promotion_signing_bonus'

export type FlagId =
  | 'flag_greeted'
  | 'flag_badge_reader_denied'
  | 'flag_switch_coached'
  | 'flag_move_coached'
  | 'flag_interact_coached'
  | 'flag_preview_complete'
  | 'flag_renata_recruit_hint'
  | 'flag_floor2_briefed'

export type CoachId = 'coach_move' | 'coach_interact' | 'coach_switch'

export type DialogueId =
  | 'dlg_renata_callout'
  | 'dlg_renata_ticket'
  | 'dlg_renata_hint_toner'
  | 'dlg_renata_hint_install'
  | 'dlg_renata_close_ticket'
  | 'dlg_renata_gavin_pending'
  | 'dlg_renata_holloway'
  | 'dlg_renata_recruit_me'
  | 'dlg_renata_badged'
  | 'dlg_renata_after'
  | 'dlg_gavin_busy'
  | 'dlg_gavin_no_pressure'
  | 'dlg_gavin_callout'
  | 'dlg_gavin_challenge'
  | 'dlg_gavin_declined'
  | 'dlg_gavin_you_lost'
  | 'dlg_gavin_beaten'
  | 'dlg_gavin_offer'
  | 'dlg_gavin_offer_declined'
  | 'dlg_gavin_joined'
  | 'dlg_gavin_party'
  | 'dlg_gavin_after'
  | 'dlg_gavin_after_win'
  | 'dlg_priya_hook'
  | 'dlg_priya_request'
  | 'dlg_priya_pass'
  | 'dlg_priya_waiting'
  | 'dlg_priya_wrong_deck'
  | 'dlg_priya_wrong_q2'
  | 'dlg_priya_delivered'
  | 'dlg_priya_spar'
  | 'dlg_priya_raincheck'
  | 'dlg_priya_you_lost'
  | 'dlg_priya_beaten'
  | 'dlg_priya_offer'
  | 'dlg_priya_offer_declined'
  | 'dlg_priya_offer_full'
  | 'dlg_priya_joined'
  | 'dlg_priya_party'
  | 'dlg_priya_after'
  | 'dlg_holloway_early'
  | 'dlg_holloway_gavin_pending'
  | 'dlg_holloway_1on1'
  | 'dlg_holloway_you_lost'
  | 'dlg_holloway_beaten'
  | 'dlg_holloway_after'
  | 'dlg_callie_floor2_intro'
  | 'dlg_callie_floor2_repeat'
