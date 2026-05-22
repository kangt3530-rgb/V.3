import { useState } from "react";
import { createPortal } from "react-dom";
import type { GapItem } from "../../../lib/gapCheck";
import type { R13Finding, R13Prefs } from "../../../api/ai";

interface GapCheckModalProps {
  gapItems: GapItem[];
  r13Findings: R13Finding[];
  r13Prefs: R13Prefs;
  onProceed: () => void;
  onReturnToEdit: (allGaps: GapItem[], firstUnacknowledgedCriterionId: string | undefined) => void;
}

export function GapCheckModal({
  gapItems,
  r13Findings,
  r13Prefs,
  onProceed,
  onReturnToEdit,
}: GapCheckModalProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [r13Collapsed, setR13Collapsed] = useState(false);

  const allChecked = checked.size === gapItems.length;
  const hasGaps = gapItems.length > 0;
  const hasR13 = r13Prefs.enabled && r13Findings.length > 0;

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleReturnToEdit() {
    const firstUnchecked = gapItems.find((g) => !checked.has(g.id))?.criterionId;
    onReturnToEdit(gapItems, firstUnchecked);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-sm" aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="gap-modal-title"
        className="relative z-10 bg-surface rounded-sm shadow-xl w-full max-w-lg mx-4 flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-outline-variant/20">
          <h2
            id="gap-modal-title"
            className="font-headline text-title-md text-on-surface font-semibold"
          >
            {hasGaps ? "Review incomplete" : "Pre-submission check"}
          </h2>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {hasGaps
              ? `${gapItems.length} item${gapItems.length !== 1 ? "s" : ""} need your attention before submitting.`
              : "Consistency observations found across criteria."}
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Gap checklist */}
          {hasGaps &&
            gapItems.map((gap) => (
              <label
                key={gap.id}
                className="flex items-start gap-3 cursor-pointer select-none group"
              >
                <input
                  type="checkbox"
                  checked={checked.has(gap.id)}
                  onChange={() => toggle(gap.id)}
                  className="mt-0.5 flex-shrink-0 w-4 h-4 accent-primary cursor-pointer"
                />
                <span className="text-body-sm text-on-surface leading-relaxed group-hover:text-on-surface/80 transition-colors">
                  {gap.label}
                </span>
              </label>
            ))}

          {/* R13 Consistency Check section */}
          {hasR13 && (
            <div className={hasGaps ? "pt-4 border-t border-outline-variant/20" : ""}>
              <button
                type="button"
                onClick={() => setR13Collapsed((c) => !c)}
                className="w-full flex items-center justify-between text-left py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-label-md font-label font-semibold text-on-surface">
                    Consistency Check
                  </span>
                  <span className="text-label-sm bg-surface-container text-on-surface-variant px-2 py-0.5 rounded-full">
                    {r13Findings.length}
                  </span>
                </div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  {r13Collapsed ? "expand_more" : "expand_less"}
                </span>
              </button>

              {!r13Collapsed && (
                <div className="mt-3 space-y-4">
                  {r13Findings.map((finding, i) => (
                    <div key={i} className="text-body-sm text-on-surface-variant leading-relaxed">
                      <span className="font-semibold text-on-surface">{finding.signalType}</span>
                      {" — "}
                      {finding.observation}
                      {r13Prefs.showCriterionName && (
                        <div className="mt-1.5">
                          <span className="inline-block text-label-sm bg-surface-container text-on-surface px-2 py-0.5 rounded-full">
                            {finding.criterionId.toUpperCase()} · {finding.criterionTitle}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReturnToEdit}
            className="text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-on-surface transition-colors px-4 py-2 rounded-sm hover:bg-surface-container"
          >
            Return to edit
          </button>
          <button
            type="button"
            onClick={onProceed}
            disabled={!allChecked}
            className={[
              "px-5 py-2 rounded-sm text-label-md font-label font-semibold uppercase tracking-widest transition-all",
              allChecked
                ? "bg-primary text-on-primary hover:opacity-90"
                : "bg-surface-container text-on-surface-variant/40 cursor-not-allowed",
            ].join(" ")}
          >
            Proceed anyway
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
