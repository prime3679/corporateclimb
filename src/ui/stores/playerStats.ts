import { create } from "zustand";
import type { StatChanges } from "../../game/config/dialogueTypes";

export type StatName = "energy" | "reputation" | "network" | "cash";

export interface StatHistoryEntry {
  source: string;
  changes: StatChanges;
  timestamp: number;
}

interface PlayerStatsState {
  energy: number;
  reputation: number;
  network: number;
  cash: number;
  history: StatHistoryEntry[];

  modifyStats: (changes: StatChanges, source: string) => void;
  reset: () => void;
}

const INITIAL_STATS = {
  energy: 50,
  reputation: 50,
  network: 50,
  cash: 50,
};

function clamp(v: number): number {
  return Math.max(0, Math.min(100, v));
}

export const usePlayerStats = create<PlayerStatsState>((set) => ({
  ...INITIAL_STATS,
  history: [],

  modifyStats: (changes, source) =>
    set((state) => {
      const patch: Partial<Record<StatName, number>> = {};
      for (const [key, delta] of Object.entries(changes)) {
        if (delta !== undefined) {
          patch[key as StatName] = clamp(state[key as StatName] + delta);
        }
      }
      return {
        ...patch,
        history: [
          ...state.history,
          { source, changes, timestamp: Date.now() },
        ],
      };
    }),

  reset: () => set({ ...INITIAL_STATS, history: [] }),
}));
