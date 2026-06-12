import { useRef, useEffect, useState } from "react";
import type {
  IAggregatedCriterionFeedback,
  IAuthorItemResponse,
  ICriterionResponse,
  ICoordinatorQuestion,
  IFreeNote,
} from "../../api/types";
import { upsertCriterionResponse } from "../../api";
import { useRevisionStore } from "../../store/revisionStore";
import { TAG_CONFIG } from "../block-b/annotationTagConfig";
import { Button } from "../../components/ui/Button";
import { RatingPill } from "./RatingPill";
import { RubricDefinitionModal } from "./RubricDefinitionModal";
import { StatusPillGroup } from "./StatusPillGroup";
import { CriterionFilterPills } from "./CriterionFilterPills";
import { CriterionProgressIndicator } from "./CriterionProgressIndicator";

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
    coordinatorQuestion:
      draft.coordinatorQuestion !== undefined
        ? draft.coordinatorQuestion
        : existing?.coordinatorQuestion ?? null,
    status: draft.status ?? existing?.status ?? "unresolved",
    resolvedAt:
      (draft.status ?? existing?.status) === "resolved"
        ? (existing?.resolvedAt ?? new Date().toISOString())
        : null,
    markResolvedAutoFilled: draft.markResolvedAutoFilled ?? existing?.markResolvedAutoFilled,
  };
}

// Shared section label style
const SECTION_LABEL = "text-xs font-semibold tracking-widest uppercase text-gray-400";
// Shared author input style
const AUTHOR_INPUT =
  "w-full rounded-md border border-outline-variant bg-white px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none transition-colors";

export function CriterionSection({
  criterion,
  freeNotes,
  response,
  rubricName,
  isCollapsed,
  onToggleCollapse,
  onViewAnnotation,
  onResponseSaved,
  itemResponses,
  onItemResponseSaved,
  isReadOnly = false,
}: CriterionSectionProps) {
  const { draftResponses, updateDraftResponse, currentOerId, viewingAnnotationId, openAiChat, aiChatCriterionId, aiChatOpen } = useRevisionStore();
  const draft = draftResponses[criterion.criterionId] ?? {};
  const criterionId = criterion.criterionId;
  const oerId = currentOerId ?? response?.oerId ?? "";

  const [definitionModalOpen, setDefinitionModalOpen] = useState(false);
  const [questionInput, setQuestionInput] = useState("");
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [filterTab, setFilterTab] = useState<"all" | "actionable" | "notes">("all");
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

  function handleSendQuestion() {
    if (!questionInput.trim()) return;
    const q: ICoordinatorQuestion = {
      id: `q-${criterionId}-${Date.now()}`,
      questionText: questionInput.trim(),
      sentAt: new Date().toISOString(),
      reply: null,
      repliedAt: null,
    };
    updateDraftResponse(criterionId, { coordinatorQuestion: q, status: "awaiting_clarification" });
    setQuestionInput("");
    saveResponse({ coordinatorQuestion: q, status: "awaiting_clarification" });
  }

  function handleCancelQuestion() {
    updateDraftResponse(criterionId, { coordinatorQuestion: null, status: "unresolved" });
    saveResponse({ coordinatorQuestion: null, status: "unresolved" });
  }

  const coordinatorQuestion =
    draft.coordinatorQuestion !== undefined
      ? draft.coordinatorQuestion
      : response?.coordinatorQuestion ?? null;

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

  const actionableCount = unifiedItems.filter((u) => u.item.tag === "action_item" || u.item.tag === "quick_fix").length;
  const notesCount = unifiedItems.filter((u) => u.item.tag === null).length;

  const filteredItems = unifiedItems.filter((u) => {
    if (filterTab === "actionable") return u.item.tag === "action_item" || u.item.tag === "quick_fix";
    if (filterTab === "notes") return u.item.tag === null;
    return true;
  });

  const handledCount = unifiedItems.filter((u) => {
    const r = itemResponses.find((r) => r.annotationId === u.item.id);
    return r?.itemStatus != null;
  }).length;

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
          <span className="text-xs font-mono text-on-surface-variant/70 flex-shrink-0 w-7">
            {criterionId}
          </span>
          <span className="text-xs text-on-surface-variant/40 flex-shrink-0">·</span>
          <span className="text-xs text-on-surface-variant/50 flex-shrink-0 hidden sm:block truncate max-w-[100px]">
            {rubricName}
          </span>
          <span className="text-on-surface-variant/40 flex-shrink-0">—</span>
          <span className="text-base font-semibold text-primary truncate">
            {criterion.criterionTitle}
          </span>
        </div>
        <div className="flex-shrink-0 ml-3 flex items-center gap-2">
          <CriterionProgressIndicator handled={handledCount} total={unifiedItems.length} />
          <RatingPill summary={displayRating} />
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

          {/* Block 1: About this criterion */}
          <div className="mt-3 bg-surface-container-low rounded-md p-3 space-y-1.5">
            <p className={SECTION_LABEL}>About this criterion</p>
            <p className="text-sm text-on-surface leading-relaxed">
              {criterion.criterionStandard}
            </p>
            <div className="flex gap-4 text-xs text-on-surface-variant/60 mt-0.5">
              <button onClick={() => setDefinitionModalOpen(true)} className="hover:text-primary transition-colors">Read full definition</button>
              <button
                onClick={() => openAiChat(criterion.criterionId)}
                className={`hover:text-primary transition-colors ${
                  aiChatOpen && aiChatCriterionId === criterion.criterionId
                    ? "text-primary font-medium"
                    : ""
                }`}
              >
                💬 Ask AI{aiChatOpen && aiChatCriterionId === criterion.criterionId ? " (active)" : ""}
              </button>
            </div>
          </div>

          {/* Block 2: Reviewer's overall comment */}
          {criterion.overallComment && (
            <div className="space-y-1.5">
              <p className={SECTION_LABEL}>Reviewer&rsquo;s Overall Comment</p>
              <div className="bg-amber-50/70 rounded-md p-3 border-l-2 border-amber-300">
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {criterion.overallComment}
                </p>
              </div>
            </div>
          )}

          {/* Block 3: Unified annotations + linked free notes */}
          {unifiedItems.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className={SECTION_LABEL}>Annotations ({unifiedItems.length})</p>
                <CriterionFilterPills
                  total={unifiedItems.length}
                  actionableCount={actionableCount}
                  notesCount={notesCount}
                  active={filterTab}
                  onChange={setFilterTab}
                />
              </div>
              <div className="space-y-2">
                {filteredItems.map(({ kind, item }) => {
                  const tag = item.tag;
                  const tagCfg = tag ? TAG_CONFIG[tag] : null;
                  const otherCriteria = kind === "annotation"
                    ? (item.criterionIds ?? []).filter((id) => id !== criterionId)
                    : [];
                  const isViewing = kind === "annotation" && item.id === viewingAnnotationId;
                  const itemStatus = itemResponses.find((r) => r.annotationId === item.id)?.itemStatus ?? null;

                  return (
                    <div
                      id={kind === "annotation" ? `annotation-${item.id}` : undefined}
                      key={item.id}
                      className={`rounded-md px-3 py-2 space-y-1.5 transition-colors duration-300 ${
                        isViewing
                          ? "bg-amber-50/80 border border-amber-200/60"
                          : "bg-surface-container/60"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {tagCfg && (
                              <>
                                <span
                                  className={`material-symbols-outlined text-[14px] flex-shrink-0 ${tagCfg.cls}`}
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  {tagCfg.icon}
                                </span>
                                <span className={`text-xs font-semibold flex-shrink-0 ${tagCfg.cls}`}>
                                  {tagCfg.label}
                                </span>
                              </>
                            )}
                            {isViewing && (
                              <span className="ml-auto flex-shrink-0 text-[10px] font-semibold text-sky-600 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded">
                                VIEWING
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-on-surface leading-relaxed">
                            {kind === "annotation" ? item.comment : item.text}
                          </p>
                          {otherCriteria.length > 0 && (
                            <p className="text-[10px] text-on-surface-variant/50">
                              Also under {otherCriteria.join(", ")}
                            </p>
                          )}
                          <button
                            onClick={() => {
                              if (kind === "annotation") {
                                onViewAnnotation(item.id);
                              } else {
                                document.getElementById("reviewer-general-comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }
                            }}
                            className="text-xs text-secondary hover:underline transition-colors"
                          >
                            {kind === "annotation" ? "↗ View annotation" : "↗ View source"}
                          </button>
                          {/* Inline revision note */}
                          {(() => {
                            const existingResponse = itemResponses.find((r) => r.annotationId === item.id);
                            const savedNote = existingResponse?.revisionNote ?? "";
                            const isExpanded = expandedRevNotes.has(item.id) || savedNote.length > 0;
                            return isExpanded ? (
                              <textarea
                                rows={2}
                                placeholder="Note how you addressed this..."
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
                                className="mt-1 w-full rounded border border-outline-variant/40 bg-white px-2 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:border-secondary focus:outline-none resize-none"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedRevNotes((prev) => new Set(prev).add(item.id))
                                }
                                className="text-xs text-on-surface-variant/40 hover:text-secondary transition-colors"
                              >
                                + Add revision note
                              </button>
                            );
                          })()}
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
                {filteredItems.length === 0 && (
                  <p className="text-xs text-on-surface-variant/50 py-1 pl-1">
                    No {filterTab === "actionable" ? "actionable" : "untagged"} items.
                  </p>
                )}
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
                  <p className={SECTION_LABEL}>Revision Log</p>
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

          {/* Block 5: Ask coordinator (hidden in read-only unless a question exists) */}
          {showAuthorBlocks && !isProficient && (!isReadOnly || coordinatorQuestion) && (
            <div className="space-y-1.5">
              <p className={SECTION_LABEL}>Ask Coordinator</p>

              {!coordinatorQuestion && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Optional question routed to your lead..."
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendQuestion(); }}
                    className={AUTHOR_INPUT}
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleSendQuestion}
                    disabled={!questionInput.trim()}
                  >
                    Send
                  </Button>
                </div>
              )}

              {coordinatorQuestion && !coordinatorQuestion.reply && (
                <div className="bg-surface-container-low rounded-md p-2.5 space-y-1">
                  <p className="text-sm text-on-surface">{coordinatorQuestion.questionText}</p>
                  <p className="text-xs text-on-surface-variant/60">
                    Sent {new Date(coordinatorQuestion.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · Awaiting reply
                  </p>
                  <button
                    className="text-xs text-secondary hover:underline transition-colors"
                    onClick={handleCancelQuestion}
                  >
                    Cancel question
                  </button>
                </div>
              )}

              {coordinatorQuestion?.reply && (
                <div className="space-y-2">
                  <div className="bg-surface-container-low rounded-md p-2.5 space-y-0.5">
                    <p className="text-xs text-on-surface-variant/60">Your question</p>
                    <p className="text-sm text-on-surface">{coordinatorQuestion.questionText}</p>
                    <p className="text-xs text-on-surface-variant/60">
                      {new Date(coordinatorQuestion.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <div className="bg-amber-50/70 rounded-md p-2.5 space-y-0.5">
                    <p className="text-xs text-on-surface-variant/60">Coordinator reply</p>
                    <p className="text-sm text-on-surface">{coordinatorQuestion.reply}</p>
                    {coordinatorQuestion.repliedAt && (
                      <p className="text-xs text-on-surface-variant/60">
                        {new Date(coordinatorQuestion.repliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Follow-up question..."
                      value={questionInput}
                      onChange={(e) => setQuestionInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSendQuestion(); }}
                      className={AUTHOR_INPUT}
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={handleSendQuestion}
                      disabled={!questionInput.trim()}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Block 6: Mark resolved (NI and Mixed only) */}
          {isNI && (
            <div className="pt-3 border-t border-outline-variant/15 space-y-2">
              <div className="flex justify-end items-center gap-3">
                {autoFillActive && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    All actionable items handled
                  </span>
                )}
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
        </div>
      )}
    </div>
  );
}
