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

const TAG_CONFIG: Record<'action_item' | 'quick_fix', { icon: string; label: string; iconCls: string }> = {
  action_item: {
    icon:    'add_task',
    label:   'Action Item',
    iconCls: 'text-[var(--color-secondary)]',
  },
  quick_fix: {
    icon:    'bolt',
    label:   'Quick Fix',
    iconCls: 'text-[var(--color-primary)]',
  },
}

export function EvidenceCard({ annotation, className, onGoToAnnotation }: EvidenceCardProps) {
  const tag = (annotation.tag === 'action_item' || annotation.tag === 'quick_fix') ? annotation.tag : null

  return (
    <div className={cx(
      'rounded-md border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-3 flex flex-col gap-2',
      className
    )}>
      {/* Tag icon + label inline */}
      {tag && (
        <div className="flex items-center gap-1.5">
          <span
            className={cx('material-symbols-outlined text-[15px] flex-shrink-0', TAG_CONFIG[tag].iconCls)}
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {TAG_CONFIG[tag].icon}
          </span>
          <span className="text-label-sm font-label font-semibold text-[var(--color-text-secondary)]">
            {TAG_CONFIG[tag].label}
          </span>
        </div>
      )}

      {/* Annotated text (italic) + navigation icon at the end of this block */}
      {annotation.selectedText && (
        <div>
          <blockquote
            className="pl-3 italic text-body-sm text-[var(--color-text-secondary)] leading-relaxed"
            style={{ borderLeft: '2px solid var(--color-secondary)' }}
          >
            {annotation.selectedText}
          </blockquote>
          {onGoToAnnotation && (
            <button
              type="button"
              onClick={onGoToAnnotation}
              title="Go to annotation in OER"
              className="ml-3 mt-1 flex items-center gap-0.5 text-[var(--color-primary)] hover:opacity-70 transition-opacity"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          )}
        </div>
      )}

      {/* Reviewer comment — normal body text */}
      <p className="text-body-sm text-[var(--color-text-primary)] leading-relaxed break-words hyphens-auto">
        {annotation.comment}
        {/* For notes without selectedText (freeNotes), show navigation icon inline at end */}
        {!annotation.selectedText && onGoToAnnotation && (
          <button
            type="button"
            onClick={onGoToAnnotation}
            title="View source"
            className="inline-flex items-center ml-1.5 align-middle text-[var(--color-primary)] hover:opacity-70 transition-opacity"
          >
            <span className="material-symbols-outlined text-[14px]">north_east</span>
          </button>
        )}
      </p>
    </div>
  )
}

export default EvidenceCard
