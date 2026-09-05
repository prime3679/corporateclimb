import type { PoiId } from './ids'

export const POI_INSPECT: Record<PoiId, string> = {
  poi_reception_desk: 'The bell has a sign: RING ONCE. Someone crossed out ONCE.',
  poi_directory_sign: 'FLOOR 1 — Desks: left. Break room: up the hall, right.',
  poi_exit_door: 'You just got here. Leaving now would be a statement.',
  poi_water_cooler: 'No gossip today. The VPs are upstairs, being VPs.',
  poi_printer: 'The printer shows an error in a font designed to calm you. It does not.',
  poi_supply_cabinet: 'Grey cabinet. Unlabeled. Full of things nobody ordered.',
  poi_break_counter: 'Restores HP and PP for the whole team. Free. Always.',
  poi_vending_machine: 'Accepts Stock Options. Nobody asked how.',
  poi_break_table:
    'Someone left a cake. The icing says SORRY FOR YOUR LOSS. It was forty percent off.',
  poi_agenda: 'A meeting agenda. You have no meeting. You read it anyway.',
  poi_handout_rack: 'Three stacks of paper. None of them are yours yet.',
  poi_elevator_door: "The reader blinks red. It's not personal. It's policy.",
  poi_supervisor_door: "Holloway's one-on-one starts when you step in. It doesn't stop.",
}

export const PRINTER_COPY = {
  not_started: 'The printer shows an error in a font designed to calm you. It does not.',
  accepted: 'TONER LOW. It has been low since March.',
  installed:
    'The printer hums. Gavin has already printed forty pages. None of them are offer letters; it only does that for you, apparently.',
}

export const CABINET_COPY = {
  not_started: 'Grey cabinet. Unlabeled. Full of things nobody ordered.',
  later: "Eleven boxes of the wrong toner. Someone's annual review.",
}

export const HANDOUT_PICK_LINE: Record<string, string> = {
  key_handout_q3_deck: "Heavy. Confident. Wrong in a way you can't prove yet.",
  key_handout_q3_summary: 'One page. Someone did their job so you could do yours.',
  key_handout_q2_summary: "The staple is rusty. That's a clue.",
}
