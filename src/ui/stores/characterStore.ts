import { create } from "zustand";

export type Presentation = "masculine" | "feminine" | "androgynous";
export type Hairstyle =
  | "Locs"
  | "Braids"
  | "Afro"
  | "Buzz"
  | "Long"
  | "Curly"
  | "Straight"
  | "Bald"
  | "Mohawk"
  | "Bob";
export type Accessory = "None" | "Glasses" | "Headphones" | "Cap";

export const SKIN_TONES = [
  "#FDDBB4",
  "#E8B98D",
  "#D4956B",
  "#C07848",
  "#A0522D",
  "#7B3F00",
  "#5C3317",
  "#3B1E08",
] as const;

export const ACCENT_COLORS = [
  "#4F46E5", // indigo
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#3B82F6", // blue
  "#EC4899", // pink
  "#8B5CF6", // purple
  "#06B6D4", // cyan
] as const;

export const HAIRSTYLES: Hairstyle[] = [
  "Locs",
  "Braids",
  "Afro",
  "Buzz",
  "Long",
  "Curly",
  "Straight",
  "Bald",
  "Mohawk",
  "Bob",
];

export const ACCESSORIES: Accessory[] = ["None", "Glasses", "Headphones", "Cap"];

interface CharacterState {
  presentation: Presentation;
  skinTone: string;
  hairstyle: Hairstyle;
  accentColor: string;
  accessory: Accessory;
  isCreated: boolean;

  setPresentation: (p: Presentation) => void;
  setSkinTone: (color: string) => void;
  setHairstyle: (h: Hairstyle) => void;
  setAccentColor: (color: string) => void;
  setAccessory: (a: Accessory) => void;
  finalize: () => void;
}

export const useCharacterStore = create<CharacterState>((set) => ({
  presentation: "androgynous",
  skinTone: SKIN_TONES[2],
  hairstyle: "Afro",
  accentColor: ACCENT_COLORS[0],
  accessory: "None",
  isCreated: false,

  setPresentation: (presentation) => set({ presentation }),
  setSkinTone: (skinTone) => set({ skinTone }),
  setHairstyle: (hairstyle) => set({ hairstyle }),
  setAccentColor: (accentColor) => set({ accentColor }),
  setAccessory: (accessory) => set({ accessory }),
  finalize: () => set({ isCreated: true }),
}));
