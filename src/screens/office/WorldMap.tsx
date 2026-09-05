import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import {
  DIALOGUE,
  MAP_HEIGHT,
  MAP_WIDTH,
  PHOTO_BOOTH_COPY,
  TILE_SIZE,
  VIEWPORT_TILES_X,
  ZONE_LABEL,
  floorLabel,
  floorNumber,
  npcTilesForFloor,
  zoneAt,
  type DialogueId,
  type Facing,
  type NpcId,
} from '@/content/office'
import { currentObjective, interactTarget, kitFor, type OfficeState } from '@/engine/office'
import { ringColorFor } from './ringColor'
import OverworldActor, { NPC_ACTOR, leadActorId } from './OverworldActor'
import {
  NPC_CAST,
  ZONE_ACCENT,
  castForSpeaker,
  isElevatorPoi,
  isVendingPoi,
  promptText,
} from './cast'
import { atlasOffset, floorCells, propCells, type Sprite, type TileStates } from './tiles'
import { TILE_CELL_H, TILE_SHEET_H, TILE_SHEET_URL, TILE_SHEET_W } from './tileAtlas'
import styles from './WorldMap.module.css'

const T = TILE_SIZE
const MAP_W = MAP_WIDTH * T
const MAP_H = MAP_HEIGHT * T
const VIEW_W = VIEWPORT_TILES_X * T

const DELTA: Record<Facing, { x: number; y: number }> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
}

function facingToward(from: { x: number; y: number }, to: { x: number; y: number }): Facing | null {
  const dx = to.x - from.x
  const dy = to.y - from.y
  if (Math.abs(dx) + Math.abs(dy) !== 1) return null
  if (dx === 1) return 'e'
  if (dx === -1) return 'w'
  return dy === 1 ? 's' : 'n'
}

function tileStates(state: OfficeState, nearby: ReturnType<typeof interactTarget>): TileStates {
  const printer = state.assignments.asg_printer
  const zone = zoneAt(state.player.x, state.player.y, state.floorId)
  const ov = state.overlay
  const badge =
    state.floorId === 'floor_05'
      ? state.flags.includes('flag_floor5_complete')
        ? 1
        : 0
      : state.floorId === 'floor_04'
        ? state.keyItems.key_client_badge
        : state.floorId === 'floor_03'
          ? state.keyItems.key_product_badge
          : state.floorId === 'floor_02'
            ? state.keyItems.key_employee_badge
            : state.keyItems.key_access_badge
  return {
    printer: printer === 'installed' ? 'printing' : printer === 'complete' ? 'working' : 'error',
    cabinetOpen:
      state.floorId === 'floor_02'
        ? state.firedTriggers.includes('poi_supply_cabinet_f2:opened')
        : state.floorId === 'floor_01'
          ? printer !== 'not_started' && printer !== 'accepted'
          : state.firedTriggers.includes('poi_supply_cabinet_upper:opened'),
    counterSteaming:
      zone === 'zone_break' ||
      zone === 'zone_facilities' ||
      zone === 'zone_product' ||
      zone === 'zone_sales' ||
      zone === 'zone_board' ||
      (ov?.kind === 'toast' && ov.text.startsWith('You take five')),
    vendingLit: nearby?.kind === 'poi' && isVendingPoi(nearby.id),
    readerGreen: (badge ?? 0) > 0,
    elevatorOpen:
      state.screen === 'elevator_ride'
        ? false
        : ov?.kind === 'elevator_panel' ||
          (ov?.kind === 'confirm' && ov.prompt === 'elevator') ||
          (state.player.x === 3 && state.player.y === 2 && state.player.facing === 's'),
    boothFlash: ov?.kind === 'dialogue' && ov.nodeId === `inspect:${PHOTO_BOOTH_COPY.countdown}`,
    badgePrinter:
      (state.keyItems.key_employee_badge ?? 0) > 0
        ? 'done'
        : ov?.kind === 'pause' && ov.reason === 'badge_print'
          ? 'printing'
          : 'idle',
    shredding: ov?.kind === 'dialogue' && ov.nodeId === 'dlg_whitlock_after',
  }
}

/** One warm ceiling fixture per room, positioned in map pixels per floor. */
const LIGHT_POOLS: Record<OfficeState['floorId'], { className: string; style: CSSProperties }[]> = {
  floor_01: [
    { className: styles.poolElevator, style: {} },
    { className: styles.poolDesks, style: {} },
    { className: styles.poolBreak, style: {} },
    { className: styles.poolMeeting, style: {} },
    { className: styles.poolReception, style: {} },
  ],
  floor_02: [
    { className: styles.poolElevator, style: { left: 20, top: 40, width: 180 } },
    { className: styles.poolDesks, style: { left: 230, top: 30, width: 220 } },
    { className: styles.poolMeeting, style: { left: 500, top: 40, width: 240 } },
    { className: styles.poolReception, style: { left: 20, top: 330, width: 200, height: 170 } },
    { className: styles.poolBreak, style: { left: 270, top: 330 } },
    { className: styles.poolBreak, style: { left: 520, top: 330, width: 220 } },
  ],
  floor_03: [
    { className: styles.poolElevator, style: { left: 20, top: 40, width: 180 } },
    { className: styles.poolDesks, style: { left: 230, top: 30, width: 220 } },
    { className: styles.poolMeeting, style: { left: 500, top: 40, width: 240 } },
    { className: styles.poolBreak, style: { left: 20, top: 330, width: 220 } },
    { className: styles.poolReception, style: { left: 480, top: 330, width: 240, height: 170 } },
  ],
  floor_04: [
    { className: styles.poolElevator, style: { left: 20, top: 40, width: 180 } },
    { className: styles.poolDesks, style: { left: 230, top: 30, width: 220 } },
    { className: styles.poolMeeting, style: { left: 500, top: 40, width: 240 } },
    { className: styles.poolBreak, style: { left: 20, top: 330, width: 220 } },
    { className: styles.poolReception, style: { left: 480, top: 330, width: 240, height: 170 } },
  ],
  floor_05: [
    { className: styles.poolElevator, style: { left: 20, top: 40, width: 180 } },
    { className: styles.poolMeeting, style: { left: 230, top: 30, width: 420 } },
    { className: styles.poolBreak, style: { left: 20, top: 330, width: 220 } },
    { className: styles.poolReception, style: { left: 350, top: 330, width: 320, height: 180 } },
  ],
}

/* ── sprite-sheet layers ────────────────────────────────────
   One <span> per sheet cell (public/office/tiles.png), like OverworldActor.
   Each span is drawn one pixel larger than its cell into the sheet's extruded
   border, so neighbours overlap by an identical pixel: under the Stage's
   fractional scale, separately rasterised spans otherwise meet in
   anti-aliased hairline seams.

   Props are split around the actors instead of z-sorted with them: the 32×32
   footprint sits under everyone (a person standing south overlaps it with
   their head and is in front), the 16px upward overflow sits over everyone
   (only a person standing north can overlap it, and they are behind). */

const OVERFLOW = TILE_CELL_H - T

/** Inline vars for one sprite-sheet cell; `.cell` in the CSS module reads them. */
function cellStyle(sprite: Sprite, dy: number, extra: CSSProperties): CSSProperties {
  const { bx, by } = atlasOffset(sprite.name)
  return {
    '--bx': `${bx}px`,
    '--by': `${by - dy}px`,
    '--period': `${sprite.periodMs ?? 0}ms`,
    ...extra,
  } as CSSProperties
}

function frameClass(sprite: Sprite): string {
  return sprite.frames && sprite.frames > 1 ? styles.frames2 : ''
}

/** Static floor pass: floors, rugs, wall autotiles, wall shadows, doorways, decor. */
const FloorLayer = memo(function FloorLayer({ floorId }: { floorId: OfficeState['floorId'] }) {
  return (
    <div className={styles.floor} style={{ width: MAP_W, height: MAP_H }} aria-hidden>
      {floorCells(floorId).map((cell) =>
        cell.layers.map((sprite, i) => (
          <span
            key={`${cell.x},${cell.y},${i}`}
            className={`${styles.cell} ${styles.full}`}
            style={cellStyle(sprite, 0, { left: cell.x * T, top: cell.y * T - OVERFLOW })}
          />
        )),
      )}
    </div>
  )
})

/** Prop pass in two layers around the actors (see above). */
const PropLayers = memo(function PropLayers({
  floorId,
  ...states
}: TileStates & { floorId: OfficeState['floorId'] }) {
  const cells = propCells(states, floorId)
  return (
    <>
      <div className={styles.footprints} aria-hidden>
        {cells.map(({ x, y, sprite }) => (
          <span
            key={`${x},${y}`}
            className={`${styles.cell} ${styles.footprint} ${frameClass(sprite)}`}
            style={cellStyle(sprite, OVERFLOW, { left: x * T, top: y * T })}
          />
        ))}
      </div>
      <div className={styles.overflows} aria-hidden>
        {cells.map(({ x, y, sprite }) => (
          <span
            key={`${x},${y}`}
            className={`${styles.cell} ${styles.overflow} ${frameClass(sprite)}`}
            style={cellStyle(sprite, 0, { left: x * T, top: y * T - OVERFLOW })}
          />
        ))}
      </div>
    </>
  )
})

export default function WorldMap({ state }: { state: OfficeState }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [viewH, setViewH] = useState(MAP_H)

  useLayoutEffect(() => {
    const el = mapRef.current
    if (!el) return
    const update = () => setViewH(el.clientHeight || MAP_H)
    update()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const obj = currentObjective(state)
  const nearby = interactTarget(state)
  const states = tileStates(state, nearby)
  const zone = zoneAt(state.player.x, state.player.y, state.floorId)
  const npcTiles = npcTilesForFloor(state.floorId)

  const viewRows = viewH / T
  const lookAheadX = state.player.facing === 'e' ? 0.5 : state.player.facing === 'w' ? -0.5 : 0
  const lookAheadY = state.player.facing === 's' ? 0.35 : state.player.facing === 'n' ? -0.35 : 0
  const camX = Math.max(
    0,
    Math.min(
      state.player.x + lookAheadX - Math.floor(VIEWPORT_TILES_X / 2),
      MAP_WIDTH - VIEWPORT_TILES_X,
    ),
  )
  const camYMax = Math.max(0, MAP_HEIGHT - viewRows)
  const camY = Math.max(0, Math.min(state.player.y + lookAheadY - viewRows / 2 + 0.5, camYMax))
  // Whole pixels only: the fractional look-ahead would otherwise put every
  // sprite on a sub-pixel boundary and soften the 1px art.
  const camPx = { x: Math.round(camX * T), y: Math.round(camY * T) }

  const ov = state.overlay
  const dialogueKey = ov?.kind === 'dialogue' && ov.line === 0 ? ov.nodeId : null
  const calloutNode = dialogueKey ? DIALOGUE[dialogueKey as DialogueId] : undefined
  const callout = calloutNode
    ? (castForSpeaker(calloutNode.speaker, dialogueKey!)?.npc ?? null)
    : null

  const ahead = {
    x: state.player.x + DELTA[state.player.facing].x,
    y: state.player.y + DELTA[state.player.facing].y,
  }
  const outlineTile = nearby ? (nearby.kind === 'npc' ? npcTiles[nearby.id] : ahead) : null

  const cardOpen = !!ov && ov.kind !== 'coach'
  const nearbyLeft = nearby
    ? Math.max(4, Math.min(VIEW_W - 4, (outlineTile?.x ?? ahead.x) * T - camPx.x + T / 2))
    : 0
  const nearbyTop = nearby ? Math.max(30, (outlineTile?.y ?? ahead.y) * T - camPx.y - 6) : 0
  const zoneChipYields = !!nearby && !cardOpen && nearbyTop < 64 && nearbyLeft < 220
  const elevatorDot =
    nearby?.kind === 'poi' && isElevatorPoi(nearby.id)
      ? states.readerGreen
        ? 'var(--cc-heal)'
        : 'var(--cc-danger)'
      : null
  const pinHidden =
    callout !== null &&
    !!npcTiles[callout] &&
    npcTiles[callout]!.x === obj.pin.x &&
    npcTiles[callout]!.y === obj.pin.y
  const pinOffLeft = obj.pin.x < camX
  const pinOffRight = obj.pin.x >= camX + VIEWPORT_TILES_X
  const pinRowOnScreen = Math.max(0, Math.min(viewH - 40, obj.pin.y * T - camPx.y))
  const poiFxTile =
    nearby?.kind === 'poi' &&
    (isElevatorPoi(nearby.id) ||
      isVendingPoi(nearby.id) ||
      nearby.id === 'poi_supervisor_door' ||
      nearby.id === 'poi_director_door' ||
      nearby.id === 'poi_printer' ||
      nearby.id === 'poi_badge_printer' ||
      nearby.id === 'poi_photo_booth')
      ? { x: (outlineTile?.x ?? ahead.x) * T, y: (outlineTile?.y ?? ahead.y) * T }
      : null

  const lead = kitFor(state.party[0])

  return (
    <div
      ref={mapRef}
      className={styles.map}
      aria-label={`${floorLabel(state.floorId)} office map`}
      style={
        {
          '--zone-accent': ZONE_ACCENT[zone],
          '--tile-sheet': `url(${TILE_SHEET_URL})`,
          '--sheet-w': `${TILE_SHEET_W}px`,
          '--sheet-h': `${TILE_SHEET_H}px`,
        } as CSSProperties
      }
    >
      <div
        className={styles.camera}
        style={{ transform: `translate(${-camPx.x}px, ${-camPx.y}px)` }}
      >
        <FloorLayer floorId={state.floorId} />
        <PropLayers floorId={state.floorId} {...states} />
        <div className={styles.lightPools} aria-hidden>
          {LIGHT_POOLS[state.floorId].map((pool, i) => (
            <span key={i} className={`${styles.pool} ${pool.className}`} style={pool.style} />
          ))}
        </div>

        {outlineTile && (
          <div
            className={styles.target}
            style={{ left: outlineTile.x * T, top: outlineTile.y * T }}
            aria-hidden
          />
        )}
        {poiFxTile && (
          <span
            className={styles.poiFx}
            style={{ left: poiFxTile.x, top: poiFxTile.y }}
            aria-hidden
          />
        )}

        {(
          Object.entries(npcTiles) as [
            NpcId,
            { x: number; y: number; facing: Facing } | undefined,
          ][]
        ).map(([id, tile]) => {
          if (!tile) return null
          const cast = NPC_CAST[id]
          const facing = facingToward(tile, state.player) ?? tile.facing
          return (
            <div key={id}>
              <OverworldActor
                actorId={NPC_ACTOR[id]}
                ring={ringColorFor(cast.types, false)}
                facing={facing}
                x={tile.x}
                y={tile.y}
                label={cast.name}
              />
              {callout === id && (
                <span
                  key={dialogueKey}
                  className={styles.callout}
                  style={{ left: tile.x * T, top: tile.y * T }}
                  aria-hidden
                >
                  !
                </span>
              )}
            </div>
          )
        })}

        <OverworldActor
          actorId={leadActorId(lead.id)}
          ring="var(--cc-gold)"
          facing={state.player.facing}
          x={state.player.x}
          y={state.player.y}
          player
          label="You"
        />

        {!pinHidden && (
          <span
            className={styles.pin}
            style={{ left: obj.pin.x * T, top: obj.pin.y * T }}
            aria-hidden
          >
            <span className={styles.pinBeam} />?
          </span>
        )}
      </div>

      <div
        key={zone}
        className={`${styles.zoneChip} ${zoneChipYields ? styles.zoneChipYield : ''}`}
        role="status"
      >
        {ZONE_LABEL[zone]}
      </div>

      {(pinOffLeft || pinOffRight) && (
        <div
          className={`${styles.edge} ${pinOffLeft ? styles.edgeLeft : styles.edgeRight}`}
          style={{ top: pinRowOnScreen }}
          aria-hidden
        >
          <span className={styles.chevron}>{pinOffLeft ? '‹' : '›'}</span>
          <span className={styles.edgeZone}>
            {obj.destFloor && obj.destFloor !== state.floorId
              ? `FLOOR ${floorNumber(obj.destFloor)}`
              : ZONE_LABEL[obj.zone]}
          </span>
        </div>
      )}

      {nearby && !cardOpen && (
        <div className={styles.nearby} style={{ left: nearbyLeft, top: nearbyTop }}>
          {elevatorDot && (
            <span className={styles.led} style={{ background: elevatorDot }} aria-hidden />
          )}
          {promptText(nearby, state)}
        </div>
      )}
    </div>
  )
}
