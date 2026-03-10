import { LevelConfig } from './types'
import {
  careerAdvisorDialogue,
  careerBoothDialogue,
  overachieverDialogue,
  elevatorPitchDialogue,
} from '../dialogues/level2Dialogues'

const GROUND_Y = 680
const GROUND_H = 40

export const level2: LevelConfig = {
  id: 'level2',
  name: 'Senior Scramble',
  width: 8500,
  height: 720,
  spawn: { x: 200, y: 500 },
  bounds: { left: 0, right: 8500, top: 0, bottom: 720 },

  backgrounds: [
    // Far: warm sunset on left → gray overcast on right
    {
      color: 0x1a1a2e,
      scrollFactor: 0.1,
      rects: [
        // Warm sunset campus buildings (left)
        { x: 200, y: 300, width: 250, height: 420, color: 0x4a2a1a },
        { x: 550, y: 340, width: 200, height: 380, color: 0x3a2a2a },
        { x: 900, y: 280, width: 280, height: 440, color: 0x3a2a2a },
        // Transition to gray corporate (right)
        { x: 1300, y: 320, width: 200, height: 400, color: 0x2a2a3a },
        { x: 1700, y: 300, width: 220, height: 420, color: 0x2a2a3a },
        { x: 2100, y: 280, width: 260, height: 440, color: 0x1a1a2a },
      ],
    },
    // Mid: campus on left, corporate skyline on right
    {
      color: 0x16213e,
      scrollFactor: 0.3,
      rects: [
        // Trees/campus
        { x: 100, y: 380, width: 200, height: 340, color: 0x2d4a3a },
        { x: 500, y: 400, width: 180, height: 320, color: 0x2d4a3a },
        // Glass buildings
        { x: 1000, y: 360, width: 240, height: 360, color: 0x374151 },
        { x: 1500, y: 340, width: 200, height: 380, color: 0x374151 },
        { x: 1900, y: 320, width: 260, height: 400, color: 0x4B5563 },
      ],
    },
    // Near: trees → glass facades
    {
      color: 0x1B2A4A,
      scrollFactor: 0.6,
      rects: [
        { x: 300, y: 560, width: 80, height: 60, color: 0x2d5a3a },
        { x: 800, y: 555, width: 90, height: 65, color: 0x2d5a3a },
        { x: 1600, y: 560, width: 70, height: 60, color: 0x4B5563 },
        { x: 2200, y: 555, width: 80, height: 65, color: 0x4B5563 },
        { x: 2800, y: 560, width: 90, height: 60, color: 0x6B7280 },
      ],
    },
  ],

  platforms: [
    // ── Section 1: Senior Housing (0–1400) ──
    { x: 700, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x4B5563 },
    // Messy apartment — scattered boxes as platforms
    { x: 300, y: 600, width: 100, height: 40, type: 'solid', color: 0x78350F },
    { x: 550, y: 560, width: 80, height: 30, type: 'solid', color: 0x78350F },
    { x: 800, y: 540, width: 120, height: 20, type: 'one-way', color: 0x92400E },
    { x: 1100, y: 520, width: 100, height: 20, type: 'one-way', color: 0x92400E },

    // ── Section 2: Campus Career Center (1400–2800) ──
    { x: 2100, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Bulletin board platforms
    { x: 1600, y: 580, width: 140, height: 20, type: 'one-way', color: 0x6366F1 },
    { x: 1900, y: 540, width: 160, height: 20, type: 'one-way', color: 0x6366F1 },
    { x: 2200, y: 500, width: 140, height: 20, type: 'one-way', color: 0x6366F1 },
    // Resume review desk
    { x: 2500, y: 600, width: 200, height: 30, type: 'solid', color: 0x4B5563 },

    // ── Section 3: Career Fair Floor (2800–4400) ──
    // Ground with resume gaps (holes in floor)
    { x: 3000, y: GROUND_Y, width: 300, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Gap at 3150-3270
    { x: 3400, y: GROUND_Y, width: 200, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Gap at 3500-3620
    { x: 3750, y: GROUND_Y, width: 200, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Gap at 3850-3970
    { x: 4200, y: GROUND_Y, width: 400, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Booth wall platforms (vertical platforming)
    { x: 3100, y: 560, width: 80, height: 200, type: 'solid', color: 0x1F2937 },
    { x: 3350, y: 560, width: 80, height: 200, type: 'solid', color: 0x1F2937 },
    { x: 3600, y: 560, width: 80, height: 200, type: 'solid', color: 0x1F2937 },
    { x: 3850, y: 560, width: 80, height: 200, type: 'solid', color: 0x1F2937 },
    // Elevated "secret" platform above booths
    { x: 3500, y: 380, width: 300, height: 20, type: 'one-way', color: 0x7C3AED },

    // ── Section 4: Networking Event (4400–5600) ──
    { x: 5000, y: GROUND_Y, width: 1200, height: GROUND_H, type: 'solid', color: 0x374151 },
    // Cocktail tables as platforms
    { x: 4600, y: 600, width: 80, height: 80, type: 'solid', color: 0x6B7280 },
    { x: 4900, y: 600, width: 80, height: 80, type: 'solid', color: 0x6B7280 },
    { x: 5200, y: 600, width: 80, height: 80, type: 'solid', color: 0x6B7280 },
    // Elevated lounge area
    { x: 4800, y: 480, width: 200, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 5100, y: 440, width: 180, height: 20, type: 'one-way', color: 0x4F46E5 },

    // ── Section 5: Interview Hallway (5600–7000) ──
    { x: 6300, y: GROUND_Y, width: 1400, height: GROUND_H, type: 'solid', color: 0x1F2937 },
    // Hallway walls
    { x: 5700, y: 560, width: 30, height: 240, type: 'solid', color: 0x374151 },
    // Numbered door platforms (the doors open/close on timers via timedDoors)
    { x: 6000, y: 600, width: 120, height: 20, type: 'solid', color: 0x374151 },
    { x: 6300, y: 600, width: 120, height: 20, type: 'solid', color: 0x374151 },
    { x: 6600, y: 600, width: 120, height: 20, type: 'solid', color: 0x374151 },
    // Upper bypass route
    { x: 6150, y: 460, width: 160, height: 20, type: 'one-way', color: 0x7C3AED },
    { x: 6450, y: 420, width: 160, height: 20, type: 'one-way', color: 0x7C3AED },

    // ── Section 6: Offer Stage / Boss Arena (7000–8500) ──
    { x: 7750, y: GROUND_Y, width: 1500, height: GROUND_H, type: 'solid', color: 0x1E3A5F },
    // Conference room walls
    { x: 7020, y: 560, width: 30, height: 240, type: 'solid', color: 0x1E3A5F },
    { x: 8480, y: 560, width: 30, height: 240, type: 'solid', color: 0x1E3A5F },
    // Polished conference table
    { x: 7750, y: 620, width: 400, height: 20, type: 'solid', color: 0x78350F },
    // Elevated platforms for chasing
    { x: 7300, y: 520, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 7750, y: 460, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
    { x: 8200, y: 520, width: 160, height: 20, type: 'one-way', color: 0x4F46E5 },
  ],

  enemies: [
    // Section 3 — Resume Gaps (career center floor holes)
    { type: 'resume_gap', x: 3210, y: GROUND_Y, gapWidth: 120 },
    { type: 'resume_gap', x: 3560, y: GROUND_Y, gapWidth: 120 },
    { type: 'resume_gap', x: 3910, y: GROUND_Y, gapWidth: 120 },
    // Section 3 — LinkedIn Swarm buzzing around the booths
    { type: 'linkedin_swarm', x: 3400, y: 480, count: 4, radius: 70 },
    // Section 4 — Networking crowd zone
    { type: 'networking_crowd', x: 4900, y: 580, zoneWidth: 400, zoneHeight: 180, slowFactor: 0.4 },
    // Section 4 — LinkedIn Swarm at networking event
    { type: 'linkedin_swarm', x: 5200, y: 420, count: 6, radius: 90 },
    // Section 3 — The Overachiever
    { type: 'overachiever', x: 3200, y: 600, targetX: 3800 },
    // Section 5 — Alarm clocks in interview hallway (pressure!)
    { type: 'alarm_clock', x: 6100, y: 540, speed: 130, direction: 1, patrolMin: 5900, patrolMax: 6700 },
    { type: 'alarm_clock', x: 6500, y: 520, speed: 160, direction: -1, patrolMin: 6200, patrolMax: 6800 },
  ],

  powerUps: [
    // Section 2 — Networking cards scattered
    { type: 'networking_card', x: 1900, y: 510 },
    { type: 'networking_card', x: 2500, y: 570 },
    // Section 3 — Networking card on elevated secret platform
    { type: 'networking_card', x: 3500, y: 350 },
    // Section 3 — Side Hustle Gig behind a Resume Gap
    { type: 'side_hustle', x: 3210, y: 630 },
    // Section 3 — LinkedIn Endorsement on booth top
    { type: 'linkedin_endorsement', x: 3350, y: 430 },
    // Section 4 — Mentor's Advice (hidden in networking lounge)
    { type: 'mentors_advice', x: 5100, y: 410 },
    // Section 5 — Espresso before interview gauntlet
    { type: 'espresso', x: 5800, y: 550 },
  ],

  dialogueTriggers: [
    // Section 2 — Career Center Advisor
    {
      id: 'career_advisor',
      x: 1700,
      y: 520,
      width: 80,
      height: 100,
      dialogueId: 'career_advisor',
      startNodeId: 'start',
      dialogueTree: careerAdvisorDialogue,
      oneShot: true,
      npcColor: 0x6366F1,
      npcWidth: 38,
      npcHeight: 58,
    },
    // Section 3 — Career Fair Booth NPC
    {
      id: 'career_booth',
      x: 3700,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'career_booth',
      startNodeId: 'start',
      dialogueTree: careerBoothDialogue,
      oneShot: true,
      npcColor: 0x059669,
      npcWidth: 36,
      npcHeight: 55,
    },
    // Section 3 — The Overachiever intro dialogue
    {
      id: 'overachiever_intro',
      x: 3100,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'overachiever_intro',
      startNodeId: 'start',
      dialogueTree: overachieverDialogue,
      oneShot: true,
      npcColor: 0x059669,
      npcWidth: 44,
      npcHeight: 65,
    },
    // Section 4 — Elevator Pitch (networking event)
    {
      id: 'elevator_pitch',
      x: 5000,
      y: 620,
      width: 80,
      height: 100,
      dialogueId: 'elevator_pitch',
      startNodeId: 'start',
      dialogueTree: elevatorPitchDialogue,
      oneShot: true,
      npcColor: 0x1F2937,
      npcWidth: 42,
      npcHeight: 70,
    },
  ],

  boss: {
    type: 'ghosting_recruiter',
    arenaStart: 7050,
    arenaEnd: 8450,
    arenaY: GROUND_Y,
  },

  pitZones: [
    // Resume gaps — cosmetic pits in the career fair
    { x: 3150, width: 120, energyCost: 8 },
    { x: 3500, width: 120, energyCost: 8 },
    { x: 3850, width: 120, energyCost: 8 },
  ],

  timedDoors: [
    // Interview hallway doors — open/close on cycles
    { x: 5900, y: 560, width: 30, height: 120, openDuration: 2500, closeDuration: 2000, startOpen: true },
    { x: 6200, y: 560, width: 30, height: 120, openDuration: 2000, closeDuration: 2500, startOpen: false },
    { x: 6500, y: 560, width: 30, height: 120, openDuration: 3000, closeDuration: 2000, startOpen: true },
  ],
}
