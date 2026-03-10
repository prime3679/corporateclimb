import { LevelConfig } from './types'
import {
  lobbyGuardDialogue,
  fridgeNoteDialogue,
  friendlyCoworkerDialogue,
  preBossMentorDialogue,
  creditThiefDialogue,
  standingDeskDialogue,
  meetingSchedulerDialogue,
} from '../dialogues/level3Dialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level3: LevelConfig = {
  id: 'level3',
  name: 'The Intern',
  theme: 'open_office',
  width: 9500,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 9500, top: 0, bottom: 720 },

  backgrounds: [
    // Far: sleek corporate skyline
    {
      color: 0x0F172A,
      scrollFactor: 0.1,
      rects: [
        { x: 300, y: 200, width: 300, height: 520, color: 0x1E293B },
        { x: 700, y: 240, width: 250, height: 480, color: 0x1E293B },
        { x: 1200, y: 180, width: 350, height: 540, color: 0x1E293B },
        { x: 1700, y: 220, width: 280, height: 500, color: 0x1E293B },
        { x: 2200, y: 260, width: 320, height: 460, color: 0x1E293B },
      ],
    },
    // Mid: glass office interiors
    {
      color: 0x1E293B,
      scrollFactor: 0.3,
      rects: [
        { x: 100, y: 400, width: 200, height: 320, color: 0x334155 },
        { x: 500, y: 380, width: 180, height: 340, color: 0x374151 },
        { x: 1000, y: 360, width: 240, height: 360, color: 0x334155 },
        { x: 1500, y: 390, width: 200, height: 330, color: 0x374151 },
        { x: 2000, y: 370, width: 220, height: 350, color: 0x334155 },
      ],
    },
    // Near: desks, screens, fluorescent panels
    {
      color: 0x1E293B,
      scrollFactor: 0.6,
      rects: [
        { x: 400, y: 560, width: 100, height: 60, color: 0x475569 },
        { x: 1200, y: 555, width: 120, height: 65, color: 0x475569 },
        { x: 2400, y: 560, width: 90, height: 60, color: 0x475569 },
        { x: 3600, y: 555, width: 110, height: 65, color: 0x475569 },
        { x: 4800, y: 560, width: 100, height: 60, color: 0x475569 },
      ],
    },
  ],

  platforms: [
    // ── Section 1: Lobby / Badge Scan (0–1500) ──
    { x: 750, y: GROUND_Y, width: 1500, height: GROUND_H, type: 'solid', color: 0x1E293B },
    // Turnstile barriers
    { x: 400, y: 620, width: 20, height: 120, type: 'solid', color: 0x6B7280 },
    { x: 600, y: 620, width: 20, height: 120, type: 'solid', color: 0x6B7280 },
    // Security desk
    { x: 250, y: 620, width: 200, height: 40, type: 'solid', color: 0x374151 },
    // Lobby platforms
    { x: 900, y: 580, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 1200, y: 540, width: 140, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 2: Open Floor Plan (1500–3200) ──
    { x: 2350, y: GROUND_Y, width: 1700, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Desk platforms (dense horizontal)
    { x: 1700, y: 620, width: 200, height: 30, type: 'solid', color: 0x374151 },
    { x: 2000, y: 620, width: 200, height: 30, type: 'solid', color: 0x374151 },
    { x: 2300, y: 620, width: 200, height: 30, type: 'solid', color: 0x374151 },
    { x: 2600, y: 620, width: 200, height: 30, type: 'solid', color: 0x374151 },
    { x: 2900, y: 620, width: 200, height: 30, type: 'solid', color: 0x374151 },
    // Screen dividers (vertical)
    { x: 1850, y: 560, width: 20, height: 140, type: 'solid', color: 0x475569 },
    { x: 2450, y: 560, width: 20, height: 140, type: 'solid', color: 0x475569 },
    { x: 3050, y: 560, width: 20, height: 140, type: 'solid', color: 0x475569 },

    // ── Section 3: Kitchen / Break Room (3200–4400) ──
    { x: 3800, y: GROUND_Y, width: 1200, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Counter/fridge
    { x: 3400, y: 600, width: 200, height: 50, type: 'solid', color: 0x6B7280 },
    // Table
    { x: 3800, y: 580, width: 180, height: 20, type: 'one-way', color: 0x78350F },
    // Elevated shelf
    { x: 4100, y: 480, width: 160, height: 20, type: 'one-way', color: 0x6B7280 },

    // ── Section 4: Conference Room Row (4400–6200) — PRE-REORG LAYOUT ──
    { x: 5300, y: GROUND_Y, width: 1800, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Glass walls between conference rooms
    { x: 4600, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
    { x: 5000, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
    { x: 5400, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
    { x: 5800, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
    // Conference tables
    { x: 4800, y: 620, width: 160, height: 20, type: 'solid', color: 0x78350F },
    { x: 5200, y: 620, width: 160, height: 20, type: 'solid', color: 0x78350F },
    { x: 5600, y: 620, width: 160, height: 20, type: 'solid', color: 0x78350F },

    // ── Section 5: Manager's Office Area (6200–7600) ──
    { x: 6900, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x1E293B },
    // Elevated manager platforms
    { x: 6400, y: 600, width: 200, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 6700, y: 560, width: 180, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 7000, y: 520, width: 160, height: 20, type: 'solid', color: 0x4F46E5 },
    { x: 7300, y: 480, width: 140, height: 20, type: 'one-way', color: 0x7C3AED },

    // ── Section 6: Executive Floor / Boss Arena (7600–9500) ──
    { x: 8550, y: GROUND_Y, width: 1900, height: GROUND_H, type: 'solid', color: 0x0F172A },
    // Arena walls
    { x: 7620, y: 540, width: 30, height: 280, type: 'solid', color: 0x0F172A },
    { x: 9480, y: 540, width: 30, height: 280, type: 'solid', color: 0x0F172A },
    // Boss arena platforms
    { x: 8000, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 8550, y: 480, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 9100, y: 540, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
  ],

  enemies: [
    // Section 2 — Coffee Run Requests from desk NPCs
    { type: 'coffee_run', x: 2000, y: 580, projectileSpeed: 180 },
    { type: 'coffee_run', x: 2600, y: 580, projectileSpeed: 200 },
    // Section 3 — Credit Thief Manager (follows player)
    { type: 'credit_thief', x: 3600, y: 600 },
    // Section 4 — Slack Message Barrage in conference rooms
    { type: 'slack_barrage', x: 4800, y: 560, bubbleCount: 10 },
    { type: 'slack_barrage', x: 5600, y: 560, bubbleCount: 14 },
    // Section 5 — Alarm clocks (deadline pressure near manager area)
    { type: 'alarm_clock', x: 6600, y: 500, speed: 140, direction: 1, patrolMin: 6300, patrolMax: 7200 },
    { type: 'alarm_clock', x: 7100, y: 460, speed: 170, direction: -1, patrolMin: 6800, patrolMax: 7500 },
    // Section 4 — Overachiever returns (behavior depends on L2 choice)
    { type: 'overachiever', x: 5000, y: 600, targetX: 5800 },
  ],

  powerUps: [
    // Section 2 — Espresso behind desk
    { type: 'espresso', x: 2300, y: 590 },
    // Section 3 — Espresso in the fridge
    { type: 'espresso', x: 3400, y: 570 },
    // Section 3 — Side Hustle Gig (freelance inquiry at break room)
    { type: 'side_hustle', x: 4000, y: 550 },
    // Section 4 — Networking card from Overachiever area
    { type: 'networking_card', x: 5100, y: 590 },
    // Section 5 — Networking card on elevated platform
    { type: 'networking_card', x: 7000, y: 490 },
    // Section 5 — PTO Day hidden near manager area
    { type: 'pto_day', x: 7300, y: 450 },
    // Section 4 — LinkedIn Endorsement reward for handling meetings
    { type: 'linkedin_endorsement', x: 5800, y: 590 },
  ],

  dialogueTriggers: [
    // Section 1 — Lobby Security Guard
    {
      id: 'lobby_guard',
      x: 300,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'lobby_guard',
      startNodeId: 'start',
      dialogueTree: lobbyGuardDialogue,
      oneShot: true,
      npcColor: 0x374151,
      npcWidth: 40,
      npcHeight: 65,
    },
    // Section 3 — Kitchen Fridge Note
    {
      id: 'fridge_note',
      x: 3450,
      y: 540,
      width: 60,
      height: 80,
      dialogueId: 'fridge_note',
      startNodeId: 'start',
      dialogueTree: fridgeNoteDialogue,
      oneShot: true,
      npcColor: 0xD1D5DB,
      npcWidth: 50,
      npcHeight: 70,
    },
    // Section 2 — Friendly Coworker
    {
      id: 'friendly_coworker',
      x: 2100,
      y: 560,
      width: 80,
      height: 100,
      dialogueId: 'friendly_coworker',
      startNodeId: 'start',
      dialogueTree: friendlyCoworkerDialogue,
      oneShot: true,
      npcColor: 0x10B981,
      npcWidth: 36,
      npcHeight: 55,
    },
    // Section 5 — Pre-boss Mentor
    {
      id: 'mentor',
      x: 7400,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'mentor',
      startNodeId: 'start',
      dialogueTree: preBossMentorDialogue,
      oneShot: true,
      npcColor: 0xD97706,
      npcWidth: 38,
      npcHeight: 58,
    },
    // Section 3 — Credit Thief confrontation (E to interact when close)
    {
      id: 'credit_thief_confront',
      x: 3700,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'credit_thief_confront',
      startNodeId: 'start',
      dialogueTree: creditThiefDialogue,
      oneShot: true,
      npcColor: 0x7C3AED,
      npcWidth: 48,
      npcHeight: 72,
    },
    // Standing Desk Evangelist — open office true believer
    {
      id: 'standing_desk',
      x: 4800,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'standing_desk',
      startNodeId: 'start',
      dialogueTree: standingDeskDialogue,
      oneShot: false,
      npcType: 'it_guy',
    },
    // Meeting Scheduler — books meetings about meetings
    {
      id: 'meeting_scheduler',
      x: 5800,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'meeting_scheduler',
      startNodeId: 'start',
      dialogueTree: meetingSchedulerDialogue,
      oneShot: false,
      npcType: 'manager',
    },
  ],

  boss: {
    type: 'skip_level',
    arenaStart: 7650,
    arenaEnd: 9450,
    arenaY: GROUND_Y,
  },

  pitZones: [],

  reorg: {
    triggerX: 5600,
    preReorgPlatforms: [],
    postReorgPlatforms: [
      // Conference walls shift positions
      { x: 4700, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
      { x: 5100, y: 500, width: 20, height: 220, type: 'solid', color: 0x94A3B8 },
      { x: 5500, y: 540, width: 20, height: 280, type: 'solid', color: 0x94A3B8 },
      // New elevated escape route
      { x: 5300, y: 420, width: 200, height: 20, type: 'one-way', color: 0xEF4444 },
      { x: 5700, y: 380, width: 180, height: 20, type: 'one-way', color: 0xEF4444 },
    ],
    narratorDialogue: "Surprise! The org chart just changed. Again. Everything you knew about where things are? Forget it. Navigate the new layout.",
  },
}
