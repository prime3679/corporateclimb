import { LevelConfig } from "../levelTypes";
import {
  tutorialDialogue,
  libraryDialogue,
  partyDialogue,
  preBossDialogue,
  bossEssayDialogue,
  bossAppealDialogue,
} from "../dialogues/freshmanDialogues";

const GROUND_Y = 648;
const GROUND_H = 72;
const W = 8000;

export const freshmanLevel: LevelConfig = {
  name: "Freshman Year",
  bounds: { width: W, height: 720 },
  spawn: { x: 180, y: GROUND_Y },

  /* ─── PARALLAX BACKGROUND ─── */
  backgroundLayers: [
    // Far sky — warm amber/golden
    { color: "#2D1B00", scrollFactor: 0, y: 0, height: 720 },
    // Clouds layer
    { color: "#3D2800", scrollFactor: 0.05, y: 80, height: 120 },
    // Campus buildings silhouette
    { color: "#1B2A4A", scrollFactor: 0.15, y: 280, height: 440 },
    // Mid trees/hills
    { color: "#1E3A2F", scrollFactor: 0.3, y: 400, height: 320 },
    // Near bushes/lampposts
    { color: "#213155", scrollFactor: 0.5, y: 520, height: 200 },
  ],

  /* ─── PLATFORMS & TERRAIN ─── */
  platforms: [
    // ===== MAIN GROUND =====
    // Dorm section ground (0 - 1200)
    { x: 0, y: GROUND_Y, width: 1200, height: GROUND_H, type: "solid" },
    // Campus quad ground (1200 - 3200)
    { x: 1200, y: GROUND_Y, width: 2000, height: GROUND_H, type: "solid" },
    // Lecture hall approach (3200 - 4400)
    { x: 3200, y: GROUND_Y, width: 1200, height: GROUND_H, type: "solid" },
    // Library section (4400 - 5400)
    { x: 4400, y: GROUND_Y, width: 1000, height: GROUND_H, type: "solid" },
    // Party gap zone — ground from 5400 to 5600 is MISSING (200px gap)
    // Party section ground (5600 - 6800)
    { x: 5600, y: GROUND_Y, width: 1200, height: GROUND_H, type: "solid" },
    // Boss arena ground (6800 - 8000)
    { x: 6800, y: GROUND_Y, width: 1200, height: GROUND_H, type: "solid" },

    // ===== DORM INTERIOR (section 1: 0-600) =====
    // Dorm ceiling
    { x: 0, y: 380, width: 600, height: 20, type: "solid", color: 0x475569 },
    // Dorm left wall
    { x: -20, y: 0, width: 20, height: 720, type: "solid" },
    // Dorm shelf (jumpable)
    { x: 80, y: 520, width: 140, height: 16, type: "one-way" },
    // Dorm desk
    { x: 350, y: 580, width: 120, height: 16, type: "one-way" },

    // ===== CAMPUS QUAD (section 2: 1200-3200) =====
    // Benches to jump on
    { x: 1500, y: 608, width: 100, height: 16, type: "one-way" },
    { x: 1900, y: 608, width: 100, height: 16, type: "one-way" },
    // Elevated roof platforms (secrets)
    { x: 1400, y: 440, width: 180, height: 20, type: "one-way" },
    { x: 1700, y: 380, width: 140, height: 20, type: "one-way" },
    { x: 2000, y: 340, width: 160, height: 20, type: "one-way" },
    // Stepping platform
    { x: 2400, y: 520, width: 120, height: 20, type: "one-way" },
    { x: 2600, y: 460, width: 120, height: 20, type: "one-way" },
    { x: 2800, y: 400, width: 120, height: 20, type: "one-way" },
    // High secret platform (PTO Day location)
    { x: 2900, y: 280, width: 160, height: 20, type: "one-way" },

    // ===== LECTURE HALL APPROACH (section 3: 3200-4400) =====
    // Steps leading up to lecture hall
    { x: 3300, y: 620, width: 160, height: 28, type: "solid", color: 0x64748b },
    { x: 3460, y: 592, width: 160, height: 28, type: "solid", color: 0x64748b },
    { x: 3620, y: 564, width: 160, height: 28, type: "solid", color: 0x64748b },
    // Lecture hall elevated floor
    { x: 3780, y: 564, width: 620, height: 28, type: "solid", color: 0x475569 },
    // Lecture hall ceiling (enclosed area)
    { x: 3780, y: 340, width: 620, height: 20, type: "solid", color: 0x475569 },
    // Lecture hall back wall
    { x: 4380, y: 340, width: 20, height: 308, type: "solid", color: 0x475569 },

    // ===== LIBRARY (section 4: 4400-5400) =====
    // Library shelves (platforms)
    { x: 4500, y: 540, width: 120, height: 16, type: "one-way" },
    { x: 4700, y: 480, width: 120, height: 16, type: "one-way" },
    { x: 4900, y: 420, width: 120, height: 16, type: "one-way" },
    // Study nook platform
    { x: 5100, y: 540, width: 200, height: 16, type: "one-way" },

    // ===== PARTY AREA (section 5: 5400-6800) =====
    // Gap platforms (over the 200px gap at 5400-5600)
    { x: 5420, y: 580, width: 80, height: 16, type: "one-way" },
    // Party rooftop (elevated)
    { x: 5800, y: 460, width: 200, height: 20, type: "one-way" },
    { x: 6100, y: 400, width: 160, height: 20, type: "one-way" },
    // Moving dance floor platform
    {
      x: 6000,
      y: 540,
      width: 140,
      height: 20,
      type: "moving",
      moveRange: 120,
      moveSpeed: 60,
      moveAxis: "horizontal",
    },

    // ===== BOSS ARENA (section 6: 6800-8000) =====
    // Arena walls
    { x: 6780, y: 340, width: 20, height: 308, type: "solid", color: 0x7f1d1d },
    { x: 8000, y: 340, width: 20, height: 380, type: "solid", color: 0x7f1d1d },
    // Arena ceiling
    { x: 6800, y: 340, width: 1200, height: 20, type: "solid", color: 0x7f1d1d },

    // ===== LEVEL BOUNDARY =====
    { x: W, y: 0, width: 20, height: 720, type: "solid" },
  ],

  /* ─── ENEMIES ─── */
  enemies: [
    // 8 AM Alarm Clock in dorm section
    { type: "alarm_clock", x: 300, y: 500, range: 500, speed: 200 },
    // Freeloader in campus quad
    { type: "freeloader", x: 2200, y: GROUND_Y },
    // Midterm papers in lecture hall
    { type: "midterm_stack", x: 3900, y: 360, range: 400 },
  ],

  /* ─── POWER-UPS ─── */
  powerUps: [
    // Double Espresso #1 — on quad bench area
    { type: "double_espresso", x: 1600, y: 580 },
    // Double Espresso #2 — on library shelf
    { type: "double_espresso", x: 4720, y: 450 },
    // Networking Card — quad elevated platform
    { type: "networking_card", x: 2050, y: 310 },
    // PTO Day — hard-to-reach high platform
    { type: "pto_day", x: 2950, y: 250 },
  ],

  /* ─── NPCs ─── */
  npcs: [
    // Tutorial NPC at quad
    {
      id: "tutorial_senior",
      x: 1350,
      y: GROUND_Y,
      dialogueId: "tutorial_senior",
      startNodeId: "start",
      tree: tutorialDialogue,
      oneShot: true,
      color: 0x22d3ee,
      label: "Friendly Senior",
    },
    // Library NPC
    {
      id: "study_leader",
      x: 4480,
      y: GROUND_Y,
      dialogueId: "study_leader",
      startNodeId: "start",
      tree: libraryDialogue,
      oneShot: true,
      color: 0x818cf8,
      label: "Study Group Leader",
    },
    // Party doorway NPC
    {
      id: "party_host",
      x: 5700,
      y: GROUND_Y,
      dialogueId: "party_host",
      startNodeId: "start",
      tree: partyDialogue,
      oneShot: true,
      color: 0xfbbf24,
      label: "Party Host",
    },
    // Pre-boss NPC
    {
      id: "upperclassman",
      x: 6700,
      y: GROUND_Y,
      dialogueId: "upperclassman",
      startNodeId: "start",
      tree: preBossDialogue,
      oneShot: true,
      color: 0xf87171,
      label: "Upperclassman",
    },
  ],

  /* ─── BOSS ─── */
  boss: {
    type: "professor_no_curve",
    x: 7500,
    y: GROUND_Y,
    arenaLeft: 6800,
    arenaRight: 8000,
    arenaFloorY: GROUND_Y,
    health: 100,
    dialogueTrees: {
      essay: bossEssayDialogue,
      appeal: bossAppealDialogue,
    },
  },

  /* ─── DECORATIONS ─── */
  decorations: [
    // Clouds (far parallax)
    { type: "cloud", x: 200, y: 100, width: 160, height: 40, scrollFactor: 0.02, color: 0xd4a574 },
    { type: "cloud", x: 600, y: 60, width: 200, height: 50, scrollFactor: 0.03, color: 0xc49560 },
    { type: "cloud", x: 1200, y: 120, width: 140, height: 35, scrollFactor: 0.02, color: 0xd4a574 },
    { type: "cloud", x: 2400, y: 80, width: 180, height: 45, scrollFactor: 0.025, color: 0xc49560 },
    { type: "cloud", x: 3600, y: 100, width: 150, height: 38, scrollFactor: 0.02, color: 0xd4a574 },
    { type: "cloud", x: 5000, y: 70, width: 190, height: 48, scrollFactor: 0.03, color: 0xc49560 },
    { type: "cloud", x: 6400, y: 110, width: 170, height: 42, scrollFactor: 0.02, color: 0xd4a574 },

    // Dorm interior
    { type: "building", x: 0, y: 380, width: 600, height: 268, color: 0x1e293b, data: { label: "DORM" } },
    { type: "door", x: 540, y: GROUND_Y - 80, width: 60, height: 80, color: 0x92400e },

    // Campus trees
    { type: "tree", x: 900, y: GROUND_Y, color: 0x166534 },
    { type: "tree", x: 1100, y: GROUND_Y, color: 0x15803d },
    { type: "tree", x: 1600, y: GROUND_Y, color: 0x166534 },
    { type: "tree", x: 2100, y: GROUND_Y, color: 0x14532d },
    { type: "tree", x: 2500, y: GROUND_Y, color: 0x15803d },
    { type: "tree", x: 3000, y: GROUND_Y, color: 0x166534 },

    // Lampposts
    { type: "lamppost", x: 1000, y: GROUND_Y },
    { type: "lamppost", x: 1800, y: GROUND_Y },
    { type: "lamppost", x: 2600, y: GROUND_Y },
    { type: "lamppost", x: 4600, y: GROUND_Y },
    { type: "lamppost", x: 5500, y: GROUND_Y },

    // Benches
    { type: "bench", x: 1500, y: GROUND_Y },
    { type: "bench", x: 1900, y: GROUND_Y },
    { type: "bench", x: 3100, y: GROUND_Y },

    // Lecture hall building facade
    { type: "building", x: 3200, y: 300, width: 1200, height: 348, color: 0x334155, data: { label: "LECTURE HALL" } },

    // Library building
    { type: "building", x: 4400, y: 320, width: 1000, height: 328, color: 0x1e3a5f, data: { label: "LIBRARY" } },

    // Party building
    { type: "building", x: 5600, y: 350, width: 600, height: 298, color: 0x581c87, data: { label: "THE SPOT" } },
    // Music notes floating near party
    { type: "music_note", x: 5700, y: 320 },
    { type: "music_note", x: 5850, y: 290 },
    { type: "music_note", x: 5950, y: 310 },
    { type: "music_note", x: 6100, y: 280 },

    // Boss arena — Exam Hall facade
    { type: "building", x: 6800, y: 300, width: 1200, height: 348, color: 0x7f1d1d, data: { label: "EXAM HALL" } },

    // Bushes along paths
    { type: "bush", x: 800, y: GROUND_Y, color: 0x166534 },
    { type: "bush", x: 1250, y: GROUND_Y, color: 0x14532d },
    { type: "bush", x: 2300, y: GROUND_Y, color: 0x15803d },
    { type: "bush", x: 3150, y: GROUND_Y, color: 0x166534 },
    { type: "bush", x: 5350, y: GROUND_Y, color: 0x14532d },
  ],

  /* ─── TUTORIAL PROMPTS ─── */
  tutorialPrompts: [
    { triggerX: 100, text: "← → or A/D to move", dismissOn: "move" },
    { triggerX: 100, text: "SPACE or W to jump", dismissOn: "jump" },
    { triggerX: 250, text: "Press SHIFT to dodge!", dismissOn: "dodge" },
    { triggerX: 1300, text: "Press E to talk", dismissOn: "interact" },
  ],
};
