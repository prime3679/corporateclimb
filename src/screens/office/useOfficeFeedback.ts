import { useEffect, useRef, useState } from 'react'
import {
  OFFICE_ENCOUNTERS,
  POI_INSPECT,
  RECEIPTS,
  REWARD_OPTIONS,
  ZONE_LABEL,
  zoneAt,
} from '@/content/office'
import {
  currentObjective,
  inspectText,
  interactTarget,
  memberName,
  type OfficeState,
} from '@/engine/office'
import { Haptics } from '@/platform'
import { SFX } from '@/sfx'
import { promptText } from './cast'

/**
 * The §12 feedback matrix, driven by state diffs so the engine stays pure:
 * every cue is an existing `SFX` method or `Haptics` call. Returns the text
 * for the single polite live region.
 */
export function useOfficeFeedback(state: OfficeState): string {
  const prevRef = useRef<OfficeState | null>(null)
  const [announce, setAnnounce] = useState('')

  useEffect(() => {
    const prev = prevRef.current
    prevRef.current = state
    if (!prev) return
    const say = (text: string) => setAnnounce(text)

    // Objective stage advance.
    const prevObj = currentObjective(prev)
    const obj = currentObjective(state)
    if (prevObj.text !== obj.text) {
      SFX.menuConfirm()
      Haptics.selection()
      say(`Objective: ${obj.text}. ${ZONE_LABEL[obj.zone]}.`)
    }

    // Zone change.
    const prevZone = zoneAt(prev.player.x, prev.player.y)
    const zone = zoneAt(state.player.x, state.player.y)
    if (prevZone !== zone && state.screen === 'overworld') {
      say(`Entering: ${ZONE_LABEL[zone]}.`)
    }

    // Interact available.
    if (state.screen === 'overworld' && !state.overlay) {
      const target = interactTarget(state)
      const prevTarget = prev.overlay ? null : interactTarget(prev)
      if (target && (!prevTarget || prevTarget.id !== target.id)) {
        say(`Nearby: ${promptText(target, state).replace(' · ', ', ')}. Press E.`)
      }
    }

    // Recruit joined.
    if (state.party.length > prev.party.length) {
      SFX.fanfare()
      Haptics.success()
      say(`${memberName(state.party[state.party.length - 1])} joined the team.`)
    }

    // Team level up.
    if (state.run.level > prev.run.level) {
      SFX.levelUp()
      Haptics.success()
      say(`Team level ${state.run.level}.`)
    }

    // Screen transitions.
    if (state.screen !== prev.screen) {
      if (state.screen === 'battle' && state.encounter) {
        const enc = OFFICE_ENCOUNTERS[state.encounter.encounterId]
        if (enc.boss) SFX.bossIntro()
        else SFX.enemyAppear()
        Haptics.impact('medium')
        say(`${enc.titleCard}. ${enc.name}.`)
      } else if (state.screen === 'preview_complete') {
        SFX.elevatorUp()
        window.setTimeout(() => SFX.fanfare(), 700)
        Haptics.success()
        say('Floor 1 cleared.')
      } else if (state.screen === 'promotion') {
        SFX.fanfare()
        say('Cleared probation. Pick a perk.')
      } else if (state.screen === 'vending') {
        SFX.menuSelect()
        Haptics.selection()
      }
    }

    // Overlay openings.
    const ov = state.overlay
    const prevOv = prev.overlay
    const changed =
      ov && (!prevOv || prevOv.kind !== ov.kind || JSON.stringify(prevOv) !== JSON.stringify(ov))
    if (!changed) return

    if (ov.kind === 'receipt') {
      const rec = RECEIPTS[ov.receiptId]
      if (ov.receiptId === 'rcpt_printer_online') {
        SFX.printerJam()
        window.setTimeout(() => SFX.coin(), 420)
      } else {
        SFX.coin()
      }
      Haptics.success()
      say(`${rec.title}. ${rec.lines.map((l) => l.text).join('. ')}.`)
      return
    }

    if (ov.kind === 'toast') {
      if (ov.text.startsWith('You take five')) {
        SFX.coffee()
        window.setTimeout(() => SFX.heal(), 380)
        Haptics.success()
      } else if (ov.text.startsWith('Got:') || ov.text.startsWith('Swapped:')) {
        SFX.coin()
        Haptics.selection()
      }
      say(ov.text)
      return
    }

    if (ov.kind === 'interstitial') {
      SFX.gameOver()
      Haptics.warning()
      say('Your team needs a minute.')
      return
    }

    if (ov.kind === 'confirm') {
      if (ov.prompt === 'door') {
        SFX.glassDoor()
        Haptics.selection()
        say("Elevator lobby. Holloway's one-on-one starts when you step in.")
      } else if (ov.prompt === 'elevator') {
        SFX.menuConfirm()
        Haptics.selection()
        say('Elevator. The reader blinks green. Ride up?')
      } else {
        SFX.menuSelect()
        Haptics.selection()
        say('Take five? Restores the whole team.')
      }
      return
    }

    if (ov.kind === 'stakes') {
      const enc = OFFICE_ENCOUNTERS[ov.encounterId]
      SFX.menuSelect()
      Haptics.selection()
      say(
        `${enc.titleCard}. Win: ${enc.xp} XP, ${enc.options} Options. Lose: break room, walk back.`,
      )
      return
    }

    if (
      ov.kind === 'team' ||
      ov.kind === 'document' ||
      ov.kind === 'handout' ||
      ov.kind === 'recruit'
    ) {
      SFX.menuSelect()
      Haptics.selection()
      return
    }

    if (ov.kind === 'dialogue') {
      if (prevOv?.kind === 'dialogue' && prevOv.nodeId === ov.nodeId) {
        return // line advance: the typewriter ticks
      }
      const inspect = inspectText(ov.nodeId)
      if (inspect === POI_INSPECT.poi_elevator_door) {
        SFX.eventBad()
        Haptics.warning()
        say('Badge required. The reader blinks red.')
        return
      }
      if (ov.nodeId === 'dlg_priya_wrong_deck' || ov.nodeId === 'dlg_priya_wrong_q2') {
        SFX.eventBad()
        Haptics.warning()
        return
      }
      const moved = prev.player.x !== state.player.x || prev.player.y !== state.player.y
      if (moved && !prevOv) {
        SFX.email()
      } else if (!prevOv) {
        SFX.menuSelect()
      }
      if (!prevOv) Haptics.selection()
    }
  }, [state])

  return announce
}

/**
 * The wallet number the HUD shows: it lags the real value while a receipt is
 * open so the total only changes when the player files it (§10.6). Returns
 * the displayed value and whether it just changed (for the gold pulse).
 */
export function useDeferredWallet(state: OfficeState): { shown: number; pulse: boolean } {
  const [shown, setShown] = useState(() => {
    // Mounting under an open receipt (new campaign, resumed grant): show the
    // pre-grant total so the chip visibly counts up when it is filed.
    const ov = state.overlay
    const rewardId = ov?.kind === 'receipt' ? RECEIPTS[ov.receiptId].rewardId : undefined
    const pending = rewardId ? REWARD_OPTIONS[rewardId] : 0
    return Math.max(0, state.run.stockOptions - pending)
  })
  const [pulse, setPulse] = useState(false)
  const holding = state.overlay?.kind === 'receipt'
  const actual = state.run.stockOptions
  useEffect(() => {
    if (holding || actual === shown) return
    // A beat after the receipt files, the chip counts to the new total and pulses.
    const reveal = window.setTimeout(() => {
      setShown(actual)
      setPulse(true)
    }, 120)
    const settle = window.setTimeout(() => setPulse(false), 820)
    return () => {
      window.clearTimeout(reveal)
      window.clearTimeout(settle)
    }
  }, [holding, actual, shown])
  return { shown, pulse }
}
