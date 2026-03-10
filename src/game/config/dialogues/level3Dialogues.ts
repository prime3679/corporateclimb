import { DialogueNode } from '../../../ui/stores/dialogueState'

// Encounter 1: Lobby Security Guard
export const lobbyGuardDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Security Guard',
    text: "First day? Badge works on the second try if you're lucky. Third if it hates you. Welcome to corporate.",
    options: [
      {
        text: "Thanks. Any tips for surviving in there?",
        statChanges: { network: 3 },
        consequence: '+3 Network',
        nextNodeId: 'tips',
        tags: ['polite', 'prepared'],
      },
      {
        text: "I've done harder things than badge a turnstile.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        nextNodeId: 'confident',
        tags: ['confident'],
      },
    ],
  },
  {
    id: 'tips',
    speaker: 'Security Guard',
    text: "Don't eat the fish from the break room fridge. Make friends with the admins — they run this place, not management. And watch out for the guy who takes credit for everything.",
    options: [
      { text: 'Noted. Thanks.', statChanges: { energy: 3 }, consequence: '+3 Energy' },
    ],
  },
  {
    id: 'confident',
    speaker: 'Security Guard',
    text: "Ha! That's what they all say on day one. Check in with me in six months. Badge. Turnstile. Go.",
  },
]

// Encounter 2: Kitchen Fridge Note
export const fridgeNoteDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Fridge Note',
    text: '"To whoever keeps taking my clearly labeled lunch: I WILL find you. This is your FINAL warning. — Karen from Accounting." There\'s a second note underneath.',
    options: [
      {
        text: 'Read the second note.',
        nextNodeId: 'note2',
        tags: ['curious'],
      },
      {
        text: 'Check the fridge for anything useful.',
        statChanges: { energy: 5 },
        consequence: '+5 Energy (found an espresso)',
        nextNodeId: 'espresso',
        tags: ['practical'],
      },
    ],
  },
  {
    id: 'note2',
    speaker: 'Fridge Note #2',
    text: '"Karen — it was me. I\'m sorry. But your pasta was incredible. Can you teach me the recipe? — Anonymous (but it was Dave from Sales)"',
    options: [
      { text: 'Humanity persists even in corporate.', statChanges: { reputation: 2 }, consequence: '+2 Reputation' },
    ],
  },
  {
    id: 'espresso',
    speaker: 'You',
    text: "There's a double espresso tucked behind a Tupperware wall. Score.",
  },
]

// Encounter 3: Friendly Coworker
export const friendlyCoworkerDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Friendly Coworker',
    text: "Hey, new person! Welcome to the open floor. Quick heads up — the conference rooms are intense. Back-to-back meetings all day. And watch out for that purple rectangle... they take credit for everything.",
    options: [
      {
        text: "Who's the purple rectangle?",
        statChanges: { network: 5 },
        consequence: '+5 Network',
        nextNodeId: 'credit_thief_info',
        tags: ['investigator'],
      },
      {
        text: "How do I get the skip-level to notice me?",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        nextNodeId: 'boss_hint',
        tags: ['ambitious'],
      },
      {
        text: "Any good snacks around here?",
        statChanges: { energy: 5 },
        consequence: '+5 Energy',
        nextNodeId: 'snacks',
        tags: ['casual'],
      },
    ],
  },
  {
    id: 'credit_thief_info',
    speaker: 'Friendly Coworker',
    text: "They're a manager who swoops in after you do the work and presents it as their own. You can confront them, document everything, or just... let it go. Each has consequences.",
    options: [
      { text: "I'll keep my eyes open.", statChanges: { reputation: 2 }, consequence: '+2 Reputation' },
    ],
  },
  {
    id: 'boss_hint',
    speaker: 'Friendly Coworker',
    text: "The skip-level is on the executive floor. They literally don't know your name. You need to ship something, present well, and get references. All three. Then they'll see you.",
    options: [
      { text: 'Challenge accepted.', statChanges: { reputation: 3 }, consequence: '+3 Reputation' },
    ],
  },
  {
    id: 'snacks',
    speaker: 'Friendly Coworker',
    text: "Kitchen has espressos. Rooftop sometimes has leftover catering. And there's a vending machine near the elevator that occasionally gives you two items for the price of one. It's the small wins.",
  },
]

// Encounter 4: Pre-boss Mentor
export const preBossMentorDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Mentor',
    text: "Your skip-level doesn't know your name yet. That's the game. You need to become visible. Ship the feature. Nail the presentation. Get referenced. Only then will they see you.",
    options: [
      {
        text: "How do I nail the presentation?",
        statChanges: { energy: -3 },
        consequence: '-3 Energy (anxiety)',
        nextNodeId: 'presentation_tips',
        tags: ['prepared'],
      },
      {
        text: "I'm ready. Let's do this.",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        tags: ['confident'],
      },
    ],
  },
  {
    id: 'presentation_tips',
    speaker: 'Mentor',
    text: "Keep it concise. Own your mistakes. Have a recommendation, not just data. And for the love of everything — don't say 'the data speaks for itself.' It doesn't. YOU speak for the data.",
    options: [
      {
        text: 'Best advice I\'ve gotten.',
        statChanges: { reputation: 3, energy: 5 },
        consequence: '+3 Reputation, +5 Energy (confidence boost)',
      },
    ],
  },
]

// Credit Thief confrontation dialogue
export const creditThiefDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Credit Thief Manager',
    text: "Oh, great work on that project! I was just about to present it to the leadership team. As a team effort, of course.",
    options: [
      {
        text: '"That was MY work. I\'m presenting it myself."',
        statChanges: { reputation: 8, energy: -5 },
        consequence: '+8 Reputation, -5 Energy — Confrontation is stressful',
        nextNodeId: 'confronted',
        tags: ['credit_confronted', 'direct'],
      },
      {
        text: '"I have documentation of every commit, every design doc, every review."',
        statChanges: { reputation: 5, network: 5 },
        consequence: '+5 Reputation, +5 Network — Paper trail speaks',
        nextNodeId: 'documented',
        tags: ['credit_documented', 'strategic'],
      },
      {
        text: '"...Sure. Team effort."',
        statChanges: { cash: 5, reputation: -8 },
        consequence: '+5 Cash (stayed employed), -8 Reputation',
        nextNodeId: 'ignored',
        tags: ['credit_ignored', 'passive'],
      },
    ],
  },
  {
    id: 'confronted',
    speaker: 'Credit Thief Manager',
    text: "I— well— that's not... Fine. Present it yourself. But don't think this won't have consequences.",
  },
  {
    id: 'documented',
    speaker: 'Credit Thief Manager',
    text: "...You documented everything? I— OK. Let's... let's present it together. With proper attribution. Of course.",
  },
  {
    id: 'ignored',
    speaker: 'Credit Thief Manager',
    text: "Great! I knew you were a team player. I'll make sure to mention your... support role.",
  },
]
