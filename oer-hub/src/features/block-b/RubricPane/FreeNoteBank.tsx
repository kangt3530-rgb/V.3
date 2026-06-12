import { useState } from "react";
import type { IRubricTemplate, IAnnotation, AnnotationTag } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { TAG_CONFIG } from "../annotationTagConfig";

const TAG_ORDER: AnnotationTag[] = ["action_item", "quick_fix"];

/** Handles both new `criterionIds: string[]` and legacy `criterionId: string` shapes. */
function isAnnotationLinked(a: IAnnotation): boolean {
  if (Array.isArray(a.criterionIds) && a.criterionIds.length > 0) return true;
  const legacyId = (a as unknown as { criterionId?: string }).criterionId;
  return !!legacyId;
}

interface FreeNoteBankProps {
  rubricTemplate:     IRubricTemplate;
  onAnnotationClick?: (annotation: IAnnotation) => void;
}

export function FreeNoteBank({ rubricTemplate, onAnnotationClick }: FreeNoteBankProps) {
  const [open, setOpen] = useState(true);

  const taskId                    = useReviewStore((s) => s.taskId);
  const freeNotes                 = useReviewStore((s) => s.freeNotes);
  const allAnnotations            = useReviewStore((s) => s.annotations); // reactive
  const addFreeNote               = useReviewStore((s) => s.addFreeNote);
  const updateFreeNote            = useReviewStore((s) => s.updateFreeNote);
  const removeFreeNote            = useReviewStore((s) => s.removeFreeNote);
  const removeAnnotation          = useReviewStore((s) => s.removeAnnotation);
  const updateAnnotation          = useReviewStore((s) => s.updateAnnotation);
  const linkAnnotationToCriterion = useReviewStore((s) => s.linkAnnotationToCriterion);

  // Unlinked = no criterionIds AND no legacy criterionId
  const unlinkedAnnotations = allAnnotations.filter((a) => !isAnnotationLinked(a));
  const totalCount = freeNotes.length + unlinkedAnnotations.length;

  function handleAddNote() {
    addFreeNote({
      id:           `fn-${Date.now()}`,
      taskId,
      text:         "",
      tag:          null,
      criterionIds: [],
      createdAt:    new Date().toISOString(),
    });
    if (!open) setOpen(true);
  }

  return (
    <div className="flex-shrink-0 mx-3 mt-3">
      <div className="bg-surface-container-lowest rounded-sm shadow-card overflow-hidden">

        {/* Header */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[15px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              sticky_note_2
            </span>
            <span className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
              Free Notes
            </span>
            {totalCount > 0 && (
              <span className="px-1.5 py-0.5 bg-secondary-container text-secondary rounded-full text-label-sm font-label font-semibold leading-none">
                {totalCount}
              </span>
            )}
          </div>
          <span
            className="material-symbols-outlined text-[18px] text-on-surface-variant/60 transition-transform"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
        </button>

        {open && (
          <>
            {totalCount > 0 && (
              <p className="px-4 pb-1.5 text-[10px] font-label uppercase tracking-widest text-on-surface-variant/40">
                Move to one or more criteria to add to Evidence Bank
              </p>
            )}
            <div className="max-h-[28vh] overflow-y-auto px-3 pb-3 space-y-1.5">
              {unlinkedAnnotations.map((ann) => (
                <UnlinkedAnnotationCard
                  key={ann.id}
                  annotation={ann}
                  rubricTemplate={rubricTemplate}
                  onLink={(criterionIds) => {
                    criterionIds.forEach((id) => linkAnnotationToCriterion(ann.id, id));
                  }}
                  onDelete={() => removeAnnotation(ann.id)}
                  onTagChange={(tag) => updateAnnotation(ann.id, { tag })}
                  onJumpTo={onAnnotationClick ? () => onAnnotationClick(ann) : undefined}
                />
              ))}
              {freeNotes.map((note) => (
                <FreeNoteCard
                  key={note.id}
                  text={note.text}
                  tag={note.tag}
                  criterionIds={note.criterionIds}
                  rubricTemplate={rubricTemplate}
                  onUpdate={(partial) => updateFreeNote(note.id, partial)}
                  onRemove={() => removeFreeNote(note.id)}
                />
              ))}
              <button
                type="button"
                onClick={handleAddNote}
                className="flex items-center gap-1.5 px-1 py-1.5 text-label-sm font-label font-semibold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[13px]">add</span>
                Add Free Note
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Shared multi-select criterion picker ────────────────────────────────────

function CriterionMultiPicker({
  rubricTemplate,
  selectedIds,
  onToggle,
  onDone,
  requireSelection = true,
}: {
  rubricTemplate:   IRubricTemplate;
  selectedIds:      string[];
  onToggle:         (criterionId: string) => void;
  onDone:           () => void;
  requireSelection?: boolean;
}) {
  return (
    <div className="rounded-sm border border-outline-variant/30 overflow-hidden">
      {rubricTemplate.criteria.map((c) => {
        const checked = selectedIds.includes(c.id);
        return (
          <label
            key={c.id}
            className={[
              "flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors border-b border-outline-variant/15 last:border-0",
              checked ? "bg-secondary-container/30" : "hover:bg-secondary-container/20",
            ].join(" ")}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(c.id)}
              className="rounded border-outline-variant accent-secondary w-3.5 h-3.5 flex-shrink-0 cursor-pointer"
            />
            <span className="text-label-sm font-label font-semibold text-secondary min-w-[28px] flex-shrink-0">{c.id}</span>
            <span className="text-body-sm text-on-surface-variant flex-1 truncate">{c.title}</span>
          </label>
        );
      })}
      <div className="px-3 py-2 bg-surface-container-low border-t border-outline-variant/15 flex justify-end">
        <button
          type="button"
          onClick={onDone}
          disabled={requireSelection && selectedIds.length === 0}
          className="px-2.5 py-1 rounded-sm bg-secondary text-white text-[11px] font-label font-semibold uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed hover:bg-secondary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Unlinked annotation card ─────────────────────────────────────────────────

function UnlinkedAnnotationCard({
  annotation,
  rubricTemplate,
  onLink,
  onDelete,
  onTagChange,
  onJumpTo,
}: {
  annotation:     IAnnotation;
  rubricTemplate: IRubricTemplate;
  onLink:         (criterionIds: string[]) => void;
  onDelete:       () => void;
  onTagChange:    (tag: AnnotationTag | null) => void;
  onJumpTo?:      () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const tag = annotation.tag;
  const cfg = tag ? TAG_CONFIG[tag] : null;

  const locationLabel = annotation.anchor.page
    ? `p.${annotation.anchor.page}`
    : annotation.anchor.selectedText.slice(0, 28) + (annotation.anchor.selectedText.length > 28 ? "…" : "");

  return (
    <div className="bg-surface rounded-sm border border-outline-variant/20 p-3 space-y-2 group/card">
      {/* Content row */}
      <div className="flex items-start gap-2">
        {cfg && (
          <span
            className={`material-symbols-outlined text-[13px] flex-shrink-0 mt-0.5 ${cfg.cls}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            title={cfg.label}
          >
            {cfg.icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-body-sm text-on-surface font-medium line-clamp-2 leading-snug">
            <span className="text-secondary font-headline italic">"</span>
            {annotation.anchor.selectedText.slice(0, 100)}{annotation.anchor.selectedText.length > 100 ? "…" : ""}
            <span className="text-secondary font-headline italic">"</span>
          </p>
          {annotation.comment && (
            <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1">{annotation.comment}</p>
          )}
          {/* Source row */}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/50 font-label">
              <span className="material-symbols-outlined text-[10px]">article</span>
              {locationLabel}
            </span>
            {onJumpTo && (
              <button
                type="button"
                onClick={onJumpTo}
                className="flex items-center gap-0.5 text-[10px] text-secondary/60 hover:text-secondary font-label transition-colors opacity-0 group-hover/card:opacity-100"
              >
                <span className="material-symbols-outlined text-[10px]">my_location</span>
                Jump to
              </button>
            )}
          </div>
        </div>
        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete annotation"
          className="flex-shrink-0 p-0.5 text-on-surface-variant/25 hover:text-error transition-colors opacity-0 group-hover/card:opacity-100"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {/* Action row: Move to + tag selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => {
            setPendingIds([]);
            setPickerOpen((v) => !v);
          }}
          className={[
            "flex items-center gap-1 px-2 py-1 rounded-sm border text-[11px] font-label font-semibold uppercase tracking-widest transition-colors",
            pickerOpen
              ? "bg-secondary-container border-secondary text-secondary"
              : "border-outline-variant/50 text-on-surface-variant/60 hover:border-secondary hover:text-secondary",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-[12px]">move_down</span>
          Move to
          <span className="material-symbols-outlined text-[11px]">{pickerOpen ? "expand_less" : "expand_more"}</span>
        </button>

        {/* Inline tag selector */}
        <div className="flex gap-1">
          {TAG_ORDER.map((t) => {
            const tcfg   = TAG_CONFIG[t];
            const active = tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onTagChange(tag === t ? null : t)}
                title={tcfg.label}
                className={[
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-label font-semibold transition-all",
                  active
                    ? "bg-secondary-container border-secondary text-secondary"
                    : "border-outline-variant/40 text-on-surface-variant/40 hover:text-on-surface-variant",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {tcfg.icon}
                </span>
                <span className="hidden sm:inline">{tcfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Inline criterion picker — multi-select, apply on Done */}
      {pickerOpen && (
        <CriterionMultiPicker
          rubricTemplate={rubricTemplate}
          selectedIds={pendingIds}
          onToggle={(id) =>
            setPendingIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
            )
          }
          onDone={() => {
            if (pendingIds.length > 0) onLink(pendingIds);
            setPickerOpen(false);
            setPendingIds([]);
          }}
        />
      )}
    </div>
  );
}

// ─── Free note card ───────────────────────────────────────────────────────────

function FreeNoteCard({
  text,
  tag,
  criterionIds,
  rubricTemplate,
  onUpdate,
  onRemove,
}: {
  text:          string;
  tag:           AnnotationTag | null;
  criterionIds:  string[];
  rubricTemplate: IRubricTemplate;
  onUpdate: (partial: Partial<{ text: string; tag: AnnotationTag | null; criterionIds: string[] }>) => void;
  onRemove: () => void;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const cfg = tag ? TAG_CONFIG[tag] : null;

  return (
    <div className="bg-surface rounded-sm border border-outline-variant/20 p-3 space-y-2">
      {/* Text + delete */}
      <div className="flex items-start gap-2">
        {cfg && (
          <span
            className={`material-symbols-outlined text-[13px] flex-shrink-0 mt-0.5 ${cfg.cls}`}
            style={{ fontVariationSettings: "'FILL' 1" }}
            title={cfg.label}
          >
            {cfg.icon}
          </span>
        )}
        <textarea
          value={text}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Write a free note…"
          rows={text ? Math.min(3, text.split("\n").length + 1) : 1}
          className="flex-1 bg-transparent border-0 border-b border-transparent focus:border-outline-variant/50 outline-none pb-0.5 text-body-sm text-on-surface placeholder:text-on-surface-variant/40 resize-none transition-colors leading-relaxed"
        />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove note"
          className="flex-shrink-0 p-0.5 text-on-surface-variant/25 hover:text-error transition-colors"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      </div>

      {/* Linked criteria chips */}
      {criterionIds.length > 0 && (
        <div className="flex flex-wrap gap-1 pl-5">
          {criterionIds.map((id) => {
            const c = rubricTemplate.criteria.find((x) => x.id === id);
            return (
              <span key={id} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-secondary-container/50 text-secondary rounded-full text-[10px] font-label font-semibold">
                {id}{c && <span className="text-secondary/60 font-normal"> · {c.title}</span>}
                <button
                  type="button"
                  onClick={() => onUpdate({ criterionIds: criterionIds.filter((x) => x !== id) })}
                  aria-label={`Unlink ${id}`}
                  className="ml-0.5 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-[9px]">close</span>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Action row: Move to + tag */}
      <div className="pl-5 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={[
            "flex items-center gap-1 px-2 py-1 rounded-sm border text-[11px] font-label font-semibold uppercase tracking-widest transition-colors",
            pickerOpen
              ? "bg-secondary-container border-secondary text-secondary"
              : "border-outline-variant/50 text-on-surface-variant/60 hover:border-secondary hover:text-secondary",
          ].join(" ")}
        >
          <span className="material-symbols-outlined text-[12px]">add_link</span>
          Move to
          <span className="material-symbols-outlined text-[11px]">{pickerOpen ? "expand_less" : "expand_more"}</span>
        </button>
        <div className="flex gap-1">
          {TAG_ORDER.map((t) => {
            const tcfg   = TAG_CONFIG[t];
            const active = tag === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onUpdate({ tag: tag === t ? null : t })}
                title={tcfg.label}
                className={[
                  "flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-label font-semibold transition-all",
                  active
                    ? "bg-secondary-container border-secondary text-secondary"
                    : "border-outline-variant/40 text-on-surface-variant/40 hover:text-on-surface-variant",
                ].join(" ")}
              >
                <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>
                  {tcfg.icon}
                </span>
                <span className="hidden sm:inline">{tcfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {pickerOpen && (
        <CriterionMultiPicker
          rubricTemplate={rubricTemplate}
          selectedIds={criterionIds}
          onToggle={(id) =>
            onUpdate({
              criterionIds: criterionIds.includes(id)
                ? criterionIds.filter((x) => x !== id)
                : [...criterionIds, id],
            })
          }
          onDone={() => setPickerOpen(false)}
          requireSelection={false}
        />
      )}
    </div>
  );
}
