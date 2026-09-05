import { TYPE_COLORS } from '@/data'
import type { MoveType } from '@/types'

/** Ring color for a member: gold for lead, primary type color otherwise. */
export function ringColorFor(types: MoveType[], lead: boolean): string {
  if (lead) return 'var(--cc-gold)'
  return TYPE_COLORS[types[0]] ?? TYPE_COLORS.normal
}
