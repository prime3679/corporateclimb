import { useState, useEffect } from "react";

export default function TextBox({ lines, onAdvance, showArrow }: { lines: string[]; onAdvance?: () => void; showArrow?: boolean }) {
  const fullText = lines.join("\n");
  const [displayedText, setDisplayedText] = useState("");
  const [charIndex, setCharIndex] = useState(0);
  const [prevFullText, setPrevFullText] = useState(fullText);

  // Reset typewriter animation when text changes. This render-time state update
  // is the React-recommended pattern for resetting derived state on prop change
  // (avoids setState inside an effect which can cause cascading renders).
  if (prevFullText !== fullText) {
    setPrevFullText(fullText);
    setDisplayedText("");
    setCharIndex(0);
  }

  useEffect(() => {
    if (charIndex < fullText.length) {
      const t = setTimeout(() => {
        setDisplayedText(fullText.slice(0, charIndex + 1));
        setCharIndex(charIndex + 1);
      }, 22);
      return () => clearTimeout(t);
    }
  }, [charIndex, fullText]);

  const isComplete = charIndex >= fullText.length;

  const handleClick = () => {
    if (!isComplete) {
      setDisplayedText(fullText);
      setCharIndex(fullText.length);
    } else if (onAdvance) {
      onAdvance();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: "#FAFAFA",
        border: "4px solid #263238",
        borderRadius: 10,
        padding: "14px 18px",
        minHeight: 70,
        cursor: "pointer",
        position: "relative",
        boxShadow: "inset 0 0 0 2px #90A4AE, 6px 6px 0 #263238",
        userSelect: "none",
      }}
    >
      <p style={{
        fontFamily: "'Press Start 2P'", fontSize: 10, lineHeight: 2.2,
        color: "#263238", margin: 0, whiteSpace: "pre-wrap",
        minHeight: 44,
      }}>
        {displayedText}
      </p>
      {isComplete && showArrow && (
        <span style={{
          position: "absolute", bottom: 8, right: 14,
          fontFamily: "'Press Start 2P'", fontSize: 12, color: "#263238",
          animation: "bounce 1s infinite",
        }}>&#x25BC;</span>
      )}
    </div>
  );
}
