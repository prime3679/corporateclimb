import type { CSSProperties } from 'react'
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC_TILE,
  TILE_SIZE,
  VIEWPORT_TILES_X,
  glyphAt,
  zoneAt,
  type Facing,
} from '@/content/office'
import { currentObjective } from '@/engine/office'
import type { OfficeState } from '@/engine/office'
import styles from './WorldMap.module.css'

const ZONE_TINT: Record<string, string> = {
  zone_reception: 'rgba(255, 211, 77, 0.22)',
  zone_desks: 'rgba(77, 163, 255, 0.2)',
  zone_break: 'rgba(80, 200, 160, 0.2)',
  zone_meeting: 'rgba(196, 120, 255, 0.2)',
  zone_elevator: 'rgba(255, 140, 80, 0.2)',
  zone_hall: 'rgba(160, 170, 180, 0.12)',
}

const GLYPH_COLOR: Record<string, string> = {
  '#': '#1b2433',
  '.': 'transparent',
  D: 'rgba(180, 220, 255, 0.35)',
  X: '#3a2418',
  E: '#2a3344',
  R: '#2a3344',
  T: '#4a3a28',
  A: '#6a5030',
  H: '#5a4030',
  c: '#3a3a3a',
  '=': '#4a4a38',
  P: '#5a3030',
  S: '#3a3a48',
  K: '#3a4840',
  V: '#403050',
  t: '#4a3830',
  w: '#305060',
  i: '#505040',
  p: '#204028',
}

const NPC_LABEL: Record<string, string> = {
  npc_receptionist: 'RE',
  npc_desk_challenger: 'GA',
  npc_meeting_prepper: 'PR',
  npc_supervisor: 'HO',
}

function notchStyle(facing: Facing): CSSProperties {
  if (facing === 'n') return { top: -3, left: 11 }
  if (facing === 's') return { bottom: -3, left: 11 }
  if (facing === 'e') return { right: -3, top: 11 }
  return { left: -3, top: 11 }
}

export default function WorldMap({ state }: { state: OfficeState }) {
  const camX = Math.max(0, Math.min(state.player.x - 6, MAP_WIDTH - VIEWPORT_TILES_X))
  const obj = currentObjective(state)
  const tiles = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const g = glyphAt(x, y)
      tiles.push(
        <div
          key={`${x},${y}`}
          className={styles.tile}
          style={{
            background:
              g === '.' || g === 'D'
                ? ZONE_TINT[zoneAt(x, y)]
                : (GLYPH_COLOR[g] ?? ZONE_TINT[zoneAt(x, y)]),
          }}
        />,
      )
    }
  }

  return (
    <div className={styles.map} aria-label="Floor 1 office map">
      <div className={styles.grid} style={{ transform: `translateX(${-camX * TILE_SIZE}px)` }}>
        {tiles}
        <div
          className={styles.pin}
          style={{ left: obj.pin.x * TILE_SIZE, top: obj.pin.y * TILE_SIZE }}
          aria-hidden
        />
        {Object.entries(NPC_TILE).map(([id, tile]) => (
          <div
            key={id}
            className={styles.token}
            style={{ left: tile.x * TILE_SIZE, top: tile.y * TILE_SIZE, borderColor: '#90caf9' }}
          >
            {NPC_LABEL[id]}
          </div>
        ))}
        <div
          className={styles.token}
          style={{ left: state.player.x * TILE_SIZE, top: state.player.y * TILE_SIZE }}
        >
          YOU
          <span className={styles.notch} style={notchStyle(state.player.facing)} />
        </div>
      </div>
    </div>
  )
}
