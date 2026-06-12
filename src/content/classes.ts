import type { ClassId, PlayerClass, PromotionTier } from '../types'

// ─── PLAYER CLASSES ──────────────────────────────────────────
export const PLAYER_CLASSES: PlayerClass[] = [
  {
    id: 'pm',
    name: 'Product Manager',
    emoji: '📋',
    spriteId: 'product_manager',
    maxHp: 100,
    atk: 14,
    def: 10,
    spd: 12,
    types: ['strategy', 'influence'],
    desc: 'Balances roadmaps and stakeholders. High versatility.',
    moves: [
      {
        name: 'Prioritize Backlog',
        dmg: 18,
        type: 'strategy',
        desc: 'Ruthlessly cuts scope. Hits hard.',
        pp: 15,
        status: { id: 'focused', target: 'self', chance: 0.4 },
      },
      {
        name: 'Stakeholder Align',
        dmg: 12,
        type: 'influence',
        desc: 'Forces agreement through sheer will.',
        pp: 20,
        heal: 8,
        status: { id: 'motivated', target: 'self' },
      },
      {
        name: 'Ship MVP',
        dmg: 28,
        type: 'execution',
        desc: '80/20 strikes. Maximum impact.',
        pp: 6,
        acc: 90,
      },
      {
        name: 'Data-Driven Roast',
        dmg: 35,
        type: 'analytics',
        desc: 'Destroys arguments with metrics.',
        pp: 3,
        acc: 80,
        status: { id: 'demoralized', target: 'enemy', chance: 0.5 },
      },
    ],
    perk: { name: 'Cross-Functional', desc: 'Heals 5 HP after every battle', icon: '\u{1F91D}' },
    intro: 'Armed with a roadmap and ruthless prioritization, you step into the lobby.',
    winText: "You didn't just climb the ladder — you redefined it.",
    winTitle: 'Chief Product Officer',
  },
  {
    id: 'eng',
    name: 'Senior Engineer',
    emoji: '\u2328\uFE0F',
    spriteId: 'eng',
    maxHp: 90,
    atk: 18,
    def: 8,
    spd: 14,
    types: ['technical', 'execution'],
    desc: 'Writes code and rewrites everything else. Glass cannon.',
    moves: [
      {
        name: 'Refactor Everything',
        dmg: 22,
        type: 'technical',
        desc: 'Rewrites the opponent from scratch.',
        pp: 12,
        status: { id: 'motivated', target: 'self', chance: 0.4 },
      },
      {
        name: 'Deploy to Prod',
        dmg: 30,
        type: 'execution',
        desc: 'YOLO push on Friday. Risky but devastating.',
        pp: 5,
        acc: 85,
        status: { id: 'caffeinated', target: 'self' },
      },
      {
        name: 'Code Review Reject',
        dmg: 15,
        type: 'technical',
        desc: 'Nit-picks until they give up.',
        pp: 15,
        status: { id: 'micromanaged', target: 'enemy' },
      },
      {
        name: 'Stack Overflow',
        dmg: 40,
        type: 'analytics',
        desc: 'Channels the collective wisdom. Huge damage.',
        pp: 3,
        acc: 75,
      },
    ],
    perk: { name: 'Optimization', desc: '+15% damage on all moves', icon: '\u{1F4A5}' },
    intro: 'You crack your knuckles. Time to ship.',
    winText: 'You refactored the entire org chart.',
    winTitle: 'Chief Technology Officer',
  },
  {
    id: 'design',
    name: 'UX Designer',
    emoji: '🎨',
    spriteId: 'design',
    maxHp: 85,
    atk: 12,
    def: 12,
    spd: 16,
    types: ['analytics', 'technical'],
    desc: "Sees what others can't. Fast and balanced.",
    moves: [
      {
        name: 'Pixel Perfect Punch',
        dmg: 20,
        type: 'execution',
        desc: 'That 1px misalignment? Fixed violently.',
        pp: 15,
        status: { id: 'focused', target: 'self', chance: 0.3 },
      },
      {
        name: 'User Research Beam',
        dmg: 16,
        type: 'analytics',
        desc: '\u201CActually, users said\u2026\u201D',
        pp: 18,
        heal: 6,
        status: { id: 'demoralized', target: 'enemy', chance: 0.4 },
      },
      {
        name: 'Figma Tornado',
        dmg: 26,
        type: 'technical',
        desc: '200 frames of animated fury.',
        pp: 8,
        acc: 90,
      },
      {
        name: 'Design System Slam',
        dmg: 38,
        type: 'strategy',
        desc: 'Enforces consistency. Crushing blow.',
        pp: 3,
        acc: 75,
        status: { id: 'motivated', target: 'self', chance: 0.5 },
      },
    ],
    perk: { name: 'Eye for Detail', desc: '+15% crit chance on all moves', icon: '\u{1F3AF}' },
    intro: "You see what others can't. That's your edge.",
    winText: 'You redesigned the company from the inside out.',
    winTitle: 'Chief Design Officer',
  },
]

// ─── PROMOTION TRACKS ───────────────────────────────────────
// Promotions grant a pick-1-of-3 perk choice (see PERKS below) instead
// of fixed stat boosts; move upgrades at floors 10/20 stay automatic.
export const PROMOTION_TRACKS: Record<ClassId, PromotionTier[]> = {
  pm: [
    { floor: 0, title: 'Product Manager' },
    { floor: 5, title: 'Senior PM' },
    {
      floor: 10,
      title: 'Director of Product',
      moveUpgrades: [
        {
          fromName: 'Prioritize Backlog',
          to: {
            name: 'Strategic Roadmap',
            dmg: 24,
            type: 'strategy',
            desc: 'Sees three quarters ahead.',
            pp: 15,
            status: { id: 'focused', target: 'self', chance: 0.5 },
          },
        },
      ],
    },
    { floor: 15, title: 'VP Product' },
    {
      floor: 20,
      title: 'SVP Product',
      moveUpgrades: [
        {
          fromName: 'Ship MVP',
          to: {
            name: 'Launch Platform',
            dmg: 36,
            type: 'execution',
            desc: 'Ship the whole ecosystem.',
            pp: 6,
            acc: 90,
            status: { id: 'motivated', target: 'self', chance: 0.4 },
          },
        },
      ],
    },
    { floor: 25, title: 'Chief Product Officer' },
  ],
  eng: [
    { floor: 0, title: 'Senior Engineer' },
    { floor: 5, title: 'Staff Engineer' },
    {
      floor: 10,
      title: 'Engineering Manager',
      moveUpgrades: [
        {
          fromName: 'Refactor Everything',
          to: {
            name: 'Architecture Review',
            dmg: 28,
            type: 'technical',
            desc: 'Redesigns the entire system.',
            pp: 12,
            status: { id: 'motivated', target: 'self', chance: 0.5 },
          },
        },
      ],
    },
    { floor: 15, title: 'VP Engineering' },
    {
      floor: 20,
      title: 'SVP Engineering',
      moveUpgrades: [
        {
          fromName: 'Deploy to Prod',
          to: {
            name: 'Ship to Scale',
            dmg: 38,
            type: 'execution',
            desc: 'Multi-region deploy. Zero downtime.',
            pp: 5,
            acc: 85,
            status: { id: 'caffeinated', target: 'self' },
          },
        },
      ],
    },
    { floor: 25, title: 'Chief Technology Officer' },
  ],
  design: [
    { floor: 0, title: 'UX Designer' },
    { floor: 5, title: 'Senior Designer' },
    {
      floor: 10,
      title: 'Design Lead',
      moveUpgrades: [
        {
          fromName: 'Pixel Perfect Punch',
          to: {
            name: 'Design Critique',
            dmg: 26,
            type: 'execution',
            desc: 'Your feedback cuts deep.',
            pp: 15,
            status: { id: 'focused', target: 'self', chance: 0.4 },
          },
        },
      ],
    },
    { floor: 15, title: 'VP Design' },
    {
      floor: 20,
      title: 'SVP Design',
      moveUpgrades: [
        {
          fromName: 'Figma Tornado',
          to: {
            name: 'Design System Overhaul',
            dmg: 34,
            type: 'technical',
            desc: 'Rebuilds the entire visual language.',
            pp: 8,
            acc: 90,
            status: { id: 'motivated', target: 'self', chance: 0.4 },
          },
        },
      ],
    },
    { floor: 25, title: 'Chief Design Officer' },
  ],
}

// Run state carries classId as a plain string (it round-trips through
// saves), so promotion lookups tolerate unknown ids at the boundary.
export function getPromotionTrack(classId: string): PromotionTier[] {
  return PROMOTION_TRACKS[classId as ClassId] ?? []
}

export function getPromotion(classId: string, floor: number): PromotionTier | undefined {
  const track = getPromotionTrack(classId)
  return [...track].reverse().find((t) => floor >= t.floor) || track[0]
}
