import React, { useState, useEffect } from 'react'

function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(' ')
}

export interface EvidenceCardAnnotation {
  id: string
  comment: string
  selectedText?: string
  tag: string | null
  annotationType?: 'text' | 'hotspot'
  screenshotUrl?: string
  pageLocation?: string
  taurusUrl?: string
}

interface EvidenceCardProps {
  annotation: EvidenceCardAnnotation
  className?: string
  onGoToAnnotation?: () => void
  footer?: React.ReactNode
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

export function EvidenceCard({ annotation, className, onGoToAnnotation, footer }: EvidenceCardProps) {
  const tag = (annotation.tag === 'action_item' || annotation.tag === 'quick_fix') ? annotation.tag : null

  const isHotspot = annotation.annotationType === 'hotspot'
  const screenshots = isHotspot && annotation.screenshotUrl !== undefined
    ? [{ url: annotation.screenshotUrl ?? '', pageLocation: annotation.pageLocation, taurusUrl: annotation.taurusUrl }]
    : []
  const hasScreenshots = screenshots.length > 0

  const [selectedIdx, setSelectedIdx] = useState(0)
  useEffect(() => { setSelectedIdx(0) }, [annotation.id])

  const selected = screenshots[selectedIdx] ?? null

  return (
    <div className={cx(
      'rounded-md border border-[var(--color-border)] bg-[var(--color-surface-container-low)] p-3 flex flex-col gap-2',
      className
    )}>
      {/* Tag icon + label */}
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

      {/* Hotspot layout: expanded preview + optional thumbnail strip */}
      {isHotspot && hasScreenshots ? (
        <>
          {/* Expanded preview */}
          <div className="w-full h-[140px] rounded-md overflow-hidden mb-2 relative bg-[var(--color-surface-container-low)]">
            {selected?.url ? (
              <img src={selected.url} className="w-full h-full object-cover" alt="Annotation screenshot" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
              </div>
            )}
            {selected?.pageLocation && (
              <span className="absolute bottom-2 left-2 text-[10px] bg-white/80 text-gray-600 px-1.5 py-0.5 rounded">
                <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">location_on</span>
                {selected.pageLocation}
              </span>
            )}
            {selected?.taurusUrl && (
              <button
                onClick={() => window.open(selected!.taurusUrl, '_blank')}
                className="absolute bottom-2 right-2 text-[10px] bg-white/80 text-blue-600 px-1.5 py-0.5 rounded hover:bg-white"
              >
                Open in Taurus
                <span className="material-symbols-outlined text-[10px] align-middle ml-0.5">open_in_new</span>
              </button>
            )}
          </div>

          {/* Thumbnail strip — only when 2+ screenshots */}
          {screenshots.length >= 2 && (
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {screenshots.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIdx(i)}
                  className={[
                    'flex-shrink-0 w-[90px] rounded-md overflow-hidden border-2 transition-colors',
                    i === selectedIdx
                      ? 'border-[var(--color-secondary)]'
                      : 'border-transparent hover:border-gray-300',
                  ].join(' ')}
                >
                  <div className="w-[90px] h-[58px] bg-[var(--color-surface-container-low)] flex items-center justify-center overflow-hidden">
                    {s.url ? (
                      <img src={s.url} className="w-full h-full object-cover" alt={`Screenshot ${i + 1}`} />
                    ) : (
                      <span className="material-symbols-outlined text-gray-400 text-xl">image</span>
                    )}
                  </div>
                  {s.pageLocation && (
                    <p className="text-[10px] text-gray-400 truncate px-1 py-0.5 bg-[var(--color-surface-container-low)]">
                      {s.pageLocation}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        /* Text annotation layout — exactly as before */
        annotation.selectedText && (
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
        )
      )}

      {/* Reviewer comment */}
      <p className="text-body-sm text-[var(--color-text-primary)] leading-relaxed break-words hyphens-auto">
        {annotation.comment}
        {/* For text annotations without selectedText, show nav icon inline */}
        {!isHotspot && !annotation.selectedText && onGoToAnnotation && (
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

      {footer && (
        <div className="border-t border-[var(--color-border)] mt-1 pt-2">
          {footer}
        </div>
      )}
    </div>
  )
}

export default EvidenceCard
