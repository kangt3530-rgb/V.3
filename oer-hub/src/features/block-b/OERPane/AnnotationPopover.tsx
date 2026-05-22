import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { useReviewStore } from "../../../store/reviewStore";
import type { IRubricTemplate } from "../../../api/types";
import { callGemini } from "../../../api/ai";
import { useVoiceInput, isSpeechSupported } from "../../../hooks/useVoiceInput";

interface AnnotationPopoverProps {
  containerRef:  RefObject<HTMLDivElement | null>;
  selectedText:  string;
  rects:         { top: number; left: number; width: number; height: number }[];
  anchorType:    "web" | "pdf";
  popoverX:      number;
  popoverY:      number;
  rubricTemplate?: IRubricTemplate;
  onSave:        () => void;
  onCancel:      () => void;
}

const POPOVER_W = 320;
const POPOVER_H = 260;

export function AnnotationPopover({
  containerRef,
  selectedText,
  rects,
  anchorType,
  popoverX,
  popoverY,
  rubricTemplate,
  onSave,
  onCancel,
}: AnnotationPopoverProps) {
  const addAnnotation      = useReviewStore((s) => s.addAnnotation);
  const taskId             = useReviewStore((s) => s.taskId);
  const activeRubricTerms  = useReviewStore((s) => s.activeRubricTerms);
  const dispatchLookup     = useReviewStore((s) => s.dispatchLookup);

  const [criterionId, setCriterionId] = useState("");
  const [comment, setComment]         = useState("");
  const [error, setError]             = useState("");
  const [suggestedIds, setSuggestedIds] = useState<string[] | null>(null);
  const [rankingError, setRankingError] = useState("");
  const [voiceError, setVoiceError]   = useState<string | null>(null);
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

  // Close on outside click
  useEffect(() => {
    function handler(e: globalThis.MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onCancel();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onCancel]);

  // Clamp position so popover stays inside container (imperative DOM update, no setState)
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

  function handleSave() {
    if (!criterionId) { setError("Please select a criterion to link this evidence."); return; }
    if (!comment.trim()) { setError("Please add a comment explaining this annotation."); return; }

    addAnnotation({
      id:          `ann-${Date.now()}`,
      taskId,
      criterionId,
      comment:     comment.trim(),
      createdAt:   new Date().toISOString(),
      anchor: {
        type:         anchorType,
        selectedText: selectedText.slice(0, 300),
        rects,
      },
    });
    onSave();
  }

  const criteriaOptions = rubricTemplate?.criteria ?? [];
  const isKnownTerm = activeRubricTerms.has(selectedText.toLowerCase().trim());

  async function handleDropdownOpen() {
    setSuggestedIds(null);
    setRankingError("");
    if (criteriaOptions.length === 0) return;
    const callId = ++rankCallIdRef.current;

    const systemPrompt =
      "You are an OER review assistant. Given a highlighted passage from an OER and a list of rubric criteria, return a JSON array of exactly 3 criterion IDs most relevant to the passage, ranked best-match first. Return only the JSON array, nothing else.";

    const criteriaText = criteriaOptions
      .map((c) => `${c.id}: ${c.title} — ${c.standard}`)
      .join("\n");

    const userMessage = `Highlighted passage:\n"${selectedText}"\n\nCriteria:\n${criteriaText}`;

    try {
      const raw = await callGemini([{ role: "user", content: userMessage }], systemPrompt);
      const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
      const parsed: unknown = JSON.parse(cleaned);
      if (!Array.isArray(parsed)) return;
      const ids = (parsed as unknown[])
        .slice(0, 3)
        .filter((id): id is string =>
          typeof id === "string" && criteriaOptions.some((c) => c.id === id)
        );
      if (ids.length === 0) {
        if (callId === rankCallIdRef.current) setRankingError("Could not rank criteria — suggestions unavailable.");
        return;
      }
      if (callId === rankCallIdRef.current) setSuggestedIds(ids);
    } catch {
      if (callId === rankCallIdRef.current) setRankingError("Could not rank criteria — suggestions unavailable.");
    }
  }

  return (
    <div
      ref={popoverRef}
      className="absolute z-30 w-80 bg-surface-container-lowest shadow-ambient rounded-md overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-surface-container-low flex items-center justify-between">
        <div>
          <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
            Add Annotation
          </p>
          <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-1 italic">
            "{selectedText.slice(0, 50)}{selectedText.length > 50 ? "…" : ""}"
          </p>
        </div>
        <button onClick={onCancel} className="text-on-surface-variant hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Criterion selector */}
        <div>
          <label className="block text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant mb-1.5">
            Link to Criterion
          </label>
          <select
            value={criterionId}
            onChange={(e) => { setCriterionId(e.target.value); setError(""); }}
            onMouseDown={handleDropdownOpen}
            className="w-full bg-surface-container-low border-0 border-b-2 border-outline-variant focus:border-secondary outline-none pb-1 text-body-md text-on-surface transition-colors"
          >
            <option value="">Select criterion…</option>
            {suggestedIds !== null ? (
              <>
                <optgroup label="✦ Suggested">
                  {suggestedIds
                    .map((id) => criteriaOptions.find((c) => c.id === id))
                    .filter((c): c is NonNullable<typeof c> => c !== undefined)
                    .map((c) => (
                      <option key={`sug-${c.id}`} value={c.id}>{c.id}: {c.title}</option>
                    ))}
                </optgroup>
                <optgroup label="All criteria">
                  {criteriaOptions
                    .filter((c) => !suggestedIds.includes(c.id))
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.id}: {c.title}</option>
                    ))}
                </optgroup>
              </>
            ) : (
              criteriaOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.id}: {c.title}</option>
              ))
            )}
          </select>
          {rankingError && <p className="text-body-sm text-error mt-1">{rankingError}</p>}
        </div>

        {/* Comment */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-label-md font-label font-semibold uppercase tracking-widest text-on-surface-variant">
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
          {voiceError && (
            <p className="text-body-sm text-error mt-0.5">{voiceError}</p>
          )}
        </div>

        {error && <p className="text-body-sm text-error">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
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
            Save Evidence
          </button>
        </div>
      </div>
    </div>
  );
}
