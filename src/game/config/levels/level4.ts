import { LevelConfig } from './types'
import {
  deskNeighborDialogue,
  meetingGuideDialogue,
  rooftopDialogue,
  preBossCoworkerDialogue,
  q3PlanningMeetingDialogue,
} from '../dialogues/level4Dialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level4: LevelConfig = {
  id: 'level4',
  name: 'IC Grind',
  theme: 'middle_mgmt',
  width: 10000,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 10000, top: 0, bottom: 720 },

  backgrounds: [
    // Far: dark corporate skyline
    {
      color: 0x0a0a1a,
      scrollFactor: 0.1,
      rects: [
        { x: 300, y: 180, width: 350, height: 540, color: 0x111827 },
        { x: 800, y: 220, width: 280, height: 500, color: 0x111827 },
        { x: 1400, y: 160, width: 400, height: 560, color: 0x111827 },
        { x: 2000, y: 200, width: 320, height: 520, color: 0x111827 },
        { x: 2600, y: 240, width: 280, height: 480, color: 0x111827 },
      ],
    },
    // Mid: office interiors with screens glowing
    {
      color: 0x111827,
      scrollFactor: 0.3,
      rects: [
        { x: 200, y: 400, width: 220, height: 320, color: 0x1F2937 },
        { x: 700, y: 380, width: 200, height: 340, color: 0x1F2937 },
        { x: 1200, y: 360, width: 260, height: 360, color: 0x1F2937 },
        { x: 1800, y: 390, width: 200, height: 330, color: 0x1F2937 },
        { x: 2400, y: 370, width: 240, height: 350, color: 0x1F2937 },
      ],
    },
    // Near: desks and monitors
    {
      color: 0x1F2937,
      scrollFactor: 0.6,
      rects: [
        { x: 500, y: 560, width: 100, height: 60, color: 0x374151 },
        { x: 1500, y: 555, width: 120, height: 65, color: 0x374151 },
        { x: 3000, y: 560, width: 90, height: 60, color: 0x374151 },
        { x: 4500, y: 555, width: 110, height: 65, color: 0x374151 },
        { x: 6000, y: 560, width: 100, height: 60, color: 0x374151 },
      ],
    },
  ],

  platforms: [
    // ── Section 1: Your Desk (0–1600) ──
    { x: 800, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Desk and achievements
    { x: 300, y: 620, width: 200, height: 40, type: 'solid', color: 0x374151 },
    { x: 700, y: 580, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1100, y: 540, width: 140, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1400, y: 500, width: 120, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 2: Meeting Room Gauntlet (1600–3800) ──
    { x: 2700, y: GROUND_Y, width: 2200, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // 5 conference room door zones (walls on sides)
    { x: 1800, y: 540, width: 20, height: 280, type: 'solid', color: 0x6B7280 },
    { x: 2200, y: 540, width: 20, height: 280, type: 'solid', color: 0x6B7280 },
    { x: 2600, y: 540, width: 20, height: 280, type: 'solid', color: 0x6B7280 },
    { x: 3000, y: 540, width: 20, height: 280, type: 'solid', color: 0x6B7280 },
    { x: 3400, y: 540, width: 20, height: 280, type: 'solid', color: 0x6B7280 },
    // Conference tables
    { x: 2000, y: 620, width: 140, height: 20, type: 'solid', color: 0x78350F },
    { x: 2400, y: 620, width: 140, height: 20, type: 'solid', color: 0x78350F },
    { x: 2800, y: 620, width: 140, height: 20, type: 'solid', color: 0x78350F },
    { x: 3200, y: 620, width: 140, height: 20, type: 'solid', color: 0x78350F },
    { x: 3600, y: 620, width: 140, height: 20, type: 'solid', color: 0x78350F },

    // ── Section 3: Roadmap Arena (3800–5400) ──
    { x: 4600, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Open area with competing banner poles
    { x: 4200, y: 520, width: 20, height: 320, type: 'solid', color: 0xEF4444 },
    { x: 4600, y: 440, width: 20, height: 280, type: 'solid', color: 0x3B82F6 },
    { x: 5000, y: 520, width: 20, height: 320, type: 'solid', color: 0x10B981 },
    // Elevated platforms
    { x: 4400, y: 480, width: 160, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 4800, y: 420, width: 160, height: 20, type: 'one-way', color: 0x7C3AED },

    // ── Section 4: Scope Creep Corridor (5400–7000) — narrowing ──
    { x: 6200, y: GROUND_Y, width: 1600, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Corridor walls that narrow
    { x: 5600, y: 500, width: 20, height: 360, type: 'solid', color: 0x475569 },
    { x: 5600, y: 200, width: 20, height: 200, type: 'solid', color: 0x475569 },
    { x: 6200, y: 480, width: 20, height: 400, type: 'solid', color: 0x475569 },
    { x: 6800, y: 460, width: 20, height: 440, type: 'solid', color: 0x475569 },
    // Narrow gap platforms
    { x: 5900, y: 560, width: 100, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 6500, y: 520, width: 80, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 5: Quiet Rooftop (7000–8000) ──
    { x: 7500, y: GROUND_Y, width: 1000, height: GROUND_H, type: 'solid', color: 0x1E293B },
    // Rooftop benches
    { x: 7300, y: 600, width: 100, height: 30, type: 'solid', color: 0x6B7280 },
    { x: 7700, y: 580, width: 120, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 6: The Mirror Room / Boss Arena (8000–10000) ──
    { x: 9000, y: GROUND_Y, width: 2000, height: GROUND_H, type: 'solid', color: 0x0F172A },
    // Arena walls
    { x: 8020, y: 540, width: 30, height: 280, type: 'solid', color: 0x0F172A },
    { x: 9980, y: 540, width: 30, height: 280, type: 'solid', color: 0x0F172A },
    // Boss arena platforms
    { x: 8400, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 8800, y: 480, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 9200, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 9600, y: 500, width: 140, height: 20, type: 'one-way', color: 0x4F46E5 },
    // Reflective floor effect — mirrored platforms below ground
    { x: 8400, y: GROUND_Y + 40, width: 160, height: 20, type: 'solid', color: 0x1E1B4B },
    { x: 8800, y: GROUND_Y + 60, width: 200, height: 20, type: 'solid', color: 0x1E1B4B },
    { x: 9200, y: GROUND_Y + 40, width: 160, height: 20, type: 'solid', color: 0x1E1B4B },
  ],

  enemies: [
    // Section 2 — Slack barrages in meetings
    { type: 'slack_barrage', x: 2000, y: 560, bubbleCount: 8 },
    { type: 'slack_barrage', x: 2800, y: 560, bubbleCount: 10 },
    { type: 'slack_barrage', x: 3600, y: 560, bubbleCount: 12 },
    // Section 3 — Coffee runs during roadmap
    { type: 'coffee_run', x: 4400, y: 580, projectileSpeed: 220 },
    // Section 4 — Scope creep blobs
    { type: 'alarm_clock', x: 5800, y: 480, speed: 120, direction: 1, patrolMin: 5600, patrolMax: 6200 },
    { type: 'alarm_clock', x: 6400, y: 440, speed: 150, direction: -1, patrolMin: 6000, patrolMax: 6800 },
    // Section 4 — LinkedIn swarm in the narrowing corridor
    { type: 'linkedin_swarm', x: 6100, y: 500, count: 6, radius: 70 },
    // Section 4 — Scope creep blobs in the narrowing corridor
    { type: 'scope_creep_blob', x: 5900, y: 620, baseSize: 50, growthRate: 0.012, maxSize: 180 },
    { type: 'scope_creep_blob', x: 6400, y: 630, baseSize: 60, growthRate: 0.018, maxSize: 220 },
    { type: 'scope_creep_blob', x: 6700, y: 610, baseSize: 45, growthRate: 0.015, maxSize: 160 },
  ],

  powerUps: [
    // Section 2 — Espresso in meeting gauntlet
    { type: 'espresso', x: 2400, y: 590 },
    // Section 3 — Networking cards scattered
    { type: 'networking_card', x: 4600, y: 390 },
    { type: 'networking_card', x: 5000, y: 590 },
    // Section 4 — Mentor's Advice hidden behind scope creep
    { type: 'mentors_advice', x: 6500, y: 490 },
    // Section 5 — PTO Day on rooftop (easy to find, gift after the grind)
    { type: 'pto_day', x: 7500, y: 550 },
    // Section 5 — Espresso on rooftop
    { type: 'espresso', x: 7700, y: 550 },
    // Section 2 — LinkedIn Endorsement for handling all 5 meetings
    { type: 'linkedin_endorsement', x: 3700, y: 590 },
  ],

  dialogueTriggers: [
    // Section 1 — Desk Neighbor
    {
      id: 'desk_neighbor',
      x: 500,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'desk_neighbor',
      startNodeId: 'start',
      dialogueTree: deskNeighborDialogue,
      oneShot: true,
      npcColor: 0x6366F1,
      npcWidth: 36,
      npcHeight: 55,
    },
    // Section 2 — Meeting Guide
    {
      id: 'meeting_guide',
      x: 1650,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'meeting_guide',
      startNodeId: 'start',
      dialogueTree: meetingGuideDialogue,
      oneShot: true,
      npcColor: 0xD97706,
      npcWidth: 38,
      npcHeight: 58,
    },
    // Section 5 — Rooftop Quiet Moment
    {
      id: 'rooftop',
      x: 7400,
      y: 540,
      width: 80,
      height: 100,
      dialogueId: 'rooftop',
      startNodeId: 'start',
      dialogueTree: rooftopDialogue,
      oneShot: true,
      npcColor: 0x94A3B8,
      npcWidth: 30,
      npcHeight: 40,
    },
    // Section 5 — Pre-boss Coworker
    {
      id: 'pre_boss_coworker',
      x: 7800,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'pre_boss_coworker',
      startNodeId: 'start',
      dialogueTree: preBossCoworkerDialogue,
      oneShot: true,
      npcColor: 0x10B981,
      npcWidth: 36,
      npcHeight: 55,
    },
    // Conference Room — Meeting Battle!
    {
      id: 'q3_planning_meeting',
      x: 5200,
      y: 620,
      width: 100,
      height: 120,
      dialogueId: 'q3_planning_meeting',
      startNodeId: 'start',
      dialogueTree: q3PlanningMeetingDialogue,
      oneShot: true,
      meetingBattle: true,
      npcType: 'executive',
    },
  ],

  boss: {
    type: 'imposter_syndrome',
    arenaStart: 8050,
    arenaEnd: 9950,
    arenaY: GROUND_Y,
  },

  pitZones: [],

  reorg: {
    triggerX: 6000,
    preReorgPlatforms: [],
    postReorgPlatforms: [
      // Corridor shifts — walls move inward
      { x: 6300, y: 480, width: 20, height: 400, type: 'solid', color: 0x475569 },
      { x: 6700, y: 460, width: 20, height: 440, type: 'solid', color: 0x475569 },
      // New escape platforms
      { x: 6500, y: 400, width: 120, height: 20, type: 'one-way', color: 0xEF4444 },
    ],
    narratorDialogue: "Not again... The org chart just shifted. I just found my desk! Navigate the new reality.",
  },
}
