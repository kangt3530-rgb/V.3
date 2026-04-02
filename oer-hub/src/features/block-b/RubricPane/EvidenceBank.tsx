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
          No evidence collected yet. Highlight text in the OER to add evidence.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {annotations.map((ann) => {
        const isActive = activeAnnotationId === ann.id;
        return (
          <button
            key={ann.id}
            onClick={() => onEvidenceClick(ann)}
            className={[
              "w-full text-left p-3 rounded-sm transition-all group",
              isActive
                ? "bg-secondary-container/50 ring-1 ring-secondary/30"
                : "bg-surface-container hover:bg-surface-container-high",
            ].join(" ")}
          >
            {/* Quote excerpt */}
            <p className="text-body-sm text-on-surface font-medium line-clamp-2 mb-1.5">
              <span className="text-secondary font-headline italic">"</span>
              {ann.anchor.selectedText.slice(0, 80)}
              {ann.anchor.selectedText.length > 80 ? "…" : ""}
              <span className="text-secondary font-headline italic">"</span>
            </p>
            {/* Comment */}
            <p className="text-body-sm text-on-surface-variant line-clamp-2">{ann.comment}</p>
            {/* Scroll hint */}
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
  );
}
