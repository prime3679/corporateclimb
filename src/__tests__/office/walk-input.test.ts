import { describe, expect, it } from 'vitest'
import { MOVE_MS } from '@/content/office'
import { canAcceptMove, facingFromKey } from '@/engine/office'

describe('office walk input clock', () => {
  it('accepts the first step and then waits MOVE_MS', () => {
    expect(canAcceptMove(0, null, MOVE_MS)).toBe(true)
    expect(canAcceptMove(249, 0, MOVE_MS)).toBe(false)
    expect(canAcceptMove(250, 0, MOVE_MS)).toBe(true)
    expect(canAcceptMove(400, 100, MOVE_MS)).toBe(true)
  })

  it('maps arrows and WASD, and ignores other keys', () => {
    expect(facingFromKey('ArrowUp')).toBe('n')
    expect(facingFromKey('d')).toBe('e')
    expect(facingFromKey('S')).toBe('s')
    expect(facingFromKey('a')).toBe('w')
    expect(facingFromKey('e')).toBeNull()
    expect(facingFromKey('Enter')).toBeNull()
  })
})
