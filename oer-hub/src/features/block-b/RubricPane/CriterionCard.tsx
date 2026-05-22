import { useState, useRef, useEffect } from "react";
import type { IRubricCriterion, IAnnotation } from "../../../api/types";
import { useReviewStore } from "../../../store/reviewStore";
import { getProficientRubricMarkdownText } from "../../../data/rubricProficientLookup";
import { EvidenceBank } from "./EvidenceBank";
import { CriterionDetailOverlay } from "./CriterionDetailOverlay";
import { useVoiceInput, isSpeechSupported } from "../../../hooks/useVoiceInput";
import { useR6CoherenceCheck } from "../../../hooks/useR6CoherenceCheck";
import { useCommentNudge } from "../../../hooks/useCommentNudge";
import type { NudgeIssue, NudgeIssueType, CommentNudgeResult } from "../../../hooks/useCommentNudge";

interface CriterionCardProps {
  criterion:          IRubricCriterion;
  annotations:        IAnnotation[];
  activeAnnotationId: string | null | undefined;
  onEvidenceClick:    (annotation: IAnnotation) => void;
  onFocus:            () => void;
  /** Fields flagged by the R8 gap check that should show a red border. */
  flaggedFields?:     string[];
  /** Changes each time this card should be forced open (from "Submit Review" navigation). */
  focusTrigger?:      number;
}

const BTN: {
  key: "ni" | "proficient" | "exceeds";
  label: string;
  cls: string;
  activeCls: string;
}[] = [
  {
    key: "exceeds",
    label: "Exceeds",
    cls: "border-secondary/40 text-secondary hover:bg-secondary-container/30",
    activeCls: "bg-secondary-container border-secondary text-secondary",
  },
  {
    key: "proficient",
    label: "Proficient",
    cls: "border-outline-variant text-on-surface-variant hover:bg-surface-container",
    activeCls: "bg-primary text-on-primary border-primary",
  },
  {
    key: "ni",
    label: "Needs Improvement",
    cls: "border-error/30 text-error hover:bg-error-container/30",
    activeCls: "bg-error-container border-error text-error",
  },
];

export function CriterionCard({
  criterion,
  annotations,
  activeAnnotationId,
  onEvidenceClick,
  onFocus,
  flaggedFields,
  focusTrigger,
}: CriterionCardProps) {
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const voiceErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track which flagged fields the reviewer has already edited (clears border locally)
  const [locallyCleared, setLocallyCleared] = useState<Set<string>>(new Set());
  const flaggedKey = (flaggedFields ?? []).join(",");
  useEffect(() => {
    if (flaggedKey) {
      setLocallyCleared(new Set());
      setOpen(true);
    }
  }, [flaggedKey]);

  // Force-open when navigated to from the Submit Review button
  useEffect(() => {
    if (focusTrigger === undefined) return;
    setOpen(true);
    onFocus();
    setActiveCriterion(criterion.id, criterion.title);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusTrigger]);

  function isFieldFlagged(fieldRef: string): boolean {
    return (flaggedFields ?? []).includes(fieldRef) && !locallyCleared.has(fieldRef);
  }
  function clearFlag(fieldRef: string) {
    setLocallyCleared((s) => new Set([...s, fieldRef]));
  }

  function handleVoiceError(msg: string) {
    setVoiceError(msg);
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
    voiceErrorTimerRef.current = setTimeout(() => setVoiceError(null), 3000);
  }

  useEffect(() => () => {
    if (voiceErrorTimerRef.current) clearTimeout(voiceErrorTimerRef.current);
  }, []);

  const rubricTemplateId = useReviewStore((s) => s.rubricTemplateId);
  const setActiveCriterion = useReviewStore((s) => s.setActiveCriterion);
  const toggleNeedsImprovementActive = useReviewStore((s) => s.toggleNeedsImprovementActive);
  const toggleExceedsActive = useReviewStore((s) => s.toggleExceedsActive);
  const toggleProficientConfirmed = useReviewStore((s) => s.toggleProficientConfirmed);
  const setNeedsImprovementText = useReviewStore((s) => s.setNeedsImprovementText);
  const setExceedsText = useReviewStore((s) => s.setExceedsText);
  const getCriterionRating = useReviewStore((s) => s.getCriterionRating);
  const isCriterionAddressed = useReviewStore((s) => s.isCriterionAddressed);

  const ratingData = getCriterionRating(criterion.id);
  const evidenceCount = annotations.length;
  const done = isCriterionAddressed(criterion.id);

  const voiceExceeds = useVoiceInput({
    fieldId: `criterion-${criterion.id}-exceeds`,
    value: ratingData.exceedsText,
    onChange: (v) => setExceedsText(criterion.id, v),
    onError: handleVoiceError,
  });

  const voiceNI = useVoiceInput({
    fieldId: `criterion-${criterion.id}-ni`,
    value: ratingData.needsImprovementText,
    onChange: (v) => setNeedsImprovementText(criterion.id, v),
    onError: handleVoiceError,
  });

  const { nudgeMessage, loading: nudgeLoading, dismiss: dismissNudge } =
    useR6CoherenceCheck(criterion.id, criterion.title, annotations);

  const niNudge = useCommentNudge(
    criterion.id, criterion.title, criterion.standard,
    ratingData.needsImprovementText, "ni", annotations.length,
    ratingData.needsImprovementActive
  );
  const exceedsNudge = useCommentNudge(
    criterion.id, criterion.title, criterion.standard,
    ratingData.exceedsText, "exceeds", annotations.length,
    ratingData.exceedsActive
  );

  const fullProficientBody =
    getProficientRubricMarkdownText(rubricTemplateId, criterion.id) ?? criterion.standard;

  function handleBottomButton(key: "ni" | "proficient" | "exceeds") {
    if (key === "ni") toggleNeedsImprovementActive(criterion.id);
    else if (key === "exceeds") toggleExceedsActive(criterion.id);
    else toggleProficientConfirmed(criterion.id);
    if (!open) {
      setOpen(true);
      onFocus();
      setActiveCriterion(criterion.id, criterion.title);
    }
  }

  // Show only the active feedback column; when neither or both active, show all three.
  // Active column gets 2/3 width, Proficient Standard gets 1/3.
  const showExceedsCol = ratingData.exceedsActive || !ratingData.needsImprovementActive;
  const showNICol = ratingData.needsImprovementActive || !ratingData.exceedsActive;
  const gridClass = (showExceedsCol && showNICol)
    ? "grid-cols-3"
    : showNICol
      ? "grid-cols-[1fr_2fr]"   // Proficient 1/3 | NI 2/3
      : "grid-cols-[2fr_1fr]";  // Exceeds 2/3 | Proficient 1/3

  return (
    <div
      data-criterion-id={criterion.id}
      className={[
        "rounded-sm overflow-hidden transition-all",
        done ? "bg-surface-container-lowest shadow-card" : "bg-surface-container-low",
      ].join(" ")}
    >
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={() => {
            const opening = !open;
            setOpen(opening);
            if (opening) {
              onFocus();
              setActiveCriterion(criterion.id, criterion.title);
            } else {
              setActiveCriterion(null, null);
            }
          }}
          className="flex w-full min-w-0 items-center gap-3 text-left hover:bg-surface-container/50 transition-colors rounded-sm -ml-1 pl-1 pr-2 py-1 select-text"
        >
          <div
            className={[
              "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors",
              done
                ? "bg-secondary border-secondary"
                : "border-outline-variant bg-transparent",
            ].join(" ")}
          >
            {done && (
              <span className="material-symbols-outlined text-on-secondary text-[12px]">check</span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant">
              {criterion.id}
            </p>
            <p className="font-headline text-body-md font-semibold text-on-surface leading-snug truncate">
              {criterion.title}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {evidenceCount > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-secondary-container/60 text-secondary rounded-full text-label-sm font-label font-semibold">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>bookmark</span>
                {evidenceCount}
              </span>
            )}
            <ActiveRatingSummary r={ratingData} />
            <span
              className="material-symbols-outlined text-on-surface-variant text-[20px] transition-transform"
              style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
            >
              expand_more
            </span>
          </div>
        </button>
      </div>

      {open && (
        <div className="px-5 pb-5 space-y-5">
          <div className={`grid ${gridClass} gap-0 rounded-sm overflow-hidden min-h-[220px] items-stretch`}>
            {showExceedsCol && (
            <div className="bg-surface-container p-4 flex flex-col min-h-0">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary flex-shrink-0">
                Exceeds
              </p>
              <div className="mt-3 flex-1 flex flex-col min-h-[7rem]">
                {ratingData.exceedsActive ? (
                  <>
                    <textarea
                      value={ratingData.exceedsText}
                      onChange={(e) => {
                        setExceedsText(criterion.id, e.target.value);
                        if (isFieldFlagged("exceeds_comment")) clearFlag("exceeds_comment");
                      }}
                      placeholder="Your feedback…"
                      rows={4}
                      className={[
                        "w-full flex-1 min-h-[7rem] text-body-sm text-on-surface bg-transparent outline-none resize-y placeholder:text-on-surface-variant/50 transition-colors font-headline",
                        isFieldFlagged("exceeds_comment")
                          ? "border border-error/70 rounded-sm"
                          : voiceExceeds.isRecording
                            ? "border-0 border-b border-error/50"
                            : "border-0 border-b border-secondary/40 focus:border-secondary",
                      ].join(" ")}
                    />
                    {isSpeechSupported && (
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-shrink-0">
                        {voiceExceeds.isRecording && (
                          <button type="button" onClick={voiceExceeds.discard}
                            className="text-label-sm font-label text-on-surface-variant/60 hover:text-error transition-colors">
                            Discard
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={voiceExceeds.isRecording ? voiceExceeds.stopRecording : voiceExceeds.startRecording}
                          title={voiceExceeds.isRecording ? "Stop recording" : "Dictate feedback"}
                          className={voiceExceeds.isRecording ? "voice-mic-active" : "text-on-surface-variant/40 hover:text-on-surface-variant transition-colors rounded-full"}
                        >
                          <span className="material-symbols-outlined text-[14px]">mic</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="flex-1 min-h-[7rem] border-b border-secondary/20"
                    aria-hidden
                  />
                )}
              </div>
            </div>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.getSelection()?.toString().trim()) return;
                setDetailOpen(true);
                onFocus();
              }}
              className="bg-surface-container-low p-4 text-left hover:bg-surface-container transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 flex flex-col min-h-0 select-text"
            >
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant flex-shrink-0">
                Proficient Standard
              </p>
              <p className="font-headline text-body-sm text-on-surface leading-relaxed line-clamp-6 mt-3 flex-1 text-left">
                {criterion.standard}
              </p>
            </button>

            {showNICol && (
            <div className="bg-surface-container p-4 flex flex-col min-h-0">
              <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-error flex-shrink-0">
                Needs Improvement
              </p>
              <div className="mt-3 flex-1 flex flex-col min-h-[7rem]">
                {ratingData.needsImprovementActive ? (
                  <>
                    <textarea
                      value={ratingData.needsImprovementText}
                      onChange={(e) => {
                        setNeedsImprovementText(criterion.id, e.target.value);
                        if (isFieldFlagged("ni_comment")) clearFlag("ni_comment");
                      }}
                      placeholder="Your feedback…"
                      rows={4}
                      className={[
                        "w-full flex-1 min-h-[7rem] text-body-sm text-on-surface bg-transparent outline-none resize-y placeholder:text-on-surface-variant/50 transition-colors font-headline",
                        isFieldFlagged("ni_comment")
                          ? "border border-error/70 rounded-sm"
                          : voiceNI.isRecording
                            ? "border-0 border-b border-error/50"
                            : "border-0 border-b border-outline-variant focus:border-secondary",
                      ].join(" ")}
                    />
                    {isSpeechSupported && (
                      <div className="flex items-center justify-end gap-1.5 mt-0.5 flex-shrink-0">
                        {voiceNI.isRecording && (
                          <button type="button" onClick={voiceNI.discard}
                            className="text-label-sm font-label text-on-surface-variant/60 hover:text-error transition-colors">
                            Discard
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={voiceNI.isRecording ? voiceNI.stopRecording : voiceNI.startRecording}
                          title={voiceNI.isRecording ? "Stop recording" : "Dictate feedback"}
                          className={voiceNI.isRecording ? "voice-mic-active" : "text-on-surface-variant/40 hover:text-on-surface-variant transition-colors rounded-full"}
                        >
                          <span className="material-symbols-outlined text-[14px]">mic</span>
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div
                    className="flex-1 min-h-[7rem] border-b border-outline-variant/20"
                    aria-hidden
                  />
                )}
              </div>
            </div>
            )}
          </div>

          {/* Status row — colored badges per issue type + consistency + all-clear */}
          {(() => {
            const bothActive = ratingData.exceedsActive && ratingData.needsImprovementActive;
            const showEx = ratingData.exceedsActive && (exceedsNudge.pending || exceedsNudge.loading || exceedsNudge.issues.length > 0 || exceedsNudge.allClear);
            const showNI = ratingData.needsImprovementActive && (niNudge.pending || niNudge.loading || niNudge.issues.length > 0 || niNudge.allClear);
            if (!showEx && !showNI && !nudgeLoading && !nudgeMessage) return null;
            return (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {showEx && <FieldStatus nudge={exceedsNudge} fieldLabel={bothActive ? "Exceeds" : undefined} />}
                {showNI && <FieldStatus nudge={niNudge} fieldLabel={bothActive ? "NI" : undefined} />}
                {nudgeLoading && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-200 text-violet-600 rounded-full text-xs font-label">
                    <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
                    <span>Checking consistency…</span>
                  </div>
                )}
                {nudgeMessage && !nudgeLoading && (
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-violet-50 border border-violet-300 text-violet-700 rounded-full text-xs font-label font-semibold">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>sync_problem</span>
                    Inconsistent feedback
                  </span>
                )}
              </div>
            );
          })()}

          {voiceError && (
            <p className="text-body-sm text-error text-right -mt-2">{voiceError}</p>
          )}

          <div className="flex gap-2">
            {BTN.map(({ key, label, cls, activeCls }) => {
              const active =
                key === "ni"
                  ? ratingData.needsImprovementActive
                  : key === "exceeds"
                    ? ratingData.exceedsActive
                    : ratingData.proficientConfirmed;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleBottomButton(key)}
                  className={[
                    "flex-1 py-2.5 border-2 rounded-sm text-label-md font-label font-semibold uppercase tracking-widest transition-all",
                    active ? activeCls : cls,
                  ].join(" ")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* R6 coherence banner — full detail below buttons */}
          {nudgeMessage && !nudgeLoading && (
            <R6NudgeBanner message={nudgeMessage} onDismiss={dismissNudge} />
          )}

          <div
            className={
              isFieldFlagged("annotations")
                ? "rounded-sm border border-error/70 p-1"
                : undefined
            }
          >
            <EvidenceBank
              annotations={annotations}
              activeAnnotationId={activeAnnotationId}
              onEvidenceClick={onEvidenceClick}
            />
          </div>
        </div>
      )}

      <CriterionDetailOverlay
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        criterionCode={criterion.id}
        title={criterion.title}
        bodyText={fullProficientBody}
      />
    </div>
  );
}

function R6NudgeBanner({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 bg-secondary-container/30 border border-secondary/20 rounded-sm">
      <span
        className="material-symbols-outlined text-[16px] text-secondary flex-shrink-0 mt-0.5"
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        auto_awesome
      </span>
      <p className="flex-1 text-body-sm text-on-surface leading-relaxed">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss suggestion"
        className="flex-shrink-0 text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">close</span>
      </button>
    </div>
  );
}

const ISSUE_CONFIG: Record<NudgeIssueType, { cls: string; clickable: boolean }> = {
  harsh_tone:      { cls: "bg-rose-50 border-rose-300 text-rose-700 hover:bg-rose-100",     clickable: true  },
  lacks_evidence:  { cls: "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100", clickable: true  },
  generic_comment: { cls: "bg-orange-50 border-orange-300 text-orange-700",                 clickable: false },
  short_comment:   { cls: "bg-sky-50 border-sky-300 text-sky-700",                          clickable: false },
};

function IssuePill({ issue, onOpen }: { issue: NudgeIssue; onOpen: () => void }) {
  const { cls, clickable } = ISSUE_CONFIG[issue.type];
  if (clickable) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title={issue.description ?? undefined}
        className={`flex items-center gap-1 px-3 py-1 border rounded-full text-xs font-label font-semibold transition-colors ${cls}`}
      >
        <span className="material-symbols-outlined text-[11px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
        {issue.label}
      </button>
    );
  }
  return (
    <span
      title={issue.description ?? undefined}
      className={`flex items-center gap-1 px-3 py-1 border rounded-full text-xs font-label font-semibold ${cls}`}
    >
      {issue.label}
    </span>
  );
}

function FieldStatus({ nudge, fieldLabel }: { nudge: CommentNudgeResult; fieldLabel?: string }) {
  const hasContent = nudge.pending || nudge.loading || nudge.issues.length > 0 || nudge.allClear;
  if (!hasContent) return null;

  const hasAIIssue = nudge.issues.some((i) => i.type === "harsh_tone" || i.type === "lacks_evidence");

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {fieldLabel && <span className="text-xs font-label text-on-surface-variant/50">{fieldLabel}:</span>}

      {/* Rule-based + AI issue pills — always shown when present */}
      {nudge.issues.map((issue) => (
        <IssuePill key={issue.type} issue={issue} onOpen={nudge.openInChat} />
      ))}

      {/* Analyzing spinner — shows alongside rule badges while AI is pending */}
      {(nudge.pending || nudge.loading) && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-xs font-label">
          <span className="material-symbols-outlined text-[13px] animate-spin">progress_activity</span>
          <span>Analyzing…</span>
        </div>
      )}

      {/* All-clear — only when no issues and AI has finished */}
      {nudge.allClear && (
        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-300 text-green-700 rounded-full text-xs font-label font-semibold">
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          Looks good
        </div>
      )}

      {/* Dismiss — only for AI-based issues */}
      {hasAIIssue && (
        <button
          type="button"
          onClick={nudge.dismiss}
          aria-label="Dismiss"
          className="text-on-surface-variant/40 hover:text-on-surface-variant transition-colors ml-0.5"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}
    </div>
  );
}

function ActiveRatingSummary({
  r,
}: {
  r: {
    needsImprovementActive: boolean;
    exceedsActive: boolean;
    proficientConfirmed: boolean;
  };
}) {
  const pills: { label: string; cls: string }[] = [];
  if (r.exceedsActive) {
    pills.push({ label: "Exceeds", cls: "bg-secondary-container text-secondary" });
  }
  if (r.proficientConfirmed) {
    pills.push({ label: "Proficient", cls: "bg-primary text-on-primary" });
  }
  if (r.needsImprovementActive) {
    pills.push({ label: "NI", cls: "bg-error-container text-error" });
  }
  if (pills.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
      {pills.map((p) => (
        <span
          key={p.label}
          className={`px-2 py-0.5 text-label-sm font-label font-semibold uppercase tracking-widest rounded-full ${p.cls}`}
        >
          {p.label}
        </span>
      ))}
    </div>
  );
}
