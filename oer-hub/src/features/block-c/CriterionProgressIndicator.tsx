interface CriterionProgressIndicatorProps {
  handled: number;
  total: number;
}

export function CriterionProgressIndicator({ handled, total }: CriterionProgressIndicatorProps) {
  if (total === 0) return null;
  const done = handled >= total;
  return (
    <span
      className={[
        "text-[11px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0",
        done
          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
          : "bg-surface-container border-outline-variant/30 text-on-surface-variant/60",
      ].join(" ")}
    >
      {handled}/{total} handled
    </span>
  );
}
