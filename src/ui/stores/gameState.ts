import { create } from 'zustand'

interface GameState {
  currentScene: string
  isPlaying: boolean
  isPaused: boolean
  whisperActive: boolean
  montageActive: boolean
  bossMirrorRef: { onMontageComplete: () => void } | null
  setCurrentScene: (scene: string) => void
  setPlaying: (playing: boolean) => void
  setPaused: (paused: boolean) => void
  setWhisperActive: (active: boolean) => void
  setMontageActive: (active: boolean) => void
  setBossMirrorRef: (ref: { onMontageComplete: () => void } | null) => void
}

export const useGameState = create<GameState>((set) => ({
  currentScene: 'Boot',
  isPlaying: false,
  isPaused: false,
  whisperActive: false,
  montageActive: false,
  bossMirrorRef: null,
  setCurrentScene: (scene) => set({ currentScene: scene }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setPaused: (paused) => set({ isPaused: paused }),
  setWhisperActive: (active) => set({ whisperActive: active }),
  setMontageActive: (active) => set({ montageActive: active }),
  setBossMirrorRef: (ref) => set({ bossMirrorRef: ref }),
}))
