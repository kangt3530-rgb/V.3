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

interface TooltipState {
  id: string;
  x: number;
  y: number;
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

  // computedRectsRef holds annotationId → content-relative rects for all annotations.
  // Used by both MockOERRenderer (display) and the hit-test event handlers.
  const computedRectsRef = useRef<Record<string, Rect[]>>({});
  const [rectsReady, setRectsReady] = useState(false);
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
      if (id) openOerPane(id);
    }

    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    function handleMouseMove(e: MouseEvent) {
      if (hoverTimer) clearTimeout(hoverTimer);
      const id = hitTest(e);
      if (!id) { setTooltip(null); return; }
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
  }, [rectsReady, openOerPane]);

  // All annotations with their computed rects — passed to MockOERRenderer for rendering.
  // MockOERRenderer applies .active CSS class to the one matching activeAnnotationId.
  const displayAnnotations: IAnnotation[] = rectsReady
    ? annotations
        .filter((a) => computedRectsRef.current[a.id])
        .map((a) => ({ ...a, anchor: { ...a.anchor, rects: computedRectsRef.current[a.id] } }))
    : [];

  const notFound =
    rectsReady && !!viewingAnnotationId && !computedRectsRef.current[viewingAnnotationId];

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

      {/* Annotation hover tooltip */}
      {tooltip && (() => {
        const paneRect = paneRef.current?.getBoundingClientRect();
        if (!paneRect) return null;
        const ann = annotations.find((a) => a.id === tooltip.id);
        const crit = criteria.find((c) => c.criterionId === ann?.criterionId);
        const tx = tooltip.x - paneRect.left + 12;
        const ty = tooltip.y - paneRect.top - 8;
        return (
          <div
            className="absolute z-50 pointer-events-none bg-gray-800 text-white text-xs rounded-md px-2.5 py-2 max-w-[220px] shadow-lg"
            style={{ left: Math.min(tx, paneRect.width - 228), top: Math.max(8, ty) }}
          >
            <p className="font-semibold truncate">
              {ann?.criterionId} · {crit?.criterionTitle?.slice(0, 40)}
            </p>
            <p className="text-white/80 mt-0.5 line-clamp-2">
              {ann?.comment?.slice(0, 80)}{(ann?.comment?.length ?? 0) > 80 ? "…" : ""}
            </p>
            <p className="text-white/50 mt-1">Click to view in report</p>
          </div>
        );
      })()}
    </div>
  );
}
