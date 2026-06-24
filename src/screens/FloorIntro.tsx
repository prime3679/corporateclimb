import { useState, useEffect } from 'react'
import type { Enemy, MysteryOutcome, PlayerClass } from '@/types'
import { TYPE_COLORS, TYPE_LABELS, TOTAL_FLOORS, getAct, getMysteryInfo } from '@/data'
import StagedSprite from '@/components/StagedSprite'

const FLOOR_LABELS: Record<number, string> = {
  // Act 1: Individual Contributor
  0: 'Lobby',
  1: 'Mailroom',
  2: 'Cubicle Farm',
  3: 'Open Office',
  4: 'Team Lead',
  5: 'Manager Suite',
  6: 'Director Floor',
  7: 'VP Wing',
  8: 'C-Suite',
  9: 'Boardroom',
  // Act 2: Management
  10: 'Conference Room',
  11: 'Budget Office',
  12: 'Reorg Zone',
  13: 'Politics Floor',
  14: 'Town Hall',
  15: 'Offsite Retreat',
  16: 'Headcount Review',
  17: 'War Room',
  18: 'Strategy Floor',
  19: 'Corner Office Antechamber',
  // Act 3: Executive
  20: 'Executive Lounge',
  21: 'Investor Relations',
  22: 'M&A Floor',
  23: 'Crisis Management',
  24: 'Global HQ',
  25: 'Board Prep Room',
  26: 'Shareholder Gallery',
  27: 'Regulatory Tower',
  28: 'CEO Antechamber',
  29: 'The Trading Floor',
}

const FLOOR_FLAVOR: Record<number, string> = {
  // Act 1
  0: 'First day. No badge, no desk, no respect.',
  1: "You've survived orientation. Barely.",
  2: 'The walls are short but the egos are tall.',
  3: 'No walls now. Nowhere to hide.',
  4: 'People are starting to notice you.',
  5: "You've survived the floor plan. Now comes politics.",
  6: 'The air is thinner up here. The stakes are real.',
  7: "Corner offices. Glass walls. Everyone's watching.",
  8: 'One floor to go. The elevator needs a key card.',
  9: 'One seat left at the table.',
  // Act 2
  10: 'Welcome to management. The rules are different here.',
  11: 'Every dollar has a gatekeeper. Every gatekeeper has an agenda.',
  12: 'The org chart changes weekly. Your enemies change daily.',
  13: "It's not about what you know. It's about who you know.",
  14: 'The crowd is restless. Leadership is watching.',
  15: 'Mandatory fun. Maximum discomfort.',
  16: "They're cutting headcount. Don't give them a reason.",
  17: 'Nobody agrees. Everyone blames you. Welcome to cross-functional.',
  18: 'They bill by the hour. You pay by the sanity.',
  19: 'One person stands between you and the executive floor.',
  // Act 3
  20: 'The boardroom smells like leather and existential dread.',
  21: "They're circling. They can smell weakness.",
  22: "Due diligence is just a fancy word for 'we're looking for reasons to destroy you.'",
  23: 'The stock is dropping. The press is calling. Stay calm.',
  24: 'Everyone in this room is smiling. Nobody means it.',
  25: 'The truth is a weapon. In the right hands.',
  26: 'Everything has a price. Including your principles.',
  27: 'The investigation is formal. The consequences are real.',
  28: 'Your rival has the same dream. Only one of you wakes up.',
  29: 'Ring the bell. End the game. Begin the legacy.',
}

const ACT_NAMES: Record<number, string> = {
  1: 'INDIVIDUAL CONTRIBUTOR',
  2: 'MANAGEMENT',
  3: 'EXECUTIVE',
}

export default function FloorIntro({
  enemy,
  floor,
  player,
  onReady,
  totalFloors,
  mystery,
}: {
  enemy: Enemy
  floor: number
  player?: PlayerClass
  onReady: () => void
  totalFloors?: number
  /** Revealed Mystery Floor outcome, if the unmarked elevator was taken. */
  mystery?: MysteryOutcome | null
}) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 200)
  }, [])

  return (
    <div
      className="premium-screen"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        padding: '30px 24px 28px',
        background:
          'radial-gradient(circle at 50% 28%, rgba(255, 213, 79, 0.08), transparent 26%), radial-gradient(circle at 50% 62%, rgba(147, 51, 234, 0.11), transparent 30%), transparent',
        cursor: 'pointer',
      }}
      onClick={onReady}
    >
      {/* Act header on act boundaries */}
      {(floor === 0 || floor === 10 || floor === 20) && (
        <div
          className="t-display"
          style={{
            fontSize: 'var(--display-2xs)',
            color: 'var(--gold)',
            letterSpacing: 3,
            textAlign: 'center',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.5s ease',
            textShadow: '1px 1px 0 #E65100',
          }}
        >
          ACT {getAct(floor)}: {ACT_NAMES[getAct(floor)]}
        </div>
      )}

      {/* Progress ladder */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          width: '100%',
          maxWidth: 330,
          padding: '0 8px',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.6s ease 0.1s',
        }}
      >
        {Array.from({ length: totalFloors ?? TOTAL_FLOORS }, (_, i) => {
          const isCurrent = i === floor
          const isComplete = i < floor
          return (
            <div
              key={i}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  background: isComplete ? 'var(--green)' : isCurrent ? 'var(--gold)' : '#333',
                  boxShadow: isCurrent ? '0 0 8px var(--gold)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              {isCurrent && (
                <div
                  className="t-display"
                  style={{
                    fontSize: 'var(--display-2xs)',
                    color: 'var(--gold)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {i + 1}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Floor label */}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: 'var(--muted)',
          letterSpacing: 2,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease 0.2s',
        }}
      >
        {FLOOR_LABELS[floor] || `Floor ${floor + 1}`}
      </div>

      {/* Floor flavor text */}
      {FLOOR_FLAVOR[floor] && (
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-lg)',
            color: 'var(--muted-light)',
            fontStyle: 'italic',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 300,
            padding: '0 12px',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.6s ease 0.3s',
          }}
        >
          {FLOOR_FLAVOR[floor]}
        </div>
      )}

      {/* Class intro on first floor */}
      {floor === 0 && player?.intro && (
        <div
          className="t-body"
          style={{
            fontSize: 'var(--body-md)',
            color: 'var(--gold)',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 300,
            padding: '0 12px',
            opacity: show ? 1 : 0,
            transition: 'opacity 0.7s ease 0.4s',
          }}
        >
          {player.intro}
        </div>
      )}

      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-sm)',
          color: TYPE_COLORS[enemy.types[0]],
          letterSpacing: 4,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        FLOOR {totalFloors ? floor + 1 : enemy.floor}
      </div>
      {mystery && (
        <div
          style={{
            border: '2px dashed var(--gold)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            maxWidth: 320,
            opacity: show ? 1 : 0,
            transition: 'opacity 0.6s ease 0.2s',
            background: 'rgba(255,193,7,0.1)',
          }}
        >
          <div
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              color: 'var(--gold-bright)',
              letterSpacing: 2,
            }}
          >
            {getMysteryInfo(mystery).banner}
          </div>
          <div
            className="t-body"
            style={{
              fontSize: 'var(--body-sm)',
              color: 'var(--paper)',
              lineHeight: 1.2,
              marginTop: 4,
            }}
          >
            {getMysteryInfo(mystery).desc}
          </div>
        </div>
      )}
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-lg)',
          color: 'var(--paper)',
          textAlign: 'center',
          lineHeight: 1.15,
          opacity: show ? 1 : 0,
          transition: 'opacity 0.8s ease 0.3s',
          textShadow: `0 0 22px ${TYPE_COLORS[enemy.types[0]]}, 0 2px 0 rgba(0,0,0,.5)`,
        }}
      >
        {enemy.title}
      </div>
      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}
      >
        {enemy.types.map((t) => (
          <span
            key={t}
            className="t-display"
            style={{
              fontSize: 'var(--display-2xs)',
              padding: '3px 8px',
              background: TYPE_COLORS[t],
              color: 'var(--paper)',
              borderRadius: 4,
            }}
          >
            {TYPE_LABELS[t]}
          </span>
        ))}
      </div>
      <div
        style={{
          width: 232,
          height: 238,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.42s ease 0.1s, transform 0.42s ease 0.1s',
          transform: show ? 'scale(1)' : 'scale(0.86)',
        }}
      >
        <StagedSprite
          spriteId={enemy.spriteId}
          size={212}
          ring={TYPE_COLORS[enemy.types[0]]}
          active
        />
      </div>
      <div
        className="t-display"
        style={{
          fontSize: 'var(--display-2xs)',
          color: '#616161',
          opacity: show ? 1 : 0,
          transition: 'opacity 0.8s ease 1s',
          animation: show ? 'pulse 2s infinite' : 'none',
        }}
      >
        TAP TO BATTLE • ENTER MEETING
      </div>
    </div>
  )
}
