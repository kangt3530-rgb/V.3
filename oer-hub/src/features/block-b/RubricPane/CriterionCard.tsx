import { useState } from "react";
import type { IRubricCriterion, IAnnotation, RatingValue } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { EvidenceBank } from "./EvidenceBank";

interface CriterionCardProps {
  criterion:          IRubricCriterion;
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
  onFocus:            () => void;
}

const RATING_CONFIG: {
  value: RatingValue;
  label: string;
  cls: string;
  activeCls: string;
}[] = [
  {
    value:     "needs_improvement",
    label:     "Needs Improvement",
    cls:       "border-error/30 text-error hover:bg-error-container/30",
    activeCls: "bg-error-container border-error text-error",
  },
  {
    value:     "proficient",
    label:     "Proficient",
    cls:       "border-outline-variant text-on-surface-variant hover:bg-surface-container",
    activeCls: "bg-primary text-on-primary border-primary",
  },
  {
    value:     "exceeds",
    label:     "Exceeds",
    cls:       "border-secondary/40 text-secondary hover:bg-secondary-container/30",
    activeCls: "bg-secondary-container border-secondary text-secondary",
  },
];

export function CriterionCard({
  criterion,
  annotations,
  activeAnnotationId,
  onEvidenceClick,
  onFocus,
}: CriterionCardProps) {
  const [open, setOpen] = useState(false);

  const setRating              = useReviewStore((s) => s.setRating);
  const setNeedsImprovementText = useReviewStore((s) => s.setNeedsImprovementText);
  const setExceedsText         = useReviewStore((s) => s.setExceedsText);
  const ratingData             = useReviewStore((s) => s.ratings[criterion.id]);

  const currentRating = ratingData?.rating ?? null;
  const evidenceCount = annotations.length;
  const isCompleted   = currentRating !== null;

  const needsEvidence =
    (currentRating === "needs_improvement" || currentRating === "exceeds") &&
    evidenceCount === 0;

  function handleRating(value: RatingValue) {
    setRating(criterion.id, value);
    if (!open) {
      setOpen(true);
      onFocus();
    }
  }

  return (
    <div
      className={[
        "rounded-sm overflow-hidden transition-all",
        isCompleted ? "bg-surface-container-lowest shadow-card" : "bg-surface-container-low",
      ].join(" ")}
    >
      {/* Accordion header */}
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) onFocus();
        }}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-surface-container/50 transition-colors"
      >
        {/* Completion indicator */}
        <div
          className={[
            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
            isCompleted
              ? "bg-secondary border-secondary"
              : "border-outline-variant bg-transparent",
          ].join(" ")}
        >
          {isCompleted && (
            <span className="material-symbols-outlined text-on-secondary text-[12px]">check</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
            {criterion.id}
          </p>
          <p className="text-body-md font-semibold text-on-surface leading-snug truncate">
            {criterion.title}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Evidence count badge */}
          {evidenceCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 text-secondary rounded-full text-label-sm font-label font-semibold">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
              {evidenceCount}
            </span>
          )}
          {currentRating && (
            <RatingPill rating={currentRating} />
          )}
          <span className="material-symbols-outlined text-on-surface-variant text-[20px] transition-transform" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
            expand_more
          </span>
        </div>
      </button>

      {/* Accordion body */}
      {open && (
        <div className="px-5 pb-5 space-y-5">
          {/* PRD B.9: Single-Point Rubric — 3-column grid */}
          <div className="grid grid-cols-3 gap-px bg-outline-variant/10 rounded-sm overflow-hidden">
            {/* Left: Needs Improvement */}
            <div className="bg-surface-container p-4">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-error mb-3">
                Needs Improvement
              </p>
              <p className="text-body-sm text-on-surface-variant mb-3 italic">
                {criterion.needsImprovementPrompt}
              </p>
              {currentRating === "needs_improvement" && (
                <textarea
                  value={ratingData?.needsImprovementText ?? ""}
                  onChange={(e) => setNeedsImprovementText(criterion.id, e.target.value)}
                  placeholder="Describe what needs improvement…"
                  rows={4}
                  className="w-full text-body-sm text-on-surface bg-transparent border-0 border-b border-outline-variant focus:border-secondary outline-none resize-none placeholder:text-on-surface-variant/50 transition-colors"
                />
              )}
            </div>

            {/* Center: Proficient Standard */}
            <div className="bg-surface-container-low p-4">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-3">
                Proficient Standard
              </p>
              <p className="text-body-sm text-on-surface leading-relaxed">
                {criterion.standard}
              </p>
            </div>

            {/* Right: Exceeds */}
            <div className="bg-surface-container p-4">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary mb-3">
                Exceeds
              </p>
              <p className="text-body-sm text-on-surface-variant mb-3 italic">
                {criterion.exceedsPrompt}
              </p>
              {currentRating === "exceeds" && (
                <textarea
                  value={ratingData?.exceedsText ?? ""}
                  onChange={(e) => setExceedsText(criterion.id, e.target.value)}
                  placeholder="Describe how it exceeds the standard…"
                  rows={4}
                  className="w-full text-body-sm text-on-surface bg-transparent border-0 border-b border-secondary/40 focus:border-secondary outline-none resize-none placeholder:text-on-surface-variant/50 transition-colors"
                />
              )}
            </div>
          </div>

          {/* Rating buttons */}
          <div>
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
              Select Rating
            </p>
            <div className="flex gap-2">
              {RATING_CONFIG.map(({ value, label, cls, activeCls }) => (
                <button
                  key={value}
                  onClick={() => handleRating(value)}
                  className={[
                    "flex-1 py-2.5 border-2 rounded-sm text-label-md font-label font-semibold uppercase tracking-widest transition-all",
                    currentRating === value ? activeCls : cls,
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence enforcement warning */}
          {needsEvidence && (
            <div className="flex items-start gap-2 p-3 bg-error-container/30 rounded-sm">
              <span className="material-symbols-outlined text-error text-[16px] mt-0.5">warning</span>
              <p className="text-body-sm text-error">
                Evidence is required for "{currentRating === "needs_improvement" ? "Needs Improvement" : "Exceeds"}" ratings.
                Highlight text in the OER pane and save at least one annotation for this criterion.
              </p>
            </div>
          )}

          {/* Evidence Bank */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                Evidence Bank
                {evidenceCount > 0 && (
                  <span className="ml-2 text-secondary">({evidenceCount})</span>
                )}
              </p>
            </div>
            <EvidenceBank
              annotations={annotations}
              activeAnnotationId={activeAnnotationId}
              onEvidenceClick={onEvidenceClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RatingPill({ rating }: { rating: RatingValue }) {
  const map: Record<RatingValue, { label: string; cls: string }> = {
    needs_improvement: { label: "Needs Improvement", cls: "bg-error-container text-error" },
    proficient:        { label: "Proficient",         cls: "bg-primary text-on-primary" },
    exceeds:           { label: "Exceeds",            cls: "bg-secondary-container text-secondary" },
  };
  const { label, cls } = map[rating];
  return (
    <span className={`px-2 py-0.5 text-label-sm font-label font-semibold uppercase tracking-widest rounded-full ${cls}`}>
      {label}
    </span>
  );
}
