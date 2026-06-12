import type { HallwayEvent } from '../types'

// ─── HALLWAY EVENTS ──────────────────────────────────────────
export const HALLWAY_EVENTS: HallwayEvent[] = [
  {
    id: 'coffee_machine',
    title: 'BREAK ROOM',
    desc: 'You stumble upon an unattended coffee machine. The good stuff \u2014 not that instant garbage.',
    emoji: '\u2615',
    choices: [
      {
        label: 'Grab a double shot',
        effect: { hp: 25 },
        result: 'The caffeine hits immediately. You feel alive again.',
        isGood: true,
      },
      {
        label: 'Take the whole pot',
        effect: { hp: 40, def: -2 },
        result:
          "You chug the entire pot. Jittery but ENERGIZED. Your hands won't stop shaking though.",
        isGood: true,
      },
      {
        label: 'Pass \u2014 stay focused',
        effect: { atk: 1 },
        result: 'Discipline over comfort. Your resolve strengthens.',
        isGood: true,
      },
    ],
  },
  {
    id: 'office_gossip',
    title: 'WATER COOLER',
    desc: 'Two VPs are whispering by the water cooler. You could eavesdrop and learn about your next opponent...',
    emoji: '\uD83D\uDDE3\uFE0F',
    choices: [
      {
        label: 'Eavesdrop carefully',
        effect: { atk: 2 },
        result: 'You overhear their weaknesses. Knowledge is power.',
        isGood: true,
      },
      {
        label: 'Join the conversation',
        effect: { def: 1, hp: -10 },
        result: 'They rope you into a 20-minute chat about golf. Draining, but they like you now.',
        isGood: true,
      },
      {
        label: 'Walk past quickly',
        effect: { hp: 10 },
        result: 'You avoid the drama. Peace of mind is its own reward.',
        isGood: true,
      },
    ],
  },
  {
    id: 'sensitivity_training',
    title: 'MANDATORY TRAINING',
    desc: 'HR ambushes you. "We need you for a quick sensitivity training. It\'ll only take an hour."',
    emoji: '\uD83D\uDCCB',
    choices: [
      {
        label: 'Attend willingly',
        effect: { def: 2, hp: -25 },
        result:
          'It was NOT quick. But you learned about "psychological safety" which is... something.',
        isGood: true,
      },
      {
        label: 'Fake a meeting conflict',
        effect: { atk: 1 },
        result: '"Sorry, syncing with stakeholders!" You dodge it smoothly. Confidence boost.',
        isGood: true,
      },
      {
        label: 'Actually engage',
        effect: { def: 3, hp: -30, ppRestore: 2 },
        result: 'You genuinely participate. HR is shocked. You feel weirdly refreshed.',
        isGood: true,
      },
    ],
  },
  {
    id: 'supply_closet',
    title: 'SUPPLY CLOSET',
    desc: "The supply closet is unlocked. Inside: premium sticky notes, a Red Bull, and someone's hidden snack stash.",
    emoji: '\uD83D\uDCE6',
    choices: [
      {
        label: 'Grab the Red Bull',
        effect: { hp: 20, atk: 1 },
        result: 'Wings acquired. You feel unstoppable (for about 45 minutes).',
        isGood: true,
      },
      {
        label: 'Raid the snack stash',
        effect: { hp: 20, ppRestore: 3 },
        result: 'Trail mix, protein bars, and... is that a full sleeve of Oreos? Jackpot.',
        isGood: true,
      },
      {
        label: 'Take the sticky notes',
        effect: { def: 2 },
        result: 'Premium 3M Super Sticky notes. Your organizational armor is now impenetrable.',
        isGood: true,
      },
    ],
  },
  {
    id: 'elevator_pitch',
    title: 'ELEVATOR ENCOUNTER',
    desc: "You're stuck in the elevator with the CEO for 30 floors. They look at you expectantly.",
    emoji: '\uD83D\uDEBB',
    choices: [
      {
        label: 'Pitch your idea',
        effect: { atk: 3, hp: -15 },
        result: '"Interesting. Send me a deck." Your heart is POUNDING but your confidence soars.',
        isGood: true,
      },
      {
        label: 'Make small talk',
        effect: { def: 1, hp: 10 },
        result: '"Nice weather, right?" The CEO smiles. You survive. That\'s a win.',
        isGood: true,
      },
      {
        label: 'Stare at your phone',
        effect: { hp: -20, def: -1 },
        result:
          'The CEO notices. Noted. Literally \u2014 they wrote something down. Your reputation takes a hit.',
        isGood: false,
      },
    ],
  },
  {
    id: 'printer_jam',
    title: 'PRINTER CRISIS',
    desc: "The printer is jammed. A line of 6 people is forming. You're the only one who might know how to fix it.",
    emoji: '\uD83D\uDDA8\uFE0F',
    choices: [
      {
        label: 'Fix it heroically',
        effect: { atk: 2, def: 1 },
        result: 'You clear the jam. The crowd applauds. You are now the Office Hero.',
        isGood: true,
      },
      {
        label: "Pretend you didn't see",
        effect: { hp: 5 },
        result: 'Not your problem. You slip away with your sanity intact.',
        isGood: true,
      },
      {
        label: 'Kick it',
        effect: { atk: 3, hp: -10 },
        result:
          'It... actually works? The printer whirs to life. Your foot hurts but respect is earned.',
        isGood: true,
      },
    ],
  },
  {
    id: 'birthday_cake',
    title: 'BIRTHDAY PARTY',
    desc: "Someone you barely know is having a birthday in the break room. There's cake.",
    emoji: '\uD83C\uDF82',
    choices: [
      {
        label: 'Eat cake, sing along',
        effect: { hp: 25, ppRestore: 2 },
        result: 'The cake is surprisingly good. Costco sheet cake never disappoints.',
        isGood: true,
      },
      {
        label: 'Take cake, skip singing',
        effect: { hp: 20 },
        result: 'You ninja a corner piece and disappear. Efficient.',
        isGood: true,
      },
      {
        label: 'Skip it entirely',
        effect: { atk: 1 },
        result: '"Too busy crushing it." You channel the grind energy.',
        isGood: true,
      },
    ],
  },
  {
    id: 'it_ticket',
    title: 'IT HELP DESK',
    desc: "The IT desk has one spot open. You could get your laptop looked at \u2014 it's been running slow.",
    emoji: '\uD83D\uDCBB',
    choices: [
      {
        label: 'Get a RAM upgrade',
        effect: { atk: 2, def: 1 },
        result: '16GB \u2192 32GB. Your machine (and your mind) runs faster.',
        isGood: true,
      },
      {
        label: 'Clear the bloatware',
        effect: { ppRestore: 4 },
        result: 'They remove 14 startup programs. Everything feels fresh.',
        isGood: true,
      },
      {
        label: '"It\'s fine, actually"',
        effect: { hp: 5 },
        result: 'You walk away. The slow laptop builds character. Allegedly.',
        isGood: true,
      },
    ],
  },
  {
    id: 'all_hands',
    title: 'ALL-HANDS MEETING',
    desc: "The CEO is doing a surprise all-hands. Attendance is 'optional' (it's not optional).",
    emoji: '📢',
    choices: [
      {
        label: 'Ask a tough question',
        effect: { atk: 3, hp: -30 },
        result:
          '"Great question." Dead silence. You\'re either a hero or unemployable. Either way — power move.',
        isGood: true,
      },
      {
        label: 'Clap at the right moments',
        effect: { def: 2, hp: 10 },
        result: "You master the art of strategic applause. Leadership notices. You're 'aligned.'",
        isGood: true,
      },
      {
        label: 'Multitask through it',
        effect: { ppRestore: 3 },
        result: 'You clear 47 Slack messages. The CEO drones on. Efficient.',
        isGood: true,
      },
    ],
  },
  {
    id: 'team_lunch',
    title: 'TEAM LUNCH',
    desc: 'Someone organized a team lunch at that expensive sushi place. Your card is already on file.',
    emoji: '🍣',
    choices: [
      {
        label: 'Order the omakase',
        effect: { hp: 30, def: -2 },
        result: 'Best meal in months. Your wallet screams. Your soul sings.',
        isGood: true,
      },
      {
        label: 'Just get the bento box',
        effect: { hp: 25, atk: 1 },
        result:
          'Sensible and satisfying. You save money AND feel good. The rarest corporate combo.',
        isGood: true,
      },
      {
        label: 'Expense it',
        effect: { atk: 2, def: 1 },
        result: '"Business development lunch." You\'ll deal with finance later. Confidence surges.',
        isGood: true,
      },
    ],
  },
  {
    id: 'server_room',
    title: 'SERVER ROOM',
    desc: 'You hear frantic beeping from the server room. The door is propped open with a shoe.',
    emoji: '🖥️',
    choices: [
      {
        label: 'Investigate',
        effect: { atk: 3, hp: -10 },
        result:
          "You find and fix a runaway process. Nobody will ever know — except you. And that's enough.",
        isGood: true,
      },
      {
        label: 'Report it to IT',
        effect: { def: 2 },
        result:
          'IT owes you one. They slip you a keyboard shortcut cheat sheet. +DEF from efficiency.',
        isGood: true,
      },
      {
        label: 'Close the door',
        effect: { hp: 15 },
        result:
          'Not your problem. You walk away with the peace of a person who maintains boundaries.',
        isGood: true,
      },
    ],
  },
  {
    id: 'performance_review',
    title: 'SURPRISE REVIEW',
    desc: "Your skip-level just scheduled a 1:1 in 10 minutes. Subject: 'Quick Chat.' Nothing quick is ever quick.",
    emoji: '😰',
    choices: [
      {
        label: 'Prep talking points',
        effect: { atk: 2, def: 2 },
        result:
          "You walk in armed with receipts. The 'quick chat' becomes a promotion conversation.",
        isGood: true,
      },
      {
        label: 'Wing it',
        effect: { atk: 4, hp: -25 },
        result:
          "You speak from the heart. Raw. Unfiltered. They're either impressed or concerned. ATK goes way up.",
        isGood: true,
      },
      {
        label: 'Reschedule',
        effect: { hp: 20, ppRestore: 2 },
        result: '"Can we do Thursday?" Bought yourself time and mental space.',
        isGood: true,
      },
    ],
  },
]
