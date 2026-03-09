import type { DialogueTree } from "../dialogueTypes";

/**
 * Tutorial NPC at the quad — friendly student explains stats.
 * No choices, just exposition. Click through nodes.
 */
export const tutorialDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Friendly Senior",
    text: "Hey, welcome to campus! You look lost. Let me give you the rundown.",
  },
  {
    id: "stats_intro",
    speaker: "Friendly Senior",
    text: "You've got four things to manage here: Energy keeps you going, Reputation is how people see you, Network is who you know, and Cash... well, that's obvious.",
  },
  {
    id: "stats_tip",
    speaker: "Friendly Senior",
    text: "Every choice you make shifts those stats. Keep your Energy up or you'll burn out. Build your Network early — it pays off later. Good luck, freshman!",
  },
];

/**
 * Library NPC — study group vs solo decision.
 */
export const libraryDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Study Group Leader",
    text: "We've got a study session going for the midterm. Cramming solo or joining forces?",
    options: [
      {
        text: "I'll join the study group.",
        statChanges: { network: 10, energy: -5 },
        consequence: "+10 Network, -5 Energy",
        tags: ["diplomat"],
      },
      {
        text: "I study better alone.",
        statChanges: { energy: 5, reputation: 5 },
        consequence: "+5 Energy, +5 Reputation",
        tags: ["rebel"],
      },
      {
        text: "Can I just copy someone's notes?",
        statChanges: { energy: 10, reputation: -10 },
        consequence: "+10 Energy, -10 Reputation",
        tags: ["hustler"],
      },
    ],
  },
];

/**
 * Party invite doorway — quick decision.
 */
export const partyDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Party Host",
    text: "Yoooo! The party's popping tonight. You coming in?",
    options: [
      {
        text: "Let's go! YOLO!",
        statChanges: { network: 5, energy: -10, reputation: -5 },
        consequence: "+5 Network, -10 Energy, -5 Reputation",
        tags: ["hustler"],
      },
      {
        text: "Nah, I've got things to do.",
        statChanges: { energy: 5 },
        consequence: "+5 Energy",
        tags: ["rebel"],
      },
    ],
  },
];

/**
 * Pre-boss NPC — encouragement before the final exam.
 */
export const preBossDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Upperclassman",
    text: "The final exam is through those doors. Professor No-Curve is brutal. You ready?",
    options: [
      {
        text: "Any tips?",
        nextNodeId: "tip",
        tags: ["diplomat"],
      },
      {
        text: "Born ready. Let's do this.",
        tags: ["hustler"],
      },
    ],
  },
  {
    id: "tip",
    speaker: "Upperclassman",
    text: "Watch out for the multiple choice — only grab the green answers. And if your Reputation is high enough, you can talk your way out of the last phase. Good luck!",
  },
];

/**
 * Boss Phase 2 — Essay Defense dialogue prompts.
 * Three rapid-fire questions with 2 options each.
 */
export const bossEssayDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Professor No-Curve",
    text: "Essay section! Defend your thesis: What is the primary driver of economic growth?",
    options: [
      {
        text: "Innovation and technological advancement.",
        statChanges: {},
        consequence: "Correct! Boss takes damage!",
        nextNodeId: "essay_2",
        tags: ["correct"],
      },
      {
        text: "Vibes and good intentions.",
        statChanges: { energy: -5 },
        consequence: "Wrong! -5 Energy",
        nextNodeId: "essay_2",
        tags: ["wrong"],
      },
    ],
  },
  {
    id: "essay_2",
    speaker: "Professor No-Curve",
    text: "Question 2: What determines a company's competitive advantage?",
    options: [
      {
        text: "Unique value proposition and execution.",
        statChanges: {},
        consequence: "Correct! Boss takes damage!",
        nextNodeId: "essay_3",
        tags: ["correct"],
      },
      {
        text: "Having the coolest office.",
        statChanges: { energy: -5 },
        consequence: "Wrong! -5 Energy",
        nextNodeId: "essay_3",
        tags: ["wrong"],
      },
    ],
  },
  {
    id: "essay_3",
    speaker: "Professor No-Curve",
    text: "Final question: What's the most important skill for career success?",
    options: [
      {
        text: "Adaptability and continuous learning.",
        statChanges: {},
        consequence: "Correct! Boss takes damage!",
        tags: ["correct"],
      },
      {
        text: "Memorizing textbooks word for word.",
        statChanges: { energy: -5 },
        consequence: "Wrong! -5 Energy",
        tags: ["wrong"],
      },
    ],
  },
];

/**
 * Boss Phase 3 — Grade Appeal. Options gated by Reputation.
 */
export const bossAppealDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Professor No-Curve",
    text: "Fine! I'll hear your grade appeal. Make your case.",
    options: [
      {
        text: "My work speaks for itself. Check my record.",
        statCheck: { stat: "reputation", threshold: 50, comparison: "gte" },
        consequence: "Your reputation precedes you. A+!",
        tags: ["diplomat", "best_ending"],
      },
      {
        text: "I worked hard this semester. Please reconsider.",
        statChanges: { energy: -5 },
        consequence: "Adequate effort. B+. Boss defeated!",
        tags: ["diplomat"],
      },
      {
        text: "This grade is unfair and I'll take it to the dean.",
        statChanges: { reputation: -5 },
        consequence: "Bold move. C+. But the boss backs down!",
        tags: ["rebel"],
      },
    ],
  },
];
