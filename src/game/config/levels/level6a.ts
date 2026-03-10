import { LevelConfig } from './types'
import {
  lonelyLunchDialogue,
  vpEncounterDialogue,
  boardRoomDialogue,
} from '../dialogues/level6aDialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level6a: LevelConfig = {
  id: 'level6a',
  name: 'Corner Office',
  width: 8000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 8000, top: 0, bottom: 720 },

  backgrounds: [
    {
      color: 0x0F172A,
      scrollFactor: 0.1,
      rects: [
        { x: 400, y: 150, width: 300, height: 570, color: 0x1E293B },
        { x: 900, y: 180, width: 250, height: 540, color: 0x1E293B },
        { x: 1500, y: 130, width: 380, height: 590, color: 0x1E293B },
      ],
    },
    {
      color: 0x1E293B,
      scrollFactor: 0.3,
      rects: [
        { x: 300, y: 380, width: 200, height: 340, color: 0x44403C },
        { x: 900, y: 360, width: 240, height: 360, color: 0x44403C },
        { x: 1600, y: 370, width: 220, height: 350, color: 0x44403C },
      ],
    },
    {
      color: 0x44403C,
      scrollFactor: 0.6,
      rects: [
        { x: 600, y: 550, width: 60, height: 80, color: 0x78350F },
        { x: 1400, y: 555, width: 70, height: 75, color: 0x78350F },
      ],
    },
  ],

  platforms: [
    // Section 1: Director's Office
    { x: 800, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x78350F },
    { x: 400, y: 620, width: 200, height: 30, type: 'solid', color: 0x44403C },
    { x: 900, y: 580, width: 140, height: 20, type: 'one-way', color: 0x92400E },
    { x: 1300, y: 540, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    // Section 2: VP Corridor
    { x: 2400, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x78350F },
    { x: 2000, y: 560, width: 140, height: 20, type: 'one-way', color: 0x92400E },
    { x: 2400, y: 520, width: 160, height: 20, type: 'one-way', color: 0x92400E },
    { x: 2800, y: 560, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    { x: 1610, y: 500, width: 20, height: 360, type: 'solid', color: 0x1E293B },
    { x: 3190, y: 500, width: 20, height: 360, type: 'solid', color: 0x1E293B },
    // Section 3: SVP Suite
    { x: 4000, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x78350F },
    { x: 3600, y: 580, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    { x: 4000, y: 540, width: 140, height: 20, type: 'one-way', color: 0x92400E },
    { x: 4400, y: 500, width: 100, height: 20, type: 'one-way', color: 0x92400E },
    // Section 4: Board Room Approach
    { x: 5400, y: GROUND_Y, width: 1200, height: GROUND_H, type: 'solid', color: 0x0F172A },
    { x: 4810, y: 480, width: 20, height: 400, type: 'solid', color: 0x1E293B },
    { x: 5990, y: 480, width: 20, height: 400, type: 'solid', color: 0x1E293B },
    // Section 5: Boss Arena
    { x: 7000, y: GROUND_Y, width: 2000, height: GROUND_H, type: 'solid', color: 0x0F172A },
    { x: 6020, y: 480, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    { x: 7980, y: 480, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    { x: 6500, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 7000, y: 480, width: 180, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 7500, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
  ],

  enemies: [
    { type: 'freeloader', x: 2200, y: 520 },
    { type: 'freeloader', x: 2600, y: 520 },
    { type: 'freeloader', x: 3000, y: 520 },
    { type: 'linkedin_swarm', x: 4000, y: 480, count: 5, radius: 60 },
  ],

  powerUps: [
    { type: 'espresso', x: 900, y: 550 },
    { type: 'networking_card', x: 2400, y: 490 },
    { type: 'mentors_advice', x: 4400, y: 470 },
    { type: 'pto_day', x: 5400, y: 600 },
  ],

  dialogueTriggers: [
    {
      id: 'lonely_lunch',
      x: 1200,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'lonely_lunch',
      startNodeId: 'start',
      dialogueTree: lonelyLunchDialogue,
      oneShot: true,
      npcColor: 0x78350F,
      npcWidth: 30,
      npcHeight: 20,
    },
    {
      id: 'vp_encounter',
      x: 2400,
      y: 480,
      width: 80,
      height: 100,
      dialogueId: 'vp_encounter',
      startNodeId: 'start',
      dialogueTree: vpEncounterDialogue,
      oneShot: true,
      npcColor: 0x1E3A5F,
      npcWidth: 38,
      npcHeight: 58,
    },
    {
      id: 'board_room',
      x: 5600,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'board_room',
      startNodeId: 'start',
      dialogueTree: boardRoomDialogue,
      oneShot: true,
      npcColor: 0x94A3B8,
      npcWidth: 30,
      npcHeight: 40,
    },
  ],

  boss: {
    type: 'golden_cage',
    arenaStart: 6050,
    arenaEnd: 7950,
    arenaY: GROUND_Y,
  },

  pitZones: [],
}
