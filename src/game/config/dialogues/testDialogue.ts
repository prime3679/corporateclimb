import type { DialogueTree } from "../dialogueTypes";

/**
 * Test dialogue: a mysterious intern offers you coffee in the break room.
 * Three nodes with branching choices that affect stats.
 */
export const testDialogue: DialogueTree = [
  {
    id: "start",
    speaker: "Mysterious Intern",
    text: "Hey, you look new here. I've got an extra coffee and some insider info about this place. Interested?",
    options: [
      {
        text: "Sure, I'll take the coffee!",
        statChanges: { energy: 10 },
        consequence: "+10 Energy",
        nextNodeId: "coffee_accepted",
        tags: ["diplomat"],
      },
      {
        text: "What kind of info? I'm always networking.",
        statChanges: { network: 10 },
        consequence: "+10 Network",
        nextNodeId: "info_path",
        tags: ["hustler"],
      },
      {
        text: "I don't take favors from strangers.",
        statChanges: { reputation: 5 },
        consequence: "+5 Reputation",
        tags: ["rebel"],
      },
    ],
  },
  {
    id: "coffee_accepted",
    speaker: "Mysterious Intern",
    text: "Good choice. The break room coffee is terrible, but I have a secret stash. By the way, there's a big meeting today — you could use it to make a good impression.",
    options: [
      {
        text: "I'll speak up in the meeting.",
        statChanges: { reputation: 15, energy: -5 },
        consequence: "+15 Reputation, -5 Energy",
        tags: ["hustler"],
      },
      {
        text: "I'll just observe and learn for now.",
        statChanges: { network: 5 },
        consequence: "+5 Network",
        tags: ["diplomat"],
      },
    ],
  },
  {
    id: "info_path",
    speaker: "Mysterious Intern",
    text: "Word is, there's a promotion opening up on the 5th floor. But you'll need either connections or cold hard cash to get noticed. Which is your style?",
    options: [
      {
        text: "I know some people. Let me work my contacts.",
        statChanges: { network: 10, cash: -10 },
        consequence: "+10 Network, -10 Cash",
        statCheck: { stat: "network", threshold: 30, comparison: "gte" },
        tags: ["diplomat"],
      },
      {
        text: "Money talks. I'll invest in my image.",
        statChanges: { cash: -15, reputation: 10 },
        consequence: "-15 Cash, +10 Reputation",
        statCheck: { stat: "cash", threshold: 40, comparison: "gte" },
        tags: ["hustler"],
      },
      {
        text: "Promotions are a scam. I'll make my own path.",
        statChanges: { reputation: 5, energy: 5 },
        consequence: "+5 Reputation, +5 Energy",
        tags: ["rebel"],
      },
    ],
  },
];
