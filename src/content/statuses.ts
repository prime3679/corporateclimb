import type { StatusDef, StatusId } from '../types'

// ─── STATUS DEFINITIONS ─────────────────────────────────────
export const STATUS_DEFS: Record<StatusId, StatusDef> = {
  motivated: {
    id: 'motivated',
    name: 'Motivated',
    icon: '\u{1F525}',
    color: '#FF6F00',
    duration: 3,
    desc: '+ATK',
  },
  focused: {
    id: 'focused',
    name: 'Focused',
    icon: '\u{1F3AF}',
    color: '#7B1FA2',
    duration: 3,
    desc: '+Crit',
  },
  caffeinated: {
    id: 'caffeinated',
    name: 'Caffeinated',
    icon: '\u2615',
    color: '#4E342E',
    duration: 3,
    desc: '+SPD -DEF',
  },
  micromanaged: {
    id: 'micromanaged',
    name: 'Micromanaged',
    icon: '\u{1F441}\uFE0F',
    color: '#B71C1C',
    duration: 2,
    desc: '-ATK',
  },
  demoralized: {
    id: 'demoralized',
    name: 'Demoralized',
    icon: '\u{1F4C9}',
    color: '#4A148C',
    duration: 2,
    desc: '-DEF',
  },
  burned_out: {
    id: 'burned_out',
    name: 'Burned Out',
    icon: '\u{1F6AB}',
    color: '#616161',
    duration: 3,
    desc: 'DoT',
  },
}
