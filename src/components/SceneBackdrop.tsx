import type { CSSProperties } from 'react'
import type { ScenePalette } from '@/ui/scenes'

/**
 * Layered battle backdrops, one scene per act, tinted by the floor's
 * palette so the five per-act variants still read differently. All
 * shapes are deterministic CSS — no images, no randomness — and every
 * animated element carries `scene-anim` so reduced-motion settings
 * freeze it. Renders behind the wainscoting/actors (zIndex 0).
 */
export default function SceneBackdrop({ act, palette }: { act: number; palette: ScenePalette }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    >
      {act === 1 && <OfficeScene p={palette} />}
      {act === 2 && <CorporateScene p={palette} />}
      {act >= 3 && <ExecutiveScene p={palette} />}
    </div>
  )
}

const cloud = (
  left: string,
  top: string,
  w: number,
  dur: number,
  delay: number,
): CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width: w,
  height: w * 0.38,
  background: 'rgba(255,255,255,0.55)',
  borderRadius: w,
  filter: 'blur(1px)',
  animation: `scene-drift ${dur}s ease-in-out ${delay}s infinite alternate`,
})

/** Act 1 — warm office: two windows with sky and drifting clouds, a plant. */
function OfficeScene({ p }: { p: ScenePalette }) {
  const window = (left: string): CSSProperties => ({
    position: 'absolute',
    left,
    top: '8%',
    width: '19%',
    height: '21%',
    background: 'linear-gradient(180deg, #AED9F2 0%, #DBF0FA 100%)',
    border: `4px solid ${p.floorDk}`,
    borderRadius: 4,
    overflow: 'hidden',
    opacity: 0.8,
  })
  const bar = (style: CSSProperties): CSSProperties => ({
    position: 'absolute',
    background: p.floorDk,
    opacity: 0.9,
    ...style,
  })
  return (
    <>
      {['9%', '38%'].map((left, i) => (
        <div key={left} style={window(left)}>
          <div className="scene-anim" style={cloud('-18%', '22%', 42, 16, i * 3)} />
          <div className="scene-anim" style={cloud('45%', '55%', 30, 22, i * 5 + 2)} />
          <div style={bar({ top: '48%', left: 0, right: 0, height: 3 })} />
          <div style={bar({ left: '48%', top: 0, bottom: 0, width: 3 })} />
        </div>
      ))}
      {/* Potted plant silhouette standing on the wall line */}
      <div
        style={{
          position: 'absolute',
          left: '46%',
          top: '46.5%',
          width: 26,
          height: 42,
          background: p.accent,
          opacity: 0.35,
          clipPath:
            'polygon(50% 0, 72% 22%, 100% 14%, 78% 40%, 88% 46%, 12% 46%, 22% 40%, 0 14%, 28% 22%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '47%',
          top: '51%',
          width: 18,
          height: 14,
          background: p.floorDk,
          opacity: 0.45,
          clipPath: 'polygon(0 0, 100% 0, 82% 100%, 18% 100%)',
        }}
      />
    </>
  )
}

/** Act 2 — glass tower: a city skyline behind curtain-wall mullions. */
function CorporateScene({ p }: { p: ScenePalette }) {
  // Building silhouettes: [left%, width%, height% of the wall area]
  const buildings: [number, number, number][] = [
    [2, 11, 46],
    [16, 9, 62],
    [28, 13, 38],
    [44, 10, 70],
    [57, 12, 50],
    [72, 9, 58],
    [84, 12, 42],
  ]
  return (
    <>
      {buildings.map(([left, w, h]) => (
        <div
          key={left}
          style={{
            position: 'absolute',
            left: `${left}%`,
            width: `${w}%`,
            bottom: '45.5%',
            height: `${h * 0.45}%`,
            background: p.floorDk,
            opacity: 0.45,
            // Lit office windows, late as always.
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent 0 6px, rgba(255,213,79,0.28) 6px 8px)',
          }}
        />
      ))}
      {/* Curtain-wall mullions in front of the skyline */}
      {['25%', '50%', '75%'].map((left) => (
        <div
          key={left}
          style={{
            position: 'absolute',
            left,
            top: 0,
            height: '55%',
            width: 3,
            background: p.accent,
            opacity: 0.3,
          }}
        />
      ))}
    </>
  )
}

/** Act 3 — executive penthouse at night: moon, stars, distant skyline. */
function ExecutiveScene({ p: _p }: { p: ScenePalette }) {
  const stars: [string, string, number][] = [
    ['12%', '8%', 2.2],
    ['28%', '16%', 3.1],
    ['38%', '6%', 2.6],
    ['55%', '12%', 3.5],
    ['68%', '5%', 2.4],
    ['82%', '14%', 2.9],
    ['90%', '24%', 3.3],
    ['8%', '26%', 2.7],
  ]
  return (
    <>
      <div
        style={{
          position: 'absolute',
          right: '30%',
          top: '11%',
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: '#FFF8E1',
          boxShadow: '0 0 18px 6px rgba(255,248,225,0.35)',
          opacity: 0.85,
        }}
      />
      {stars.map(([left, top, dur], i) => (
        <div
          key={i}
          className="scene-anim"
          style={{
            position: 'absolute',
            left,
            top,
            width: 2,
            height: 2,
            borderRadius: '50%',
            background: '#FFFDE7',
            animation: `twinkle ${dur}s ease-in-out ${i * 0.4}s infinite alternate`,
          }}
        />
      ))}
      {/* Distant skyline below the night sky */}
      {(
        [
          [0, 18, 10],
          [20, 14, 16],
          [36, 20, 8],
          [58, 15, 14],
          [75, 25, 11],
        ] as [number, number, number][]
      ).map(([left, w, h]) => (
        <div
          key={left}
          style={{
            position: 'absolute',
            left: `${left}%`,
            width: `${w}%`,
            bottom: '45.5%',
            height: `${h}%`,
            background: '#000',
            opacity: 0.5,
          }}
        />
      ))}
    </>
  )
}
