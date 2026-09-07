import { ELEVATOR_FLOORS, type ElevatorFloorRow } from '@/content/office'

/**
 * Department inks shared by the start-card tower, role-select climb
 * strip, and celebration tints. One building, not five palettes.
 */
export const FLOOR_INK: Record<ElevatorFloorRow['number'], string> = {
  1: '#ffc107',
  2: '#e0844d',
  3: '#7c9cff',
  4: '#e07a5f',
  5: '#d4af37',
}

/** Cab panel is 5→1. First-run briefing climbs 1→5. */
export const CLIMB_FLOORS: readonly ElevatorFloorRow[] = [...ELEVATOR_FLOORS].reverse()
