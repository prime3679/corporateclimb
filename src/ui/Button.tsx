import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { Haptics } from '@/platform'
import styles from './Button.module.css'

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'paper' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

/**
 * The chunky pixel button, defined once: ink border, hard offset
 * shadow, press-down hover/active. Every screen used to hand-roll
 * its own version of this.
 */
export default function Button({
  variant = 'paper',
  size = 'md',
  className,
  children,
  onClick,
  ...rest
}: {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const classes = [styles.button, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(' ')
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    Haptics.selection()
    onClick?.(e)
  }
  return (
    <button className={classes} onClick={handleClick} {...rest}>
      {children}
    </button>
  )
}
