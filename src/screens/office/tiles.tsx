import type { ReactNode } from 'react'
import { TILE_SIZE, glyphAt, zoneAt, type ZoneId } from '@/content/office'
import { ZONE_ACCENT } from './cast'

/* ─── Floor 1 tileset ────────────────────────────────────────
   Premium office pixel scene built in 32x32 tiles:
   - zone-specific floor materials
   - richer prop depth (shadow + bevel + highlights)
   - ambient emissive details on interactive points
   - foreground trims rendered in a second pass for occlusion depth */

const T = TILE_SIZE
const INK = '#080b12'
const HAIR = 'rgba(255,255,255,0.2)'
const WALL_CAP = '#2f3d54'
const WALL_FACE = '#161d2a'
const WALL_PLINTH = '#0d1320'
const WOOD = '#7a5434'
const WOOD_DARK = '#52351f'
const WOOD_LIGHT = '#ab7d4f'
const STEEL = '#9aa8bb'
const STEEL_DARK = '#5f6e82'
const SCREEN = '#0f141c'
const GLASS = 'rgba(145, 212, 255, 0.32)'
const GLASS_LINE = '#9fd0ff'
const PAPER = '#eff5fd'
const SHADOW = 'rgba(2, 4, 8, 0.5)'
const WALL_LIGHT_TILES = new Set([
  '3,0',
  '8,0',
  '16,0',
  '21,0',
  '3,6',
  '8,6',
  '16,6',
  '21,6',
  '3,12',
  '8,12',
  '16,12',
  '21,12',
])
const WALL_NOTICE_TILES = new Set([
  '5,0',
  '19,0',
  '5,6',
  '19,6',
  '4,12',
  '17,12',
  '20,12',
])
const FLOOR_CLUTTER: Record<string, 'paper' | 'cable' | 'mat'> = {
  '2,14': 'paper',
  '20,14': 'paper',
  '7,8': 'cable',
  '17,8': 'cable',
  '11,13': 'mat',
  '12,6': 'mat',
  '21,3': 'paper',
}

export interface TileStates {
  printer: 'error' | 'working' | 'printing'
  cabinetOpen: boolean
  counterSteaming: boolean
  vendingLit: boolean
  readerGreen: boolean
  elevatorOpen: boolean
}

export function zoneCarpetId(zone: ZoneId) {
  return `carpet-${zone}`
}

function zoneFloor(zone: ZoneId) {
  switch (zone) {
    case 'zone_reception':
      return { dark: '#1a2432', base: '#233248', light: '#2a3e58' }
    case 'zone_desks':
      return { dark: '#16233a', base: '#223552', light: '#2d4571' }
    case 'zone_break':
      return { dark: '#162c2a', base: '#234340', light: '#2f5b56' }
    case 'zone_meeting':
      return { dark: '#271e3e', base: '#342b55', light: '#46356c' }
    case 'zone_elevator':
      return { dark: '#33241d', base: '#473226', light: '#5a4130' }
    case 'zone_hall':
    default:
      return { dark: '#1a202d', base: '#262d3d', light: '#313a4d' }
  }
}

function fixtureShadow({
  x,
  y,
  w = T - 4,
  h = 6,
}: {
  x: number
  y: number
  w?: number
  h?: number
}) {
  return <ellipse cx={x + T / 2} cy={y + T - 3} rx={w / 2} ry={h / 2} fill={SHADOW} />
}

/** Pattern defs: zone-tinted carpets + material gradients. */
export function TileDefs() {
  return (
    <defs>
      {(Object.keys(ZONE_ACCENT) as ZoneId[]).map((zone) => {
        const floor = zoneFloor(zone)
        return (
          <pattern
            key={zone}
            id={zoneCarpetId(zone)}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect width="16" height="16" fill={floor.dark} />
            <rect width="16" height="16" fill={`url(#${zone}-floor-grad)`} />
            <rect x="0" y="7" width="16" height="1" fill="rgba(255,255,255,0.045)" />
            <rect x="7" y="0" width="1" height="16" fill="rgba(255,255,255,0.035)" />
            <rect x="2" y="2" width="2" height="2" fill={floor.light} opacity="0.22" />
            <rect x="11" y="10" width="2" height="2" fill={floor.light} opacity="0.2" />
          </pattern>
        )
      })}
      {(Object.keys(ZONE_ACCENT) as ZoneId[]).map((zone) => {
        const floor = zoneFloor(zone)
        return (
          <linearGradient
            key={`${zone}-grad`}
            id={`${zone}-floor-grad`}
            x1="0"
            y1="0"
            x2="1"
            y2="1"
          >
            <stop offset="0" stopColor={floor.base} />
            <stop offset="0.55" stopColor={floor.base} />
            <stop offset="1" stopColor={floor.light} />
          </linearGradient>
        )
      })}
      <linearGradient id="glass-sheen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.32" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.06" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="wood-v" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={WOOD_LIGHT} />
        <stop offset="0.45" stopColor={WOOD} />
        <stop offset="1" stopColor={WOOD_DARK} />
      </linearGradient>
      <linearGradient id="monitor-glow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#8ce9ff" stopOpacity="0.95" />
        <stop offset="1" stopColor="#2c82ca" stopOpacity="0.45" />
      </linearGradient>
      <linearGradient id="steel-v" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#a4b1c2" />
        <stop offset="0.5" stopColor="#7b8794" />
        <stop offset="1" stopColor="#5c6979" />
      </linearGradient>
    </defs>
  )
}

function Carpet({ x, y }: { x: number; y: number }) {
  const tx = x / T
  const ty = y / T
  const zone = zoneAt(tx, ty)
  const north = glyphAt(tx, ty - 1)
  const west = glyphAt(tx - 1, ty)
  const hallLane = zone === 'zone_hall' && tx >= 10 && tx <= 13
  const receptionMat = zone === 'zone_reception' && ty === 16 && tx >= 7 && tx <= 9
  const deskRunner = zone === 'zone_desks' && ty >= 9 && ty <= 10 && tx >= 2 && tx <= 8
  const seed = (tx * 37 + ty * 17) % 9
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={`url(#${zoneCarpetId(zone)})`} />
      <rect
        x={x + 2}
        y={y + 2}
        width={T - 4}
        height={T - 4}
        fill="#ffffff"
        opacity={seed === 0 ? 0.05 : seed === 1 ? 0.03 : 0}
      />
      {hallLane && (
        <>
          <rect x={x + 3} y={y + 14} width={T - 6} height={1} fill="rgba(255,228,172,0.26)" />
          <rect x={x + 3} y={y + 16} width={T - 6} height={1} fill="rgba(0,0,0,0.35)" />
        </>
      )}
      {deskRunner && (
        <rect x={x + 4} y={y + 4} width={T - 8} height={T - 8} fill="rgba(141,197,255,0.09)" />
      )}
      {receptionMat && (
        <>
          <rect x={x + 2} y={y + 8} width={T - 4} height={T - 10} rx={2} fill="#111721" />
          <rect x={x + 4} y={y + 10} width={T - 8} height={1} fill="rgba(255,211,77,0.6)" />
        </>
      )}
      {north === '#' && <rect x={x} y={y} width={T} height={2} fill="rgba(0,0,0,0.2)" />}
      {west === '#' && <rect x={x} y={y} width={2} height={T} fill="rgba(0,0,0,0.17)" />}
    </g>
  )
}

function isWalkable(g: string) {
  return g === '.' || g === 'D' || /[1-4]/.test(g)
}

function Wall({ x, y, tx, ty }: { x: number; y: number; tx: number; ty: number }) {
  const below = glyphAt(tx, ty + 1)
  const faceDown = ty + 1 < 18 && below !== '#'
  const capH = faceDown ? 12 : T
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={WALL_PLINTH} />
      <rect x={x} y={y} width={T} height={T} fill={WALL_FACE} />
      <rect x={x} y={y} width={T} height={capH} fill={WALL_CAP} />
      <rect
        x={x + 2}
        y={y + 2}
        width={T - 4}
        height={Math.max(0, capH - 4)}
        fill="rgba(255,255,255,0.04)"
      />
      {faceDown && (
        <>
          <rect x={x} y={y + capH} width={T} height={1} fill={INK} />
          <rect x={x} y={y + capH + 1} width={T} height={1} fill={HAIR} />
          <rect x={x} y={y + T - 4} width={T} height={4} fill={WALL_PLINTH} />
        </>
      )}
      <rect x={x} y={y} width={T} height={1} fill={HAIR} opacity="0.8" />
      <rect x={x} y={y + T - 1} width={T} height={1} fill="rgba(0,0,0,0.55)" />
    </g>
  )
}

function DoorFrame({ x, y, tx, ty }: { x: number; y: number; tx: number; ty: number }) {
  const vertical = glyphAt(tx, ty - 1) === '#' && glyphAt(tx, ty + 1) === '#'
  return (
    <g>
      <Carpet x={x} y={y} />
      {vertical ? (
        <>
          <rect x={x + 1} y={y} width={2} height={T} fill={WALL_CAP} />
          <rect x={x + T - 3} y={y} width={2} height={T} fill={WALL_CAP} />
          <rect x={x + 3} y={y + 1} width={T - 6} height={1} fill={HAIR} opacity="0.7" />
          <rect x={x + 3} y={y + T - 2} width={T - 6} height={1} fill={INK} opacity="0.45" />
        </>
      ) : (
        <>
          <rect x={x} y={y + 1} width={T} height={2} fill={WALL_CAP} />
          <rect x={x} y={y + T - 3} width={T} height={2} fill={WALL_CAP} />
          <rect x={x + 1} y={y + 3} width={1} height={T - 6} fill={HAIR} opacity="0.7" />
          <rect x={x + T - 2} y={y + 3} width={1} height={T - 6} fill={INK} opacity="0.45" />
        </>
      )}
    </g>
  )
}

function Outline({
  x,
  y,
  w,
  h,
  r = 2,
}: {
  x: number
  y: number
  w: number
  h: number
  r?: number
}) {
  return (
    <rect x={x + 0.5} y={y + 0.5} width={w - 1} height={h - 1} rx={r} fill="none" stroke={INK} />
  )
}

function Monitor({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={12} height={9} rx={1} fill={SCREEN} stroke={INK} />
      <rect
        x={x + 2}
        y={y + 2}
        width={8}
        height={4}
        fill="url(#monitor-glow)"
        className="of-monitor"
      />
      <rect x={x + 2} y={y + 6} width={5} height={1} fill="#7dd9ff" opacity="0.7" />
      <rect x={x + 4} y={y + 9} width={4} height={2} fill={STEEL_DARK} />
    </g>
  )
}

function Desk({
  x,
  y,
  reception,
  part,
}: {
  x: number
  y: number
  reception: boolean
  part: 0 | 1 | 2
}) {
  const top = reception ? '#3b4b63' : WOOD
  const edge = reception ? '#22304a' : WOOD_DARK
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 22, h: 5 })}
      <rect x={x} y={y + 6} width={T} height={T - 10} fill={top} />
      <rect x={x} y={y + T - 6} width={T} height={4} fill={edge} />
      <rect x={x} y={y + 7} width={T} height={6} fill="rgba(255,255,255,0.03)" />
      <rect x={x} y={y + 6} width={T} height={1} fill={HAIR} />
      {reception ? (
        <>
          <rect
            x={x}
            y={y + 6}
            width={T}
            height={3}
            fill={ZONE_ACCENT.zone_reception}
            opacity="0.85"
          />
          {part === 1 && <Monitor x={x + 10} y={y + 11} />}
          {part === 2 && (
            <g>
              <circle cx={x + 16} cy={y + 17} r={4} fill="#ffd54f" stroke={INK} />
              <rect x={x + 12} y={y + 21} width={8} height={2} fill={INK} />
            </g>
          )}
          {part === 0 && (
            <g>
              <rect x={x + 8} y={y + 12} width={12} height={9} fill={PAPER} stroke={INK} />
              <rect x={x + 10} y={y + 14} width={8} height={1} fill={STEEL_DARK} />
              <rect x={x + 10} y={y + 17} width={6} height={1} fill={STEEL_DARK} />
            </g>
          )}
        </>
      ) : (
        <>
          <rect x={x} y={y + 6} width={T} height={T - 10} fill="url(#wood-v)" opacity="0.4" />
          {part !== 2 && <Monitor x={x + 10} y={y + 9} />}
          {part === 2 && (
            <rect x={x + 8} y={y + 12} width={14} height={8} fill={PAPER} stroke={INK} />
          )}
          <rect x={x + 4} y={y + 22} width={10} height={2} fill={WOOD_LIGHT} />
        </>
      )}
      <Outline x={x} y={y + 6} w={T} h={T - 6} r={1} />
    </g>
  )
}

function Chair({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 16, h: 4 })}
      <rect x={x + 10} y={y + 22} width={12} height={5} rx={1} fill={STEEL_DARK} stroke={INK} />
      <circle cx={x + 16} cy={y + 17} r={8} fill="#34405a" stroke={INK} />
      <path
        d={`M${x + 8} ${y + 14} a 8 8 0 0 1 16 0`}
        fill="none"
        stroke="#4a5a7a"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path d={`M${x + 8} ${y + 14} a 8 8 0 0 1 16 0`} fill="none" stroke={INK} strokeWidth="1" />
    </g>
  )
}

function Printer({ x, y, state }: { x: number; y: number; state: TileStates['printer'] }) {
  const led = state === 'error' ? '#ff5a5a' : '#4ade80'
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 20 })}
      <rect x={x + 3} y={y + 20} width={26} height={9} rx={1} fill="#b8c3d1" stroke={INK} />
      <rect x={x + 5} y={y + 8} width={22} height={13} rx={2} fill="#cfd8e3" stroke={INK} />
      <rect x={x + 7} y={y + 10} width={8} height={5} rx={1} fill={led} stroke={INK} />
      <rect x={x + 18} y={y + 11} width={6} height={1} fill={STEEL_DARK} />
      <rect x={x + 18} y={y + 13} width={6} height={1} fill={STEEL_DARK} />
      <rect x={x + 9} y={y + 4} width={14} height={4} fill="#9fb0c2" stroke={INK} />
      {state === 'printing' && (
        <g className="of-pages">
          <rect x={x + 8} y={y + 22} width={12} height={9} fill={PAPER} stroke={INK} />
          <rect x={x + 10} y={y + 25} width={8} height={7} fill={PAPER} stroke={INK} />
          <rect x={x + 12} y={y + 28} width={8} height={5} fill={PAPER} stroke={INK} />
        </g>
      )}
      {state === 'error' && (
        <rect x={x + 8} y={y + 11} width={6} height={3} fill="#fff" opacity="0.25" />
      )}
    </g>
  )
}

function Cabinet({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 20 })}
      <rect x={x + 4} y={y + 2} width={24} height={28} rx={1} fill={STEEL} stroke={INK} />
      {open ? (
        <>
          <rect x={x + 6} y={y + 4} width={20} height={24} fill="#1a2230" />
          <rect x={x + 6} y={y + 12} width={20} height={1} fill={HAIR} />
          <rect x={x + 6} y={y + 20} width={20} height={1} fill={HAIR} />
          <rect x={x + 9} y={y + 6} width={6} height={5} fill="#ffd54f" stroke={INK} />
          <rect x={x + 17} y={y + 14} width={6} height={5} fill="#4fc3f7" stroke={INK} />
          <rect x={x + 26} y={y + 2} width={5} height={28} fill={STEEL_DARK} stroke={INK} />
        </>
      ) : (
        <>
          <rect x={x + 16} y={y + 2} width={1} height={28} fill={INK} opacity="0.7" />
          <rect x={x + 13} y={y + 14} width={2} height={5} fill={INK} />
          <rect x={x + 17} y={y + 14} width={2} height={5} fill={INK} />
          <rect x={x + 5} y={y + 3} width={22} height={1} fill={HAIR} />
        </>
      )}
    </g>
  )
}

function Counter({
  x,
  y,
  part,
  steaming,
}: {
  x: number
  y: number
  part: 0 | 1 | 2
  steaming: boolean
}) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 24 })}
      <rect x={x} y={y + 10} width={T} height={T - 14} fill="#3a4658" />
      <rect x={x} y={y + 10} width={T} height={1} fill={HAIR} />
      <rect x={x} y={y + T - 6} width={T} height={4} fill="#22304a" />
      {part === 0 && (
        <g>
          <rect x={x + 7} y={y + 2} width={18} height={14} rx={2} fill="#1f2733" stroke={INK} />
          <rect x={x + 10} y={y + 5} width={5} height={3} fill="#ff5a5a" opacity="0.85" />
          <rect x={x + 17} y={y + 5} width={5} height={3} fill="#4ade80" opacity="0.85" />
          <rect x={x + 12} y={y + 16} width={8} height={4} fill={PAPER} stroke={INK} />
          {steaming && (
            <g
              className="of-steam"
              fill="none"
              stroke="#e8eef6"
              strokeOpacity="0.55"
              strokeWidth="1.2"
            >
              <path d={`M${x + 13} ${y + 15} q 1 -3 0 -6 q -1 -3 0 -5`} />
              <path d={`M${x + 18} ${y + 14} q 1 -3 0 -6 q -1 -3 0 -5`} />
            </g>
          )}
        </g>
      )}
      {part === 1 && (
        <g>
          {[0, 1, 2].map((i) => (
            <rect
              key={i}
              x={x + 6 + i * 8}
              y={y + 13}
              width={6}
              height={5}
              fill={PAPER}
              stroke={INK}
            />
          ))}
          <rect x={x + 8} y={y + 20} width={16} height={5} rx={1} fill="#ffd54f" stroke={INK} />
        </g>
      )}
      {part === 2 && (
        <g>
          <rect x={x + 6} y={y + 12} width={20} height={12} rx={2} fill="#9fb0c2" stroke={INK} />
          <rect x={x + 8} y={y + 14} width={16} height={8} fill="#4fc3f7" opacity="0.35" />
          <rect x={x + 15} y={y + 5} width={2} height={8} fill={STEEL} stroke={INK} />
        </g>
      )}
      <Outline x={x} y={y + 10} w={T} h={T - 10} r={1} />
    </g>
  )
}

function Vending({ x, y, lit }: { x: number; y: number; lit: boolean }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 20 })}
      <rect x={x + 5} y={y + 1} width={22} height={30} rx={2} fill="#2a3a5a" stroke={INK} />
      <rect
        x={x + 7}
        y={y + 4}
        width={13}
        height={20}
        fill={lit ? 'rgba(255,220,120,0.42)' : 'rgba(159,208,255,0.16)'}
        stroke={INK}
      />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={x + 8} y={y + 6 + r * 6} width={3} height={4} fill="#ff5a5a" />
          <rect x={x + 12} y={y + 6 + r * 6} width={3} height={4} fill="#4ade80" />
          <rect x={x + 16} y={y + 6 + r * 6} width={3} height={4} fill="#ffd54f" />
        </g>
      ))}
      <rect
        x={x + 21}
        y={y + 5}
        width={4}
        height={6}
        fill={lit ? '#ffd54f' : STEEL_DARK}
        stroke={INK}
      />
      <rect x={x + 21} y={y + 14} width={4} height={2} fill={INK} />
      <rect x={x + 8} y={y + 26} width={11} height={3} fill="#0f141c" />
      {lit && <rect x={x + 7} y={y + 24} width={13} height={1} fill="#ffd54f" opacity="0.9" />}
    </g>
  )
}

function BreakTable({ x, y, part }: { x: number; y: number; part: 0 | 1 }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 18 })}
      <rect
        x={part === 0 ? x + 4 : x}
        y={y + 8}
        width={part === 0 ? T - 4 : T - 4}
        height={18}
        rx={part === 0 ? 6 : 6}
        fill={WOOD}
        stroke={INK}
      />
      <rect
        x={part === 0 ? x + 6 : x}
        y={y + 9}
        width={part === 0 ? T - 6 : T - 6}
        height={1}
        fill={WOOD_LIGHT}
      />
      {part === 0 ? (
        <g>
          <rect x={x + 10} y={y + 12} width={12} height={8} rx={1} fill="#f7a8c4" stroke={INK} />
          <rect x={x + 10} y={y + 12} width={12} height={3} fill="#fff" opacity="0.7" />
          <rect x={x + 15} y={y + 9} width={2} height={4} fill="#ffd54f" />
        </g>
      ) : (
        <g>
          <circle cx={x + 10} cy={y + 17} r={3} fill={PAPER} stroke={INK} />
          <circle cx={x + 19} cy={y + 15} r={3} fill={PAPER} stroke={INK} />
        </g>
      )}
    </g>
  )
}

function MeetingTable({
  x,
  y,
  agenda,
  edges,
}: {
  x: number
  y: number
  agenda: boolean
  edges: { n: boolean; s: boolean; w: boolean; e: boolean }
}) {
  const inset = {
    top: edges.n ? 4 : 0,
    bottom: edges.s ? 4 : 0,
    left: edges.w ? 4 : 0,
    right: edges.e ? 4 : 0,
  }
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 20 })}
      <rect
        x={x + inset.left}
        y={y + inset.top}
        width={T - inset.left - inset.right}
        height={T - inset.top - inset.bottom}
        fill="#5a3d26"
      />
      {edges.n && (
        <rect
          x={x + inset.left}
          y={y + inset.top}
          width={T - inset.left - inset.right}
          height={1}
          fill={WOOD_LIGHT}
        />
      )}
      {edges.s && (
        <rect
          x={x + inset.left}
          y={y + T - inset.bottom - 3}
          width={T - inset.left - inset.right}
          height={3}
          fill={WOOD_DARK}
        />
      )}
      {edges.n && (
        <rect
          x={x + inset.left}
          y={y + inset.top - 0.5}
          width={T - inset.left - inset.right}
          height={1}
          fill={INK}
        />
      )}
      {edges.w && (
        <rect
          x={x + inset.left - 0.5}
          y={y + inset.top}
          width={1}
          height={T - inset.top - inset.bottom}
          fill={INK}
        />
      )}
      {edges.e && (
        <rect
          x={x + T - inset.right - 0.5}
          y={y + inset.top}
          width={1}
          height={T - inset.top - inset.bottom}
          fill={INK}
        />
      )}
      {edges.s && (
        <rect
          x={x + inset.left}
          y={y + T - inset.bottom - 0.5}
          width={T - inset.left - inset.right}
          height={1}
          fill={INK}
        />
      )}
      {agenda && (
        <g>
          <rect x={x + 9} y={y + 10} width={14} height={16} fill={PAPER} stroke={INK} />
          <rect x={x + 11} y={y + 13} width={10} height={1} fill={STEEL_DARK} />
          <rect x={x + 11} y={y + 16} width={8} height={1} fill={STEEL_DARK} />
          <rect x={x + 11} y={y + 19} width={9} height={1} fill={ZONE_ACCENT.zone_reception} />
          <rect x={x + 11} y={y + 22} width={6} height={1} fill={STEEL_DARK} />
        </g>
      )}
    </g>
  )
}

function HandoutRack({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 18 })}
      <rect x={x + 5} y={y + 3} width={22} height={26} rx={1} fill={STEEL} stroke={INK} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect
            x={x + 8}
            y={y + 6 + i * 8}
            width={16}
            height={6}
            fill={i === 2 ? '#ddd3b9' : PAPER}
            stroke={INK}
          />
          <rect
            x={x + 10}
            y={y + 8 + i * 8}
            width={i === 0 ? 12 : 8}
            height={1}
            fill={STEEL_DARK}
          />
        </g>
      ))}
    </g>
  )
}

function WaterCooler({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 17 })}
      <rect x={x + 9} y={y + 14} width={14} height={16} rx={2} fill={PAPER} stroke={INK} />
      <rect x={x + 11} y={y + 3} width={10} height={12} rx={3} fill="#4fc3f7" stroke={INK} />
      <rect x={x + 13} y={y + 5} width={3} height={7} fill="#fff" opacity="0.5" />
      <rect x={x + 13} y={y + 18} width={6} height={3} fill="#4fc3f7" />
    </g>
  )
}

function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 17 })}
      <rect x={x + 10} y={y + 20} width={12} height={10} rx={1} fill="#8a5a3a" stroke={INK} />
      <rect x={x + 9} y={y + 19} width={14} height={3} fill="#a8703f" stroke={INK} />
      <ellipse cx={x + 16} cy={y + 13} rx={9} ry={7} fill="#2e8b57" stroke={INK} />
      <ellipse cx={x + 12} cy={y + 9} rx={5} ry={5} fill="#3fa66b" stroke={INK} />
      <ellipse cx={x + 21} cy={y + 10} rx={4} ry={5} fill="#3fa66b" stroke={INK} />
    </g>
  )
}

function Directory({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Carpet x={x} y={y} />
      {fixtureShadow({ x, y, w: 18 })}
      <rect x={x + 15} y={y + 18} width={2} height={11} fill={STEEL_DARK} stroke={INK} />
      <rect x={x + 10} y={y + 28} width={12} height={2} fill={STEEL_DARK} />
      <rect x={x + 5} y={y + 3} width={22} height={16} rx={1} fill="#1f2733" stroke={INK} />
      <rect x={x + 7} y={y + 5} width={18} height={2} fill={ZONE_ACCENT.zone_reception} />
      <rect x={x + 7} y={y + 9} width={12} height={1} fill={STEEL} />
      <rect x={x + 7} y={y + 12} width={15} height={1} fill={STEEL} />
      <rect x={x + 7} y={y + 15} width={9} height={1} fill={STEEL} />
    </g>
  )
}

function Elevator({ x, y, part, open }: { x: number; y: number; part: 0 | 1; open: boolean }) {
  const doorW = open ? 8 : 15
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={WALL_FACE} />
      <rect x={x} y={y} width={T} height={4} fill={WALL_CAP} />
      <rect x={x + (part === 0 ? 2 : 0)} y={y + 4} width={T - 2} height={T - 6} fill="#111722" />
      <rect
        x={x + (part === 0 ? 2 : T - 2 - doorW)}
        y={y + 4}
        width={doorW}
        height={T - 6}
        fill="url(#steel-v)"
        stroke={INK}
      />
      <rect
        x={x + (part === 0 ? 3 : T - 1 - doorW)}
        y={y + 5}
        width={1}
        height={T - 8}
        fill="#fff"
        opacity="0.35"
      />
      {part === 0 && (
        <rect x={x + 8} y={y + 1} width={T - 8} height={2} fill="#ffd54f" opacity="0.6" />
      )}
      {part === 1 && <rect x={x} y={y + 1} width={T - 8} height={2} fill="#ffd54f" opacity="0.6" />}
    </g>
  )
}

function Reader({ x, y, green }: { x: number; y: number; green: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={WALL_FACE} />
      <rect x={x} y={y} width={T} height={4} fill={WALL_CAP} />
      <rect x={x + 9} y={y + 10} width={14} height={16} rx={2} fill="#1f2733" stroke={INK} />
      <rect x={x + 12} y={y + 13} width={8} height={4} fill="#0f141c" />
      <circle
        className={green ? 'of-led-green' : 'of-led-red'}
        cx={x + 16}
        cy={y + 21}
        r={2.4}
        fill={green ? '#4ade80' : '#ff5a5a'}
        stroke={INK}
        strokeWidth="0.8"
      />
    </g>
  )
}

function StreetExit({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={WALL_FACE} />
      <rect x={x + 2} y={y + 2} width={T - 4} height={T - 2} fill="#3a2418" stroke={INK} />
      <rect
        x={x + 5}
        y={y + 6}
        width={9}
        height={16}
        fill={GLASS}
        stroke={GLASS_LINE}
        strokeOpacity="0.7"
      />
      <rect
        x={x + 18}
        y={y + 6}
        width={9}
        height={16}
        fill={GLASS}
        stroke={GLASS_LINE}
        strokeOpacity="0.7"
      />
      <rect x={x + 13} y={y + 14} width={2} height={5} fill="#ffd54f" />
      <rect x={x + 17} y={y + 14} width={2} height={5} fill="#ffd54f" />
      <rect x={x + 8} y={y + 2} width={16} height={3} fill="#4ade80" opacity="0.75" />
    </g>
  )
}

function Glass({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width={T} height={T} fill={WALL_FACE} />
      <rect
        x={x + 3}
        y={y + 2}
        width={T - 6}
        height={T - 4}
        fill={GLASS}
        stroke={GLASS_LINE}
        strokeOpacity="0.8"
      />
      <rect x={x + 3} y={y + 2} width={T - 6} height={T - 4} fill="url(#glass-sheen)" />
    </g>
  )
}

function FloorClutter({
  x,
  y,
  kind,
  zone,
}: {
  x: number
  y: number
  kind: 'paper' | 'cable' | 'mat'
  zone: ZoneId
}) {
  if (kind === 'paper') {
    return (
      <g>
        <rect x={x + 8} y={y + 19} width={10} height={6} fill={PAPER} stroke={INK} />
        <rect x={x + 10} y={y + 21} width={6} height={1} fill={STEEL_DARK} />
      </g>
    )
  }
  if (kind === 'cable') {
    return (
      <g fill="none" stroke={INK} strokeOpacity="0.65">
        <path d={`M${x + 7} ${y + 24} q 5 -4 10 0 q 5 4 8 0`} />
        <path d={`M${x + 9} ${y + 23} q 4 -3 8 0`} strokeOpacity="0.45" />
      </g>
    )
  }
  return (
    <g>
      <rect
        x={x + 5}
        y={y + 21}
        width={T - 10}
        height={5}
        rx={2}
        fill={zone === 'zone_break' ? 'rgba(72,185,138,0.22)' : 'rgba(224,179,74,0.2)'}
      />
      <rect x={x + 6} y={y + 22} width={T - 12} height={1} fill="rgba(255,255,255,0.22)" />
    </g>
  )
}

/** Foreground trim pass for extra depth and emissive accents. */
export function renderForegroundTile(tx: number, ty: number, s: TileStates): ReactNode {
  const g = glyphAt(tx, ty)
  const x = tx * T
  const y = ty * T
  const key = `fg-${tx},${ty}`
  if (g === '#') {
    const below = glyphAt(tx, ty + 1)
    if (below !== '#') {
      const tileId = `${tx},${ty}`
      const light = WALL_LIGHT_TILES.has(tileId)
      const notice = WALL_NOTICE_TILES.has(tileId)
      return (
        <g key={key}>
          <rect x={x} y={y + 11} width={T} height={1} fill="rgba(0,0,0,0.28)" />
          <rect x={x + 1} y={y + 1} width={1} height={9} fill="rgba(255,255,255,0.08)" />
          {notice && (
            <>
              <rect x={x + 8} y={y + 3} width={16} height={9} rx={1} fill="#dbe7f7" stroke={INK} />
              <rect
                x={x + 10}
                y={y + 5}
                width={12}
                height={1}
                fill={zoneAt(tx, ty + 1) === 'zone_break' ? '#48b98a' : '#4d8fe0'}
              />
              <rect x={x + 10} y={y + 8} width={7} height={1} fill={STEEL_DARK} />
            </>
          )}
          {light && (
            <g className="of-wall-light">
              <rect x={x + 10} y={y + 1} width={12} height={3} rx={1} fill="#ffe2ad" opacity="0.82" />
              <rect x={x + 9} y={y + 4} width={14} height={8} fill="rgba(255,220,148,0.16)" />
            </g>
          )}
        </g>
      )
    }
    return null
  }
  if (g === '.') {
    const clutter = FLOOR_CLUTTER[`${tx},${ty}`]
    if (!clutter) return null
    return (
      <g key={key}>
        <FloorClutter x={x} y={y} kind={clutter} zone={zoneAt(tx, ty)} />
      </g>
    )
  }
  if (g === '=') {
    return (
      <g key={key}>
        <rect x={x} y={y + T - 7} width={T} height={1} fill="rgba(255,255,255,0.22)" />
        <rect x={x} y={y + T - 6} width={T} height={2} fill="rgba(0,0,0,0.28)" />
      </g>
    )
  }
  if (g === 'K') {
    return (
      <g key={key}>
        <rect x={x} y={y + T - 7} width={T} height={1} fill="rgba(255,255,255,0.18)" />
        <rect x={x} y={y + T - 5} width={T} height={2} fill="rgba(0,0,0,0.34)" />
      </g>
    )
  }
  if (g === 'V' && s.vendingLit) {
    return (
      <g key={key} className="of-vending">
        <rect x={x + 7} y={y + 3} width={13} height={2} fill="#ffd54f" opacity="0.8" />
      </g>
    )
  }
  if (g === 'P' && s.printer === 'printing') {
    return (
      <g key={key} className="of-pages">
        <rect x={x + 8} y={y + 20} width={12} height={1} fill="#ffffff" opacity="0.85" />
      </g>
    )
  }
  if (g === 'E' && s.elevatorOpen) {
    return (
      <g key={key} className="of-elevator-shine">
        <rect x={x + 4} y={y + 5} width={T - 8} height={2} fill="#ffe59b" opacity="0.72" />
      </g>
    )
  }
  return null
}

/** Renders one 32×32 tile at grid position (tx, ty). */
export function renderTile(tx: number, ty: number, s: TileStates): ReactNode {
  const g = glyphAt(tx, ty)
  const x = tx * T
  const y = ty * T
  const key = `${tx},${ty}`
  switch (g) {
    case '#':
      return <Wall key={key} x={x} y={y} tx={tx} ty={ty} />
    case 'D':
      return <DoorFrame key={key} x={x} y={y} tx={tx} ty={ty} />
    case 'X':
      return <StreetExit key={key} x={x} y={y} />
    case 'E':
      return (
        <Elevator
          key={key}
          x={x}
          y={y}
          part={glyphAt(tx - 1, ty) === 'E' ? 1 : 0}
          open={s.elevatorOpen}
        />
      )
    case 'R':
      return <Reader key={key} x={x} y={y} green={s.readerGreen} />
    case 'G':
      return <Glass key={key} x={x} y={y} />
    case '=': {
      const reception = ty === 15
      const left = glyphAt(tx - 1, ty) === '='
      const right = glyphAt(tx + 1, ty) === '='
      const part: 0 | 1 | 2 = left && right ? 1 : left ? 2 : 0
      return <Desk key={key} x={x} y={y} reception={reception} part={part} />
    }
    case 'c':
      return <Chair key={key} x={x} y={y} />
    case 'P':
      return <Printer key={key} x={x} y={y} state={s.printer} />
    case 'S':
      return <Cabinet key={key} x={x} y={y} open={s.cabinetOpen} />
    case 'K': {
      const left = glyphAt(tx - 1, ty) === 'K'
      const right = glyphAt(tx + 1, ty) === 'K'
      const part: 0 | 1 | 2 = !left ? 0 : right ? 1 : 2
      return <Counter key={key} x={x} y={y} part={part} steaming={s.counterSteaming} />
    }
    case 'V':
      return <Vending key={key} x={x} y={y} lit={s.vendingLit} />
    case 't':
      return <BreakTable key={key} x={x} y={y} part={glyphAt(tx - 1, ty) === 't' ? 1 : 0} />
    case 'T':
    case 'A': {
      const isTable = (gg: string) => gg === 'T' || gg === 'A'
      return (
        <MeetingTable
          key={key}
          x={x}
          y={y}
          agenda={g === 'A'}
          edges={{
            n: !isTable(glyphAt(tx, ty - 1)),
            s: !isTable(glyphAt(tx, ty + 1)),
            w: !isTable(glyphAt(tx - 1, ty)),
            e: !isTable(glyphAt(tx + 1, ty)),
          }}
        />
      )
    }
    case 'H':
      return <HandoutRack key={key} x={x} y={y} />
    case 'w':
      return <WaterCooler key={key} x={x} y={y} />
    case 'i':
      return <Directory key={key} x={x} y={y} />
    case 'p':
      return <Plant key={key} x={x} y={y} />
    default:
      return <Carpet key={key} x={x} y={y} />
  }
}

export { isWalkable }
