import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StagedSprite from '@/components/StagedSprite'
import { popupAnchor } from '@/sequencer'

// vitest/jsdom rewrites import.meta.url; read from the repo root.
const repo = (...parts: string[]) => readFileSync(join(process.cwd(), ...parts), 'utf8')

const WIDE = '@container stage (min-width: 700px)'

/** Split a stylesheet into the rules outside / inside the wide-stage block. */
function splitWide(css: string) {
  const at = css.indexOf(WIDE)
  expect(at).toBeGreaterThan(-1)
  let depth = 0
  let end = at
  for (let i = css.indexOf('{', at); i < css.length; i++) {
    if (css[i] === '{') depth++
    if (css[i] === '}') depth--
    if (depth === 0) {
      end = i + 1
      break
    }
  }
  return { outside: css.slice(0, at) + css.slice(end), inside: css.slice(at, end) }
}

describe('Pass J battle — desktop combatants', () => {
  const tsx = repo('src/screens/BattleScreen.tsx')
  const css = repo('src/screens/BattleScreen.module.css')
  const { outside, inside } = splitWide(css)

  it('keeps the phone sprite sizes on the StagedSprite props', () => {
    // The 472 canvas is composed around these; the desktop block scales
    // them through CSS, never by changing the props.
    expect(tsx).toMatch(/spriteId=\{enemy\.spriteId\}\s+size=\{164\}/)
    expect(tsx).toMatch(/spriteId=\{player\.spriteId\}\s+size=\{154\}/)
  })

  it('scales both combatants only inside the wide-stage block', () => {
    expect(inside).toMatch(/\.enemyStand\s*\{[^}]*--staged-size:\s*236px/)
    expect(inside).toMatch(/\.playerStand\s*\{[^}]*--staged-size:\s*224px/)
    expect(outside).not.toContain('--staged-size')
  })

  it('stages the combatants in opposite corners on both canvases', () => {
    expect(outside).toMatch(/\.enemyStand\s*\{[^}]*top:\s*4%;[^}]*right:\s*8px/)
    expect(outside).toMatch(/\.playerStand\s*\{[^}]*bottom:\s*2%;[^}]*left:\s*12px/)
    expect(inside).toMatch(/\.enemyStand\s*\{[^}]*top:\s*\d+px;[^}]*right:\s*\d+px/)
    expect(inside).toMatch(/\.playerStand\s*\{[^}]*bottom:\s*\d+px;[^}]*left:\s*\d+px/)
    // Positioning lives in the module, not inline on the stands.
    expect(tsx).not.toMatch(/style=\{\{ position: 'absolute', top: '4%'/)
    expect(tsx).not.toMatch(/style=\{\{ position: 'absolute', bottom: '2%'/)
  })

  it('mounts damage numbers inside the stand they target', () => {
    expect(tsx).toMatch(/enemyStand[\s\S]*?filter\(\(p\) => p\.target === 'enemy'\)/)
    expect(tsx).toMatch(/playerStand[\s\S]*?filter\(\(p\) => p\.target === 'player'\)/)
  })
})

describe('StagedSprite — CSS-driven size', () => {
  it('publishes the size prop as a default an ancestor can override', () => {
    const html = renderToStaticMarkup(createElement(StagedSprite, { spriteId: 'pm', size: 164 }))
    expect(html).toContain('--staged-size-default:164px')
    expect(html).toContain('--staged-ring-scale:1')
    // The inner PixelSprite fills the stage instead of carrying its own px.
    expect(html).toMatch(/width:100%/)
    expect(html).not.toMatch(/width:164px/)
  })

  it('derives width, ring and shadow from the resolved size', () => {
    const css = repo('src/components/StagedSprite.module.css')
    expect(css).toContain('--staged-w: var(--staged-size, var(--staged-size-default))')
    expect(css).toMatch(/\.stage\s*\{[^}]*width:\s*var\(--staged-w\)/)
    expect(css).toMatch(/\.ring\s*\{[^}]*width:\s*var\(--staged-ring-w\)/)
    expect(css).toMatch(/\.shadow\s*\{[^}]*width:\s*calc\(var\(--staged-ring-w\) \* 1\.15\)/)
  })

  it('does not size children from the prop in JS any more', () => {
    const src = repo('src/components/StagedSprite.tsx')
    expect(src).not.toMatch(/size \* 0\.82/)
    expect(src).toContain('size="100%"')
  })
})

describe('damage popups — stand-relative anchors', () => {
  it('spills enemy numbers left of the enemy and player numbers right of the player', () => {
    const lo = popupAnchor('enemy', () => 0)
    const hi = popupAnchor('enemy', () => 1)
    expect(lo).toEqual({ x: -20, y: 22 })
    expect(hi).toEqual({ x: 10, y: 40 })
    const plo = popupAnchor('player', () => 0)
    const phi = popupAnchor('player', () => 1)
    expect(plo).toEqual({ x: 55, y: 12 })
    expect(phi).toEqual({ x: 85, y: 30 })
    // Percentages of the stand: every anchor stays on the upper body.
    for (const a of [lo, hi, plo, phi]) {
      expect(a.y).toBeGreaterThanOrEqual(10)
      expect(a.y).toBeLessThanOrEqual(45)
    }
  })

  it('renders the anchor as percentages so it tracks the sprite size', () => {
    const src = repo('src/components/DamageNumber.tsx')
    expect(src).toContain('left: `${popup.x}%`')
    expect(src).toContain('top: `${popup.y}%`')
  })
})
