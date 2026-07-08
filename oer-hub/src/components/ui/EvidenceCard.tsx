import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

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
  torusUrl?: string
  screenshots?: Array<{ url: string; pageLocation?: string; torusUrl?: string }>
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

function Lightbox({ url, pageLocation, torusUrl, onClose }: {
  url: string
  pageLocation?: string
  torusUrl?: string
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75"
      onClick={onClose}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <img
          src={url}
          alt="Screenshot"
          className="block max-w-[90vw] max-h-[85vh] object-contain bg-gray-900"
        />
        {/* Bottom bar */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm">
          <span className="text-white/80 text-xs flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">location_on</span>
            {pageLocation ?? ''}
          </span>
          <button
            onClick={() => torusUrl ? window.open(torusUrl, '_blank') : undefined}
            className={cx(
              'flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors',
              torusUrl
                ? 'bg-white/20 text-white hover:bg-white/30'
                : 'bg-white/10 text-white/40 cursor-default'
            )}
          >
            <span className="material-symbols-outlined text-[12px]">open_in_new</span>
            Open in Torus
          </button>
        </div>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>,
    document.body
  )
}

export function EvidenceCard({ annotation, className, onGoToAnnotation, footer }: EvidenceCardProps) {
  const tag = (annotation.tag === 'action_item' || annotation.tag === 'quick_fix') ? annotation.tag : null

  const isHotspot = annotation.annotationType === 'hotspot'
  const screenshots = isHotspot
    ? (annotation.screenshots && annotation.screenshots.length > 0
        ? annotation.screenshots
        : annotation.screenshotUrl !== undefined
          ? [{ url: annotation.screenshotUrl, pageLocation: annotation.pageLocation, torusUrl: annotation.torusUrl }]
          : [])
    : []
  const hasScreenshots = screenshots.length > 0

  const [selectedIdx, setSelectedIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
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
          {/* Expanded preview — full-bleed width, clickable to open lightbox */}
          <div className="-mx-3 h-[200px] overflow-hidden relative bg-[var(--color-surface-container-low)] group">
            {selected?.url ? (
              <img
                src={selected.url}
                className="w-full h-full object-cover cursor-zoom-in"
                alt="Annotation screenshot"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-400 text-3xl">image</span>
              </div>
            )}
            {/* Location badge */}
            <span className="absolute bottom-2 left-2 text-[10px] bg-black/50 text-white/90 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <span className="material-symbols-outlined text-[10px]">location_on</span>
              {selected?.pageLocation ?? '—'}
            </span>
            {/* Open in Torus — always shown */}
            <button
              onClick={() => selected?.torusUrl ? window.open(selected.torusUrl, '_blank') : undefined}
              className={cx(
                'absolute bottom-2 right-2 flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded transition-colors',
                selected?.torusUrl
                  ? 'bg-white/80 text-blue-600 hover:bg-white hover:underline'
                  : 'bg-white/40 text-gray-400 cursor-default'
              )}
            >
              Open in Torus
              <span className="material-symbols-outlined text-[10px]">open_in_new</span>
            </button>
          </div>

          {/* Thumbnail strip — only when 2+ screenshots */}
          {screenshots.length >= 2 && (
            <div className="-mx-3 flex gap-2 overflow-x-auto pb-1 px-3">
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

          {/* Lightbox */}
          {lightboxOpen && selected?.url && (
            <Lightbox
              url={selected.url}
              pageLocation={selected.pageLocation}
              torusUrl={selected.torusUrl}
              onClose={() => setLightboxOpen(false)}
            />
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
