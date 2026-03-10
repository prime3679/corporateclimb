import { DialogueNode } from '../../../ui/stores/dialogueState'

// Encounter 1: Quad Student — tutorial intro + archetype choice
export const quadStudentDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Upperclassman',
    text: "Yo, freshman! Welcome to State U. Word of advice — this place rewards hustle, connections, or just being smart about your energy. What's your move?",
    options: [
      {
        text: "I'm here to network. Who should I know?",
        statChanges: { network: 5 },
        consequence: '+5 Network',
        nextNodeId: 'network_path',
        tags: ['diplomat', 'networker'],
      },
      {
        text: "I'm going to grind harder than everyone else.",
        statChanges: { energy: 5 },
        consequence: '+5 Energy',
        nextNodeId: 'grind_path',
        tags: ['hustler'],
      },
      {
        text: "I'll figure it out. No plan needed.",
        statChanges: { reputation: 3, cash: 3 },
        consequence: '+3 Reputation, +3 Cash',
        nextNodeId: 'yolo_path',
        tags: ['rebel', 'independent'],
      },
    ],
  },
  {
    id: 'network_path',
    speaker: 'Upperclassman',
    text: "Smart. The Career Center has mixers every week. Hit those early and you'll have an edge come internship season. Oh — and avoid Professor No-Curve. Trust me.",
    options: [
      {
        text: 'Thanks for the heads up.',
        statChanges: { network: 2 },
        consequence: '+2 Network',
        tags: ['polite'],
      },
    ],
  },
  {
    id: 'grind_path',
    speaker: 'Upperclassman',
    text: "Respect. Just don't burn out before midterms. I've seen it happen. The library's your best friend — grab espressos when you can.",
    options: [
      {
        text: "Burnout? I don't know the word.",
        statChanges: { energy: -3 },
        consequence: '-3 Energy',
        tags: ['overconfident'],
      },
      {
        text: "I'll pace myself. Thanks.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        tags: ['measured'],
      },
    ],
  },
  {
    id: 'yolo_path',
    speaker: 'Upperclassman',
    text: "Ha! I like the confidence. Just remember — no plan still has consequences. Good luck out there, freshman.",
  },
]

// Encounter 2: Library NPC — study vs. cram
export const libraryNpcDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Study Group Leader',
    text: "Hey, we've got a study session going. Midterms are next week. You can join us, or there's a cram guide floating around if you'd rather go solo.",
    options: [
      {
        text: 'Join the study group.',
        statChanges: { network: 5, energy: -5 },
        consequence: '+5 Network, -5 Energy',
        nextNodeId: 'group_result',
        tags: ['collaborative', 'studious'],
      },
      {
        text: 'Give me the cram guide. I work alone.',
        statChanges: { reputation: 3, energy: -8 },
        consequence: '+3 Reputation, -8 Energy',
        nextNodeId: 'solo_result',
        tags: ['loner', 'grinder'],
      },
      {
        text: "Midterms? I'll wing it.",
        statChanges: { cash: 5 },
        consequence: '+5 Cash (saved on textbooks)',
        nextNodeId: 'skip_result',
        tags: ['rebel', 'slacker'],
      },
    ],
  },
  {
    id: 'group_result',
    speaker: 'Study Group Leader',
    text: "Awesome! We meet in Room 204. Fair warning — there's a Freeloader in the group who just copies answers. Stick close and you'll learn a lot though.",
  },
  {
    id: 'solo_result',
    speaker: 'Study Group Leader',
    text: "Suit yourself. The cram guide is solid but it's a marathon. Don't forget to grab coffee from the vending machine — you'll need it.",
  },
  {
    id: 'skip_result',
    speaker: 'Study Group Leader',
    text: "Bold strategy. The curve might save you... unless you get No-Curve. Then you're on your own. Good luck.",
  },
]

// Encounter 3: Party Invite — social life vs. academics
export const partyInviteDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Party Host',
    text: "Yo freshman! Sigma Delta Whatever is throwing the biggest party of the semester TONIGHT. You in?",
    options: [
      {
        text: "Let's go! You only live once.",
        statChanges: { network: 8, energy: -12 },
        consequence: '+8 Network, -12 Energy',
        nextNodeId: 'party_result',
        tags: ['social', 'yolo'],
      },
      {
        text: "I'll swing by for an hour.",
        statChanges: { network: 4, energy: -5, reputation: 2 },
        consequence: '+4 Network, -5 Energy, +2 Rep',
        nextNodeId: 'moderate_result',
        tags: ['balanced', 'diplomat'],
      },
      {
        text: "Can't. Midterms.",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        nextNodeId: 'decline_result',
        tags: ['studious', 'disciplined'],
      },
    ],
  },
  {
    id: 'party_result',
    speaker: 'Party Host',
    text: "THAT'S what I'm talking about! You're gonna meet everyone. Just... maybe don't mention this to Professor No-Curve tomorrow.",
  },
  {
    id: 'moderate_result',
    speaker: 'Party Host',
    text: "Respect the time management. Smart move — make the connections, keep the GPA. I see you.",
  },
  {
    id: 'decline_result',
    speaker: 'Party Host',
    text: "Wow. Actually responsible. I barely remember what that's like. Alright, good luck out there, nerd.",
  },
]

// Encounter 4: Pre-boss NPC — warning before Professor No-Curve
export const preBossDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Stressed Senior',
    text: "You're heading into No-Curve's lecture hall? Oh man. Listen — he throws everything at you. Multiple choice storms, essay questions, the whole deal. Here's what I know...",
    options: [
      {
        text: 'Tell me everything.',
        statChanges: { energy: -3 },
        consequence: '-3 Energy (from the stress of knowing)',
        nextNodeId: 'full_brief',
        tags: ['prepared'],
      },
      {
        text: "I don't need a briefing.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation',
        nextNodeId: 'skip_brief',
        tags: ['confident', 'rebel'],
      },
    ],
  },
  {
    id: 'full_brief',
    speaker: 'Stressed Senior',
    text: "Phase one: he pelts you with multiple choice — dodge those scantrons. Phase two: he makes you defend an essay topic — that's a dialogue battle. Phase three: if you survive, it's the grade appeal. Your stats matter there. Good luck.",
    options: [
      {
        text: 'Got it. Time to pass this class.',
        statChanges: { energy: 3 },
        consequence: '+3 Energy (determination)',
      },
    ],
  },
  {
    id: 'skip_brief',
    speaker: 'Stressed Senior',
    text: "Your funeral. I mean, your final. Same thing honestly.",
  },
]
