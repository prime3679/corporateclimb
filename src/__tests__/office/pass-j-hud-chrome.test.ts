import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { ITEMS } from '@/data'
import { dispatchOfficeAction, newOfficeCampaign, type OfficeState } from '@/engine/office'
import PartyStrip, { PartyChips } from '@/screens/office/PartyStrip'
import { hudKeyChips } from '@/screens/office/cast'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

function start(): OfficeState {
  const seeded = dispatchOfficeAction(newOfficeCampaign(PM), { type: 'ACK_RECEIPT' }).state
  return { ...seeded, overlay: null, overlayQueue: [] }
}

const CSS = readFileSync(join(process.cwd(), 'src/screens/office/OfficeScreen.module.css'), 'utf8')

/** The `@container stage (min-width: 700px)` block — desktop canvas only. */
function wideStageBlock(): string {
  const at = CSS.indexOf('@container stage (min-width: 700px)')
  expect(at).toBeGreaterThan(-1)
  const open = CSS.indexOf('{', at)
  let depth = 0
  for (let i = open; i < CSS.length; i++) {
    if (CSS[i] === '{') depth++
    else if (CSS[i] === '}' && --depth === 0) return CSS.slice(open, i + 1)
  }
  throw new Error('unterminated wide-stage block')
}

describe('Pass J — Office HUD chrome says what it is', () => {
  it('names the bag chip and lists what it holds', () => {
    const s = start()
    expect(s.run.inventory.length).toBeGreaterThan(0)
    const bag = hudKeyChips(s).find((c) => c.id === 'bag')!
    expect(bag.label.startsWith('Bag ')).toBe(true)
    for (const id of s.run.inventory) {
      expect(bag.label).toContain(ITEMS[id].emoji)
      expect(bag.title).toContain(ITEMS[id].name)
    }
  })

  it('gives every key chip a tooltip', () => {
    const s: OfficeState = {
      ...start(),
      keyItems: {
        key_offer_letter: 2,
        key_toner: 1,
        key_access_badge: 1,
        key_employee_badge: 1,
        key_product_badge: 1,
        key_client_badge: 1,
      },
    }
    const chips = hudKeyChips(s)
    expect(chips.map((c) => c.id)).toEqual([
      'letter',
      'toner',
      'access',
      'employee',
      'product',
      'client',
      'bag',
    ])
    for (const chip of chips) expect(chip.title.length).toBeGreaterThan(0)
    expect(chips[0].title).toBe('Offer letter ×2')
  })

  it('keeps open seats off the HUD strip until someone fills them', () => {
    const s = start()
    expect(s.party.length).toBe(1)
    const hud = renderToStaticMarkup(createElement(PartyStrip, { state: s }))
    expect(hud).not.toContain('Open seat')
    expect(hud.match(/aria-label="YOU /g)?.length).toBe(1)
    // The recruit card's "he goes here" still draws the dotted seats.
    const card = renderToStaticMarkup(createElement(PartyChips, { state: s, emptyHighlight: true }))
    expect(card.match(/Open seat/g)?.length).toBe(2)
  })
})

describe('Pass J — desktop thumb band density', () => {
  it('keeps the phone ACT disc prominent', () => {
    // Scaled pad/team/Title targets are exercised at actual phone widths in
    // e2e/touch-layout.spec.ts; their old fixed design pixels shrank below 44px.
    expect(CSS).toMatch(/\.act \{[^}]*width: 84px;\s*height: 84px;/)
  })

  it('tightens only the wide-stage canvas', () => {
    const wide = wideStageBlock()
    expect(wide).toMatch(/\.act \{[^}]*width: 64px;\s*height: 64px;/)
    expect(wide).toMatch(/\.team \{[^}]*width: 44px;\s*height: 44px;/)
    expect(wide).toMatch(/\.dpad \{[^}]*repeat\(3, 44px\)/)
    expect(wide).toMatch(/\.ctlRight \{[^}]*flex-direction: row;/)
    expect(wide).toMatch(/\.ctl \{[^}]*height: 144px;/)
  })

  it('keeps the band legend in the Stage keyboard column language', () => {
    expect(CSS).toMatch(
      /\.legendKeys \{[^}]*font-family: var\(--cc-font-body\);[^}]*font-size: 12px;/,
    )
    expect(CSS).toMatch(
      /\.kbd \{[^}]*border-bottom-width: 2px;[^}]*font: inherit;[^}]*line-height: 16px;/,
    )
  })
})
