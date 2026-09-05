import type { ReactNode } from 'react'
import { CURRENCY_ICON, ITEMS, PERKS } from '@/data'
import {
  AGENDA_TEXT,
  DIALOGUE,
  DIRECTORY_TEXT,
  HANDOUT_CHOICES,
  OFFICE_ENCOUNTERS,
  RECEIPTS,
  SPEAKER_SPRITE,
  ledgerOptionsEarned,
  type DialogueId,
} from '@/content/office'
import {
  dispatchOfficeAction,
  inspectText,
  keyCount,
  lettersHeld,
  maxHpFor,
  memberName,
  type OfficeState,
} from '@/engine/office'
import { Button, Panel } from '@/ui'
import { getSpriteUrls } from '@/components/PixelSprite'

function Banner({
  children,
  onClick,
  role,
}: {
  children: ReactNode
  onClick: () => void
  role?: string
}) {
  return (
    <button
      type="button"
      role={role}
      onClick={onClick}
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        top: 72,
        zIndex: 8,
        padding: '10px 12px',
        border: '1px solid var(--cc-gold)',
        borderRadius: 8,
        background: 'rgba(5,7,13,.92)',
        color: 'var(--paper)',
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        textAlign: 'left',
      }}
    >
      {children}
    </button>
  )
}

export default function OfficeOverlays({
  state,
  onChange,
}: {
  state: OfficeState
  onChange: (next: OfficeState) => void
}) {
  const act = (type: Parameters<typeof dispatchOfficeAction>[1]) => {
    onChange(dispatchOfficeAction(state, type).state)
  }
  const ov = state.overlay
  if (!ov) return null

  if (ov.kind === 'toast') {
    return (
      <Banner onClick={() => act({ type: 'ADVANCE' })} role="status">
        {ov.text}
      </Banner>
    )
  }
  if (ov.kind === 'coach') {
    const copy =
      ov.id === 'coach_move'
        ? 'Arrows or WASD to move'
        : ov.id === 'coach_interact'
          ? 'Press E or tap ACT to talk'
          : 'SWITCH — send in the next person. They get one free swing at whoever walks in.'
    return (
      <Banner onClick={() => act({ type: 'ADVANCE' })} role="status">
        {copy}
      </Banner>
    )
  }
  if (ov.kind === 'dialogue') {
    const inspect = inspectText(ov.nodeId)
    const node = DIALOGUE[ov.nodeId as DialogueId]
    const line = inspect ?? node?.lines[ov.line] ?? ''
    const extras =
      ov.nodeId === 'dlg_holloway_1on1' && state.party.length >= 2 && ov.line === 1
        ? ' You brought people. Good. I talk for a living; take turns.'
        : ''
    const sprites = getSpriteUrls()
    const sprite = node?.speaker ? sprites[SPEAKER_SPRITE[node.speaker]] : null
    return (
      <Panel
        style={{ position: 'absolute', left: 12, right: 12, bottom: 118, zIndex: 8, padding: 12 }}
      >
        {sprite && (
          <img
            src={sprite}
            alt=""
            style={{ width: 40, height: 40, objectFit: 'cover', float: 'left', marginRight: 8 }}
          />
        )}
        <div
          className="t-display"
          style={{ fontSize: 11, color: 'var(--cc-gold)', letterSpacing: 1 }}
        >
          {node?.name || 'INSPECT'}
        </div>
        <div className="t-body" style={{ fontSize: 14, color: 'var(--paper)', minHeight: 40 }}>
          {line}
          {extras}
        </div>
        {node?.choices && ov.line >= node.lines.length - 1 ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
            {node.choices.map((c) => (
              <Button
                key={c.id}
                variant={c.safe ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => act({ type: 'CHOOSE', choice: c.id })}
              >
                {c.label}
              </Button>
            ))}
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => act({ type: 'ADVANCE' })}>
            Continue
          </Button>
        )}
      </Panel>
    )
  }
  if (ov.kind === 'receipt') {
    const rec = RECEIPTS[ov.receiptId]
    return (
      <Panel style={{ position: 'absolute', inset: 80, zIndex: 9, padding: 16 }}>
        <div className="t-display" style={{ fontSize: 16, color: 'var(--cc-gold)' }}>
          {rec.title}
        </div>
        {rec.lines.map((l) => (
          <div key={l.text} className="t-body" style={{ marginTop: 8, color: 'var(--paper)' }}>
            {l.text}
          </div>
        ))}
        <Button style={{ marginTop: 16 }} onClick={() => act({ type: 'ACK_RECEIPT' })}>
          File it
        </Button>
      </Panel>
    )
  }
  if (ov.kind === 'stakes') {
    const enc = OFFICE_ENCOUNTERS[ov.encounterId]
    const letters = lettersHeld(state)
    const offer =
      enc.recruit && letters > 0 ? 'Offer eligible' : enc.recruit ? 'Offer letters: 0' : null
    return (
      <Panel style={{ position: 'absolute', inset: 48, zIndex: 9, padding: 14 }}>
        <div className="t-display" style={{ fontSize: 13, color: 'var(--cc-gold)' }}>
          {enc.boss ? 'ONE-ON-ONE · RANK 2 · BOSS' : `CHALLENGE · RANK ${enc.rank}`}
        </div>
        <div className="t-body" style={{ color: 'var(--paper)', margin: '8px 0' }}>
          {enc.name} — {enc.title.replace('THE ', '')}
        </div>
        <div>
          WIN +{enc.xp} XP · +{enc.options} {CURRENCY_ICON} {offer ? `· ${offer}` : ''}
        </div>
        <div>LOSE Break room, walk back. Nothing lost.</div>
        {enc.eyebrow && <div style={{ color: 'var(--cc-warn, #ff8a80)' }}>{enc.eyebrow}</div>}
        <PartyRow state={state} />
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => act({ type: 'CONFIRM_STAKES' })}>
            {enc.boss ? 'Begin' : ov.encounterId === 'enc_meeting_prepper' ? 'Spar' : 'Bring it'}
          </Button>
          {enc.declinable && (
            <Button variant="secondary" onClick={() => act({ type: 'DECLINE_STAKES' })}>
              {ov.encounterId === 'enc_meeting_prepper' ? 'Rain check' : 'Not now'}
            </Button>
          )}
        </div>
      </Panel>
    )
  }
  if (ov.kind === 'recruit') {
    const name = ov.coworkerId === 'cw_desk_challenger' ? 'Gavin' : 'Priya'
    return (
      <Panel style={{ position: 'absolute', inset: 72, zIndex: 9, padding: 14 }}>
        <div className="t-display" style={{ color: 'var(--cc-gold)' }}>
          OFFER LETTER
        </div>
        <div className="t-body" style={{ margin: '8px 0' }}>
          Extend a pre-signed offer to {name}? Letters left: {lettersHeld(state)}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="primary" onClick={() => act({ type: 'EXTEND_OFFER' })}>
            Extend the offer
          </Button>
          <Button variant="secondary" onClick={() => act({ type: 'DECLINE_OFFER' })}>
            Not yet
          </Button>
        </div>
      </Panel>
    )
  }
  if (ov.kind === 'document') {
    const lines = ov.docId === 'agenda' ? AGENDA_TEXT : DIRECTORY_TEXT
    return (
      <Panel style={{ position: 'absolute', inset: 64, zIndex: 9, padding: 14 }}>
        {lines.map((l) => (
          <div key={l} className="t-body" style={{ marginBottom: 8, color: 'var(--paper)' }}>
            {l}
          </div>
        ))}
        <Button onClick={() => act({ type: 'ADVANCE' })}>Close</Button>
      </Panel>
    )
  }
  if (ov.kind === 'confirm') {
    if (ov.prompt === 'take_five') {
      return (
        <Confirm
          title="TAKE FIVE"
          body="Restores HP and PP for the whole team. Free. Always."
          yes="Take five"
          no="Not now"
          onYes={() => act({ type: 'TAKE_FIVE' })}
          onNo={() => act({ type: 'CLOSE_OVERLAY' })}
        />
      )
    }
    if (ov.prompt === 'door') {
      if (state.party.every((m) => m.hp <= 0)) {
        return (
          <Confirm
            title="ELEVATOR LOBBY"
            body="Your team needs a minute. Break room first."
            yes="Back"
            onYes={() => act({ type: 'DOOR_STEP_BACK' })}
          />
        )
      }
      return (
        <div>
          <Confirm
            title="ELEVATOR LOBBY"
            body="Holloway's one-on-one starts when you step in. It doesn't stop."
            yes="Step in"
            no="Not yet"
            onYes={() => act({ type: 'DOOR_STEP_IN' })}
            onNo={() => act({ type: 'DOOR_STEP_BACK' })}
          >
            <PartyRow state={state} />
          </Confirm>
        </div>
      )
    }
    return (
      <Confirm
        title="FLOOR 2"
        body="The reader blinks green."
        yes="Ride up"
        no="Not yet"
        onYes={() => act({ type: 'RIDE_ELEVATOR' })}
        onNo={() => act({ type: 'CLOSE_OVERLAY' })}
      />
    )
  }
  if (ov.kind === 'handout') {
    return (
      <Panel style={{ position: 'absolute', inset: 56, zIndex: 9, padding: 14 }}>
        <div className="t-display" style={{ color: 'var(--cc-gold)', marginBottom: 8 }}>
          HANDOUT RACK
        </div>
        {HANDOUT_CHOICES.map((c) => (
          <Button
            key={c.id}
            size="sm"
            style={{ display: 'block', width: '100%', marginBottom: 8 }}
            onClick={() => act({ type: 'PICK_HANDOUT', itemId: c.id })}
          >
            {c.label}
          </Button>
        ))}
      </Panel>
    )
  }
  if (ov.kind === 'team') {
    return (
      <Panel style={{ position: 'absolute', inset: 40, zIndex: 9, padding: 14, overflow: 'auto' }}>
        <div className="t-display" style={{ color: 'var(--cc-gold)' }}>
          TEAM
        </div>
        {state.party.map((m) => (
          <div key={m.slot} style={{ marginTop: 10 }}>
            <strong>{m.def.kind === 'lead' ? 'YOU' : memberName(m)}</strong> {m.hp}/
            {maxHpFor(state, m)}
            {m.hp <= 0 ? ' — Out. Take five in the break room.' : ''}
          </div>
        ))}
        {state.party.length < 3 && (
          <div className="t-body" style={{ marginTop: 8, color: 'var(--cc-text-dim)' }}>
            Empty seat. Beat someone and hand them an Offer Letter.
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          Letters {lettersHeld(state)} · {CURRENCY_ICON} {state.run.stockOptions}
        </div>
        {state.run.perks.length > 0 && (
          <div style={{ marginTop: 8 }}>
            {state.run.perks.map((id) => (
              <span key={id} style={{ marginRight: 8 }}>
                {PERKS[id]?.icon} {PERKS[id]?.name}
              </span>
            ))}
          </div>
        )}
        <Button style={{ marginTop: 12 }} onClick={() => act({ type: 'CLOSE_TEAM' })}>
          Close
        </Button>
      </Panel>
    )
  }
  if (ov.kind === 'interstitial') {
    return (
      <Panel
        style={{ position: 'absolute', inset: 90, zIndex: 9, padding: 16, textAlign: 'center' }}
      >
        <div className="t-display">Your team needs a minute.</div>
        <Button style={{ marginTop: 12 }} onClick={() => act({ type: 'ADVANCE' })}>
          Continue
        </Button>
      </Panel>
    )
  }
  if (ov.kind === 'celebration') {
    return (
      <Panel style={{ position: 'absolute', inset: 40, zIndex: 9, padding: 16 }}>
        <div className="t-display" style={{ fontSize: 22, color: 'var(--cc-gold)' }}>
          FLOOR 1 CLEARED
        </div>
        <div className="t-body" style={{ marginTop: 10 }}>
          Team {state.party.length} · Switches {state.stats.switches} · Options earned{' '}
          {ledgerOptionsEarned(state.rewardsClaimed)} {CURRENCY_ICON}
        </div>
        <Button style={{ marginTop: 16 }} onClick={() => act({ type: 'RETURN_FROM_PREVIEW' })}>
          Back to Floor 1
        </Button>
      </Panel>
    )
  }
  return null
}

function PartyRow({ state }: { state: OfficeState }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      {state.party.map((m) => (
        <span key={m.slot}>
          ●{m.def.kind === 'lead' ? 'YOU' : memberName(m).toUpperCase()} {m.hp}/{maxHpFor(state, m)}
        </span>
      ))}
      {state.party.length < 3 && <span>—</span>}
      <span>
        {CURRENCY_ICON} {state.run.stockOptions}
      </span>
    </div>
  )
}

function Confirm({
  title,
  body,
  yes,
  no,
  onYes,
  onNo,
  children,
}: {
  title: string
  body: string
  yes: string
  no?: string
  onYes: () => void
  onNo?: () => void
  children?: ReactNode
}) {
  return (
    <Panel style={{ position: 'absolute', inset: 64, zIndex: 9, padding: 14 }}>
      <div className="t-display" style={{ color: 'var(--cc-gold)' }}>
        {title}
      </div>
      <div className="t-body" style={{ margin: '8px 0' }}>
        {body}
      </div>
      {children}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <Button variant="primary" onClick={onYes}>
          {yes}
        </Button>
        {no && onNo && (
          <Button variant="secondary" onClick={onNo}>
            {no}
          </Button>
        )}
      </div>
    </Panel>
  )
}

export function WalletChip({ state }: { state: OfficeState }) {
  const letters = lettersHeld(state)
  return (
    <div className="t-body" style={{ display: 'flex', gap: 10, fontSize: 12 }}>
      <span>
        {CURRENCY_ICON} {state.run.stockOptions} OPT
      </span>
      {letters > 0 && <span>📄 {letters}</span>}
      {keyCount(state, 'key_toner') > 0 && <span>Toner</span>}
      {keyCount(state, 'key_access_badge') > 0 && <span>🪪</span>}
      {state.run.inventory.map((id, i) => (
        <span key={`${id}-${i}`}>{ITEMS[id].emoji}</span>
      ))}
    </div>
  )
}
