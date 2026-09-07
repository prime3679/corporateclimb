import type { FloorId } from './ids'

/** Warm ceiling fixture kinds. Presentation maps these onto WorldMap CSS. */
export type OfficeLightPoolKind =
  | 'elevator'
  | 'desks'
  | 'break'
  | 'meeting'
  | 'reception'
  | 'war'
  | 'intake'
  | 'product'
  | 'pipeline'
  | 'client'
  | 'sales'
  | 'ante'
  | 'exec'

export interface OfficeLightPool {
  kind: OfficeLightPoolKind
  left?: number
  top?: number
  width?: number
  height?: number
}

/**
 * One pool per room. Floors 3–5 keep a landing pool so the elevator pin
 * reads under the same warm light as Floors 1–2.
 */
export const OFFICE_LIGHT_POOLS: Record<FloorId, readonly OfficeLightPool[]> = {
  floor_01: [
    { kind: 'elevator' },
    { kind: 'desks' },
    { kind: 'break' },
    { kind: 'meeting' },
    { kind: 'reception' },
  ],
  floor_02: [
    { kind: 'elevator', left: 20, top: 40, width: 180 },
    { kind: 'desks', left: 230, top: 30, width: 220 },
    { kind: 'meeting', left: 500, top: 40, width: 240 },
    { kind: 'reception', left: 20, top: 330, width: 200, height: 170 },
    { kind: 'break', left: 270, top: 330 },
    { kind: 'break', left: 520, top: 330, width: 220 },
  ],
  floor_03: [
    { kind: 'elevator', left: 20, top: 40, width: 180 },
    { kind: 'war', left: 230, top: 30, width: 220 },
    { kind: 'intake', left: 500, top: 40, width: 240 },
    { kind: 'break', left: 20, top: 330, width: 220 },
    { kind: 'product', left: 480, top: 330, width: 240, height: 170 },
  ],
  floor_04: [
    { kind: 'elevator', left: 20, top: 40, width: 180 },
    { kind: 'pipeline', left: 230, top: 30, width: 220 },
    { kind: 'client', left: 500, top: 40, width: 240 },
    { kind: 'break', left: 20, top: 330, width: 220 },
    { kind: 'sales', left: 480, top: 330, width: 240, height: 170 },
  ],
  floor_05: [
    { kind: 'elevator', left: 20, top: 40, width: 180 },
    { kind: 'ante', left: 230, top: 30, width: 420 },
    { kind: 'break', left: 20, top: 330, width: 220 },
    { kind: 'exec', left: 350, top: 330, width: 320, height: 180 },
  ],
}
