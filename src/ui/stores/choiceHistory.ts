import { create } from "zustand";

export interface ChoiceRecord {
  dialogueId: string;
  optionIndex: number;
  tags: string[];
  levelId: string;
}

interface ChoiceHistoryState {
  choices: ChoiceRecord[];
  recordChoice: (record: ChoiceRecord) => void;
  countTag: (tag: string) => number;
  reset: () => void;
}

export const useChoiceHistory = create<ChoiceHistoryState>((set, get) => ({
  choices: [],

  recordChoice: (record) =>
    set((state) => ({ choices: [...state.choices, record] })),

  countTag: (tag) =>
    get().choices.reduce(
      (n, c) => n + (c.tags.includes(tag) ? 1 : 0),
      0,
    ),

  reset: () => set({ choices: [] }),
}));
