import type { Enemy, PlayerClass } from '@/types'
import type { CoworkerId, EncounterId } from './ids'

export const OFFICE_ENCOUNTERS: Record<
  EncounterId,
  Enemy & {
    rank: number
    boss: boolean
    recruit: CoworkerId | null
    xp: number
    options: number
    declinable: boolean
    titleCard: string
    eyebrow?: string
  }
> = {
  enc_desk_challenger: {
    floor: 0,
    rank: 0,
    name: 'Gavin',
    emoji: '📎',
    spriteId: 'overachiever',
    maxHp: 70,
    atk: 8,
    def: 6,
    types: ['normal'],
    title: 'THE DESK NEIGHBOR',
    titleCard: 'DESK-PIT ARGUMENT',
    taunt: 'You fixed the printer. Fix this.',
    defeat: 'Gavin returns to his desk and types nothing, loudly.',
    boss: false,
    recruit: 'cw_desk_challenger',
    xp: 15,
    options: 8,
    declinable: true,
    moves: [
      { name: 'Well, Actually', dmg: 10, type: 'normal' },
      {
        name: 'Passive-Aggressive Sticky Note',
        dmg: 12,
        type: 'influence',
        status: { id: 'demoralized', target: 'enemy', chance: 0.3 },
      },
    ],
  },
  enc_meeting_prepper: {
    floor: 1,
    rank: 1,
    name: 'Priya',
    emoji: '📅',
    spriteId: 'scrum',
    maxHp: 85,
    atk: 11,
    def: 7,
    types: ['strategy'],
    title: 'THE MEETING COORDINATOR',
    titleCard: 'PRE-MEETING SPAR',
    taunt: "I've blocked fifteen minutes for this.",
    defeat: 'Priya ends the meeting four minutes early. Unheard of.',
    boss: false,
    recruit: 'cw_meeting_prepper',
    xp: 22,
    options: 11,
    declinable: true,
    moves: [
      {
        name: 'Calendar Hold',
        dmg: 12,
        type: 'strategy',
        status: { id: 'micromanaged', target: 'enemy', chance: 0.4 },
      },
      { name: 'Agenda Item', dmg: 14, type: 'strategy' },
      { name: 'Circle Back', dmg: 8, type: 'influence', heal: 10 },
    ],
  },
  enc_supervisor_1on1: {
    floor: 2,
    rank: 2,
    name: 'Holloway',
    emoji: '📋',
    spriteId: 'manager',
    maxHp: 130,
    atk: 14,
    def: 9,
    types: ['influence', 'strategy'],
    title: 'THE TEAM LEAD (INTERIM)',
    titleCard: 'ONE-ON-ONE',
    eyebrow: 'NO LEAVING EARLY',
    taunt: "There's no leaving early.",
    defeat: 'Holloway writes something in a notebook. Probably your name. Possibly a smiley.',
    boss: true,
    recruit: null,
    xp: 30,
    options: 20,
    declinable: false,
    moves: [
      {
        name: 'One-on-One',
        dmg: 14,
        type: 'influence',
        status: { id: 'demoralized', target: 'enemy', chance: 0.4 },
      },
      { name: 'Stretch Goal', dmg: 18, type: 'execution' },
      {
        name: "Let's Take This Offline",
        dmg: 10,
        type: 'strategy',
        heal: 12,
        status: { id: 'motivated', target: 'self' },
      },
    ],
  },
}

const NONE_PERK = { name: 'None', desc: '', icon: '' }

export const COWORKER_KITS: Record<CoworkerId, PlayerClass> = {
  cw_desk_challenger: {
    id: 'pm',
    name: 'Gavin',
    emoji: '📎',
    spriteId: 'overachiever',
    maxHp: 70,
    atk: 10,
    def: 8,
    spd: 10,
    types: ['normal'],
    desc: 'Senior Associate. Corrects you. Loudly.',
    perk: NONE_PERK,
    moves: [
      {
        name: 'Well, Actually',
        dmg: 10,
        type: 'normal',
        desc: 'Corrects you. Loudly.',
        pp: 20,
      },
      {
        name: 'Passive-Aggressive Sticky Note',
        dmg: 12,
        type: 'influence',
        desc: "Left on the monitor. Signed 'thx'.",
        pp: 10,
        status: { id: 'demoralized', target: 'enemy', chance: 0.4 },
      },
    ],
  },
  cw_meeting_prepper: {
    id: 'pm',
    name: 'Priya',
    emoji: '📅',
    spriteId: 'scrum',
    maxHp: 80,
    atk: 11,
    def: 9,
    spd: 10,
    types: ['strategy'],
    desc: 'Ops. Front-loads the calendar.',
    perk: NONE_PERK,
    moves: [
      {
        name: 'Calendar Hold',
        dmg: 12,
        type: 'strategy',
        desc: 'Blocks their afternoon.',
        pp: 12,
        status: { id: 'micromanaged', target: 'enemy', chance: 0.5 },
      },
      {
        name: 'Agenda Item',
        dmg: 14,
        type: 'strategy',
        desc: 'Item 4 is you.',
        pp: 15,
      },
      {
        name: 'Circle Back',
        dmg: 8,
        type: 'influence',
        desc: 'Reschedules the damage.',
        pp: 8,
        heal: 10,
      },
    ],
  },
}

export const COWORKER_NAME: Record<CoworkerId, string> = {
  cw_desk_challenger: 'Gavin',
  cw_meeting_prepper: 'Priya',
}
