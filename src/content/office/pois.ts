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
  // Floor 2 (docs/rpg/floor-2-design.md §2.4) — first-state lines; state-keyed copy is below.
  poi_elevator_door_f2:
    'The reader blinks red. Floor 3 is above your grade. It says so, in a beep.',
  poi_directory_sign_f2:
    'FLOOR 2 — OPERATIONS. Help desk: through the glass. People Ops: far right.',
  poi_photo_booth: 'A badge photo booth. The curtain is the colour of a mistake.',
  poi_badge_printer: 'A badge printer. Amber light. It prints for people with signatures.',
  poi_server_rack: 'Forty-two units of blinking. One light is red. Nobody knows which one matters.',
  poi_help_desk: 'Three monitors. Eleven tabs each. One tab is titled HOW TO ESCALATE MYSELF.',
  poi_people_tray: 'An in-tray with a face drawn on it. The face is patient.',
  poi_filing_cabinets:
    "P to T. Someone's whole career is in the middle drawer, filed under R for Reorg.",
  poi_water_cooler_f2: "The gossip up here is about you. It's positive. That's the gossip.",
  poi_director_door: "Kessler's review starts when you step in. He doesn't do one-on-ones.",
  poi_director_desk:
    'Nameplate: R. KESSLER, DIRECTOR OF OPERATIONS. Bolted down. The plate and the desk.',
  poi_supply_cabinet_f2: 'Toner. Eleven boxes. The right kind. Nobody downstairs knows.',
  poi_break_counter_f2: 'Restores HP and PP for the whole team. This is the good machine.',
  poi_vending_machine_f2: 'Accepts Stock Options. Finance has questions.',
  poi_break_table_f2:
    'A donut box. Two donuts. A napkin where the third was, with a note: FOR KESSLER.',
  poi_lockers: 'Padlocked. The combination is on a sticky note on the safe in Finance.',
  poi_janitor_cart: 'WET FLOOR. The floor is dry. The sign is aspirational.',
  poi_safe: 'A safe. The combination is on a sticky note. On the safe.',
  poi_shredder: 'A cross-cut shredder. It has eaten better receipts than yours.',
  poi_directory_sign_stub:
    'Unmapped floor. Elevator: you are standing at it. Fable fills the rest.',
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

export const PHOTO_BOOTH_COPY = {
  not_started: 'A badge photo booth. The curtain is the colour of a mistake.',
  countdown: 'Three. Two—',
  printed: "It prints a photo. Your eyes are closed. It's the only copy.",
  later: 'The booth hums. It has your photo now. Forever, per the form.',
}

export const PEOPLE_TRAY_COPY = {
  not_started: 'An in-tray with a face drawn on it. The face is patient.',
  waiting:
    'The tray wants a photo and a signature. It cannot say so. Someone drew it a face instead.',
  filing: 'You place the packet in the tray. The tray does not react. Somewhere, a process starts.',
  letter:
    'A pre-signed Offer Letter slides out from under the stack. HR staples one to everything.',
  later: "The tray's empty. The face looks satisfied. Or bored. It's a sticky note.",
}

export const BADGE_PRINTER_COPY = {
  locked: 'A badge printer. Amber light. It prints for people with signatures.',
  printing: 'It thinks. It prints. Level two, laminated, the photo with your eyes closed.',
  done: "Green light. It's done printing you.",
}

export const CABINET_F2_COPY = {
  first: 'Toner. Eleven boxes. The right kind. Nobody downstairs knows.',
  later: 'Still the right toner. Still a secret.',
}

export const SHREDDER_COPY = {
  idle: 'A cross-cut shredder. It has eaten better receipts than yours.',
  after: 'Your receipts, as confetti. Whitlock fed them in one at a time. Lovingly.',
}
