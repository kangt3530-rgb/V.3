import type {
  IAggregatedCriterionFeedback,
  ICriterionResponse,
  CriterionRatingSummary,
  RevisionStatus,
} from "../../api/types";
import { useRevisionStore } from "../../store/revisionStore";

interface FilterChipsProps {
  criteria: IAggregatedCriterionFeedback[];
  responses: ICriterionResponse[];
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors whitespace-nowrap ${
        active
          ? "bg-primary text-on-primary border-primary"
          : "bg-transparent text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
      }`}
    >
      {label}
    </button>
  );
}

function computeVisible(
  criteria: IAggregatedCriterionFeedback[],
  responses: ICriterionResponse[],
  activeRatingFilters: CriterionRatingSummary[],
  activeStatusFilters: RevisionStatus[]
): number {
  if (!activeRatingFilters.length && !activeStatusFilters.length) return criteria.length;
  return criteria.filter((c) => {
    const ratingOk =
      !activeRatingFilters.length || activeRatingFilters.includes(c.ratingSummary);
    const resp = responses.find((r) => r.criterionId === c.criterionId);
    const status: RevisionStatus = resp?.status ?? "unresolved";
    const statusOk = !activeStatusFilters.length || activeStatusFilters.includes(status);
    return ratingOk && statusOk;
  }).length;
}

export function FilterChips({ criteria, responses }: FilterChipsProps) {
  const {
    activeRatingFilters,
    activeStatusFilters,
    toggleRatingFilter,
    toggleStatusFilter,
    clearFilters,
  } = useRevisionStore();

  const anyActive = activeRatingFilters.length > 0 || activeStatusFilters.length > 0;
  const visibleCount = computeVisible(criteria, responses, activeRatingFilters, activeStatusFilters);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <span className="text-xs text-on-surface-variant shrink-0">Rating</span>
      <Chip
        label="NI"
        active={activeRatingFilters.includes("needs_improvement")}
        onClick={() => toggleRatingFilter("needs_improvement")}
      />
      <Chip
        label="Proficient"
        active={activeRatingFilters.includes("proficient")}
        onClick={() => toggleRatingFilter("proficient")}
      />
      <Chip
        label="Exceeds"
        active={activeRatingFilters.includes("exceeds")}
        onClick={() => toggleRatingFilter("exceeds")}
      />
      <span className="text-outline-variant/60 mx-0.5 shrink-0">·</span>
      <span className="text-xs text-on-surface-variant shrink-0">Response</span>
      <Chip
        label="Unresolved"
        active={activeStatusFilters.includes("unresolved")}
        onClick={() => toggleStatusFilter("unresolved")}
      />
      <Chip
        label="Resolved"
        active={activeStatusFilters.includes("resolved")}
        onClick={() => toggleStatusFilter("resolved")}
      />
      <Chip
        label="Awaiting"
        active={activeStatusFilters.includes("awaiting_clarification")}
        onClick={() => toggleStatusFilter("awaiting_clarification")}
      />
      <span className="text-xs text-on-surface-variant/60 ml-1 shrink-0">
        {visibleCount}/{criteria.length}
        {anyActive && (
          <button
            onClick={clearFilters}
            className="ml-1.5 underline hover:text-primary transition-colors"
          >
            Clear
          </button>
        )}
      </span>
    </div>
  );
}
