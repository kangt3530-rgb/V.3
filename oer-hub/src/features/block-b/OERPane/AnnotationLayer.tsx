import {
  useRef,
  useState,
  type RefObject,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { IAnnotation, IRubricTemplate } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { AnnotationPopover } from "./AnnotationPopover";

interface AnnotationLayerProps {
  containerRef:       RefObject<HTMLDivElement | null>;
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  annotationMode:     boolean;
  type:               "web" | "pdf";
  rubricTemplate?:    IRubricTemplate;
}

interface SelectionState {
  selectedText: string;
  rects: { top: number; left: number; width: number; height: number }[];
  x: number;
  y: number;
}

export function AnnotationLayer({
  containerRef,
  annotations,
  activeAnnotationId,
  annotationMode,
  type,
  rubricTemplate,
}: AnnotationLayerProps) {
  const [selection, setSelection]       = useState<SelectionState | null>(null);
  const [toolbarAnnId, setToolbarAnnId] = useState<string | null>(null);
  const [editingAnn, setEditingAnn]     = useState<IAnnotation | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const removeAnnotation = useReviewStore((s) => s.removeAnnotation);

  function handleMouseUp(e: MouseEvent) {
    if (!annotationMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    const range    = sel.getRangeAt(0);
    const rawRects = Array.from(range.getClientRects());
    const rects    = rawRects.map((r) => ({
      top:    r.top    - containerRect.top,
      left:   r.left   - containerRect.left,
      width:  r.width,
      height: r.height,
    }));

    setSelection({
      selectedText: sel.toString().trim(),
      rects,
      x: e.clientX - containerRect.left,
      y: e.clientY - containerRect.top,
    });
  }

  // Compute fixed (page-level) position for the toolbar using container offset
  function toolbarFixedPos(ann: IAnnotation): { top: number; left: number } {
    const container = containerRef.current;
    if (!container || !ann.anchor.rects.length) return { top: 8, left: 8 };
    const cr    = container.getBoundingClientRect();
    const first = ann.anchor.rects[0];
    return {
      top:  Math.max(8, cr.top  + first.top  - 44),
      left: Math.max(8, cr.left + first.left),
    };
  }

  const toolbarAnnotation = toolbarAnnId
    ? annotations.find((a) => a.id === toolbarAnnId) ?? null
    : null;

  return (
    <>
      {/* Transparent capture overlay — only active in annotation mode */}
      <div
        ref={overlayRef}
        onMouseUp={handleMouseUp}
        className="absolute inset-0"
        style={{ pointerEvents: annotationMode ? "auto" : "none", zIndex: 10 }}
      >
        {/* Existing annotation highlights
            IMPORTANT: pointerEvents "auto" overrides the parent's "none" so highlights
            are always clickable even when annotationMode is off. */}
        {annotations.map((ann) =>
          ann.anchor.rects.map((rect, i) => (
            <div
              key={`${ann.id}-${i}`}
              className={[
                "absolute annotation-highlight",
                activeAnnotationId === ann.id ? "active" : "",
              ].join(" ")}
              style={{
                top:           rect.top,
                left:          rect.left,
                width:         rect.width,
                height:        rect.height,
                cursor:        "pointer",
                pointerEvents: "auto",   // always clickable
              }}
              title={ann.comment}
              onClick={(e) => {
                e.stopPropagation();
                setToolbarAnnId((prev) => prev === ann.id ? null : ann.id);
                setEditingAnn(null);
              }}
            />
          ))
        )}

        {/* Current selection highlight preview */}
        {selection?.rects.map((rect, i) => (
          <div
            key={`sel-${i}`}
            className="absolute"
            style={{
              top:             rect.top,
              left:            rect.left,
              width:           rect.width,
              height:          rect.height,
              backgroundColor: "rgba(254, 214, 91, 0.55)",
              pointerEvents:   "none",
            }}
          />
        ))}
      </div>

      {/* Floating edit/delete toolbar — rendered in a portal at fixed position
          so it's never clipped by the overlay's z-index or pointer-events */}
      {toolbarAnnotation && !editingAnn && createPortal(
        <div
          className="fixed z-[9999] flex items-center gap-1 px-2 py-1 bg-surface-container-lowest shadow-ambient rounded-sm border border-outline-variant/30"
          style={toolbarFixedPos(toolbarAnnotation)}
        >
          <span className="text-[10px] font-label text-on-surface-variant/60 mr-1 max-w-[140px] truncate">
            "{toolbarAnnotation.anchor.selectedText.slice(0, 35)}{toolbarAnnotation.anchor.selectedText.length > 35 ? "…" : ""}"
          </span>
          <button
            type="button"
            onClick={() => { setEditingAnn(toolbarAnnotation); setToolbarAnnId(null); }}
            className="flex items-center gap-1 px-2 py-1 rounded-sm border border-outline-variant/40 text-on-surface-variant/70 hover:border-secondary hover:text-secondary transition-colors text-[11px] font-label font-semibold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[12px]">edit</span>
            Edit
          </button>
          <button
            type="button"
            onClick={() => { removeAnnotation(toolbarAnnotation.id); setToolbarAnnId(null); }}
            className="flex items-center gap-1 px-2 py-1 rounded-sm border border-error/30 text-error/60 hover:border-error hover:text-error transition-colors text-[11px] font-label font-semibold uppercase tracking-widest"
          >
            <span className="material-symbols-outlined text-[12px]">delete</span>
            Delete
          </button>
          <button
            type="button"
            onClick={() => setToolbarAnnId(null)}
            className="ml-0.5 text-on-surface-variant/30 hover:text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">close</span>
          </button>
        </div>,
        document.body
      )}

      {/* New annotation creation popover */}
      {selection && !editingAnn && (
        <AnnotationPopover
          containerRef={containerRef}
          selectedText={selection.selectedText}
          rects={selection.rects}
          anchorType={type}
          popoverX={selection.x}
          popoverY={selection.y}
          rubricTemplate={rubricTemplate}
          onSave={() => setSelection(null)}
          onCancel={() => setSelection(null)}
        />
      )}

      {/* Edit existing annotation popover */}
      {editingAnn && (
        <AnnotationPopover
          containerRef={containerRef}
          selectedText={editingAnn.anchor.selectedText}
          rects={editingAnn.anchor.rects}
          anchorType={editingAnn.anchor.type}
          popoverX={editingAnn.anchor.rects[0]?.left ?? 0}
          popoverY={editingAnn.anchor.rects[0]?.top ?? 0}
          rubricTemplate={rubricTemplate}
          editAnnotation={editingAnn}
          onSave={() => setEditingAnn(null)}
          onCancel={() => setEditingAnn(null)}
        />
      )}
    </>
  );
}
