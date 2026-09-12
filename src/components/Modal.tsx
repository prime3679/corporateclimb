import { useLayoutEffect, useRef, type ReactNode } from 'react'

/** One input owner while a global panel is open. Native range and button
 * defaults still work; game shortcuts never receive the same keystroke. */
export default function Modal({
  label,
  overlayClassName,
  className,
  onClose,
  children,
}: {
  label: string
  overlayClassName: string
  className: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useLayoutEffect(() => {
    close.current = onClose
  }, [onClose])

  useLayoutEffect(() => {
    const panel = ref.current!
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const isolated: { element: HTMLElement; inert: boolean }[] = []
    // Isolate siblings up to the document, including game controls and theater
    // chrome. Restore their original state rather than assuming it was false.
    for (
      let branch: HTMLElement | null = panel.parentElement;
      branch?.parentElement;
      branch = branch.parentElement
    ) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          isolated.push({ element: sibling, inert: sibling.inert })
          sibling.inert = true
        }
      }
    }
    const controls = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex="0"]',
        ),
      ).filter((el) => !el.closest('[inert]') && !el.hidden && el.getClientRects().length > 0)
    const focusFirst = () => (controls()[0] ?? panel).focus()
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !panel.contains(event.target)) focusFirst()
    }
    const onKey = (event: KeyboardEvent) => {
      event.stopImmediatePropagation()
      if (event.key === 'Escape') {
        event.preventDefault()
        close.current()
      } else if (event.key === 'Tab') {
        const elements = controls()
        const index = elements.indexOf(document.activeElement as HTMLElement)
        const next = event.shiftKey ? index - 1 : index + 1
        event.preventDefault()
        ;(elements[(next + elements.length) % elements.length] ?? panel).focus()
      }
    }
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('focusin', onFocus, true)
    focusFirst()
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocus, true)
      isolated.forEach(({ element, inert }) => {
        element.inert = inert
      })
      if (previous?.isConnected) previous.focus()
    }
  }, [])

  return (
    <div className={overlayClassName} onClick={onClose}>
      <div
        ref={ref}
        className={className}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
