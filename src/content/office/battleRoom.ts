import type { EncounterId, FloorId } from './ids'
import { OFFICE_ENCOUNTERS } from './encounters'
import { floorNumber } from './elevator'

/** Matches Classic `ScenePalette` so Office can override the room without importing UI. */
export interface OfficeBattlePalette {
  wall: string
  wallBot: string
  floor: string
  floorDk: string
  accent: string
}

/**
 * Office review rooms — department-tinted palettes for BattleScreen.
 * Classic still uses `getScene(getAct(floor), …)` and never imports this.
 */
export interface OfficeBattleRoom {
  act: 1 | 2 | 3
  palette: OfficeBattlePalette
}

const ROOMS: Record<1 | 2 | 3 | 4 | 5, OfficeBattleRoom> = {
  1: {
    act: 1,
    palette: {
      wall: '#E8DCC4',
      wallBot: '#D4C4A4',
      floor: '#C4B08C',
      floorDk: '#A89068',
      accent: '#FFC107',
    },
  },
  2: {
    act: 1,
    palette: {
      wall: '#E8C8B0',
      wallBot: '#D4A888',
      floor: '#C4845C',
      floorDk: '#A86840',
      accent: '#E0844D',
    },
  },
  3: {
    act: 2,
    palette: {
      wall: '#C8D0E8',
      wallBot: '#A8B4D0',
      floor: '#6070A0',
      floorDk: '#485878',
      accent: '#7C9CFF',
    },
  },
  4: {
    act: 2,
    palette: {
      wall: '#E8C8B8',
      wallBot: '#D0A890',
      floor: '#C07050',
      floorDk: '#985038',
      accent: '#E07A5F',
    },
  },
  5: {
    act: 3,
    palette: {
      wall: '#2A2030',
      wallBot: '#201828',
      floor: '#181018',
      floorDk: '#100810',
      accent: '#D4AF37',
    },
  },
}

export function officeBattleRoom(floorId: FloorId): OfficeBattleRoom {
  return ROOMS[floorNumber(floorId)]
}

export function officeBattleLabels(encounterId: EncounterId): {
  enemyKicker: string
  playerKicker: string
  intent: string
} {
  const enc = OFFICE_ENCOUNTERS[encounterId]
  if (encounterId === 'enc_ceo_review') {
    return { enemyKicker: 'REVIEW', playerKicker: 'YOUR TEAM', intent: 'INTENT: THE NOD' }
  }
  if (encounterId === 'enc_vp_sales') {
    return { enemyKicker: 'REVIEW', playerKicker: 'YOUR TEAM', intent: 'INTENT: THE CLOSE' }
  }
  if (encounterId === 'enc_auditor') {
    return { enemyKicker: 'AUDIT', playerKicker: 'YOUR TEAM', intent: 'INTENT: OPEN THE BOOKS' }
  }
  if (encounterId === 'enc_help_desk_intern') {
    return { enemyKicker: 'TRAINING', playerKicker: 'YOUR TEAM', intent: 'INTENT: PASS COMPLIANCE' }
  }
  if (enc.boss) {
    return { enemyKicker: 'REVIEW', playerKicker: 'YOUR TEAM', intent: 'INTENT: CLOSE THE REVIEW' }
  }
  return { enemyKicker: 'SPAR', playerKicker: 'YOUR TEAM', intent: 'INTENT: PROVE IT' }
}
