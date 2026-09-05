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
import Headshot from './Headshot'
import { NPC_CAST, ZONE_ACCENT, castForSpeaker, promptText } from './cast'
import { ringColorFor } from './ringColor'
import { TileDefs, renderForegroundTile, renderTile, type TileStates } from './tiles'
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
    elevatorOpen: state.overlay?.kind === 'confirm' && state.overlay.prompt === 'elevator',
  }
}

/** Static tile pass. */
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

/** Foreground trim pass for desk/counter depth and emissive accents. */
const ForegroundLayer = memo(function ForegroundLayer(states: TileStates) {
  const tiles = []
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) tiles.push(renderForegroundTile(x, y, states))
  }
  return (
    <svg
      className={styles.foreground}
      width={MAP_W}
      height={MAP_H}
      viewBox={`0 0 ${MAP_W} ${MAP_H}`}
      shapeRendering="crispEdges"
      aria-hidden
    >
      {tiles}
    </svg>
  )
})

function BadgeToken({
  spriteId,
  ring,
  facing,
  x,
  y,
  player = false,
  label,
  phase,
}: {
  spriteId: string
  ring: string
  facing: Facing
  x: number
  y: number
  player?: boolean
  label: string
  phase: number
}) {
  return (
    <div
      className={[
        styles.token,
        player ? styles.tokenPlayer : '',
        styles[`face_${facing}`],
        phase % 2 === 0 ? styles.phaseA : styles.phaseB,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ left: x * T, top: y * T }}
      aria-label={label}
      role="img"
    >
      <span className={styles.tokenShadow} aria-hidden />
      <span className={styles.tokenBody} aria-hidden />
      <Headshot
        spriteId={spriteId}
        size={28}
        ring={ring}
        shape="badge"
        className={styles.tokenBadge}
      />
      <span className={styles.tokenGloss} aria-hidden />
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
  const zone = zoneAt(state.player.x, state.player.y)
  const stepPhase = (state.player.x + state.player.y) % 2

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
  const outlineTile = nearby ? (nearby.kind === 'npc' ? NPC_TILE[nearby.id] : ahead) : null

  const cardOpen = !!ov && ov.kind !== 'coach'
  const nearbyLeft = nearby
    ? Math.max(4, Math.min(VIEW_W - 4, ((outlineTile?.x ?? ahead.x) - camX) * T + T / 2))
    : 0
  const nearbyTop = nearby ? Math.max(30, ((outlineTile?.y ?? ahead.y) - camY) * T - 6) : 0
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
  const poiFxTile =
    nearby?.kind === 'poi' &&
    (nearby.id === 'poi_elevator_door' ||
      nearby.id === 'poi_supervisor_door' ||
      nearby.id === 'poi_printer' ||
      nearby.id === 'poi_vending_machine')
      ? { x: (outlineTile?.x ?? ahead.x) * T, y: (outlineTile?.y ?? ahead.y) * T }
      : null

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
        <div className={styles.lightPools} aria-hidden>
          <span className={`${styles.pool} ${styles.poolElevator}`} />
          <span className={`${styles.pool} ${styles.poolDesks}`} />
          <span className={`${styles.pool} ${styles.poolBreak}`} />
          <span className={`${styles.pool} ${styles.poolMeeting}`} />
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
                  phase={stepPhase + tile.x + tile.y}
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
          phase={stepPhase}
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

        <ForegroundLayer {...states} />
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
