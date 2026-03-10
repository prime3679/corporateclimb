#!/usr/bin/env node
/**
 * SVG Sprite Generator for Corporate Climb
 * Generates stylized vector art sprites from JSON specs.
 * Run: node scripts/generate-sprites.mjs
 *
 * Outputs SVG files to src/assets/. In production, pipe through sharp for PNG export.
 * For now, Phaser renders these as colored rectangles with shape overlays —
 * this script generates the SVG source files for future PNG sprite sheet compilation.
 */

import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'

const ASSETS_DIR = join(dirname(new URL(import.meta.url).pathname), '..', 'src', 'assets')

// ── Character Specs ──

const PLAYER_SPEC = {
  width: 60,
  height: 80,
  bodyTypes: ['masculine', 'feminine', 'androgynous'],
  skinTones: ['#F5D6B8', '#E8C39E', '#D4A574', '#C19A6B', '#A0785A', '#8B6544', '#6B4226', '#4A2C17'],
  hairstyles: ['Locs', 'Braids', 'Afro', 'Buzz', 'Long', 'Curly', 'Straight', 'Bald', 'Mohawk', 'Bob'],
  accessories: ['None', 'Glasses', 'Headphones', 'Cap'],
  outfitsByLevel: {
    level1: { top: 'hoodie', item: 'backpack' },
    level2: { top: 'button-down', item: 'lanyard' },
    level3: { top: 'polo', item: 'badge' },
    level4: { top: 'blazer', item: 'laptop-bag' },
    level5: { top: 'blazer', item: 'laptop-bag' },
    level6a: { top: 'full-suit', item: 'briefcase' },
    level6b: { top: 'hoodie', item: 'headphones' },
    level6c: { top: 'blazer', item: 'laptop-bag' },
  },
}

const NPC_SPECS = {
  professor_no_curve: {
    width: 55, height: 90,
    bodyColor: '#7F1D1D', accentColor: '#991B1B',
    features: 'tall, angular, glasses',
    palette: 'dark red/maroon',
  },
  ghosting_recruiter: {
    width: 50, height: 80,
    bodyColor: '#6B7280', accentColor: '#3B82F6',
    features: 'corporate gray suit, blue tie',
    palette: 'gray/blue',
  },
  skip_level: {
    width: 65, height: 95,
    bodyColor: '#1E293B', accentColor: '#334155',
    features: 'large, imposing, dark navy',
    palette: 'dark navy',
  },
  credit_thief: {
    width: 50, height: 78,
    bodyColor: '#581C87', accentColor: '#7C3AED',
    features: 'purple suit, smug',
    palette: 'purple',
  },
  overachiever: {
    width: 48, height: 72,
    bodyColor: '#10B981', accentColor: '#34D399',
    features: 'slightly smaller, green accents',
    palette: 'green',
  },
  imposter_shadow: {
    width: 60, height: 80,
    bodyColor: '#2D1B4E', accentColor: '#7C3AED',
    features: 'player silhouette, dark purple-black',
    palette: 'dark purple',
  },
  mentor_corporate: {
    width: 55, height: 85,
    bodyColor: '#92400E', accentColor: '#FBBF24',
    features: 'older, distinguished, gold accents',
    palette: 'warm/gold',
  },
  mentor_startup: {
    width: 52, height: 78,
    bodyColor: '#D97706', accentColor: '#F59E0B',
    features: 'casual, slightly disheveled',
    palette: 'warm orange',
  },
}

const POWER_UP_SPECS = {
  espresso: { color: '#92400E', icon: 'cup-steam', label: 'Double Espresso' },
  networking_card: { color: '#3B82F6', icon: 'card', label: 'Networking Card' },
  pto_day: { color: '#10B981', icon: 'palm', label: 'PTO Day' },
  side_hustle: { color: '#FBBF24', icon: 'dollar', label: 'Side Hustle' },
  linkedin_endorsement: { color: '#2563EB', icon: 'thumbs-up', label: 'LinkedIn Endorsement' },
  mentors_advice: { color: '#8B5CF6', icon: 'lightbulb', label: "Mentor's Advice" },
}

// ── SVG Generators ──

function generatePlayerSVG(bodyType, skinTone, accentColor = '#4F46E5') {
  const isM = bodyType === 'masculine'
  const isF = bodyType === 'feminine'
  const shoulderW = isM ? 24 : isF ? 20 : 22
  const hipW = isM ? 20 : isF ? 22 : 20

  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80">
  <!-- Head -->
  <ellipse cx="30" cy="14" rx="11" ry="13" fill="${skinTone}" />
  <!-- Eyes -->
  <ellipse cx="25" cy="13" rx="2" ry="2.5" fill="#1E293B" />
  <ellipse cx="35" cy="13" rx="2" ry="2.5" fill="#1E293B" />
  <!-- Body -->
  <path d="M${30-shoulderW} 27 L${30+shoulderW} 27 L${30+hipW} 55 L${30-hipW} 55 Z" fill="${accentColor}" />
  <!-- Arms -->
  <rect x="${30-shoulderW-6}" y="28" width="7" height="22" rx="3" fill="${skinTone}" />
  <rect x="${30+shoulderW-1}" y="28" width="7" height="22" rx="3" fill="${skinTone}" />
  <!-- Legs -->
  <rect x="18" y="55" width="10" height="22" rx="3" fill="#334155" />
  <rect x="32" y="55" width="10" height="22" rx="3" fill="#334155" />
  <!-- Shoes -->
  <rect x="16" y="74" width="14" height="6" rx="3" fill="${accentColor}" opacity="0.8" />
  <rect x="30" y="74" width="14" height="6" rx="3" fill="${accentColor}" opacity="0.8" />
</svg>`
}

function generateNpcSVG(spec) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${spec.width}" height="${spec.height}" viewBox="0 0 ${spec.width} ${spec.height}">
  <!-- Head -->
  <ellipse cx="${spec.width/2}" cy="${spec.height*0.15}" rx="10" ry="12" fill="#D4A574" />
  <!-- Body -->
  <rect x="${spec.width*0.2}" y="${spec.height*0.28}" width="${spec.width*0.6}" height="${spec.height*0.4}" rx="4" fill="${spec.bodyColor}" />
  <!-- Accent detail -->
  <rect x="${spec.width*0.42}" y="${spec.height*0.28}" width="${spec.width*0.16}" height="${spec.height*0.25}" fill="${spec.accentColor}" />
  <!-- Legs -->
  <rect x="${spec.width*0.25}" y="${spec.height*0.68}" width="${spec.width*0.2}" height="${spec.height*0.28}" rx="3" fill="#334155" />
  <rect x="${spec.width*0.55}" y="${spec.height*0.68}" width="${spec.width*0.2}" height="${spec.height*0.28}" rx="3" fill="#334155" />
</svg>`
}

function generatePowerUpSVG(spec) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
  <!-- Glow -->
  <circle cx="16" cy="16" r="15" fill="${spec.color}" opacity="0.2" />
  <!-- Body -->
  <circle cx="16" cy="16" r="11" fill="${spec.color}" />
  <!-- Highlight -->
  <ellipse cx="13" cy="12" rx="4" ry="3" fill="white" opacity="0.3" />
</svg>`
}

// ── HUD Icon SVGs ──

function generateHudIcons() {
  const icons = {
    energy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <polygon points="9,1 4,9 8,9 7,15 12,7 8,7" fill="#10B981"/>
    </svg>`,
    reputation: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <polygon points="8,1 10,6 15,6 11,9 12.5,14 8,11 3.5,14 5,9 1,6 6,6" fill="#EF4444"/>
    </svg>`,
    network: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="4" r="3" fill="#3B82F6"/>
      <circle cx="3" cy="12" r="2.5" fill="#3B82F6"/>
      <circle cx="13" cy="12" r="2.5" fill="#3B82F6"/>
      <line x1="8" y1="7" x2="3" y2="10" stroke="#3B82F6" stroke-width="1.5"/>
      <line x1="8" y1="7" x2="13" y2="10" stroke="#3B82F6" stroke-width="1.5"/>
    </svg>`,
    cash: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="7" fill="#FBBF24"/>
      <text x="8" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="#78350F">$</text>
    </svg>`,
  }
  return icons
}

// ── Main Generation ──

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true })
}

function generate() {
  console.log('Generating sprites...')

  // Player sprites (one per skin tone, base body type)
  const playerDir = join(ASSETS_DIR, 'characters', 'player')
  ensureDir(playerDir)
  for (const skinTone of PLAYER_SPEC.skinTones) {
    const safeName = skinTone.replace('#', '')
    const svg = generatePlayerSVG('androgynous', skinTone)
    writeFileSync(join(playerDir, `player_${safeName}.svg`), svg)
  }
  console.log(`  ✓ ${PLAYER_SPEC.skinTones.length} player variants`)

  // NPC sprites
  const npcDir = join(ASSETS_DIR, 'characters', 'npcs')
  ensureDir(npcDir)
  for (const [name, spec] of Object.entries(NPC_SPECS)) {
    writeFileSync(join(npcDir, `${name}.svg`), generateNpcSVG(spec))
  }
  console.log(`  ✓ ${Object.keys(NPC_SPECS).length} NPC sprites`)

  // Power-up sprites
  const itemsDir = join(ASSETS_DIR, 'items')
  ensureDir(itemsDir)
  for (const [name, spec] of Object.entries(POWER_UP_SPECS)) {
    writeFileSync(join(itemsDir, `powerup_${name}.svg`), generatePowerUpSVG(spec))
  }
  console.log(`  ✓ ${Object.keys(POWER_UP_SPECS).length} power-up sprites`)

  // HUD icons
  const uiDir = join(ASSETS_DIR, 'ui')
  ensureDir(uiDir)
  const hudIcons = generateHudIcons()
  for (const [name, svg] of Object.entries(hudIcons)) {
    writeFileSync(join(uiDir, `icon_${name}.svg`), svg)
  }
  console.log(`  ✓ ${Object.keys(hudIcons).length} HUD icons`)

  console.log('Done! SVGs written to src/assets/')
}

generate()
