import { describe, expect, it } from 'vitest'
import { ELEVATOR_FLOORS, OFFICE_FLOOR_COUNT } from '@/content/office'
import { COACH_COPY } from '@/screens/office/overlays'
import { CLIMB_FLOORS, FLOOR_INK } from '@/screens/office/floorInk'

describe('Pass F onboarding chrome', () => {
  it('keeps the first-run coach verbs and teaching lines', () => {
    expect(COACH_COPY.coach_move).toEqual({ key: 'MOVE', rest: 'arrows, WASD, or the pad.' })
    expect(COACH_COPY.coach_pin).toEqual({ key: 'PIN', rest: 'gold chip. That is your next stop.' })
    expect(COACH_COPY.coach_interact).toEqual({ key: 'TALK', rest: 'E or tap ACT.' })
    expect(COACH_COPY.coach_elevator).toEqual({ key: 'RIDE', rest: 'face the doors, then E.' })
    expect(COACH_COPY.coach_roster).toEqual({
      key: 'TEAM',
      rest: 'three seats. Sending someone back is free.',
    })
    expect(COACH_COPY.coach_switch).toEqual({
      key: 'SWITCH',
      rest: 'send in the next person. Costs your turn.',
    })
  })

  it('briefs Floors 1–5 in climb order with the same inks as the start-card tower', () => {
    expect(OFFICE_FLOOR_COUNT).toBe(5)
    expect(CLIMB_FLOORS.map((row) => row.number)).toEqual([1, 2, 3, 4, 5])
    expect(CLIMB_FLOORS.map((row) => row.name)).toEqual([
      'YOUR TEAM',
      'OPERATIONS',
      'PRODUCT',
      'SALES',
      'EXEC',
    ])
    expect(ELEVATOR_FLOORS.map((row) => FLOOR_INK[row.number])).toEqual([
      '#d4af37',
      '#e07a5f',
      '#7c9cff',
      '#e0844d',
      '#ffc107',
    ])
  })
})
