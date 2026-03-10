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
