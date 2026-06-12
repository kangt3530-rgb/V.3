import type { ItemStatus } from "../../api/types";

const PILLS: { status: ItemStatus; icon: string; label: string; activeCls: string }[] = [
  { status: "addressed",    icon: "check_circle", label: "Addressed",     activeCls: "bg-emerald-100 border-emerald-500 text-emerald-700" },
  { status: "later",        icon: "schedule",     label: "Later",         activeCls: "bg-sky-100 border-sky-500 text-sky-700" },
  { status: "wont_address", icon: "block",        label: "Won't address", activeCls: "bg-stone-200 border-stone-400 text-stone-600" },
];

interface StatusPillGroupProps {
  itemId:   string;
  status:   ItemStatus | null;
  onChange: (status: ItemStatus | null) => void;
}

export function StatusPillGroup({ status, onChange }: StatusPillGroupProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {PILLS.map(({ status: s, icon, label, activeCls }) => {
        const active = status === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(active ? null : s)}
            className={[
              "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-label font-semibold transition-all",
              active
                ? activeCls
                : "border-outline-variant/40 text-on-surface-variant/50 hover:border-outline-variant hover:text-on-surface-variant",
            ].join(" ")}
          >
            <span
              className="material-symbols-outlined text-[11px]"
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            {label}
          </button>
        );
      })}
    </div>
  );
}
