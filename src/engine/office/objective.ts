import { ZONE_LABEL, type ZoneId } from '@/content/office'
import { keyCount, supervisorGateOpen, type OfficeSave } from './state'

export interface OfficeObjective {
  text: string
  zone: ZoneId
  pin: { x: number; y: number }
}

export function currentObjective(state: OfficeSave): OfficeObjective {
  if (state.flags.includes('flag_preview_complete')) {
    return {
      text: 'FLOOR 1 CLEARED · Floor 2 under construction',
      zone: 'zone_reception',
      pin: { x: 8, y: 14 },
    }
  }
  if (keyCount(state, 'key_access_badge') > 0) {
    return { text: 'Take the elevator', zone: 'zone_elevator', pin: { x: 3, y: 1 } }
  }
  if (state.encounters.enc_supervisor_1on1 === 'won') {
    return { text: 'Take the elevator', zone: 'zone_elevator', pin: { x: 3, y: 1 } }
  }
  if (supervisorGateOpen(state)) {
    return { text: 'See Holloway', zone: 'zone_elevator', pin: { x: 10, y: 3 } }
  }
  if (state.assignments.asg_printer === 'complete') {
    return { text: 'Talk to Gavin', zone: 'zone_desks', pin: { x: 6, y: 10 } }
  }
  if (state.assignments.asg_printer === 'installed') {
    return { text: 'Report back to Renata', zone: 'zone_reception', pin: { x: 8, y: 14 } }
  }
  if (state.assignments.asg_printer === 'toner_collected') {
    return { text: 'Install the toner', zone: 'zone_desks', pin: { x: 9, y: 7 } }
  }
  if (state.assignments.asg_printer === 'accepted') {
    return { text: 'Get toner from the supply cabinet', zone: 'zone_break', pin: { x: 15, y: 8 } }
  }
  if (state.flags.includes('flag_greeted')) {
    return { text: 'Talk to Renata', zone: 'zone_reception', pin: { x: 8, y: 14 } }
  }
  return { text: 'Look around', zone: 'zone_reception', pin: { x: 8, y: 14 } }
}

export function objectiveLabel(state: OfficeSave): string {
  const obj = currentObjective(state)
  return `${obj.text} → ${ZONE_LABEL[obj.zone]}`
}
