import { DialogueNode } from '../../../ui/stores/dialogueState'

// Morning: Boardroom meeting
export const morningBoardroomDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Board Member',
    text: "The quarterly numbers look good. But the board has concerns about your... extracurricular project.",
    options: [
      {
        text: '"It\'s not extracurricular. It\'s the future of this company."',
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation — Bold',
        nextNodeId: 'defend',
        tags: ['visionary'],
      },
      {
        text: '"Let me walk you through the synergy between my role here and the startup."',
        statChanges: { network: 5, reputation: 3 },
        consequence: '+5 Network, +3 Reputation — Political skill',
        nextNodeId: 'defend',
        tags: ['diplomat'],
      },
    ],
  },
  {
    id: 'defend',
    speaker: 'Board Member',
    text: "...Continue. You have our attention.",
  },
]

// Afternoon: Garage session
export const afternoonGarageDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Co-founder',
    text: "You look tired. Board meeting again? Don't worry — we shipped the feature while you were in there. Users love it.",
    options: [
      {
        text: "That's why this works. We cover each other.",
        statChanges: { energy: 5, network: 3 },
        consequence: '+5 Energy, +3 Network — Partnership',
        tags: ['collaborative'],
      },
    ],
  },
]

// Evening: Rooftop reflection
export const eveningReflectionDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "The city below is split — corporate towers to the left, garage lights to the right. You stand in between, belonging to both worlds. Somehow, it works.",
    options: [
      {
        text: "Not everyone can do this.",
        statChanges: { reputation: 3, energy: 3 },
        consequence: '+3 Reputation, +3 Energy',
        nextNodeId: 'reflection',
        tags: ['self_aware'],
      },
    ],
  },
  {
    id: 'reflection',
    speaker: 'NARRATOR',
    text: "You know that. The question is: do you keep this balance, or is one world eventually going to win?",
    options: [
      {
        text: "Both. On my own terms.",
        statChanges: { reputation: 5, cash: 5, energy: 5, network: 5 },
        consequence: '+5 All Stats — This is the hybrid path',
        tags: ['hybrid_affirmed'],
      },
    ],
  },
]

// Night: Product launch
export const nightLaunchDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Emcee',
    text: "Ladies and gentlemen, the product that proves you don't have to choose between scale and soul. Built inside the machine, launched from the garage. Please welcome the founder.",
    options: [
      {
        text: '"Thank you. Let me show you what happens when you refuse to pick a lane."',
        statChanges: { reputation: 10, network: 5 },
        consequence: '+10 Reputation, +5 Network — Standing ovation',
        tags: ['showman'],
      },
    ],
  },
]

// Dawn: Final scene
export const dawnDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "You didn't choose between the ladder and the leap.\nYou built the ladder while leaping.\nNot everyone can do this. You know that.\nBut you're not everyone.",
  },
]
