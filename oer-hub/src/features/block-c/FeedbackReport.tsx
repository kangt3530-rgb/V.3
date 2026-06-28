import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type {
  IAggregatedCriterionFeedback,
  IAnnotation,
  IAuthorItemResponse,
  ICriterionResponse,
  IPerRubricReport,
  RubricTemplateId,
  RevisionStatus,
  CriterionRatingSummary,
} from "../../api/types";
import { getPerRubricReport, getCriterionResponses, getItemResponses, upsertItemResponse } from "../../api";
import { clearOerStatusOverride } from "../../api/blockC";
import { useRevisionStore } from "../../store/revisionStore";
import { Button } from "../../components/ui/Button";
import { ReviewSummaryPanel as _ReviewSummaryPanel } from '../../components/ui/ReviewSummaryPanel';
import { TabBar } from '../../components/ui/TabBar';
import { FilterChips } from "./FilterChips";
import { CriterionSection } from "./CriterionSection";
import { ReviewerGeneralComments } from "./ReviewerGeneralComments";
import { OERPreviewPane } from "./OERPreviewPane";
import { ExportPanel } from "./ExportPanel";
import { ActionListView } from "./ActionListView";

// ── Rating dot colors & criterion nav ─────────────────────────────────────────

const DOT_COLOR: Record<CriterionRatingSummary, string> = {
  needs_improvement: "#ba1a1a",
  proficient:        "#735c00",
  exceeds:           "#1a5c3a",
  mixed:             "#ba1a1a",
};

const DOT_TITLE: Record<CriterionRatingSummary, string> = {
  needs_improvement: "Does Not Meet",
  proficient:        "Exemplifies",
  exceeds:           "Exceeds",
  mixed:             "Mixed",
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
  activeView,
  onViewChange,
  onScrollToCriterion,
}: {
  report: IPerRubricReport;
  responses: ICriterionResponse[];
  onExportOpen: () => void;
  allNiHandled: boolean;
  isReadOnly: boolean;
  submittedAt: string | null;
  onResetDemo?: () => void;
  activeView: "report" | "action_list";
  onViewChange: (v: "report" | "action_list") => void;
  onScrollToCriterion: (criterionId: string) => void;
}) {
  const criteria = report.criteria;
  const total = criteria.length;
  const niCount = criteria.filter((c) => c.ratingSummary === "needs_improvement" || c.ratingSummary === "mixed").length;
  const exceedsCount = criteria.filter((c) => c.ratingSummary === "exceeds").length;
  const proficientCount = criteria.filter((c) => c.ratingSummary === "proficient").length;
  const attentionCount = criteria.filter(
    (c) =>
      (c.ratingSummary === "needs_improvement" || c.ratingSummary === "mixed") &&
      statusFor(c, responses) === "unresolved"
  ).length;

  return (
    <div className="flex-shrink-0 bg-surface border-b border-outline-variant/20 px-5 py-2 space-y-1.5">
      {/* Row 1: rubric name · counts · status · view toggle · export */}
      <div className="flex items-center gap-2 min-w-0">
        <p className="font-semibold text-sm text-primary shrink-0">{report.rubricName} Review</p>
        <span className="text-outline-variant/60 shrink-0">·</span>
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
          <span className="text-xs font-semibold shrink-0 ml-1" style={{ color: "var(--color-rating-dnm-text)" }}>
            {attentionCount} need attention
          </span>
        ) : null}

        <div className="ml-auto shrink-0 flex items-center gap-2">
          <TabBar
            tabs={[
              { id: 'report', label: 'Report' },
              { id: 'action_list', label: 'Action list' },
            ]}
            activeId={activeView}
            onChange={(id) => onViewChange(id as 'report' | 'action_list')}
            className="border-none bg-transparent"
          />
          {import.meta.env.DEV && onResetDemo && (
            <button onClick={onResetDemo} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              [Reset demo]
            </button>
          )}
          <Button size="sm" variant="secondary" icon="download" onClick={onExportOpen}>Export</Button>
        </div>
      </div>

      {/* Row 2: filter chips */}
      <FilterChips criteria={criteria} responses={responses} />

      {/* Row 3: criteria navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {criteria.map((c, i) => (
          <button
            key={c.criterionId}
            onClick={() => onScrollToCriterion(c.criterionId)}
            title={`${c.criterionTitle} — ${DOT_TITLE[c.ratingSummary]}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-on-surface-variant/70 hover:bg-surface-container-high hover:text-primary transition-colors shrink-0 whitespace-nowrap"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: DOT_COLOR[c.ratingSummary] }}
            />
            <span className="font-mono font-semibold text-[10px]">{c.criterionId}</span>
            <span className="hidden sm:inline truncate max-w-[120px]">{c.criterionTitle}</span>
            {i < criteria.length - 1 && <span className="text-outline-variant/30 ml-1">·</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FeedbackReport() {
  const { oerId, rubricId } = useParams<{ oerId: string; rubricId: string }>();

  const [report, setReport] = useState<IPerRubricReport | null>(null);
  const [responses, setResponses] = useState<ICriterionResponse[]>([]);
  const [itemResponses, setItemResponses] = useState<IAuthorItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [activeView, setActiveView] = useState<"report" | "action_list">("report");

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
    setOerPaneWidth,
  } = useRevisionStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const oerDragging = useRef(false);

  const onDragMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (oerDragging.current) {
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setOerPaneWidth(Math.min(50, Math.max(15, pct)));
    }
  }, [setOerPaneWidth]);

  const onDragMouseUp = useCallback(() => {
    oerDragging.current = false;
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
      getItemResponses(oerId, rubricId as RubricTemplateId),
    ]).then(([r, rsp, ir]) => {
      setReport(r);
      setResponses(rsp);
      setItemResponses(ir);
      setLoading(false);
    }).catch(() => {
      setError(true);
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

  function handleScrollToCriterion(criterionId: string) {
    if (collapsedCriteria.includes(criterionId)) toggleCriterionCollapse(criterionId);
    setTimeout(() => {
      document.getElementById(`criterion-${criterionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

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
    // Also clear the reviewer session so the new demo seed data is used on reload
    localStorage.removeItem("oer-hub:session:v3:task-001");
    clearOerStatusOverride(oerId);
    window.location.reload();
  }

  function handleOpenExport() {
    setExportPanelOpen(true);
  }

  function handleResponseSaved(saved: ICriterionResponse) {
    setResponses((prev) => {
      const idx = prev.findIndex((r) => r.criterionId === saved.criterionId);
      return idx >= 0 ? prev.map((r, i) => (i === idx ? saved : r)) : [...prev, saved];
    });
  }

  function handleItemResponseSaved(saved: IAuthorItemResponse) {
    upsertItemResponse(saved);
    setItemResponses((prev) => {
      const idx = prev.findIndex((r) => r.annotationId === saved.annotationId);
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

  if (error) {
    return (
      <div className="h-full flex items-center justify-center pt-16">
        <p className="text-on-surface-variant">Could not load this review. Try refreshing the page.</p>
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
  const effectiveOerWidth = oerPaneWidth;

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
          activeView={activeView}
          onViewChange={setActiveView}
          onScrollToCriterion={handleScrollToCriterion}
        />
        {activeView === "action_list" ? (
          <ActionListView
            report={report}
            itemResponses={itemResponses}
            onItemResponseSaved={handleItemResponseSaved}
            onOpenInReport={(criterionId, annotationId) => {
              setActiveView("report");
              if (collapsedCriteria.includes(criterionId)) toggleCriterionCollapse(criterionId);
              setTimeout(() => {
                document.getElementById(`annotation-${annotationId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }, 150);
            }}
          />
        ) : (
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="max-w-5xl mx-auto space-y-4">
            <ReviewerGeneralComments
              freeNotes={report.freeNotes}
              oerId={report.oer.id}
              rubricTemplateId={report.rubricTemplateId}
              itemResponses={itemResponses}
              onItemResponseSaved={handleItemResponseSaved}
            />
            {visibleCriteria.map((c) => (
              <CriterionSection
                key={c.criterionId}
                criterion={c}
                freeNotes={report.freeNotes}
                response={responses.find((r) => r.criterionId === c.criterionId) ?? null}
                rubricName={report.rubricName}
                isCollapsed={collapsedCriteria.includes(c.criterionId)}
                onToggleCollapse={() => toggleCriterionCollapse(c.criterionId)}
                onViewAnnotation={(id) => openOerPane(id)}
                onResponseSaved={handleResponseSaved}
                itemResponses={itemResponses}
                onItemResponseSaved={handleItemResponseSaved}
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
        )}
      </div>

      {/* Export panel overlay */}
      {exportPanelOpen && (
        <ExportPanel
          report={report}
          responses={responses}
          onClose={() => setExportPanelOpen(false)}
        />
      )}

    </div>
  );
}
