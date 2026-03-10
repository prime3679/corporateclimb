import { create } from 'zustand'

export type Presentation = 'masculine' | 'feminine' | 'androgynous'
export type Hairstyle = 'locs' | 'braids' | 'afro' | 'buzz' | 'long' | 'curly' | 'straight' | 'bald' | 'mohawk' | 'bob'
export type Accessory = 'none' | 'glasses' | 'headphones' | 'cap'

export const SKIN_TONES = [
  '#8D5524', '#C68642', '#E0AC69', '#F1C27D',
  '#FFDBAC', '#D4A76A', '#503335', '#3B2219',
] as const

export const ACCENT_COLORS = [
  '#4F46E5', '#DC2626', '#059669', '#D97706',
  '#7C3AED', '#EC4899', '#0891B2', '#475569',
] as const

interface CharacterState {
  presentation: Presentation
  skinTone: string
  hairstyle: Hairstyle
  accentColor: string
  accessory: Accessory
  isCreated: boolean
  setPresentation: (p: Presentation) => void
  setSkinTone: (s: string) => void
  setHairstyle: (h: Hairstyle) => void
  setAccentColor: (c: string) => void
  setAccessory: (a: Accessory) => void
  finishCreation: () => void
}

export const useCharacterStore = create<CharacterState>((set) => ({
  presentation: 'androgynous',
  skinTone: SKIN_TONES[2],
  hairstyle: 'afro',
  accentColor: ACCENT_COLORS[0],
  accessory: 'none',
  isCreated: false,
  setPresentation: (presentation) => set({ presentation }),
  setSkinTone: (skinTone) => set({ skinTone }),
  setHairstyle: (hairstyle) => set({ hairstyle }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setAccessory: (accessory) => set({ accessory }),
  finishCreation: () => set({ isCreated: true }),
}))
