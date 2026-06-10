import { useState, useEffect } from 'react'
import type { HallwayEvent } from '../types'
import { SFX } from '../sfx'
import { Button, Panel } from '../ui'

export default function HallwayEventScreen({
  event,
  onChoose,
  onContinue,
  playerHp,
  playerMaxHp,
}: {
  event: HallwayEvent
  /** Applies the choice immediately; returns the bonus item name, if any. */
  onChoose: (choiceIdx: number) => { itemGained: string | null }
  onContinue: () => void
  playerHp: number
  playerMaxHp: number
}) {
  const [chosen, setChosen] = useState<number | null>(null)
  const [itemGained, setItemGained] = useState<string | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    SFX.eventNeutral()
    setTimeout(() => setShow(true), 200)
  }, [])

  const handleChoice = (idx: number) => {
    if (chosen !== null) return
    setItemGained(onChoose(idx).itemGained)
    setChosen(idx)
    const choice = event.choices[idx]
    if (choice.isGood) SFX.eventGood()
    else SFX.eventBad()
  }

  const choice = chosen !== null ? event.choices[chosen] : null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 16,
        padding: 24,
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      }}
    >
      <div
        className="t-display"
        style={{
          position: 'absolute',
          top: 12,
          right: 16,
          fontSize: 'var(--display-2xs)',
          color: 'var(--green)',
          background: 'rgba(0,0,0,0.4)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        HP {playerHp}/{playerMaxHp}
      </div>

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-xs)',
          color: 'var(--gold-bright)',
          letterSpacing: 3,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        {event.title}
      </div>

      <div
        style={{
          fontSize: 56,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s',
        }}
      >
        {event.emoji}
      </div>

      <div
        className="t-body"
        style={{
          fontSize: 'var(--body-lg)',
          color: 'var(--muted-light)',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: 320,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.6s ease 0.3s',
        }}
      >
        {event.desc}
      </div>

      {chosen === null ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '100%',
            maxWidth: 320,
            opacity: show ? 1 : 0,
            transition: 'opacity 0.6s ease 0.5s',
          }}
        >
          {event.choices.map((c, i) => (
            <Button
              key={i}
              variant="paper"
              size="md"
              onClick={() => handleChoice(i)}
              style={{ width: '100%', textAlign: 'left' }}
            >
              {c.label}
            </Button>
          ))}
        </div>
      ) : (
        choice && (
          <Panel
            variant="glass"
            style={{
              maxWidth: 320,
              textAlign: 'center',
              animation: 'fade-in 0.4s ease',
            }}
          >
            <div
              className="t-body"
              style={{
                fontSize: 'var(--body-lg)',
                color: 'var(--paper)',
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              {choice.result}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              {choice.effect.hp && (
                <span
                  className="t-display"
                  style={{
                    fontSize: 'var(--display-2xs)',
                    color: choice.effect.hp > 0 ? 'var(--green)' : 'var(--red)',
                  }}
                >
                  HP {choice.effect.hp > 0 ? '+' : ''}
                  {choice.effect.hp}
                </span>
              )}
              {choice.effect.atk && (
                <span
                  className="t-display"
                  style={{ fontSize: 'var(--display-2xs)', color: 'var(--orange)' }}
                >
                  ATK +{choice.effect.atk}
                </span>
              )}
              {choice.effect.def && (
                <span
                  className="t-display"
                  style={{
                    fontSize: 'var(--display-2xs)',
                    color: choice.effect.def > 0 ? 'var(--sky)' : 'var(--red)',
                  }}
                >
                  DEF {choice.effect.def > 0 ? '+' : ''}
                  {choice.effect.def}
                </span>
              )}
              {choice.effect.ppRestore && (
                <span
                  className="t-display"
                  style={{ fontSize: 'var(--display-2xs)', color: 'var(--purple)' }}
                >
                  PP +{choice.effect.ppRestore}
                </span>
              )}
              {itemGained && (
                <span
                  className="t-display"
                  style={{ fontSize: 'var(--display-2xs)', color: 'var(--gold-bright)' }}
                >
                  🎁 Found: {itemGained}!
                </span>
              )}
            </div>
            <Button variant="primary" size="md" onClick={onContinue} style={{ marginTop: 14 }}>
              CONTINUE &rarr;
            </Button>
          </Panel>
        )
      )}
    </div>
  )
}
