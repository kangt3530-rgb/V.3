import { type HTMLAttributes } from 'react'

export type CardVariant = 'elevated' | 'outlined'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  // legacy compat — ignored visually
  surface?: string
  shadow?: boolean
}

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export function Card({ variant = 'outlined', className, children, surface: _surface, shadow: _shadow, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-md bg-[var(--color-surface-card)]',
        variant === 'elevated' && 'shadow-[var(--shadow-2)]',
        variant === 'outlined' && 'border border-[var(--color-border)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
