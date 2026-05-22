import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getTask,
  getRubricTemplate,
  loadSession,
  hasPreambleBeenSeen,
  submitReviewToMediation,
} from "../../api";
import { useReviewStore } from "../../store/reviewStore";
import { useAIPrefsStore } from "../../store/aiPrefsStore";
import { useAutoSave } from "../../hooks/useAutoSave";
import { ResizableSplitPane } from "../../components/layout/ResizableSplitPane";
import { OERRenderer } from "./OERPane/OERRenderer";
import { RubricPanel } from "./RubricPane/RubricPanel";
import { PreambleModal } from "./RubricPane/PreambleModal";
import { GapCheckModal } from "./RubricPane/GapCheckModal";
import { AIChatbox } from "./AIPane/AIChatbox";
import { detectGaps } from "../../lib/gapCheck";
import type { GapItem } from "../../lib/gapCheck";
import { computeR13Findings } from "../../hooks/useR13ConsistencyCheck";
import type { R13Finding } from "../../api/ai";
import type { IRubricTemplate, IAnnotation, ITask } from "../../api/types";
import { layout } from "../../design/tokens";
import { getRubricTermSet, getRubricFullText } from "../../data/rubricGlossaryLookup";

export function ReviewerConsole() {
  const { taskId = "task-001" } = useParams();
  const navigate = useNavigate();

  const [task, setTask]               = useState<ITask | null>(null);
  const [rubricTemplate, setRubricTemplate] = useState<IRubricTemplate | null>(null);
  const [showPreamble, setShowPreamble]     = useState(false);
  const [loading, setLoading]              = useState(true);
  const [isSubmitting, setIsSubmitting]    = useState(false);
  const [activeAnnotationId, setActiveAnnotationId] = useState<string | null>(null);

  // R8 gap-check modal state
  const [gapItems, setGapItems]           = useState<GapItem[]>([]);
  const [showGapModal, setShowGapModal]   = useState(false);
  const [criterionFlaggedFields, setCriterionFlaggedFields] =
    useState<Record<string, string[]>>({});

  // R13 consistency check state
  const [r13Findings, setR13Findings] = useState<R13Finding[]>([]);

  const initSession      = useReviewStore((s) => s.initSession);
  const resetSession     = useReviewStore((s) => s.resetSession);
  const setSplitRatio    = useReviewStore((s) => s.setSplitRatio);
  const setStatus        = useReviewStore((s) => s.setStatus);
  const persistSessionNow = useReviewStore((s) => s.persistSessionNow);
  const setRubricContext = useReviewStore((s) => s.setRubricContext);
  const r13Prefs         = useReviewStore((s) => s.aiPreferences.r13);

  // Mount: load task + rubric + restore draft
  useEffect(() => {
    async function init() {
      try {
        const t = await getTask(taskId);
        if (!t) { navigate("/reviewer"); return; }
        setTask(t);

        const tmpl = await getRubricTemplate(t.rubricTemplateId);
        setRubricTemplate(tmpl);
        setRubricContext(
          getRubricTermSet(t.rubricTemplateId),
          getRubricFullText(t.rubricTemplateId)
        );

        // Restore draft or start fresh.
        // Always override OER metadata from the live task — oerType/oerSource
        // are properties of the resource, not the reviewer's saved work.
        const saved = loadSession(taskId);
        if (saved) {
          initSession({
            ...saved,
            oerType:  t.oer.oerType,
            oerSource: t.oer.oerSource,
          });
        } else {
          resetSession({
            taskId,
            oerId:            t.oerId,
            oerType:          t.oer.oerType,
            oerSource:        t.oer.oerSource,
            rubricTemplateId: t.rubricTemplateId,
          });
        }

        // Preamble check
        if (!hasPreambleBeenSeen(t.rubricTemplateId)) {
          setShowPreamble(true);
        }
      } catch (err) {
        console.error("[ReviewerConsole] Failed to load task:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [taskId, navigate, initSession, resetSession, setRubricContext]);

  // Auto-save on every store mutation
  useAutoSave();

  // Adaptive layout: focus on rubric panel → 5:5 split
  function handleRubricFocus() {
    setSplitRatio(layout.focusSplit);
  }

  // Bi-directional navigation: evidence click → highlight in OER
  function handleEvidenceClick(annotation: IAnnotation) {
    setActiveAnnotationId(annotation.id);
    // Scroll the OER pane if PDF; for web iframe this is best-effort
    setTimeout(() => setActiveAnnotationId(null), 2000);
  }

  async function doSubmit() {
    setIsSubmitting(true);
    setStatus("submitted");
    persistSessionNow();
    const s = useReviewStore.getState();
    await submitReviewToMediation({
      taskId:           s.taskId,
      oerId:            s.oerId,
      oerType:          s.oerType,
      oerSource:        s.oerSource,
      rubricTemplateId: s.rubricTemplateId,
      annotations:      s.annotations,
      ratings:          s.ratings,
      splitRatio:       s.splitRatio,
      oerScrollY:       s.oerScrollY,
      lastSaved:        new Date().toISOString(),
      status:           "submitted",
    });
    await new Promise((r) => setTimeout(r, 400));
    navigate("/reviewer");
  }

  function handleSubmit() {
    const s = useReviewStore.getState();
    const gaps = detectGaps(rubricTemplate!.criteria, s.ratings, s.annotations);
    const r13Enabled = useAIPrefsStore.getState().isNudgeEnabled(s.rubricTemplateId, "consistency_check");
    const findings = r13Enabled
      ? computeR13Findings(rubricTemplate!, s.ratings, s.annotations)
      : [];

    if (gaps.length > 0 || findings.length > 0) {
      setGapItems(gaps);
      setR13Findings(findings);
      setShowGapModal(true);
      return;
    }
    setCriterionFlaggedFields({});
    doSubmit();
  }

  function handleGapProceed() {
    setShowGapModal(false);
    setR13Findings([]);
    setCriterionFlaggedFields({});
    doSubmit();
  }

  function handleGapReturnToEdit(allGaps: GapItem[], firstUnacknowledgedCriterionId: string | undefined) {
    setShowGapModal(false);
    setR13Findings([]);

    // Apply red borders to every flagged field across all gap items
    const map: Record<string, string[]> = {};
    for (const gap of allGaps) {
      if (!map[gap.criterionId]) map[gap.criterionId] = [];
      if (!map[gap.criterionId].includes(gap.fieldRef)) {
        map[gap.criterionId].push(gap.fieldRef);
      }
    }
    setCriterionFlaggedFields(map);

    // Scroll the rubric panel to the first unacknowledged criterion
    if (firstUnacknowledgedCriterionId) {
      setTimeout(() => {
        const el = document.querySelector(
          `[data-criterion-id="${firstUnacknowledgedCriterionId}"]`
        );
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  }

  const submitLabel = isSubmitting ? "Submitting…" : "Submit Review";

  if (loading) return <LoadingShell />;
  if (!task || !rubricTemplate) return null;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-surface pt-16">
      {/* Console header bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-surface-container-low border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/reviewer")}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span className="text-label-md font-label uppercase tracking-widest">Task Center</span>
          </button>
          <div className="w-px h-4 bg-outline-variant/30" />
          <div>
            <p className="text-label-sm font-label font-semibold uppercase tracking-widest text-secondary">
              {rubricTemplate.name} Review
            </p>
            <p className="font-headline text-title-md text-primary leading-tight">
              {task.oer.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-label-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
              cloud_done
            </span>
            <span className="font-label uppercase tracking-widest">Draft</span>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/reports/${task.oer.id}`)}
            className="text-label-sm font-label font-semibold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Preview author report
          </button>
        </div>
      </div>

      {/* Main split-pane workspace + AI panel */}
      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-hidden relative min-w-0">
          <ResizableSplitPane
            left={
              <OERRenderer
                rubricTemplate={rubricTemplate}
                activeAnnotationId={activeAnnotationId}
              />
            }
            right={
              <RubricPanel
                template={rubricTemplate}
                activeAnnotationId={activeAnnotationId}
                onEvidenceClick={handleEvidenceClick}
                onRubricFocus={handleRubricFocus}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                submitLabel={submitLabel}
                criterionFlaggedFields={criterionFlaggedFields}
              />
            }
          />
        </div>
        <AIChatbox />
      </div>

      {/* Preamble modal — shown on first visit */}
      {showPreamble && rubricTemplate && (
        <PreambleModal
          template={rubricTemplate}
          onProceed={() => setShowPreamble(false)}
        />
      )}

      {/* R8 + R13 pre-submit modal — intercepts submission when gaps or consistency findings exist */}
      {showGapModal && (
        <GapCheckModal
          gapItems={gapItems}
          r13Findings={r13Findings}
          r13Prefs={r13Prefs}
          onProceed={handleGapProceed}
          onReturnToEdit={handleGapReturnToEdit}
        />
      )}
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="h-full flex flex-col pt-16 bg-surface">
      <div className="flex-shrink-0 h-14 bg-surface-container-low animate-pulse" />
      <div className="flex-1 flex">
        <div className="w-[65%] bg-surface-container-low animate-pulse" />
        <div className="w-[35%] bg-surface-container animate-pulse" />
      </div>
    </div>
  );
}
