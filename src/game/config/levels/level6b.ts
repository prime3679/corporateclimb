import { LevelConfig } from './types'
import {
  firstHireDialogue,
  investorPitchDialogue,
  launchVenueDialogue,
} from '../dialogues/level6bDialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level6b: LevelConfig = {
  id: 'level6b',
  name: 'The Pivot',
  width: 9000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 9000, top: 0, bottom: 720 },

  backgrounds: [
    {
      color: 0x1C1917,
      scrollFactor: 0.1,
      rects: [
        { x: 400, y: 250, width: 250, height: 470, color: 0x292524 },
        { x: 1000, y: 280, width: 200, height: 440, color: 0x292524 },
      ],
    },
    {
      color: 0x292524,
      scrollFactor: 0.3,
      rects: [
        { x: 300, y: 420, width: 180, height: 300, color: 0x44403C },
        { x: 800, y: 400, width: 200, height: 320, color: 0x44403C },
      ],
    },
    {
      color: 0x44403C,
      scrollFactor: 0.6,
      rects: [
        { x: 500, y: 570, width: 80, height: 50, color: 0x57534E },
        { x: 1200, y: 565, width: 100, height: 55, color: 0x57534E },
      ],
    },
  ],

  platforms: [
    // Section 1: The Garage
    { x: 900, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x57534E },
    { x: 400, y: 620, width: 160, height: 30, type: 'solid', color: 0x78716C },
    { x: 800, y: 580, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 1200, y: 550, width: 100, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 1600, y: 580, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    // Section 2: First Hire
    { x: 2700, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x57534E },
    { x: 2200, y: 560, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 2600, y: 520, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 3000, y: 560, width: 100, height: 20, type: 'one-way', color: 0xD97706 },
    // Section 3: Small Office
    { x: 4500, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x57534E },
    { x: 3900, y: 560, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 4300, y: 520, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 4700, y: 480, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 5100, y: 540, width: 100, height: 20, type: 'one-way', color: 0xD97706 },
    // Section 4: Growth Stage
    { x: 6300, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x57534E },
    { x: 5700, y: 560, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 6100, y: 520, width: 160, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 6500, y: 480, width: 120, height: 20, type: 'one-way', color: 0xD97706 },
    { x: 6900, y: 540, width: 140, height: 20, type: 'one-way', color: 0xD97706 },
    // Section 5: Launch Venue / Boss Arena
    { x: 8100, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x1E293B },
    { x: 7220, y: 480, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    { x: 8980, y: 480, width: 30, height: 400, type: 'solid', color: 0x0F172A },
    { x: 7600, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 8100, y: 480, width: 180, height: 20, type: 'one-way', color: 0x818CF8 },
    { x: 8600, y: 540, width: 140, height: 20, type: 'one-way', color: 0x818CF8 },
  ],

  enemies: [
    // Feature Creep Monsters — big scope creep blobs
    { type: 'scope_creep_blob', x: 4300, y: 620, baseSize: 80, growthRate: 0.02, maxSize: 250 },
    { type: 'scope_creep_blob', x: 5000, y: 630, baseSize: 70, growthRate: 0.025, maxSize: 220 },
    // Rejection Emails in growth stage
    { type: 'slack_barrage', x: 6100, y: 480, bubbleCount: 10 },
    { type: 'slack_barrage', x: 6700, y: 500, bubbleCount: 12 },
  ],

  powerUps: [
    { type: 'espresso', x: 800, y: 550 },
    { type: 'side_hustle', x: 1600, y: 550 },
    { type: 'networking_card', x: 3000, y: 530 },
    { type: 'espresso', x: 4700, y: 450 },
    { type: 'mentors_advice', x: 6500, y: 450 },
  ],

  dialogueTriggers: [
    {
      id: 'first_hire',
      x: 2400,
      y: 520,
      width: 80,
      height: 100,
      dialogueId: 'first_hire',
      startNodeId: 'start',
      dialogueTree: firstHireDialogue,
      oneShot: true,
      npcColor: 0x10B981,
      npcWidth: 36,
      npcHeight: 55,
    },
    {
      id: 'investor_pitch',
      x: 6300,
      y: 480,
      width: 80,
      height: 100,
      dialogueId: 'investor_pitch',
      startNodeId: 'start',
      dialogueTree: investorPitchDialogue,
      oneShot: true,
      npcColor: 0xFBBF24,
      npcWidth: 38,
      npcHeight: 58,
    },
    {
      id: 'launch_venue',
      x: 7400,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'launch_venue',
      startNodeId: 'start',
      dialogueTree: launchVenueDialogue,
      oneShot: true,
      npcColor: 0x94A3B8,
      npcWidth: 30,
      npcHeight: 40,
    },
  ],

  boss: {
    type: 'algorithm',
    arenaStart: 7250,
    arenaEnd: 8950,
    arenaY: GROUND_Y,
  },

  pitZones: [],
}
