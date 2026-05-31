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
  reset: () => void;
}

export const useChoiceHistory = create<ChoiceHistoryState>((set) => ({
  choices: [],

  recordChoice: (record) =>
    set((state) => ({ choices: [...state.choices, record] })),

  reset: () => set({ choices: [] }),
}));
