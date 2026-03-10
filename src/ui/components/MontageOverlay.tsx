import { useState, useEffect, useCallback } from 'react'
import { useChoiceHistory } from '../stores/choiceHistory'
import { usePlayerStats } from '../stores/playerStats'

const CARD_DURATION = 3000

interface MontageCard {
  title: string
  subtitle: string
}

function buildMontageCards(): MontageCard[] {
  const history = useChoiceHistory.getState()
  const stats = usePlayerStats.getState()
  const cards: MontageCard[] = []

  // Card 1: Freshman Year
  const bossL1 = history.getChoicesForDialogue('boss_essay')
  const l1Summary = bossL1.length > 0
    ? bossL1.map((c) => c.tags.join(', ')).join(' → ')
    : 'Survived the curve'
  cards.push({ title: 'Freshman Year', subtitle: l1Summary })

  // Card 2: Senior Scramble
  const bossL2 = history.getChoicesForDialogue('boss_recruiter_interview')
  const l2Summary = bossL2.length > 0
    ? bossL2.map((c) => c.tags.join(', ')).join(' → ')
    : 'Faced the recruiter'
  cards.push({ title: 'Senior Scramble', subtitle: l2Summary })

  // Card 3: The Intern
  const creditThief = history.getChoicesForDialogue('credit_thief')
  const l3Summary = creditThief.length > 0
    ? creditThief[0].tags.join(', ')
    : 'Navigated the office'
  cards.push({ title: 'The Intern', subtitle: l3Summary })

  // Card 4: IC Grind
  const imposter = history.getChoicesForDialogue('boss_imposter')
  const l4Summary = imposter.length > 0
    ? imposter[imposter.length - 1].tags.join(', ')
    : 'Faced the shadow'
  cards.push({ title: 'IC Grind', subtitle: l4Summary })

  // Card 5: Current stats
  cards.push({
    title: 'Where You Stand',
    subtitle: `Energy ${stats.energy} · Reputation ${stats.reputation} · Network ${stats.network} · Cash ${stats.cash}`,
  })

  return cards
}

interface MontageOverlayProps {
  active: boolean
  onComplete: () => void
}

export function MontageOverlay({ active, onComplete }: MontageOverlayProps) {
  const [currentCard, setCurrentCard] = useState(-1)
  const [cards, setCards] = useState<MontageCard[]>([])
  const [fadeState, setFadeState] = useState<'in' | 'hold' | 'out'>('in')

  const startMontage = useCallback(() => {
    const built = buildMontageCards()
    setCards(built)
    setCurrentCard(0)
    setFadeState('in')
  }, [])

  useEffect(() => {
    if (active && currentCard === -1) {
      startMontage()
    }
    if (!active) {
      setCurrentCard(-1)
      setCards([])
    }
  }, [active, currentCard, startMontage])

  useEffect(() => {
    if (!active || currentCard < 0 || currentCard >= cards.length) return

    // Fade in → hold → fade out → next card
    const fadeInTimer = setTimeout(() => setFadeState('hold'), 600)
    const holdTimer = setTimeout(() => setFadeState('out'), CARD_DURATION - 600)
    const nextTimer = setTimeout(() => {
      if (currentCard < cards.length - 1) {
        setCurrentCard((c) => c + 1)
        setFadeState('in')
      } else {
        onComplete()
      }
    }, CARD_DURATION)

    return () => {
      clearTimeout(fadeInTimer)
      clearTimeout(holdTimer)
      clearTimeout(nextTimer)
    }
  }, [active, currentCard, cards.length, onComplete])

  if (!active || currentCard < 0 || currentCard >= cards.length) return null

  const card = cards[currentCard]
  const opacity = fadeState === 'in' ? 0 : fadeState === 'hold' ? 1 : 0

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        zIndex: 100,
        pointerEvents: 'auto',
        transition: 'opacity 0.6s ease',
        opacity: opacity,
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontFamily: 'system-ui, sans-serif',
          color: '#64748B',
          letterSpacing: '3px',
          textTransform: 'uppercase',
          marginBottom: '16px',
        }}
      >
        Previously on Corporate Climb...
      </div>
      <div
        style={{
          fontSize: '32px',
          fontFamily: 'system-ui, sans-serif',
          color: '#F1F5F9',
          fontWeight: 700,
          marginBottom: '12px',
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          fontSize: '18px',
          fontFamily: 'system-ui, sans-serif',
          color: '#94A3B8',
          fontStyle: 'italic',
          maxWidth: '500px',
          textAlign: 'center',
        }}
      >
        {card.subtitle}
      </div>
      <div
        style={{
          position: 'absolute',
          bottom: '40px',
          display: 'flex',
          gap: '8px',
        }}
      >
        {cards.map((_, i) => (
          <div
            key={i}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: i === currentCard ? '#818CF8' : '#334155',
            }}
          />
        ))}
      </div>
    </div>
  )
}
