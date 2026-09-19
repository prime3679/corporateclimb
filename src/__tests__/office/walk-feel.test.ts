import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MOVE_MS } from '@/content/office'

const cameraCss = readFileSync(
  join(process.cwd(), 'src/screens/office/WorldMap.module.css'),
  'utf8',
)
const actorCss = readFileSync(
  join(process.cwd(), 'src/screens/office/OverworldActor.module.css'),
  'utf8',
)
const mapCss = cameraCss

describe('office walk feel — camera lockstep', () => {
  it('keeps camera follow on the same MOVE_MS linear clock as the actor', () => {
    expect(MOVE_MS).toBe(250)
    expect(cameraCss).toMatch(/transition:\s*transform\s+var\(--move-ms,\s*250ms\)\s+linear/)
    expect(cameraCss).not.toMatch(/280ms/)
    expect(actorCss).toMatch(/left\s+var\(--walk-ms\)\s+linear/)
    expect(actorCss).toMatch(/top\s+var\(--walk-ms\)\s+linear/)
  })

  it('opts the phone map out of scroll bleed and double-tap zoom', () => {
    expect(mapCss).toMatch(/\.map \{[^}]*touch-action:\s*none/)
    expect(mapCss).toMatch(/\.map \{[^}]*overscroll-behavior:\s*none/)
  })
})
