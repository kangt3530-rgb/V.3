type FilterTab = "all" | "actionable" | "notes";

interface CriterionFilterPillsProps {
  total: number;
  actionableCount: number;
  notesCount: number;
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
}

export function CriterionFilterPills({
  total,
  actionableCount,
  notesCount,
  active,
  onChange,
}: CriterionFilterPillsProps) {
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all",        label: "All",        count: total },
    { key: "actionable", label: "Actionable", count: actionableCount },
    { key: "notes",      label: "Notes",      count: notesCount },
  ];

  return (
    <div className="flex gap-1">
      {tabs.map(({ key, label, count }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={[
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all",
              isActive
                ? "bg-primary/10 border-primary/40 text-primary"
                : "border-outline-variant/30 text-on-surface-variant/50 hover:border-outline-variant hover:text-on-surface-variant",
            ].join(" ")}
          >
            {label}
            <span className={`rounded-full px-1 text-[10px] font-bold ${isActive ? "bg-primary/15" : "bg-outline-variant/20"}`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
