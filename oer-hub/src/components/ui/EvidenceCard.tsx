function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export interface EvidenceCardAnnotation {
  id: string
  comment: string
  selectedText?: string
  tag: string | null
}

interface EvidenceCardProps {
  annotation: EvidenceCardAnnotation
  className?: string
  onGoToAnnotation?: () => void
}

const TAG_CONFIG: Record<'action_item' | 'quick_fix', { label: string; bg: string; text: string; border: string }> = {
  action_item: {
    label:  'Action Item',
    bg:     'var(--color-rating-dnm-bg)',
    text:   'var(--color-rating-dnm-text)',
    border: 'var(--color-rating-dnm-border)',
  },
  quick_fix: {
    label:  'Quick Fix',
    bg:     'var(--color-status-assigned-bg)',
    text:   'var(--color-primary)',
    border: 'var(--color-border)',
  },
}

export function EvidenceCard({ annotation, className, onGoToAnnotation }: EvidenceCardProps) {
  const tag = (annotation.tag === 'action_item' || annotation.tag === 'quick_fix') ? annotation.tag : null
  const hasAnchor = !!annotation.selectedText
  const typeLabel = hasAnchor ? 'Annotation' : 'Note'

  return (
    <div className={cx(
      'rounded-md border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-3 flex flex-col gap-2',
      className
    )}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {tag && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-label-sm font-label font-semibold border"
              style={{
                backgroundColor: TAG_CONFIG[tag].bg,
                color: TAG_CONFIG[tag].text,
                borderColor: TAG_CONFIG[tag].border,
              }}
            >
              {TAG_CONFIG[tag].label}
            </span>
          )}
        </div>
        <span className="text-label-sm font-label text-[var(--color-text-muted)] shrink-0">
          {typeLabel}
        </span>
      </div>

      {annotation.selectedText && (
        <div>
          <span className="block text-label-sm font-label font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
            Annotated Text
          </span>
          <blockquote
            className="pl-3 italic text-body-sm text-[var(--color-text-secondary)] leading-relaxed"
            style={{ borderLeft: '2px solid var(--color-secondary)' }}
          >
            {annotation.selectedText}
          </blockquote>
        </div>
      )}

      {hasAnchor && onGoToAnnotation && (
        <button
          type="button"
          onClick={onGoToAnnotation}
          className="self-start text-body-sm text-[var(--color-primary)] underline-offset-2 hover:underline"
        >
          Go to Annotation ↗
        </button>
      )}

      {annotation.selectedText ? (
        <div>
          <span className="block text-label-sm font-label font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1">
            Comment
          </span>
          <p className="text-body-sm text-[var(--color-text-primary)] leading-relaxed break-words hyphens-auto">
            {annotation.comment}
          </p>
        </div>
      ) : (
        <p className="text-body-sm text-[var(--color-text-primary)] leading-relaxed break-words hyphens-auto">
          {annotation.comment}
        </p>
      )}
    </div>
  )
}

export default EvidenceCard
