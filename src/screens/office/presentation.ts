import { COMPACT_DESIGN_HEIGHT, computeStageLayout } from '@/ui/Stage'
import { celebrationCopy, type CelebrationScreen, type OfficeState } from '@/engine/office'

/**
 * Pass H / I presentation contract — short-stage chrome, celebration/title
 * readability, the 15-speaker Headshot roster, and the §12 / §13 / §19
 * evidence the roadmap ticks.
 *
 * CSS mirrors `COMPACT_DESIGN_HEIGHT` via `@container stage (max-height: 820px)`.
 * Safe-area insets live on `#root` (`index.html`); Stage measures that
 * padded backdrop so notches never eat the HUD.
 */

export const OFFICE_COMPACT_STAGE_H = COMPACT_DESIGN_HEIGHT

/** Titles must fit one line of `--display-lg` (30px Anton) on a 472 canvas. */
export const CELEBRATION_TITLE_MAX_CHARS = 16

export const OFFICE_START_TITLE = 'THE OFFICE'

export function officeStageCompact(stageH: number): boolean {
  return stageH <= OFFICE_COMPACT_STAGE_H
}

/** Short-stage clamp used by the e2e / playtest viewport (440×760). */
export function playtestStageIsCompact(availW = 440, availH = 760): boolean {
  return officeStageCompact(computeStageLayout(availW, availH).height)
}

const CELEBRATION_SCREENS: CelebrationScreen[] = [
  'screen_preview_complete',
  'screen_floor2_complete',
  'screen_floor3_complete',
  'screen_floor4_complete',
  'screen_floor5_complete',
]

/** Every celebration title stays short enough to read at compact type. */
export function celebrationTitleLengths(
  state: OfficeState,
): { screen: CelebrationScreen; title: string }[] {
  return CELEBRATION_SCREENS.map((screen) => ({
    screen,
    title: celebrationCopy(state, screen).title,
  }))
}

/**
 * Presentation evidence for mvp-design §12 / §13 / §19. These are code
 * surfaces, not a hardware CoS playtest — that remains the merge gate.
 */
export const PRESENTATION_SIGNOFF = {
  section12: [
    'src/screens/office/useOfficeFeedback.ts — §12 matrix (SFX + Haptics + live region)',
    'src/screens/office/overlays.tsx — coach-mark copy + 120ms scale-in (Pass F)',
    'docs/rpg/office-audio.md — Office beds, cab, CLEARED/THE NOD, combat duck (Pass E)',
  ],
  section13: [
    'OfficeScreen scene veils — overworld ↔ battle 200–480ms, reduced-motion hold',
    'elevator ride plan — doors / ticks / fade (Pass G); no hard music cut',
    'celebration + interstitial — named return tiles, fanfare / TIME OUT',
  ],
  section19: [
    'index.html — viewport-fit=cover + #root env(safe-area-inset-*)',
    'Stage ResizeObserver — absorbs safe-area padding and mobile URL-bar collapse',
    'tokens.css — --text-floor 10px, --tap-min 54px before Stage scale',
    'compact chrome at design height ≤ 820 — HUD / start / celebration',
    'Headshot focals — house crop; Sloane eyes pinned (Pass H)',
    'Pass I ambient Headshots — 15 unique plates; no extra side-cast NPCs',
    'Pass J visual — Kessler / Renata house focals, Sloane chibi tie, two-cell CALDWELL plate',
    'Pass J house plates — F1–2 recast to Office-only 512s (scripts/gen_office_plates.py); Classic files untouched',
    'Pass J pose energy — all seven F1–2 plates gestured to the F3–5 bar; props below the shoulder line, badge crops clean',
    'Pass J signage — F2 HELP / DESK stacks in one cell; seven-glyph room signs frame inside the cell',
    'Pass G live 1→5 E2E — no Floor 6, THE NOD, save/load, Caldwell phase 2',
  ],
} as const

/**
 * Pass I Headshot roster. The 5-floor climb has exactly these 15 speakers.
 * F1–2 house plates are Office-only 512s recast in Pass J (they used to
 * borrow the Classic enemy files `recruiter` / `overachiever` / …, which
 * Classic still owns untouched). F3–5 use named plates shipped in Pass E.
 * There is no extra ambient NPC to commission — Floor 2 made People Ops a
 * tray so it would not grow a fourth face. Same `sprites.ts` / `Headshot`
 * crop; no second portrait system.
 */
export const OFFICE_CAST_HEADSHOTS = {
  house: {
    renata: 'renata',
    gavin: 'gavin',
    priya: 'priya',
    holloway: 'holloway',
    teddy: 'teddy',
    whitlock: 'whitlock',
    kessler: 'kessler',
  },
  named: {
    sloane: 'sloane',
    nico: 'nico',
    quincy: 'quincy',
    harper: 'harper',
    reyes: 'reyes',
    ashford: 'ashford',
    marlowe: 'marlowe',
    caldwell: 'caldwell',
  },
} as const

export const OFFICE_CAST_SPEAKER_COUNT =
  Object.keys(OFFICE_CAST_HEADSHOTS.house).length + Object.keys(OFFICE_CAST_HEADSHOTS.named).length

export function officeCastSpriteIds(): string[] {
  return [
    ...Object.values(OFFICE_CAST_HEADSHOTS.house),
    ...Object.values(OFFICE_CAST_HEADSHOTS.named),
  ]
}
