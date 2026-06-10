// ─── BATTLE SCENE PALETTES ──────────────────────────────────
// Per-act, per-floor backdrop colors for the battle screen. Data,
// not component code — it used to live as a 120-line inline table
// inside BattleScreen.

export interface ScenePalette {
  wall: string
  wallBot: string
  floor: string
  floorDk: string
  accent: string
}

const ACT_SCENES: Record<number, ScenePalette[]> = {
  // Act 1: warm office
  1: [
    {
      wall: '#E8E0D0',
      wallBot: '#D8D0B8',
      floor: '#C8B898',
      floorDk: '#B0A080',
      accent: '#90A4AE',
    },
    {
      wall: '#D6E8F0',
      wallBot: '#B8D4E8',
      floor: '#90A4AE',
      floorDk: '#78909C',
      accent: '#1565C0',
    },
    {
      wall: '#F5E8D0',
      wallBot: '#E8D8B8',
      floor: '#A08060',
      floorDk: '#886848',
      accent: '#F9A825',
    },
    {
      wall: '#D8D8D8',
      wallBot: '#C0C0C0',
      floor: '#909090',
      floorDk: '#787878',
      accent: '#607D8B',
    },
    {
      wall: '#D8C8F0',
      wallBot: '#C0A8E0',
      floor: '#8860C0',
      floorDk: '#6840A0',
      accent: '#FFD54F',
    },
  ],
  // Act 2: cool corporate
  2: [
    {
      wall: '#C8D8E8',
      wallBot: '#A8C0D8',
      floor: '#6080A0',
      floorDk: '#486888',
      accent: '#78909C',
    },
    {
      wall: '#B8C8D8',
      wallBot: '#98B0C8',
      floor: '#507090',
      floorDk: '#385870',
      accent: '#607D8B',
    },
    {
      wall: '#A8B8C8',
      wallBot: '#8898B0',
      floor: '#405870',
      floorDk: '#304058',
      accent: '#546E7A',
    },
    {
      wall: '#98A8B8',
      wallBot: '#7888A0',
      floor: '#384860',
      floorDk: '#283848',
      accent: '#455A64',
    },
    {
      wall: '#202838',
      wallBot: '#182030',
      floor: '#281828',
      floorDk: '#181020',
      accent: '#B8860B',
    },
  ],
  // Act 3: dark executive
  3: [
    {
      wall: '#282030',
      wallBot: '#201828',
      floor: '#181020',
      floorDk: '#100810',
      accent: '#B8860B',
    },
    {
      wall: '#201828',
      wallBot: '#181020',
      floor: '#140C18',
      floorDk: '#0C0810',
      accent: '#DAA520',
    },
    {
      wall: '#1C1424',
      wallBot: '#140C1C',
      floor: '#100814',
      floorDk: '#08040C',
      accent: '#FFD700',
    },
    {
      wall: '#181020',
      wallBot: '#100818',
      floor: '#0C0410',
      floorDk: '#080008',
      accent: '#FFD700',
    },
    {
      wall: '#100818',
      wallBot: '#080410',
      floor: '#06020C',
      floorDk: '#040006',
      accent: '#FFD700',
    },
  ],
}

export function getScene(act: number, floorInPool: number): ScenePalette {
  const scenes = ACT_SCENES[act] || ACT_SCENES[1]
  return scenes[Math.min(floorInPool, scenes.length - 1)]
}
