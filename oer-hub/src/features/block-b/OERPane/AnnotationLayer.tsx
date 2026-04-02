import {
  useRef,
  useState,
  type RefObject,
  type MouseEvent,
} from "react";
import type { IAnnotation, IRubricTemplate } from "../../../api/types";
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
  const [selection, setSelection] = useState<SelectionState | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

    const range   = sel.getRangeAt(0);
    const rawRects = Array.from(range.getClientRects());
    const rects   = rawRects.map((r) => ({
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

  return (
    <>
      {/* Transparent capture overlay */}
      <div
        ref={overlayRef}
        onMouseUp={handleMouseUp}
        className="absolute inset-0"
        style={{ pointerEvents: annotationMode ? "auto" : "none", zIndex: 10 }}
      >
        {/* Existing annotation highlights */}
        {annotations.map((ann) =>
          ann.anchor.rects.map((rect, i) => (
            <div
              key={`${ann.id}-${i}`}
              className={[
                "absolute annotation-highlight",
                activeAnnotationId === ann.id ? "active" : "",
              ].join(" ")}
              style={{
                top:    rect.top,
                left:   rect.left,
                width:  rect.width,
                height: rect.height,
              }}
              title={ann.comment}
            />
          ))
        )}

        {/* Current selection highlights */}
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

      {/* Annotation creation popover */}
      {selection && (
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
    </>
  );
}
