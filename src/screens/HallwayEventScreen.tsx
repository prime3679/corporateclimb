import { useState, useEffect } from 'react'
import type { HallwayEvent } from '@/types'
import { SFX } from '@/sfx'
import { Button, IconChip, Panel, getIconGlyph } from '@/ui'
import styles from './InterludeScreen.module.css'

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

  useEffect(() => {
    SFX.eventNeutral()
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
      className={`premium-screen ${styles.screen} ${styles.warm}`}
      style={{
        gap: 16,
        padding: '24px 24px 30px',
      }}
    >
      <div className={styles.board} />
      <div
        className="t-display"
        style={{
          position: 'absolute',
          top: 14,
          left: 20,
          fontSize: 'var(--display-2xs)',
          color: 'var(--green)',
          background: 'rgba(13,19,32,.74)',
          padding: '4px 10px',
          borderRadius: 'var(--radius-sm)',
          border: 'var(--border-w) solid rgba(66,211,146,.28)',
        }}
      >
        HP {playerHp}/{playerMaxHp}
      </div>

      <div className={styles.stage} style={{ gap: 20 }}>
        <div className={styles.headlineStack} style={{ gap: 14 }}>
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-xs)',
              color: 'var(--gold-bright)',
              letterSpacing: 3,
              textShadow: '2px 2px 0 #E65100',
            }}
          >
            {event.title}
          </div>
          <IconChip glyph={getIconGlyph(event.emoji, event.title)} tone="ember" size="lg" />
          <div
            className="t-body"
            style={{
              fontSize: 'var(--body-lg)',
              color: 'var(--muted-light)',
              textAlign: 'center',
              lineHeight: 1.22,
              maxWidth: 340,
            }}
          >
            {event.desc}
          </div>
        </div>

        {chosen === null ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              width: '100%',
              maxWidth: 328,
            }}
          >
            {event.choices.map((c, i) => (
              <Button
                key={i}
                variant="paper"
                size="md"
                onClick={() => handleChoice(i)}
                style={{
                  width: '100%',
                  minHeight: 62,
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,.05), transparent 24%), linear-gradient(180deg, rgba(39,27,18,.98), rgba(5,7,13,.94))',
                  color: 'var(--paper)',
                  borderColor: 'rgba(255,211,77,.24)',
                }}
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
                width: 'min(100%, 332px)',
                padding: '18px 18px 16px',
                textAlign: 'center',
              }}
            >
              <div
                className="t-body"
                style={{
                  fontSize: 'var(--body-lg)',
                  color: 'var(--paper)',
                  lineHeight: 1.2,
                  marginBottom: 12,
                }}
              >
                {choice.result}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
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
                    LOOT: {itemGained}!
                  </span>
                )}
              </div>
              <Button variant="primary" size="md" onClick={onContinue} style={{ marginTop: 16 }}>
                CONTINUE &rarr;
              </Button>
            </Panel>
          )
        )}
      </div>
    </div>
  )
}
