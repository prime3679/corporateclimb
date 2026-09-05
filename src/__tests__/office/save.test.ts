import { beforeEach, describe, expect, it } from 'vitest'
import { PLAYER_CLASSES } from '@/data'
import { SAVE_KEY, clearSave, loadRun, newRun, saveRun } from '@/engine'
import {
  OFFICE_SAVE_KEY,
  clearOfficeSave,
  dispatchOfficeAction,
  loadOffice,
  newOfficeCampaign,
  saveOffice,
  toOfficeSave,
} from '@/engine/office'

const PM = PLAYER_CLASSES.find((c) => c.id === 'pm')!

describe('office save isolation', () => {
  beforeEach(() => {
    clearSave()
    clearOfficeSave()
  })

  it('writes a separate key and never touches the Classic slot', () => {
    saveRun(newRun(PM))
    const classic = localStorage.getItem(SAVE_KEY)
    const s = newOfficeCampaign(PM)
    saveOffice(s)
    expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBeTruthy()
    expect(localStorage.getItem(SAVE_KEY)).toBe(classic)
    expect(loadRun()?.classId).toBe('pm')
  })

  it('clearing the office save leaves Classic Continue intact', () => {
    saveRun(newRun(PM))
    saveOffice(newOfficeCampaign(PM))
    clearOfficeSave()
    expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBeNull()
    expect(loadRun()?.classId).toBe('pm')
  })

  it('reloads position, letters, assignments, and a pending perk offer', () => {
    let s = newOfficeCampaign(PM)
    s = {
      ...s,
      player: { x: 9, y: 3, facing: 'w' },
      assignments: { asg_printer: 'complete', asg_meeting_prep: 'accepted' },
      encounters: {
        enc_desk_challenger: 'won',
        enc_meeting_prepper: 'open',
        enc_supervisor_1on1: 'open',
      },
      keyItems: { key_offer_letter: 1 },
      run: { ...s.run, pendingPerkOffer: ['signing_bonus', 'gym_membership', 'negotiator'] },
    }
    saveOffice(toOfficeSave(s))
    const loaded = loadOffice()
    expect(loaded?.player).toEqual({ x: 9, y: 3, facing: 'w' })
    expect(loaded?.assignments.asg_printer).toBe('complete')
    expect(loaded?.keyItems.key_offer_letter).toBe(1)
    expect(loaded?.run.pendingPerkOffer).toEqual(['signing_bonus', 'gym_membership', 'negotiator'])
    expect(loaded?.screen).toBe('promotion')
  })

  it('dispatchOfficeAction is a pure reducer and never writes either save key', () => {
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBeNull()
    let s = newOfficeCampaign(PM)
    s = dispatchOfficeAction(s, { type: 'ACK_RECEIPT' }).state
    s = dispatchOfficeAction(s, { type: 'MOVE', dir: 'w' }).state
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBeNull()
    saveOffice(s)
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem(OFFICE_SAVE_KEY)).toBeTruthy()
  })
})
