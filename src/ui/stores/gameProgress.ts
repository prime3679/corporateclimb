import { create } from 'zustand'

export type PathChoice = 'corporate' | 'pivot' | 'hybrid' | null

interface GameProgressState {
  currentLevel: string
  completedLevels: string[]
  pathChoice: PathChoice
  setCurrentLevel: (level: string) => void
  completeLevel: (level: string) => void
  setPathChoice: (choice: PathChoice) => void
  hasCompleted: (level: string) => boolean
}

export const useGameProgress = create<GameProgressState>((set, get) => ({
  currentLevel: 'level1',
  completedLevels: [],
  pathChoice: null,

  setCurrentLevel: (level) => set({ currentLevel: level }),

  completeLevel: (level) =>
    set((state) => ({
      completedLevels: state.completedLevels.includes(level)
        ? state.completedLevels
        : [...state.completedLevels, level],
    })),

  setPathChoice: (choice) => set({ pathChoice: choice }),

  hasCompleted: (level) => get().completedLevels.includes(level),
}))
