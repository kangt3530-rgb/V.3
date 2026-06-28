function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export type CriterionSummaryRating = 'needs_improvement' | 'proficient' | 'exceeds' | 'mixed'

export interface CriterionSummaryItem {
  id: string
  label: string
  rating: CriterionSummaryRating
  evidenceCount: number
}

interface ReviewSummaryPanelProps {
  items: CriterionSummaryItem[]
  onCriterionClick: (id: string) => void
  className?: string
}

const BADGE_CONFIG: Record<CriterionSummaryRating, { label: string; bg: string; text: string; border: string }> = {
  needs_improvement: {
    label:  'Does Not Meet',
    bg:     'var(--color-rating-dnm-bg)',
    text:   'var(--color-rating-dnm-text)',
    border: 'var(--color-rating-dnm-border)',
  },
  proficient: {
    label:  'Exemplifies',
    bg:     'var(--color-rating-exemplifies-bg)',
    text:   'var(--color-rating-exemplifies-text)',
    border: 'transparent',
  },
  exceeds: {
    label:  'Exceeds',
    bg:     'var(--color-rating-exceeds-bg)',
    text:   'var(--color-rating-exceeds-text)',
    border: 'var(--color-rating-exceeds-border)',
  },
  mixed: {
    label:  'Mixed',
    bg:     'var(--color-status-under-review-bg)',
    text:   'var(--color-status-under-review-text)',
    border: 'var(--color-status-under-review-text)',
  },
}

export function ReviewSummaryPanel({ items, onCriterionClick, className }: ReviewSummaryPanelProps) {
  const niCount         = items.filter(i => i.rating === 'needs_improvement' || i.rating === 'mixed').length
  const proficientCount = items.filter(i => i.rating === 'proficient').length
  const exceedsCount    = items.filter(i => i.rating === 'exceeds').length

  return (
    <div className={cx('flex flex-col gap-3', className)}>
      <p className="flex items-center gap-2 flex-wrap text-label-sm font-label font-semibold uppercase tracking-wide">
        {exceedsCount > 0 && (
          <>
            <span style={{ color: 'var(--color-rating-exceeds-text)' }}>
              {exceedsCount} exceeds
            </span>
            <span className="text-[var(--color-text-muted)]">·</span>
          </>
        )}
        {proficientCount > 0 && (
          <>
            <span style={{ color: 'var(--color-primary)' }}>
              {proficientCount} exemplifies
            </span>
            <span className="text-[var(--color-text-muted)]">·</span>
          </>
        )}
        <span style={{ color: 'var(--color-rating-dnm-text)' }}>
          {niCount} {niCount === 1 ? 'does not meet' : 'do not meet'}
        </span>
      </p>

      <h2 className="font-heading text-heading-sm text-[var(--color-text-primary)]">
        Review Summary
      </h2>

      <div>
        {items.map((item, i) => {
          const cfg = BADGE_CONFIG[item.rating]
          return (
            <div
              key={item.id}
              onClick={() => onCriterionClick(item.id)}
              className={cx(
                'flex items-center gap-3 px-1 py-3 cursor-pointer transition-colors rounded-md',
                'hover:bg-[var(--color-surface-container-low)]',
                i > 0 && 'border-t border-[var(--color-border)]'
              )}
            >
              <span className="text-body-sm text-[var(--color-text-primary)] flex-1 min-w-0 truncate">
                {item.label}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {item.evidenceCount > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label font-semibold bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)]">
                    <svg width={10} height={10} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                      <path d="M4 1H12V14L8 11L4 14V1Z" />
                    </svg>
                    {item.evidenceCount}
                  </span>
                )}
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label font-semibold border"
                  style={{ backgroundColor: cfg.bg, color: cfg.text, borderColor: cfg.border }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default ReviewSummaryPanel
