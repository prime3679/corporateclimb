import { LevelConfig } from './types'
import {
  rooftopGuideDialogue,
  mentorADialogue,
  mentorBDialogue,
} from '../dialogues/level5Dialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level5: LevelConfig = {
  id: 'level5',
  name: 'The Crossroads',
  theme: 'executive',
  width: 6000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 6000, top: 0, bottom: 720 },

  backgrounds: [
    // Far: golden hour skyline
    {
      color: 0x1C1917,
      scrollFactor: 0.1,
      rects: [
        { x: 400, y: 200, width: 300, height: 520, color: 0x292524 },
        { x: 900, y: 240, width: 250, height: 480, color: 0x292524 },
        { x: 1500, y: 180, width: 350, height: 540, color: 0x292524 },
        { x: 2200, y: 220, width: 280, height: 500, color: 0x292524 },
      ],
    },
    // Mid: warm golden tones
    {
      color: 0x292524,
      scrollFactor: 0.3,
      rects: [
        { x: 300, y: 400, width: 200, height: 320, color: 0x44403C },
        { x: 800, y: 380, width: 180, height: 340, color: 0x44403C },
        { x: 1400, y: 360, width: 220, height: 360, color: 0x44403C },
      ],
    },
    // Near: rooftop details
    {
      color: 0x44403C,
      scrollFactor: 0.6,
      rects: [
        { x: 400, y: 560, width: 80, height: 50, color: 0x57534E },
        { x: 900, y: 555, width: 100, height: 55, color: 0x57534E },
        { x: 1500, y: 560, width: 70, height: 50, color: 0x57534E },
      ],
    },
  ],

  platforms: [
    // ── Zone 1: Rooftop Garden (0–2000) ──
    { x: 1000, y: GROUND_Y, width: 2000, height: GROUND_H, type: 'solid', color: 0x57534E },
    // Garden benches / planters
    { x: 400, y: 620, width: 120, height: 30, type: 'solid', color: 0x78716C },
    { x: 700, y: 580, width: 100, height: 20, type: 'one-way', color: 0x92400E },
    { x: 1100, y: 550, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    { x: 1500, y: 580, width: 100, height: 20, type: 'one-way', color: 0x92400E },
    // Fork visual — two raised ramps
    { x: 1800, y: 620, width: 200, height: 20, type: 'one-way', color: 0x78716C },

    // ── Zone 2a: Corporate Tower (upper path, 2000–4000) ──
    { x: 3000, y: GROUND_Y - 100, width: 2000, height: GROUND_H, type: 'solid', color: 0x1E3A5F },
    // Glass tower platforms — cool blue
    { x: 2200, y: 540, width: 160, height: 20, type: 'one-way', color: 0x3B82F6 },
    { x: 2500, y: 480, width: 140, height: 20, type: 'one-way', color: 0x3B82F6 },
    { x: 2800, y: 520, width: 120, height: 20, type: 'one-way', color: 0x3B82F6 },
    { x: 3200, y: 460, width: 160, height: 20, type: 'one-way', color: 0x3B82F6 },
    { x: 3600, y: 500, width: 140, height: 20, type: 'one-way', color: 0x3B82F6 },
    // Tower walls
    { x: 2050, y: 400, width: 20, height: 360, type: 'solid', color: 0x1E3A5F },
    { x: 3950, y: 400, width: 20, height: 360, type: 'solid', color: 0x1E3A5F },

    // ── Zone 2b: Garage/Workshop (lower path, 2000–4000) ──
    { x: 3000, y: GROUND_Y + 50, width: 2000, height: GROUND_H, type: 'solid', color: 0x78350F },
    // Garage platforms — warm tones
    { x: 2300, y: GROUND_Y, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 2600, y: GROUND_Y - 30, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 2900, y: GROUND_Y + 10, width: 100, height: 20, type: 'solid', color: 0x92400E },
    { x: 3300, y: GROUND_Y - 20, width: 130, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 3700, y: GROUND_Y, width: 110, height: 20, type: 'one-way', color: 0xD97706 },

    // ── Zone 3: The Mirror Arena (4000–6000) ──
    { x: 5000, y: GROUND_Y, width: 2000, height: GROUND_H, type: 'solid', color: 0x1E293B },
    // Reflective platform
    { x: 5000, y: 560, width: 400, height: 15, type: 'solid', color: 0xE2E8F0 },
    // Arena walls
    { x: 4020, y: 500, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    { x: 5980, y: 500, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    // Side platforms
    { x: 4400, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 5600, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
  ],

  enemies: [
    // Golden Handcuffs on corporate path
    { type: 'golden_handcuffs', x: 2400, y: 500 },
    { type: 'golden_handcuffs', x: 2700, y: 440 },
    { type: 'golden_handcuffs', x: 3100, y: 420 },
    { type: 'golden_handcuffs', x: 3500, y: 460 },
  ],

  powerUps: [
    // Rooftop garden PTO
    { type: 'pto_day', x: 1100, y: 520 },
    // Mentor's Advice (awarded via dialogue, but placed here as a visual)
    { type: 'mentors_advice', x: 3800, y: 540 },
  ],

  dialogueTriggers: [
    // Zone 1 — Rooftop guide
    {
      id: 'rooftop_guide',
      x: 600,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'rooftop_guide',
      startNodeId: 'start',
      dialogueTree: rooftopGuideDialogue,
      oneShot: true,
      npcColor: 0xFBBF24,
      npcWidth: 30,
      npcHeight: 40,
    },
    // Zone 2a — Executive Mentor (corporate tower)
    {
      id: 'mentor_corporate',
      x: 3200,
      y: 420,
      width: 80,
      height: 100,
      dialogueId: 'mentor_corporate',
      startNodeId: 'start',
      dialogueTree: mentorADialogue,
      oneShot: true,
      npcColor: 0x3B82F6,
      npcWidth: 38,
      npcHeight: 58,
    },
    // Zone 2b — Founder Mentor (garage)
    {
      id: 'mentor_garage',
      x: 3300,
      y: GROUND_Y + 10,
      width: 80,
      height: 100,
      dialogueId: 'mentor_garage',
      startNodeId: 'start',
      dialogueTree: mentorBDialogue,
      oneShot: true,
      npcColor: 0xD97706,
      npcWidth: 38,
      npcHeight: 58,
    },
  ],

  boss: {
    type: 'mirror',
    arenaStart: 4050,
    arenaEnd: 5950,
    arenaY: GROUND_Y,
  },

  pitZones: [],
}
