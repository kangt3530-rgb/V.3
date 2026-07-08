import type { IAuthorItemResponse, IFreeNote, RubricTemplateId } from "../../api/types";
import { useRevisionStore } from "../../store/revisionStore";
import { AnnotationRow } from "./CriterionSection";
import { CriterionProgressIndicator } from "./CriterionProgressIndicator";

interface ReviewerGeneralCommentsProps {
  freeNotes: IFreeNote[];
  oerId: string;
  rubricTemplateId: RubricTemplateId;
  itemResponses: IAuthorItemResponse[];
  onItemResponseSaved: (saved: IAuthorItemResponse) => void;
}

export function ReviewerGeneralComments({
  freeNotes,
  oerId,
  rubricTemplateId,
  itemResponses,
  onItemResponseSaved,
}: ReviewerGeneralCommentsProps) {
  const { generalCommentsCollapsed, toggleGeneralComments } = useRevisionStore();

  const unlinkedNotes = freeNotes.filter((n) => (n.criterionIds ?? []).length === 0);
  if (unlinkedNotes.length === 0) return null;

  const handledCount = unlinkedNotes.filter(
    (n) => (itemResponses.find((r) => r.annotationId === n.id)?.itemStatus ?? null) !== null
  ).length;

  return (
    // NOTE: no overflow-hidden — same reason as CriterionSection (sticky children)
    <div id="reviewer-general-comments" className="border border-outline-variant/20 border-l-2 border-l-secondary/40 rounded-r-lg bg-surface-container-lowest mb-4">
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3 select-none hover:bg-surface-container-low/60 transition-colors rounded-r-lg"
        onClick={toggleGeneralComments}
        role="button"
        aria-expanded={!generalCommentsCollapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-on-surface-variant/60 text-sm flex-shrink-0 transition-transform duration-200"
            style={{ transform: generalCommentsCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
          <span className="text-sm font-semibold text-primary">General Comments</span>
        </div>
        <div className="flex-shrink-0 ml-3">
          <CriterionProgressIndicator handled={handledCount} total={unlinkedNotes.length} />
        </div>
      </div>

      {/* Body — same layout as CriterionSection annotations */}
      {!generalCommentsCollapsed && (
        <div className="px-4 pb-4 pt-2 space-y-2 border-t border-outline-variant/15">
          {unlinkedNotes.map((note) => {
            const annotation = {
              id: note.id,
              comment: note.text,
              selectedText: undefined,
              tag: note.tag,
            };
            return (
              <AnnotationRow
                key={note.id}
                itemId={note.id}
                annotation={annotation}
                oerId={oerId}
                rubricTemplateId={rubricTemplateId}
                itemResponses={itemResponses}
                onItemResponseSaved={onItemResponseSaved}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
