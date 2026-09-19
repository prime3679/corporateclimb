import { useCallback, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { MOVE_MS, type Facing } from '@/content/office'
import { canAcceptMove } from '@/engine/office'

type MoveAct = (action: { type: 'MOVE'; dir: Facing }) => {
  state: { player: { x: number; y: number } }
}

/**
 * Shared walk clock for keyboard and the D-pad: one tile per MOVE_MS, rAF
 * hold (not setInterval), pointer capture so a drifting thumb does not drop
 * the hold. Camera and actor tweens are the same duration — this clock is
 * what keeps the next step from restarting those tweens mid-flight.
 */
export function useOfficeWalkInput(
  act: MoveAct,
  player: { x: number; y: number },
  inputOpen: boolean,
) {
  const [held, setHeld] = useState<Facing | null>(null)
  const holdDir = useRef<Facing | null>(null)
  const lastAt = useRef<number | null>(null)
  const lastBlocked = useRef(false)
  const raf = useRef(0)
  const actRef = useRef(act)
  const playerRef = useRef(player)
  const inputOpenRef = useRef(inputOpen)
  const tickRef = useRef<() => void>(() => {})

  const pulse = useCallback((dir: Facing) => {
    const now = performance.now()
    if (!canAcceptMove(now, lastAt.current, MOVE_MS)) return false
    lastAt.current = now
    const before = playerRef.current
    const result = actRef.current({ type: 'MOVE', dir })
    const moved = result.state.player.x !== before.x || result.state.player.y !== before.y
    lastBlocked.current = !moved && inputOpenRef.current
    return moved
  }, [])

  const stopLoop = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current)
    raf.current = 0
  }, [])

  useLayoutEffect(() => {
    actRef.current = act
    playerRef.current = player
    inputOpenRef.current = inputOpen
    tickRef.current = () => {
      const dir = holdDir.current
      if (!dir) return
      if (inputOpenRef.current && !lastBlocked.current) pulse(dir)
      raf.current = requestAnimationFrame(() => tickRef.current())
    }
  })

  const release = useCallback(
    (dir?: Facing) => {
      if (dir && holdDir.current !== dir) return
      holdDir.current = null
      lastBlocked.current = false
      stopLoop()
      setHeld(null)
    },
    [stopLoop],
  )

  const startHold = useCallback(
    (dir: Facing) => {
      holdDir.current = dir
      lastBlocked.current = false
      setHeld(dir)
      pulse(dir)
      stopLoop()
      raf.current = requestAnimationFrame(() => tickRef.current())
    },
    [pulse, stopLoop],
  )

  useEffect(() => () => stopLoop(), [stopLoop])

  const padHandlers = useCallback(
    (dir: Facing) => ({
      onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        try {
          e.currentTarget.setPointerCapture(e.pointerId)
        } catch {
          /* jsdom / older browsers */
        }
        startHold(dir)
      },
      onPointerUp: () => release(dir),
      onPointerCancel: () => release(dir),
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    }),
    [release, startHold],
  )

  return { held: inputOpen ? held : null, startHold, release, padHandlers } as const
}
