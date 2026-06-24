import type { HTMLAttributes } from 'react'
import styles from './IconChip.module.css'

export type IconChipTone = 'muted' | 'gold' | 'blue' | 'green' | 'red' | 'violet' | 'ember'
export type IconChipSize = 'sm' | 'md' | 'lg'

const GLYPH_MAP: Record<string, string> = {
  '📋': 'PM',
  '⌨️': 'EN',
  '🎨': 'UX',
  '🛗': 'ELV',
  '⚠️': 'VIP',
  '🚪': '???',
  '💼': 'JOB',
  '🏆': 'WIN',
  '✨': 'LCK',
  '📈': '$',
  '🎁': 'LOOT',
  '🤝': 'ALLY',
  '💥': 'DMG',
  '🎯': 'CRT',
  '🔥': 'ATK',
  '☕': 'SPD',
  '👁️': 'DEB',
  '📉': 'BRK',
  '🚫': 'DOT',
  '🏋️': 'HP',
  '🗣️': 'ATK',
  '🤵': 'DEF',
  '📦': 'KIT',
  '🌙': 'NXT',
  '🔍': 'XP',
  '🌅': 'REV',
  '🧘': 'CAL',
  '🏷️': 'SAL',
  '📞': 'CALL',
  '💵': 'PAY',
  '⛓️': 'PIN',
  '🦈': 'ELT',
  '🪙': 'INT',
  '📎': 'CLP',
  '🗝️': 'KEY',
  '🅿️': 'PP',
  '💳': 'SWP',
  '🪑': 'SIT',
  '👔': 'TIE',
  '🟡': 'PIN',
  '🪵': 'LOG',
  '🖋️': 'SIG',
  '🪪': 'ID',
  '⚖️': 'ETH',
  '📊': 'DAT',
  '⚔️': 'DUEL',
}

function normalizeToken(value: string) {
  return value.replace(/\uFE0F/g, '')
}

export function getIconGlyph(source: string | undefined, fallback = 'UI') {
  if (!source) return fallback.slice(0, 4).toUpperCase()
  const normalized = normalizeToken(source)
  return GLYPH_MAP[source] ?? GLYPH_MAP[normalized] ?? fallback.slice(0, 4).toUpperCase()
}

export default function IconChip({
  glyph,
  tone = 'gold',
  size = 'md',
  className,
  ...rest
}: {
  glyph: string
  tone?: IconChipTone
  size?: IconChipSize
} & HTMLAttributes<HTMLSpanElement>) {
  const tight = glyph.length <= 2 ? styles.tight : ''
  const classes = [styles.chip, styles[tone], styles[size], tight, 't-display', className]
    .filter(Boolean)
    .join(' ')
  return (
    <span className={classes} aria-hidden="true" {...rest}>
      {glyph}
    </span>
  )
}
