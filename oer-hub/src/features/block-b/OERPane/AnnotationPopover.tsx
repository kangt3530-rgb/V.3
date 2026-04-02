import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useReviewStore } from "../../../store/reviewStore";
import type { IRubricTemplate } from "../../../api/types";

interface AnnotationPopoverProps {
  containerRef:  RefObject<HTMLDivElement | null>;
  selectedText:  string;
  rects:         { top: number; left: number; width: number; height: number }[];
  anchorType:    "web" | "pdf";
  popoverX:      number;
  popoverY:      number;
  rubricTemplate?: IRubricTemplate;
  onSave:        () => void;
  onCancel:      () => void;
}

const POPOVER_W = 320;
const POPOVER_H = 260;

export function AnnotationPopover({
  containerRef,
  selectedText,
  rects,
  anchorType,
  popoverX,
  popoverY,
  rubricTemplate,
  onSave,
  onCancel,
}: AnnotationPopoverProps) {
  const addAnnotation = useReviewStore((s) => s.addAnnotation);
  const taskId        = useReviewStore((s) => s.taskId);

  const [criterionId, setCriterionId] = useState("");
  const [comment, setComment]         = useState("");
  const [error, setError]             = useState("");

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  // Clamp position so popover stays inside container (imperative DOM update, no setState)
  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    let left = popoverX + 8;
    let top  = popoverY + 8;
    if (containerRect) {
      if (left + POPOVER_W > containerRect.width)  left = popoverX - POPOVER_W - 8;
      if (top  + POPOVER_H > containerRect.height) top  = popoverY - POPOVER_H - 8;
    }
    el.style.left = `${Math.max(8, left)}px`;
    el.style.top  = `${Math.max(8, top)}px`;
  }, [containerRef, popoverX, popoverY]);

  function handleSave() {
    if (!criterionId) { setError("Please select a criterion to link this evidence."); return; }
    if (!comment.trim()) { setError("Please add a comment explaining this annotation."); return; }

    addAnnotation({
      id:          `ann-${Date.now()}`,
      taskId,
      criterionId,
      comment:     comment.trim(),
      createdAt:   new Date().toISOString(),
      anchor: {
        type:         anchorType,
        selectedText: selectedText.slice(0, 300),
        rects,
      },
    });
    onSave();
  }

  // Use a hardcoded fallback list when no rubric template is loaded yet
  const criteriaOptions = rubricTemplate?.criteria ?? [];

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 w-80 bg-surface-container-lowest shadow-ambient rounded-md overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between">
        <div>
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            Add Annotation
          </p>
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1 italic">
            "{selectedText.slice(0, 50)}{selectedText.length > 50 ? "…" : ""}"
          </p>
        </div>
        <button onClick={onCancel} className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Criterion selector */}
        <div>
          <label className="block text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
            Link to Criterion
          </label>
          <select
            value={criterionId}
            onChange={(e) => { setCriterionId(e.target.value); setError(""); }}
            className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-secondary outline-none pb-1 text-body-md text-on-surface transition-colors"
          >
            <option value="">Select criterion…</option>
            {criteriaOptions.map((c) => (
              <option key={c.id} value={c.id}>{c.id}: {c.title}</option>
            ))}
          </select>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
            Evidence Comment
          </label>
          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); setError(""); }}
            placeholder="Describe what this evidence shows…"
            rows={3}
            className="w-full bg-transparent border-0 border-b-2 border-outline-variant focus:border-secondary outline-none pb-1 text-body-md text-on-surface placeholder:text-on-surface-variant/50 resize-none transition-colors"
          />
        </div>

        {error && <p className="text-body-sm text-error">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-primary text-on-primary rounded-sm text-label-md font-label font-semibold uppercase tracking-widest hover:bg-primary-container transition-colors"
          >
            Save Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
