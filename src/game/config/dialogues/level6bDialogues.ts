import { DialogueNode } from '../../../ui/stores/dialogueState'

// Garage startup — first hire
export const firstHireDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'First Hire',
    text: "So this is it? A garage, a whiteboard, and a dream? ...I'm in. What are we building?",
    options: [
      {
        text: "Something that changes everything.",
        statChanges: { reputation: 3, energy: 3 },
        consequence: '+3 Reputation, +3 Energy — Visionary',
        nextNodeId: 'plan',
        tags: ['visionary'],
      },
      {
        text: "Something that works. Then we iterate.",
        statChanges: { cash: 5 },
        consequence: '+5 Cash — Practical founder',
        nextNodeId: 'plan',
        tags: ['pragmatic'],
      },
    ],
  },
  {
    id: 'plan',
    speaker: 'First Hire',
    text: "I like it. The burn rate starts now though. Every second costs money. Let's ship something before the savings run out.",
  },
]

// Investor Pitch encounter
export const investorPitchDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Angel Investor',
    text: "You've got 60 seconds. What's the pitch?",
    options: [
      {
        text: '"We\'re building the tool every PM wishes existed. $50K MRR in 6 months or I\'ll give you the equity back."',
        statCheck: { stat: 'reputation', comparison: 'gte', threshold: 50 },
        statChanges: { cash: 15, reputation: 5 },
        consequence: '+15 Cash, +5 Reputation — Funded!',
        nextNodeId: 'funded',
        tags: ['hustler', 'funded'],
      },
      {
        text: '"We solve scope creep. Every enterprise wastes 30% of engineering time on it. We fix that."',
        statChanges: { cash: 10, network: 3 },
        consequence: '+10 Cash, +3 Network — Seed round',
        nextNodeId: 'funded',
        tags: ['strategic'],
      },
      {
        text: '"Honestly? I don\'t have a perfect pitch. But I have 3 paying customers and growing 20% month over month."',
        statChanges: { cash: 8, reputation: 5, network: 5 },
        consequence: '+8 Cash, +5 Rep, +5 Network — Authenticity wins',
        nextNodeId: 'funded',
        tags: ['authentic'],
      },
    ],
  },
  {
    id: 'funded',
    speaker: 'Angel Investor',
    text: "Interesting. Send me the deck. And the bank details. Welcome to the game, founder.",
  },
]

// Pre-boss: Launch venue
export const launchVenueDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "The launch venue is packed. Your product is on the big screen. The Algorithm — the system that decides what gets seen — is watching. Ship it or die trying.",
    options: [
      {
        text: "Let's go.",
        statChanges: { energy: 5 },
        consequence: '+5 Energy — Launch energy',
        tags: ['determined'],
      },
    ],
  },
]
