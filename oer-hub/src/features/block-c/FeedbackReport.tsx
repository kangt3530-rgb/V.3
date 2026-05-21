import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  IAggregatedCriterionFeedback,
  IAnnotation,
  ICriterionResponse,
  IPerRubricReport,
  RubricTemplateId,
  RevisionStatus,
  CriterionRatingSummary,
} from "../../api/types";
import { getPerRubricReport, getCriterionResponses } from "../../api";
import { clearOerStatusOverride } from "../../api/blockC";
import { useRevisionStore } from "../../store/revisionStore";
import { Button } from "../../components/ui/Button";
import { FilterChips } from "./FilterChips";
import { CriterionSection } from "./CriterionSection";
import { OERPreviewPane } from "./OERPreviewPane";
import { ExportPanel } from "./ExportPanel";
import { AIChatbox } from "../../components/ai/AIChatbox";

// ── Inline outcome dots for the compact header row ────────────────────────────

const DOT_COLOR: Record<CriterionRatingSummary, string> = {
  needs_improvement: "text-amber-500",
  proficient:        "text-emerald-500",
  exceeds:           "text-sky-500",
  mixed:             "text-orange-500",
};

function statusFor(
  c: IAggregatedCriterionFeedback,
  responses: ICriterionResponse[]
): RevisionStatus {
  return responses.find((r) => r.criterionId === c.criterionId)?.status ?? "unresolved";
}

// ── Sticky header ─────────────────────────────────────────────────────────────

function StickyHeader({
  report,
  responses,
  onExportOpen,
  allNiHandled,
  isReadOnly,
  submittedAt,
  onResetDemo,
}: {
  report: IPerRubricReport;
  responses: ICriterionResponse[];
  onExportOpen: () => void;
  allNiHandled: boolean;
  isReadOnly: boolean;
  submittedAt: string | null;
  onResetDemo?: () => void;
}) {
  const criteria = report.criteria;
  const total = criteria.length;
  const niCount = criteria.filter((c) => c.ratingSummary === "needs_improvement").length;
  const exceedsCount = criteria.filter((c) => c.ratingSummary === "exceeds").length;
  const proficientCount = criteria.filter((c) => c.ratingSummary === "proficient").length;
  const attentionCount = criteria.filter(
    (c) =>
      (c.ratingSummary === "needs_improvement" || c.ratingSummary === "mixed") &&
      statusFor(c, responses) === "unresolved"
  ).length;

  return (
    <div className="flex-shrink-0 bg-surface border-b border-outline-variant/20 px-5 py-2 space-y-1.5">
      {/* Row 1: name · dots · summary · CTA · export */}
      <div className="flex items-center gap-2 min-w-0">
        <p className="font-semibold text-sm text-primary shrink-0">{report.rubricName} Review</p>
        <span className="text-outline-variant/60 shrink-0">·</span>
        <span className="flex items-center gap-px shrink-0">
          {criteria.map((c) => (
            <span key={c.criterionId} className={`text-[10px] leading-none ${DOT_COLOR[c.ratingSummary]}`}>
              ●
            </span>
          ))}
        </span>
        <span className="text-xs text-on-surface-variant truncate">
          {proficientCount}/{total} proficient
          {niCount > 0 && <> · {niCount} NI</>}
          {exceedsCount > 0 && <> · {exceedsCount} exceed</>}
        </span>

        {isReadOnly ? (
          <span className="text-xs text-on-surface-variant/60 shrink-0 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">mail</span>
            Submitted for verification
            {submittedAt && (
              <> · {new Date(submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</>
            )}
          </span>
        ) : allNiHandled ? (
          <span className="text-xs text-emerald-600 shrink-0 ml-1 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">check_circle</span>
            All items addressed
          </span>
        ) : attentionCount > 0 ? (
          <span className="text-xs text-amber-600 shrink-0 ml-1">
            {attentionCount} need attention
          </span>
        ) : null}

        <div className="ml-auto shrink-0 flex items-center gap-2">
          {import.meta.env.DEV && onResetDemo && (
            <button onClick={onResetDemo} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              [Reset demo]
            </button>
          )}
          <Button size="sm" variant="ghost" icon="download" onClick={onExportOpen}>Export</Button>
        </div>
      </div>

      {/* Row 2: filter chips */}
      <FilterChips criteria={criteria} responses={responses} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FeedbackReport() {
  const { oerId, rubricId } = useParams<{ oerId: string; rubricId: string }>();

  const [report, setReport] = useState<IPerRubricReport | null>(null);
  const [responses, setResponses] = useState<ICriterionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [aiButtonPulsing, setAiButtonPulsing] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setAiButtonPulsing(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const {
    setContext,
    activeRatingFilters,
    activeStatusFilters,
    collapsedCriteria,
    toggleCriterionCollapse,
    openOerPane,
    openOerPaneOnly,
    closeOerPane,
    oerPaneOpen,
    oerPaneWidth,
    viewingAnnotationId,
    navigateAnnotation,
    reportScrollPending,
    clearReportScroll,
    aiChatOpen,
    toggleAiChat,
    aiChatWidth,
    setAiChatWidth,
    setOerPaneWidth,
  } = useRevisionStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const oerDragging = useRef(false);
  const aiDragging = useRef(false);

  const onDragMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (oerDragging.current) {
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setOerPaneWidth(Math.min(50, Math.max(15, pct)));
    }
    if (aiDragging.current) {
      const pct = ((rect.right - e.clientX) / rect.width) * 100;
      setAiChatWidth(Math.min(40, Math.max(15, pct)));
    }
  }, [setOerPaneWidth, setAiChatWidth]);

  const onDragMouseUp = useCallback(() => {
    oerDragging.current = false;
    aiDragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    document.addEventListener("mousemove", onDragMouseMove);
    document.addEventListener("mouseup", onDragMouseUp);
    return () => {
      document.removeEventListener("mousemove", onDragMouseMove);
      document.removeEventListener("mouseup", onDragMouseUp);
    };
  }, [onDragMouseMove, onDragMouseUp]);

  useEffect(() => {
    if (!oerId || !rubricId) return;
    setContext(oerId, rubricId as RubricTemplateId);
    Promise.all([
      getPerRubricReport(oerId, rubricId as RubricTemplateId),
      getCriterionResponses(oerId, rubricId as RubricTemplateId),
    ]).then(([r, rsp]) => {
      setReport(r);
      setResponses(rsp);
      setLoading(false);
    });
  }, [oerId, rubricId]);

  const allAnnotations = useMemo<IAnnotation[]>(
    () => report?.criteria.flatMap((c) => c.annotations) ?? [],
    [report]
  );

  const allAnnotationIds = useMemo(
    () => allAnnotations.map((a) => a.id),
    [allAnnotations]
  );

  // Scroll report to annotation only when triggered by keyboard navigation
  useEffect(() => {
    if (!viewingAnnotationId || !report || !reportScrollPending) return;
    clearReportScroll();

    const criterion = report.criteria.find((c) =>
      c.annotations.some((a) => a.id === viewingAnnotationId)
    );
    if (!criterion) return;

    if (collapsedCriteria.includes(criterion.criterionId)) {
      toggleCriterionCollapse(criterion.criterionId);
    }

    const t = setTimeout(() => {
      document
        .getElementById(`annotation-${viewingAnnotationId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return () => clearTimeout(t);
  }, [viewingAnnotationId, reportScrollPending, report, collapsedCriteria, toggleCriterionCollapse, clearReportScroll]);

  // Keyboard shortcut: Cmd/Ctrl + . toggles AI chat
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === ".") {
        const tag = (document.activeElement as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        handleToggleAiChat();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [aiChatOpen, exportPanelOpen]);

  // Keyboard navigation for OER pane
  useEffect(() => {
    if (!oerPaneOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { closeOerPane(); return; }
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        navigateAnnotation(e.key === "ArrowDown" ? "next" : "prev", allAnnotationIds);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [oerPaneOpen, allAnnotationIds, closeOerPane, navigateAnnotation]);

  const isReadOnly = report?.oer.status === "pending_verification";

  const unhandledCount = useMemo(() => {
    if (!report) return 0;
    return report.criteria.filter(
      c => (c.ratingSummary === "needs_improvement" || c.ratingSummary === "mixed") &&
        (responses.find(r => r.criterionId === c.criterionId)?.status ?? "unresolved") === "unresolved"
    ).length;
  }, [report, responses]);

  const allNiHandled = unhandledCount === 0 && (report?.criteria.some(
    c => c.ratingSummary === "needs_improvement" || c.ratingSummary === "mixed"
  ) ?? false);

  const visibleCriteria = useMemo<IAggregatedCriterionFeedback[]>(() => {
    if (!report) return [];
    if (!activeRatingFilters.length && !activeStatusFilters.length) return report.criteria;
    return report.criteria.filter((c) => {
      const ratingOk =
        !activeRatingFilters.length ||
        activeRatingFilters.includes(c.ratingSummary as CriterionRatingSummary);
      const resp = responses.find((r) => r.criterionId === c.criterionId);
      const status: RevisionStatus = resp?.status ?? "unresolved";
      const statusOk = !activeStatusFilters.length || activeStatusFilters.includes(status);
      return ratingOk && statusOk;
    });
  }, [report, responses, activeRatingFilters, activeStatusFilters]);

  function handleResetDemo() {
    if (!oerId || !rubricId) return;
    localStorage.removeItem(`oer-hub:block-c:responses:${oerId}:${rubricId}`);
    localStorage.removeItem(`oer-hub:block-c:submission:${oerId}:${rubricId}`);
    localStorage.removeItem("oer-hub:block-c:revision-store");
    clearOerStatusOverride(oerId);
    window.location.reload();
  }

  function handleOpenExport() {
    if (aiChatOpen) toggleAiChat();
    setExportPanelOpen(true);
  }

  function handleToggleAiChat() {
    if (exportPanelOpen) setExportPanelOpen(false);
    toggleAiChat();
  }

  function handleResponseSaved(saved: ICriterionResponse) {
    setResponses((prev) => {
      const idx = prev.findIndex((r) => r.criterionId === saved.criterionId);
      return idx >= 0 ? prev.map((r, i) => (i === idx ? saved : r)) : [...prev, saved];
    });
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center pt-16">
        <p className="text-on-surface-variant animate-pulse">Loading feedback…</p>
      </div>
    );
  }

  if (!report || !report.releasedToAuthor) {
    return (
      <div className="h-full flex items-center justify-center pt-16">
        <p className="text-on-surface-variant">This review is not yet available.</p>
      </div>
    );
  }

  // Read submission date if submitted
  const submittedAt = isReadOnly
    ? (() => {
        try {
          const raw = localStorage.getItem(
            `oer-hub:block-c:submission:${oerId}:${rubricId}`
          );
          return raw ? (JSON.parse(raw) as { submittedAt?: string }).submittedAt ?? null : null;
        } catch {
          return null;
        }
      })()
    : null;

  const submitUrl = `/reports/${oerId}/${rubricId}/submit`;
  const effectiveOerWidth = oerPaneOpen && aiChatOpen ? Math.min(oerPaneWidth, 25) : oerPaneWidth;

  return (
    <div ref={containerRef} className="h-full flex overflow-hidden pt-16">

      {/* Left: OER pane or thin rail */}
      {oerPaneOpen ? (
        <div className="flex-shrink-0 h-full overflow-hidden" style={{ width: `${effectiveOerWidth}%` }}>
          <OERPreviewPane
            annotations={allAnnotations}
            criteria={report.criteria}
            oerType={report.oer.oerType}
            oerSource={report.oer.oerSource}
          />
        </div>
      ) : (
        <div
          className="group flex-shrink-0 w-6 bg-stone-50 border-r border-outline-variant/15 flex items-start justify-center pt-4 cursor-pointer hover:bg-stone-100 transition-colors"
          title="Open OER viewer"
          onClick={openOerPaneOnly}
        >
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 group-hover:text-on-surface-variant/70 transition-colors">
            dock_to_right
          </span>
        </div>
      )}

      {/* OER drag handle */}
      {oerPaneOpen && (
        <div
          className="relative group flex-shrink-0 w-1.5 cursor-col-resize select-none z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            oerDragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-outline-variant/20 group-hover:bg-secondary/50 transition-colors duration-150" />
          </div>
        </div>
      )}

      {/* Center: Report (always flex-1) */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <StickyHeader
          report={report}
          responses={responses}
          onExportOpen={handleOpenExport}
          allNiHandled={allNiHandled}
          isReadOnly={isReadOnly ?? false}
          submittedAt={submittedAt}
          onResetDemo={handleResetDemo}
        />
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-5xl mx-auto space-y-4">
            {visibleCriteria.map((c) => (
              <CriterionSection
                key={c.criterionId}
                criterion={c}
                response={responses.find((r) => r.criterionId === c.criterionId) ?? null}
                rubricName={report.rubricName}
                isCollapsed={collapsedCriteria.includes(c.criterionId)}
                onToggleCollapse={() => toggleCriterionCollapse(c.criterionId)}
                onViewAnnotation={(id) => openOerPane(id)}
                onResponseSaved={handleResponseSaved}
                isReadOnly={isReadOnly ?? false}
              />
            ))}
            {visibleCriteria.length === 0 && (
              <p className="text-on-surface-variant text-center py-16">
                No criteria match the active filters.
              </p>
            )}

            {/* Bottom submit section */}
            {!isReadOnly && (
              <div className="pt-8 pb-4 flex flex-col items-center gap-4">
                {allNiHandled ? (
                  <>
                    <p className="text-sm text-emerald-600 flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      All items have been addressed
                    </p>
                    <Link
                      to={submitUrl}
                      className="w-full max-w-sm flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                    >
                      Submit for verification
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </>
                ) : (
                  <p className="text-sm text-on-surface-variant/60 text-center">
                    {unhandledCount} item{unhandledCount === 1 ? "" : "s"} still need your attention before you can submit.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI drag handle */}
      {aiChatOpen && (
        <div
          className="relative group flex-shrink-0 w-1.5 cursor-col-resize select-none z-10"
          onMouseDown={(e) => {
            e.preventDefault();
            aiDragging.current = true;
            document.body.style.cursor = "col-resize";
            document.body.style.userSelect = "none";
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-px h-full bg-outline-variant/20 group-hover:bg-secondary/50 transition-colors duration-150" />
          </div>
        </div>
      )}

      {/* Right: AI pane */}
      {aiChatOpen && (
        <div
          className="flex-shrink-0 h-full overflow-hidden"
          style={{ width: `${aiChatWidth}%`, animation: "slideInRight 200ms ease-out" }}
        >
          <AIChatbox
            report={report}
            responses={responses}
            onClose={handleToggleAiChat}
          />
        </div>
      )}

      {/* Export panel overlay */}
      {exportPanelOpen && (
        <ExportPanel
          report={report}
          responses={responses}
          onClose={() => setExportPanelOpen(false)}
        />
      )}

      {/* Floating AI trigger button */}
      {!aiChatOpen && (
        <button
          onClick={handleToggleAiChat}
          title="AI Assistant (⌘.)"
          className={`fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 hover:shadow-xl hover:scale-105 transition-all duration-150 flex items-center justify-center print-hidden${aiButtonPulsing ? " animate-pulse" : ""}`}
        >
          <span className="material-symbols-outlined text-[22px]">smart_toy</span>
        </button>
      )}

    </div>
  );
}
