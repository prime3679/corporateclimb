import { DialogueNode } from '../../../ui/stores/dialogueState'

// Mentor A — Corporate Tower path
export const mentorADialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Executive Mentor',
    text: "Scale is a drug. But the view from the top... there's nothing else like it. You've got the numbers. You've got the drive. The question is: can you handle the loneliness?",
    options: [
      {
        text: "What do you mean, loneliness?",
        nextNodeId: 'loneliness',
        tags: ['curious'],
      },
      {
        text: "I'm not here for friends. I'm here for impact.",
        statChanges: { reputation: 5 },
        consequence: '+5 Reputation',
        nextNodeId: 'impact',
        tags: ['hustler', 'ambitious'],
      },
    ],
  },
  {
    id: 'loneliness',
    speaker: 'Executive Mentor',
    text: "The higher you go, the fewer people understand what you're dealing with. Your old friends don't get it. Your new peers are competitors. Your reports need you to be invincible. It's the trade.",
    options: [
      {
        text: "Is it worth it?",
        nextNodeId: 'worth_it',
        tags: ['reflective'],
      },
      {
        text: "I can handle it.",
        statChanges: { reputation: 3, energy: -3 },
        consequence: '+3 Reputation, -3 Energy',
        tags: ['stoic'],
      },
    ],
  },
  {
    id: 'impact',
    speaker: 'Executive Mentor',
    text: "Good answer. The impact is real. Thousands of people use what you build. Millions, eventually. That's the high. Just make sure you remember why you started when the politics get thick.",
    options: [
      {
        text: "Any advice for the climb?",
        statChanges: { reputation: 5, network: 3 },
        consequence: "+5 Reputation, +3 Network — Mentor's wisdom",
        nextNodeId: 'advice',
        tags: ['prepared'],
      },
    ],
  },
  {
    id: 'worth_it',
    speaker: 'Executive Mentor',
    text: "Some days, absolutely. You're changing how people work. Other days... you wonder if the person who started this journey would recognize who you've become.",
    options: [
      {
        text: "Thank you for being honest.",
        statChanges: { energy: 5, network: 5 },
        consequence: '+5 Energy, +5 Network',
        tags: ['empathetic'],
      },
    ],
  },
  {
    id: 'advice',
    speaker: 'Executive Mentor',
    text: "Three rules: Hire people smarter than you. Say no more than you say yes. And never forget that the org chart is fiction — relationships are what's real.",
  },
]

// Mentor B — Garage/startup path
export const mentorBDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'Founder Mentor',
    text: "Freedom is expensive. Most people can't afford it. But you — I see the itch. The 'what if I just built it myself' energy. It's intoxicating. And terrifying.",
    options: [
      {
        text: "How did you know it was time to leave?",
        nextNodeId: 'timing',
        tags: ['curious', 'rebel'],
      },
      {
        text: "I'm not afraid of hard work.",
        statChanges: { energy: 3, cash: 3 },
        consequence: '+3 Energy, +3 Cash',
        nextNodeId: 'hard_work',
        tags: ['hustler'],
      },
    ],
  },
  {
    id: 'timing',
    speaker: 'Founder Mentor',
    text: "When the Sunday Scaries stopped being about Monday meetings and started being about wasting another week on someone else's roadmap. The golden handcuffs were real though. Took me 18 months to actually do it.",
    options: [
      {
        text: "What about the financial risk?",
        nextNodeId: 'risk',
        tags: ['pragmatic'],
      },
      {
        text: "I feel that. Every day.",
        statChanges: { energy: 5 },
        consequence: '+5 Energy — Resonance',
        tags: ['self_aware', 'rebel'],
      },
    ],
  },
  {
    id: 'hard_work',
    speaker: 'Founder Mentor',
    text: "It's not the hard work that gets you. It's the uncertainty. In a company, you know your paycheck's coming. Out here, you might work harder than you ever have and make zero dollars for a year.",
    options: [
      {
        text: "Any advice for someone considering it?",
        statChanges: { cash: 5, network: 3 },
        consequence: '+5 Cash, +3 Network — Practical wisdom',
        nextNodeId: 'advice',
        tags: ['prepared'],
      },
    ],
  },
  {
    id: 'risk',
    speaker: 'Founder Mentor',
    text: "Real talk? Save 12 months of runway. Don't quit on emotion. And find one person who believes in you when you don't believe in yourself. That person is worth more than any VC check.",
    options: [
      {
        text: "That's solid advice.",
        statChanges: { cash: 3, network: 5 },
        consequence: '+3 Cash, +5 Network',
        tags: ['grounded'],
      },
    ],
  },
  {
    id: 'advice',
    speaker: 'Founder Mentor',
    text: "Build something you'd use yourself. Charge money from day one. And remember: the startup world romanticizes suffering. Don't fall for it. Rest is not weakness.",
  },
]

// Rooftop garden opening NPC
export const rooftopGuideDialogue: DialogueNode[] = [
  {
    id: 'start',
    speaker: 'NARRATOR',
    text: "The golden hour hits the rooftop garden. Below, the city hums. Two paths diverge ahead — one leading up into a glass tower, the other down into a warm, cluttered garage. A clock on the wall reads 3 minutes.",
    options: [
      {
        text: "I should explore both before deciding.",
        statChanges: { energy: 3 },
        consequence: '+3 Energy — Thoughtful',
        tags: ['explorer'],
      },
      {
        text: "I already know which way I'm going.",
        statChanges: { reputation: 3 },
        consequence: '+3 Reputation — Decisive',
        tags: ['decisive'],
      },
    ],
  },
]
