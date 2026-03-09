import { create } from "zustand";

interface GameState {
  isRunning: boolean;
  currentScene: string;
  setRunning: (running: boolean) => void;
  setCurrentScene: (scene: string) => void;
}

export const useGameState = create<GameState>((set) => ({
  isRunning: false,
  currentScene: "Boot",
  setRunning: (running) => set({ isRunning: running }),
  setCurrentScene: (scene) => set({ currentScene: scene }),
}));
