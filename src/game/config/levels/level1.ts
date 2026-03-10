import { LevelConfig } from './types'
import {
  quadStudentDialogue,
  libraryNpcDialogue,
  partyInviteDialogue,
  preBossDialogue,
} from '../dialogues/level1Dialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level1: LevelConfig = {
  id: 'level1',
  name: 'Freshman Year',
  theme: 'campus',
  width: 8000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 8000, top: 0, bottom: 720 },

  backgrounds: [
    // Sky / distant campus buildings
    {
      color: 0x1a1a2e,
      scrollFactor: 0.1,
      rects: [
        { x: 200, y: 280, width: 300, height: 440, color: 0x2a2a4e },
        { x: 600, y: 320, width: 200, height: 400, color: 0x2a2a4e },
        { x: 1000, y: 260, width: 250, height: 460, color: 0x2a2a4e },
        { x: 1500, y: 300, width: 180, height: 420, color: 0x2a2a4e },
        { x: 1900, y: 340, width: 220, height: 380, color: 0x2a2a4e },
      ],
    },
    // Mid-ground — dorm buildings / trees
    {
      color: 0x16213e,
      scrollFactor: 0.3,
      rects: [
        { x: 100, y: 380, width: 280, height: 340, color: 0x2d4a3a },
        { x: 600, y: 400, width: 200, height: 320, color: 0x3a2d4a },
        { x: 1100, y: 370, width: 240, height: 350, color: 0x2d4a3a },
        { x: 1600, y: 410, width: 180, height: 310, color: 0x3a2d4a },
        { x: 2100, y: 390, width: 200, height: 330, color: 0x2d4a3a },
      ],
    },
    // Near foliage
    {
      color: 0x1B2A4A,
      scrollFactor: 0.6,
      rects: [
        { x: 300, y: 560, width: 90, height: 60, color: 0x2d5a3a },
        { x: 900, y: 555, width: 80, height: 65, color: 0x2d5a3a },
        { x: 1800, y: 560, width: 100, height: 60, color: 0x2d5a3a },
        { x: 2800, y: 555, width: 85, height: 65, color: 0x2d5a3a },
        { x: 3800, y: 560, width: 90, height: 60, color: 0x2d5a3a },
        { x: 5200, y: 555, width: 80, height: 65, color: 0x2d5a3a },
        { x: 6400, y: 560, width: 100, height: 60, color: 0x2d5a3a },
      ],
    },
  ],

  platforms: [
    // ── Section 1: The Quad (0–1400) ──
    // Ground
    { x: 700, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Gentle intro platforms
    { x: 500, y: 580, width: 180, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 900, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1200, y: 500, width: 140, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 2: The Library (1400–2800) ──
    // Ground with a small gap at 1800-1900
    { x: 1550, y: GROUND_Y, width: 300, height: GROUND_H, type: 'solid', color: 0x374151 },
    { x: 2250, y: GROUND_Y, width: 1100, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Library staircase platforms
    { x: 1600, y: 600, width: 120, height: 20, type: 'solid', color: 0x6B7280 },
    { x: 1750, y: 550, width: 120, height: 20, type: 'solid', color: 0x6B7280 },
    { x: 1950, y: 510, width: 200, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 2200, y: 460, width: 180, height: 20, type: 'one-way', color: 0x7C3AED },
    // Moving platform over the gap
    { x: 1850, y: 640, width: 120, height: 20, type: 'moving', moveX: 150, moveSpeed: 60, color: 0x10B981 },

    // ── Section 3: Greek Row (2800–4200) ──
    // Ground
    { x: 3500, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Party platforms — bouncier layout
    { x: 3000, y: 560, width: 150, height: 20, type: 'one-way', color: 0xEC4899 },
    { x: 3300, y: 480, width: 140, height: 20, type: 'one-way', color: 0xEC4899 },
    { x: 3600, y: 520, width: 160, height: 20, type: 'one-way', color: 0xEC4899 },
    { x: 3900, y: 440, width: 130, height: 20, type: 'one-way', color: 0xEC4899 },
    // Moving platform
    { x: 3450, y: 380, width: 140, height: 20, type: 'moving', moveX: 250, moveSpeed: 100, color: 0x10B981 },

    // ── Section 4: Study Gauntlet (4200–5600) ──
    // Ground with pit at 4600-4800
    { x: 4400, y: GROUND_Y, width: 400, height: GROUND_H, type: 'solid', color: 0x374151 },
    { x: 5200, y: GROUND_Y, width: 800, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Precision platforming
    { x: 4650, y: 580, width: 100, height: 20, type: 'one-way', color: 0xF59E0B },
    { x: 4800, y: 520, width: 100, height: 20, type: 'one-way', color: 0xF59E0B },
    { x: 4950, y: 580, width: 100, height: 20, type: 'one-way', color: 0xF59E0B },
    // Higher challenge route
    { x: 4700, y: 400, width: 120, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 4950, y: 360, width: 120, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 5200, y: 320, width: 120, height: 20, type: 'one-way', color: 0x7C3AED },

    // ── Section 5: Approach to Lecture Hall (5600–6600) ──
    // Ground
    { x: 6100, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Staircase up
    { x: 5800, y: 620, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 5950, y: 570, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 6100, y: 520, width: 120, height: 20, type: 'solid', color: 0x4F46E5 },
    // Wall before boss arena
    { x: 6550, y: 580, width: 30, height: 200, type: 'solid', color: 0x6B7280 },

    // ── Section 6: Boss Arena — Lecture Hall (6600–8000) ──
    // Flat boss floor
    { x: 7300, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x1E3A5F },
    // Side walls to contain the fight
    { x: 6620, y: 580, width: 30, height: 200, type: 'solid', color: 0x1E3A5F },
    { x: 7980, y: 580, width: 30, height: 200, type: 'solid', color: 0x1E3A5F },
    // Elevated platforms for dodging scantrons
    { x: 6900, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 7300, y: 480, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 7700, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
  ],

  enemies: [
    // Section 2 — Library Freeloader
    { type: 'freeloader', x: 2400, y: 600 },
    // Section 3 — Greek Row alarm clocks (party hazards)
    { type: 'alarm_clock', x: 3200, y: 520, speed: 120, direction: 1, patrolMin: 3000, patrolMax: 3600 },
    { type: 'alarm_clock', x: 3800, y: 480, speed: 150, direction: -1, patrolMin: 3600, patrolMax: 4100 },
    // Section 4 — Midterm stack rain
    { type: 'midterm_stack', x: 4700, y: 0, spawnWidth: 500, spawnInterval: 700 },
    // Section 5 — Freeloader + alarm clock gauntlet
    { type: 'freeloader', x: 5900, y: 600 },
    { type: 'alarm_clock', x: 6200, y: 560, speed: 100, direction: 1, patrolMin: 5800, patrolMax: 6500 },
  ],

  powerUps: [
    // Section 1 — tutorial espresso
    { type: 'espresso', x: 900, y: 510 },
    // Section 2 — networking card near library
    { type: 'networking_card', x: 2200, y: 430 },
    // Section 3 — PTO day reward for upper route
    { type: 'pto_day', x: 3450, y: 350 },
    // Section 4 — side hustle on hard path
    { type: 'side_hustle', x: 4950, y: 330 },
    // Section 4 — espresso before gauntlet
    { type: 'espresso', x: 5100, y: 550 },
    // Section 5 — networking card before boss
    { type: 'networking_card', x: 6300, y: 490 },
  ],

  dialogueTriggers: [
    // Section 1 — Upperclassman in the quad
    {
      id: 'quad_student',
      x: 600,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'quad_student',
      startNodeId: 'start',
      dialogueTree: quadStudentDialogue,
      oneShot: true,
      npcColor: 0xF59E0B,
      npcWidth: 40,
      npcHeight: 60,
    },
    // Section 2 — Study Group Leader in library
    {
      id: 'library_npc',
      x: 2050,
      y: 450,
      width: 80,
      height: 100,
      dialogueId: 'library_npc',
      startNodeId: 'start',
      dialogueTree: libraryNpcDialogue,
      oneShot: true,
      npcColor: 0x3B82F6,
      npcWidth: 36,
      npcHeight: 55,
    },
    // Section 3 — Party Host on Greek Row
    {
      id: 'party_host',
      x: 3500,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'party_host',
      startNodeId: 'start',
      dialogueTree: partyInviteDialogue,
      oneShot: true,
      npcColor: 0xEC4899,
      npcWidth: 44,
      npcHeight: 65,
    },
    // Section 5 — Stressed Senior before boss
    {
      id: 'pre_boss',
      x: 6400,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'pre_boss',
      startNodeId: 'start',
      dialogueTree: preBossDialogue,
      oneShot: true,
      npcColor: 0xEF4444,
      npcWidth: 38,
      npcHeight: 58,
    },
  ],

  boss: {
    type: 'no_curve',
    arenaStart: 6650,
    arenaEnd: 7950,
    arenaY: GROUND_Y,
  },

  pitZones: [
    // Library gap
    { x: 1700, width: 200, energyCost: 10 },
    // Study gauntlet pit
    { x: 4600, width: 200, energyCost: 15 },
  ],
}
