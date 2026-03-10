import { DialogueNode } from '../../../ui/stores/dialogueState'

export const testDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Friendly Student',
    text: 'Hey! You look new here. Welcome to the grind. Fair warning — this place will test you.',
    options: [
      {
        text: "I'm ready for anything.",
        statChanges: { energy: 5 },
        consequence: '+5 Energy',
        nextNodeId: 'advice',
        tags: ['hustler'],
      },
      {
        text: "What should I know?",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        nextNodeId: 'advice',
        tags: ['diplomat'],
      },
      {
        text: "I didn't ask for a lecture.",
        statChanges: { network: -5 },
        consequence: '-5 Network',
        nextNodeId: 'shrug',
        tags: ['rebel'],
      },
    ],
  },
  {
    id: 'advice',
    speaker: 'Friendly Student',
    text: 'Keep your energy up, build your network, and watch your reputation. Cash helps too. Balance is everything.',
    options: [
      {
        text: 'Got it. Thanks.',
        statChanges: { network: 3 },
        consequence: '+3 Network',
      },
    ],
  },
  {
    id: 'shrug',
    speaker: 'Friendly Student',
    text: "Fair enough. You'll figure it out. Everyone does... eventually.",
  },
]
