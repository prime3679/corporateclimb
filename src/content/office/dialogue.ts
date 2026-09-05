import type { DialogueId } from './ids'

export type SpeakerId = 'renata' | 'gavin' | 'priya' | 'holloway' | 'callie' | null

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
      "It's mostly a temporary pod for now, but the loop works. That's still a win.",
    ],
  },
  dlg_renata_after: {
    id: 'dlg_renata_after',
    speaker: 'renata',
    name: 'Renata',
    lines: ['Back already? Floor 2 has folding tables and ambition.'],
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
  dlg_callie_floor2_intro: {
    id: 'dlg_callie_floor2_intro',
    speaker: 'callie',
    name: 'Callie',
    lines: [
      "Welcome to Floor 2. It's a stub, but it's ours.",
      'I run facilities pilots up here. Elevator down is live whenever you want to backtrack.',
    ],
  },
  dlg_callie_floor2_repeat: {
    id: 'dlg_callie_floor2_repeat',
    speaker: 'callie',
    name: 'Callie',
    lines: ['Still wiring this floor together. If you need supplies, Floor 1 is one ride away.'],
  },
}

export const SPEAKER_SPRITE: Record<
  Exclude<SpeakerId, null>,
  'recruiter' | 'overachiever' | 'scrum' | 'manager'
> = {
  renata: 'recruiter',
  gavin: 'overachiever',
  priya: 'scrum',
  holloway: 'manager',
  callie: 'recruiter',
}
