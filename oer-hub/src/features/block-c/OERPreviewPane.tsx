import { useEffect, useRef, useState } from "react";
import type { IAggregatedCriterionFeedback, IAnnotation, OerType } from "../../api/types";
import { MockOERRenderer } from "../block-b/OERPane/MockOERRenderer";
import { useRevisionStore } from "../../store/revisionStore";

interface OERPreviewPaneProps {
  annotations: IAnnotation[];
  criteria: IAggregatedCriterionFeedback[];
  oerType: OerType;
  oerSource: string;
  versionMismatch?: boolean;
  anchorVersionLabel?: string;
  currentVersionLabel?: string;
}

type Rect = { top: number; left: number; width: number; height: number };

function primaryCriterionId(ann: IAnnotation): string | undefined {
  return ann.criterionIds?.[0];
}

interface PopoverState {
  annotationId: string;
  top: number;
  left: number;
  expanded: boolean;
}

interface TooltipState {
  id: string;
  x: number;
  y: number;
}

const POPOVER_W = 320;
const COMMENT_TRUNCATE = 300;

/**
 * Finds `selectedText` in the DOM subtree rooted at `root` using TreeWalker,
 * and returns rects in MockOERRenderer's content-div coordinate space (.max-w-2xl).
 */
function findTextRects(root: HTMLElement, selectedText: string): Rect[] {
  const contentEl = root.querySelector<HTMLElement>(".max-w-2xl");
  if (!contentEl) return [];
  const contentRect = contentEl.getBoundingClientRect();

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const nodeText = node.textContent ?? "";
    const idx = nodeText.indexOf(selectedText);
    if (idx === -1) continue;

    const range = document.createRange();
    range.setStart(node, idx);
    range.setEnd(node, idx + selectedText.length);

    const rawRects = Array.from(range.getClientRects()).filter(
      (r) => r.width > 1 && r.height > 1
    );
    if (!rawRects.length) continue;

    return rawRects.map((r) => ({
      top: r.top - contentRect.top,
      left: r.left - contentRect.left,
      width: r.width,
      height: r.height,
    }));
  }
  return [];
}

/** Compute popover position (pane-relative) anchored near the annotation's first rect. */
function computePopoverPosition(
  annotationId: string,
  root: HTMLElement,
  computedRects: Record<string, Rect[]>
): { top: number; left: number } | null {
  const rects = computedRects[annotationId];
  if (!rects?.length) return null;
  const contentEl = root.querySelector<HTMLElement>(".max-w-2xl");
  if (!contentEl) return null;

  const paneRect = root.getBoundingClientRect();
  const contentRect = contentEl.getBoundingClientRect();
  const r = rects[0];

  // Convert first annotation rect to pane-relative coords
  const annTopInPane = contentRect.top - paneRect.top + r.top;
  const annRightInPane = contentRect.left - paneRect.left + r.left + r.width;
  const annLeftInPane = contentRect.left - paneRect.left + r.left;

  // Place right of highlight if it fits, otherwise left
  const rightOf = annRightInPane + 12;
  const fitsRight = rightOf + POPOVER_W < paneRect.width - 8;
  const left = fitsRight
    ? rightOf
    : Math.max(8, annLeftInPane - POPOVER_W - 12);

  // Vertically center on the annotation rect, clamped to pane
  const POPOVER_H = 180;
  const top = Math.max(
    40,
    Math.min(annTopInPane + r.height / 2 - POPOVER_H / 2, paneRect.height - POPOVER_H - 8)
  );

  return { top, left };
}

export function OERPreviewPane({
  annotations,
  criteria,
  oerType,
  versionMismatch,
  anchorVersionLabel,
  currentVersionLabel,
}: OERPreviewPaneProps) {
  const { viewingAnnotationId, openOerPane, closeOerPane } = useRevisionStore();
  const paneRef = useRef<HTMLDivElement>(null);

  const computedRectsRef = useRef<Record<string, Rect[]>>({});
  const [rectsReady, setRectsReady] = useState(false);
  const [popover, setPopover] = useState<PopoverState | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // Compute rects for ALL annotations once after MockOERRenderer paints
  useEffect(() => {
    setRectsReady(false);
    const rafId = requestAnimationFrame(() => {
      const root = paneRef.current;
      if (!root) return;
      const result: Record<string, Rect[]> = {};
      for (const ann of annotations) {
        const text = ann.anchor.selectedText?.trim();
        if (text && oerType === "mock") {
          const rects = findTextRects(root, text);
          if (rects.length) result[ann.id] = rects;
        } else if (ann.anchor.rects.length) {
          result[ann.id] = ann.anchor.rects;
        }
      }
      computedRectsRef.current = result;
      setRectsReady(true);
    });
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotations, oerType]);

  // Attach click + hover listeners to MockOERRenderer's scroll container
  useEffect(() => {
    if (!rectsReady) return;
    const root = paneRef.current;
    if (!root) return;
    const scrollEl = root.querySelector<HTMLElement>('[class*="overflow-y-auto"]');
    if (!scrollEl) return;

    function hitTest(e: MouseEvent): string | null {
      const contentEl = root!.querySelector<HTMLElement>(".max-w-2xl");
      if (!contentEl) return null;
      const cr = contentEl.getBoundingClientRect();
      const cx = e.clientX - cr.left;
      const cy = e.clientY - cr.top;
      for (const [id, rects] of Object.entries(computedRectsRef.current)) {
        for (const r of rects) {
          if (cx >= r.left && cx <= r.left + r.width && cy >= r.top && cy <= r.top + r.height)
            return id;
        }
      }
      return null;
    }

    function handleClick(e: MouseEvent) {
      const id = hitTest(e);
      if (!id) {
        setPopover(null);
        return;
      }
      openOerPane(id);
      setTooltip(null);
      const pos = computePopoverPosition(id, root!, computedRectsRef.current);
      if (pos) setPopover({ annotationId: id, ...pos, expanded: false });
    }

    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    function handleMouseMove(e: MouseEvent) {
      if (hoverTimer) clearTimeout(hoverTimer);
      const id = hitTest(e);
      // Don't show tooltip for the active annotation (popover is already available)
      if (!id || id === viewingAnnotationId) { setTooltip(null); return; }
      hoverTimer = setTimeout(() => setTooltip({ id, x: e.clientX, y: e.clientY }), 300);
    }
    function handleMouseLeave() {
      if (hoverTimer) clearTimeout(hoverTimer);
      setTooltip(null);
    }

    scrollEl.addEventListener("click", handleClick);
    scrollEl.addEventListener("mousemove", handleMouseMove);
    scrollEl.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      scrollEl.removeEventListener("click", handleClick);
      scrollEl.removeEventListener("mousemove", handleMouseMove);
      scrollEl.removeEventListener("mouseleave", handleMouseLeave);
      if (hoverTimer) clearTimeout(hoverTimer);
    };
  }, [rectsReady, openOerPane, viewingAnnotationId]);

  // Escape closes popover first; if no popover, FeedbackReport's handler closes the pane
  useEffect(() => {
    if (!popover) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        setPopover(null);
      }
    }
    document.addEventListener("keydown", handleKey, { capture: true });
    return () => document.removeEventListener("keydown", handleKey, { capture: true });
  }, [popover]);

  const displayAnnotations: IAnnotation[] = rectsReady
    ? annotations
        .filter((a) => computedRectsRef.current[a.id])
        .map((a) => ({ ...a, anchor: { ...a.anchor, rects: computedRectsRef.current[a.id] } }))
    : [];

  const notFound =
    rectsReady && !!viewingAnnotationId && !computedRectsRef.current[viewingAnnotationId];

  // Popover annotation + criterion data
  const popoverAnn = popover ? annotations.find((a) => a.id === popover.annotationId) : null;
  const popoverCrit = popoverAnn
    ? criteria.find((c) => c.criterionId === primaryCriterionId(popoverAnn))
    : null;

  return (
    <div ref={paneRef} className="relative h-full flex flex-col border-r border-outline-variant/20">

      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 bg-surface border-b border-outline-variant/20">
        <p className="text-xs font-semibold text-on-surface-variant">OER Preview</p>
        <button
          onClick={closeOerPane}
          className="text-on-surface-variant/60 hover:text-on-surface transition-colors"
          title="Close (Esc)"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Location not found banner */}
      {notFound && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-amber-50 border-b border-amber-200 text-xs text-amber-800">
          <span className="material-symbols-outlined text-[13px] align-middle mr-1">info</span>
          The exact annotation location could not be found. The content may have changed since this review.
        </div>
      )}

      {/* Version mismatch banner */}
      {versionMismatch && anchorVersionLabel && currentVersionLabel && (
        <div className="flex-shrink-0 px-3 py-1.5 bg-secondary-container/40 border-b border-outline-variant/20 text-xs text-on-surface">
          <span className="material-symbols-outlined text-[14px] align-middle mr-1 text-secondary">warning</span>
          Anchors based on <strong>{anchorVersionLabel}</strong>; locations may have shifted
          in <strong>{currentVersionLabel}</strong>.
        </div>
      )}

      {/* OER content */}
      <div className="flex-1 min-h-0">
        {oerType === "mock" ? (
          <MockOERRenderer
            annotations={displayAnnotations}
            activeAnnotationId={viewingAnnotationId}
            readOnly
          />
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-center bg-surface-container-low">
            <div>
              <span className="material-symbols-outlined text-[32px] text-secondary mb-2 block">link</span>
              <p className="text-sm text-on-surface-variant">External OER — preview unavailable</p>
            </div>
          </div>
        )}
      </div>

      {/* Click popover */}
      {popover && popoverAnn && (
        <div
          className="absolute z-40 bg-white rounded-lg shadow-lg border border-outline-variant/20 p-4 space-y-3"
          style={{ top: popover.top, left: popover.left, width: POPOVER_W }}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-gray-700 leading-snug">
              {primaryCriterionId(popoverAnn) ?? "Unlinked"}
              {popoverCrit && (
                <span className="font-normal text-gray-500">
                  {" · "}{popoverCrit.criterionTitle.length > 42
                    ? popoverCrit.criterionTitle.slice(0, 42) + "…"
                    : popoverCrit.criterionTitle}
                </span>
              )}
            </p>
            <button
              onClick={() => setPopover(null)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors mt-0.5"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>

          {/* Comment */}
          <div className="text-sm text-gray-600 leading-relaxed">
            {popoverAnn.comment.length > COMMENT_TRUNCATE && !popover.expanded ? (
              <>
                <p>"{popoverAnn.comment.slice(0, COMMENT_TRUNCATE)}…"</p>
                <button
                  onClick={() => setPopover((p) => p ? { ...p, expanded: true } : p)}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  Show more
                </button>
              </>
            ) : (
              <p>"{popoverAnn.comment}"</p>
            )}
          </div>

          {/* Footer */}
          <div className="pt-1 border-t border-gray-100">
            <button
              onClick={() => {
                setPopover(null);
                setTimeout(() => {
                  document
                    .getElementById(`annotation-${popoverAnn.id}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 50);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              ↗ View in report
            </button>
          </div>
        </div>
      )}

      {/* Hover tooltip — criterion label only, not shown for active annotation */}
      {tooltip && (() => {
        const paneRect = paneRef.current?.getBoundingClientRect();
        if (!paneRect) return null;
        const ann = annotations.find((a) => a.id === tooltip.id);
        const crit = criteria.find((c) => c.criterionId === (ann ? primaryCriterionId(ann) : undefined));
        const tx = tooltip.x - paneRect.left + 12;
        const ty = tooltip.y - paneRect.top - 8;
        return (
          <div
            className="absolute z-50 pointer-events-none bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow"
            style={{ left: Math.min(tx, paneRect.width - 160), top: Math.max(8, ty) }}
          >
            {ann ? primaryCriterionId(ann) ?? "Unlinked" : ""} · {crit?.criterionTitle?.slice(0, 40)}
          </div>
        );
      })()}
    </div>
  );
}
