import { create } from "zustand";
import type {
  DialogueNode,
  DialogueTree,
  DialogueOption,
  StatCheck,
} from "../../game/config/dialogueTypes";
import { usePlayerStats, type StatName } from "./playerStats";
import { useChoiceHistory } from "./choiceHistory";

interface DialogueState {
  isOpen: boolean;
  currentNode: DialogueNode | null;
  tree: DialogueTree;
  dialogueId: string;
  levelId: string;

  /** Consequence text shown briefly after picking an option */
  consequence: string | null;

  openDialogue: (
    startNodeId: string,
    tree: DialogueTree,
    dialogueId: string,
    levelId: string,
  ) => void;
  selectOption: (optionIndex: number) => void;
  advanceOrClose: () => void;
  closeDialogue: () => void;
}

function checkStat(check: StatCheck): boolean {
  const val = usePlayerStats.getState()[check.stat as StatName];
  return check.comparison === "gte" ? val >= check.threshold : val <= check.threshold;
}

function getVisibleOptions(node: DialogueNode): DialogueOption[] {
  if (!node.options) return [];
  return node.options.filter((o) => !o.statCheck || checkStat(o.statCheck));
}

export const useDialogueState = create<DialogueState>((set, get) => ({
  isOpen: false,
  currentNode: null,
  tree: [],
  dialogueId: "",
  levelId: "",
  consequence: null,

  openDialogue: (startNodeId, tree, dialogueId, levelId) => {
    const node = tree.find((n) => n.id === startNodeId) ?? null;
    set({
      isOpen: true,
      currentNode: node,
      tree,
      dialogueId,
      levelId,
      consequence: null,
    });
  },

  selectOption: (optionIndex) => {
    const { currentNode, tree, dialogueId, levelId } = get();
    if (!currentNode?.options) return;

    const visible = getVisibleOptions(currentNode);
    const option = visible[optionIndex];
    if (!option) return;

    // Apply stat changes
    if (option.statChanges) {
      usePlayerStats
        .getState()
        .modifyStats(option.statChanges, `dialogue:${dialogueId}:${currentNode.id}`);
    }

    // Record choice
    useChoiceHistory.getState().recordChoice({
      dialogueId,
      optionIndex,
      tags: option.tags ?? [],
      levelId,
    });

    // Show consequence or advance immediately
    if (option.consequence) {
      set({ consequence: option.consequence });
      // After 1.5s, advance to next node or close
      setTimeout(() => {
        const next = option.nextNodeId
          ? tree.find((n) => n.id === option.nextNodeId) ?? null
          : null;
        if (next) {
          set({ currentNode: next, consequence: null });
        } else {
          get().closeDialogue();
        }
      }, 1500);
    } else {
      const next = option.nextNodeId
        ? tree.find((n) => n.id === option.nextNodeId) ?? null
        : null;
      if (next) {
        set({ currentNode: next, consequence: null });
      } else {
        get().closeDialogue();
      }
    }
  },

  advanceOrClose: () => {
    // For nodes with no options: tap to close
    get().closeDialogue();
  },

  closeDialogue: () => {
    set({
      isOpen: false,
      currentNode: null,
      tree: [],
      dialogueId: "",
      levelId: "",
      consequence: null,
    });
  },
}));

/** Helper for use in React components */
export function getVisibleOptionsForNode(node: DialogueNode): DialogueOption[] {
  return getVisibleOptions(node);
}
