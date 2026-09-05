import type { DialogueId } from './ids'

export type SpeakerId =
  | 'renata'
  | 'gavin'
  | 'priya'
  | 'holloway'
  | 'teddy'
  | 'whitlock'
  | 'kessler'
  | 'sloane'
  | 'nico'
  | 'quincy'
  | 'harper'
  | 'reyes'
  | 'ashford'
  | 'marlowe'
  | 'caldwell'
  | null

export interface DialogueChoice {
  id: string
  label: string
  safe?: boolean
}

export interface DialogueNode {
  id: DialogueId
  speaker: SpeakerId
  name: string
  lines: string[]
  choices?: DialogueChoice[]
}

export const DIALOGUE: Record<DialogueId, DialogueNode> = {
  dlg_renata_callout: {
    id: 'dlg_renata_callout',
    speaker: null,
    name: '',
    lines: ['New hire. Front desk. Now.'],
  },
  dlg_renata_ticket: {
    id: 'dlg_renata_ticket',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      'You have the look. Hopeful. Badge-less.',
      "Floor 1: reception, desks, break room, meeting room, elevator. That's the whole world for now.",
      "Your first ticket is already late. The desk-pit printer is down. Toner's in the grey cabinet in the break room.",
      'Fix it, then come back so I can close the ticket.',
    ],
  },
  dlg_renata_hint_toner: {
    id: 'dlg_renata_hint_toner',
    speaker: 'renata',
    name: 'Renata',
    lines: ["Break room's up the hall, on the right. Grey cabinet. Nobody labels it. Push."],
  },
  dlg_renata_hint_install: {
    id: 'dlg_renata_hint_install',
    speaker: 'renata',
    name: 'Renata',
    lines: ["You're holding toner like it's a promotion. Printer. Desk pit. Go."],
  },
  dlg_renata_close_ticket: {
    id: 'dlg_renata_close_ticket',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      'It printed? It printed. Ticket closed.',
      "Ten Options. Don't spend them all on espresso. Spend most of them on espresso.",
      "It printed offer letters too? Keep them. HR pre-signs a stack every quarter. Beat someone in an argument, hand them one, they're yours.",
      'Gavin at the desks wants a word. He wants a word with everyone.',
    ],
  },
  dlg_renata_gavin_pending: {
    id: 'dlg_renata_gavin_pending',
    speaker: 'renata',
    name: 'Renata',
    lines: ["Gavin's still at his desk. He's always at his desk. It's sort of his whole thing."],
  },
  dlg_renata_holloway: {
    id: 'dlg_renata_holloway',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      'Holloway wants to see you. Elevator lobby, through the glass door.',
      'Eat something first.',
    ],
  },
  dlg_renata_recruit_me: {
    id: 'dlg_renata_recruit_me',
    speaker: 'renata',
    name: 'Renata',
    lines: ["Don't. I'm the front desk. I don't go places."],
  },
  dlg_renata_badged: {
    id: 'dlg_renata_badged',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      "Look at you. Badged. Elevator's top left. It goes to Floor 2.",
      "Floor 2 is Operations. They run the building. They'll tell you.",
    ],
  },
  dlg_renata_after: {
    id: 'dlg_renata_after',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      'Back down before going up? Take the elevator. Operations sends everyone down once anyway.',
    ],
  },
  dlg_gavin_busy: {
    id: 'dlg_gavin_busy',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Can't talk. Printing.", "Trying to print. Somebody's meant to be fixing that."],
  },
  dlg_gavin_no_pressure: {
    id: 'dlg_gavin_no_pressure',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["You're the fix? Great. No pressure. The whole quarter is in that tray."],
  },
  dlg_gavin_callout: {
    id: 'dlg_gavin_callout',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ['Hey. Printer person.'],
  },
  dlg_gavin_challenge: {
    id: 'dlg_gavin_challenge',
    speaker: 'gavin',
    name: 'Gavin',
    lines: [
      "You fixed a printer on day one. Now everyone thinks you're competent.",
      'Desk-pit rules: we argue until one of us stops. Loser refills the coffee.',
    ],
    choices: [
      { id: 'bring_it', label: 'Bring it' },
      { id: 'not_now', label: 'Not now', safe: true },
    ],
  },
  dlg_gavin_declined: {
    id: 'dlg_gavin_declined',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Sure. I'll be here. I'm always here."],
  },
  dlg_gavin_you_lost: {
    id: 'dlg_gavin_you_lost',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Break room's that way. Take five.", "I'll be here, still not having been beaten."],
  },
  dlg_gavin_beaten: {
    id: 'dlg_gavin_beaten',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ['…Okay. Fine. Okay.', "Holloway's going to hear about this. From me. Reluctantly."],
  },
  dlg_gavin_offer: {
    id: 'dlg_gavin_offer',
    speaker: 'gavin',
    name: 'Gavin',
    lines: [
      '…Is that an offer letter. Is that a pre-signed offer letter.',
      "You know what, fine. If you're going up against Holloway I want to be in the room. For the story.",
    ],
    choices: [
      { id: 'extend', label: 'Extend the offer' },
      { id: 'not_yet', label: 'Not yet', safe: true },
    ],
  },
  dlg_gavin_offer_declined: {
    id: 'dlg_gavin_offer_declined',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Right. Keep it. I'll be at my desk, professionally unbothered."],
  },
  dlg_gavin_joined: {
    id: 'dlg_gavin_joined',
    speaker: 'gavin',
    name: 'Gavin',
    lines: [
      "I'm still sitting here. Being on your team and being at my desk are both true.",
      "Switch me in when Holloway starts a sentence with 'so'. Trust me.",
    ],
  },
  dlg_gavin_party: {
    id: 'dlg_gavin_party',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ['Still on your team. Still at my desk. Multitasking.'],
  },
  dlg_gavin_after: {
    id: 'dlg_gavin_after',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["We're not doing that again. I have a reputation to rebuild."],
  },
  dlg_gavin_after_win: {
    id: 'dlg_gavin_after_win',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["We beat Holloway. I'm putting it on my calendar as a recurring event."],
  },
  dlg_priya_hook: {
    id: 'dlg_priya_hook',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      "Don't go in there. The 10:30 isn't ready. I'm the reason. I'm choosing not to accept that.",
    ],
  },
  dlg_priya_request: {
    id: 'dlg_priya_request',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      'Read the agenda on the table. Bring me the handout that matches.',
      "There are three. Two are wrong. That's the job.",
    ],
    choices: [
      { id: 'take_it', label: 'Take it on' },
      { id: 'pass', label: 'Pass', safe: true },
    ],
  },
  dlg_priya_pass: {
    id: 'dlg_priya_pass',
    speaker: 'priya',
    name: 'Priya',
    lines: ['Fair. Nobody signed up for the 10:30.'],
  },
  dlg_priya_waiting: {
    id: 'dlg_priya_waiting',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      "Agenda's on the table. Handouts are on the rack. Matching is the hard part, apparently.",
    ],
  },
  dlg_priya_wrong_deck: {
    id: 'dlg_priya_wrong_deck',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      "Forty-eight pages. She'll read the first one and hold the rest like a shield.",
      'Summary. One page.',
    ],
  },
  dlg_priya_wrong_q2: {
    id: 'dlg_priya_wrong_q2',
    speaker: 'priya',
    name: 'Priya',
    lines: ["That's Q2. We don't say Q2 here anymore.", 'Check the quarter on the agenda.'],
  },
  dlg_priya_delivered: {
    id: 'dlg_priya_delivered',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      'This is it. This is the one. You have no idea how rare that is.',
      'Six Options. Expensed, technically.',
    ],
  },
  dlg_priya_spar: {
    id: 'dlg_priya_spar',
    speaker: 'priya',
    name: 'Priya',
    lines: ["While I've got you. I run a thing. Pre-meeting sparring. Keeps the nerves off."],
    choices: [
      { id: 'spar', label: 'Spar' },
      { id: 'rain_check', label: 'Rain check', safe: true },
    ],
  },
  dlg_priya_raincheck: {
    id: 'dlg_priya_raincheck',
    speaker: 'priya',
    name: 'Priya',
    lines: ["Rain check. I'll hold you to it. I hold everyone to it."],
  },
  dlg_priya_you_lost: {
    id: 'dlg_priya_you_lost',
    speaker: 'priya',
    name: 'Priya',
    lines: ['Break room. Hydrate. Come back angrier.'],
  },
  dlg_priya_beaten: {
    id: 'dlg_priya_beaten',
    speaker: 'priya',
    name: 'Priya',
    lines: ["Good. Now I'll be calm in the 10:30 and nobody will know why."],
  },
  dlg_priya_offer: {
    id: 'dlg_priya_offer',
    speaker: 'priya',
    name: 'Priya',
    lines: [
      "An offer letter. Pre-signed. You're just handing these out?",
      "Yes. Obviously yes. I've been trying to get off this floor since the 10:30 existed.",
    ],
    choices: [
      { id: 'extend', label: 'Extend the offer' },
      { id: 'not_yet', label: 'Not yet', safe: true },
    ],
  },
  dlg_priya_offer_declined: {
    id: 'dlg_priya_offer_declined',
    speaker: 'priya',
    name: 'Priya',
    lines: ["Sure. Come back. I'm easy to find. I'm always outside this door."],
  },
  dlg_priya_offer_full: {
    id: 'dlg_priya_offer_full',
    speaker: 'priya',
    name: 'Priya',
    lines: ["You've got a full team. Send someone home first. Not me — I mean, hypothetically."],
  },
  dlg_priya_joined: {
    id: 'dlg_priya_joined',
    speaker: 'priya',
    name: 'Priya',
    lines: ["Great. I'll hold you to the schedule. Switch me in early; I front-load."],
  },
  dlg_priya_party: {
    id: 'dlg_priya_party',
    speaker: 'priya',
    name: 'Priya',
    lines: ["Team member. Also still running the 10:30. It's called range."],
  },
  dlg_priya_after: {
    id: 'dlg_priya_after',
    speaker: 'priya',
    name: 'Priya',
    lines: ['The 10:30 went fine. Nobody read the handout. It was still the right handout.'],
  },
  dlg_holloway_early: {
    id: 'dlg_holloway_early',
    speaker: 'holloway',
    name: 'Holloway',
    lines: [
      "You're new. The printer's broken and you haven't met Gavin.",
      'Both of those are your problem now.',
    ],
  },
  dlg_holloway_gavin_pending: {
    id: 'dlg_holloway_gavin_pending',
    speaker: 'holloway',
    name: 'Holloway',
    lines: [
      'Printer works. Noted.',
      "Gavin hasn't signed off on you. It isn't a real process. It's the one we have.",
    ],
  },
  dlg_holloway_1on1: {
    id: 'dlg_holloway_1on1',
    speaker: 'holloway',
    name: 'Holloway',
    lines: [
      'Sit. Actually — stand. This is the standing kind.',
      "Printer's fixed. Gavin's sulking. You've been here forty minutes and I already have to have an opinion about you.",
      "This is your one-on-one. There's no leaving early. There's a badge on the other side of it.",
    ],
    choices: [{ id: 'begin', label: 'Begin' }],
  },
  dlg_holloway_you_lost: {
    id: 'dlg_holloway_you_lost',
    speaker: 'holloway',
    name: 'Holloway',
    lines: ['Break room. Five minutes. All of you. I have a 10:30 anyway.'],
  },
  dlg_holloway_beaten: {
    id: 'dlg_holloway_beaten',
    speaker: 'holloway',
    name: 'Holloway',
    lines: [
      "…Well. That's a data point.",
      'Here. Badge. It opens the elevator.',
      "Don't lose it, don't lend it, don't laminate it. It's already laminated.",
    ],
  },
  dlg_holloway_after: {
    id: 'dlg_holloway_after',
    speaker: 'holloway',
    name: 'Holloway',
    lines: ["Elevator's behind me. Reader's on the right. It beeps. Everything here beeps."],
  },
  // ── Floor 2 — Teddy, IT Help Desk (docs/rpg/floor-2-design.md §2.1) ──
  dlg_teddy_callout: {
    id: 'dlg_teddy_callout',
    speaker: null,
    name: '',
    lines: ['Visitor badge. On two. Bold.'],
  },
  dlg_teddy_packet: {
    id: 'dlg_teddy_packet',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      'Help desk. Also badges. Also HR this week; People Ops is self-service and the self is me.',
      "Your badge is a visitor badge. Holloway laminated a visitor badge. That's very Floor 1.",
      "A real one needs a transfer packet: a photo, and your manager's signature. Booth's behind me.",
    ],
  },
  dlg_teddy_hint_photo: {
    id: 'dlg_teddy_hint_photo',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      "Booth's the red curtain. It counts down from three and fires on two. Everyone's does.",
    ],
  },
  dlg_teddy_hint_signature: {
    id: 'dlg_teddy_hint_signature',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      "Now the signature. Holloway. Floor 1. Elevator's where you left it.",
      'Finance is asking about you too. Whitlock, down the hall, right. Do everything downstairs in one trip.',
    ],
  },
  dlg_teddy_hint_file: {
    id: 'dlg_teddy_hint_file',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      'Signed? Drop the packet in the People Ops tray. Through the glass, right. The tray has a face.',
    ],
  },
  dlg_teddy_filed: {
    id: 'dlg_teddy_filed',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      'Filed. That makes you a transfer, which means I run you through compliance.',
      "Module one of one. It's interactive. I'm the interactive.",
    ],
  },
  dlg_teddy_declined: {
    id: 'dlg_teddy_declined',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["Later works. The module doesn't go anywhere. Neither do I."],
  },
  dlg_teddy_you_lost: {
    id: 'dlg_teddy_you_lost',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      'Facilities has the good coffee machine. Nobody downstairs knows. Take five, come back.',
    ],
  },
  dlg_teddy_beaten: {
    id: 'dlg_teddy_beaten',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      "Passed. You passed. I've never passed anyone; the module is usually me losing on purpose.",
    ],
  },
  dlg_teddy_offer: {
    id: 'dlg_teddy_offer',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      'Is that a pre-signed offer letter. From the tray. That I filed.',
      'Yes. Take me. Fourteen months on rotation. Rotations are three.',
    ],
    choices: [
      { id: 'extend', label: 'Extend the offer' },
      { id: 'not_yet', label: 'Not yet', safe: true },
    ],
  },
  dlg_teddy_offer_full: {
    id: 'dlg_teddy_offer_full',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      "You've got three. That's the whole elevator.",
      "Send someone back to their desk and I'm in. They keep the desk. Everyone keeps the desk.",
    ],
    choices: [
      { id: 'make_room', label: 'Make room' },
      { id: 'not_yet', label: 'Not yet', safe: true },
    ],
  },
  dlg_teddy_offer_declined: {
    id: 'dlg_teddy_offer_declined',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["Sure. I'll be here. Ticket's open. My tickets stay open."],
  },
  dlg_teddy_joined: {
    id: 'dlg_teddy_joined',
    speaker: 'teddy',
    name: 'Teddy',
    lines: [
      "Team. I'll keep the desk too; that's how it works here. Gavin explained it in a ticket.",
      "Switch me in when someone's on fire. I do restarts.",
    ],
  },
  dlg_teddy_rejoin: {
    id: 'dlg_teddy_rejoin',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ['Back on the team? Sure. I never logged off.'],
  },
  dlg_teddy_rejoin_full: {
    id: 'dlg_teddy_rejoin_full',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["Three's three. Send someone to their desk first. Not a metaphor; we have desks."],
  },
  dlg_teddy_party: {
    id: 'dlg_teddy_party',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["Teammate. Also the help desk. The queue doesn't know I left."],
  },
  dlg_teddy_no_letter: {
    id: 'dlg_teddy_no_letter',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["No letters left? HR prints two a quarter. It's a long quarter."],
  },
  dlg_teddy_badge_pending: {
    id: 'dlg_teddy_badge_pending',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["He signed? Printer's next to my desk. It jams on the photo. Everyone's does."],
  },
  dlg_teddy_after: {
    id: 'dlg_teddy_after',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ['Employee badge. Level two. Mine says INTERN and expires never.'],
  },
  dlg_teddy_after_win: {
    id: 'dlg_teddy_after_win',
    speaker: 'teddy',
    name: 'Teddy',
    lines: ["We passed Kessler. It's going on my rotation review. Which is also me."],
  },
  // ── Floor 2 — Whitlock, External Auditor (§2.2). `{n}` is the Floor 1 ledger total. ──
  dlg_whitlock_hook: {
    id: 'dlg_whitlock_hook',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ['You. Floor 1. {n} Options earned on a floor with one vending machine. Stand there.'],
  },
  dlg_whitlock_request: {
    id: 'dlg_whitlock_request',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: [
      "I'm external. I don't work here; I count here. Your machine downstairs prints receipts.",
      "Bring me the roll. All of it. Then we'll talk about your ledger.",
    ],
    choices: [
      { id: 'take_it_on', label: 'Take it on' },
      { id: 'pass', label: 'Pass', safe: true },
    ],
  },
  dlg_whitlock_pass: {
    id: 'dlg_whitlock_pass',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ['Declining an audit is also a data point. Noted. In pencil.'],
  },
  dlg_whitlock_waiting: {
    id: 'dlg_whitlock_waiting',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: [
      'Floor 1. Break room. Vending machine. It has a button that says RECEIPT. Nobody has pressed it.',
    ],
  },
  dlg_whitlock_delivered: {
    id: 'dlg_whitlock_delivered',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: [
      "Two point three metres. Espresso. Espresso. A side hustle. I have questions; they're rhetorical.",
      'Reconciled. Reimbursed.',
    ],
  },
  dlg_whitlock_challenge: {
    id: 'dlg_whitlock_challenge',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ["Now the ledger. {n} Options earned on Floor 1. I'd like to see the work."],
    choices: [
      { id: 'open_books', label: 'Open the books' },
      { id: 'not_today', label: 'Not today', safe: true },
    ],
  },
  dlg_whitlock_declined: {
    id: 'dlg_whitlock_declined',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ["Not today. Audits don't end. They pause."],
  },
  dlg_whitlock_you_lost: {
    id: 'dlg_whitlock_you_lost',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ["Facilities. Take five. I'll be here; I bill by the hour."],
  },
  dlg_whitlock_beaten: {
    id: 'dlg_whitlock_beaten',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ['…The numbers hold.', "Initialled. In pencil. I don't do pen for anyone."],
  },
  dlg_whitlock_recruit: {
    id: 'dlg_whitlock_recruit',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ["An offer letter? I don't work here. Legally, that's the point of me."],
  },
  dlg_whitlock_after: {
    id: 'dlg_whitlock_after',
    speaker: 'whitlock',
    name: 'Whitlock',
    lines: ["Audit's closed. Your receipts are confetti now. Compliant confetti."],
  },
  // ── Floor 2 — Kessler, Director of Operations (§2.3) ──
  dlg_kessler_early: {
    id: 'dlg_kessler_early',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      "Transfer's not filed. Or Teddy hasn't cleared you. Or both. Operations runs on 'or both'.",
    ],
  },
  dlg_kessler_teddy_pending: {
    id: 'dlg_kessler_teddy_pending',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      "Packet's filed. Compliance isn't. Teddy runs it. Yes, the intern. It's his fourteenth month; he's senior.",
    ],
  },
  dlg_kessler_review: {
    id: 'dlg_kessler_review',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      "Stand. Everyone stands here; it keeps reviews short. This one won't be.",
      'Teddy passed you, which means Teddy lost. Interesting.',
      "This is your operations review. There's no rescheduling.",
    ],
    choices: [{ id: 'begin', label: 'Begin' }],
  },
  dlg_kessler_you_lost: {
    id: 'dlg_kessler_you_lost',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      "Facilities. All of you. Reschedule with Teddy; he owns a calendar he isn't allowed to edit.",
    ],
  },
  dlg_kessler_beaten: {
    id: 'dlg_kessler_beaten',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      '…Fine. Aligned.',
      "Signed. Transfer approved. Teddy prints the badge; I don't touch the printer. It's a policy about me.",
    ],
  },
  dlg_kessler_after: {
    id: 'dlg_kessler_after',
    speaker: 'kessler',
    name: 'Kessler',
    lines: [
      "Badge printer's at the help desk. Then the elevator. Floors 3 through 5 are a climb. I mapped them. You walk them.",
    ],
  },
  // ── Floor 1 cast once Floor 2 exists (§2.5) ──
  dlg_renata_transfer: {
    id: 'dlg_renata_transfer',
    speaker: 'renata',
    name: 'Renata',
    lines: ['Transfer form? Holloway. Elevator lobby. She signs anything you hold still enough.'],
  },
  dlg_renata_audit: {
    id: 'dlg_renata_audit',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      "The vending machine prints receipts? Since when. Since always? Don't tell Whitlock about the cake.",
    ],
  },
  dlg_renata_upstairs: {
    id: 'dlg_renata_upstairs',
    speaker: 'renata',
    name: 'Renata',
    lines: ["How's up there? Don't tell me. I like it here. The plants are real."],
  },
  dlg_renata_f2_after: {
    id: 'dlg_renata_f2_after',
    speaker: 'renata',
    name: 'Renata',
    lines: [
      "Employee badge. A real one. You're still my new hire. That's forever; it's on a spreadsheet.",
    ],
  },
  dlg_gavin_upstairs: {
    id: 'dlg_gavin_upstairs',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ['Operations. They have the good coffee and no personality. Balanced.'],
  },
  dlg_gavin_rejoin: {
    id: 'dlg_gavin_rejoin',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Back? Fine. I kept the seat warm. It's a chair; they're always warm."],
  },
  dlg_gavin_rejoin_full: {
    id: 'dlg_gavin_rejoin_full',
    speaker: 'gavin',
    name: 'Gavin',
    lines: [
      "Three's three. I'm not going to be the fourth chair. I've seen how the fourth chair is treated.",
    ],
  },
  dlg_gavin_f2_after: {
    id: 'dlg_gavin_f2_after',
    speaker: 'gavin',
    name: 'Gavin',
    lines: ["Permanent. Great. I've been permanent for nine years. It's mostly a chair."],
  },
  dlg_priya_upstairs: {
    id: 'dlg_priya_upstairs',
    speaker: 'priya',
    name: 'Priya',
    lines: ['You went up. Without a handout. Brave.'],
  },
  dlg_priya_rejoin: {
    id: 'dlg_priya_rejoin',
    speaker: 'priya',
    name: 'Priya',
    lines: ['Back on the team? I never updated the calendar. I knew.'],
  },
  dlg_priya_rejoin_full: {
    id: 'dlg_priya_rejoin_full',
    speaker: 'priya',
    name: 'Priya',
    lines: ['Full team. Send someone to their desk first. Send Gavin. Hypothetically.'],
  },
  dlg_holloway_sign_transfer: {
    id: 'dlg_holloway_sign_transfer',
    speaker: 'holloway',
    name: 'Holloway',
    lines: [
      'A transfer form. To Operations. Kessler.',
      "He'll make you stand too. He learned it from me. He'll say he didn't.",
      "Signed. Don't tell him I read it.",
    ],
  },
  dlg_holloway_upstairs: {
    id: 'dlg_holloway_upstairs',
    speaker: 'holloway',
    name: 'Holloway',
    lines: ['Kessler counts. Bring everyone. Then bring the count.'],
  },
  dlg_holloway_f2_after: {
    id: 'dlg_holloway_f2_after',
    speaker: 'holloway',
    name: 'Holloway',
    lines: ["Permanent. Congratulations. I'm still interim. Four years. It's a lifestyle."],
  },
  // ── Floor 3 — Sloane ──
  dlg_sloane_callout: {
    id: 'dlg_sloane_callout',
    speaker: null,
    name: '',
    lines: ['New badge. War room. The card is already late.'],
  },
  dlg_sloane_brief: {
    id: 'dlg_sloane_brief',
    speaker: 'sloane',
    name: 'Sloane',
    lines: [
      "Q4 is a card on that wall. Legal won't look at it until Research initials it.",
      "Nico has been sitting on the findings since the last re-org. That's a compliment. Mostly.",
      'Pull the card. Get the initials. Then Quincy will sequence you.',
    ],
  },
  dlg_sloane_hint_card: {
    id: 'dlg_sloane_hint_card',
    speaker: 'sloane',
    name: 'Sloane',
    lines: ['The wall. The yellow one. It says NOW in a font that is lying.'],
  },
  dlg_sloane_hint_nico: {
    id: 'dlg_sloane_hint_nico',
    speaker: 'sloane',
    name: 'Sloane',
    lines: ["You're holding the quarter. Nico is through the glass. Right."],
  },
  dlg_sloane_filed: {
    id: 'dlg_sloane_filed',
    speaker: 'sloane',
    name: 'Sloane',
    lines: [
      'Initials. In pencil. Nico is consistent.',
      "Quincy is downstairs. He doesn't ship. He sequences. Go be a column.",
    ],
  },
  dlg_sloane_after: {
    id: 'dlg_sloane_after',
    speaker: 'sloane',
    name: 'Sloane',
    lines: ['The card is in Now. It will be in Later by Friday. That is the job.'],
  },
  dlg_sloane_after_win: {
    id: 'dlg_sloane_after_win',
    speaker: 'sloane',
    name: 'Sloane',
    lines: ["He moved you to Now. Don't get comfortable. Now is a hallway."],
  },
  dlg_nico_hook: {
    id: 'dlg_nico_hook',
    speaker: 'nico',
    name: 'Nico',
    lines: ['If that is a card, it wants a sticky. If it is a feeling, it can wait.'],
  },
  dlg_nico_waiting: {
    id: 'dlg_nico_waiting',
    speaker: 'nico',
    name: 'Nico',
    lines: ['The board takes cards. I take findings. One of those is here.'],
  },
  dlg_nico_initialled: {
    id: 'dlg_nico_initialled',
    speaker: 'nico',
    name: 'Nico',
    lines: [
      'Sample size: everyone who would talk to me. Confidence: a shrug.',
      'Initialled. In pencil. Ink is a commitment.',
    ],
  },
  dlg_nico_after: {
    id: 'dlg_nico_after',
    speaker: 'nico',
    name: 'Nico',
    lines: ['The findings have not changed. The column has. That is called alignment.'],
  },
  dlg_quincy_early: {
    id: 'dlg_quincy_early',
    speaker: 'quincy',
    name: 'Quincy',
    lines: ['The card is not initialled. I do not review vapour. Sloane knows.'],
  },
  dlg_quincy_sloane_pending: {
    id: 'dlg_quincy_sloane_pending',
    speaker: 'quincy',
    name: 'Quincy',
    lines: ['Sloane will tell me when Now is ready. Sloane has not told me.'],
  },
  dlg_quincy_review: {
    id: 'dlg_quincy_review',
    speaker: 'quincy',
    name: 'Quincy',
    lines: [
      'Prioritization. We will put you in a column.',
      'There is no leaving the board. There is only Later.',
    ],
    choices: [{ id: 'begin', label: 'Begin review' }],
  },
  dlg_quincy_you_lost: {
    id: 'dlg_quincy_you_lost',
    speaker: 'quincy',
    name: 'Quincy',
    lines: ['Icebox. Coffee is the good machine. Come back when you are a feature.'],
  },
  dlg_quincy_beaten: {
    id: 'dlg_quincy_beaten',
    speaker: 'quincy',
    name: 'Quincy',
    lines: [
      'Now. The column had been empty since April.',
      'Sales is upstairs. They will say this quarter. They always say this quarter.',
    ],
  },
  dlg_quincy_after: {
    id: 'dlg_quincy_after',
    speaker: 'quincy',
    name: 'Quincy',
    lines: ['You are sequenced. Try not to add scope on the way up.'],
  },
  // ── Floor 4 — Harper ──
  dlg_harper_callout: {
    id: 'dlg_harper_callout',
    speaker: null,
    name: '',
    lines: ['Hey. If you can hear me you can close. Pipeline. Now.'],
  },
  dlg_harper_brief: {
    id: 'dlg_harper_brief',
    speaker: 'harper',
    name: 'Harper',
    lines: [
      'The leave-behind is theoretically on the board and actually in a stack Reyes was reprinting.',
      'Pull it. Walk it over. Then Ashford does The Close. He does not lose. He reframes.',
    ],
  },
  dlg_harper_hint_deck: {
    id: 'dlg_harper_hint_deck',
    speaker: 'harper',
    name: 'Harper',
    lines: ['Board or stand. Same one-pager. The number at the bottom is optimistic.'],
  },
  dlg_harper_hint_reyes: {
    id: 'dlg_harper_hint_reyes',
    speaker: 'harper',
    name: 'Harper',
    lines: ["You're holding the quarter. Reyes is through the glass. Don't make him chase you."],
  },
  dlg_harper_filed: {
    id: 'dlg_harper_filed',
    speaker: 'harper',
    name: 'Harper',
    lines: ['Delivered. Ashford is downstairs. If you can hear the flute, you are late.'],
  },
  dlg_harper_after: {
    id: 'dlg_harper_after',
    speaker: 'harper',
    name: 'Harper',
    lines: ['The number is the number until Friday. Then it is a different number.'],
  },
  dlg_harper_after_win: {
    id: 'dlg_harper_after_win',
    speaker: 'harper',
    name: 'Harper',
    lines: ['He put the flute down. It was empty the whole time. You knew. I knew. He knew.'],
  },
  dlg_reyes_hook: {
    id: 'dlg_reyes_hook',
    speaker: 'reyes',
    name: 'Reyes',
    lines: ['If that is the leave-behind, I already reprinted it. If it is not, it will be.'],
  },
  dlg_reyes_waiting: {
    id: 'dlg_reyes_waiting',
    speaker: 'reyes',
    name: 'Reyes',
    lines: ['The stand is for clients. You are holding one. The maths is not hard.'],
  },
  dlg_reyes_delivered: {
    id: 'dlg_reyes_delivered',
    speaker: 'reyes',
    name: 'Reyes',
    lines: [
      'I will say we aligned. I will not say on what.',
      'Ashford is the south floor. The Close is not a metaphor.',
    ],
  },
  dlg_reyes_after: {
    id: 'dlg_reyes_after',
    speaker: 'reyes',
    name: 'Reyes',
    lines: ['The client has not seen it. That is why it still works.'],
  },
  dlg_ashford_early: {
    id: 'dlg_ashford_early',
    speaker: 'ashford',
    name: 'Ashford',
    lines: ['No leave-behind, no Close. Harper knows. Harper always knows.'],
  },
  dlg_ashford_harper_pending: {
    id: 'dlg_ashford_harper_pending',
    speaker: 'ashford',
    name: 'Ashford',
    lines: ['Harper will send you when the paper is real. The paper is not real.'],
  },
  dlg_ashford_close: {
    id: 'dlg_ashford_close',
    speaker: 'ashford',
    name: 'Ashford',
    lines: [
      'The Close. This quarter. There is no next quarter in this room.',
      'You can reframe or you can lose. Those are the same sentence, later.',
    ],
    choices: [{ id: 'begin', label: 'Begin the close' }],
  },
  dlg_ashford_you_lost: {
    id: 'dlg_ashford_you_lost',
    speaker: 'ashford',
    name: 'Ashford',
    lines: ['Verbal only. Coffee. Come back when you can discount yourself.'],
  },
  dlg_ashford_beaten: {
    id: 'dlg_ashford_beaten',
    speaker: 'ashford',
    name: 'Ashford',
    lines: [
      'Closed. The flute was empty the whole time.',
      'Exec is upstairs. Marlowe has the calendar. Caldwell has the nod.',
    ],
  },
  dlg_ashford_after: {
    id: 'dlg_ashford_after',
    speaker: 'ashford',
    name: 'Ashford',
    lines: ['The number landed. Do not ask which number. The Close does not do that.'],
  },
  // ── Floor 5 — Marlowe ──
  dlg_marlowe_callout: {
    id: 'dlg_marlowe_callout',
    speaker: null,
    name: '',
    lines: ['You are not on the calendar. The packet is. Sideboard.'],
  },
  dlg_marlowe_brief: {
    id: 'dlg_marlowe_brief',
    speaker: 'marlowe',
    name: 'Marlowe',
    lines: [
      'Caldwell reviews people who arrive with the packet. The packet lives on the sideboard.',
      'That is where board packets live. I do not make the rules. I enforce the furniture.',
      'Bring it here. Then the door downstairs means something.',
    ],
  },
  dlg_marlowe_hint_packet: {
    id: 'dlg_marlowe_hint_packet',
    speaker: 'marlowe',
    name: 'Marlowe',
    lines: ['Sideboard. Leather. The one that looks expensive because it is.'],
  },
  dlg_marlowe_filed: {
    id: 'dlg_marlowe_filed',
    speaker: 'marlowe',
    name: 'Marlowe',
    lines: [
      'Filed. You are on the calendar. The calendar is now.',
      'Caldwell is downstairs. He will take it offline. That is the compliment.',
    ],
  },
  dlg_marlowe_after: {
    id: 'dlg_marlowe_after',
    speaker: 'marlowe',
    name: 'Marlowe',
    lines: ['The packet is in the book. The book does not come back out.'],
  },
  dlg_marlowe_after_win: {
    id: 'dlg_marlowe_after_win',
    speaker: 'marlowe',
    name: 'Marlowe',
    lines: ['He nodded. There is no letter. There is no Floor 6. That was the offer.'],
  },
  dlg_caldwell_early: {
    id: 'dlg_caldwell_early',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: ['Marlowe has the calendar. The calendar does not have you.'],
  },
  dlg_caldwell_packet_pending: {
    id: 'dlg_caldwell_packet_pending',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: ['The packet is not in the book. I review the book.'],
  },
  dlg_caldwell_review: {
    id: 'dlg_caldwell_review',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: [
      'The review. Five floors. The printer, the packet, the card, the close.',
      'There is no Floor 6. There is a nod. Begin.',
    ],
    choices: [{ id: 'begin', label: 'Begin the review' }],
  },
  dlg_caldwell_you_lost: {
    id: 'dlg_caldwell_you_lost',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: ['Offline, for now. The machine downstairs. Come back when you can take a note.'],
  },
  dlg_caldwell_beaten: {
    id: 'dlg_caldwell_beaten',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: [
      'A nod. The nod is the offer. There is no letter. There is no Floor 6.',
      'The elevator still goes down. That is the whole building.',
    ],
  },
  dlg_caldwell_after: {
    id: 'dlg_caldwell_after',
    speaker: 'caldwell',
    name: 'Caldwell',
    lines: ['You have the nod. Try not to add a floor on the way out.'],
  },
}

export const SPEAKER_SPRITE: Record<Exclude<SpeakerId, null>, string> = {
  renata: 'recruiter',
  gavin: 'overachiever',
  priya: 'scrum',
  holloway: 'manager',
  teddy: 'intern',
  whitlock: 'boss',
  kessler: 'vp',
  // House portraits, new keys — stand-ins until a Floor 3–5 commission.
  sloane: 'sloane',
  nico: 'nico',
  quincy: 'quincy',
  harper: 'harper',
  reyes: 'reyes',
  ashford: 'ashford',
  marlowe: 'marlowe',
  caldwell: 'caldwell',
}
