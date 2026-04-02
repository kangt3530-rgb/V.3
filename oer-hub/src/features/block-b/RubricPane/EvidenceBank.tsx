import type { IAnnotation } from "../../../api/types";

interface EvidenceBankProps {
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
}

export function EvidenceBank({
  annotations,
  activeAnnotationId,
  onEvidenceClick,
}: EvidenceBankProps) {
  if (annotations.length === 0) {
    return (
      <div className="px-4 py-3 bg-surface-container rounded-sm">
        <p className="text-body-sm text-on-surface-variant/70 italic">
          No linked highlights. Annotations are optional—use the columns and rating buttons for written feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
        Evidence bank
        <span className="ml-2 text-secondary">({annotations.length})</span>
      </p>
      <div className="space-y-2">
        {annotations.map((ann) => {
          const isActive = activeAnnotationId === ann.id;
          return (
            <button
              key={ann.id}
              type="button"
              id={`evidence-${ann.id}`}
              onClick={() => onEvidenceClick(ann)}
              className={[
                "w-full text-left p-3 rounded-sm transition-all group",
                isActive
                  ? "bg-secondary-container/50 ring-1 ring-secondary/30"
                  : "bg-surface-container hover:bg-surface-container-high",
              ].join(" ")}
            >
              <p className="text-body-sm text-on-surface font-medium line-clamp-2 mb-1.5">
                <span className="text-secondary font-headline italic">"</span>
                {ann.anchor.selectedText.slice(0, 80)}
                {ann.anchor.selectedText.length > 80 ? "…" : ""}
                <span className="text-secondary font-headline italic">"</span>
              </p>
              <p className="text-body-sm text-on-surface-variant line-clamp-2">{ann.comment}</p>
              <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-[12px] text-secondary">my_location</span>
                <span className="text-label-sm text-secondary font-label uppercase tracking-widest">
                  Jump to location
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
