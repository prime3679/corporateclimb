import { useState, useEffect } from 'react'

const WHISPER_LINES = [
  "You got lucky.",
  "They'll figure you out.",
  "Everyone here is smarter than you.",
  "You don't belong in this room.",
  "One bad quarter and it's over.",
  "They're just being nice.",
  "Remember that mistake in Q2?",
  "Your network is pity, not respect.",
]

const LINE_INTERVAL = 3500
const LINE_DURATION = 4000

interface FloatingLine {
  id: number
  text: string
  x: number
  y: number
  opacity: number
}

interface WhisperOverlayProps {
  active: boolean
}

export function WhisperOverlay({ active }: WhisperOverlayProps) {
  const [lines, setLines] = useState<FloatingLine[]>([])
  const [nextId, setNextId] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      setLines([])
      setLineIndex(0)
      return
    }

    const interval = setInterval(() => {
      setLineIndex((prev) => {
        const idx = prev % WHISPER_LINES.length
        const newLine: FloatingLine = {
          id: nextId,
          text: WHISPER_LINES[idx],
          x: 10 + Math.random() * 60,
          y: 15 + Math.random() * 50,
          opacity: 1,
        }
        setNextId((n) => n + 1)
        setLines((prev) => [...prev, newLine])

        // Auto-remove after duration
        setTimeout(() => {
          setLines((prev) => prev.filter((l) => l.id !== newLine.id))
        }, LINE_DURATION)

        return prev + 1
      })
    }, LINE_INTERVAL)

    return () => clearInterval(interval)
  }, [active, nextId])

  if (!active) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 80,
        overflow: 'hidden',
      }}
    >
      {lines.map((line) => (
        <div
          key={line.id}
          style={{
            position: 'absolute',
            left: `${line.x}%`,
            top: `${line.y}%`,
            color: '#A78BFA',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '20px',
            fontStyle: 'italic',
            opacity: 0,
            animation: `whisperFade ${LINE_DURATION}ms ease-in-out forwards`,
            textShadow: '0 0 20px rgba(124, 58, 237, 0.5)',
            whiteSpace: 'normal',
            maxWidth: '60%',
          }}
        >
          {line.text}
        </div>
      ))}
      <style>{`
        @keyframes whisperFade {
          0% { opacity: 0; transform: translateY(10px); }
          15% { opacity: 0.8; transform: translateY(0); }
          70% { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
