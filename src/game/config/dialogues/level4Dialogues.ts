import { DialogueNode } from '../../../ui/stores/dialogueState'

// Encounter 1: Desk Neighbor
export const deskNeighborDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Desk Neighbor',
    text: "You've been here a while now. Feeling it? The meetings, the roadmaps, the scope creep... it gets to everyone eventually.",
    options: [
      {
        text: "I'm thriving. This is what I signed up for.",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        nextNodeId: 'thriving',
        tags: ['hustler', 'confident'],
      },
      {
        text: "Some days are harder than others.",
        statChanges: { energy: 3, network: 3 },
        consequence: '+3 Energy, +3 Network — Honesty builds trust',
        nextNodeId: 'honest',
        tags: ['honest', 'vulnerable'],
      },
    ],
  },
  {
    id: 'thriving',
    speaker: 'Desk Neighbor',
    text: "Good for you. Seriously. Just... don't forget to check in with yourself. The burnout sneaks up on the best ones.",
  },
  {
    id: 'honest',
    speaker: 'Desk Neighbor',
    text: "Same. The meeting gauntlet ahead is brutal. Pro tip: you CAN skip some of them, but there's a reputation cost. Pick your battles.",
  },
]

// Encounter 2: Pre-meeting-gauntlet NPC
export const meetingGuideDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Meeting Veteran',
    text: "The conference rooms ahead? Five back-to-back meetings. Each room pulls you in when you get close. Dodge the jargon, collect the action items. You CAN skip rooms, but people notice.",
    options: [
      {
        text: 'How do I handle the jargon?',
        nextNodeId: 'jargon_tips',
        tags: ['prepared'],
      },
      {
        text: "I'll figure it out.",
        statChanges: { reputation: 2 },
        consequence: '+2 Reputation',
        tags: ['confident'],
      },
    ],
  },
  {
    id: 'jargon_tips',
    speaker: 'Meeting Veteran',
    text: "\"Synergy\", \"leverage\", \"circle back\" — they float around the room as projectiles. Dodge those. The yellow stars are action items — grab them for +2 Reputation each. Miss an action item? That's -3 Reputation. \"Dropped the ball.\"",
    options: [
      { text: 'Got it. Dodge buzz, catch stars.', statChanges: { energy: 3 }, consequence: '+3 Energy' },
    ],
  },
]

// Encounter 3: Rooftop quiet moment
export const rooftopDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "For a moment, the noise stops. No Slack pings. No meetings. No roadmaps. Just the city skyline and the hum of the air conditioning. You take a breath.",
    options: [
      {
        text: "I needed this.",
        statChanges: { energy: 10 },
        consequence: '+10 Energy — Rest matters',
        nextNodeId: 'reflection',
        tags: ['self_aware'],
      },
      {
        text: "...Back to work.",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        nextNodeId: 'back_to_work',
        tags: ['grinder'],
      },
    ],
  },
  {
    id: 'reflection',
    speaker: 'NARRATOR',
    text: "Sometimes the most productive thing you can do is nothing at all. The voice in your head disagrees. It always does.",
  },
  {
    id: 'back_to_work',
    speaker: 'NARRATOR',
    text: "No rest for the ambitious. The voice in your head approves. It always does.",
  },
]

// Encounter 4: Pre-boss (friendly coworker from L3 if exists)
export const preBossCoworkerDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Friendly Coworker',
    text: "That voice in your head — the one that says you don't belong? Everyone hears it. The question is whether you let it drive.",
    options: [
      {
        text: "What voice?",
        statChanges: { energy: -3 },
        consequence: '-3 Energy — Denial costs energy',
        nextNodeId: 'denial',
        tags: ['denial'],
      },
      {
        text: "I know exactly what you mean.",
        statChanges: { reputation: 3, energy: 3 },
        consequence: '+3 Reputation, +3 Energy',
        nextNodeId: 'acceptance',
        tags: ['self_aware', 'vulnerable'],
      },
    ],
  },
  {
    id: 'denial',
    speaker: 'Friendly Coworker',
    text: "Sure. No voice. Just... be careful in the Mirror Room. It has a way of showing you things you don't want to see.",
  },
  {
    id: 'acceptance',
    speaker: 'Friendly Coworker',
    text: "Good. Then you'll be ready. The Mirror Room is ahead. It's not about fighting — it's about surviving what you see. Good luck.",
  },
]

// Meeting Battle: Q3 Planning Review
export const q3PlanningMeetingDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Director of Strategy',
    text: "Alright team, let's align on Q3 deliverables. We need to synergize across verticals and leverage our core competencies. Who wants to kick us off?",
    options: [
      { text: '"I\'ve prepared a deck on cross-functional alignment."', nextNodeId: 'deck', statChanges: { reputation: 5, energy: -8 }, consequence: '+5 Rep, -8 Energy — ambitious opener' },
      { text: '"Let\'s start with the data."', nextNodeId: 'data', statChanges: { reputation: 3, energy: -3 }, consequence: '+3 Rep, -3 Energy — safe play' },
      { text: '"Can we take this offline?"', nextNodeId: 'offline', statChanges: { reputation: -3 }, consequence: '-3 Rep — wrong answer in a meeting battle' },
    ],
  },
  {
    id: 'deck',
    speaker: 'Director of Strategy',
    text: "Impressive initiative! Now — who owns the action items from last quarter? Because I'm seeing a lot of red on the tracker.",
    options: [
      { text: '"I\'ll own the blockers."', nextNodeId: 'own_it', statChanges: { energy: -10, reputation: 8 }, consequence: '-10 Energy, +8 Rep — bold commitment' },
      { text: '"Per the RACI matrix, that\'s cross-team."', nextNodeId: 'deflect', statChanges: { energy: -3 }, consequence: '-3 Energy — corporate judo' },
    ],
  },
  {
    id: 'data',
    speaker: 'Director of Strategy',
    text: "Good, good. The data says we're behind on OKRs. Any blockers we should flag?",
    options: [
      { text: '"No blockers, all green."', nextNodeId: 'own_it', statChanges: { reputation: 5 }, consequence: '+5 Rep — confident' },
      { text: '"Actually, we need to discuss resourcing."', nextNodeId: 'honest', statChanges: { reputation: -2, network: 5 }, consequence: '-2 Rep, +5 Network — honest gets allies' },
    ],
  },
  {
    id: 'offline',
    speaker: 'Director of Strategy',
    text: "...We're literally IN the meeting. This IS the online. But fine, noted. Moving on without your input.",
    options: [
      { text: 'Stare at your laptop.', nextNodeId: 'survive', statChanges: { energy: -5 }, consequence: '-5 Energy — painful silence' },
    ],
  },
  {
    id: 'own_it',
    speaker: 'Director of Strategy',
    text: "Excellent! Any final thoughts before we wrap? I want to leave with clear next steps.",
    options: [
      { text: '"Let\'s circle back next week with updates."', statChanges: { reputation: 5, energy: -3 }, consequence: '+5 Rep, -3 Energy — MEETING SURVIVED!' },
      { text: '"I think we\'re aligned."', statChanges: { reputation: 3 }, consequence: '+3 Rep — MEETING SURVIVED!' },
    ],
  },
  {
    id: 'deflect',
    speaker: 'Director of Strategy',
    text: "The RACI matrix... right. Well, someone needs to own this. Any volunteers? ...Anyone?",
    options: [
      { text: '"I\'ll take point."', statChanges: { reputation: 8, energy: -8 }, consequence: '+8 Rep, -8 Energy — MEETING SURVIVED! (barely)' },
      { text: 'Stay silent.', statChanges: { reputation: -5 }, consequence: '-5 Rep — cowardice noted. MEETING SURVIVED.' },
    ],
  },
  {
    id: 'honest',
    speaker: 'Director of Strategy',
    text: "Hmm. Fair point. I appreciate the transparency. Let's flag it up. Anything else?",
    options: [
      { text: '"That covers it."', statChanges: { reputation: 3 }, consequence: '+3 Rep — MEETING SURVIVED with integrity!' },
    ],
  },
  {
    id: 'survive',
    speaker: 'Director of Strategy',
    text: "Alright, that's a wrap. Action items will be in the follow-up email. Which nobody will read.",
    options: [
      { text: 'Close your laptop.', consequence: 'MEETING SURVIVED — barely.' },
    ],
  },
]
