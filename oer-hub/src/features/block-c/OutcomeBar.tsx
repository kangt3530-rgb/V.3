import type { IAggregatedCriterionFeedback, CriterionRatingSummary } from "../../api/types";

const DOT_COLOR: Record<CriterionRatingSummary, string> = {
  needs_improvement: "text-amber-500",
  proficient:        "text-emerald-500",
  exceeds:           "text-sky-500",
  mixed:             "text-orange-500",
};

const SEG_COLOR: Record<CriterionRatingSummary, string> = {
  needs_improvement: "bg-amber-400",
  proficient:        "bg-emerald-400",
  exceeds:           "bg-sky-400",
  mixed:             "bg-orange-400",
};

interface OutcomeBarProps {
  criteria: IAggregatedCriterionFeedback[];
  compact?: boolean;
}

export function OutcomeBar({ criteria, compact = false }: OutcomeBarProps) {
  const total = criteria.length;
  const proficientCount = criteria.filter((c) => c.ratingSummary === "proficient").length;
  const niCount = criteria.filter((c) => c.ratingSummary === "needs_improvement").length;
  const exceedsCount = criteria.filter((c) => c.ratingSummary === "exceeds").length;

  return (
    <div className="space-y-2">
      {compact ? (
        <div className="flex items-center gap-0.5">
          {criteria.map((c) => (
            <span key={c.criterionId} className={`text-base leading-none ${DOT_COLOR[c.ratingSummary]}`}>
              ●
            </span>
          ))}
        </div>
      ) : (
        <div className="flex h-3 rounded-lg overflow-hidden">
          {criteria.map((c) => (
            <div
              key={c.criterionId}
              title={`${c.criterionId}: ${c.ratingSummary.replace("_", " ")}`}
              className={`flex-1 ${SEG_COLOR[c.ratingSummary]}`}
            />
          ))}
        </div>
      )}
      <p className="text-sm text-on-surface-variant">
        {proficientCount} of {total} criteria proficient
        {niCount > 0 && <> · <span className="text-amber-700">{niCount} need improvement</span></>}
        {exceedsCount > 0 && <> · <span className="text-sky-700">{exceedsCount} exceed standard</span></>}
      </p>
    </div>
  );
}
