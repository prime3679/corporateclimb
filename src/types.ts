// ─── TYPES ───────────────────────────────────────────────────

export type StatusId =
  | 'motivated'
  | 'focused'
  | 'caffeinated'
  | 'micromanaged'
  | 'demoralized'
  | 'burned_out'

export interface StatusDef {
  id: StatusId
  name: string
  icon: string
  color: string
  duration: number
  desc: string
}

export interface StatusInstance {
  id: StatusId
  turnsLeft: number
}

export interface StatusEffectOnMove {
  id: StatusId
  target: 'self' | 'enemy'
  chance?: number // 0-1, default 1
}

export interface Move {
  name: string
  dmg: number
  type: MoveType
  desc: string
  pp: number
  acc?: number // 0-100, default 100 (always hits)
  heal?: number
  status?: StatusEffectOnMove
}

export interface ClassPerk {
  name: string
  desc: string
  icon: string
}

export interface PlayerClass {
  id: ClassId
  name: string
  emoji: string
  spriteId: SpriteId
  maxHp: number
  atk: number
  def: number
  spd: number
  types: MoveType[]
  desc: string
  moves: Move[]
  perk: ClassPerk
  intro?: string
  winText?: string
  winTitle?: string
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────
export type AchievementId =
  | 'first_climb'
  | 'triple_threat'
  | 'speed_runner'
  | 'iron_will'
  | 'glass_cannon'
  | 'ng_plus_1'
  | 'ng_plus_3'
  | 'damage_dealer'
  | 'hyperfocused'
  | 'diamond_hands'
  | 'full_stack'

export interface AchievementDef {
  id: AchievementId
  name: string
  desc: string
  icon: string
}

export type MoveType = 'strategy' | 'influence' | 'execution' | 'analytics' | 'technical' | 'normal'

export type ClassId = 'pm' | 'eng' | 'design'

export type SpriteId =
  | 'product_manager'
  | 'overachiever'
  | 'intern'
  | 'recruiter'
  | 'scrum'
  | 'manager'
  | 'vp'
  | 'boss'
  | 'eng'
  | 'design'

export interface EnemyMove {
  name: string
  dmg: number
  type?: MoveType
  acc?: number // 0-100, default 100
  heal?: number
  status?: StatusEffectOnMove
}

export interface EnemyPhase2 {
  name?: string
  emoji?: string
  maxHp: number
  atk?: number
  def?: number
  types?: MoveType[]
  moves: EnemyMove[]
  taunt: string
}

export interface Enemy {
  floor: number
  name: string
  emoji: string
  spriteId: SpriteId
  maxHp: number
  atk: number
  def: number
  types: MoveType[]
  moves: EnemyMove[]
  defeat: string
  title: string
  taunt?: string
  phase2?: EnemyPhase2
}

export interface HallwayEvent {
  id: string
  title: string
  desc: string
  emoji: string
  choices: {
    label: string
    effect: { hp?: number; atk?: number; def?: number; ppRestore?: number }
    result: string
    isGood: boolean
  }[]
}

// ─── ITEMS ───────────────────────────────────────────────────

export type ItemId =
  | 'espresso'
  | 'linkedin_endorsement'
  | 'mentors_advice'
  | 'networking_card'
  | 'pto_day'
  | 'side_hustle'
  | 'standing_desk'
  | 'noise_cancelling'
  | 'reply_all_grenade'
  | 'pip_notice'
  | 'pager_duty'
  | 'reorg_memo'
  | 'forward_to_legal'

export interface ItemDef {
  id: ItemId
  name: string
  emoji: string
  desc: string
  /** Shop price in Stock Options. */
  price: number
  effect: {
    hp?: number
    atk?: number
    def?: number
    ppRestore?: number
    status?: { id: StatusId; target: 'self' }
    /** Flat damage dealt to the enemy (ignores stats and types). */
    dmgEnemy?: number
    /** Status inflicted on the enemy (always lands). */
    enemyStatus?: { id: StatusId }
  }
}

export type AnimState = 'idle' | 'attacking' | 'hit' | 'faint'

export interface DamagePopup {
  id: number
  value: number
  x: number
  y: number
  isCrit: boolean
  isHeal: boolean
  label?: string // "Super effective!" etc.
  labelColor?: string
}

export type Screen =
  | 'title'
  | 'classSelect'
  | 'floorIntro'
  | 'battle'
  | 'victory'
  | 'gameOver'
  | 'win'
  | 'hallwayEvent'
  | 'routeChoice'
  | 'promotion'
  | 'shop'
  | 'elevator'
  | 'actTransition'
  | 'dailyPre'
  | 'dailyResult'

// ─── DAILY CHALLENGE ────────────────────────────────────────

export interface DailyModifier {
  id: string
  name: string
  desc: string
  icon: string
  apply: (context: DailyModifierContext) => void
}

export interface DailyModifierContext {
  enemyAtkMult: number
  enemyHpMult: number
  enemyDefMult: number
  playerDefMult: number
  itemsEnabled: boolean
  eventsEnabled: boolean
  ppMult: number
  assignedClassId?: string
}

// ─── PROMOTIONS ─────────────────────────────────────────────

export interface PromotionTier {
  floor: number
  title: string
  /** Legacy fixed boost — superseded by perk choices, kept for old saves. */
  statBoost?: { maxHp?: number; atk?: number; def?: number }
  moveUpgrades?: { fromName: string; to: Move }[]
}

// ─── PERKS ──────────────────────────────────────────────────
// At each promotion the player picks 1 of 3 perks: a stat package, a
// build-defining passive, and an economy perk. Stat packages can be
// picked repeatedly (they stack); passives and economy perks are
// one-time picks.

export type PerkId =
  // stat packages (repeatable)
  | 'gym_membership'
  | 'assertiveness_training'
  | 'executive_presence'
  | 'balanced_package'
  // passives (unique)
  | 'overtime_grind'
  | 'perfectionist'
  | 'networking_guru'
  | 'morning_person'
  | 'self_care'
  // economy (unique)
  | 'negotiator'
  | 'employee_discount'
  | 'headhunter'
  | 'signing_bonus'

export type PerkKind = 'stat' | 'passive' | 'economy'

export interface PerkDef {
  id: PerkId
  name: string
  desc: string
  icon: string
  kind: PerkKind
  /** Stat packages stack; passives/economy can be owned once. */
  repeatable?: boolean
  statBoost?: { maxHp?: number; atk?: number; def?: number }
  /** Multiplier on outgoing player damage (e.g. 1.12). */
  dmgMult?: number
  /** Additional crit chance, 0-1. */
  critBonus?: number
  /** Fraction of damage dealt healed back, 0-1. */
  lifesteal?: number
  /** Status granted at the start of every battle. */
  startBattleStatus?: StatusId
  /** HP healed after each battle win. */
  postBattleHeal?: number
  /** Multiplier on Stock Option payouts. */
  payoutMult?: number
  /** Multiplier on shop prices (e.g. 0.75). */
  priceMult?: number
  /** Hallway-event bonus item chance override (default 0.3). */
  eventItemChance?: number
  /** Stock Options granted immediately when picked. */
  instantOptions?: number
}

// ─── STATUS SYMBOLS (relics) ────────────────────────────────
// Run-permanent artifacts dropped by elite floors — found, not chosen
// at promotions. Each is owned at most once per run.

export type RelicId =
  | 'golden_stapler'
  | 'corner_office_key'
  | 'executive_parking'
  | 'platinum_card'
  | 'ergonomic_throne'
  | 'lucky_tie'
  | 'stress_ball'
  | 'mahogany_desk'

export interface RelicDef {
  id: RelicId
  name: string
  desc: string
  icon: string
  statBoost?: { maxHp?: number; atk?: number; def?: number }
  /** Multiplier on outgoing player damage. */
  dmgMult?: number
  /** Additional crit chance, 0-1. */
  critBonus?: number
  /** HP healed after each battle win. */
  postBattleHeal?: number
  /** Multiplier on Stock Option payouts. */
  payoutMult?: number
  /** Halves burnout chip damage taken by the player. */
  burnGuard?: boolean
}

export interface SaveData {
  classId: string
  floor: number
  level: number
  xp: number
  xpToNext: number
  playerHp: number
  playerPp: number[]
  atkBuff: number
  defBuff: number
  usedEvents: string[]
  inventory: ItemId[]
  floorEnemyIds?: string[] // tracks which enemy variant was selected per floor
  ngPlus?: number // New Game+ level (0 = first playthrough)
  totalTurns?: number
  totalDamageDealt?: number
  itemsUsed?: number
  enemyPhase?: 1 | 2
}
