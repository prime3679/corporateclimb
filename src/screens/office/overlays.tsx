import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CURRENCY_ICON, ITEMS, PERKS } from '@/data'
import {
  AGENDA_TEXT,
  COWORKER_DESK,
  COWORKER_KITS,
  COWORKER_NAME,
  DIALOGUE,
  ELEVATOR_FLOORS,
  FLOOR_DIRECTORY_TEXT,
  canRideTo,
  deskRosterLine,
  floorLabel,
  floorNumber,
  HANDOUT_CHOICES,
  OFFICE_ENCOUNTERS,
  RECEIPTS,
  ledgerOptionsEarned,
  type CoworkerId,
  type DialogueId,
  type ReceiptId,
} from '@/content/office'
import {
  dispatchOfficeAction,
  effectiveKit,
  inspectText,
  kitFor,
  lettersHeld,
  lossDialogue,
  maxHpFor,
  memberName,
  partyHasRoom,
  type OfficeState,
  type PartyMember,
} from '@/engine/office'
import { Button } from '@/ui'
import TypeBadge from '@/components/TypeBadge'
import XpBar from '@/components/XpBar'
import { SFX } from '@/sfx'
import Headshot from './Headshot'
import { ringColorFor } from './ringColor'
import { PartyChips, hpTone } from './PartyStrip'
import { NPC_CAST, castForSpeaker, memberRing, memberRole, memberSprite } from './cast'
import styles from './Overlays.module.css'

type Act = (action: Parameters<typeof dispatchOfficeAction>[1]) => void

export interface OverlayProps {
  state: OfficeState
  onChange: (next: OfficeState) => void
  /** Typewriter speed; 0 renders lines instantly. */
  textMsPerChar?: number
  reduceMotion?: boolean
}

/* ─── hooks ─────────────────────────────────────────────── */

function useTypewriter(text: string, msPerChar: number) {
  const [count, setCount] = useState(msPerChar <= 0 ? text.length : 0)
  const [prev, setPrev] = useState(text)
  if (prev !== text) {
    setPrev(text)
    setCount(msPerChar <= 0 ? text.length : 0)
  }
  useEffect(() => {
    if (count >= text.length) return
    const t = window.setTimeout(
      () => {
        const next = msPerChar <= 0 ? text.length : count + 1
        if (next % 3 === 0 && next < text.length) SFX.textTick()
        setCount(next)
      },
      Math.max(0, msPerChar),
    )
    return () => window.clearTimeout(t)
  }, [count, text, msPerChar])
  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    finish: () => setCount(text.length),
  }
}

/** Counts 0 → target over `ms` (instant when motion is reduced). */
function useCountUp(target: number, ms: number, instant: boolean) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (instant) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms, instant])
  return instant ? target : value
}

/* ─── shared pieces ─────────────────────────────────────── */

function Scrim({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  return (
    <div className={styles.scrim} role="dialog" aria-modal="true">
      <div className={`${styles.card} ${tight ? styles.cardTight : ''}`}>{children}</div>
    </div>
  )
}

function useAct(state: OfficeState, onChange: (next: OfficeState) => void): Act {
  return (action) => onChange(dispatchOfficeAction(state, action).state)
}

/* ─── receipt rows ──────────────────────────────────────── */

interface ReceiptRow {
  label: string
  value: string
  count?: number
  gold?: boolean
  sub?: string
}

function parseReceiptLine(text: string, state: OfficeState): ReceiptRow {
  const t = text.replace(/\s+/g, ' ').trim()
  let m = t.match(/^\+(\d+) 📈 ?(.*)$/)
  if (m) return { label: m[2] || 'Stock Options', value: `📈`, count: Number(m[1]) }
  m = t.match(/^\+(\d+) XP$/)
  if (m)
    return {
      label: 'XP',
      value: '',
      count: Number(m[1]),
      sub: `${state.run.xp}/${state.run.xpToNext}`,
    }
  m = t.match(/^Offer Letter ×(\d+) ?📄$/)
  if (m) return { label: 'Offer Letter', value: `×${m[1]} 📄` }
  if (t === 'Access Badge 🪪') return { label: 'Access Badge', value: '🪪', gold: true }
  if (t === 'Offer eligible ✓') return { label: 'Offer eligible', value: '✓' }
  if (t === 'Promotion →') return { label: 'Promotion', value: '→ next', gold: true }
  return { label: t, value: '' }
}

function ReceiptRowView({ row, instant }: { row: ReceiptRow; instant: boolean }) {
  const n = useCountUp(row.count ?? 0, 400, instant || row.count === undefined)
  return (
    <div className={`${styles.row} ${row.gold ? styles.rowGold : ''}`}>
      <span className={styles.rowLabel}>{row.label}</span>
      <span className={styles.rowValue}>
        {row.count !== undefined ? `+${n} ` : ''}
        {row.value}
        {row.sub && <span className={styles.rowValueSub}>{row.sub}</span>}
      </span>
    </div>
  )
}

function Receipt({
  receiptId,
  state,
  onFile,
  reduceMotion,
}: {
  receiptId: ReceiptId
  state: OfficeState
  onFile: () => void
  reduceMotion: boolean
}) {
  const rec = RECEIPTS[receiptId]
  const rows = rec.lines.map((l) => parseReceiptLine(l.text, state))
  return (
    <Scrim tight>
      <div className={styles.receipt}>
        <div className={`${styles.eyebrow} ${styles.eyebrowHeal}`}>Approved</div>
        <div className={styles.title}>{rec.title}</div>
        <div className={styles.rows} aria-live="polite">
          {rows.map((r, i) => (
            <ReceiptRowView key={`${r.label}-${i}`} row={r} instant={reduceMotion} />
          ))}
        </div>
        <div className={styles.footer}>“{rec.footer}”</div>
        <div className={`${styles.actions} ${styles.actionsEnd}`}>
          <Button variant="primary" onClick={onFile} autoFocus>
            File it
          </Button>
        </div>
      </div>
    </Scrim>
  )
}

/* ─── dialogue ──────────────────────────────────────────── */

function RecruitSummary({ state, coworkerId }: { state: OfficeState; coworkerId: CoworkerId }) {
  const kit = COWORKER_KITS[coworkerId]
  const cast =
    coworkerId === 'cw_desk_challenger'
      ? NPC_CAST.npc_desk_challenger
      : NPC_CAST.npc_meeting_prepper
  return (
    <div>
      <div className={styles.recruitBlock}>
        <Headshot spriteId={kit.spriteId} size={64} ring={ringColorFor(kit.types, false)} />
        <div style={{ minWidth: 0 }}>
          <div className={styles.title} style={{ marginTop: 0 }}>
            {kit.name}
          </div>
          <div className={styles.sub}>{cast.role}</div>
          <div className={styles.recruitStats}>
            <span>HP {kit.maxHp}</span>
            <span>ATK {kit.atk}</span>
            <span>DEF {kit.def}</span>
            {kit.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <div className={styles.recruitStats}>{kit.moves.map((m) => m.name).join(' · ')}</div>
        </div>
      </div>
      <div className={styles.teamRow}>
        <span className={styles.kvKey}>Team</span>
        <PartyChips state={state} size={44} emptyHighlight />
        <span className={styles.wallet}>{lettersHeld(state)} 📄</span>
      </div>
    </div>
  )
}

const OFFER_NODES: Partial<Record<DialogueId, CoworkerId>> = {
  dlg_gavin_offer: 'cw_desk_challenger',
  dlg_priya_offer: 'cw_meeting_prepper',
}

function Dialogue({
  state,
  act,
  nodeId,
  lineIdx,
  msPerChar,
}: {
  state: OfficeState
  act: Act
  nodeId: string
  lineIdx: number
  msPerChar: number
}) {
  const inspect = inspectText(nodeId)
  const node = DIALOGUE[nodeId as DialogueId]
  const extras =
    nodeId === 'dlg_holloway_1on1' && state.party.length >= 2 && lineIdx === 1
      ? ' You brought people. Good. I talk for a living; take turns.'
      : ''
  // `{n}` is the Floor 1 ledger total Whitlock quotes back (design §2.2).
  const raw = (inspect ?? node?.lines[lineIdx] ?? '') + extras
  const line = raw.includes('{n}')
    ? raw.split('{n}').join(String(ledgerOptionsEarned(state.rewardsClaimed, 'floor_01')))
    : raw
  const cast = node ? castForSpeaker(node.speaker, nodeId) : null
  const tw = useTypewriter(line, msPerChar)
  const isLast = !!node && lineIdx >= node.lines.length - 1
  const choices = node?.choices && isLast ? node.choices : null
  const offer = isLast ? OFFER_NODES[nodeId as DialogueId] : undefined
  const eyebrow = cast
    ? `${cast.entry.name} · ${cast.entry.role}`
    : inspect
      ? 'Inspect'
      : node?.name || 'Inspect'

  const onBox = () => {
    if (!tw.done) {
      tw.finish()
      return
    }
    if (choices) return
    act({ type: 'ADVANCE' })
  }

  const onBoxRef = useRef(onBox)
  useEffect(() => {
    onBoxRef.current = onBox
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'e' && e.key !== 'E' && e.key !== ' ') return
      if (document.activeElement instanceof HTMLButtonElement) return
      e.preventDefault()
      onBoxRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className={styles.dialogue} onClick={onBox} role="dialog" aria-live="polite">
      <div className={styles.dlgHead}>
        {cast && !cast.acrossRoom && (
          <Headshot
            spriteId={cast.entry.spriteId}
            size={48}
            ring={ringColorFor(cast.entry.types, false)}
          />
        )}
        <div className={styles.eyebrow}>{eyebrow}</div>
      </div>
      <div
        className={`${styles.dlgBody} ${cast?.acrossRoom || inspect ? styles.dlgItalic : ''}`}
        aria-label={line}
      >
        {tw.shown}
      </div>
      {tw.done && offer && <RecruitSummary state={state} coworkerId={offer} />}
      {tw.done && choices ? (
        <div className={styles.choices} onClick={(e) => e.stopPropagation()}>
          {choices.map((c, i) => (
            <Button
              key={c.id}
              variant={c.safe ? 'secondary' : 'primary'}
              autoFocus={i === 0}
              onClick={() => {
                if (c.safe) SFX.menuBack()
                else SFX.menuConfirm()
                act({ type: 'CHOOSE', choice: c.id })
              }}
            >
              {c.label}
            </Button>
          ))}
        </div>
      ) : (
        tw.done && (
          <span className={styles.caret} aria-hidden>
            ▾
          </span>
        )
      )}
    </div>
  )
}

/* ─── stakes ────────────────────────────────────────────── */

function Stakes({
  state,
  act,
  encounterId,
}: {
  state: OfficeState
  act: Act
  encounterId: string
}) {
  const enc = OFFICE_ENCOUNTERS[encounterId as keyof typeof OFFICE_ENCOUNTERS]
  const letters = lettersHeld(state)
  const cast =
    encounterId === 'enc_desk_challenger'
      ? NPC_CAST.npc_desk_challenger
      : encounterId === 'enc_meeting_prepper'
        ? NPC_CAST.npc_meeting_prepper
        : encounterId === 'enc_help_desk_intern'
          ? NPC_CAST.npc_help_desk_intern
          : encounterId === 'enc_auditor'
            ? NPC_CAST.npc_auditor
            : encounterId === 'enc_director_review'
              ? NPC_CAST.npc_director
              : encounterId === 'enc_vp_product'
                ? NPC_CAST.npc_vp_product
                : encounterId === 'enc_vp_sales'
                  ? NPC_CAST.npc_vp_sales
                  : encounterId === 'enc_ceo_review'
                    ? NPC_CAST.npc_ceo
                    : NPC_CAST.npc_supervisor
  const eyebrow = enc.boss
    ? encounterId === 'enc_director_review'
      ? 'Operations review · Rank 5 · Boss'
      : encounterId === 'enc_vp_product'
        ? 'Prioritization review · Rank 6 · Boss'
        : encounterId === 'enc_vp_sales'
          ? 'The Close · Rank 7 · Boss'
          : encounterId === 'enc_ceo_review'
            ? 'The Review · Rank 8 · Boss'
            : 'One-on-one · Rank 2 · Boss'
    : encounterId === 'enc_help_desk_intern'
      ? `Compliance · Rank ${enc.rank}`
      : encounterId === 'enc_auditor'
        ? `Audit · Rank ${enc.rank}`
        : encounterId === 'enc_meeting_prepper'
          ? `Spar · Rank ${enc.rank}`
          : `Challenge · Rank ${enc.rank}`
  const win: string[] = [`+${enc.xp} XP`, `+${enc.options} ${CURRENCY_ICON}`]
  if (encounterId === 'enc_supervisor_1on1') win.push('Access Badge', 'Promotion')
  if (encounterId === 'enc_director_review') win.push('Transfer approved', 'Promotion')
  if (encounterId === 'enc_vp_product') win.push('Product Badge', 'Promotion')
  if (encounterId === 'enc_vp_sales') win.push('Client Badge', 'Promotion')
  if (encounterId === 'enc_ceo_review') win.push('The nod', 'Promotion')
  const offer = enc.recruit ? (letters > 0 ? 'Offer eligible' : null) : null
  const yes =
    encounterId === 'enc_help_desk_intern'
      ? 'Begin training'
      : encounterId === 'enc_auditor'
        ? 'Open the books'
        : enc.boss
          ? 'Begin'
          : encounterId === 'enc_meeting_prepper'
            ? 'Spar'
            : 'Bring it'
  const no = encounterId === 'enc_meeting_prepper' ? 'Rain check' : 'Not now'
  return (
    <Scrim>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <div className={styles.nameRow}>
        <Headshot spriteId={cast.spriteId} size={48} ring={ringColorFor(cast.types, false)} />
        <div>
          <div className={styles.title} style={{ marginTop: 0 }}>
            {cast.name}
          </div>
          <div className={styles.sub}>{cast.role}</div>
        </div>
      </div>
      <div className={styles.kv}>
        <span className={styles.kvKey}>Win</span>
        <span className={styles.kvVal}>
          {win.join(' · ')}
          {offer && ` · ${offer}`}
          {enc.recruit && !offer && <span className={styles.dim}> · Offer letters: 0</span>}
        </span>
        <span className={styles.kvKey}>Lose</span>
        <span className={styles.kvVal}>
          {enc.boss ? 'Break room, walk back, try again.' : 'Break room, walk back. Nothing lost.'}
        </span>
      </div>
      {enc.eyebrow && <div className={styles.warnLine}>{enc.eyebrow}</div>}
      <div className={styles.teamRow}>
        <span className={styles.kvKey}>Team</span>
        <PartyChips state={state} size={44} />
        <span className={styles.wallet}>
          {CURRENCY_ICON} {state.run.stockOptions}
        </span>
      </div>
      <div className={styles.actions}>
        <Button
          variant="primary"
          autoFocus
          onClick={() => {
            SFX.menuConfirm()
            act({ type: 'CONFIRM_STAKES' })
          }}
        >
          {yes}
        </Button>
        {enc.declinable && (
          <Button
            variant="secondary"
            onClick={() => {
              SFX.menuBack()
              act({ type: 'DECLINE_STAKES' })
            }}
          >
            {no}
          </Button>
        )}
      </div>
    </Scrim>
  )
}

/* ─── confirm cards ─────────────────────────────────────── */

function Confirm({
  eyebrow,
  title,
  body,
  yes,
  no,
  onYes,
  onNo,
  children,
}: {
  eyebrow: string
  title: string
  body: string
  yes: string
  no?: string
  onYes: () => void
  onNo?: () => void
  children?: ReactNode
}) {
  return (
    <Scrim tight>
      <div className={styles.eyebrow}>{eyebrow}</div>
      <div className={styles.title}>{title}</div>
      <div className={styles.body}>{body}</div>
      {children}
      <div className={styles.actions}>
        <Button variant="primary" autoFocus onClick={onYes}>
          {yes}
        </Button>
        {no && onNo && (
          <Button variant="secondary" onClick={onNo}>
            {no}
          </Button>
        )}
      </div>
    </Scrim>
  )
}

/* ─── team panel ────────────────────────────────────────── */

function MemberRow({
  state,
  member,
  roster,
  act,
}: {
  state: OfficeState
  member: PartyMember
  roster?: boolean
  act?: Act
}) {
  const kit = kitFor(member)
  const eff = effectiveKit(state, member)
  const max = maxHpFor(state, member)
  const out = member.hp <= 0
  const lead = member.def.kind === 'lead'
  return (
    <div className={styles.memberRow}>
      <Headshot spriteId={memberSprite(member)} size={64} ring={memberRing(member)} out={out} />
      <div style={{ minWidth: 0 }}>
        <div className={styles.memberName}>
          {lead ? 'You' : memberName(member)}
          {lead ? <span className={styles.leadChip}>LEAD</span> : null}
        </div>
        <div className={styles.memberRole}>{memberRole(member)}</div>
        <div className={styles.hpRow}>
          <span className={styles.hpTrack}>
            <span
              className={`${styles.hpFill} ${styles[hpTone(member.hp, max)]}`}
              style={{ width: `${Math.max(0, Math.min(100, (member.hp / max) * 100))}%` }}
            />
          </span>
          <span className={styles.hpNums}>
            {member.hp} / {max}
          </span>
        </div>
        <div className={styles.pp}>
          {eff.moves.map((mv, i) => (
            <div key={mv.name} className={styles.ppItem}>
              <div className={styles.ppLabel}>
                <span>{mv.name}</span>
                <span>
                  {member.pp[i] ?? 0}/{kit.moves[i]?.pp ?? mv.pp}
                </span>
              </div>
              <span className={styles.ppTrack}>
                <span
                  className={styles.ppFill}
                  style={{
                    width: `${Math.max(0, Math.min(100, ((member.pp[i] ?? 0) / (kit.moves[i]?.pp || 1)) * 100))}%`,
                  }}
                />
              </span>
            </div>
          ))}
        </div>
        <div className={styles.badges}>
          {kit.types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
        {out && <div className={styles.statusLine}>Out. Take five in the break room.</div>}
        {roster && !lead && member.def.kind === 'coworker' && act && (
          <Button
            variant="secondary"
            onClick={() => {
              SFX.menuBack()
              act({ type: 'DISMISS_MEMBER', slot: state.party.indexOf(member) })
            }}
          >
            Send to desk
          </Button>
        )}
      </div>
    </div>
  )
}

function openSeatLine(state: OfficeState): string {
  const hired = state.hired ?? []
  const benched = hired.filter(
    (id) => !state.party.some((m) => m.def.kind === 'coworker' && m.def.id === id),
  )
  if (benched.length > 0) {
    const id = benched[0]
    const desk = COWORKER_DESK[id]
    return `Open seat · ${COWORKER_NAME[id]} is at ${desk.pronoun} desk (Floor ${floorNumber(desk.floorId)})`
  }
  const recruitables = (
    ['cw_desk_challenger', 'cw_meeting_prepper', 'cw_help_desk_intern'] as CoworkerId[]
  ).filter((id) => !hired.includes(id))
  if (recruitables.length === 0) return 'Team is fully staffed.'
  if (lettersHeld(state) > 0) return 'Beat a coworker, hand them an Offer Letter.'
  return 'Out of letters. HR prints two per quarter.'
}

function TeamPanel({ state, act }: { state: OfficeState; act: Act }) {
  const bag = state.run.inventory.length
  return (
    <div className={styles.teamPanel} role="dialog" aria-label="Team">
      <div className={styles.teamHead}>
        <div className={styles.eyebrow}>Team · {floorLabel(state.floorId)}</div>
        <button
          type="button"
          className={styles.close}
          onClick={() => {
            SFX.menuBack()
            act({ type: 'CLOSE_TEAM' })
          }}
          aria-label="Close team panel"
        >
          ✕ Close
        </button>
      </div>
      <div className={styles.teamBody}>
        {state.party.map((m) => (
          <MemberRow
            key={m.slot}
            state={state}
            member={m}
            roster={state.overlay?.kind === 'team'}
            act={act}
          />
        ))}
        {Array.from({ length: Math.max(0, 3 - state.party.length) }, (_, i) => (
          <div key={`seat-${i}`} className={`${styles.memberRow} ${styles.memberRowEmpty}`}>
            <span className={styles.openSeat}>+</span>
            <div>
              <div className={`${styles.memberName} ${styles.dim}`}>Open seat</div>
              <div className={styles.memberRole}>{openSeatLine(state)}</div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles.teamFoot}>
        <div className={styles.sectionLabel} style={{ marginTop: 0, marginBottom: 6 }}>
          Team level
        </div>
        <XpBar xp={state.run.xp} xpToNext={state.run.xpToNext} level={state.run.level} />
        {state.run.perks.length > 0 ? (
          <div className={styles.perks}>
            {state.run.perks.map((id) => (
              <span key={id} className={styles.perkChip}>
                {PERKS[id]?.icon} {PERKS[id]?.name}
              </span>
            ))}
          </div>
        ) : (
          <div className={styles.teamFootLine}>
            <span className={styles.dim}>No perks yet — Holloway decides that.</span>
          </div>
        )}
        <div className={styles.teamFootLine}>
          <span>Offer Letters: {lettersHeld(state)} 📄</span>
          <span>
            Bag {bag}/4
            {bag > 0 && ` · ${state.run.inventory.map((id) => ITEMS[id].emoji).join(' ')}`}
          </span>
        </div>
      </div>
    </div>
  )
}

function ElevatorPanel({ state, act }: { state: OfficeState; act: Act }) {
  const here = state.floorId
  return (
    <Scrim tight>
      <div className={styles.eyebrow}>Elevator</div>
      <div className={styles.elevList} role="listbox" aria-label="Elevator floors">
        {ELEVATOR_FLOORS.map((row) => {
          const current = row.id === here
          const climbHere =
            row.id === 'floor_05' && current && state.flags.includes('flag_floor5_complete')
          const open = (!current && canRideTo(row.id, state.keyItems)) || climbHere
          const sub = climbHere
            ? 'The climb'
            : current
              ? 'You are here'
              : !open
                ? row.requires === 'key_employee_badge'
                  ? 'Badge required'
                  : 'Access badge required'
                : row.id === 'floor_01'
                  ? deskRosterLine(state.hired ?? [], state.party, 'floor_01')
                  : ''
          return (
            <button
              key={row.id}
              type="button"
              role="option"
              aria-selected={current}
              disabled={current && !climbHere}
              className={`${styles.elevRow} ${current ? styles.elevHere : ''} ${!open && !current ? styles.elevLocked : ''}`}
              onClick={() => {
                if (current && !climbHere) return
                if (!open) SFX.menuBack()
                else SFX.menuConfirm()
                act({ type: 'CHOOSE', choice: row.id })
              }}
            >
              <span className={styles.elevNum}>{row.number}</span>
              <span className={styles.elevName}>{row.name}</span>
              <span className={styles.elevSub}>{sub}</span>
              <span
                className={`${styles.elevLed} ${open || current ? styles.elevLedOn : styles.elevLedOff}`}
                aria-hidden
              />
            </button>
          )
        })}
      </div>
      <div className={`${styles.actions} ${styles.actionsEnd}`}>
        <Button
          variant="secondary"
          onClick={() => {
            SFX.menuBack()
            act({ type: 'CHOOSE', choice: 'stay' })
          }}
        >
          Stay
        </Button>
      </div>
    </Scrim>
  )
}

/* ─── toast ─────────────────────────────────────────────── */

function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  const cb = useRef(onDone)
  useEffect(() => {
    cb.current = onDone
  })
  useEffect(() => {
    const t = window.setTimeout(() => cb.current(), 1800)
    return () => window.clearTimeout(t)
  }, [text])
  return (
    <div className={styles.toast} role="status" onClick={onDone}>
      {text}
    </div>
  )
}

/* ─── main ──────────────────────────────────────────────── */

/** Overlays that live over the map region: dialogue, cards, panel, toast. */
export default function OfficeOverlays({
  state,
  onChange,
  textMsPerChar = 17,
  reduceMotion = false,
}: OverlayProps) {
  const act = useAct(state, onChange)
  const ov = state.overlay
  if (!ov) return null

  if (ov.kind === 'toast') {
    return (
      <div className={styles.layer}>
        <Toast text={ov.text} onDone={() => act({ type: 'ADVANCE' })} />
      </div>
    )
  }

  if (ov.kind === 'dialogue') {
    return (
      <div className={styles.layer}>
        <Dialogue
          key={`${ov.nodeId}:${ov.line}`}
          state={state}
          act={act}
          nodeId={ov.nodeId}
          lineIdx={ov.line}
          msPerChar={textMsPerChar}
        />
      </div>
    )
  }

  if (ov.kind === 'receipt') {
    return (
      <div className={styles.layer}>
        <Receipt
          receiptId={ov.receiptId}
          state={state}
          reduceMotion={reduceMotion}
          onFile={() => {
            SFX.menuConfirm()
            act({ type: 'ACK_RECEIPT' })
          }}
        />
      </div>
    )
  }

  if (ov.kind === 'stakes') {
    return (
      <div className={styles.layer}>
        <Stakes state={state} act={act} encounterId={ov.encounterId} />
      </div>
    )
  }

  if (ov.kind === 'recruit') {
    return (
      <div className={styles.layer}>
        <Scrim>
          <div className={styles.eyebrow}>Extend an offer</div>
          <RecruitSummary state={state} coworkerId={ov.coworkerId} />
          <div className={styles.actions}>
            {partyHasRoom(state) ? (
              <Button
                variant="primary"
                autoFocus
                onClick={() => {
                  SFX.menuConfirm()
                  act({ type: 'EXTEND_OFFER' })
                }}
              >
                Extend the offer
              </Button>
            ) : (
              <Button
                variant="primary"
                autoFocus
                onClick={() => {
                  SFX.menuConfirm()
                  act({ type: 'MAKE_ROOM' })
                }}
              >
                Make room
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                SFX.menuBack()
                act({ type: 'DECLINE_OFFER' })
              }}
            >
              Not yet
            </Button>
          </div>
        </Scrim>
      </div>
    )
  }

  if (ov.kind === 'document') {
    const agenda = ov.docId === 'agenda'
    const lines = agenda ? AGENDA_TEXT : FLOOR_DIRECTORY_TEXT[state.floorId]
    return (
      <div className={styles.layer}>
        <div className={styles.scrim} role="dialog" aria-modal="true">
          <div className={`${styles.card} ${styles.cardTight} ${styles.paper}`}>
            <span className={styles.clip} aria-hidden />
            <div className={`${styles.eyebrow} ${styles.paperTitle}`}>
              {agenda
                ? 'Meeting room · Agenda'
                : state.floorId === 'floor_01'
                  ? 'Reception · Directory'
                  : state.floorId === 'floor_02'
                    ? 'Landing · Directory'
                    : `${floorLabel(state.floorId)} · Directory`}
            </div>
            <div className={`${styles.title} ${styles.paperTitle}`}>
              {agenda ? 'Agenda' : 'Directory'}
            </div>
            {lines.map((l) => (
              <div key={l} className={styles.paperLine}>
                {agenda ? <Emphasize text={l} phrase="Q3 summary" /> : l}
              </div>
            ))}
            <div className={`${styles.actions} ${styles.actionsEnd}`}>
              <Button
                variant="secondary"
                autoFocus
                onClick={() => {
                  SFX.menuBack()
                  act({ type: 'ADVANCE' })
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (ov.kind === 'confirm') {
    if (ov.prompt === 'take_five') {
      return (
        <div className={styles.layer}>
          <Confirm
            eyebrow="Break room · Coffee counter"
            title="Take five"
            body="Restores HP and PP for the whole team. Free. Always."
            yes="Take five"
            no="Not now"
            onYes={() => act({ type: 'TAKE_FIVE' })}
            onNo={() => {
              SFX.menuBack()
              act({ type: 'CLOSE_OVERLAY' })
            }}
          />
        </div>
      )
    }
    if (ov.prompt === 'kessler_door') {
      if (state.party.every((m) => m.hp <= 0)) {
        return (
          <div className={styles.layer}>
            <Confirm
              eyebrow="Director's office"
              title="Operations review"
              body="Your team needs a minute. Facilities first."
              yes="Back"
              onYes={() => {
                SFX.menuBack()
                act({ type: 'DOOR_STEP_BACK' })
              }}
            />
          </div>
        )
      }
      return (
        <div className={styles.layer}>
          <Confirm
            eyebrow="Director's office"
            title="Operations review"
            body={
              state.party.length >= 2
                ? "Kessler's review starts when you step in. He doesn't do one-on-ones — bring everyone."
                : "He doesn't do one-on-ones. Your coworkers are at their desks; they'll come."
            }
            yes="Step in"
            no="Not yet"
            onYes={() => {
              SFX.menuConfirm()
              act({ type: 'DOOR_STEP_IN' })
            }}
            onNo={() => {
              SFX.menuBack()
              act({ type: 'DOOR_STEP_BACK' })
            }}
          >
            <div className={styles.teamRow}>
              <span className={styles.kvKey}>Team</span>
              <PartyChips state={state} size={44} />
              <span className={styles.wallet}>
                {CURRENCY_ICON} {state.run.stockOptions}
              </span>
            </div>
          </Confirm>
        </div>
      )
    }
    if (ov.prompt === 'door') {
      if (state.party.every((m) => m.hp <= 0)) {
        return (
          <div className={styles.layer}>
            <Confirm
              eyebrow="Glass door"
              title="Elevator lobby"
              body="Your team needs a minute. Break room first."
              yes="Back"
              onYes={() => {
                SFX.menuBack()
                act({ type: 'DOOR_STEP_BACK' })
              }}
            />
          </div>
        )
      }
      return (
        <div className={styles.layer}>
          <Confirm
            eyebrow="Glass door · Last exit"
            title="Elevator lobby"
            body="Holloway's one-on-one starts when you step in. It doesn't stop."
            yes="Step in"
            no="Not yet"
            onYes={() => {
              SFX.menuConfirm()
              act({ type: 'DOOR_STEP_IN' })
            }}
            onNo={() => {
              SFX.menuBack()
              act({ type: 'DOOR_STEP_BACK' })
            }}
          >
            <div className={styles.teamRow}>
              <span className={styles.kvKey}>Team</span>
              <PartyChips state={state} size={44} />
              <span className={styles.wallet}>
                {CURRENCY_ICON} {state.run.stockOptions}
              </span>
            </div>
          </Confirm>
        </div>
      )
    }
    return null
  }

  if (ov.kind === 'celebration') {
    const climb = ov.screen === 'screen_floor5_complete'
    return (
      <div className={styles.layer}>
        <div className={`premium-screen ${styles.celebration}`}>
          <div className={styles.celebTitle}>{climb ? 'THE CLIMB' : 'FLOOR CLEAR'}</div>
          <div className={styles.celebLine}>
            {climb
              ? 'Caldwell nods once. The nod is the offer. There is no letter. There is no Floor 6.'
              : 'The badge is laminated. The elevator still goes up.'}
          </div>
          <div className={`${styles.body} ${styles.dim}`} style={{ textAlign: 'center' }}>
            {climb
              ? 'The elevator still goes down. That is the whole building.'
              : floorLabel(state.floorId)}
          </div>
          <div className={styles.actions} style={{ width: 'min(320px, 100%)' }}>
            <Button
              variant="primary"
              autoFocus
              onClick={() => {
                SFX.menuConfirm()
                act({ type: 'CHOOSE', choice: 'continue' })
              }}
            >
              {climb ? 'The elevator still goes down' : 'Continue'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (ov.kind === 'elevator_panel') {
    return (
      <div className={styles.layer}>
        <ElevatorPanel state={state} act={act} />
      </div>
    )
  }

  if (ov.kind === 'handout') {
    return (
      <div className={styles.layer}>
        <Scrim tight>
          <div className={styles.eyebrow}>Meeting room · Handout rack</div>
          <div className={styles.title}>Pick a handout</div>
          <div className={styles.body}>Three stacks. Two are wrong. Match the agenda.</div>
          <div className={styles.handoutList}>
            {HANDOUT_CHOICES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                className={styles.handout}
                autoFocus={i === 0}
                onClick={() => {
                  SFX.menuConfirm()
                  act({ type: 'PICK_HANDOUT', itemId: c.id })
                }}
              >
                <span
                  className={`${styles.handoutIcon} ${
                    c.id === 'key_handout_q3_deck'
                      ? styles.handoutThick
                      : c.id === 'key_handout_q2_summary'
                        ? styles.handoutOld
                        : ''
                  }`}
                  aria-hidden
                />
                {c.label}
              </button>
            ))}
          </div>
        </Scrim>
      </div>
    )
  }

  if (ov.kind === 'team') {
    return (
      <div className={styles.layer}>
        <TeamPanel state={state} act={act} />
      </div>
    )
  }

  return null
}

function Emphasize({ text, phrase }: { text: string; phrase: string }) {
  const idx = text.indexOf(phrase)
  if (idx < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <span className={styles.strong}>{phrase}</span>
      {text.slice(idx + phrase.length)}
    </>
  )
}

/* ─── screen-level overlays ─────────────────────────────── */

/** "Your team needs a minute." — full-frame after a party wipe. */
export function Interstitial({ state, onChange }: OverlayProps) {
  const act = useAct(state, onChange)
  const ov = state.overlay
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 1200)
    return () => window.clearTimeout(t)
  }, [])
  const advance = useRef(() => {})
  useEffect(() => {
    advance.current = () => {
      if (ready) act({ type: 'ADVANCE' })
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.key === ' ') {
        e.preventDefault()
        advance.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  if (ov?.kind !== 'interstitial') return null
  const enc = OFFICE_ENCOUNTERS[ov.encounterId]
  const lostNode = DIALOGUE[lossDialogue(ov.encounterId)]
  return (
    <div
      className={styles.interstitial}
      role="dialog"
      aria-live="assertive"
      onClick={() => advance.current()}
    >
      <div className={`${styles.eyebrow} ${styles.eyebrowDanger}`}>Time out</div>
      <div className={`${styles.title} ${styles.titleLg}`}>Your team needs a minute.</div>
      <div className={styles.interQuote}>
        “{lostNode.lines[0]}” — {enc.name}
      </div>
      <div className={styles.tapHint} style={{ opacity: ready ? 1 : 0 }}>
        tap to continue
      </div>
    </div>
  )
}

/** Full-screen elevator transfer between campaign floors. */
export function ElevatorRide({ state, onChange, reduceMotion = false }: OverlayProps) {
  const act = useAct(state, onChange)
  const destination = state.rideTo ?? state.floorId
  const goingUp = floorNumber(destination) > floorNumber(state.floorId)
  const heading = floorLabel(destination)
  useEffect(() => {
    const t = window.setTimeout(
      () => act({ type: 'COMPLETE_ELEVATOR_RIDE' }),
      reduceMotion ? 120 : 950,
    )
    return () => window.clearTimeout(t)
  }, [act, reduceMotion, state.floorId])
  return (
    <div className={`premium-screen ${styles.celebration}`}>
      <div className={styles.celebTitle}>ELEVATOR</div>
      <div className={styles.celebLine}>
        {goingUp
          ? `Doors close, the old fluorescent hum shifts pitch, and ${heading} lights up.`
          : `Doors close, one floor clicks by, and ${heading} comes back into view.`}
      </div>
      <div className={`${styles.body} ${styles.dim}`} style={{ textAlign: 'center' }}>
        Arriving at <b>{heading}</b>.
      </div>
      <div className={styles.actions} style={{ width: 'min(320px, 100%)' }}>
        <Button
          variant="primary"
          autoFocus
          onClick={() => {
            SFX.menuConfirm()
            act({ type: 'COMPLETE_ELEVATOR_RIDE' })
          }}
        >
          Arrive · {heading}
        </Button>
      </div>
    </div>
  )
}

/** Gold-bordered callout that dies on the action it teaches. */
export function CoachMark({
  id,
  onDismiss,
  className,
  pointer = 'down',
}: {
  id: 'coach_move' | 'coach_interact' | 'coach_switch' | 'coach_roster'
  onDismiss: () => void
  className?: string
  pointer?: 'up' | 'down'
}) {
  const copy =
    id === 'coach_move' ? (
      <>
        <span className={styles.coachKey}>MOVE</span> — arrows, WASD, or the pad. Renata is
        watching.
      </>
    ) : id === 'coach_interact' ? (
      <>
        <span className={styles.coachKey}>TALK</span> — press E or tap ACT when someone's in front
        of you.
      </>
    ) : id === 'coach_roster' ? (
      <>
        <span className={styles.coachKey}>TEAM</span> — three seats. Sending someone to their desk
        is free. So is bringing them back.
      </>
    ) : (
      <>
        <span className={styles.coachKey}>SWITCH</span> — send in the next person. It costs your
        turn; they take the next hit.
      </>
    )
  return (
    <div
      className={[styles.coach, pointer === 'down' ? styles.coachDown : styles.coachUp, className]
        .filter(Boolean)
        .join(' ')}
      role="status"
      onClick={onDismiss}
    >
      {copy}
    </div>
  )
}
