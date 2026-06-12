import type { IAnnotation, IFreeNote, AnnotationTag } from "../../../api/types";
import { TAG_CONFIG } from "../annotationTagConfig";

interface EvidenceBankProps {
  annotations:        IAnnotation[];
  freeNotes:          IFreeNote[];
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
}

type EvidenceItem =
  | { kind: "annotation"; ann: IAnnotation; sortKey: string }
  | { kind: "freeNote"; note: IFreeNote; sortKey: string };

export function EvidenceBank({
  annotations,
  freeNotes,
  activeAnnotationId,
  onEvidenceClick,
}: EvidenceBankProps) {
  const items: EvidenceItem[] = [
    ...annotations.map((ann)  => ({ kind: "annotation" as const, ann,  sortKey: ann.createdAt  })),
    ...freeNotes.map((note)   => ({ kind: "freeNote"   as const, note, sortKey: note.createdAt })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  if (items.length === 0) {
    return (
      <div className="px-4 py-3 bg-surface-container rounded-sm">
        <p className="text-body-sm text-on-surface-variant/70 italic">
          No linked evidence yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
        Evidence bank
        <span className="ml-2 text-secondary">({items.length})</span>
      </p>
      <div className="space-y-2">
        {items.map((item) =>
          item.kind === "annotation" ? (
            <AnnotationRow
              key={item.ann.id}
              annotation={item.ann}
              isActive={activeAnnotationId === item.ann.id}
              onClick={() => onEvidenceClick(item.ann)}
            />
          ) : (
            <FreeNoteRow key={item.note.id} note={item.note} />
          )
        )}
      </div>
    </div>
  );
}

function TagIcon({ tag }: { tag: AnnotationTag | null | undefined }) {
  if (!tag) return null;
  const cfg = TAG_CONFIG[tag];
  return (
    <span
      className={`material-symbols-outlined text-[13px] flex-shrink-0 mt-0.5 ${cfg.cls}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
      title={cfg.label}
    >
      {cfg.icon}
    </span>
  );
}

function AnnotationRow({
  annotation,
  isActive,
  onClick,
}: {
  annotation: IAnnotation;
  isActive:   boolean;
  onClick:    () => void;
}) {
  const locationLabel = annotation.anchor.page
    ? `p.${annotation.anchor.page}`
    : annotation.anchor.selectedText.slice(0, 30) + (annotation.anchor.selectedText.length > 30 ? "…" : "");

  return (
    <button
      type="button"
      id={`evidence-${annotation.id}`}
      onClick={onClick}
      className={[
        "w-full text-left p-3 rounded-sm transition-all group",
        isActive
          ? "bg-secondary-container/50 ring-1 ring-secondary/30"
          : "bg-surface-container hover:bg-surface-container-high",
      ].join(" ")}
    >
      <div className="flex items-start gap-2">
        <TagIcon tag={annotation.tag} />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-on-surface font-medium line-clamp-2 mb-1">
            <span className="text-secondary font-headline italic">"</span>
            {annotation.anchor.selectedText.slice(0, 80)}
            {annotation.anchor.selectedText.length > 80 ? "…" : ""}
            <span className="text-secondary font-headline italic">"</span>
          </p>
          <p className="text-body-sm text-on-surface-variant line-clamp-2">{annotation.comment}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {/* Tag label */}
            {annotation.tag && (() => {
              const cfg = TAG_CONFIG[annotation.tag];
              return (
                <span className={`flex items-center gap-0.5 text-[10px] font-label font-semibold ${cfg.cls}`}>
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>{cfg.icon}</span>
                  {cfg.label}
                </span>
              );
            })()}
            {/* Location */}
            <span className="flex items-center gap-0.5 text-[11px] text-on-surface-variant/50 font-label">
              <span className="material-symbols-outlined text-[11px]">article</span>
              {locationLabel}
            </span>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px] text-secondary">my_location</span>
              <span className="text-[11px] text-secondary font-label uppercase tracking-widest">Jump to</span>
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

function FreeNoteRow({ note }: { note: IFreeNote }) {
  return (
    <div className="w-full text-left p-3 rounded-sm bg-surface-container">
      <div className="flex items-start gap-2">
        <TagIcon tag={note.tag} />
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-on-surface line-clamp-3">
            {note.text || <span className="italic text-on-surface-variant/50">Empty note</span>}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            <span className="material-symbols-outlined text-[11px] text-on-surface-variant/40">sticky_note_2</span>
            <span className="text-label-sm text-on-surface-variant/50 font-label">free note</span>
          </div>
        </div>
      </div>
    </div>
  );
}
