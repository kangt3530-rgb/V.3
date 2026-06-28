import { useRef, useEffect, useState } from "react";
import type {
  IAggregatedCriterionFeedback,
  IAuthorItemResponse,
  ICriterionResponse,
  IFreeNote,
} from "../../api/types";
import { upsertCriterionResponse } from "../../api";
import { useRevisionStore } from "../../store/revisionStore";
import { EvidenceCard } from '../../components/ui/EvidenceCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { RubricDefinitionModal } from "./RubricDefinitionModal";
import { StatusPillGroup } from "./StatusPillGroup";
import { CriterionProgressIndicator } from "./CriterionProgressIndicator";
import { getCriterionDefinition } from "../../data/rubric-md";

interface CriterionSectionProps {
  criterion: IAggregatedCriterionFeedback;
  freeNotes: IFreeNote[];
  response: ICriterionResponse | null;
  rubricName: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onViewAnnotation: (annotationId: string) => void;
  onResponseSaved: (r: ICriterionResponse) => void;
  itemResponses: IAuthorItemResponse[];
  onItemResponseSaved: (r: IAuthorItemResponse) => void;
  isReadOnly?: boolean;
}

function buildDefaultResponse(
  criterion: IAggregatedCriterionFeedback,
  existing: ICriterionResponse | null,
  draft: Partial<ICriterionResponse>
): ICriterionResponse {
  return {
    oerId: draft.oerId ?? existing?.oerId ?? "",
    rubricTemplateId: criterion.rubricTemplateId,
    criterionId: criterion.criterionId,
    revisionLog: draft.revisionLog ?? existing?.revisionLog ?? "",
    status: draft.status ?? existing?.status ?? "unresolved",
    resolvedAt:
      (draft.status ?? existing?.status) === "resolved"
        ? (existing?.resolvedAt ?? new Date().toISOString())
        : null,
    markResolvedAutoFilled: draft.markResolvedAutoFilled ?? existing?.markResolvedAutoFilled,
  };
}

function toStatusBadgeVariant(summary: string): 'does_not_meet' | 'exemplifies' | 'exceeds' {
  if (summary === 'exceeds') return 'exceeds'
  if (summary === 'proficient') return 'exemplifies'
  return 'does_not_meet'
}

function overallCommentBg(displayRating: string): string {
  if (displayRating === 'exceeds') return 'bg-green-50 border-green-200';
  if (displayRating === 'proficient') return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

const AUTHOR_INPUT =
  "w-full rounded-md border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none transition-colors";

const LETTER_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

export function CriterionSection({
  criterion,
  freeNotes,
  response,
  rubricName: _rubricName,
  isCollapsed,
  onToggleCollapse,
  onViewAnnotation,
  onResponseSaved,
  itemResponses,
  onItemResponseSaved,
  isReadOnly = false,
}: CriterionSectionProps) {
  const { draftResponses, updateDraftResponse, currentOerId, viewingAnnotationId } = useRevisionStore();
  const draft = draftResponses[criterion.criterionId] ?? {};
  const criterionId = criterion.criterionId;
  const oerId = currentOerId ?? response?.oerId ?? "";

  const [definitionModalOpen, setDefinitionModalOpen] = useState(false);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [rubricContentExpanded, setRubricContentExpanded] = useState(false);
  const [expandedRevNotes, setExpandedRevNotes] = useState<Set<string>>(new Set());
  const [overallLogExpanded, setOverallLogExpanded] = useState(() => (response?.revisionLog ?? "").trim().length > 0);
  const [autoResolveOptedOut, setAutoResolveOptedOut] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revNoteDebounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      Object.values(revNoteDebounceRefs.current).forEach(clearTimeout);
    },
    []
  );

  function buildResponse(overrides?: Partial<ICriterionResponse>): ICriterionResponse {
    return buildDefaultResponse(criterion, response, { ...draft, oerId, ...overrides });
  }

  async function saveResponse(overrides?: Partial<ICriterionResponse>) {
    const saved = await upsertCriterionResponse(buildResponse(overrides));
    onResponseSaved(saved);
  }

  function handleRevisionLogChange(val: string) {
    updateDraftResponse(criterionId, { revisionLog: val });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveResponse({ revisionLog: val }), 1000);
  }

  function handleToggleResolved(checked: boolean) {
    const newStatus = checked ? "resolved" : "unresolved";
    if (!checked) setAutoResolveOptedOut(true);
    updateDraftResponse(criterionId, { status: newStatus, markResolvedAutoFilled: false });
    saveResponse({ status: newStatus, markResolvedAutoFilled: false });

    if (checked && !nudgeDismissed) {
      const log = (draft.revisionLog ?? response?.revisionLog ?? "").trim();
      if (criterion.annotations.length >= 2 && log.length < 20) {
        setShowNudge(true);
      }
    } else {
      setShowNudge(false);
    }
  }

  const revisionLog = draft.revisionLog ?? response?.revisionLog ?? "";
  const currentStatus = draft.status ?? response?.status ?? "unresolved";

  const displayRating = criterion.ratingSummary === "mixed" ? "needs_improvement" : criterion.ratingSummary;
  const isNI = displayRating === "needs_improvement";
  const isExceeds = displayRating === "exceeds";
  const isProficient = displayRating === "proficient";
  const showAuthorBlocks = isNI || isExceeds;

  const linkedFreeNotes = freeNotes.filter((n) =>
    (n.criterionIds ?? []).includes(criterionId)
  );

  type UnifiedItem =
    | { kind: "annotation"; item: typeof criterion.annotations[number] }
    | { kind: "freeNote"; item: typeof linkedFreeNotes[number] };

  const tagSortOrder = (tag: string | null) =>
    tag === "action_item" ? 0 : tag === "quick_fix" ? 1 : 2;

  const unifiedItems: UnifiedItem[] = [
    ...criterion.annotations.map((a) => ({ kind: "annotation" as const, item: a })),
    ...linkedFreeNotes.map((n) => ({ kind: "freeNote" as const, item: n })),
  ].sort((a, b) => {
    const td = tagSortOrder(a.item.tag) - tagSortOrder(b.item.tag);
    return td !== 0 ? td : a.item.createdAt.localeCompare(b.item.createdAt);
  });

  const handledCount = unifiedItems.filter((u) => {
    const r = itemResponses.find((r) => r.annotationId === u.item.id);
    return r?.itemStatus != null;
  }).length;

  const unaddressedCount = unifiedItems.length - handledCount;

  function handleRevNoteChange(itemId: string, value: string, existing: IAuthorItemResponse | undefined) {
    const base: IAuthorItemResponse = existing ?? {
      annotationId: itemId,
      oerId,
      rubricTemplateId: criterion.rubricTemplateId,
      itemStatus: null,
    };
    if (revNoteDebounceRefs.current[itemId]) clearTimeout(revNoteDebounceRefs.current[itemId]);
    revNoteDebounceRefs.current[itemId] = setTimeout(() => {
      onItemResponseSaved({ ...base, revisionNote: value });
    }, 800);
  }

  const actionableItems = unifiedItems.filter((u) => u.item.tag === "action_item" || u.item.tag === "quick_fix");
  const allActionableHandled =
    actionableItems.length > 0 &&
    actionableItems.every((u) => {
      const r = itemResponses.find((r) => r.annotationId === u.item.id);
      return r?.itemStatus != null;
    });

  useEffect(() => {
    if (!isNI || isReadOnly || autoResolveOptedOut) return;
    if (allActionableHandled && currentStatus !== "resolved") {
      updateDraftResponse(criterionId, { status: "resolved", markResolvedAutoFilled: true });
      saveResponse({ status: "resolved", markResolvedAutoFilled: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allActionableHandled]);

  const autoFillActive =
    isNI &&
    !autoResolveOptedOut &&
    allActionableHandled &&
    currentStatus === "resolved" &&
    (draft.markResolvedAutoFilled ?? response?.markResolvedAutoFilled ?? false);

  const criterionDef = getCriterionDefinition(criterion.rubricTemplateId, criterionId);
  const standards = criterionDef?.standards ?? [];

  return (
    <div id={`criterion-${criterion.criterionId}`} className="border border-outline-variant/20 border-l-2 border-l-outline-variant/40 rounded-r-lg overflow-hidden bg-surface-container-lowest">
      {/* ── Section header ── */}
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3 select-none hover:bg-surface-container-low/60 transition-colors"
        onClick={onToggleCollapse}
        role="button"
        aria-expanded={!isCollapsed}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="material-symbols-outlined text-on-surface-variant/60 text-sm flex-shrink-0 transition-transform duration-200"
            style={{ transform: isCollapsed ? "rotate(-90deg)" : "rotate(0deg)" }}
          >
            expand_more
          </span>
          <span className="text-sm font-semibold text-primary truncate">
            {criterionId}. {criterion.criterionTitle}
          </span>
          {unaddressedCount > 0 && (
            <span className="flex-shrink-0 px-1.5 py-0.5 bg-secondary-container text-secondary rounded-full text-[11px] font-semibold leading-none">
              {unaddressedCount}
            </span>
          )}
        </div>
        <div className="flex-shrink-0 ml-3 flex items-center gap-2">
          <CriterionProgressIndicator handled={handledCount} total={unifiedItems.length} />
          <StatusBadge variant={toStatusBadgeVariant(displayRating)} size="compact" />
        </div>
      </div>

      <RubricDefinitionModal
        isOpen={definitionModalOpen}
        onClose={() => setDefinitionModalOpen(false)}
        rubricId={criterion.rubricTemplateId}
        criterionId={criterion.criterionId}
      />

      {/* ── Expanded body ── */}
      {!isCollapsed && (
        <div className="px-4 pb-4 space-y-4 border-t border-outline-variant/15">

          {/* Block 1: Reviewer's overall comment — sticky, prominent, rating-colored */}
          {criterion.overallComment && (
            <div className={`mt-3 rounded-md p-3 border-l-2 ${overallCommentBg(displayRating)}`}>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                {criterion.overallComment}
              </p>
            </div>
          )}

          {/* Block 2: Rubric content — collapsible, lettered sub-criteria */}
          <div className="border border-outline-variant/15 rounded-md overflow-hidden">
            <button
              type="button"
              onClick={() => setRubricContentExpanded((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2 bg-surface-container-low hover:bg-surface-container-low/80 transition-colors text-left select-none"
            >
              <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                Rubric content
              </span>
              <span
                className="material-symbols-outlined text-on-surface-variant/50 text-sm transition-transform duration-200"
                style={{ transform: rubricContentExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
              >
                expand_more
              </span>
            </button>
            {rubricContentExpanded && standards.length > 0 && (
              <div className="px-3 py-2.5 space-y-1.5 bg-surface-container-lowest">
                {standards.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="flex-shrink-0 text-xs font-semibold text-on-surface-variant/50 w-4 text-right">
                      {LETTER_LABELS[i] ?? String(i + 1)}.
                    </span>
                    <p className="text-xs text-on-surface leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            )}
            {rubricContentExpanded && standards.length === 0 && (
              <div className="px-3 py-2.5">
                <p className="text-xs text-on-surface-variant/60 italic">{criterion.criterionStandard}</p>
              </div>
            )}
          </div>

          {/* Block 3: Annotations */}
          {unifiedItems.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
                  Annotations ({unifiedItems.length})
                </p>
              </div>
              <div className="space-y-2">
                {unifiedItems.map(({ kind, item }) => {
                  const otherCriteria = kind === "annotation"
                    ? (item.criterionIds ?? []).filter((id) => id !== criterionId)
                    : [];
                  const isViewing = kind === "annotation" && item.id === viewingAnnotationId;
                  const itemStatus = itemResponses.find((r) => r.annotationId === item.id)?.itemStatus ?? null;
                  const existingResponse = itemResponses.find((r) => r.annotationId === item.id);
                  const savedNote = existingResponse?.revisionNote ?? "";
                  const isExpanded = expandedRevNotes.has(item.id) || savedNote.length > 0;

                  const annotation = {
                    id: item.id,
                    comment: kind === "annotation" ? item.comment : item.text,
                    selectedText: kind === "annotation" ? item.anchor?.selectedText : undefined,
                    tag: item.tag,
                  };

                  return (
                    <div
                      id={kind === "annotation" ? `annotation-${item.id}` : undefined}
                      key={item.id}
                      className={`rounded-md transition-colors duration-300 ${
                        isViewing ? "ring-1 ring-amber-200" : ""
                      }`}
                    >
                      <EvidenceCard
                        annotation={annotation}
                        onGoToAnnotation={kind === "annotation" ? () => onViewAnnotation(item.id) : undefined}
                      />
                      {otherCriteria.length > 0 && (
                        <p className="text-[10px] text-on-surface-variant/50 px-3 pt-1">
                          Also under {otherCriteria.join(", ")}
                        </p>
                      )}
                      {kind === "freeNote" && (
                        <button
                          onClick={() => document.getElementById("reviewer-general-comments")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                          className="text-xs text-secondary hover:underline transition-colors px-3 pt-1 block"
                        >
                          ↗ View source
                        </button>
                      )}
                      {/* Inline revision log + status pill */}
                      <div className="px-3 pb-2 pt-1 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {isExpanded ? (
                            <textarea
                              rows={2}
                              placeholder="How you addressed this…"
                              defaultValue={savedNote}
                              onChange={(e) => handleRevNoteChange(item.id, e.target.value, existingResponse)}
                              onBlur={(e) => {
                                if (!e.target.value.trim()) {
                                  setExpandedRevNotes((prev) => {
                                    const next = new Set(prev);
                                    next.delete(item.id);
                                    return next;
                                  });
                                }
                              }}
                              autoFocus={!savedNote}
                              className="w-full rounded border border-outline-variant/40 bg-white px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none resize-none"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedRevNotes((prev) => new Set(prev).add(item.id))
                              }
                              className="text-xs text-on-surface-variant/40 hover:text-secondary transition-colors"
                            >
                              + Revision log review
                            </button>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <StatusPillGroup
                            itemId={item.id}
                            status={itemStatus}
                            onChange={(status) =>
                              onItemResponseSaved({
                                annotationId: item.id,
                                oerId,
                                rubricTemplateId: criterion.rubricTemplateId,
                                itemStatus: status,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Block 4: Revision log (NI, Mixed, Exceeds — not Proficient) */}
          {showAuthorBlocks && !isProficient && (
            <div className={`space-y-1.5 ${isExceeds ? "opacity-60" : ""}`}>
              {!overallLogExpanded ? (
                <button
                  type="button"
                  onClick={() => setOverallLogExpanded(true)}
                  className="text-xs text-on-surface-variant/40 hover:text-secondary transition-colors"
                >
                  + Add overall revision log for this criterion
                </button>
              ) : (
                <>
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">Revision Log</p>
                  <textarea
                    rows={3}
                    placeholder="Leave any notes about your revisions or thoughts on this feedback..."
                    value={revisionLog}
                    onChange={(e) => handleRevisionLogChange(e.target.value)}
                    onBlur={(e) => {
                      if (!e.target.value.trim()) setOverallLogExpanded(false);
                    }}
                    disabled={isReadOnly}
                    className={`${AUTHOR_INPUT} resize-none ${isReadOnly ? "opacity-60 cursor-not-allowed" : ""}`}
                  />
                </>
              )}
            </div>
          )}

          {/* Block 5: Mark resolved (NI and Mixed only) */}
          {isNI && (
            <div className="pt-3 border-t border-outline-variant/15 space-y-2">
              <div className="flex justify-between items-center gap-3">
                {autoFillActive && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    All actionable items handled
                  </span>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  {/* ✱ button — full rubric with glossary */}
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDefinitionModalOpen(true); }}
                    title="View full rubric with glossary"
                    className="text-sm text-on-surface-variant/40 hover:text-primary transition-colors"
                  >
                    ✱
                  </button>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-on-surface-variant/70 select-none">
                    <input
                      type="checkbox"
                      checked={currentStatus === "resolved"}
                      onChange={(e) => handleToggleResolved(e.target.checked)}
                      disabled={isReadOnly}
                      className={`rounded border-outline-variant accent-primary w-3.5 h-3.5 ${isReadOnly ? "cursor-not-allowed opacity-60" : ""}`}
                    />
                    Mark resolved
                  </label>
                </div>
              </div>
              {showNudge && !nudgeDismissed && (
                <div className="bg-amber-50 rounded-md px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
                  <span className="flex-shrink-0">💡</span>
                  <p className="flex-1">
                    The reviewer raised {criterion.annotations.length} specific points on this criterion. Consider adding notes about how you addressed them in your revision log.
                  </p>
                  <button
                    onClick={() => { setShowNudge(false); setNudgeDismissed(true); }}
                    className="flex-shrink-0 text-amber-600 hover:text-amber-800"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ✱ button for non-NI criteria */}
          {!isNI && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setDefinitionModalOpen(true)}
                title="View full rubric with glossary"
                className="text-sm text-on-surface-variant/40 hover:text-primary transition-colors"
              >
                ✱
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
