import { useEffect, useState, useCallback, useRef } from "react";
import {
  useDialogueState,
  getVisibleOptionsForNode,
} from "../stores/dialogueState";
import type { DialogueOption } from "../../game/config/dialogueTypes";

const TYPEWRITER_MS = 30; // ms per character

export function DialogueBox() {
  const { isOpen, currentNode, consequence } = useDialogueState();

  if (!isOpen || !currentNode) return null;

  return (
    <div style={styles.backdrop}>
      <div style={styles.container}>
        {consequence ? (
          <ConsequenceDisplay text={consequence} />
        ) : (
          <NodeDisplay />
        )}
      </div>
    </div>
  );
}

/** Shows consequence text briefly */
function ConsequenceDisplay({ text }: { text: string }) {
  return (
    <div style={styles.consequence}>
      <span style={styles.consequenceText}>{text}</span>
    </div>
  );
}

/** Shows speaker, typewriter text, and options */
function NodeDisplay() {
  const { currentNode, selectOption, advanceOrClose } = useDialogueState();

  const visibleOptions = currentNode
    ? getVisibleOptionsForNode(currentNode)
    : [];
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);
  const fullText = currentNode?.text ?? "";
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset typewriter when node changes
  useEffect(() => {
    setDisplayedText("");
    setIsTyping(true);
    let i = 0;
    timerRef.current = setInterval(() => {
      i++;
      if (i >= fullText.length) {
        setDisplayedText(fullText);
        setIsTyping(false);
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      setDisplayedText(fullText.slice(0, i));
    }, TYPEWRITER_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fullText]);

  const skipTypewriter = useCallback(() => {
    if (isTyping) {
      if (timerRef.current) clearInterval(timerRef.current);
      setDisplayedText(fullText);
      setIsTyping(false);
    } else if (!visibleOptions.length) {
      // No options — tap to close
      advanceOrClose();
    }
  }, [isTyping, fullText, visibleOptions.length, advanceOrClose]);

  if (!currentNode) return null;

  return (
    <>
      {/* Speaker name */}
      <div style={styles.speaker}>{currentNode.speaker}</div>

      {/* Dialogue text area — click to skip typewriter */}
      <div style={styles.textArea} onClick={skipTypewriter}>
        <span>{displayedText}</span>
        {isTyping && <span style={styles.cursor}>|</span>}
      </div>

      {/* Options (only show after typing finishes) */}
      {!isTyping && visibleOptions.length > 0 && (
        <div style={styles.optionsRow}>
          {visibleOptions.map((opt: DialogueOption, i: number) => (
            <button
              key={i}
              style={styles.optionButton}
              onClick={() => selectOption(i)}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.backgroundColor =
                  "rgba(99, 102, 241, 0.6)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.backgroundColor =
                  "rgba(99, 102, 241, 0.3)";
              }}
            >
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {/* Tap hint for no-option nodes */}
      {!isTyping && visibleOptions.length === 0 && (
        <div style={styles.tapHint}>Click to continue...</div>
      )}
    </>
  );
}

/* ─── Styles (inline, no Tailwind) ─── */

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    justifyContent: "center",
    padding: "0 24px 24px",
    pointerEvents: "auto",
    animation: "slideUp 0.25s ease-out",
  },
  container: {
    width: "100%",
    maxWidth: 900,
    background: "rgba(15, 23, 42, 0.92)",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: 12,
    padding: "20px 28px",
    backdropFilter: "blur(8px)",
    minHeight: 120,
  },
  speaker: {
    color: "#818cf8",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: "0.05em",
    textTransform: "uppercase" as const,
    marginBottom: 8,
  },
  textArea: {
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 18,
    lineHeight: 1.5,
    cursor: "pointer",
    userSelect: "none",
    minHeight: 48,
  },
  cursor: {
    color: "#818cf8",
    animation: "blink 0.6s step-end infinite",
  },
  optionsRow: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: 10,
    marginTop: 16,
  },
  optionButton: {
    background: "rgba(99, 102, 241, 0.3)",
    border: "1px solid rgba(99, 102, 241, 0.5)",
    borderRadius: 8,
    color: "#e2e8f0",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 15,
    padding: "8px 18px",
    cursor: "pointer",
    transition: "background 0.15s, transform 0.1s",
    outline: "none",
  },
  tapHint: {
    color: "#64748b",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 14,
    marginTop: 12,
    fontStyle: "italic",
  },
  consequence: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 80,
  },
  consequenceText: {
    color: "#a5b4fc",
    fontFamily: "'Segoe UI', system-ui, sans-serif",
    fontSize: 22,
    fontWeight: 600,
    textAlign: "center" as const,
  },
};
