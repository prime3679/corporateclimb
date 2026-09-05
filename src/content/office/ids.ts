// Frozen office ids. Floor 1 names match docs/rpg/mvp-design.md §15 and never move;
// Floor 2 names match docs/rpg/floor-2-design.md §12.

export const PARTY_MAX = 3
export const MAP_WIDTH = 24
export const MAP_HEIGHT = 18
export const TILE_SIZE = 32
export const VIEWPORT_TILES_X = 14
export const MOVE_MS = 250

export type Facing = 'n' | 'e' | 's' | 'w'

export type FloorId = 'floor_01' | 'floor_02' | 'floor_03' | 'floor_04' | 'floor_05'

export const FLOOR_IDS: readonly FloorId[] = [
  'floor_01',
  'floor_02',
  'floor_03',
  'floor_04',
  'floor_05',
]

export function isStubFloor(floorId: FloorId): boolean {
  return floorId === 'floor_03' || floorId === 'floor_04' || floorId === 'floor_05'
}
export type ZoneId =
  | 'zone_reception'
  | 'zone_desks'
  | 'zone_break'
  | 'zone_meeting'
  | 'zone_elevator'
  | 'zone_hall'
  // Floor 2
  | 'zone_landing'
  | 'zone_it'
  | 'zone_people'
  | 'zone_hall_f2'
  | 'zone_director'
  | 'zone_facilities'
  | 'zone_finance'

export type NpcId =
  | 'npc_receptionist'
  | 'npc_desk_challenger'
  | 'npc_meeting_prepper'
  | 'npc_supervisor'
  // Floor 2
  | 'npc_help_desk_intern'
  | 'npc_auditor'
  | 'npc_director'

export type EncounterId =
  | 'enc_desk_challenger'
  | 'enc_meeting_prepper'
  | 'enc_supervisor_1on1'
  // Floor 2
  | 'enc_help_desk_intern'
  | 'enc_auditor'
  | 'enc_director_review'

export type PartySlot = 'party_slot_0' | 'party_slot_1' | 'party_slot_2'

export type CoworkerId = 'cw_desk_challenger' | 'cw_meeting_prepper' | 'cw_help_desk_intern'

export type AssignmentId = 'asg_printer' | 'asg_meeting_prep' | 'asg_transfer' | 'asg_audit'

export type PrinterStage = 'not_started' | 'accepted' | 'toner_collected' | 'installed' | 'complete'

export type MeetingStage = 'not_started' | 'accepted' | 'handout_held' | 'complete'

export type TransferStage =
  | 'not_started'
  | 'accepted'
  | 'photo_taken'
  | 'signed'
  | 'filed'
  | 'complete'

export type AuditStage = 'not_started' | 'accepted' | 'receipts_held' | 'complete'

export type EncounterStage = 'open' | 'won'

export type KeyItemId =
  | 'key_toner'
  | 'key_offer_letter'
  | 'key_handout_q3_summary'
  | 'key_handout_q3_deck'
  | 'key_handout_q2_summary'
  | 'key_access_badge'
  // Floor 2
  | 'key_badge_photo'
  | 'key_transfer_form'
  | 'key_receipt_roll'
  | 'key_employee_badge'

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
  // Floor 2
  | 'poi_elevator_door_f2'
  | 'poi_directory_sign_f2'
  | 'poi_photo_booth'
  | 'poi_badge_printer'
  | 'poi_server_rack'
  | 'poi_help_desk'
  | 'poi_people_tray'
  | 'poi_filing_cabinets'
  | 'poi_water_cooler_f2'
  | 'poi_director_door'
  | 'poi_director_desk'
  | 'poi_supply_cabinet_f2'
  | 'poi_break_counter_f2'
  | 'poi_vending_machine_f2'
  | 'poi_break_table_f2'
  | 'poi_lockers'
  | 'poi_janitor_cart'
  | 'poi_safe'
  | 'poi_shredder'
  // Floors 3–5 stubs (Fable replaces copy)
  | 'poi_directory_sign_stub'

export type TriggerId =
  | 'trg_first_step'
  | 'trg_sight_desk_challenger'
  | 'trg_sight_meeting_prepper'
  | 'trg_sight_supervisor'
  | 'trg_supervisor_door'
  | 'trg_elevator_ride'
  | 'trg_switch_coach'
  // Floor 2
  | 'trg_first_step_f2'
  | 'trg_sight_help_desk_intern'
  | 'trg_sight_auditor'
  | 'trg_sight_director'
  | 'trg_director_door'
  | 'trg_elevator_ride_f2'
  | 'trg_roster_coach'

export type RewardId =
  | 'rwd_start_options'
  | 'rwd_asg_printer'
  | 'rwd_asg_meeting_prep'
  | 'rwd_enc_desk_challenger'
  | 'rwd_enc_meeting_prepper'
  | 'rwd_enc_supervisor_1on1'
  | 'rwd_promotion_f1'
  // Floor 2
  | 'rwd_asg_transfer'
  | 'rwd_enc_help_desk_intern'
  | 'rwd_asg_audit'
  | 'rwd_enc_auditor'
  | 'rwd_enc_director_review'
  | 'rwd_promotion_f2'

export type ReceiptId =
  | 'rcpt_signing_bonus'
  | 'rcpt_printer_online'
  | 'rcpt_ticket_closed'
  | 'rcpt_desk_argument'
  | 'rcpt_meeting_prepped'
  | 'rcpt_premeeting_spar'
  | 'rcpt_one_on_one'
  | 'rcpt_promotion_signing_bonus'
  // Floor 2
  | 'rcpt_transfer_filed'
  | 'rcpt_compliance'
  | 'rcpt_audit_reconciled'
  | 'rcpt_the_audit'
  | 'rcpt_operations_review'
  | 'rcpt_employee_badge'

export type FlagId =
  | 'flag_greeted'
  | 'flag_badge_reader_denied'
  | 'flag_switch_coached'
  | 'flag_move_coached'
  | 'flag_interact_coached'
  | 'flag_preview_complete'
  | 'flag_renata_recruit_hint'
  // Floor 2
  | 'flag_visited_f2'
  | 'flag_floor2_complete'
  | 'flag_roster_coached'
  | 'flag_reader_denied_f2'

export type CoachId = 'coach_move' | 'coach_interact' | 'coach_switch' | 'coach_roster'

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
  // Floor 2 — Teddy
  | 'dlg_teddy_callout'
  | 'dlg_teddy_packet'
  | 'dlg_teddy_hint_photo'
  | 'dlg_teddy_hint_signature'
  | 'dlg_teddy_hint_file'
  | 'dlg_teddy_filed'
  | 'dlg_teddy_declined'
  | 'dlg_teddy_you_lost'
  | 'dlg_teddy_beaten'
  | 'dlg_teddy_offer'
  | 'dlg_teddy_offer_full'
  | 'dlg_teddy_offer_declined'
  | 'dlg_teddy_joined'
  | 'dlg_teddy_rejoin'
  | 'dlg_teddy_rejoin_full'
  | 'dlg_teddy_party'
  | 'dlg_teddy_no_letter'
  | 'dlg_teddy_badge_pending'
  | 'dlg_teddy_after'
  | 'dlg_teddy_after_win'
  // Floor 2 — Whitlock
  | 'dlg_whitlock_hook'
  | 'dlg_whitlock_request'
  | 'dlg_whitlock_pass'
  | 'dlg_whitlock_waiting'
  | 'dlg_whitlock_delivered'
  | 'dlg_whitlock_challenge'
  | 'dlg_whitlock_declined'
  | 'dlg_whitlock_you_lost'
  | 'dlg_whitlock_beaten'
  | 'dlg_whitlock_recruit'
  | 'dlg_whitlock_after'
  // Floor 2 — Kessler
  | 'dlg_kessler_early'
  | 'dlg_kessler_teddy_pending'
  | 'dlg_kessler_review'
  | 'dlg_kessler_you_lost'
  | 'dlg_kessler_beaten'
  | 'dlg_kessler_after'
  // Floor 1 cast, after Floor 2 exists
  | 'dlg_renata_transfer'
  | 'dlg_renata_audit'
  | 'dlg_renata_upstairs'
  | 'dlg_renata_f2_after'
  | 'dlg_gavin_upstairs'
  | 'dlg_gavin_rejoin'
  | 'dlg_gavin_rejoin_full'
  | 'dlg_gavin_f2_after'
  | 'dlg_priya_upstairs'
  | 'dlg_priya_rejoin'
  | 'dlg_priya_rejoin_full'
  | 'dlg_holloway_sign_transfer'
  | 'dlg_holloway_upstairs'
  | 'dlg_holloway_f2_after'
