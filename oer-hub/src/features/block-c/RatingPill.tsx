import type { CriterionRatingSummary } from "../../api/types";

const CONFIG: Record<CriterionRatingSummary, { label: string; cls: string }> = {
  needs_improvement: { label: "Needs Improvement", cls: "bg-amber-100 text-amber-800" },
  proficient:        { label: "Proficient",        cls: "bg-emerald-100 text-emerald-800" },
  exceeds:           { label: "Exceeds",           cls: "bg-sky-100 text-sky-800" },
  mixed:             { label: "Mixed",             cls: "bg-orange-100 text-orange-800" },
};

export function RatingPill({ summary }: { summary: CriterionRatingSummary }) {
  const { label, cls } = CONFIG[summary] ?? CONFIG.proficient;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0 ${cls}`}>
      {label}
    </span>
  );
}
