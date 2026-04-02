import type { IRubricTemplate, IAnnotation } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { CriterionCard } from "./CriterionCard";
import { Button } from "../../../components/ui/Button";

interface RubricPanelProps {
  template:           IRubricTemplate;
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
  onRubricFocus:      () => void;        // triggers adaptive 5:5 layout
  onSubmit:           () => void;
  isSubmitting:       boolean;
}

export function RubricPanel({
  template,
  activeAnnotationId,
  onEvidenceClick,
  onRubricFocus,
  onSubmit,
  isSubmitting,
}: RubricPanelProps) {
  const getAnnotationsForCriterion = useReviewStore((s) => s.getAnnotationsForCriterion);
  const ratings        = useReviewStore((s) => s.ratings);
  const isReadyToSubmit = useReviewStore((s) => s.isReadyToSubmit);

  const criteriaIds     = template.criteria.map((c) => c.id);
  const completedCount  = criteriaIds.filter((id) => ratings[id]?.rating != null).length;
  const totalCount      = criteriaIds.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const canSubmit       = isReadyToSubmit(criteriaIds);

  return (
    <div
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

      {/* Scrollable criteria list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {template.criteria.map((criterion) => (
          <CriterionCard
            key={criterion.id}
            criterion={criterion}
            annotations={getAnnotationsForCriterion(criterion.id)}
            activeAnnotationId={activeAnnotationId}
            onEvidenceClick={onEvidenceClick}
            onFocus={onRubricFocus}
          />
        ))}
      </div>

      {/* Submission footer */}
      <div className="flex-shrink-0 px-6 py-4 bg-surface-container space-y-3">
        {/* Completeness feedback */}
        {!canSubmit && completedCount === totalCount && (
          <p className="text-body-sm text-error flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Some flagged criteria require evidence before submission.
          </p>
        )}
        {completedCount < totalCount && (
          <p className="text-body-sm text-on-surface-variant">
            {totalCount - completedCount} criteria remaining.
          </p>
        )}

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" icon="save">
            Save Draft
          </Button>
          <Button
            size="sm"
            icon="check_circle"
            iconPosition="right"
            disabled={!canSubmit || isSubmitting}
            onClick={onSubmit}
            className="flex-1 justify-center"
          >
            {isSubmitting ? "Submitting…" : "Finalize Review"}
          </Button>
        </div>
      </div>
    </div>
  );
}
