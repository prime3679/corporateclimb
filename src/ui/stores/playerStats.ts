import { create } from 'zustand'

export interface StatChanges {
  energy?: number
  reputation?: number
  network?: number
  cash?: number
}

export interface StatCheck {
  stat: 'energy' | 'reputation' | 'network' | 'cash'
  threshold: number
  comparison: 'gte' | 'lte'
}

interface StatHistoryEntry {
  source: string
  changes: StatChanges
  timestamp: number
}

type StatLevel = 'low' | 'medium' | 'high'

interface PlayerStatsState {
  energy: number
  reputation: number
  network: number
  cash: number
  history: StatHistoryEntry[]
  modifyStats: (changes: StatChanges, source: string) => void
  getStatLevel: (stat: keyof StatChanges) => StatLevel
  checkStat: (check: StatCheck) => boolean
  resetStats: () => void
}

const INITIAL_STATS = { energy: 50, reputation: 50, network: 50, cash: 50 }

const clamp = (val: number) => Math.max(0, Math.min(100, val))

export const usePlayerStats = create<PlayerStatsState>((set, get) => ({
  ...INITIAL_STATS,
  history: [],

  modifyStats: (changes, source) =>
    set((state) => {
      const updated: Partial<PlayerStatsState> = {}
      if (changes.energy !== undefined) updated.energy = clamp(state.energy + changes.energy)
      if (changes.reputation !== undefined) updated.reputation = clamp(state.reputation + changes.reputation)
      if (changes.network !== undefined) updated.network = clamp(state.network + changes.network)
      if (changes.cash !== undefined) updated.cash = clamp(state.cash + changes.cash)
      return {
        ...updated,
        history: [...state.history, { source, changes, timestamp: Date.now() }],
      }
    }),

  getStatLevel: (stat) => {
    const val = get()[stat] ?? 50
    if (val <= 30) return 'low'
    if (val <= 60) return 'medium'
    return 'high'
  },

  checkStat: (check) => {
    const val = get()[check.stat]
    return check.comparison === 'gte' ? val >= check.threshold : val <= check.threshold
  },

  resetStats: () => set({ ...INITIAL_STATS, history: [] }),
}))
