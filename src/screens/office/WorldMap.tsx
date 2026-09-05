import { memo, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import {
  DIALOGUE,
  MAP_HEIGHT,
  MAP_WIDTH,
  NPC_TILE,
  TILE_SIZE,
  VIEWPORT_TILES_X,
  ZONE_LABEL,
  zoneAt,
  type DialogueId,
  type Facing,
  type NpcId,
} from '@/content/office'
import { currentObjective, interactTarget, kitFor, type OfficeState } from '@/engine/office'
import Headshot, { ringColorFor } from './Headshot'
import { NPC_CAST, ZONE_ACCENT, castForSpeaker, promptText } from './cast'
import { TileDefs, renderTile, type TileStates } from './tiles'
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
  const zone = zoneAt(state.player.x, state.player.y)
  return {
    printer: printer === 'installed' ? 'printing' : printer === 'complete' ? 'working' : 'error',
    cabinetOpen: printer !== 'not_started' && printer !== 'accepted',
    counterSteaming:
      zone === 'zone_break' ||
      (state.overlay?.kind === 'toast' && state.overlay.text.startsWith('You take five')),
    vendingLit: nearby?.kind === 'poi' && nearby.id === 'poi_vending_machine',
    readerGreen: (state.keyItems.key_access_badge ?? 0) > 0,
    elevatorOpen: false,
  }
}

/** The static tile layer; only re-renders when a tile state flips (props are primitives). */
const TileLayer = memo(function TileLayer(states: TileStates) {
  const tiles = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) tiles.push(renderTile(x, y, states))
  }
  return (
    <svg
      className={styles.tiles}
      width={MAP_W}
      height={MAP_H}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      <TileDefs />
      {tiles}
    </svg>
  )
})

/** Badge token: the character as their lanyard photo, notched toward their facing. */
function BadgeToken({
  spriteId,
  ring,
  facing,
  x,
  y,
  player = false,
  label,
}: {
  spriteId: string
  ring: string
  facing: Facing
  x: number
  y: number
  player?: boolean
  label: string
}) {
  return (
    <div
      className={`${styles.token} ${player ? styles.tokenPlayer : ''} ${styles[`face_${facing}`]}`}
      style={{ left: x * T, top: y * T }}
      aria-label={label}
      role="img"
    >
      <span className={styles.tokenShadow} aria-hidden />
      <Headshot
        spriteId={spriteId}
        size={28}
        ring={ring}
        shape="badge"
        className={styles.tokenBadge}
      />
      <span className={styles.notch} style={{ background: ring }} aria-hidden />
    </div>
  )
}

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

  const viewRows = viewH / T
  const camX = Math.max(
    0,
    Math.min(state.player.x - Math.floor(VIEWPORT_TILES_X / 2), MAP_WIDTH - VIEWPORT_TILES_X),
  )
  const camYMax = Math.max(0, MAP_HEIGHT - viewRows)
  const camY = Math.max(0, Math.min(state.player.y - viewRows / 2 + 0.5, camYMax))

  // Zone chip: keyed on the zone so its CSS animation (full → 60%) replays per room.
  const zone = zoneAt(state.player.x, state.player.y)

  // Sightline / talk callout: a gold "!" pops over the NPC whose line just opened
  // (keyed on the node so the pop replays per line, then fades out in CSS).
  const ov = state.overlay
  const dialogueKey = ov?.kind === 'dialogue' && ov.line === 0 ? ov.nodeId : null
  const calloutNode = dialogueKey ? DIALOGUE[dialogueKey as DialogueId] : undefined
  const callout = calloutNode
    ? (castForSpeaker(calloutNode.speaker, dialogueKey!)?.npc ?? null)
    : null

  // The faced tile gets a 1-px gold outline while something is there to interact with.
  const ahead = {
    x: state.player.x + DELTA[state.player.facing].x,
    y: state.player.y + DELTA[state.player.facing].y,
  }
  const outlineTile = nearby ? (nearby.kind === 'npc' ? NPC_TILE[nearby.id] : ahead) : null

  const cardOpen = !!ov && ov.kind !== 'coach'
  const nearbyLeft = nearby
    ? Math.max(4, Math.min(VIEW_W - 4, ((outlineTile?.x ?? ahead.x) - camX) * T + T / 2))
    : 0
  const nearbyTop = nearby ? Math.max(30, ((outlineTile?.y ?? ahead.y) - camY) * T - 6) : 0
  // The prompt chip wins the top-left corner; the zone chip yields while it is there.
  const zoneChipYields = !!nearby && !cardOpen && nearbyTop < 64 && nearbyLeft < 220
  const elevatorDot =
    nearby?.kind === 'poi' && nearby.id === 'poi_elevator_door'
      ? states.readerGreen
        ? 'var(--cc-heal)'
        : 'var(--cc-danger)'
      : null
  const pinHidden =
    callout !== null && NPC_TILE[callout].x === obj.pin.x && NPC_TILE[callout].y === obj.pin.y
  const pinOffLeft = obj.pin.x < camX
  const pinOffRight = obj.pin.x >= camX + VIEWPORT_TILES_X
  const pinRowOnScreen = Math.max(0, Math.min(viewH - 40, (obj.pin.y - camY) * T))

  const lead = kitFor(state.party[0])

  return (
    <div
      ref={mapRef}
      className={styles.map}
      aria-label="Floor 1 office map"
      style={{ '--zone-accent': ZONE_ACCENT[zone] } as CSSProperties}
    >
      <div
        className={styles.camera}
        style={{ transform: `translate(${-camX * T}px, ${-camY * T}px)` }}
      >
        <TileLayer {...states} />

        {outlineTile && (
          <div
            className={styles.target}
            style={{ left: outlineTile.x * T, top: outlineTile.y * T }}
            aria-hidden
          />
        )}

        {(Object.entries(NPC_TILE) as [NpcId, { x: number; y: number; facing: Facing }][]).map(
          ([id, tile]) => {
            const cast = NPC_CAST[id]
            const facing = facingToward(tile, state.player) ?? tile.facing
            return (
              <div key={id}>
                <BadgeToken
                  spriteId={cast.spriteId}
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
          },
        )}

        <BadgeToken
          spriteId={lead.spriteId}
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
            ?
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
          <span className={styles.edgeZone}>{ZONE_LABEL[obj.zone]}</span>
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
