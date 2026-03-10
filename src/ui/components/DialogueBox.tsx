import { useState, useEffect, useCallback } from 'react'
import { useDialogueState } from '../stores/dialogueState'
import { usePlayerStats } from '../stores/playerStats'

const TYPEWRITER_SPEED = 30 // ms per character

export function DialogueBox() {
  const { isOpen, currentNode, consequence, showingConsequence, selectOption, advanceOrClose } = useDialogueState()
  const playerStats = usePlayerStats()
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [visible, setVisible] = useState(false)

  // Animate in/out
  useEffect(() => {
    if (isOpen) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Typewriter effect
  useEffect(() => {
    if (!currentNode?.text) {
      setDisplayedText('')
      return
    }

    setDisplayedText('')
    setIsTyping(true)
    let i = 0
    const text = currentNode.text
    const interval = setInterval(() => {
      i++
      setDisplayedText(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(interval)
        setIsTyping(false)
      }
    }, TYPEWRITER_SPEED)

    return () => clearInterval(interval)
  }, [currentNode?.id])

  const handleSkipOrAdvance = useCallback(() => {
    if (isTyping) {
      // Skip typewriter, show full text
      setDisplayedText(currentNode?.text ?? '')
      setIsTyping(false)
    } else if (!currentNode?.options?.length) {
      advanceOrClose()
    }
  }, [isTyping, currentNode, advanceOrClose])

  if (!visible) return null

  // Filter options by stat checks
  const availableOptions = (currentNode?.options ?? []).filter((opt) => {
    if (!opt.statCheck) return true
    return playerStats.checkStat(opt.statCheck)
  })

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        pointerEvents: 'auto',
        transition: 'transform 0.3s ease, opacity 0.3s ease',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        opacity: isOpen ? 1 : 0,
      }}
    >
      <div
        onClick={handleSkipOrAdvance}
        style={{
          margin: '0 auto',
          maxWidth: 800,
          padding: '24px 32px',
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px 16px 0 0',
          cursor: 'pointer',
        }}
      >
        {/* Speaker name */}
        {currentNode?.speaker && (
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#818CF8',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: 8,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {currentNode.speaker}
          </div>
        )}

        {/* Dialogue text */}
        <div
          style={{
            fontSize: 18,
            color: '#E2E8F0',
            lineHeight: 1.5,
            fontFamily: 'system-ui, sans-serif',
            minHeight: 54,
          }}
        >
          {showingConsequence ? (
            <span style={{ color: '#34D399', fontWeight: 600 }}>{consequence}</span>
          ) : (
            <>
              {displayedText}
              {isTyping && <span style={{ opacity: 0.5 }}>|</span>}
            </>
          )}
        </div>

        {/* Options */}
        {!isTyping && !showingConsequence && availableOptions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {availableOptions.map((opt, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation()
                  selectOption(currentNode!.options!.indexOf(opt))
                }}
                style={{
                  background: 'rgba(79, 70, 229, 0.15)',
                  border: '1px solid rgba(79, 70, 229, 0.3)',
                  borderRadius: 8,
                  padding: '10px 16px',
                  color: '#C7D2FE',
                  fontSize: 15,
                  fontFamily: 'system-ui, sans-serif',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 70, 229, 0.3)'
                  e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(79, 70, 229, 0.15)'
                  e.currentTarget.style.borderColor = 'rgba(79, 70, 229, 0.3)'
                }}
              >
                {opt.text}
              </button>
            ))}
          </div>
        )}

        {/* Tap to continue hint */}
        {!isTyping && !showingConsequence && !availableOptions.length && (
          <div
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.3)',
              marginTop: 12,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Click to continue
          </div>
        )}
      </div>
    </div>
  )
}
