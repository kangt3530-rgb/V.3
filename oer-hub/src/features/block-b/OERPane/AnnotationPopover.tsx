import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useReviewStore } from "../../../store/reviewStore";
import type { IRubricTemplate, IAnnotation, AnnotationTag } from "../../../api/types";
import { callGemini } from "../../../api/ai";
import { useVoiceInput, isSpeechSupported } from "../../../hooks/useVoiceInput";
import { TAG_CONFIG } from "../annotationTagConfig";

interface AnnotationPopoverProps {
  containerRef:     RefObject<HTMLDivElement | null>;
  selectedText:     string;
  rects:            { top: number; left: number; width: number; height: number }[];
  anchorType:       "web" | "pdf";
  popoverX:         number;
  popoverY:         number;
  rubricTemplate?:  IRubricTemplate;
  /** When set, the popover operates in edit mode — pre-fills fields and calls updateAnnotation on save. */
  editAnnotation?:  IAnnotation;
  onSave:           () => void;
  onCancel:         () => void;
}

const POPOVER_W = 360;
const POPOVER_H = 340;

const TAG_ORDER: AnnotationTag[] = ["general_feedback", "action_item", "quick_fix"];

export function AnnotationPopover({
  containerRef,
  selectedText,
  rects,
  anchorType,
  popoverX,
  popoverY,
  rubricTemplate,
  editAnnotation,
  onSave,
  onCancel,
}: AnnotationPopoverProps) {
  const addAnnotation    = useReviewStore((s) => s.addAnnotation);
  const updateAnnotation = useReviewStore((s) => s.updateAnnotation);
  const taskId           = useReviewStore((s) => s.taskId);
  const activeRubricTerms = useReviewStore((s) => s.activeRubricTerms);
  const dispatchLookup   = useReviewStore((s) => s.dispatchLookup);

  const isEditMode = !!editAnnotation;

  const [tag, setTag]                   = useState<AnnotationTag>(editAnnotation?.tag ?? "general_feedback");
  const [criterionIds, setCriterionIds] = useState<string[]>(editAnnotation?.criterionIds ?? []);
  const [comment, setComment]           = useState(editAnnotation?.comment ?? "");
  const [error, setError]               = useState("");
  const [suggestedIds, setSuggestedIds] = useState<string[] | null>(null);
  const [rankingError, setRankingError] = useState("");
  const [voiceError, setVoiceError]     = useState<string | null>(null);
  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const popoverRef    = useRef<HTMLDivElement>(null);
  const rankCallIdRef = useRef(0);

  function handleVoiceError(msg: string) {
    setVoiceError(msg);
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(null), 3000);
  }

  const voiceComment = useVoiceInput({
    fieldId: "annotation-new-comment",
    value: comment,
    onChange: (v) => { setComment(v); setError(""); },
    onError: handleVoiceError,
  });

  useEffect(() => () => {
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
  }, []);

  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  useLayoutEffect(() => {
    const el = popoverRef.current;
    if (!el) return;
    const containerRect = containerRef.current?.getBoundingClientRect();
    let left = popoverX + 8;
    let top  = popoverY + 8;
    if (containerRect) {
      if (left + POPOVER_W > containerRect.width)  left = popoverX - POPOVER_W - 8;
      if (top  + POPOVER_H > containerRect.height) top  = popoverY - POPOVER_H - 8;
    }
    el.style.left = `${Math.max(8, left)}px`;
    el.style.top  = `${Math.max(8, top)}px`;
  }, [containerRef, popoverX, popoverY]);

  useEffect(() => {
    const criteriaOptions = rubricTemplate?.criteria ?? [];
    if (criteriaOptions.length === 0) return;
    const callId = ++rankCallIdRef.current;

    const systemPrompt =
      "You are an OER review assistant. Given a highlighted passage from an OER and a list of rubric criteria, return a JSON array of exactly 3 criterion IDs most relevant to the passage, ranked best-match first. Return only the JSON array, nothing else.";
    const criteriaText = criteriaOptions.map((c) => `${c.id}: ${c.title} — ${c.standard}`).join("\n");
    const userMessage  = `Highlighted passage:\n"${selectedText}"\n\nCriteria:\n${criteriaText}`;

    callGemini([{ role: "user", content: userMessage }], systemPrompt)
      .then((raw) => {
        const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const parsed: unknown = JSON.parse(cleaned);
        if (!Array.isArray(parsed)) return;
        const ids = (parsed as unknown[])
          .slice(0, 3)
          .filter((id): id is string => typeof id === "string" && criteriaOptions.some((c) => c.id === id));
        if (callId === rankCallIdRef.current && ids.length > 0) setSuggestedIds(ids);
      })
      .catch(() => {
        if (callId === rankCallIdRef.current) setRankingError("Could not rank criteria.");
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCriterion(id: string) {
    setCriterionIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setError("");
  }

  function handleSave() {
    if (!comment.trim()) { setError("Please add a comment explaining this annotation."); return; }
    if (isEditMode && editAnnotation) {
      updateAnnotation(editAnnotation.id, { comment: comment.trim(), tag, criterionIds });
    } else {
      addAnnotation({
        id:          `ann-${Date.now()}`,
        taskId,
        criterionIds,
        tag,
        comment:     comment.trim(),
        createdAt:   new Date().toISOString(),
        anchor: { type: anchorType, selectedText: selectedText.slice(0, 300), rects },
      });
    }
    onSave();
  }

  const criteriaOptions = rubricTemplate?.criteria ?? [];
  const isKnownTerm     = activeRubricTerms.has(selectedText.toLowerCase().trim());
  const suggestedSet    = new Set(suggestedIds ?? []);

  // Suggested criteria first, then the rest
  const orderedCriteria = suggestedIds
    ? [
        ...suggestedIds.map((id) => criteriaOptions.find((c) => c.id === id)).filter((c): c is NonNullable<typeof c> => !!c),
        ...criteriaOptions.filter((c) => !suggestedSet.has(c.id)),
      ]
    : criteriaOptions;

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 w-[360px] bg-surface-container-lowest shadow-ambient rounded-md overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            {isEditMode ? "Edit Annotation" : "Add Annotation"}
          </p>
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1 italic">
            "{selectedText.slice(0, 55)}{selectedText.length > 55 ? "…" : ""}"
          </p>
        </div>
        <button onClick={onCancel} className="flex-shrink-0 text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">

        {/* Criterion list — full ID + title rows */}
        {criteriaOptions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
                Link to Criteria
              </p>
              <span className="text-[11px] text-on-surface-variant/50 font-label">optional · multi-select</span>
            </div>
            {rankingError && <p className="text-body-sm text-error mb-1">{rankingError}</p>}
            <div className="max-h-[148px] overflow-y-auto rounded-sm border border-outline-variant/30 divide-y divide-outline-variant/20">
              {orderedCriteria.map((c) => {
                const isSelected  = criterionIds.includes(c.id);
                const isSuggested = suggestedSet.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleCriterion(c.id)}
                    className={[
                      "w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors",
                      isSelected
                        ? "bg-secondary-container/40"
                        : "hover:bg-surface-container",
                    ].join(" ")}
                  >
                    {/* Selection indicator */}
                    <span
                      className={[
                        "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected
                          ? "bg-secondary border-secondary"
                          : "border-outline-variant bg-transparent",
                      ].join(" ")}
                    >
                      {isSelected && (
                        <span className="material-symbols-outlined text-on-secondary text-[9px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                      )}
                    </span>

                    {/* Criterion ID badge */}
                    <span
                      className={[
                        "text-label-sm font-label font-semibold min-w-[28px] flex-shrink-0",
                        isSelected ? "text-secondary" : isSuggested ? "text-secondary/70" : "text-on-surface-variant/60",
                      ].join(" ")}
                    >
                      {c.id}
                    </span>

                    {/* Title */}
                    <span
                      className={[
                        "text-body-sm flex-1 truncate",
                        isSelected ? "text-on-surface font-medium" : "text-on-surface-variant",
                      ].join(" ")}
                    >
                      {c.title}
                    </span>

                    {/* Suggested badge */}
                    {isSuggested && !isSelected && (
                      <span className="flex items-center gap-0.5 text-[10px] text-secondary/60 font-label flex-shrink-0">
                        <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                        Suggested
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Comment */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
              Evidence Comment
            </label>
            {isSpeechSupported && (
              <div className="flex items-center gap-1.5">
                {voiceComment.isRecording && (
                  <button type="button" onClick={voiceComment.discard}
                    className="text-label-sm font-label text-on-surface-variant/60 hover:text-error transition-colors">
                    Discard
                  </button>
                )}
                <button
                  type="button"
                  onClick={voiceComment.isRecording ? voiceComment.stopRecording : voiceComment.startRecording}
                  title={voiceComment.isRecording ? "Stop recording" : "Dictate comment"}
                  className={voiceComment.isRecording ? "voice-mic-active" : "text-on-surface-variant/40 hover:text-on-surface-variant transition-colors rounded-full"}
                >
                  <span className="material-symbols-outlined text-[15px]">mic</span>
                </button>
              </div>
            )}
          </div>
          <textarea
            value={comment}
            onChange={(e) => { setComment(e.target.value); setError(""); }}
            placeholder="Describe what this evidence shows…"
            rows={3}
            className={[
              "w-full bg-transparent border-0 border-b-2 outline-none pb-1 text-body-md text-on-surface placeholder:text-on-surface-variant/50 resize-none transition-colors",
              voiceComment.isRecording ? "border-error/50" : "border-outline-variant focus:border-secondary",
            ].join(" ")}
          />
          {voiceError && <p className="text-body-sm text-error mt-0.5">{voiceError}</p>}

          {/* Tag row — inline below comment */}
          <div className="flex items-center gap-2 mt-2.5">
            <span className="text-[10px] font-label font-semibold uppercase tracking-widest text-on-surface-variant/50 flex-shrink-0">
              Tag
            </span>
            <div className="flex gap-1.5">
              {TAG_ORDER.map((t) => {
                const cfg    = TAG_CONFIG[t];
                const active = tag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(t)}
                    className={[
                      "flex items-center gap-1 px-2 py-0.5 rounded-full border transition-all text-[11px] font-label font-semibold",
                      active
                        ? "bg-secondary-container border-secondary text-secondary"
                        : "border-outline-variant/60 text-on-surface-variant/60 hover:border-outline-variant hover:text-on-surface-variant",
                    ].join(" ")}
                  >
                    <span
                      className="material-symbols-outlined text-[11px]"
                      style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {cfg.icon}
                    </span>
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {error && <p className="text-body-sm text-error -mt-1">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Cancel
          </button>
          {isKnownTerm && (
            <button
              onClick={() => { dispatchLookup(selectedText.trim()); onCancel(); }}
              className="flex-1 py-2 text-label-md font-label font-semibold uppercase tracking-widest text-secondary hover:text-primary transition-colors"
            >
              Look Up
            </button>
          )}
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-primary text-on-primary rounded-sm text-label-md font-label font-semibold uppercase tracking-widest hover:bg-primary-container transition-colors"
          >
            {isEditMode ? "Save Changes" : "Save Evidence"}
          </button>
        </div>
      </div>
    </div>
  );
}
