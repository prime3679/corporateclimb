import type { ItemId } from '@/types'
import type { FloorId, PoiId } from './ids'
import { elevatorRowFor } from './elevator'
import { POI_INSPECT } from './pois'

/**
 * Pass D optional side POIs. Flavor and first-visit punchlines only —
 * no `rwd_*` rows, so Floor 3–5 ledger maxima stay 54 / 64 / 78.
 * Trigger keys live on `firedTriggers` (no save bump).
 */

export const SIDE_SAFE_READ = 'side:safe_read'
export const SIDE_LOCKERS_OPEN = 'side:lockers_open'
export const SIDE_RACK_RED = 'side:rack_red'
export const SIDE_COOLER_F4 = 'side:cooler_f4'

export const OFFICE_VENDING_STOCK_F1: readonly ItemId[] = ['espresso', 'espresso', 'side_hustle']
export const OFFICE_VENDING_STOCK_F2: readonly ItemId[] = [
  'espresso',
  'espresso',
  'pto_day',
  'standing_desk',
]
export const OFFICE_VENDING_STOCK_F3: readonly ItemId[] = [
  'espresso',
  'noise_cancelling',
  'mentors_advice',
  'standing_desk',
]
export const OFFICE_VENDING_STOCK_F4: readonly ItemId[] = [
  'espresso',
  'networking_card',
  'linkedin_endorsement',
  'reply_all_grenade',
]
export const OFFICE_VENDING_STOCK_F5: readonly ItemId[] = [
  'espresso',
  'pto_day',
  'reorg_memo',
  'forward_to_legal',
]

export const OFFICE_VENDING_STOCK_BY_FLOOR: Record<FloorId, readonly ItemId[]> = {
  floor_01: OFFICE_VENDING_STOCK_F1,
  floor_02: OFFICE_VENDING_STOCK_F2,
  floor_03: OFFICE_VENDING_STOCK_F3,
  floor_04: OFFICE_VENDING_STOCK_F4,
  floor_05: OFFICE_VENDING_STOCK_F5,
}

export const VENDING_FLAVOR: Record<FloorId, { live: string; soldOut: string }> = {
  floor_01: {
    live: 'Accepts Stock Options. Nobody asked how.',
    soldOut: 'Restocked never. The cake is still forty percent off.',
  },
  floor_02: {
    live: 'Accepts Stock Options. Finance has questions.',
    soldOut: 'Restocked never. Budget.',
  },
  floor_03: {
    live: 'Accepts Stock Options. Product has a ticket open about that.',
    soldOut: 'Sold out. The ticket is still open. NOW is still empty.',
  },
  floor_04: {
    live: 'Accepts Stock Options. Someone billed a client for a bag of chips.',
    soldOut: 'Sold out. The client has not noticed. That is the close.',
  },
  floor_05: {
    live: 'Accepts Stock Options. The prices are the same. That feels like a statement.',
    soldOut: 'Sold out. The board does not snack. Neither does the machine.',
  },
}

export function vendingFlavor(
  floorId: FloorId,
  stock: readonly ItemId[],
): { title: string; subtitle: string } {
  const flavor = VENDING_FLAVOR[floorId]
  return {
    title: `VENDING · ${elevatorRowFor(floorId).name}`,
    subtitle: stock.length === 0 ? flavor.soldOut : flavor.live,
  }
}

export interface SidePoiView {
  flags: readonly string[]
  firedTriggers: readonly string[]
  encounters: Partial<Record<string, 'open' | 'won'>>
  keyItems: Record<string, number>
}

export interface SidePoiResult {
  text: string
  trigger?: string
  toast?: string
}

function fired(state: SidePoiView, key: string): boolean {
  return state.firedTriggers.includes(key)
}

function flagged(state: SidePoiView, key: string): boolean {
  return state.flags.includes(key)
}

function won(state: SidePoiView, id: string): boolean {
  return state.encounters[id] === 'won'
}

export function resolveSidePoi(state: SidePoiView, id: PoiId): SidePoiResult | null {
  switch (id) {
    case 'poi_water_cooler':
      if (flagged(state, 'flag_floor5_complete')) {
        return {
          text: 'No gossip. You are the gossip. The cooler is trying not to look impressed.',
        }
      }
      if (flagged(state, 'flag_visited_f2')) {
        return {
          text: 'The gossip is you went up. Renata already knew. The plants are still real.',
        }
      }
      return { text: POI_INSPECT.poi_water_cooler }

    case 'poi_water_cooler_f2':
      if (won(state, 'enc_director_review')) {
        return { text: 'You stood. Kessler does not sit. The cooler filed that under wow.' }
      }
      return { text: POI_INSPECT.poi_water_cooler_f2 }

    case 'poi_water_cooler_f3':
      if (won(state, 'enc_vp_product')) {
        return { text: 'NOW has a card. The cooler is pretending it always did.' }
      }
      return { text: POI_INSPECT.poi_water_cooler_f3 }

    case 'poi_water_cooler_f4':
      if (fired(state, SIDE_COOLER_F4)) {
        return { text: 'The number is different. It was always going to be. That is Sales.' }
      }
      return { text: POI_INSPECT.poi_water_cooler_f4, trigger: SIDE_COOLER_F4 }

    case 'poi_water_cooler_f5':
      if (won(state, 'enc_ceo_review') || flagged(state, 'flag_floor5_complete')) {
        return { text: 'Still no gossip. The nod was enough. The cooler agrees, silently.' }
      }
      return { text: POI_INSPECT.poi_water_cooler_f5 }

    case 'poi_exit_door':
      if (flagged(state, 'flag_floor5_complete')) {
        return {
          text: 'You just got the nod. Leaving now would still be a statement. A better one.',
        }
      }
      if ((state.keyItems.key_access_badge ?? 0) > 0) {
        return { text: 'You could leave. The badge would still work tomorrow. That is the joke.' }
      }
      return { text: POI_INSPECT.poi_exit_door }

    case 'poi_break_table':
      if (fired(state, 'side:break_f1')) {
        return { text: 'The cake is still there. Forty percent off is a lifestyle.' }
      }
      return { text: POI_INSPECT.poi_break_table, trigger: 'side:break_f1' }

    case 'poi_break_table_f2':
      if (fired(state, 'side:break_f2')) {
        return { text: 'Two donuts. Kessler has not come down. The napkin is losing hope.' }
      }
      return { text: POI_INSPECT.poi_break_table_f2, trigger: 'side:break_f2' }

    case 'poi_break_table_f3':
      if (fired(state, 'side:break_f3')) {
        return { text: 'The Q4 box is still empty. Product ate the review. There was no review.' }
      }
      return { text: POI_INSPECT.poi_break_table_f3, trigger: 'side:break_f3' }

    case 'poi_break_table_f4':
      if (fired(state, 'side:break_f4')) {
        return { text: 'The flute is still empty. The mug is still empty. Sales calls it a close.' }
      }
      return { text: POI_INSPECT.poi_break_table_f4, trigger: 'side:break_f4' }

    case 'poi_break_table_f5':
      if (fired(state, 'side:break_f5')) {
        return { text: 'The pitcher is still full. The board still does not eat.' }
      }
      return { text: POI_INSPECT.poi_break_table_f5, trigger: 'side:break_f5' }

    case 'poi_safe':
      if (fired(state, SIDE_SAFE_READ)) {
        return { text: '1-2-3-4. They laminated the sticky. Policy.' }
      }
      return { text: POI_INSPECT.poi_safe, trigger: SIDE_SAFE_READ }

    case 'poi_lockers':
      if (fired(state, SIDE_LOCKERS_OPEN)) {
        return { text: 'Still open. Still empty. The second sticky is still right.' }
      }
      if (fired(state, SIDE_SAFE_READ)) {
        return {
          text: 'You try 1-2-3-4. It opens. Inside: a second sticky. It says SEE SAFE.',
          trigger: SIDE_LOCKERS_OPEN,
          toast: 'Got: Nothing. On purpose.',
        }
      }
      return { text: POI_INSPECT.poi_lockers }

    case 'poi_server_rack':
      if (fired(state, SIDE_RACK_RED)) {
        return { text: 'The Christmas light is still red. Facilities calls it a feature.' }
      }
      return {
        text: 'You find the red one. It is a Christmas light. It has been Christmas since 2019.',
        trigger: SIDE_RACK_RED,
      }

    case 'poi_janitor_cart':
      if (fired(state, 'side:cart')) {
        return { text: 'WET FLOOR. Still dry. The sign has not given up. Neither should you.' }
      }
      return { text: POI_INSPECT.poi_janitor_cart, trigger: 'side:cart' }

    case 'poi_filing_cabinets':
      if (fired(state, 'side:filing_f2')) {
        return { text: 'R for Reorg is still the middle drawer. Do not open it. You already know.' }
      }
      return { text: POI_INSPECT.poi_filing_cabinets, trigger: 'side:filing_f2' }

    case 'poi_help_desk':
      if (fired(state, 'side:help_desk')) {
        return { text: 'HOW TO ESCALATE MYSELF is still open. Teddy has not closed the tab.' }
      }
      return { text: POI_INSPECT.poi_help_desk, trigger: 'side:help_desk' }

    case 'poi_war_desk':
      if (won(state, 'enc_vp_product')) {
        return { text: 'ROADMAP_FINAL_v7_USE_THIS. Quincy renamed it NOW. The file is empty.' }
      }
      return { text: POI_INSPECT.poi_war_desk }

    case 'poi_filing_f3':
      if (flagged(state, 'flag_floor3_complete')) {
        return { text: 'DRAFT, in a confident font. The confidence survived prioritization.' }
      }
      return { text: POI_INSPECT.poi_filing_f3 }

    case 'poi_quincy_desk':
      if (won(state, 'enc_vp_product')) {
        return { text: 'The cursor in NOW has stopped blinking. That is as close as Quincy gets.' }
      }
      return { text: POI_INSPECT.poi_quincy_desk }

    case 'poi_pipeline_desk':
      if (won(state, 'enc_vp_sales')) {
        return { text: "Harper's phone is still face-down. The close does not need a ringtone." }
      }
      return { text: POI_INSPECT.poi_pipeline_desk }

    case 'poi_ashford_desk':
      if (won(state, 'enc_vp_sales')) {
        return { text: 'The flute is still empty. Ashford says that is how you know it closed.' }
      }
      return { text: POI_INSPECT.poi_ashford_desk }

    case 'poi_board_table':
      if (won(state, 'enc_ceo_review') || flagged(state, 'flag_floor5_complete')) {
        return { text: 'The table heard the nod. It is still not impressed. That is the job.' }
      }
      return { text: POI_INSPECT.poi_board_table }

    case 'poi_caldwell_desk':
      if (won(state, 'enc_ceo_review') || flagged(state, 'flag_floor5_complete')) {
        return { text: 'The notepad has one line now. It is a nod, drawn badly. It is enough.' }
      }
      return { text: POI_INSPECT.poi_caldwell_desk }

    case 'poi_director_desk':
      if (won(state, 'enc_director_review')) {
        return { text: 'Bolted down. The plate, the desk, and now you. Permanent is a fastener.' }
      }
      return { text: POI_INSPECT.poi_director_desk }

    default:
      return null
  }
}
