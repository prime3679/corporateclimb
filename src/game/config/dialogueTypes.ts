/** Stat check for conditional dialogue options */
export interface StatCheck {
  stat: "energy" | "reputation" | "network" | "cash";
  threshold: number;
  comparison: "gte" | "lte";
}

/** Partial stat changes applied when choosing a dialogue option */
export type StatChanges = Partial<
  Record<"energy" | "reputation" | "network" | "cash", number>
>;

/** A single option the player can pick in a dialogue node */
export interface DialogueOption {
  text: string;
  statChanges?: StatChanges;
  statCheck?: StatCheck;
  nextNodeId?: string;
  tags?: string[];
  consequence?: string;
}

/** A single node in a dialogue tree */
export interface DialogueNode {
  id: string;
  speaker: string;
  text: string;
  options?: DialogueOption[];
}

/** A full dialogue tree is just an array of nodes keyed by id */
export type DialogueTree = DialogueNode[];
