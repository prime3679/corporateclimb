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
  // Floors 3–5 (docs/rpg/floor-3-5-design.md)
  poi_elevator_door_f3: 'The reader blinks red. Sales is above your grade. It says so, in a beep.',
  poi_directory_sign_f3: 'FLOOR 3 — PRODUCT. War room: through the glass. Intake: far right.',
  poi_roadmap_wall: 'A wall of cards. NOW is empty. LATER is a novel. ICEBOX has your name on it.',
  poi_intake_board: 'A research board. The stickies are colour-coded by how tired Nico is.',
  poi_war_desk: 'Three monitors. One of them is a spreadsheet named ROADMAP_FINAL_v7_USE_THIS.',
  poi_filing_f3: 'Specs. Every one of them says DRAFT in a confident font.',
  poi_water_cooler_f3: 'The gossip up here is about the column. You are not in it yet.',
  poi_break_counter_f3:
    'Restores HP and PP for the whole team. Product still has the good machine.',
  poi_vending_machine_f3: 'Accepts Stock Options. Product has a ticket open about that.',
  poi_break_table_f3: 'A pastry box. The note says FOR THE Q4 REVIEW. The box is empty.',
  poi_quincy_desk:
    'Nameplate: QUINCY, VP PRODUCT. The Now column on his monitor is a blinking cursor.',
  poi_elevator_door_f4: 'The reader blinks red. Exec is above your grade. It says so, in a beep.',
  poi_directory_sign_f4: 'FLOOR 4 — SALES. Pipeline: through the glass. Client: far right.',
  poi_pipeline_board: 'A pipeline. Everything is Closing. Nothing is Closed. The maths is hopeful.',
  poi_leavebehind: 'A stack of one-pagers. The number at the bottom is optimistic.',
  poi_pipeline_desk: "Harper's desk. The phone is face-down. That is how you know it is ringing.",
  poi_water_cooler_f4: 'The gossip up here is a number. The number changes if you ask twice.',
  poi_break_counter_f4: 'Restores HP and PP for the whole team. Sales calls it a win-back.',
  poi_vending_machine_f4: 'Accepts Stock Options. Someone billed a client for a bag of chips.',
  poi_break_table_f4:
    'A champagne flute in a coffee mug. The flute is empty. The mug is also empty.',
  poi_ashford_desk:
    'Nameplate: ASHFORD, VP SALES. A flute. No champagne. The Close does not need it.',
  poi_elevator_door_f5: 'The reader is green. There is no 6. The beep is quieter up here.',
  poi_directory_sign_f5:
    'FLOOR 5 — EXEC. Antechamber: through the glass. Boardroom: down the hall.',
  poi_sideboard: 'Leather. A packet with a gold clip. This is where board packets live.',
  poi_water_cooler_f5: 'No gossip. The VPs are on this floor, being quiet.',
  poi_break_counter_f5:
    'Restores HP and PP for the whole team. The mugs have no logos. That is the logo.',
  poi_vending_machine_f5:
    'Accepts Stock Options. The prices are the same. That feels like a statement.',
  poi_break_table_f5: 'A water pitcher. No pastries. The note says THE BOARD DOES NOT EAT.',
  poi_board_table: 'A table that has heard worse presentations than yours. It is not impressed.',
  poi_caldwell_desk:
    'Nameplate: CALDWELL, CHIEF EXECUTIVE. No computer. A notepad. One line, blank.',
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

export const ROADMAP_WALL_COPY = {
  later: 'The yellow card is gone. NOW is still empty. That is the job.',
}

export const INTAKE_BOARD_COPY = {
  filing: 'You pin the Q4 card. A sticky appears. Initials. In pencil.',
  later: 'The card is filed. The sticky is dry. Nico has not looked up.',
}

export const LEAVEBEHIND_COPY = {
  later: 'The stack is one thinner. Reyes already knows.',
}

export const SIDEBOARD_COPY = {
  later: 'The gold clip is gone. The leather looks expensive because it is.',
}
