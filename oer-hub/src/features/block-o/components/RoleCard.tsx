/**
 * RoleCard — multi-select role chip for the Role Identification screen.
 * Renders as a styled <label> wrapping a visually-hidden <input type="checkbox">.
 * Fully keyboard-navigable and screen-reader accessible.
 */

interface RoleCardProps {
  id: string;
  icon: string; // Material Symbols icon name
  title: string;
  description: string;
  selected: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
  onChange: (selected: boolean) => void;
}

export function RoleCard({
  id,
  icon,
  title,
  description,
  selected,
  disabled = false,
  comingSoon = false,
  onChange,
}: RoleCardProps) {
  const isInteractive = !disabled && !comingSoon;

  return (
    <label
      htmlFor={id}
      className={[
        "relative flex items-start gap-4 rounded-[10px] border p-5 transition-colors",
        "cursor-pointer select-none",
        isInteractive && selected
          ? "border-ink-black bg-tinted-selected"
          : isInteractive
          ? "border-ghost-border bg-parchment hover:border-slate-gray hover:bg-[#faf9f4]"
          : "border-whisper-border bg-parchment cursor-default",
      ].join(" ")}
    >
      {/* Visually-hidden native checkbox — accessible without being visible */}
      <input
        id={id}
        type="checkbox"
        checked={selected}
        disabled={disabled || comingSoon}
        onChange={(e) => isInteractive && onChange(e.target.checked)}
        className="sr-only"
        aria-describedby={`${id}-desc`}
      />

      {/* Icon */}
      <span
        className={[
          "material-symbols-outlined text-[22px] mt-0.5 flex-shrink-0",
          isInteractive ? "text-ink-black" : "text-ash-gray",
        ].join(" ")}
        aria-hidden="true"
      >
        {icon}
      </span>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p
          className={[
            "text-[15px] font-medium leading-snug",
            isInteractive ? "text-ink-black" : "text-ash-gray",
          ].join(" ")}
        >
          {title}
        </p>
        <p
          id={`${id}-desc`}
          className="text-[13px] text-slate-gray mt-0.5 leading-relaxed"
        >
          {description}
        </p>
      </div>

      {/* Selection indicator or Coming Soon badge */}
      <div className="flex-shrink-0 flex items-center gap-2">
        {comingSoon ? (
          <span className="text-[11px] font-medium uppercase tracking-widest text-ash-gray border border-whisper-border rounded-full px-2.5 py-0.5">
            Coming soon
          </span>
        ) : (
          <span
            className={[
              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
              selected
                ? "border-ink-black bg-ink-black"
                : "border-ghost-border bg-parchment",
            ].join(" ")}
            aria-hidden="true"
          >
            {selected && (
              <span className="material-symbols-outlined text-[12px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
                check
              </span>
            )}
          </span>
        )}
      </div>
    </label>
  );
}
