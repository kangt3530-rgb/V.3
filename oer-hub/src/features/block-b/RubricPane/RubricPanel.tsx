import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IRubricTemplate, IAnnotation } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { CriterionCard } from "./CriterionCard";
import { FreeNoteBank } from "./FreeNoteBank";
import { Button } from "../../../components/ui/Button";

interface RubricPanelProps {
  template:                IRubricTemplate;
  activeAnnotationId:      string | null | undefined;
  onEvidenceClick:         (annotation: IAnnotation) => void;
  onRubricFocus:           () => void;
  onSubmit:                () => void;
  isSubmitting:            boolean;
  submitLabel?:            string;
  /** Per-criterion field refs that should show a red gap-check border. */
  criterionFlaggedFields?: Record<string, string[]>;
}

export function RubricPanel({
  template,
  activeAnnotationId,
  onEvidenceClick,
  onRubricFocus,
  onSubmit,
  isSubmitting,
  submitLabel,
  criterionFlaggedFields,
}: RubricPanelProps) {
  const allAnnotations             = useReviewStore((s) => s.annotations);
  const isCriterionAddressed       = useReviewStore((s) => s.isCriterionAddressed);
  const isReadyToSubmit            = useReviewStore((s) => s.isReadyToSubmit);
  const persistSessionNow          = useReviewStore((s) => s.persistSessionNow);
  const activeRubricTerms          = useReviewStore((s) => s.activeRubricTerms);
  const dispatchLookup             = useReviewStore((s) => s.dispatchLookup);

  function getAnnotationsForCriterion(criterionId: string) {
    return allAnnotations.filter((a) => {
      // New format: criterionIds array
      if (Array.isArray(a.criterionIds) && a.criterionIds.length > 0) {
        return a.criterionIds.includes(criterionId);
      }
      // Legacy format: single criterionId string
      const legacyId = (a as unknown as { criterionId?: string }).criterionId;
      return legacyId === criterionId;
    });
  }

  const panelRef    = useRef<HTMLDivElement>(null);
  const listRef     = useRef<HTMLDivElement>(null);
  const [lookupAnchor, setLookupAnchor] = useState<{ term: string; x: number; y: number } | null>(null);
  // seq changes each click so the card's useEffect re-fires even for the same criterion
  const [focusTrigger, setFocusTrigger] = useState<{ criterionId: string; seq: number } | null>(null);

  function scrollToFirstUnchosen() {
    const firstId = criteriaIds.find((id) => !isCriterionAddressed(id));
    if (!firstId) return;
    // Update trigger first so the card opens, then scroll after the DOM update
    setFocusTrigger({ criterionId: firstId, seq: Date.now() });
    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-criterion-id="${firstId}"]`);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function handleSubmitClick() {
    if (canSubmit) onSubmit();
    else scrollToFirstUnchosen();
  }

  // Detect term selection within the rubric panel
  useEffect(() => {
    function handleMouseUp() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) { setLookupAnchor(null); return; }

      // Don't trigger lookup when selecting inside buttons, textareas, or inputs
      const anchorNode = sel.anchorNode;
      const anchorEl = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
      if (anchorEl?.closest("button, textarea, input")) { setLookupAnchor(null); return; }

      const text = sel.toString().trim();
      if (!text || !activeRubricTerms.has(text.toLowerCase())) { setLookupAnchor(null); return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      setLookupAnchor({ term: text, x: rect.left + rect.width / 2, y: rect.top });
    }
    const panel = panelRef.current;
    if (!panel) return;
    panel.addEventListener("mouseup", handleMouseUp);
    return () => panel.removeEventListener("mouseup", handleMouseUp);
  }, [activeRubricTerms]);

  // Dismiss chip on outside click
  useEffect(() => {
    if (!lookupAnchor) return;
    function handleMouseDown(e: MouseEvent) {
      if (!(e.target as Element).closest("[data-lookup-chip]")) setLookupAnchor(null);
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [lookupAnchor]);

  const criteriaIds     = template.criteria.map((c) => c.id);
  const completedCount  = criteriaIds.filter((id) => isCriterionAddressed(id)).length;
  const totalCount      = criteriaIds.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const canSubmit       = isReadyToSubmit(criteriaIds);

  return (
    <>
    <div
      ref={panelRef}
      className="h-full flex flex-col bg-surface-container-high overflow-hidden"
      onFocus={onRubricFocus}
      onClick={onRubricFocus}
    >
      {/* Panel header */}
      <div className="flex-shrink-0 px-6 py-4 bg-surface-container">
        <div className="flex items-center justify-between mb-1">
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            {template.name}
          </p>
          <span className="text-label-sm font-label text-on-surface-variant">
            {completedCount}/{totalCount} Evaluated
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-secondary rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Free Note Bank — sticky above scrollable criteria list */}
      <FreeNoteBank rubricTemplate={template} onAnnotationClick={onEvidenceClick} />

      {/* Scrollable criteria list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {template.criteria.map((criterion) => (
          <CriterionCard
            key={criterion.id}
            criterion={criterion}
            annotations={getAnnotationsForCriterion(criterion.id)}
            activeAnnotationId={activeAnnotationId}
            onEvidenceClick={onEvidenceClick}
            onFocus={onRubricFocus}
            flaggedFields={criterionFlaggedFields?.[criterion.id]}
            focusTrigger={focusTrigger?.criterionId === criterion.id ? focusTrigger.seq : undefined}
          />
        ))}
      </div>

      {/* Submission footer */}
      <div className="flex-shrink-0 px-6 py-4 bg-surface-container space-y-3">
        {completedCount < totalCount && (
          <p className="text-body-sm text-on-surface-variant">
            {totalCount - completedCount} criteria remaining.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" icon="save" type="button" onClick={() => persistSessionNow()}>
            Save Draft
          </Button>
          <Button
            size="sm"
            icon={canSubmit ? "check_circle" : "arrow_downward"}
            iconPosition="right"
            disabled={isSubmitting}
            onClick={handleSubmitClick}
            className="flex-1 justify-center"
          >
            {submitLabel ?? "Submit Review"}
          </Button>
        </div>
      </div>
    </div>

    {lookupAnchor && createPortal(
      <button
        data-lookup-chip
        style={{ position: "fixed", left: lookupAnchor.x, top: lookupAnchor.y - 44, transform: "translateX(-50%)" }}
        onClick={() => {
          dispatchLookup(lookupAnchor.term);
          window.getSelection()?.removeAllRanges();
          setLookupAnchor(null);
        }}
        className="z-50 flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-on-secondary text-label-sm font-label font-semibold uppercase tracking-widest rounded shadow-lg hover:opacity-90 transition-opacity"
      >
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
        Look Up
      </button>,
      document.body
    )}
    </>
  );
}
