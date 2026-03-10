import { DialogueNode } from '../../../ui/stores/dialogueState'

// Encounter 1: Career Center Advisor — tutorial about stat carry-over
export const careerAdvisorDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Career Center Advisor',
    text: "Welcome to the Career Center! Your stats from freshman year carried over. Energy, reputation, network, cash — they all matter now more than ever. The career fair is coming up.",
    options: [
      {
        text: "What should I focus on?",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        nextNodeId: 'focus_advice',
        tags: ['prepared'],
      },
      {
        text: "I'm just here for the free pens.",
        statChanges: { cash: 2 },
        consequence: '+2 Cash (pens are money)',
        nextNodeId: 'pens',
        tags: ['rebel', 'casual'],
      },
    ],
  },
  {
    id: 'focus_advice',
    speaker: 'Career Center Advisor',
    text: "Network is king at career fairs. But reputation opens doors that networking can't. And keep your energy up — burnout during interview season is real.",
    options: [
      {
        text: "Solid advice. Thanks.",
        statChanges: { network: 2 },
        consequence: '+2 Network',
      },
    ],
  },
  {
    id: 'pens',
    speaker: 'Career Center Advisor',
    text: "...Right. Well, the resume review station is to your left. The career fair floor is ahead. Try not to fall into any resume gaps. Literally.",
  },
]

// Encounter 2: Career Fair Booth NPC — archetype-mapping choice
export const careerBoothDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Booth Recruiter',
    text: "Hi there! Thanks for stopping by. So tell me — what are you looking for in a role?",
    options: [
      {
        text: "Fast growth. I want to run something within a year.",
        statChanges: { reputation: 5, energy: -3 },
        consequence: '+5 Reputation, -3 Energy',
        nextNodeId: 'hustler_response',
        tags: ['hustler', 'ambitious'],
      },
      {
        text: "A team that values collaboration and mentorship.",
        statChanges: { network: 5 },
        consequence: '+5 Network',
        nextNodeId: 'diplomat_response',
        tags: ['diplomat', 'team_player'],
      },
      {
        text: "Honestly? Good pay and work-life balance.",
        statChanges: { cash: 5, energy: 3 },
        consequence: '+5 Cash, +3 Energy',
        nextNodeId: 'rebel_response',
        tags: ['rebel', 'pragmatist'],
      },
    ],
  },
  {
    id: 'hustler_response',
    speaker: 'Booth Recruiter',
    text: "Love the ambition! We have a rotational program that could work. Here's my card.",
    options: [
      { text: 'Thanks!', statChanges: { network: 3 }, consequence: '+3 Network' },
    ],
  },
  {
    id: 'diplomat_response',
    speaker: 'Booth Recruiter',
    text: "That's exactly our culture. We're big on cross-functional teams. Let me get you in touch with our hiring manager.",
    options: [
      { text: 'That sounds great.', statChanges: { network: 5 }, consequence: '+5 Network' },
    ],
  },
  {
    id: 'rebel_response',
    speaker: 'Booth Recruiter',
    text: "Ha! Refreshingly honest. We can't promise no overtime, but the comp is competitive. Take a brochure.",
    options: [
      { text: 'Deal.', statChanges: { cash: 3 }, consequence: '+3 Cash' },
    ],
  },
]

// Encounter 3: Pre-Overachiever — brief brag exchange
export const overachieverDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'The Overachiever',
    text: "Oh hey! I already have three offers lined up. I'm just here for the free food. And to network. And to collect backup offers. You know how it is.",
    options: [
      {
        text: "Good for you. I'm going to beat your record.",
        statChanges: { energy: -5 },
        consequence: '-5 Energy (competitive stress)',
        nextNodeId: 'competitive',
        tags: ['overachiever_competitive', 'hustler'],
      },
      {
        text: "Cool. I'll find my own path.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        nextNodeId: 'chill',
        tags: ['overachiever_alternative', 'independent'],
      },
      {
        text: "...",
        nextNodeId: 'ignored',
        tags: ['overachiever_ignored'],
      },
    ],
  },
  {
    id: 'competitive',
    speaker: 'The Overachiever',
    text: "Oh? A challenger? Fine. Race you to the next power-up. Loser buys coffee.",
  },
  {
    id: 'chill',
    speaker: 'The Overachiever',
    text: "Huh. Okay. Well... good luck, I guess. Not that you'll need it. I mean, I didn't.",
  },
  {
    id: 'ignored',
    speaker: 'The Overachiever',
    text: "Hello? ...Rude. Whatever. I'll remember that.",
  },
]

// Encounter 4: Networking Event — timed elevator pitch
export const elevatorPitchDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Networking Host',
    text: "Elevator pitch time. Go. You have ONE response to impress this VP. Make it count.",
    options: [
      {
        text: "I shipped a product that grew 300% in 6 months. I'm here to do it again.",
        statCheck: { stat: 'reputation', comparison: 'gte', threshold: 55 },
        statChanges: { network: 8, reputation: 5 },
        consequence: '✓ Rep Check! +8 Network, +5 Reputation — VP is impressed',
        nextNodeId: 'impressed',
        tags: ['hustler', 'polished'],
      },
      {
        text: "I built my network from zero. Every connection in this room knows my name.",
        statCheck: { stat: 'network', comparison: 'gte', threshold: 55 },
        statChanges: { network: 10 },
        consequence: '✓ Network Check! +10 Network — VP asks for your LinkedIn',
        nextNodeId: 'impressed',
        tags: ['diplomat', 'networker'],
      },
      {
        text: "I don't do elevator pitches. Let's just talk like normal people.",
        statChanges: { reputation: -3, energy: 5 },
        consequence: '-3 Reputation, +5 Energy — Awkward but authentic',
        nextNodeId: 'awkward',
        tags: ['rebel', 'authentic'],
      },
    ],
  },
  {
    id: 'impressed',
    speaker: 'VP',
    text: "Now THAT is how you make an impression. Here's my direct number. Call me Monday.",
  },
  {
    id: 'awkward',
    speaker: 'VP',
    text: "...Okay. That was different. I respect it, actually. Here — my assistant's email. Reach out.",
    options: [
      { text: 'Thanks.', statChanges: { network: 3 }, consequence: '+3 Network' },
    ],
  },
]

// Kitchen Thief — passive-aggressive fridge drama
export const kitchenThiefDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Karen from Accounting',
    text: "Someone ate my clearly-labeled yogurt. AGAIN. I have put up SEVEN sticky notes. I am THIS close to installing a security camera.",
    options: [
      { text: '"That sounds frustrating."', nextNodeId: 'empathy' },
      { text: '"Have you tried a mini fridge?"', nextNodeId: 'solution' },
      { text: '"It was me. Sorry."', nextNodeId: 'confess' },
    ],
  },
  {
    id: 'empathy',
    speaker: 'Karen from Accounting',
    text: "Thank you. FINALLY someone who understands. You know what? You're alright. Here — I have extra granola bars. Take one.",
    options: [
      { text: 'Accept the granola bar.', statChanges: { energy: 5, network: 2 }, consequence: '+5 Energy, +2 Network' },
    ],
  },
  {
    id: 'solution',
    speaker: 'Karen from Accounting',
    text: "A MINI FRIDGE? Do you know what they charge for desk real estate around here? No. Justice will be served. Cold. Like my stolen yogurt.",
    options: [
      { text: 'Back away slowly.', consequence: "You've learned something about office politics." },
    ],
  },
  {
    id: 'confess',
    speaker: 'Karen from Accounting',
    text: "...I appreciate your honesty. But know this: I forgive, but I never forget. And I CC everyone.",
    options: [
      { text: 'Noted.', statChanges: { reputation: -3 }, consequence: '-3 Reputation — Karen remembers.' },
    ],
  },
]

// Passive-Aggressive Emailer — teaches email survival
export const passiveAggressiveEmailerDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Greg (Senior Associate)',
    text: "Per my last email — which, for the record, I sent three times — the deliverables were due yesterday. But sure, take your time.",
    options: [
      { text: '"Sorry, I was swamped."', nextNodeId: 'excuse' },
      { text: '"Per YOUR last email, it said next week."', nextNodeId: 'pushback' },
      { text: '"What deliverables?"', nextNodeId: 'clueless' },
    ],
  },
  {
    id: 'excuse',
    speaker: 'Greg (Senior Associate)',
    text: "No worries at all! 🙂 Just going to go ahead and loop in your manager. For visibility. As per best practices.",
    options: [
      { text: 'Panic internally.', statChanges: { reputation: -5 }, consequence: '-5 Reputation — you\'ve been CC\'d into oblivion.' },
    ],
  },
  {
    id: 'pushback',
    speaker: 'Greg (Senior Associate)',
    text: "...Huh. You're right. Well. I appreciate you surfacing that discrepancy. I'll... recalibrate the timeline.",
    options: [
      { text: 'Walk away victorious.', statChanges: { reputation: 5 }, consequence: '+5 Reputation — you won the email war.' },
    ],
  },
  {
    id: 'clueless',
    speaker: 'Greg (Senior Associate)',
    text: "The — are you — I literally — you know what, I'm going to take a walk. A long walk. Maybe to HR.",
    options: [
      { text: '"Good chat, Greg."', statChanges: { energy: 3 }, consequence: '+3 Energy — Greg leaves, blissful ignorance prevails.' },
    ],
  },
]
