/**
 * RadioCard — single-select option card (e.g. Reviewer Type screen).
 * Renders as a styled <label> wrapping a visually-hidden <input type="radio">.
 */

interface RadioCardProps {
  id: string;
  name: string; // radio group name
  icon: string; // Material Symbols icon name
  title: string;
  description: string;
  selected: boolean;
  onChange: () => void;
}

export function RadioCard({
  id,
  name,
  icon,
  title,
  description,
  selected,
  onChange,
}: RadioCardProps) {
  return (
    <label
      htmlFor={id}
      className={[
        "relative flex items-start gap-4 rounded-[10px] border p-5 transition-colors",
        "cursor-pointer select-none",
        selected
          ? "border-ink-black bg-tinted-selected"
          : "border-ghost-border bg-parchment hover:border-slate-gray hover:bg-[#faf9f4]",
      ].join(" ")}
    >
      {/* Visually-hidden native radio */}
      <input
        id={id}
        type="radio"
        name={name}
        checked={selected}
        onChange={onChange}
        className="sr-only"
        aria-describedby={`${id}-desc`}
      />

      {/* Icon */}
      <span
        className="material-symbols-outlined text-[22px] mt-0.5 flex-shrink-0 text-ink-black"
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium text-ink-black leading-snug">
          {title}
        </p>
        <p
          id={`${id}-desc`}
          className="text-[13px] text-slate-gray mt-0.5 leading-relaxed"
        >
          {description}
        </p>
      </div>

      {/* Radio indicator */}
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
          <span className="w-2 h-2 rounded-full bg-white" />
        )}
      </span>
    </label>
  );
}
