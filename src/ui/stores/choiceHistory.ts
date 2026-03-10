import { create } from 'zustand'

export interface ChoiceRecord {
  dialogueId: string
  nodeId: string
  optionIndex: number
  tags: string[]
  levelId: string
}

interface ChoiceHistoryState {
  choices: ChoiceRecord[]
  recordChoice: (choice: ChoiceRecord) => void
  hasTag: (tag: string) => boolean
  countTag: (tag: string) => number
  getChoicesForDialogue: (dialogueId: string) => ChoiceRecord[]
  clearHistory: () => void
}

export const useChoiceHistory = create<ChoiceHistoryState>((set, get) => ({
  choices: [],

  recordChoice: (choice) =>
    set((state) => ({ choices: [...state.choices, choice] })),

  hasTag: (tag) => get().choices.some((c) => c.tags.includes(tag)),

  countTag: (tag) => get().choices.filter((c) => c.tags.includes(tag)).length,

  getChoicesForDialogue: (dialogueId) =>
    get().choices.filter((c) => c.dialogueId === dialogueId),

  clearHistory: () => set({ choices: [] }),
}))
