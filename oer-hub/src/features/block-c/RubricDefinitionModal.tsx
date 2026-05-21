import { useEffect, useState } from "react";
import type { RubricTemplateId } from "../../api/types";
import { getCriterionDefinition, getRubricDefinition } from "../../data/rubric-md";

interface RubricDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  rubricId: RubricTemplateId;
  criterionId: string;
}

export function RubricDefinitionModal({
  isOpen,
  onClose,
  rubricId,
  criterionId,
}: RubricDefinitionModalProps) {
  const [introExpanded, setIntroExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Reset intro state when modal reopens for a different criterion
  useEffect(() => {
    if (isOpen) setIntroExpanded(false);
  }, [isOpen, criterionId]);

  if (!isOpen) return null;

  const rubric = getRubricDefinition(rubricId);
  const criterion = getCriterionDefinition(rubricId, criterionId);

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={criterion ? `${criterionId}: ${criterion.title}` : "Criterion definition"}
        className="relative max-w-2xl w-full max-h-[80vh] bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <p className="text-sm font-semibold text-primary">
            {rubric?.name ?? rubricId} Rubric
          </p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {criterion ? (
            <>
              {/* Criterion title */}
              <div>
                <h2 className="text-xl font-semibold text-on-surface">
                  {criterionId}: {criterion.title}
                </h2>
                <p className="text-xs font-semibold tracking-widest uppercase text-on-surface-variant/60 mt-1">
                  Exemplifies Established Standards of Quality
                </p>
              </div>

              {/* Standards list */}
              <ol className="space-y-3">
                {criterion.standards.map((standard, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 text-sm font-semibold text-on-surface-variant/50 w-5 text-right">
                      {i + 1}.
                    </span>
                    <p className="text-sm text-on-surface leading-relaxed">{standard}</p>
                  </li>
                ))}
              </ol>

              {/* Collapsible rubric intro */}
              {rubric?.introduction && (
                <div className="pt-3 border-t border-outline-variant/15">
                  <button
                    onClick={() => setIntroExpanded((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-on-surface-variant/70 hover:text-primary transition-colors select-none"
                  >
                    <span
                      className="material-symbols-outlined text-[14px] transition-transform duration-200"
                      style={{ transform: introExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                    >
                      chevron_right
                    </span>
                    About this rubric
                  </button>
                  {introExpanded && (
                    <div className="mt-3 text-xs text-on-surface-variant leading-relaxed space-y-2 max-h-60 overflow-y-auto pr-1">
                      {rubric.introduction
                        .split(/\n{2,}/)
                        .map((para) => para.trim())
                        .filter((para) => para.length > 0)
                        .slice(0, 8)
                        .map((para, i) => (
                          <p key={i}>{para.replace(/\*\*/g, "")}</p>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-on-surface-variant italic">
              Full definition not available for this criterion.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
