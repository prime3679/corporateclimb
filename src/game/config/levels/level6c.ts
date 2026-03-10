import { LevelConfig } from './types'
import {
  morningBoardroomDialogue,
  afternoonGarageDialogue,
  eveningReflectionDialogue,
  nightLaunchDialogue,
  dawnDialogue,
} from '../dialogues/level6cDialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level6c: LevelConfig = {
  id: 'level6c',
  name: 'The Hybrid',
  width: 5000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 5000, top: 0, bottom: 720 },

  backgrounds: [
    // Cycling time-of-day backgrounds
    {
      color: 0x1E293B,
      scrollFactor: 0.1,
      rects: [
        { x: 400, y: 200, width: 300, height: 520, color: 0x0F172A },
        { x: 1000, y: 180, width: 250, height: 540, color: 0x0F172A },
      ],
    },
    {
      color: 0x0F172A,
      scrollFactor: 0.3,
      rects: [
        { x: 300, y: 400, width: 200, height: 320, color: 0x1E293B },
        { x: 800, y: 380, width: 220, height: 340, color: 0x1E293B },
      ],
    },
    {
      color: 0x1E293B,
      scrollFactor: 0.6,
      rects: [
        { x: 500, y: 560, width: 80, height: 60, color: 0x374151 },
        { x: 1100, y: 555, width: 100, height: 65, color: 0x374151 },
      ],
    },
  ],

  platforms: [
    // Vignette 1: Morning Boardroom (0–1000)
    { x: 500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x1E3A5F },
    { x: 300, y: 600, width: 200, height: 30, type: 'solid', color: 0x44403C },
    { x: 700, y: 560, width: 140, height: 20, type: 'one-way', color: 0x3B82F6 },
    // Vignette 2: Afternoon Garage (1000–2000)
    { x: 1500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x57534E },
    { x: 1200, y: 580, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 1600, y: 540, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    // Vignette 3: Evening Rooftop (2000–3000)
    { x: 2500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x44403C },
    { x: 2300, y: 580, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    { x: 2700, y: 550, width: 140, height: 20, type: 'one-way', color: 0x92400E },
    // Vignette 4: Night Launch (3000–4000)
    { x: 3500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x0F172A },
    { x: 3300, y: 560, width: 160, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 3700, y: 520, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
    // Vignette 5: Dawn (4000–5000)
    { x: 4500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x374151 },
    { x: 4300, y: 580, width: 120, height: 20, type: 'one-way', color: 0xFBBF24 },
    { x: 4700, y: 540, width: 140, height: 20, type: 'one-way', color: 0xFBBF24 },
  ],

  // No enemies — pure narrative level
  enemies: [],

  powerUps: [
    { type: 'pto_day', x: 2500, y: 520 },
    { type: 'mentors_advice', x: 3500, y: 530 },
  ],

  dialogueTriggers: [
    {
      id: 'morning_boardroom',
      x: 500,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'morning_boardroom',
      startNodeId: 'start',
      dialogueTree: morningBoardroomDialogue,
      oneShot: true,
      npcColor: 0x1E3A5F,
      npcWidth: 38,
      npcHeight: 58,
    },
    {
      id: 'afternoon_garage',
      x: 1500,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'afternoon_garage',
      startNodeId: 'start',
      dialogueTree: afternoonGarageDialogue,
      oneShot: true,
      npcColor: 0x10B981,
      npcWidth: 36,
      npcHeight: 55,
    },
    {
      id: 'evening_reflection',
      x: 2500,
      y: 540,
      width: 80,
      height: 100,
      dialogueId: 'evening_reflection',
      startNodeId: 'start',
      dialogueTree: eveningReflectionDialogue,
      oneShot: true,
      npcColor: 0x94A3B8,
      npcWidth: 30,
      npcHeight: 40,
    },
    {
      id: 'night_launch',
      x: 3500,
      y: 520,
      width: 80,
      height: 100,
      dialogueId: 'night_launch',
      startNodeId: 'start',
      dialogueTree: nightLaunchDialogue,
      oneShot: true,
      npcColor: 0xFBBF24,
      npcWidth: 38,
      npcHeight: 58,
    },
    {
      id: 'dawn',
      x: 4500,
      y: 540,
      width: 80,
      height: 100,
      dialogueId: 'dawn',
      startNodeId: 'start',
      dialogueTree: dawnDialogue,
      oneShot: true,
      npcColor: 0xFCD34D,
      npcWidth: 30,
      npcHeight: 40,
    },
  ],

  // No boss — walking through dawn dialogue triggers ending
  pitZones: [],
}
