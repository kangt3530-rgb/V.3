import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
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
import { useRevisionStore } from "../../store/revisionStore";
import { Button } from "../../components/ui/Button";
import { ControlledSplitPane } from "../../components/layout/ControlledSplitPane";
import { FilterChips } from "./FilterChips";
import { CriterionSection } from "./CriterionSection";
import { OERPreviewPane } from "./OERPreviewPane";

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

// ── Sticky header — 2 compact rows, ~88px total ───────────────────────────────

function StickyHeader({
  report,
  responses,
}: {
  report: IPerRubricReport;
  responses: ICriterionResponse[];
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
      {/* Row 1: name · dots · summary · attention · export */}
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
        {attentionCount > 0 && (
          <span className="text-xs text-amber-600 shrink-0 ml-1">
            {attentionCount} need attention
          </span>
        )}
        <div className="ml-auto shrink-0">
          <Button size="sm" variant="ghost" icon="download">Export</Button>
        </div>
      </div>

      {/* Row 2: filter chips (all inline) */}
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
  } = useRevisionStore();

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

  // Scroll report to annotation when viewingAnnotationId changes (e.g. via OER click)
  const prevViewingRef = useRef<string | null>(null);
  useEffect(() => {
    if (!viewingAnnotationId || !report) return;
    if (viewingAnnotationId === prevViewingRef.current) return;
    prevViewingRef.current = viewingAnnotationId;

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
  }, [viewingAnnotationId, report, collapsedCriteria, toggleCriterionCollapse]);

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

  // Center pane — shared between open and closed layouts
  const centerPane = (
    <div className="flex flex-col overflow-hidden h-full min-w-0">
      <StickyHeader report={report} responses={responses} />
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
            />
          ))}

          {visibleCriteria.length === 0 && (
            <p className="text-on-surface-variant text-center py-16">
              No criteria match the active filters.
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex overflow-hidden pt-16">

      {oerPaneOpen ? (
        <div className="flex-1 min-w-0 overflow-hidden">
          <ControlledSplitPane
            initialRatio={oerPaneWidth / 100}
            left={
              <OERPreviewPane
                annotations={allAnnotations}
                criteria={report.criteria}
                oerType={report.oer.oerType}
                oerSource={report.oer.oerSource}
              />
            }
            right={centerPane}
          />
        </div>
      ) : (
        <>
          {/* Thin left rail — click opens to first annotation */}
          <div
            className="group flex-shrink-0 w-6 bg-stone-50 border-r border-outline-variant/15 flex items-start justify-center pt-4 cursor-pointer hover:bg-stone-100 transition-colors"
            title="Open OER viewer"
            onClick={() => openOerPaneOnly()}
          >
            <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 group-hover:text-on-surface-variant/70 transition-colors">
              dock_to_right
            </span>
          </div>
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {centerPane}
          </div>
        </>
      )}

      {/* Right rail — AI chat placeholder (Phase 5) */}
      <div
        className="group flex-shrink-0 w-6 bg-stone-50 border-l border-outline-variant/15 flex items-start justify-center pt-4 cursor-pointer hover:bg-stone-100 transition-colors"
        title="AI assistant — coming in Phase 5"
      >
        <span className="material-symbols-outlined text-[14px] text-on-surface-variant/40 group-hover:text-on-surface-variant/70 transition-colors">
          smart_toy
        </span>
      </div>
    </div>
  );
}
