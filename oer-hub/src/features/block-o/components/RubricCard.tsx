/**
 * RubricCard — multi-select card for the Rubric Specialization screen.
 * Renders in a 2-column grid. Uses a visually-hidden checkbox.
 */

interface RubricCardProps {
  id: string;
  label: string;
  description: string;
  selected: boolean;
  onChange: (selected: boolean) => void;
}

export function RubricCard({
  id,
  label,
  description,
  selected,
  onChange,
}: RubricCardProps) {
  return (
    <label
      htmlFor={id}
      className={[
        "relative flex flex-col gap-2 rounded-[10px] border p-4 transition-colors",
        "cursor-pointer select-none",
        selected
          ? "border-ink-black bg-tinted-selected"
          : "border-ghost-border bg-parchment hover:border-slate-gray hover:bg-[#faf9f4]",
      ].join(" ")}
    >
      {/* Visually-hidden checkbox */}
      <input
        id={id}
        type="checkbox"
        checked={selected}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        aria-describedby={`${id}-desc`}
      />

      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[14px] font-medium text-ink-black leading-snug">
          {label}
        </p>
        {/* Circular check indicator */}
        <span
          className={[
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            selected
              ? "border-ink-black bg-ink-black"
              : "border-ghost-border bg-parchment",
          ].join(" ")}
          aria-hidden="true"
        >
          {selected && (
            <span
              className="material-symbols-outlined text-[12px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              check
            </span>
          )}
        </span>
      </div>

      {/* Description */}
      <p
        id={`${id}-desc`}
        className="text-[12px] text-slate-gray leading-relaxed"
      >
        {description}
      </p>
    </label>
  );
}
