import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Panel.module.css'

export type PanelVariant = 'paper' | 'dark' | 'glass'

/** Shared surface: chunky-bordered panel in paper, dark, or glass. */
export default function Panel({
  variant = 'paper',
  className,
  children,
  ...rest
}: {
  variant?: PanelVariant
  children: ReactNode
} & HTMLAttributes<HTMLDivElement>) {
  const classes = [styles.panel, styles[variant], className].filter(Boolean).join(' ')
  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  )
}
