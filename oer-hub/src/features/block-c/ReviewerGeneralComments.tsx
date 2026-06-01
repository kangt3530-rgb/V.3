import type { IFreeNote } from "../../api/types";
import { TAG_CONFIG } from "../block-b/annotationTagConfig";
import { useRevisionStore } from "../../store/revisionStore";

interface ReviewerGeneralCommentsProps {
  freeNotes: IFreeNote[];
}

export function ReviewerGeneralComments({ freeNotes }: ReviewerGeneralCommentsProps) {
  const { generalCommentsCollapsed, toggleGeneralComments } = useRevisionStore();

  const unlinkedNotes = freeNotes.filter((n) => n.criterionIds.length === 0);
  if (unlinkedNotes.length === 0) return null;

  return (
    <div id="reviewer-general-comments" className="border border-outline-variant/20 border-l-2 border-l-secondary/40 rounded-r-lg overflow-hidden bg-surface-container-lowest mb-4">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3 select-none hover:bg-surface-container-low/60 transition-colors"
        onClick={toggleGeneralComments}
        role="button"
        aria-expanded={!generalCommentsCollapsed}
      >
        <div className="flex items-center gap-2">
          <span
            className="material-symbols-outlined text-on-surface-variant/60 text-sm flex-shrink-0 transition-transform duration-200"
            style={{ transform: generalCommentsCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
          <span className="text-sm font-semibold text-primary">Reviewer's General Comments</span>
          <span className="px-1.5 py-0.5 bg-secondary-container text-secondary rounded-full text-[11px] font-semibold leading-none">
            {unlinkedNotes.length}
          </span>
        </div>
      </div>

      {/* Body */}
      {!generalCommentsCollapsed && (
        <div className="px-4 pb-4 space-y-2 border-t border-outline-variant/15">
          {unlinkedNotes.map((note) => {
            const tag = note.tag ?? "general_feedback";
            const { icon, cls } = TAG_CONFIG[tag];
            return (
              <div
                key={note.id}
                id={`general-note-${note.id}`}
                className="mt-2 bg-amber-50/70 rounded-md p-3 border-l-2 border-amber-300 space-y-1.5"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`material-symbols-outlined text-[14px] flex-shrink-0 ${cls}`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {icon}
                  </span>
                  <span className="text-xs font-medium text-on-surface-variant/70">
                    {TAG_CONFIG[tag].label}
                  </span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap pl-5">
                  {note.text || <span className="italic text-on-surface-variant/40">Empty note</span>}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
