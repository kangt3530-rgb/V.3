import { type ButtonHTMLAttributes, type ReactNode, cloneElement, isValidElement, Children } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'toggle' | 'icon' | 'text' | 'ghost' | 'destructive'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  shape?: 'rounded' | 'square'
  loading?: boolean
  fullWidth?: boolean
  active?: boolean
  asChild?: boolean
  children?: ReactNode
  // legacy compat
  icon?: string
  iconPosition?: string
}

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

function Spinner() {
  return (
    <svg className="h-4 w-4 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function Button({
  variant = 'primary',
  size = 'md',
  shape = 'rounded',
  loading = false,
  fullWidth = false,
  active = false,
  asChild = false,
  disabled,
  children,
  className,
  icon,
  iconPosition: _iconPosition,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  const buttonClassName = cx(
    variant === 'toggle' ? 'flex flex-col items-start' : 'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-[var(--transition-duration-base)]',
    'focus-visible:outline-none focus-visible:ring-2',
    'focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
    variant === 'primary' && cx(
      'rounded-md font-semibold',
      'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-1',
      'hover:bg-[var(--color-primary-hover)] hover:shadow-2 active:scale-[0.99]',
      'disabled:bg-surface-container-high disabled:text-[var(--color-text-muted)] disabled:shadow-none disabled:cursor-not-allowed',
    ),
    variant === 'destructive' && cx(
      'rounded-md font-semibold',
      'bg-[var(--color-error)] text-[var(--color-on-error)] shadow-1',
      'hover:bg-[var(--color-error-hover)] hover:shadow-2 active:scale-[0.99]',
      'disabled:bg-surface-container-high disabled:text-[var(--color-text-muted)] disabled:shadow-none disabled:cursor-not-allowed',
    ),
    variant === 'secondary' && cx(
      'rounded-md border border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-text-secondary)]',
      'hover:bg-[var(--color-surface-container)] hover:border-[var(--color-border-strong)]',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    ),
    variant === 'toggle' && cx(
      'w-full rounded-lg border-2 text-left disabled:cursor-not-allowed',
      active
        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
        : 'border-[var(--color-border)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]',
    ),
    variant === 'icon' && cx(
      'rounded-md text-[var(--color-text-muted)]',
      'hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-container)]',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    ),
    variant === 'text' && cx(
      'rounded underline-offset-2 text-[var(--color-text-secondary)]',
      'hover:text-[var(--color-text-primary)] hover:underline',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    ),
    variant === 'ghost' && cx(
      'rounded-md bg-transparent text-[var(--color-text-secondary)]',
      'hover:bg-[var(--color-surface-container)] hover:text-[var(--color-text-primary)]',
      'disabled:opacity-40 disabled:cursor-not-allowed',
    ),
    size === 'sm' && (variant === 'primary' || variant === 'destructive' || variant === 'secondary') && 'px-3 py-1.5 text-xs',
    size === 'sm' && variant === 'toggle' && 'px-3 py-2 text-xs',
    size === 'sm' && variant === 'icon'   && 'p-1',
    size === 'sm' && (variant === 'text' || variant === 'ghost') && 'px-3 py-1.5 text-xs',
    size === 'md' && (variant === 'primary' || variant === 'destructive' || variant === 'secondary') && 'px-3.5 py-2 text-sm',
    size === 'md' && variant === 'toggle' && 'px-4 py-3 text-sm',
    size === 'md' && variant === 'icon'   && 'p-1.5',
    size === 'md' && (variant === 'text' || variant === 'ghost') && 'px-3.5 py-2 text-sm',
    size === 'lg' && (variant === 'primary' || variant === 'destructive' || variant === 'secondary') && 'px-5 py-2.5 text-sm',
    size === 'lg' && variant === 'toggle' && 'px-5 py-3.5 text-sm',
    size === 'lg' && variant === 'icon'   && 'p-2',
    size === 'lg' && (variant === 'text' || variant === 'ghost') && 'px-5 py-2.5 text-base',
    fullWidth && 'w-full',
    shape === 'square' && 'rounded-none',
    className,
  )

  if (asChild) {
    const child = Children.only(children)
    if (!isValidElement(child)) return null
    return cloneElement(child as React.ReactElement<{ className?: string }>, {
      className: cx(buttonClassName, (child.props as { className?: string }).className),
    })
  }

  return (
    <button
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={variant === 'toggle' ? active : undefined}
      className={buttonClassName}
      {...props}
    >
      {loading && <Spinner />}
      {icon && <span className="material-symbols-outlined text-[16px]">{icon}</span>}
      {children}
    </button>
  )
}

export default Button
