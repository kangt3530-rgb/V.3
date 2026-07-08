import type { ReactNode } from 'react'

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export interface TabBarProps {
  tabs: { id: string; label: string; badge?: ReactNode }[]
  activeId: string
  onChange: (id: string) => void
  rightSlot?: ReactNode
  className?: string
  tabClassName?: string
}

export function TabBar({ tabs, activeId, onChange, rightSlot, className, tabClassName }: TabBarProps) {
  return (
    <div className={cx('flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface-card)]', className)}>
      <div className="flex-1 flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {tabs.map(tab => {
          const active = tab.id === activeId
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={cx(
                'inline-flex items-center gap-2 px-4 py-2.5 text-body-sm -mb-px border-b-2 transition-colors whitespace-nowrap flex-shrink-0',
                tabClassName,
                active
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-semibold'
                  : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border)]',
              )}
              onClick={e => {
                if (!active) onChange(tab.id)
                e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
              }}
            >
              {tab.label}
              {tab.badge}
            </button>
          )
        })}
      </div>
      {rightSlot && (
        <div className="flex-shrink-0 px-3 flex items-center self-stretch">
          {rightSlot}
        </div>
      )}
    </div>
  )
}

export default TabBar
