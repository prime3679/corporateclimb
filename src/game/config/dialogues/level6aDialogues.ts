import { DialogueNode } from '../../../ui/stores/dialogueState'

// The Lonely Lunch — environmental vignette
export const lonelyLunchDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "The executive dining room. A single place setting at a long mahogany table. The food is excellent. The silence is deafening.",
    options: [
      {
        text: "This is the cost of the corner office.",
        statChanges: { energy: -5 },
        consequence: '-5 Energy — The weight of isolation',
        tags: ['self_aware'],
      },
      {
        text: "More room at the table for me.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        tags: ['stoic'],
      },
    ],
  },
]

// VP corridor encounter
export const vpEncounterDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'VP of Engineering',
    text: "Ah, the new Director. Word of advice: up here, every conversation is a negotiation. Even this one.",
    options: [
      {
        text: "What are you negotiating for right now?",
        statChanges: { reputation: 5, network: 3 },
        consequence: '+5 Reputation, +3 Network — Sharp',
        tags: ['strategic'],
      },
      {
        text: "I appreciate the transparency.",
        statChanges: { network: 5 },
        consequence: '+5 Network — Building rapport',
        tags: ['diplomat'],
      },
    ],
  },
]

// Pre-boss: Board Room approach
export const boardRoomDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "The hallway narrows. Portraits of past executives line the walls — some smiling, some already forgotten. At the end: the corner office. The door is open. The walls are already moving.",
    options: [
      {
        text: "Let's see what I'm made of.",
        statChanges: { energy: 5 },
        consequence: '+5 Energy — Resolve',
        tags: ['determined'],
      },
    ],
  },
]
