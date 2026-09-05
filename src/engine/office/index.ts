export { PARTY_MAX } from '@/content/office'
export {
  classById,
  enqueueOverlays,
  fromOfficeSave,
  hasFlag,
  inParty,
  keyCount,
  kitFor,
  lettersHeld,
  memberName,
  newOfficeCampaign,
  partyHasRoom,
  supervisorGateOpen,
  toOfficeSave,
  withFlag,
  withKey,
  type EncounterContext,
  type OfficeSave,
  type OfficeState,
  type Overlay,
  type PartyMember,
} from './state'
export {
  OFFICE_SAVE_KEY,
  OFFICE_SAVE_VERSION,
  clearOfficeSave,
  hasOfficeSave,
  loadOffice,
  loadOfficeSave,
  saveOffice,
} from './save'
export { currentObjective, objectiveLabel, type OfficeObjective } from './objective'
export { interactTarget, tryStep } from './movement'
export { effectiveKit, maxHpFor, recruitCoworker, restoreParty } from './party'
export { encounterIntro, shouldCoachSwitch, startEncounter } from './combat'
export {
  dispatchOfficeAction,
  inspectText,
  type OfficeAction,
  type OfficeDispatchResult,
} from './actions'
export { resolveNpcTalk } from './talk'
