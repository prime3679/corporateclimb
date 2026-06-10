import { useState, useEffect } from 'react'
import styles from './TextBox.module.css'

export default function TextBox({
  lines,
  onAdvance,
  showArrow,
}: {
  lines: string[]
  onAdvance?: () => void
  showArrow?: boolean
}) {
  const fullText = lines.join('\n')
  const [displayedText, setDisplayedText] = useState('')
  const [charIndex, setCharIndex] = useState(0)
  const [prevFullText, setPrevFullText] = useState(fullText)

  // Reset typewriter animation when text changes. This render-time state update
  // is the React-recommended pattern for resetting derived state on prop change
  // (avoids setState inside an effect which can cause cascading renders).
  if (prevFullText !== fullText) {
    setPrevFullText(fullText)
    setDisplayedText('')
    setCharIndex(0)
  }

  useEffect(() => {
    if (charIndex < fullText.length) {
      const t = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1))
        setCharIndex(charIndex + 1)
      }, 18)
      return () => clearTimeout(t)
    }
  }, [charIndex, fullText])

  const isComplete = charIndex >= fullText.length

  const handleClick = () => {
    if (!isComplete) {
      setDisplayedText(fullText)
      setCharIndex(fullText.length)
    } else if (onAdvance) {
      onAdvance()
    }
  }

  return (
    <div className={styles.box} onClick={handleClick}>
      {/* Screen readers get the full line immediately, not the typewriter. */}
      <p className={styles.text} aria-live="polite" aria-label={fullText}>
        {displayedText}
      </p>
      {isComplete && showArrow && (
        <span className={styles.arrow} aria-hidden>
          &#x25BC;
        </span>
      )}
    </div>
  )
}
